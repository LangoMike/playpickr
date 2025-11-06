"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);

        // Use the shared client instance which should have access to the code verifier cookie

        // Get the next redirect URL
        const next = searchParams?.get("next") || "/dashboard";

        // Check for access_token in URL hash (magic link)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Magic link auth error:", error);
              setError("Failed to authenticate with magic link");
              return;
            }

            // Wait a moment for the session to be properly set
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Success! Redirect to intended destination
            router.push(next);
            return;
          }
        }

        // Check for code parameter (OAuth flow with PKCE)
        const code = searchParams?.get("code");
        if (code) {
          // When using createBrowserClient, exchangeCodeForSession automatically
          // retrieves the code verifier from cookies. The code verifier should have been
          // stored when the OAuth flow was initiated.
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
              console.error("OAuth auth error:", error);
              console.error("Error details:", {
                message: error.message,
                status: error.status,
                code: (error as any).code
              });
              setError(`Failed to authenticate: ${error.message}. Please try signing in again.`);
              return;
            }

            if (data.session) {
              // Session is set, wait a moment for cookies to sync
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Success! Redirect to intended destination
              router.push(next);
              return;
            } else {
              setError("No session returned from authentication");
              return;
            }
          } catch (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            setError(`Authentication failed: ${exchangeError instanceof Error ? exchangeError.message : 'Unknown error'}. Please try signing in again.`);
            return;
          }
        }

        // No valid authentication parameters found
        setError("No authentication parameters found");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4">
              Completing sign in...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we complete your authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4 text-red-400">
              Authentication Error
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="gaming-button px-4 py-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
          <div className="gaming-card p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
            <p className="text-muted-foreground">
              Processing authentication...
            </p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
