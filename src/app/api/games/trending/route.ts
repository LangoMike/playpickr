import { NextRequest, NextResponse } from "next/server";
import { getTrendingGames } from "@/lib/rawg";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const ordering = searchParams.get("ordering") || "-added";

    const games = await getTrendingGames(page, pageSize, ordering);

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching trending games:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending games" },
      { status: 500 }
    );
  }
}
