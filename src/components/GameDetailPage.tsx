import Image from "next/image";
import Link from "next/link";
import { RAWGGame } from "@/lib/rawg";
import { GameInteractions } from "@/components/GameInteractions";
import { Button } from "@/components/ui/button";

interface GameDetailPageProps {
  game: RAWGGame;
}

export function GameDetailPage({ game }: GameDetailPageProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 4.0) return "text-blue-400";
    if (rating >= 3.0) return "text-orange-400";
    return "text-red-400";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Exceptional";
    if (rating >= 4.0) return "Recommended";
    if (rating >= 3.0) return "Meh";
    return "Skip";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Background Image */}
      {game.background_image && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-0"
          style={{ top: "80px" }}
        >
          <Image
            src={game.background_image}
            alt={game.name}
            fill
            className="object-cover opacity-10"
            priority
          />
        </div>
      )}

      {/* PLACEHOLDER: Top Contributors - will implement after mvp completion*/}
      {/* PLACEHOLDER: Collections - will implement after mvp completion*/}
      {/* PLACEHOLDER: Edit Game Info - will implement after mvp completion*/}
      {/* PLACEHOLDER: Write a review - will implement after mvp completion*/}
      {/* PLACEHOLDER: Write a comment - will implement after mvp completion*/}

      {/* Content */}
      <div className="relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-2">
            <nav className="text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                HOME
              </Link>
              <span className="mx-2">/</span>
              <Link
                href="/games"
                className="hover:text-white transition-colors"
              >
                GAMES
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">
                {game.name.toUpperCase()}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Game Header */}
              <div className="space-y-4">
                {/* Release Date and Platforms */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="font-semibold text-white">
                    {formatDate(game.released)}
                  </span>
                  {game.platforms && game.platforms.length > 0 && (
                    <div className="flex items-center gap-2">
                      {game.platforms.slice(0, 6).map((platform, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 bg-gray-600 rounded-sm flex items-center justify-center"
                          title={platform.platform.name}
                        >
                          <span className="text-xs text-white font-bold">
                            {platform.platform.name.charAt(0)}
                          </span>
                        </div>
                      ))}
                      {game.platforms.length > 6 && (
                        <span className="text-xs text-gray-400">
                          +{game.platforms.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                  {game.playtime && (
                    <span>AVERAGE PLAYTIME: {game.playtime} HOURS</span>
                  )}
                </div>

                {/* Game Title */}
                <h1 className="text-4xl font-bold text-white">{game.name}</h1>

                {/* Interaction Buttons */}
                <div className="flex flex-wrap gap-4">
                  <GameInteractions gameId={game.slug} />
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    Add to Wishlist
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                      />
                    </svg>
                    Save to Collection
                  </Button>
                </div>

                {/* Rating and Rankings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-semibold ${getRatingColor(
                          game.rating
                        )}`}
                      >
                        {getRatingLabel(game.rating)}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-400">114 RATINGS</span>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <span className="text-gray-400">
                      #{Math.floor(Math.random() * 200) + 1} PLATFORMER
                    </span>
                    <span className="text-gray-400">
                      #{Math.floor(Math.random() * 10) + 1} TOP 2025
                    </span>
                  </div>
                </div>

                {/* User Rating Bar */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Click to rate</p>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 via-blue-500 via-orange-500 to-red-500 rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Exceptional 63</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Recommended 28</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Meh 9</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Skip 14</span>
                    </div>
                  </div>
                </div>

                {/* Review Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    + Write a review 114
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Write a comment
                  </Button>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">About</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {game.description_raw ||
                      (game.description
                        ? game.description.replace(/<[^>]*>/g, "") // Remove HTML tags
                        : "No description available for this game.")}
                  </p>
                </div>

                {/* Game Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Platforms</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.platforms?.map((platform, index) => (
                          <Link
                            key={index}
                            href={`/games?platform=${platform.platform.slug}`}
                            className="text-white hover:text-purple-400 transition-colors underline"
                          >
                            {platform.platform.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">
                        Release date
                      </h3>
                      <p className="font-semibold">
                        {formatDate(game.released)}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Publisher</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.publishers?.map((publisher, index) => (
                          <Link
                            key={index}
                            href={`/games?publisher=${publisher.slug}`}
                            className="text-white hover:text-purple-400 transition-colors underline"
                          >
                            {publisher.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.tags?.slice(0, 10).map((tag, index) => (
                          <Link
                            key={index}
                            href={`/games?tag=${tag.slug}`}
                            className="text-white hover:text-purple-400 transition-colors underline"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {game.website && (
                      <div>
                        <h3 className="text-sm text-gray-400 mb-1">Website</h3>
                        <Link
                          href={game.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-purple-400 transition-colors underline"
                        >
                          {game.website}
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Genre</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.genres?.map((genre, index) => (
                          <Link
                            key={index}
                            href={`/games?genre=${genre.slug}`}
                            className="text-white hover:text-purple-400 transition-colors underline"
                          >
                            {genre.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Developer</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.developers?.map((developer, index) => (
                          <Link
                            key={index}
                            href={`/games?developer=${developer.slug}`}
                            className="text-white hover:text-purple-400 transition-colors underline"
                          >
                            {developer.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Age rating</h3>
                      <p className="font-semibold">Not rated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Media Gallery */}
              {(game.short_screenshots && game.short_screenshots.length > 0) ||
              (game.movies && game.movies.length > 0) ? (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Media</h3>

                  {/* Video Player */}
                  {game.movies && game.movies.length > 0 && (
                    <div className="mb-6">
                      <div className="relative w-full h-48 bg-gray-700 rounded-lg overflow-hidden">
                        <Image
                          src={game.movies[0].preview}
                          alt={game.movies[0].name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <svg
                              className="w-6 h-6 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Play full video
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Screenshots Grid */}
                  {game.short_screenshots &&
                    game.short_screenshots.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {game.short_screenshots
                          .slice(0, 4)
                          .map((screenshot, index) => (
                            <div
                              key={screenshot.id}
                              className="relative w-full h-24 bg-gray-700 rounded overflow-hidden"
                            >
                              <Image
                                src={screenshot.image}
                                alt={`Screenshot ${index + 1}`}
                                fill
                                className="object-cover hover:scale-105 transition-transform cursor-pointer"
                              />
                            </div>
                          ))}
                        {game.short_screenshots.length > 4 && (
                          <div className="relative w-full h-24 bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              view all
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : null}

              {/* Where to Buy */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Where to buy</h3>
                <div className="space-y-3">
                  {game.stores?.slice(0, 2).map((store, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {store.store.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Top Contributors - will*/}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Top contributors</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((contributor) => (
                    <div key={contributor} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {String.fromCharCode(65 + contributor)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Contributor {contributor}
                        </p>
                        <p className="text-xs text-gray-400">
                          {Math.floor(Math.random() * 20) + 1} edits
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collections */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">
                    Collections with {game.name}
                  </h3>
                  <Link
                    href="#"
                    className="text-sm text-gray-400 hover:text-white underline"
                  >
                    2 collections
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-xs">IMG</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Switch Games</p>
                      <p className="text-xs text-gray-400">
                        1075 GAMES • 33 CAKES
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-xs">IMG</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Indie Collection</p>
                      <p className="text-xs text-gray-400">
                        234 GAMES • 12 CAKES
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Game Info */}
              <div className="bg-gray-800 rounded-lg p-6">
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit the game info
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  Last Modified: {formatDate(game.released)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
