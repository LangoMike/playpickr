"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { OrderByDropdown } from "@/components/OrderByDropdown";
import { RAWGGame, RAWGSearchResult } from "@/lib/rawg";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<RAWGGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState("-added");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTrendingGames = async () => {
      try {
        setGamesLoading(true);
        const response = await fetch(
          `/api/games/trending?ordering=${currentOrder}&pageSize=12`
        );
        if (response.ok) {
          const data: RAWGSearchResult = await response.json();
          setGames(data.results);
        }
      } catch (error) {
        console.error("Error fetching trending games:", error);
      } finally {
        setGamesLoading(false);
      }
    };

    if (user) {
      fetchTrendingGames();
    }
  }, [user, currentOrder]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
            <p className="text-muted-foreground">
              Please wait while we load your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Dashboard for authenticated users only
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <section className="mb-12 text-center py-12 px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 via-gray-700 to-purple-900 rounded-2xl p-8 md:p-12 shadow-2xl border border-purple-500/20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            <span className="gaming-gradient">Welcome back,</span>{" "}
            <span className="text-white">
              {user.user_metadata?.full_name || user.email?.split("@")[0]}
            </span>
            !
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Ready to discover your next favorite game? Explore trending titles
            and find your perfect match.
          </p>
        </div>
      </section>

      {/* User Stats Snapshot */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="gaming-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
              <div className="text-gray-300">Games in Library</div>
            </CardContent>
          </Card>
          <Card className="gaming-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">0</div>
              <div className="text-gray-300">Favorites</div>
            </CardContent>
          </Card>
          <Card className="gaming-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">0</div>
              <div className="text-gray-300">Games Played</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Daily Spotlight & Quick Actions */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Spotlight */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎯 Today's Spotlight
            </h2>
            {gamesLoading ? (
              <div className="gaming-card animate-pulse">
                <div className="h-64 bg-gray-600 rounded-lg"></div>
              </div>
            ) : games.length > 0 ? (
              <div className="gaming-card overflow-hidden">
                <div className="relative h-64">
                  <img
                    src={games[0].background_image}
                    alt={games[0].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {games[0].name}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Handpicked just for you based on your preferences
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white">
                          {games[0].rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {games[0].released
                          ? new Date(games[0].released).getFullYear()
                          : "TBA"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Actions Sidebar */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              ⚡ Quick Actions
            </h2>
            <div className="space-y-6">
              <div>
                <Link href="/games">
                  <Button className="w-full justify-start h-12 bg-gradient-to-br from-gray-800 via-gray-700 to-purple-900 border border-purple-500/20 text-white hover:from-gray-700 hover:via-gray-600 hover:to-purple-800 transition-all shadow-lg">
                    🔍 Browse All Games
                  </Button>
                </Link>
              </div>
              <div>
                <Link href="/recommendations">
                  <Button className="w-full justify-start h-12 bg-gradient-to-br from-gray-800 via-gray-700 to-purple-900 border border-purple-500/20 text-white hover:from-gray-700 hover:via-gray-600 hover:to-purple-800 transition-all shadow-lg">
                    🎯 Get Recommendations
                  </Button>
                </Link>
              </div>

              <div>
                <Button className="w-full justify-start h-12 bg-gradient-to-br from-gray-800 via-gray-700 to-purple-900 border border-purple-500/20 text-white hover:from-gray-700 hover:via-gray-600 hover:to-purple-800 transition-all shadow-lg">
                  🎲 Random Game Picker
                </Button>
              </div>
              <div>
                <Button className="w-full justify-start h-12 bg-gradient-to-br from-gray-800 via-gray-700 to-purple-900 border border-purple-500/20 text-white hover:from-gray-700 hover:via-gray-600 hover:to-purple-800 transition-all shadow-lg">
                  📊 View My Stats
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For You Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">✨ For You</h2>
            <p className="text-gray-400">
              Personalized recommendations based on your taste
            </p>
          </div>
          <div className="text-sm text-purple-400">
            <span className="font-semibold">87%</span> personalized
          </div>
        </div>

        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="gaming-card animate-pulse">
                <div className="h-48 bg-gray-600 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.slice(1, 5).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Trending by Genre */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          🔥 Trending by Genre
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-red-400">🎮 Action Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Hot right now</div>
                <div className="text-lg font-semibold text-white">
                  Cyberpunk 2077
                </div>
                <div className="text-sm text-gray-400">
                  +2,341 players this week
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-blue-400">🧙 RPG Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Rising fast</div>
                <div className="text-lg font-semibold text-white">
                  Baldur's Gate 3
                </div>
                <div className="text-sm text-gray-400">
                  +1,892 players this week
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-green-400">🏃 Sports Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-300">New release</div>
                <div className="text-lg font-semibold text-white">FIFA 24</div>
                <div className="text-sm text-gray-400">
                  +3,156 players this week
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fun Fact Widget */}
      <section className="mb-12">
        <Card className="gaming-card bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Did You Know?
                </h3>
                <p className="text-gray-300">
                  Portal 2 has the highest co-op rating among puzzle games, with
                  over 95% positive reviews praising its innovative mechanics
                  and witty humor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
