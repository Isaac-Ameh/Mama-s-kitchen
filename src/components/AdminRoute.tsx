import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ClerkFailed, ClerkLoaded, ClerkLoading } from '@clerk/react';
import { AlertCircle, ExternalLink, Lock, ShieldAlert } from 'lucide-react';
import { useAppAuth } from '../context/AppAuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const {
    isClerkConfigured,
    isLoaded,
    isSignedIn,
    authResolved,
    canAccessAdmin,
    signOut,
  } = useAppAuth();
  const location = useLocation();

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#143628]/8 text-[#143628] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#1C1917]">
            Authentication Required for Admin
          </h1>
          <p className="text-sm text-[#57534E] leading-relaxed">
            Configure Clerk environment keys to sign in and verify administrative access.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#143628]/20 border-t-[#143628] animate-spin" />
            <p className="text-sm text-[#57534E]">Verifying admin access...</p>
          </div>
        </div>
      </ClerkLoading>

      <ClerkFailed>
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-xl border border-[#B91C1C]/20 p-6 sm:p-8 text-center space-y-4">
            <div className="w-11 h-11 mx-auto rounded-full bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="font-display text-xl font-semibold text-[#1C1917]">
              Authentication Unavailable in Embedded View
            </h1>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Clerk could not load inside this frame. Try opening the portal in a full browser tab.
            </p>
            {typeof window !== 'undefined' && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </ClerkFailed>

      <ClerkLoaded>
        {!isLoaded || (isSignedIn && !authResolved) ? (
          <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#143628]/20 border-t-[#143628] animate-spin" />
              <p className="text-sm text-[#57534E]">Verifying admin permissions...</p>
            </div>
          </div>
        ) : !isSignedIn ? (
          <Navigate
            to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname + location.search)}`}
            replace
          />
        ) : !canAccessAdmin ? (
          <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4 py-12">
            <div className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 sm:p-8 text-center space-y-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-semibold text-[#1C1917]">
                  Admin Access Restricted
                </h1>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  This portal is restricted to the Mama&apos;s Kitchen owner and authorized staff.
                  Your current account does not hold administrative permissions.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  to="/menu"
                  className="px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                >
                  Browse Menu
                </Link>
                <Link
                  to="/"
                  className="px-5 py-2.5 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
                >
                  Return Home
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="px-5 py-2.5 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#57534E] hover:bg-[#F3EEE6] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>{children}</>
        )}
      </ClerkLoaded>
    </>
  );
}
