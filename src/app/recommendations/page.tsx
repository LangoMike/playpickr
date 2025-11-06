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

interface DatabaseGame {
  id: string;
  rawg_id?: number;
  name: string;
  slug: string;
  description?: string | null;
  released?: string | null;
  background_image?: string | null;
  website?: string | null;
  rating?: number | null;
  rating_top?: number | null;
  metacritic?: number | null;
  playtime?: number | null;
  genres?: Array<{ id: number; name: string; slug: string }> | string[] | null;
  tags?: Array<{ id: number; name: string; slug: string }> | string[] | null;
  platforms?: Array<{ id: number; name: string; slug: string }> | null;
}

interface Recommendation {
  id: string;
  gameId: string;
  score: number;
  reason: string;
  game: DatabaseGame;
}

export default function RecommendationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isColdStart, setIsColdStart] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/recommendations");
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations || []);
        setIsColdStart(result.data.isColdStart || false);
        setMessage(result.data.message || null);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        setMessage(result.data.message);
        setIsColdStart(result.data.isColdStart || false);
        // Refresh recommendations
        await fetchRecommendations();
      } else {
        alert(`Error: ${result.error}\n${result.details || ""}`);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      alert("Failed to generate recommendations. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };

  if (authLoading || loading) {
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

  // Convert database game format to RAWGGame format for GameCard
  const convertToRAWGGame = (game: DatabaseGame): RAWGGame => {
    return {
      id: game.rawg_id || parseInt(game.id) || 0,
      name: game.name,
      slug: game.slug,
      description: game.description || "",
      description_raw: game.description || "",
      released: game.released || "",
      background_image: game.background_image || "",
      background_image_additional: "",
      website: game.website || "",
      rating: game.rating || 0,
      rating_top: game.rating_top || 5,
      metacritic: game.metacritic || null,
      playtime: game.playtime || 0,
      platforms: Array.isArray(game.platforms)
        ? game.platforms.map((p) => {
            const platform = typeof p === 'string' 
              ? { id: 0, name: p, slug: "" }
              : { id: p.id || 0, name: p.name || "", slug: p.slug || "" };
            return {
              platform,
            };
          })
        : [],
      genres: Array.isArray(game.genres)
        ? game.genres.map((g) => {
            return typeof g === 'string'
              ? { id: 0, name: g, slug: "" }
              : { id: g.id || 0, name: g.name || "", slug: g.slug || "" };
          })
        : [],
      tags: Array.isArray(game.tags)
        ? game.tags.map((t) => {
            return typeof t === 'string'
              ? { id: 0, name: t, slug: "" }
              : { id: t.id || 0, name: t.name || "", slug: t.slug || "" };
          })
        : [],
      developers: [],
      publishers: [],
      stores: [],
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gaming-gradient">
              Recommendations
            </h1>
            <p className="text-xl text-muted-foreground">
              Personalized game recommendations just for you
            </p>
          </div>
          <Button
            onClick={handleGenerateRecommendations}
            disabled={generating}
            className="gaming-button px-6 py-3"
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate New Recommendations"
            )}
          </Button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              isColdStart
                ? "bg-blue-900/30 border border-blue-700"
                : "bg-purple-900/30 border border-purple-700"
            }`}
          >
            <p className="text-sm text-gray-300">{message}</p>
          </div>
        )}
      </section>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((rec) => {
              if (!rec.game) return null;

              const game = convertToRAWGGame(rec.game);
              return (
                <div key={rec.id} className="relative">
                  <GameCard game={game} />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-purple-400 font-semibold">
                      Match: {formatScore(rec.score)}
                    </span>
                    {rec.reason && (
                      <span className="text-gray-400 text-xs" title={rec.reason}>
                        {rec.reason.length > 30
                          ? rec.reason.substring(0, 30) + "..."
                          : rec.reason}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="gaming-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  🎯 Get Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-6 text-lg">
                  {isColdStart
                    ? "You don't have any recommendations yet. Click the button above to generate personalized recommendations based on popular games."
                    : "No recommendations found. Click 'Generate New Recommendations' to get started!"}
                </CardDescription>

                <div className="space-y-4 mb-6">
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
                      Suggest games you&apos;ll love
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleGenerateRecommendations}
                    disabled={generating}
                    className="gaming-button px-8 py-3"
                  >
                    {generating ? "Generating..." : "Generate Recommendations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
