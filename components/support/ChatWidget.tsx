"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Minimize2, Send, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import ChatMessage from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "@/types/support-chat";
import { useSubscription } from "@/lib/hooks/useSubscription";
import PrioritySupportBadge from "./PrioritySupportBadge";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isPro, isEnterprise, loading: subscriptionLoading } = useSubscription();

  const hasAccess = isPro || isEnterprise;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
      state: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();
      
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        state: "sent",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please try again.`
          : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        state: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (subscriptionLoading) {
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          aria-label="Open AI chat support"
        >
          <Bot className="h-6 w-6 text-gray-900 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[400px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col transition-all duration-300",
            isMinimized ? "h-16" : "h-[600px]"
          )}
        >
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-900" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  AI Support Assistant
                </h3>
                <div className="flex items-center gap-2">
                  <PrioritySupportBadge variant="compact" />
                  <span className="text-xs text-gray-800">
                    {isEnterprise ? "Dedicated" : "Priority"} Support
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0 hover:bg-gray-800/20 text-gray-900"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="h-7 w-7 p-0 hover:bg-gray-800/20 text-gray-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-sm">
                      Hi! I'm your AI support assistant. How can I help you today?
                    </p>
                    <p className="text-xs mt-2 text-gray-500">
                      Ask me about features, subscriptions, portfolio management, or any questions about Stock Tracker.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 mb-4">
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-700 rounded-lg rounded-tl-none px-4 py-2.5">
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-700 p-3">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by Stock tracker • Your conversations are private
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

