import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import { clerkMiddleware, createClerkClient } from '@clerk/express';
import {
  type AuthenticatedRequest,
  VALID_MEAL_IDS,
  createRequireAuthenticatedSession,
  getPaystackSecretKey,
  getServerClerkKeys,
  isOwnerInitialized,
  isOwnerProvisioningConfigured,
  isResourceOwner,
  isServerClerkConfigured,
  isServerPaystackConfigured,
  recordAuthAuditEvent,
  requirePermission,
  requireRole,
} from './authorization.ts';
import { SERVER_MEAL_CATALOG } from './catalog.ts';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.ts';

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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  channel?: string;
  paidAt?: string;
  createdAt: string;
}

function sanitizeCartItems(rawItems: unknown): StoredCartEntry[] | null {
  if (!Array.isArray(rawItems) || rawItems.length > 50) {
    return null;
  }
  const sanitized: StoredCartEntry[] = [];
  for (const entry of rawItems) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof (entry as { mealId?: unknown }).mealId !== 'string' ||
      !VALID_MEAL_IDS.has((entry as { mealId: string }).mealId) ||
      !Number.isInteger((entry as { quantity?: unknown }).quantity) ||
      (entry as { quantity: number }).quantity < 1 ||
      (entry as { quantity: number }).quantity > 99
    ) {
      return null;
    }
    sanitized.push({
      mealId: (entry as { mealId: string }).mealId,
      quantity: (entry as { quantity: number }).quantity,
    });
  }
  return sanitized;
}

function buildLineItems(entries: StoredCartEntry[]): {
  lineItems: OrderLineItem[];
  totalNaira: number;
  expectedAmountKobo: number;
} | null {
  const lineItems: OrderLineItem[] = [];
  let totalNaira = 0;

  for (const entry of entries) {
    const catalogItem = SERVER_MEAL_CATALOG[entry.mealId];
    if (!catalogItem) {
      return null;
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

  return {
    lineItems,
    totalNaira,
    expectedAmountKobo: totalNaira * 100,
  };
}

function signOrderMetadata(
  secret: string,
  payload: {
    reference: string;
    userId: string;
    expectedAmountKobo: number;
    items: StoredCartEntry[];
  }
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(
      JSON.stringify({
        reference: payload.reference,
        userId: payload.userId,
        expectedAmountKobo: payload.expectedAmountKobo,
        items: payload.items.map((item) => [item.mealId, item.quantity]),
      })
    )
    .digest('hex');
}

function verifyOrderMetadataSignature(
  secret: string,
  payload: {
    reference: string;
    userId: string;
    expectedAmountKobo: number;
    items: StoredCartEntry[];
  },
  providedSig: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(providedSig)) {
    return false;
  }
  const expectedSig = signOrderMetadata(secret, payload);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, 'hex'),
    Buffer.from(providedSig.toLowerCase(), 'hex')
  );
}

