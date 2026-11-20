import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ClerkFailed, ClerkLoaded, ClerkLoading, SignUp } from '@clerk/react';
import { AlertCircle, ExternalLink, KeyRound } from 'lucide-react';
import { useAppAuth } from '../context/AppAuthContext';
import { PageHero } from '../components/PageHero';

function getSafeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/cart';
  }
  return raw;
}

export function SignUpPage() {
  const { isClerkConfigured, isLoaded, isSignedIn } = useAppAuth();
  const [searchParams] = useSearchParams();
  const safeRedirect = getSafeRedirect(searchParams.get('redirect_url'));

  const isEmbeddedIframe =
    typeof window !== 'undefined' && window.self !== window.top;

  if (isLoaded && isSignedIn) {
    return <Navigate to={safeRedirect} replace />;
  }

  return (
    <div>
      <PageHero
        eyebrow="Join Mama's Kitchen"
        title="Create Your Account"
        subtitle="Register to save your cart and manage your profile."
        image="/src/assets/images/dish_ofada_ayamase_1795202396796.jpg"
        imageAlt="Nigerian Ofada Rice and Ayamase Sauce"
      />

      <section className="py-12 sm:py-20 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center">
          {isClerkConfigured ? (
            <>
              <ClerkLoading>
                <div className="w-full max-w-md bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-8 text-center space-y-3">
                  <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#143628]/20 border-t-[#143628] animate-spin" />
                  <p className="text-sm text-[#57534E]">Loading sign-up form...</p>
                </div>
              </ClerkLoading>

              <ClerkFailed>
                <div className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#B91C1C]/20 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#B91C1C]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <h2 className="font-display text-xl font-semibold">
                      Unable to Load Clerk Sign Up
                    </h2>
                  </div>
                  <p className="text-sm text-[#57534E] leading-relaxed">
                    Clerk could not initialize in this window. This commonly happens when an
                    embedded preview iframe blocks third-party cookies for Clerk&apos;s{' '}
                    <code className="text-xs bg-[#F3EEE6] px-1 py-0.5 rounded">accounts.dev</code>{' '}
                    domain, or if the Publishable Key is invalid.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {typeof window !== 'undefined' && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                      >
                        <span>Open in Full Browser Tab</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      to="/menu"
                      className="px-5 py-2.5 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
                    >
                      Back to Menu
                    </Link>
                  </div>
                </div>
              </ClerkFailed>

              <ClerkLoaded>
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  fallbackRedirectUrl={safeRedirect}
                />

                {isEmbeddedIframe && typeof window !== 'undefined' && (
                  <div className="mt-6 w-full max-w-md rounded-xl bg-[#F3EEE6] border border-[#1C1917]/10 p-4 text-xs text-[#57534E] leading-relaxed text-center">
                    <span>
                      Using an embedded preview? If browser privacy settings block sign-up cookies
                      inside the frame,{' '}
                    </span>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#143628] underline hover:text-[#C05621]"
                    >
                      open Sign Up in a new tab
                    </a>
                    .
                  </div>
                )}
              </ClerkLoaded>
            </>
          ) : (
            <div className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#1C1917]/10 p-6 sm:p-8 space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#143628]/8 text-[#143628] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#1C1917]">
                Connect Clerk Keys to Enable Sign Up
              </h2>
              <p className="text-sm text-[#57534E] leading-relaxed">
                New user registration uses Clerk. Add your keys from the Clerk Dashboard into your
                AI Studio Secrets (or local <code className="text-xs">.env</code> file):
              </p>
              <ul className="space-y-2 text-xs font-mono bg-[#F3EEE6] p-4 rounded-lg text-[#1C1917]">
                <li>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</li>
                <li>CLERK_PUBLISHABLE_KEY=pk_test_...</li>
                <li>CLERK_SECRET_KEY=sk_test_...</li>
              </ul>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/menu"
                  className="px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                >
                  Browse Our Menu
                </Link>
                <Link
                  to="/"
                  className="px-5 py-2.5 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
