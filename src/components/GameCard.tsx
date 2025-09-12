import Link from "next/link";
import Image from "next/image";
import { RAWGGame } from "@/lib/rawg";

interface GameCardProps {
  game: RAWGGame;
}

export function GameCard({ game }: GameCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRating = (rating: number) => {
    if (!rating) return "N/A";
    return rating.toFixed(1);
  };

  return (
    <Link href={`/games/${game.slug}`}>
      <div className="gaming-card group cursor-pointer overflow-hidden">
        {/* Game Background Image */}
        <div className="relative h-48 w-full overflow-hidden">
          {game.background_image ? (
            <Image
              src={game.background_image}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/70 rounded-full p-2">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="p-4">
          {/* Game Title */}
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
            {game.name}
          </h3>

          {/* Rating and Release Date */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{formatRating(game.rating)}</span>
            </div>
            <span className="text-xs">{formatDate(game.released)}</span>
          </div>

          {/* Platform Icons */}
          {game.platforms && game.platforms.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {game.platforms.slice(0, 4).map((platform, index) => (
                <div
                  key={index}
                  className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center"
                  title={platform.platform.name}
                >
                  <span className="text-xs text-white font-bold">
                    {platform.platform.name.charAt(0)}
                  </span>
                </div>
              ))}
              {game.platforms.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{game.platforms.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
