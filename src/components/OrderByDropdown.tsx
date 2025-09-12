"use client";

import { useState } from "react";

interface OrderByDropdownProps {
  currentOrder: string;
  onOrderChange: (order: string) => void;
}

const orderOptions = [
  { value: "-added", label: "Relevance" },
  { value: "-rating", label: "Rating" },
  { value: "-released", label: "Release Date" },
  { value: "-metacritic", label: "Metacritic" },
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
];

export function OrderByDropdown({
  currentOrder,
  onOrderChange,
}: OrderByDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel =
    orderOptions.find((option) => option.value === currentOrder)?.label ||
    "Relevance";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
      >
        <span className="text-sm">Order by: {currentLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20">
            {orderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onOrderChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  currentOrder === option.value
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
