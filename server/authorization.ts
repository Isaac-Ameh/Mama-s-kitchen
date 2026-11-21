import type { NextFunction, Request, Response } from 'express';
import { getAuth, type clerkClient as ClerkClientType } from '@clerk/express';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.ts';

export type AppRole = 'customer' | 'staff' | 'owner';

export type AppPermission =
  | 'account:read'
  | 'cart:read'
  | 'cart:write'
  | 'admin:access'
  | 'orders:read'
  | 'orders:update'
  | 'notifications:read'
  | 'menu:manage'
  | 'categories:manage'
  | 'customers:read'
  | 'analytics:read'
  | 'staff:manage'
  | 'settings:manage'
  | 'audit:read';

export type RoleResolutionSource =
  | 'supabase_database'
  | 'default_customer';

export interface AccessPolicy {
  role: AppRole;
  permissions: AppPermission[];
  source: RoleResolutionSource;
}

export interface AuthAuditEntry {
  timestamp: string;
  actorUserId: string;
  actorRole: AppRole;
  action: string;
  target: string;
  outcome: 'allowed' | 'denied';
  reason?: string;
}

export interface AuthenticatedRequest extends Request {
  appAuth?: {
    userId: string;
    orgId: string | null;
    orgRole: string | null;
    verifiedEmail: string | null;
    fullName: string | null;
    policy: AccessPolicy;
  };
}

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  customer: ['account:read', 'cart:read', 'cart:write'],
  staff: [
    'account:read',
    'cart:read',
    'cart:write',
    'admin:access',
    'orders:read',
    'orders:update',
    'notifications:read',
  ],
  owner: [
    'account:read',
    'cart:read',
    'cart:write',
    'admin:access',
    'orders:read',
    'orders:update',
    'notifications:read',
    'menu:manage',
    'categories:manage',
    'customers:read',
    'analytics:read',
    'staff:manage',
    'settings:manage',
    'audit:read',
  ],
};

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

export async function isOwnerInitialized(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'owner');
      if ((count ?? 0) > 0) return true;
    } catch {
      // ignore
    }
  }
  return true;
}

export function isOwnerProvisioningConfigured(): boolean {
  return isSupabaseConfigured();
}

export function recordAuthAuditEvent(entry: AuthAuditEntry): void {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    void supabase.from('audit_logs').insert({
      actor_user_id: entry.actorUserId,
      actor_role: entry.actorRole,
      action: entry.action,
      target: entry.target,
      outcome: entry.outcome,
      reason: entry.reason ?? null,
    });
  }
  console.info(
    JSON.stringify({
      event: 'mamas_kitchen_auth_audit',
      ...entry,
    })
  );
}

/**
 * Fully automated database-backed role resolution and profile provisioning:
 * 1. Checks if profile exists in Supabase.
 * 2. If pending staff invitation matches verified primary email, automatically links profile and marks invitation accepted.
 * 3. Otherwise, creates/ensures profile with role = 'customer'.
 * 4. Never auto-promotes first user and never trusts client claims.
 */
export async function resolveAccessPolicyFromIdentity(params: {
  userId: string;
  verifiedPrimaryEmail: string | null;
  fullName: string | null;
}): Promise<AccessPolicy> {
  const supabase = getSupabaseAdmin();
  const fallbackEmail = params.verifiedPrimaryEmail || `${params.userId}@clerk.user`;

  if (supabase) {
    try {
      // 1. Check existing profile in database
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', params.userId)
        .maybeSingle();

      if (existingProfile) {
        const role = (existingProfile.role as AppRole) || 'customer';
        return {
          role,
          permissions: [...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer)],
          source: 'supabase_database',
        };
      }

      // 2. Check pending staff invitation matching verified primary email case-insensitively
      let assignedRole: AppRole = 'customer';
      if (params.verifiedPrimaryEmail) {
        const { data: invite } = await supabase
          .from('staff_invitations')
          .select('role, permissions, status')
          .eq('email', params.verifiedPrimaryEmail.trim().toLowerCase())
          .eq('status', 'pending')
          .maybeSingle();

        if (invite) {
          assignedRole = (invite.role as AppRole) || 'staff';
          await supabase
            .from('staff_invitations')
            .update({ status: 'accepted' })
            .eq('email', params.verifiedPrimaryEmail.trim().toLowerCase());
        }
      }

      // 3. Create profile in database atomically
      await supabase.from('profiles').insert({
        id: params.userId,
        email: fallbackEmail,
        full_name: params.fullName,
        role: assignedRole,
        updated_at: new Date().toISOString(),
      });

      return {
        role: assignedRole,
        permissions: [...(ROLE_PERMISSIONS[assignedRole] || ROLE_PERMISSIONS.customer)],
        source: 'supabase_database',
      };
    } catch (err) {
      console.error('Database role resolution error:', err);
    }
  }

  return {
    role: 'customer',
    permissions: [...ROLE_PERMISSIONS.customer],
    source: 'default_customer',
  };
}


/**
 * Middleware factory verifying Clerk session token and resolving Supabase database role.
 */
export function createRequireAuthenticatedSession(
  clerkClient: typeof ClerkClientType | null
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!isServerClerkConfigured() || !clerkClient) {
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

    try {
      const user = await clerkClient.users.getUser(auth.userId);
      const primaryEmailObj =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0] ??
        null;

      const verifiedEmail =
        primaryEmailObj?.verification?.status === 'verified'
          ? primaryEmailObj.emailAddress
          : null;

      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

      const policy = await resolveAccessPolicyFromIdentity({
        userId: user.id,
        verifiedPrimaryEmail: verifiedEmail,
        fullName,
      });

      req.appAuth = {
        userId: user.id,
        orgId: auth.orgId ?? null,
        orgRole: auth.orgRole ?? null,
        verifiedEmail: primaryEmailObj?.emailAddress ?? null,
        fullName,
        policy,
      };

      next();
    } catch (error) {
      console.error('Failed to verify Clerk session identity:', error);
      res.status(500).json({
        error: 'Unable to verify authenticated session identity.',
      });
    }
  };
}

export function requirePermission(permission: AppPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const appAuth = req.appAuth;
    const policy = appAuth?.policy;

    if (!appAuth || !policy || !policy.permissions.includes(permission)) {
      if (appAuth && req.path.startsWith('/admin')) {
        recordAuthAuditEvent({
          timestamp: new Date().toISOString(),
          actorUserId: appAuth.userId,
          actorRole: policy?.role ?? 'customer',
          action: req.method,
          target: req.originalUrl,
          outcome: 'denied',
          reason: `missing_permission:${permission}`,
        });
      }

      res.status(403).json({
        error: `Forbidden: missing required permission (${permission}).`,
      });
      return;
    }

    next();
  };
}

export function requireRole(...allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const appAuth = req.appAuth;
    const role = appAuth?.policy.role;

    if (!appAuth || !role || !allowedRoles.includes(role)) {
      if (appAuth && req.path.startsWith('/admin')) {
        recordAuthAuditEvent({
          timestamp: new Date().toISOString(),
          actorUserId: appAuth.userId,
          actorRole: role ?? 'customer',
          action: req.method,
          target: req.originalUrl,
          outcome: 'denied',
          reason: `role_not_in:${allowedRoles.join('|')}`,
        });
      }

      res.status(403).json({
        error: 'Forbidden: insufficient role privileges for this resource.',
      });
      return;
    }

    next();
  };
}

export function isResourceOwner(
  authenticatedUserId: string,
  resourceOwnerId: string
): boolean {
  return authenticatedUserId === resourceOwnerId;
}
