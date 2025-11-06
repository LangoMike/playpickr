"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { RAWGScreenshot, RAWGTrailer } from "@/lib/rawg";
import { Button } from "@/components/ui/button";

interface GameImageCarouselProps {
  gameId: number;
  mainImage?: string; // Fallback to game's background_image if no screenshots
}

interface CarouselItem {
  id: number;
  type: "image" | "video";
  image: string; // Preview image or screenshot
  videoUrl?: string; // Video URL for trailers
  name?: string; // Trailer name
}

export function GameImageCarousel({
  gameId,
  mainImage,
}: GameImageCarouselProps) {
  const [screenshots, setScreenshots] = useState<RAWGScreenshot[]>([]);
  const [trailer, setTrailer] = useState<RAWGTrailer | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Build carousel items: main image, then trailer (if exists), then screenshots
  const allItems: CarouselItem[] = [];

  // 1. Main image (always first if it exists)
  if (mainImage) {
    allItems.push({
      id: -1,
      type: "image",
      image: mainImage,
    });
  }

  // 2. Trailer (second item if it exists)
  if (trailer) {
    allItems.push({
      id: trailer.id,
      type: "video",
      image: trailer.preview,
      videoUrl: trailer.data.max || trailer.data["480"],
      name: trailer.name,
    });
  }

  // 3. Screenshots (after main image and trailer)
  screenshots.forEach((screenshot) => {
    allItems.push({
      id: screenshot.id,
      type: "image",
      image: screenshot.image,
    });
  });

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
  }, [allItems.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
  }, [allItems.length]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);

        // Fetch screenshots and trailer in parallel
        const [screenshotsResponse, trailersResponse] = await Promise.all([
          fetch(`/api/games/screenshots?gameId=${gameId}`),
          fetch(`/api/games/trailers?gameId=${gameId}`),
        ]);

        if (screenshotsResponse.ok) {
          const screenshotsData = await screenshotsResponse.json();
          // Filter out deleted screenshots
          const validScreenshots = (screenshotsData.results || []).filter(
            (screenshot: RAWGScreenshot) => !screenshot.is_deleted
          );
          setScreenshots(validScreenshots);
        }

        if (trailersResponse.ok) {
          const trailersData = await trailersResponse.json();
          if (trailersData.results && trailersData.results.length > 0) {
            // Try to find the best trailer: prefer ones with "trailer" in the name
            // (to avoid gameplay videos, DLC trailers, etc.)
            const trailers = trailersData.results;
            const officialTrailer = trailers.find((t: RAWGTrailer) =>
              t.name.toLowerCase().includes("trailer")
            );

            // Use the official trailer if found, otherwise use the first one
            const selectedTrailer = officialTrailer || trailers[0];

            if (selectedTrailer) {
              setTrailer(selectedTrailer);
              console.log(
                `Selected trailer for game ${gameId}:`,
                selectedTrailer.name
              );
            }
          } else {
            console.log(`No trailers available for game ${gameId}`);
          }
        } else {
          console.log(
            `Trailer API returned non-OK status for game ${gameId}:`,
            trailersResponse.status
          );
        }

        setCurrentIndex(0); // Reset to first item when new media loads
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchMedia();
    }
  }, [gameId]);

  // Keyboard navigation
  useEffect(() => {
    if (allItems.length <= 1) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [allItems.length, goToPrevious, goToNext]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Loading media...</span>
      </div>
    );
  }

  if (allItems.length === 0) {
    return null;
  }

  const currentItem = allItems[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Media Display with Navigation Arrows */}
      <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden group">
        {currentItem.type === "video" && currentItem.videoUrl ? (
          // Video Player for Trailer
          <video
            src={currentItem.videoUrl}
            controls
            className="absolute inset-0 w-full h-full object-cover"
            poster={currentItem.image}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          // Image Display
          <Image
            src={currentItem.image}
            alt={currentItem.name || `Game media ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />
        )}

        {/* Video Indicator Badge */}
        {currentItem.type === "video" && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded text-sm font-semibold">
            🎬 Trailer
          </div>
        )}

        {/* Navigation Arrows */}
        {allItems.length > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              size="icon"
              variant="outline"
            >
              <svg
                className="w-6 h-6"
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
            </Button>
            <Button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              size="icon"
              variant="outline"
            >
              <svg
                className="w-6 h-6"
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
          </>
        )}

        {/* Media Counter */}
        {allItems.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
            {currentIndex + 1} / {allItems.length}
          </div>
        )}
      </div>

      {/* Thumbnail Carousel */}
      {allItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {allItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToImage(index)}
              className={`relative flex-shrink-0 w-24 h-16 bg-gray-800 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-purple-500 ring-2 ring-purple-500/50"
                  : "border-transparent hover:border-gray-600"
              }`}
            >
              <Image
                src={item.image}
                alt={item.name || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {/* Play Icon Overlay for Video Thumbnails */}
              {item.type === "video" && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
