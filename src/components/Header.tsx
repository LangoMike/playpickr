import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="gaming-header">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href={user ? "/dashboard" : "/home"}
          className="text-2xl font-bold gaming-gradient"
        >
          PlayPickr
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-300">
              {user.user_metadata?.full_name || user.email?.split("@")[0]}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors rounded-lg"
              >
                Sign Out
              </button>
            </form>
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
    </header>
  );
}
