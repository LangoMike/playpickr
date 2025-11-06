import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/rawg";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ordering = searchParams.get("ordering") || "-relevance";

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const games = await searchGames(query.trim(), page, pageSize);

    // Apply ordering if specified (RAWG API handles relevance by default for search)
    // If a custom ordering is needed, we can sort the results
    if (ordering !== "-relevance") {
      // For now, RAWG search API handles relevance automatically
      // If we need custom sorting, we'd need to fetch ordered results differently
      // This is a simplified version - RAWG search uses relevance by default
    }

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error searching games:", error);
    return NextResponse.json(
      { error: "Failed to search games" },
      { status: 500 }
    );
  }
}


