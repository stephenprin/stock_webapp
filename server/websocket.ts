(async () => {
  try {
    const { getWebSocketServer } = await import("@/lib/services/websocket-server");
    
    const PORT = parseInt(process.env.WS_PORT || "8080", 10);
    
    const server = getWebSocketServer();
    server.start(PORT);
    
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down WebSocket server");
      server.stop();
      process.exit(0);
    });
    
    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down WebSocket server");
      server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start WebSocket server:", error);
    process.exit(1);
  }
})();

