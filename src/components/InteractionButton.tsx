"use client";

import { Button } from "@/components/ui/button";

interface InteractionButtonProps {
  action: "like" | "favorite" | "played";
  isActive: boolean;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

const buttonConfig = {
  like: {
    activeIcon: "❤️",
    inactiveIcon: "🤍",
    activeText: "Liked",
    inactiveText: "Like",
    activeClass: "bg-red-500 hover:bg-red-600",
    inactiveClass: "gaming-button",
  },
  favorite: {
    activeIcon: "⭐",
    inactiveIcon: "☆",
    activeText: "Favorited",
    inactiveText: "Favorite",
    activeClass: "bg-yellow-500 hover:bg-yellow-600",
    inactiveClass: "gaming-button",
  },
  played: {
    activeIcon: "✅",
    inactiveIcon: "⭕",
    activeText: "Played",
    inactiveText: "Played Before",
    activeClass: "bg-green-500 hover:bg-green-600",
    inactiveClass: "gaming-button",
  },
};

export function InteractionButton({
  action,
  isActive,
  onClick,
  loading,
  disabled = false,
}: InteractionButtonProps) {
  const config = buttonConfig[action];

  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      className={`px-6 py-3 rounded-lg transition-all duration-200 ${
        isActive ? config.activeClass : config.inactiveClass
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">
          {loading ? "⏳" : isActive ? config.activeIcon : config.inactiveIcon}
        </span>
        <span>
          {loading
            ? "Loading..."
            : isActive
            ? config.activeText
            : config.inactiveText}
        </span>
      </span>
    </Button>
  );
}
