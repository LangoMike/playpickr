import { NextRequest, NextResponse } from "next/server";
import { getRandomGames } from "@/lib/rawg";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page") || "1")
      : undefined; // Let the function use random page if not provided
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const games = await getRandomGames(page, pageSize);

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching random games:", error);
    return NextResponse.json(
      { error: "Failed to fetch random games" },
      { status: 500 }
    );
  }
}
