import { NextRequest, NextResponse } from "next/server";
import { fetchGameTrailers } from "@/lib/rawg";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    
    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    const trailers = await fetchGameTrailers(parseInt(gameId));

    // Ensure we always return a consistent structure
    if (!trailers || !trailers.results) {
      return NextResponse.json({
        count: 0,
        next: null,
        previous: null,
        results: []
      });
    }

    return NextResponse.json(trailers);
  } catch (error: unknown) {
    // If game doesn't have trailers (404), return empty result instead of error
    // This is expected behavior, not an error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return NextResponse.json({
        count: 0,
        next: null,
        previous: null,
        results: []
      });
    }
    
    console.error("Error fetching game trailers:", error);
    return NextResponse.json(
      { error: "Failed to fetch game trailers" },
      { status: 500 }
    );
  }
}

