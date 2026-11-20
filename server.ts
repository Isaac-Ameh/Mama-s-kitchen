import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { clerkMiddleware, createClerkClient } from '@clerk/express';
import {
  type AuthenticatedRequest,
  VALID_MEAL_IDS,
  getPaystackSecretKey,
  getServerClerkKeys,
  isResourceOwner,
  isServerClerkConfigured,
  isServerPaystackConfigured,
  requireAuthenticatedSession,
  requirePermission,
} from './server/authorization.ts';
import { SERVER_MEAL_CATALOG } from './server/catalog.ts';

interface StoredCartEntry {
  mealId: string;
  quantity: number;
}

interface UserCartRecord {
  ownerId: string;
  items: StoredCartEntry[];
  updatedAt: string;
}

interface OrderLineItem {
  mealId: string;
  name: string;
  unitPriceNaira: number;
  quantity: number;
  lineTotalNaira: number;
}

interface OrderRecord {
  reference: string;
  ownerId: string;
  email: string;
  items: OrderLineItem[];
  totalNaira: number;
  expectedAmountKobo: number;
  status: 'pending' | 'paid';
  channel?: string;
  paidAt?: string;
  createdAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

// Trust proxy headers in preview/Cloud Run environments
app.set('trust proxy', 1);
app.use(express.json({ limit: '64kb' }));

const { publishableKey: serverPublishableKey, secretKey: serverSecretKey } =
  getServerClerkKeys();

const serverClerkClient = isServerClerkConfigured()
  ? createClerkClient({
      publishableKey: serverPublishableKey,
      secretKey: serverSecretKey,
    })
  : null;

if (isServerClerkConfigured()) {
  app.use(
    '/api',
    clerkMiddleware({
      publishableKey: serverPublishableKey,
      secretKey: serverSecretKey,
    })
  );
}

// Per-user server-side cart and order stores (scoped strictly by verified Clerk userId)
const userCarts = new Map<string, UserCartRecord>();
const ordersByReference = new Map<string, OrderRecord>();

function sanitizeCartItems(rawItems: unknown): StoredCartEntry[] | null {
  if (!Array.isArray(rawItems) || rawItems.length > 50) {
    return null;
  }
  const sanitized: StoredCartEntry[] = [];
  for (const entry of rawItems) {
    if (
      !entry ||
      typeof entry.mealId !== 'string' ||
      !VALID_MEAL_IDS.has(entry.mealId) ||
      !Number.isInteger(entry.quantity) ||
      entry.quantity < 1 ||
      entry.quantity > 99
    ) {
      return null;
    }
    sanitized.push({ mealId: entry.mealId, quantity: entry.quantity });
  }
  return sanitized;
}

// Public health check (never exposes secrets)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    clerkConfigured: isServerClerkConfigured(),
    paystackConfigured: isServerPaystackConfigured(),
  });
});

// Protected identity & application authorization endpoint
app.get(
  '/api/me',
  requireAuthenticatedSession,
  requirePermission('account:read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const appAuth = req.appAuth!;
      if (!serverClerkClient) {
        res.status(503).json({ error: 'Authentication client unavailable.' });
        return;
      }
      const user = await serverClerkClient.users.getUser(appAuth.userId);
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null;

      res.json({
        identity: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          email: primaryEmail,
          imageUrl: user.imageUrl,
          orgId: appAuth.orgId,
        },
        authorization: {
          role: appAuth.policy.role,
          permissions: appAuth.policy.permissions,
        },
      });
    } catch (error) {
      console.error('Failed to retrieve Clerk user identity:', error);
      res.status(500).json({ error: 'Unable to retrieve authenticated user profile.' });
    }
  }
);

// Protected cart read endpoint
app.get(
  '/api/cart',
  requireAuthenticatedSession,
  requirePermission('cart:read'),
  (req: AuthenticatedRequest, res) => {
    const userId = req.appAuth!.userId;
    const record = userCarts.get(userId);

    if (record && !isResourceOwner(userId, record.ownerId)) {
      res.status(403).json({ error: 'Forbidden: cannot access another user cart.' });
      return;
    }

    res.json({
      items: record?.items ?? [],
      updatedAt: record?.updatedAt ?? null,
    });
  }
);

