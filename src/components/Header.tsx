"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <header className="gaming-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/home" className="text-2xl font-bold gaming-gradient">
              PlayPickr
            </Link>
            <div className="text-gray-300 text-sm">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="gaming-header">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link
            href={user ? "/dashboard" : "/home"}
            className="text-2xl font-bold gaming-gradient"
          >
            PlayPickr
          </Link>

          {user ? (
            <div className="flex items-center justify-between w-full">
              {/* Navigation Links - Centered */}
              <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
                <Link
                  href="/games"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Games
                </Link>
                <Link
                  href="/recommendations"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Recommendations
                </Link>
                <Link
                  href="/my-library"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  My Library
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Profile
                </Link>
              </nav>

              {/* User Info and Sign Out - Right aligned */}
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-gray-300 text-sm">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="gaming-button px-6 py-2 rounded-lg"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && (
          <nav className="md:hidden mt-4 pb-2 border-t border-gray-600 pt-4">
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/games"
                className="text-gray-300 hover:text-white transition-colors text-sm px-2 py-1"
              >
                Games
              </Link>
              <Link
                href="/recommendations"
                className="text-gray-300 hover:text-white transition-colors text-sm px-2 py-1"
              >
                Recommendations
              </Link>
              <Link
                href="/my-library"
                className="text-gray-300 hover:text-white transition-colors text-sm px-2 py-1"
              >
                My Library
              </Link>
              <Link
                href="/profile"
                className="text-gray-300 hover:text-white transition-colors text-sm px-2 py-1"
              >
                Profile
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
