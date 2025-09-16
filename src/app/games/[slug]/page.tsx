import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { fetchGameBySlug, RAWGGame } from "@/lib/rawg";
import { GameDetailPage } from "@/components/GameDetailPage";

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;

  try {
    // Fetch game data from RAWG API
    const game: RAWGGame = await fetchGameBySlug(slug);

    return <GameDetailPage game={game} />;
  } catch (error) {
    console.error("Error fetching game:", error);
    notFound();
  }
}
