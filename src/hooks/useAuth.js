import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";

/* Thin wrapper over @convex-dev/auth's hooks so the rest of the app (AuthGate, Nav)
   doesn't need to know the backend is Convex specifically. */
export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  return {
    status: isLoading ? "loading" : isAuthenticated ? "signedIn" : "signedOut",
    // flow: "signIn" | "signUp"
    signIn: (email, password, flow) => signIn("password", { email, password, flow }),
    signOut,
  };
}
