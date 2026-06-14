"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, ThumbsUp, ExternalLink } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { AdvisorMessage, AdvisorRecommendation } from "@shared/types";

const MOCK_RESPONSES: Record<string, { message: string; recommendations: AdvisorRecommendation[] }> = {
  default: {
    message: `Here are some great options for you:\n\n🍚 **Meghana's Biryani** - ₹280 - 4.5⭐ - Famous for Hyderabadi biryani in Koramangala\n\n🍗 **Empire Restaurant** - ₹260 - 4.3⭐ - Classic Dum Biryani with extra raita\n\n🌿 **Sri Udupi Park** - ₹220 - 4.4⭐ - Best veg biryani alternative in town\n\nAll options are open now and deliver within 30-40 minutes.`,
    recommendations: [
      {
        dish: {
          id: "1",
          name: "Chicken Biryani",
          image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
        },
        restaurant: {
          id: "1",
          name: "Meghana's Biryani",
          rating: 4.5,
        },
        price: 280,
        reason: "Highest rated biryani nearby",
        score: 95,
      },
    ],
  },
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI Food Advisor. Ask me anything about food!\n\nYou can say things like:\n• What should I eat under ₹300?\n• Best protein meal near me?\n• Healthy dinner options?\n• Cheapest pizza in Koramangala?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AdvisorMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = MOCK_RESPONSES.default;
    const assistantMessage: AdvisorMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      recommendations: response.recommendations,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">AI Food Advisor</h1>
          </div>
          <p className="text-purple-100">
            Get personalized food recommendations powered by AI
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4">
        <div className="bg-white rounded-2xl border shadow-sm h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-purple-500 text-white"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "flex-1 max-w-[80%]",
                    message.role === "user" && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-left",
                      message.role === "user"
                        ? "bg-orange-500 text-white rounded-tr-none"
                        : "bg-gray-100 rounded-tl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Recommendations */}
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rec.dish.name}</h4>
                              <p className="text-sm text-gray-500">
                                {rec.restaurant.name} • ⭐ {rec.restaurant.rating}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {rec.reason}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600">
                                {formatCurrency(rec.price)}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${rec.score}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">
                                  {rec.score}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="mt-2 w-full py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
                            View Restaurant
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {message.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Biryani under ₹300",
                "Best pizza nearby",
                "Healthy lunch",
                "Cheapest burgers",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about food..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
