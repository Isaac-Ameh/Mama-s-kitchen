import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '@clerk/react';
import { LogOut, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAppAuth } from '../context/AppAuthContext';
import { PageHero } from '../components/PageHero';
import { parseApiJson } from '../lib/api';

interface ServerMeResponse {
  identity: {
    userId: string;
    fullName: string | null;
    email: string | null;
    orgId: string | null;
  };
  authorization: {
    role: string;
    permissions: string[];
  };
}

export function AccountPage() {
  const { isClerkConfigured, getToken, signOut, fullName, email, userId } = useAppAuth();
  const [serverData, setServerData] = useState<ServerMeResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchServerIdentity() {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/me', {
          credentials: 'same-origin',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await parseApiJson<ServerMeResponse>(
          res,
          'Could not verify session with backend API.'
        );
        if (!cancelled) {
          setServerData(json);
          setServerError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setServerError(
            err instanceof Error ? err.message : 'Unable to load backend session details.'
          );
        }
      }
    }

    if (isClerkConfigured) {
      void fetchServerIdentity();
    }
    return () => {
      cancelled = true;
    };
  }, [isClerkConfigured, getToken]);

  return (
    <div>
      <PageHero
        eyebrow="Your Account"
        title={fullName ? `Welcome, ${fullName}` : 'Account & Profile'}
        subtitle="Manage your profile, active sessions, and protected order cart."
        image="/src/assets/images/about_nigerian_table_1795202396431.jpg"
        imageAlt="Guests dining around a Nigerian restaurant table"
      />

      <section className="py-12 sm:py-16 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Verified Backend Identity & Application Authorization Summary */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1C1917]/8">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#143628]" />
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1C1917]">
                  Session &amp; Access Policy
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Open Protected Cart</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {serverError ? (
              <p className="mt-4 text-sm text-[#B91C1C]">{serverError}</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    Clerk Identity (Verified on Server)
                  </p>
                  <p className="text-[#1C1917]">
                    <span className="text-[#57534E]">User ID:</span>{' '}
                    <code className="text-xs bg-[#F3EEE6] px-1.5 py-0.5 rounded">
                      {serverData?.identity.userId ?? userId ?? '—'}
                    </code>
                  </p>
                  <p className="text-[#1C1917]">
                    <span className="text-[#57534E]">Email:</span>{' '}
                    {serverData?.identity.email ?? email ?? '—'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    Application Authorization (Server Policy)
                  </p>
                  <p className="text-[#1C1917]">
                    <span className="text-[#57534E]">Role:</span>{' '}
                    <span className="font-medium capitalize">
                      {serverData?.authorization.role ?? 'customer'}
                    </span>
                  </p>
                  <p className="text-[#1C1917]">
                    <span className="text-[#57534E]">Permissions:</span>{' '}
                    {serverData?.authorization.permissions.join(' · ') ??
                      'account:read · cart:read · cart:write'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Clerk Profile Management */}
          {isClerkConfigured && (
            <div className="flex justify-center">
              <UserProfile routing="path" path="/account" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
