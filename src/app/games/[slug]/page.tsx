import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { GameInteractions } from "@/components/GameInteractions";

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Try to get the game from database first
  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !game) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GameInteractions game={game} />
    </div>
  );
}
