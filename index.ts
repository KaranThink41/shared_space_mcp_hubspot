import { HubSpotMcpServer } from "./server.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

console.error("Starting HubSpot MCP server...");

const server = new HubSpotMcpServer();
server.run().catch((error) => {
  console.error("[FATAL ERROR]", error);
  process.exit(1);
});