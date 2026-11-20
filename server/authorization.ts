import type { NextFunction, Request, Response } from 'express';
import { getAuth } from '@clerk/express';

export type AppRole = 'customer' | 'staff' | 'admin';

export type AppPermission =
  | 'account:read'
  | 'cart:read'
  | 'cart:write'
  | 'menu:manage';

export interface AccessPolicy {
  role: AppRole;
  permissions: AppPermission[];
}

export interface AuthenticatedRequest extends Request {
  appAuth?: {
    userId: string;
    orgId: string | null;
    orgRole: string | null;
    policy: AccessPolicy;
  };
}

export const VALID_MEAL_IDS = new Set([
  'eba-and-egusi-soup',
  'pounded-yam-and-egusi-soup',
  'fufu-and-ofe-nsala',
  'semo-and-ogbono-soup',
  'amala-ewedu-and-gbegiri',
  'jollof-rice-and-chicken',
  'fried-rice-and-chicken',
  'white-rice-stew-and-chicken',
  'ofada-rice-and-ayamase-sauce',
  'rice-and-beans-with-plantain',
  'yam-porridge',
  'beans-and-fried-plantain',
  'eba-and-afang-soup',
  'pounded-yam-and-edikang-ikong',
  'fufu-and-bitterleaf-soup',
  'eba-and-okra-soup',
  'pounded-yam-and-oha-soup',
  'semo-and-banga-soup',
  'eba-and-vegetable-soup',
  'jollof-rice-and-grilled-chicken',
]);

/**
 * Application-owned authorization policy.
 * Clerk handles authentication & identity (`userId`, `orgId`, `orgRole`);
 * Mama's Kitchen retains full control over what roles and permissions exist
 * and never grants privileged permissions solely because a user is signed in.
 */
export function resolveAccessPolicy(
  _userId: string,
  orgRole?: string | null
): AccessPolicy {
  if (orgRole === 'org:admin') {
    return {
      role: 'admin',
      permissions: ['account:read', 'cart:read', 'cart:write', 'menu:manage'],
    };
  }

  if (orgRole === 'org:staff') {
    return {
      role: 'staff',
      permissions: ['account:read', 'cart:read', 'cart:write'],
    };
  }

  return {
    role: 'customer',
    permissions: ['account:read', 'cart:read', 'cart:write'],
  };
}

export function normalizeClerkEnvValue(raw: string | undefined): string {
  let val = (raw || '').trim();
  if (/^[A-Z0-9_]+=(.+)$/.test(val)) {
    val = val.slice(val.indexOf('=') + 1).trim();
  }
  return val.replace(/^['"]|['"]$/g, '').trim();
}

export function getServerClerkKeys(): {
  publishableKey: string;
  secretKey: string;
} {
  const publishableKey = normalizeClerkEnvValue(
    process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY
  );
  const secretKey = normalizeClerkEnvValue(process.env.CLERK_SECRET_KEY);
  return { publishableKey, secretKey };
}

export function isServerClerkConfigured(): boolean {
  const { publishableKey, secretKey } = getServerClerkKeys();
  const validPub = /^pk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(publishableKey);
  const validSec = /^sk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(secretKey);
  return validPub && validSec;
}

export function getPaystackSecretKey(): string {
  return normalizeClerkEnvValue(process.env.PAYSTACK_SECRET_KEY);
}

export function isServerPaystackConfigured(): boolean {
  return /^sk_(test|live)_[A-Za-z0-9_-]+$/.test(getPaystackSecretKey());
}

/**
 * Verifies that a valid Clerk session token is attached to the request.
 * Never fails open when Clerk keys are missing.
 */
export function requireAuthenticatedSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!isServerClerkConfigured()) {
    res.status(503).json({
      error: 'Authentication service is not configured yet on the server.',
    });
    return;
  }

  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to access this resource.',
    });
    return;
  }

  req.appAuth = {
    userId: auth.userId,
    orgId: auth.orgId ?? null,
    orgRole: auth.orgRole ?? null,
    policy: resolveAccessPolicy(auth.userId, auth.orgRole),
  };

  next();
}

/**
 * Enforces application-level permission checks separately from Clerk sign-in.
 */
export function requirePermission(permission: AppPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const policy = req.appAuth?.policy;
    if (!policy || !policy.permissions.includes(permission)) {
      res.status(403).json({
        error: `Forbidden: missing required permission (${permission}).`,
      });
      return;
    }
    next();
  };
}

/**
 * Enforces resource ownership so one authenticated user cannot read or mutate
 * another user's private cart or account records.
 */
export function isResourceOwner(
  authenticatedUserId: string,
  resourceOwnerId: string
): boolean {
  return authenticatedUserId === resourceOwnerId;
}
