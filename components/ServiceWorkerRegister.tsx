"use client";

import { useEffect } from "react";


export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[ServiceWorker] Registered successfully:", registration.scope);
          
          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[ServiceWorker] New service worker installed, reload to activate");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[ServiceWorker] Registration failed:", error);
        });
    }
  }, []);

  return null;
}

