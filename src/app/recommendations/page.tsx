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

export default function RecommendationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
            <p className="text-muted-foreground">
              Please wait while we load your recommendations.
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
          Recommendations
        </h1>
        <p className="text-xl text-muted-foreground">
          Personalized game recommendations just for you
        </p>
      </section>

      {/* Coming Soon Section */}
      <section className="mb-12">
        <div className="max-w-2xl mx-auto">
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                🎯 Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-6 text-lg">
                Our AI-powered recommendation engine is currently being
                developed. Soon you'll receive personalized game suggestions
                based on your preferences, playing history, and favorite genres.
              </CardDescription>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">
                    Analyze your gaming preferences
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">
                    Match with similar players
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">
                    Suggest games you'll love
                  </span>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button className="gaming-button px-8 py-3">
                  Get Notified When Ready
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
