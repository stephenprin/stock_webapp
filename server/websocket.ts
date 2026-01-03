import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

(async () => {
  try {
    const { getWebSocketServer } = await import("@/lib/services/websocket-server");
    
    const PORT = parseInt(process.env.WS_PORT || "8080", 10);
    const server = getWebSocketServer();
    server.start(PORT);
    
    process.on("SIGTERM", () => {
      server.stop();
      process.exit(0);
    });
    
    process.on("SIGINT", () => {
      server.stop();
      process.exit(0);
    });
  } catch (error) {
    process.exit(1);
  }
})();

