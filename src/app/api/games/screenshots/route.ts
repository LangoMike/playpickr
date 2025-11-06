import { NextRequest, NextResponse } from "next/server";
import { fetchGameScreenshots } from "@/lib/rawg";

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

    const screenshots = await fetchGameScreenshots(parseInt(gameId));

    return NextResponse.json(screenshots);
  } catch (error) {
    console.error("Error fetching game screenshots:", error);
    return NextResponse.json(
      { error: "Failed to fetch game screenshots" },
      { status: 500 }
    );
  }
}


