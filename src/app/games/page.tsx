"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { OrderByDropdown } from "@/components/OrderByDropdown";
import { RAWGGame, RAWGSearchResult } from "@/lib/rawg";

export default function GamesPage() {
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
    const fetchGames = async () => {
      try {
        setGamesLoading(true);
        const response = await fetch(
          `/api/games/trending?ordering=${currentOrder}&pageSize=20`
        );
        if (response.ok) {
          const data: RAWGSearchResult = await response.json();
          setGames(data.results);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setGamesLoading(false);
      }
    };

    if (user) {
      fetchGames();
    }
  }, [user, currentOrder]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="gaming-card p-8">
            <h2 className="text-xl font-semibold mb-4">Loading...</h2>
            <p className="text-muted-foreground">
              Please wait while we load the games.
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
          All Games
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover and explore thousands of games
        </p>
      </section>

      {/* Games Section */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Browse Games</h2>
            <p className="text-gray-400">Find your next favorite game</p>
          </div>
          <div className="mt-4 md:mt-0">
            <OrderByDropdown
              currentOrder={currentOrder}
              onOrderChange={setCurrentOrder}
            />
          </div>
        </div>

        {/* Games Grid */}
        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
