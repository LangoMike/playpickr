"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { OrderByDropdown } from "@/components/OrderByDropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RAWGGame, RAWGSearchResult } from "@/lib/rawg";

export default function GamesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<RAWGGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState("-added");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
  }>({
    count: 0,
    next: null,
    previous: null,
  });
  const pageSize = 20;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to page 1 when search query changes
      setCurrentPage(1);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentOrder]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setGamesLoading(true);

        let url: string;
        if (debouncedSearchQuery.trim()) {
          // Use search API if there's a search query
          url = `/api/games/search?query=${encodeURIComponent(
            debouncedSearchQuery.trim()
          )}&page=${currentPage}&pageSize=${pageSize}`;
        } else {
          // Use trending API if no search query
          url = `/api/games/trending?ordering=${currentOrder}&page=${currentPage}&pageSize=${pageSize}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data: RAWGSearchResult = await response.json();
          setGames(data.results);
          setPaginationData({
            count: data.count,
            next: data.next,
            previous: data.previous,
          });

          // Scroll to top when page changes or new data loads
          window.scrollTo({ top: 0, behavior: "smooth" });
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
  }, [user, currentOrder, debouncedSearchQuery, currentPage, pageSize]);

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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search games by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full gaming-input"
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {/* Pagination Controls */}
            {paginationData.count > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, paginationData.count)} of{" "}
                  {paginationData.count.toLocaleString()} games
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={!paginationData.previous || gamesLoading}
                    className="gaming-button"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Page number buttons */}
                    {(() => {
                      const totalPages = Math.ceil(
                        paginationData.count / pageSize
                      );
                      const maxVisiblePages = 7;
                      const pages: (number | string)[] = [];

                      if (totalPages <= maxVisiblePages) {
                        // Show all pages if total is less than max
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show first page
                        pages.push(1);

                        // Calculate start and end of middle pages
                        let start = Math.max(2, currentPage - 1);
                        let end = Math.min(totalPages - 1, currentPage + 1);

                        // Adjust if we're near the start
                        if (currentPage <= 3) {
                          start = 2;
                          end = 4;
                        }

                        // Adjust if we're near the end
                        if (currentPage >= totalPages - 2) {
                          start = totalPages - 3;
                          end = totalPages - 1;
                        }

                        // Add ellipsis and middle pages
                        if (start > 2) {
                          pages.push("...");
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        if (end < totalPages - 1) {
                          pages.push("...");
                        }

                        // Show last page
                        pages.push(totalPages);
                      }

                      return pages.map((page, index) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-3 py-2 text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }

                        const pageNum = page as number;
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={gamesLoading}
                            className={
                              currentPage === pageNum
                                ? "gaming-button"
                                : "gaming-button"
                            }
                            size="sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!paginationData.next || gamesLoading}
                    className="gaming-button"
                  >
                    Next
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
