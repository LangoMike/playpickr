"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);

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
            window.location.href = next;
            return;
          }
        }

        // Check for code parameter (OAuth flow)
        const code = searchParams?.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("OAuth auth error:", error);
            setError("Failed to authenticate with OAuth provider");
            return;
          }

          // Wait a moment for the session to be properly set
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Success! Redirect to intended destination
          window.location.href = next;
          return;
        }

        // No valid authentication parameters found
        setError("No authentication parameters found");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred during authentication");
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
