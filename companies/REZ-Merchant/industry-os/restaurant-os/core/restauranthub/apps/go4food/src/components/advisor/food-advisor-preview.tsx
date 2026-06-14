"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_QUESTIONS = [
  "Best biryani under ₹300?",
  "Healthy lunch options?",
  "Cheapest pizza nearby?",
  "What's trending today?",
];

export function FoodAdvisorPreview() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (question: string) => {
    setIsLoading(true);
    setResponse(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResponse(
      `Based on your preferences, here are some great options:\n\n🍚 **Meghana's Biryani** - ₹280 - 4.5⭐ - Famous for Hyderabadi biryani\n\n🍗 **Empire Restaurant** - ₹260 - 4.3⭐ - Classic Dum Biryani\n\n🌿 **Sri Udupi Park** - ₹220 - 4.4⭐ - Best veg biryani in town`
    );
    setIsLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl">AI Food Advisor</h3>
          <p className="text-white/80 text-sm">Ask anything about food</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4 min-h-[150px]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-white/80">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
            <span className="ml-2">Thinking...</span>
          </div>
        ) : response ? (
          <div className="text-sm whitespace-pre-wrap">{response}</div>
        ) : (
          <div className="text-white/60 text-sm">
            <p className="mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-white/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && message.trim()) {
              handleSubmit(message);
            }
          }}
        />
        <Button
          onClick={() => message.trim() && handleSubmit(message)}
          disabled={!message.trim() || isLoading}
          className="bg-white text-purple-600 hover:bg-white/90"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/advisor"
          className="text-white/80 hover:text-white text-sm underline"
        >
          Open full AI Advisor →
        </Link>
      </div>
    </div>
  );
}
