"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GameCard } from "@/components/GameCard";
import { RAWGGame } from "@/lib/rawg";

interface InteractionStats {
  liked: number;
  favorite: number;
  played: number;
}

export default function MyLibraryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<InteractionStats>({
    liked: 0,
    favorite: 0,
    played: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [likedGames, setLikedGames] = useState<RAWGGame[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<RAWGGame[]>([]);
  const [playedGames, setPlayedGames] = useState<RAWGGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    liked: false,
    favorite: false,
    played: false,
  });

  const MAX_GAMES_INITIAL = 8;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch("/api/interactions/stats", {
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchAllGames = async () => {
      try {
        setGamesLoading(true);
        const [likedResponse, favoriteResponse, playedResponse] =
          await Promise.all([
            fetch("/api/interactions/games?action=like", {
              credentials: "include",
            }),
            fetch("/api/interactions/games?action=favorite", {
              credentials: "include",
            }),
            fetch("/api/interactions/games?action=played", {
              credentials: "include",
            }),
          ]);

        if (likedResponse.ok) {
          const result = await likedResponse.json();
          if (result.success) {
            setLikedGames(result.data);
          }
        }

        if (favoriteResponse.ok) {
          const result = await favoriteResponse.json();
          if (result.success) {
            setFavoriteGames(result.data);
          }
        }

        if (playedResponse.ok) {
          const result = await playedResponse.json();
          if (result.success) {
            setPlayedGames(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setGamesLoading(false);
      }
    };

    fetchAllGames();
  }, [user]);

  if (loading || statsLoading || gamesLoading) {
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

  const totalInteractions = stats.liked + stats.favorite + stats.played;
  const showGettingStarted = totalInteractions === 0;

  const toggleSection = (section: "liked" | "favorite" | "played") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getDisplayedGames = (
    games: RAWGGame[],
    section: "liked" | "favorite" | "played"
  ) => {
    if (expandedSections[section] || games.length <= MAX_GAMES_INITIAL) {
      return games;
    }
    return games.slice(0, MAX_GAMES_INITIAL);
  };

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

      {/* Liked Games Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-red-400 flex items-center gap-2">
            <span>❤️</span> Liked Games
          </h2>
          <span className="text-xl text-gray-400">
            ({statsLoading ? "..." : stats.liked})
          </span>
        </div>
        {likedGames.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getDisplayedGames(likedGames, "liked").map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {likedGames.length > MAX_GAMES_INITIAL && (
              <div className="mt-6 text-center">
                <Button
                  className="gaming-button px-6 py-2"
                  onClick={() => toggleSection("liked")}
                >
                  {expandedSections.liked ? "Show Less" : "Show More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="gaming-card p-8 text-center">
            <p className="text-gray-400 text-lg">
              Start exploring games and like the ones you&apos;re interested in
              to build your collection
            </p>
          </div>
        )}
      </section>

      {/* Favorites Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
            <span>⭐</span> Favorites
          </h2>
          <span className="text-xl text-gray-400">
            ({statsLoading ? "..." : stats.favorite})
          </span>
        </div>
        {favoriteGames.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getDisplayedGames(favoriteGames, "favorite").map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {favoriteGames.length > MAX_GAMES_INITIAL && (
              <div className="mt-6 text-center">
                <Button
                  className="gaming-button px-6 py-2"
                  onClick={() => toggleSection("favorite")}
                >
                  {expandedSections.favorite ? "Show Less" : "Show More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="gaming-card p-8 text-center">
            <p className="text-gray-400 text-lg">
              Mark your all-time favorite games to keep track of the ones you
              love most
            </p>
          </div>
        )}
      </section>

      {/* Played Games Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-green-400 flex items-center gap-2">
            <span>✅</span> Played Games
          </h2>
          <span className="text-xl text-gray-400">
            ({statsLoading ? "..." : stats.played})
          </span>
        </div>
        {playedGames.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getDisplayedGames(playedGames, "played").map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
            {playedGames.length > MAX_GAMES_INITIAL && (
              <div className="mt-6 text-center">
                <Button
                  className="gaming-button px-6 py-2"
                  onClick={() => toggleSection("played")}
                >
                  {expandedSections.played ? "Show Less" : "Show More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="gaming-card p-8 text-center">
            <p className="text-gray-400 text-lg">
              Track the games you&apos;ve completed or played to build your
              gaming history
            </p>
          </div>
        )}
      </section>

      {/* Getting Started Section - Only show if user has no interactions */}
      {showGettingStarted && (
        <section className="text-center">
          <Card className="gaming-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-purple-400">
                Start Building Your Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-6 text-lg">
                Begin exploring games and building your personal collection.
                Like games you&apos;re interested in, mark favorites, and track
                what you&apos;ve played.
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
      )}
    </div>
  );
}
