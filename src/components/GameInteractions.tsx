"use client";

import { useInteractions } from "@/hooks/useInteractions";
import { InteractionButton } from "./InteractionButton";

interface GameInteractionsProps {
  gameId: string;
}

export function GameInteractions({ gameId }: GameInteractionsProps) {
  const {
    liked,
    favorited,
    played,
    loading,
    toggleLike,
    toggleFavorite,
    togglePlayed,
  } = useInteractions(gameId);

  return (
    <div className="flex flex-wrap gap-4">
      <InteractionButton
        action="like"
        isActive={liked}
        onClick={toggleLike}
        loading={loading}
      />
      <InteractionButton
        action="favorite"
        isActive={favorited}
        onClick={toggleFavorite}
        loading={loading}
      />
      <InteractionButton
        action="played"
        isActive={played}
        onClick={togglePlayed}
        loading={loading}
      />
    </div>
  );
}
