"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEARCH_SUGGESTIONS } from "@shared/constants";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  size?: "default" | "large";
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Search for food...",
  size = "default",
  className,
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState(controlledValue || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue ?? internalValue;

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }

    // Show suggestions based on input
    if (newValue.length > 0) {
      const filtered = SEARCH_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered.length > 0 ? filtered : []);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (query: string = value) => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    onSearch?.(query);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange("");
    } else {
      setInternalValue("");
    }
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onChange) {
      onChange(suggestion);
    } else {
      setInternalValue(suggestion);
    }
    handleSearch(suggestion);
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative flex items-center bg-white rounded-xl border border-gray-200 shadow-sm",
          "focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500",
          "transition-all",
          size === "large" ? "h-14 px-6" : "h-12 px-4"
        )}
      >
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="flex-1 h-full px-3 outline-none text-gray-900 placeholder:text-gray-400"
        />
        {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
        {value && !isLoading && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Mic className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches (when empty) */}
      {showSuggestions && !value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold bg-gray-50">
            Recent Searches
          </div>
          <button
            onClick={() => handleSuggestionClick("Chicken Biryani")}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">Chicken Biryani</span>
          </button>
          <button
            onClick={() => handleSuggestionClick("Pizza delivery")}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">Pizza delivery</span>
          </button>
        </div>
      )}
    </div>
  );
}