// Protected cart update endpoint with strict validation
app.put(
  '/api/cart',
  requireAuthenticatedSession,
  requirePermission('cart:write'),
  (req: AuthenticatedRequest, res) => {
    const userId = req.appAuth!.userId;
    const sanitized = sanitizeCartItems(req.body?.items);

    if (!sanitized) {
      res.status(400).json({ error: 'Invalid cart payload or meal quantity.' });
      return;
    }

    const existing = userCarts.get(userId);
    if (existing && !isResourceOwner(userId, existing.ownerId)) {
      res.status(403).json({ error: 'Forbidden: cannot modify another user cart.' });
      return;
    }

    const updated: UserCartRecord = {
      ownerId: userId,
      items: sanitized,
      updatedAt: new Date().toISOString(),
    };
    userCarts.set(userId, updated);

    res.json({
      items: updated.items,
      updatedAt: updated.updatedAt,
    });
  }
);

// Protected cart clear endpoint
app.delete(
  '/api/cart',
  requireAuthenticatedSession,
  requirePermission('cart:write'),
  (req: AuthenticatedRequest, res) => {
    const userId = req.appAuth!.userId;
    userCarts.delete(userId);
    res.json({ items: [], updatedAt: new Date().toISOString() });
  }
);

// Protected Paystack payment initialization (computes authoritative amount on server)
app.post(
  '/api/payments/paystack/initialize',
  requireAuthenticatedSession,
  requirePermission('cart:write'),
  async (req: AuthenticatedRequest, res) => {
    if (!isServerPaystackConfigured()) {
      res.status(503).json({
        error:
          'Paystack is not configured on the server yet. Please add PAYSTACK_SECRET_KEY in Secrets.',
      });
      return;
    }

    if (!serverClerkClient) {
      res.status(503).json({ error: 'Authentication client unavailable.' });
      return;
    }

    try {
      const userId = req.appAuth!.userId;
      let cartItems: StoredCartEntry[] | undefined;

      if (req.body?.items !== undefined) {
        const sanitized = sanitizeCartItems(req.body.items);
        if (!sanitized) {
          res.status(400).json({ error: 'Invalid cart items supplied for checkout.' });
          return;
        }
        cartItems = sanitized;
        userCarts.set(userId, {
          ownerId: userId,
          items: sanitized,
          updatedAt: new Date().toISOString(),
        });
      } else {
        cartItems = userCarts.get(userId)?.items;
      }

      if (!cartItems || cartItems.length === 0) {
        res.status(400).json({ error: 'Your cart is empty.' });
        return;
      }

      const lineItems: OrderLineItem[] = [];
      let totalNaira = 0;

      for (const entry of cartItems) {
        const catalogItem = SERVER_MEAL_CATALOG[entry.mealId];
        if (!catalogItem) {
          res.status(400).json({ error: 'Unknown meal in cart.' });
          return;
        }
        const lineTotalNaira = catalogItem.priceNaira * entry.quantity;
        totalNaira += lineTotalNaira;
        lineItems.push({
          mealId: catalogItem.id,
          name: catalogItem.name,
          unitPriceNaira: catalogItem.priceNaira,
          quantity: entry.quantity,
          lineTotalNaira,
        });
      }

      const expectedAmountKobo = totalNaira * 100;
      const user = await serverClerkClient.users.getUser(userId);
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null;

      if (!primaryEmail) {
        res.status(400).json({
          error: 'An email address on your account is required for Paystack checkout.',
        });
        return;
      }

      const reference = `MK-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const forwardedHost = req.get('x-forwarded-host') || req.get('host');
      const forwardedProto = req.get('x-forwarded-proto') || req.protocol || 'https';
      const configuredAppUrl = process.env.APP_URL?.trim().replace(/\/+$/, '');
      const callbackUrl = configuredAppUrl
        ? `${configuredAppUrl}/cart`
        : forwardedHost
        ? `${forwardedProto}://${forwardedHost}/cart`
        : undefined;

      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getPaystackSecretKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: primaryEmail,
          amount: expectedAmountKobo,
          currency: 'NGN',
          reference,
          ...(callbackUrl ? { callback_url: callbackUrl } : {}),
          metadata: {
            userId,
            itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
          },
        }),
      });

      const paystackRaw = await paystackRes.text();
      let paystackJson: {
        status?: boolean;
        message?: string;
        data?: {
          authorization_url?: string;
          access_code?: string;
          reference?: string;
        };
      } = {};
      try {
        paystackJson = JSON.parse(paystackRaw);
      } catch {
        res.status(502).json({
          error: 'Paystack returned an unexpected non-JSON response during initialization.',
        });
        return;
      }

      if (!paystackRes.ok || !paystackJson.status || !paystackJson.data?.access_code) {
        res.status(502).json({
          error: paystackJson.message || 'Failed to initialize Paystack transaction.',
        });
        return;
      }

      ordersByReference.set(reference, {
        reference,
        ownerId: userId,
        email: primaryEmail,
        items: lineItems,
        totalNaira,
        expectedAmountKobo,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      res.json({
        reference,
        access_code: paystackJson.data.access_code,
        authorization_url: paystackJson.data.authorization_url,
        amountNaira: totalNaira,
        amountKobo: expectedAmountKobo,
      });
    } catch (error) {
      console.error('Paystack initialization failed:', error);
      res.status(500).json({ error: 'Unable to initialize payment right now.' });
    }
  }
);

