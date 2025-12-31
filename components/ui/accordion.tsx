"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface AccordionProps {
  items: Array<{
    id: string;
    question: string;
    answer: React.ReactNode;
  }>;
  defaultOpen?: string;
  className?: string;
}

export function Accordion({ items, defaultOpen, className }: AccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpen || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="border border-gray-700 rounded-lg bg-gray-800 overflow-hidden"
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-white pr-4">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-400 flex-shrink-0 transition-transform",
                  isOpen && "transform rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

