"use client";

import { useEffect } from "react";

/**
 * Suppresses harmless TradingView/Snowplow console warnings
 * These are internal analytics warnings that don't affect functionality
 */
export function ConsoleFilter() {
  useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: unknown[]) => {
      const message = String(args[0] || "");
      // Suppress TradingView Snowplow environment warnings
      if (
        message.includes("Invalid environment") &&
        message.includes("snowplow")
      ) {
        return;
      }
      // Suppress Node.js url.parse() deprecation warning from web-push dependency
      if (
        message.includes("DEP0169") ||
        (message.includes("url.parse()") && message.includes("deprecation"))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      const message = String(args[0] || "");
     
      if (
        message.includes("Invalid environment") &&
        message.includes("snowplow")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return null;
}