// Protected Paystack payment verification
app.get(
  '/api/payments/paystack/verify/:reference',
  requireAuthenticatedSession,
  requirePermission('cart:write'),
  async (req: AuthenticatedRequest, res) => {
    if (!isServerPaystackConfigured()) {
      res.status(503).json({
        error: 'Paystack is not configured on the server yet.',
      });
      return;
    }

    const reference = req.params.reference;
    if (!reference || !/^MK-[A-Za-z0-9_-]{6,64}$/.test(reference)) {
      res.status(400).json({ error: 'Invalid payment reference.' });
      return;
    }

    const userId = req.appAuth!.userId;
    const order = ordersByReference.get(reference);

    if (!order) {
      res.status(404).json({ error: 'Order reference not found.' });
      return;
    }

    if (!isResourceOwner(userId, order.ownerId)) {
      res.status(403).json({ error: 'Forbidden: cannot verify another user order.' });
      return;
    }

    if (order.status === 'paid') {
      res.json({
        verified: true,
        receipt: {
          reference: order.reference,
          totalNaira: order.totalNaira,
          items: order.items,
          paidAt: order.paidAt,
          channel: order.channel ?? 'card',
        },
      });
      return;
    }

    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${getPaystackSecretKey()}`,
          },
        }
      );

      const verifyRaw = await verifyRes.text();
      let verifyJson: {
        status?: boolean;
        message?: string;
        data?: {
          status?: string;
          currency?: string;
          amount?: number;
          reference?: string;
          paid_at?: string;
          channel?: string;
        };
      } = {};
      try {
        verifyJson = JSON.parse(verifyRaw);
      } catch {
        res.status(502).json({
          verified: false,
          error: 'Paystack returned an unexpected non-JSON response during verification.',
        });
        return;
      }

      const tx = verifyJson.data;
      if (
        !verifyRes.ok ||
        !verifyJson.status ||
        !tx ||
        tx.status !== 'success' ||
        tx.currency !== 'NGN' ||
        Number(tx.amount) < order.expectedAmountKobo ||
        tx.reference !== reference
      ) {
        res.status(400).json({
          verified: false,
          error: verifyJson.message || 'Payment has not been completed or amount did not match.',
        });
        return;
      }

      order.status = 'paid';
      order.paidAt = tx.paid_at || new Date().toISOString();
      order.channel = tx.channel || 'card';
      userCarts.delete(userId);

      res.json({
        verified: true,
        receipt: {
          reference: order.reference,
          totalNaira: order.totalNaira,
          items: order.items,
          paidAt: order.paidAt,
          channel: order.channel,
        },
      });
    } catch (error) {
      console.error('Paystack verification failed:', error);
      res.status(500).json({ error: 'Unable to verify payment with Paystack.' });
    }
  }
);

// Return JSON 404 for unknown /api/* routes before SPA fallback
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Ensure any unhandled error inside /api middleware (e.g. Clerk) still returns JSON
app.use(
  '/api',
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled /api error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An internal API error occurred.' });
    }
  }
);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mama's Kitchen server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