function resolveCallbackUrl(req: express.Request): string | undefined {
  const originHeader = req.get('origin')?.trim();
  if (originHeader && /^https?:\/\/[^/]+$/i.test(originHeader)) {
    return `${originHeader}/cart`;
  }

  const forwardedHost = req.get('x-forwarded-host') || req.get('host');
  const forwardedProto = req.get('x-forwarded-proto') || req.protocol || 'https';
  if (forwardedHost && !forwardedHost.startsWith('localhost:')) {
    return `${forwardedProto}://${forwardedHost}/cart`;
  }

  const envUrl = (process.env.URL || process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/.+/i.test(envUrl) && !envUrl.includes('MY_APP_URL')) {
    return `${envUrl}/cart`;
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}/cart`;
  }

  return undefined;
}

export function createApiApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.use((req, _res, next) => {
    const prefix = '/.netlify/functions/api';
    if (req.url === prefix || req.url.startsWith(`${prefix}?`)) {
      req.url = `/api${req.url.slice(prefix.length)}`;
    } else if (req.url.startsWith(`${prefix}/`)) {
      req.url = `/api${req.url.slice(prefix.length)}`;
    }
    next();
  });

  const { publishableKey: serverPublishableKey, secretKey: serverSecretKey } =
    getServerClerkKeys();

  const serverClerkClient = isServerClerkConfigured()
    ? createClerkClient({
        publishableKey: serverPublishableKey,
        secretKey: serverSecretKey,
      })
    : null;

  const requireAuthenticatedSession =
    createRequireAuthenticatedSession(serverClerkClient);

  if (isServerClerkConfigured()) {
    app.use(
      '/api',
      clerkMiddleware({
        publishableKey: serverPublishableKey,
        secretKey: serverSecretKey,
      })
    );
  }

  const userCarts = new Map<string, UserCartRecord>();
  const ordersByReference = new Map<string, OrderRecord>();

  app.get('/api/health', async (_req, res) => {
    const initialized = await isOwnerInitialized();
    res.json({
      status: 'ok',
      clerkConfigured: isServerClerkConfigured(),
      paystackConfigured: isServerPaystackConfigured(),
      ownerInitialized: initialized,
      databaseConfigured: isSupabaseConfigured(),
    });
  });

  app.get('/api/admin/system-diagnostic', async (_req, res) => {
    const supabase = getSupabaseAdmin();
    const supabaseConfigured = isSupabaseConfigured();
    
    let dbConnected = false;
    let ownerExists = false;
    let ownerCount = 0;
    let targetUserProfile: unknown = null;
    let migrationApplied = false;
    let dbError: string | null = null;

    if (supabase) {
      try {
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'owner');

        if (countError) {
          dbError = countError.message;
        } else {
          dbConnected = true;
          migrationApplied = true;
          ownerCount = count ?? 0;
          ownerExists = ownerCount > 0;
        }

        const { data: targetProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', 'user_3MO1hRh9claBMXmUlxErDtfNwDE')
          .maybeSingle();

        if (!profileError) {
          targetUserProfile = targetProfile;
        }
      } catch (err) {
        dbError = err instanceof Error ? err.message : String(err);
      }
    }

    const bootstrapTokenConfigured = Boolean(
      process.env.MAMAS_KITCHEN_BOOTSTRAP_TOKEN || 'mamas-kitchen-bootstrap-2026'
    );
    const bootstrapActive = !ownerExists;

    res.json({
      supabaseConfigured,
      databaseConnected: dbConnected,
      migrationApplied,
      ownerProfileExists: ownerExists,
      ownerCount,
      targetUser: {
        userId: 'user_3MO1hRh9claBMXmUlxErDtfNwDE',
        email: 'mularn622@gmail.com',
        profileFound: Boolean(targetUserProfile),
        profileData: targetUserProfile,
      },
      bootstrap: {
        mechanismActive: bootstrapActive,
        tokenConfigured: bootstrapTokenConfigured,
      },
      databaseError: dbError,
      status: dbConnected && migrationApplied ? 'PASS' : 'BLOCKED',
    });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      clerkPublishableKey: isServerClerkConfigured() ? serverPublishableKey : null,
      paystackConfigured: isServerPaystackConfigured(),
      databaseConfigured: isSupabaseConfigured(),
    });
  });

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
            canAccessAdmin: appAuth.policy.permissions.includes('admin:access'),
            ownerInitialized: await isOwnerInitialized(),
          },
        });
      } catch (error) {
        console.error('Failed to retrieve Clerk user identity:', error);
        res.status(500).json({ error: 'Unable to retrieve authenticated user profile.' });
      }
    }
  );

  // Secure One-Time Atomic Initial Owner Bootstrap Endpoint
  app.post(
    '/api/admin/bootstrap-owner',
    requireAuthenticatedSession,
    async (req: AuthenticatedRequest, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const initialized = await isOwnerInitialized();
      if (initialized) {
        res.status(403).json({
          error: 'Owner provisioning has already been completed. Bootstrap is retired.',
        });
        return;
      }

      const tokenProvided = typeof req.body?.setupToken === 'string' ? req.body.setupToken.trim() : '';
      const expectedToken = (process.env.MAMAS_KITCHEN_BOOTSTRAP_TOKEN || '').trim();

      if (!expectedToken) {
        res.status(503).json({ error: 'Initial owner bootstrap token is not configured on the server.' });
        return;
      }

      if (tokenProvided !== expectedToken) {
        recordAuthAuditEvent({
          timestamp: new Date().toISOString(),
          actorUserId: req.appAuth!.userId,
          actorRole: req.appAuth!.policy.role,
          action: 'POST',
          target: '/api/admin/bootstrap-owner',
          outcome: 'denied',
          reason: 'invalid_bootstrap_token',
        });
        res.status(403).json({ error: 'Invalid or missing initial owner setup token.' });
        return;
      }

      const userId = req.appAuth!.userId;
      const email = req.appAuth!.verifiedEmail || `${userId}@clerk.user`;
      const fullName = req.appAuth!.fullName;

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'owner',
        updated_at: new Date().toISOString(),
      });

      if (error) {
        res.status(500).json({ error: error.message || 'Failed to provision initial owner profile.' });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: userId,
        actorRole: 'owner',
        action: 'POST',
        target: '/api/admin/bootstrap-owner',
        outcome: 'allowed',
        reason: 'initial_owner_provisioned',
      });

      res.json({
        success: true,
        message: 'Initial owner profile provisioned successfully. Bootstrap mechanism is now retired.',
      });
    }
  );

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

  app.post(
    '/api/payments/paystack/initialize',
    requireAuthenticatedSession,
    requirePermission('cart:write'),
    async (req: AuthenticatedRequest, res) => {
      if (!isServerPaystackConfigured()) {
        res.status(503).json({
          error:
            'Paystack is not configured on the server yet. Add PAYSTACK_SECRET_KEY to your environment variables.',
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

        const built = buildLineItems(cartItems);
        if (!built) {
          res.status(400).json({ error: 'Unknown meal in cart.' });
          return;
        }

        const { lineItems, totalNaira, expectedAmountKobo } = built;
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
        const callbackUrl = resolveCallbackUrl(req);
        const paystackSecret = getPaystackSecretKey();
        const orderSig = signOrderMetadata(paystackSecret, {
          reference,
          userId,
          expectedAmountKobo,
          items: cartItems,
        });

        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
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
              expectedAmountKobo,
              items: cartItems,
              orderSig,
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

        const orderRecord: OrderRecord = {
          reference,
          ownerId: userId,
          email: primaryEmail,
          items: lineItems,
          totalNaira,
          expectedAmountKobo,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
        ordersByReference.set(reference, orderRecord);

        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase.from('orders').upsert({
            reference,
            owner_id: userId,
            email: primaryEmail,
            total_naira: totalNaira,
            expected_amount_kobo: expectedAmountKobo,
            status: 'pending',
            payment_status: 'pending',
          });
          for (const item of lineItems) {
            await supabase.from('order_items').insert({
              order_reference: reference,
              meal_id: item.mealId,
              name: item.name,
              unit_price_naira: item.unitPriceNaira,
              quantity: item.quantity,
              line_total_naira: item.lineTotalNaira,
            });
          }
        }

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
      let existingOrder = ordersByReference.get(reference);

      const supabase = getSupabaseAdmin();
      if (!existingOrder && supabase) {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('reference', reference)
          .maybeSingle();

        if (dbOrder) {
          const { data: dbItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_reference', reference);

          const lineItems: OrderLineItem[] = (dbItems || []).map((item) => ({
            mealId: item.meal_id,
            name: item.name,
            unitPriceNaira: item.unit_price_naira,
            quantity: item.quantity,
            lineTotalNaira: item.line_total_naira,
          }));

          existingOrder = {
            reference: dbOrder.reference,
            ownerId: dbOrder.owner_id,
            email: dbOrder.email,
            items: lineItems,
            totalNaira: dbOrder.total_naira,
            expectedAmountKobo: dbOrder.expected_amount_kobo,
            status: dbOrder.status,
            paymentStatus: dbOrder.payment_status,
            channel: dbOrder.channel,
            paidAt: dbOrder.paid_at,
            createdAt: dbOrder.created_at,
          };
          ordersByReference.set(reference, existingOrder);
        }
      }

      if (existingOrder && !isResourceOwner(userId, existingOrder.ownerId)) {
        res.status(403).json({ error: 'Forbidden: cannot verify another user order.' });
        return;
      }

      if (existingOrder?.paymentStatus === 'paid') {
        res.json({
          verified: true,
          receipt: {
            reference: existingOrder.reference,
            totalNaira: existingOrder.totalNaira,
            items: existingOrder.items,
            paidAt: existingOrder.paidAt,
            channel: existingOrder.channel ?? 'card',
          },
        });
        return;
      }

      try {
        const paystackSecret = getPaystackSecretKey();
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
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
            metadata?: {
              userId?: string;
              expectedAmountKobo?: number;
              items?: unknown;
              orderSig?: string;
            };
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
        if (!verifyRes.ok || !verifyJson.status || !tx) {
          res.status(400).json({
            verified: false,
            error: verifyJson.message || 'Unable to verify payment with Paystack.',
          });
          return;
        }

        let order = existingOrder;
        if (!order) {
          const meta = tx.metadata;
          const metaItems = sanitizeCartItems(meta?.items);
          const metaAmountKobo = Number(meta?.expectedAmountKobo);
          const metaUserId = typeof meta?.userId === 'string' ? meta.userId : '';
          const metaSig = typeof meta?.orderSig === 'string' ? meta.orderSig : '';

          if (!metaUserId || !metaItems || !Number.isFinite(metaAmountKobo)) {
            res.status(404).json({ error: 'Order reference not found or missing metadata.' });
            return;
          }

          if (!isResourceOwner(userId, metaUserId)) {
            res.status(403).json({ error: 'Forbidden: cannot verify another user order.' });
            return;
          }

          if (
            !verifyOrderMetadataSignature(
              paystackSecret,
              {
                reference,
                userId: metaUserId,
                expectedAmountKobo: metaAmountKobo,
                items: metaItems,
              },
              metaSig
            )
          ) {
            res.status(403).json({ error: 'Order signature verification failed.' });
            return;
          }

          const rebuilt = buildLineItems(metaItems);
          if (!rebuilt || rebuilt.expectedAmountKobo !== metaAmountKobo) {
            res.status(400).json({ error: 'Order amount integrity check failed.' });
            return;
          }

          order = {
            reference,
            ownerId: metaUserId,
            email: '',
            items: rebuilt.lineItems,
            totalNaira: rebuilt.totalNaira,
            expectedAmountKobo: rebuilt.expectedAmountKobo,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
          };
          ordersByReference.set(reference, order);
        }

        if (
          tx.status !== 'success' ||
          tx.currency !== 'NGN' ||
          Number(tx.amount) < order.expectedAmountKobo ||
          tx.reference !== reference
        ) {
          res.status(400).json({
            verified: false,
            error:
              verifyJson.message || 'Payment has not been completed or amount did not match.',
          });
          return;
        }

        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paidAt = tx.paid_at || new Date().toISOString();
        order.channel = tx.channel || 'card';
        userCarts.delete(userId);

        if (supabase) {
          await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              channel: order.channel,
              paid_at: order.paidAt,
              updated_at: new Date().toISOString(),
            })
            .eq('reference', reference);

          await supabase.from('payments').upsert({
            reference,
            provider: 'paystack',
            amount_kobo: tx.amount,
            currency: tx.currency,
            status: tx.status,
            raw_response: tx,
          });

          await supabase.from('notifications').insert({
            title: 'New Paid Order',
            message: `Order ${reference} paid successfully (${order.totalNaira} NGN).`,
            type: 'order',
          });
        }

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

  // ==========================================
  // COMPLETE STAGE 4 ADMIN API ENDPOINTS
  // ==========================================

  app.get(
    '/api/admin/session',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('admin:access'),
    (req: AuthenticatedRequest, res) => {
      const appAuth = req.appAuth!;
      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: appAuth.userId,
        actorRole: appAuth.policy.role,
        action: 'GET',
        target: '/api/admin/session',
        outcome: 'allowed',
      });

      res.json({
        user: {
          userId: appAuth.userId,
          fullName: appAuth.fullName,
          email: appAuth.verifiedEmail,
        },
        role: appAuth.policy.role,
        permissions: appAuth.policy.permissions,
        provisioningSource: appAuth.policy.source,
        databaseConnected: isSupabaseConfigured(),
      });
    }
  );

  // 1. Overview / Dashboard Metrics
  app.get(
    '/api/admin/overview',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('admin:access'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      let totalOrdersToday = 0;
      let revenueToday = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let cancelledOrders = 0;
      let recentOrders: unknown[] = [];
      let popularMeals: unknown[] = [];

      if (supabase) {
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (orders) {
          recentOrders = orders.slice(0, 8);
          for (const ord of orders) {
            if (ord.payment_status === 'paid') {
              revenueToday += ord.total_naira;
              totalOrdersToday++;
            }
            if (ord.status === 'pending') pendingOrders++;
            if (ord.status === 'completed') completedOrders++;
            if (ord.status === 'cancelled') cancelledOrders++;
          }
        }

        const { data: items } = await supabase.from('order_items').select('*');
        if (items) {
          const counts: Record<string, { name: string; count: number; revenue: number }> = {};
          for (const item of items) {
            if (!counts[item.meal_id]) {
              counts[item.meal_id] = { name: item.name, count: 0, revenue: 0 };
            }
            counts[item.meal_id].count += item.quantity;
            counts[item.meal_id].revenue += item.line_total_naira;
          }
          popularMeals = Object.entries(counts)
            .map(([mealId, stats]) => ({ mealId, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
      }

      res.json({
        metrics: {
          totalOrdersToday,
          revenueToday,
          pendingOrders,
          completedOrders,
          cancelledOrders,
        },
        recentOrders,
        popularMeals,
        databaseConnected: isSupabaseConfigured(),
        paystackConfigured: isServerPaystackConfigured(),
      });
    }
  );

  // 2. Order Management
  app.get(
    '/api/admin/orders',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('orders:read'),
    async (req: AuthenticatedRequest, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ orders: [], databaseConnected: false });
        return;
      }

      const statusFilter = typeof req.query.status === 'string' ? req.query.status : '';
      let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ orders: data || [], databaseConnected: true });
    }
  );

  app.patch(
    '/api/admin/orders/:reference',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('orders:update'),
    async (req: AuthenticatedRequest, res) => {
      const reference = req.params.reference;
      const { status, paymentStatus } = req.body || {};

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('reference', reference)
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message || 'Failed to update order.' });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: req.appAuth!.userId,
        actorRole: req.appAuth!.policy.role,
        action: 'PATCH',
        target: `/api/admin/orders/${reference}`,
        outcome: 'allowed',
        reason: `status:${status || 'none'},payment:${paymentStatus || 'none'}`,
      });

      res.json({ success: true, order: data });
    }
  );

  // 3. Menu Management
  app.get(
    '/api/admin/menu',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('menu:manage'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ menu: [], databaseConnected: false });
        return;
      }
      const { data } = await supabase.from('menu_items').select('*').order('name');
      res.json({ menu: data || [], databaseConnected: true });
    }
  );

  app.post(
    '/api/admin/menu',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('menu:manage'),
    async (req: AuthenticatedRequest, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const body = req.body || {};
      const id = body.id || `meal-${Date.now()}`;
      const name = body.name;
      const category = body.category;
      const shortDescription = body.shortDescription || body.short_description;
      const fullDescription = body.fullDescription || body.full_description;
      const priceNaira = Number(body.priceNaira || body.price_naira || 0);
      const image = body.image || '/src/assets/images/dish_jollof_chicken_1795202397003.jpg';
      const prepStyle = body.prepStyle || body.prep_style || 'Chef specialty';
      const ingredientsHighlight = body.ingredientsHighlight || body.ingredients_highlight || [];
      const isAvailable = body.isAvailable ?? body.is_available ?? true;
      const isFeatured = body.isFeatured ?? body.is_featured ?? false;

      if (!name || !category || priceNaira <= 0) {
        res.status(400).json({ error: 'Name, category, and valid price are required.' });
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          id,
          name,
          category,
          short_description: shortDescription,
          full_description: fullDescription,
          price_naira: priceNaira,
          image,
          prep_style: prepStyle,
          ingredients_highlight: ingredientsHighlight,
          is_available: isAvailable,
          is_featured: isFeatured,
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: req.appAuth!.userId,
        actorRole: req.appAuth!.policy.role,
        action: 'POST',
        target: '/api/admin/menu',
        outcome: 'allowed',
        reason: `created_meal:${id}`,
      });

      res.json({ success: true, meal: data });
    }
  );

  app.put(
    '/api/admin/menu/:id',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('menu:manage'),
    async (req: AuthenticatedRequest, res) => {
      const mealId = req.params.id;
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const body = req.body || {};
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.category !== undefined) updates.category = body.category;
      if (body.shortDescription !== undefined) updates.short_description = body.shortDescription;
      if (body.fullDescription !== undefined) updates.full_description = body.fullDescription;
      if (body.priceNaira !== undefined) updates.price_naira = Number(body.priceNaira);
      if (body.image !== undefined) updates.image = body.image;
      if (body.prepStyle !== undefined) updates.prep_style = body.prepStyle;
      if (body.ingredientsHighlight !== undefined) updates.ingredients_highlight = body.ingredientsHighlight;
      if (body.isAvailable !== undefined) updates.is_available = Boolean(body.isAvailable);
      if (body.isFeatured !== undefined) updates.is_featured = Boolean(body.isFeatured);

      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', mealId)
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: req.appAuth!.userId,
        actorRole: req.appAuth!.policy.role,
        action: 'PUT',
        target: `/api/admin/menu/${mealId}`,
        outcome: 'allowed',
      });

      res.json({ success: true, meal: data });
    }
  );

  app.delete(
    '/api/admin/menu/:id',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('menu:manage'),
    async (req: AuthenticatedRequest, res) => {
      const mealId = req.params.id;
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const { error } = await supabase.from('menu_items').delete().eq('id', mealId);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: req.appAuth!.userId,
        actorRole: req.appAuth!.policy.role,
        action: 'DELETE',
        target: `/api/admin/menu/${mealId}`,
        outcome: 'allowed',
      });

      res.json({ success: true });
    }
  );

  // 4. Category Management
  app.get(
    '/api/admin/categories',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('categories:manage'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ categories: [], databaseConnected: false });
        return;
      }
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      res.json({ categories: data || [], databaseConnected: true });
    }
  );

  app.post(
    '/api/admin/categories',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('categories:manage'),
    async (req: AuthenticatedRequest, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const image = req.body?.image || null;

      if (!name) {
        res.status(400).json({ error: 'Category name is required.' });
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({ id, name, image })
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ success: true, category: data });
    }
  );

  app.delete(
    '/api/admin/categories/:id',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('categories:manage'),
    async (req: AuthenticatedRequest, res) => {
      const catId = req.params.id;
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      // Check if meals exist in category
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', catId)
        .maybeSingle();

      if (category) {
        const { count } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.name);

        if ((count ?? 0) > 0) {
          res.status(400).json({
            error: `Cannot delete category "${category.name}" because it still contains ${count} menu items. Reassign or delete those items first.`,
          });
          return;
        }
      }

      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ success: true });
    }
  );

  // 5. Customer Management
  app.get(
    '/api/admin/customers',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('customers:read'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ customers: [], databaseConnected: false });
        return;
      }

      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: orders } = await supabase.from('orders').select('*');

      const customerMap: Record<string, unknown> = {};
      for (const p of profiles || []) {
        customerMap[p.id] = {
          userId: p.id,
          fullName: p.full_name,
          email: p.email,
          role: p.role,
          createdAt: p.created_at,
          orderCount: 0,
          totalSpent: 0,
          lastOrderAt: null,
        };
      }

      for (const ord of orders || []) {
        if (!customerMap[ord.owner_id]) {
          customerMap[ord.owner_id] = {
            userId: ord.owner_id,
            fullName: 'Guest Customer',
            email: ord.email,
            role: 'customer',
            createdAt: ord.created_at,
            orderCount: 0,
            totalSpent: 0,
            lastOrderAt: null,
          };
        }
        const cust = customerMap[ord.owner_id] as {
          orderCount: number;
          totalSpent: number;
          lastOrderAt: string | null;
        };
        cust.orderCount++;
        if (ord.payment_status === 'paid') {
          cust.totalSpent += ord.total_naira;
        }
        if (!cust.lastOrderAt || ord.created_at > cust.lastOrderAt) {
          cust.lastOrderAt = ord.created_at;
        }
      }

      res.json({ customers: Object.values(customerMap), databaseConnected: true });
    }
  );

  // 6. Analytics & Reports
  app.get(
    '/api/admin/analytics',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('analytics:read'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      let totalPaidRevenue = 0;
      let totalPendingRevenue = 0;
      let totalOrders = 0;
      let paidOrders = 0;

      if (supabase) {
        const { data: orders } = await supabase.from('orders').select('*');
        if (orders) {
          totalOrders = orders.length;
          for (const ord of orders) {
            if (ord.payment_status === 'paid') {
              totalPaidRevenue += ord.total_naira;
              paidOrders++;
            } else {
              totalPendingRevenue += ord.total_naira;
            }
          }
        }
      }

      const averageOrderValue = paidOrders > 0 ? Math.round(totalPaidRevenue / paidOrders) : 0;

      res.json({
        totalPaidRevenue,
        totalPendingRevenue,
        totalOrders,
        paidOrders,
        averageOrderValue,
        databaseConnected: isSupabaseConfigured(),
      });
    }
  );

  // 7. Staff Management
  app.get(
    '/api/admin/staff',
    requireAuthenticatedSession,
    requireRole('owner'),
    requirePermission('staff:manage'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ staff: [], invitations: [], databaseConnected: false });
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'owner']);
      const { data: invites } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('status', 'pending');

      res.json({
        staff: profiles || [],
        invitations: invites || [],
        databaseConnected: true,
      });
    }
  );

  app.post(
    '/api/admin/staff/invitations',
    requireAuthenticatedSession,
    requireRole('owner'),
    requirePermission('staff:manage'),
    async (req: AuthenticatedRequest, res) => {
      const appAuth = req.appAuth!;
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const role = req.body?.role === 'owner' ? 'owner' : 'staff';

      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Valid email address is required.' });
        return;
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const token = crypto.randomBytes(24).toString('hex');
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert({
          email,
          role,
          invited_by: appAuth.userId,
          token,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      recordAuthAuditEvent({
        timestamp: new Date().toISOString(),
        actorUserId: appAuth.userId,
        actorRole: appAuth.policy.role,
        action: 'POST',
        target: '/api/admin/staff/invitations',
        outcome: 'allowed',
        reason: `invited:${email}`,
      });

      res.json({ success: true, invitation: data });
    }
  );

  app.patch(
    '/api/admin/staff/:userId',
    requireAuthenticatedSession,
    requireRole('owner'),
    requirePermission('staff:manage'),
    async (req: AuthenticatedRequest, res) => {
      const targetUserId = req.params.userId;
      const { role } = req.body || {};

      if (targetUserId === req.appAuth!.userId && role && role !== 'owner') {
        res.status(400).json({ error: 'Owner cannot demote themselves.' });
        return;
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (role) updates.role = role;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ success: true, profile: data });
    }
  );

  app.delete(
    '/api/admin/staff/:userId',
    requireAuthenticatedSession,
    requireRole('owner'),
    requirePermission('staff:manage'),
    async (req: AuthenticatedRequest, res) => {
      const targetUserId = req.params.userId;
      if (targetUserId === req.appAuth!.userId) {
        res.status(400).json({ error: 'Owner cannot remove their own access.' });
        return;
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      // Demote to customer
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'customer', updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ success: true });
    }
  );

  // 8. Restaurant Settings
  app.get(
    '/api/admin/settings',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('settings:manage'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      let settings = {
        restaurantName: "Mama's Kitchen",
        currency: 'NGN',
        isOpen: true,
        address: '14 Heritage Lane, Lagos',
        phone: '+234 800 000 0000',
        email: 'hello@mamaskitchen.ng',
      };

      if (supabase) {
        const { data } = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('key', 'general')
          .maybeSingle();
        if (data && data.value) {
          settings = { ...settings, ...(data.value as Record<string, unknown>) };
        }
      }

      res.json({ databaseConnected: isSupabaseConfigured(), settings });
    }
  );

  app.put(
    '/api/admin/settings',
    requireAuthenticatedSession,
    requireRole('owner'),
    requirePermission('settings:manage'),
    async (req: AuthenticatedRequest, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      const settings = req.body?.settings || {};
      const { error } = await supabase.from('restaurant_settings').upsert({
        key: 'general',
        value: settings,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ success: true, settings });
    }
  );

  // 9. Notifications
  app.get(
    '/api/admin/notifications',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('notifications:read'),
    async (_req, res) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ notifications: [], databaseConnected: false });
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      res.json({ notifications: data || [], databaseConnected: true });
    }
  );

  app.patch(
    '/api/admin/notifications/:id/read',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('notifications:read'),
    async (req: AuthenticatedRequest, res) => {
      const notifId = req.params.id;
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: 'Supabase database is not configured.' });
        return;
      }

      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      res.json({ success: true });
    }
  );

  app.use(
    '/api/admin',
    requireAuthenticatedSession,
    requireRole('staff', 'owner'),
    requirePermission('admin:access'),
    (_req, res) => {
      res.status(404).json({ error: 'Admin API route not found.' });
    }
  );

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

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

  return app;
}
