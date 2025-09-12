"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
            <p className="text-muted-foreground">
              Please wait while we load your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gaming-gradient">
          Profile
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage your account and preferences
        </p>
      </section>

      {/* Profile Information */}
      <div className="max-w-2xl mx-auto">
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              👤 Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Name
                </label>
                <div className="text-white text-lg">
                  {user.user_metadata?.full_name || "Not provided"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  Email
                </label>
                <div className="text-white text-lg">{user.email}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  Account Created
                </label>
                <div className="text-white text-lg">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              ⚙️ Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6">
              Customize your gaming experience and notification preferences.
            </CardDescription>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Email Notifications
                  </div>
                  <div className="text-sm text-gray-400">
                    Receive updates about new games and recommendations
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Gaming Preferences
                  </div>
                  <div className="text-sm text-gray-400">
                    Set your favorite genres and platforms
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              🚪 Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6">
              Manage your account and data.
            </CardDescription>

            <div className="space-y-4">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </Button>

              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-400 hover:bg-gray-600/10"
                disabled
              >
                Delete Account (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
