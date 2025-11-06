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

export default function MyLibraryPage() {
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
              Please wait while we load your library.
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
          My Library
        </h1>
        <p className="text-xl text-muted-foreground">
          Your personal game collection and preferences
        </p>
      </section>

      {/* Library Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Liked Games */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              ❤️ Liked Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Games you&apos;ve liked and want to play
            </CardDescription>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-2">0</div>
              <div className="text-sm text-gray-500">Games liked</div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              ⭐ Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Your all-time favorite games
            </CardDescription>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-2">0</div>
              <div className="text-sm text-gray-500">Favorite games</div>
            </div>
          </CardContent>
        </Card>

        {/* Played Games */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              ✅ Played Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Games you&apos;ve completed or played before
            </CardDescription>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-2">0</div>
              <div className="text-sm text-gray-500">Games played</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <section className="text-center">
        <Card className="gaming-card max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-purple-400">
              Start Building Your Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6 text-lg">
              Begin exploring games and building your personal collection. Like
              games you&apos;re interested in, mark favorites, and track what
              you&apos;ve played.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="gaming-button px-8 py-3"
                onClick={() => router.push("/games")}
              >
                Browse Games
              </Button>
              <Button
                className="gaming-button px-8 py-3"
                onClick={() => router.push("/recommendations")}
              >
                Get Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
