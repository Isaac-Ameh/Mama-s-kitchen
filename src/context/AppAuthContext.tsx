import React, { createContext, useContext } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { isClerkConfigured } from '../lib/clerkConfig';

export interface AppAuthState {
  isClerkConfigured: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  imageUrl: string | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthState | undefined>(undefined);

function ClerkBackedAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const value: AppAuthState = {
    isClerkConfigured: true,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    userId: userId ?? null,
    fullName: user?.fullName || user?.firstName || null,
    email: user?.primaryEmailAddress?.emailAddress || null,
    imageUrl: user?.imageUrl || null,
    getToken: async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    },
    signOut: async () => {
      await signOut({ redirectUrl: '/' });
    },
  };

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

function UnconfiguredAuthProvider({ children }: { children: React.ReactNode }) {
  const value: AppAuthState = {
    isClerkConfigured: false,
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    fullName: null,
    email: null,
    imageUrl: null,
    getToken: async () => null,
    signOut: async () => {},
  };

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (isClerkConfigured) {
    return <ClerkBackedAuthProvider>{children}</ClerkBackedAuthProvider>;
  }
  return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>;
}

export function useAppAuth(): AppAuthState {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error('useAppAuth must be used within AppAuthProvider');
  }
  return ctx;
}
