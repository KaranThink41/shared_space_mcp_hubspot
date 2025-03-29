import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client as HubSpotClient } from "@hubspot/api-client";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { createSharedSummarySchema } from "./tools/create_shared_summary.js";
import { getSummariesSchema } from "./tools/get_summaries.js";
import { updateSharedSummarySchema } from "./tools/update_shared_summary.js";
import { deleteSharedSummarySchema } from "./tools/delete_shared_summary.js";
import { registerTools } from "./tools/index.js";

// Export helper function to check required HubSpot configuration
export function checkHubSpotConfig() {
  const missing = [];
  const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || "";
  const SHARED_CONTACT_ID = process.env.SHARED_CONTACT_ID || "";
  
  if (!HUBSPOT_ACCESS_TOKEN) missing.push("HUBSPOT_ACCESS_TOKEN");
  if (!SHARED_CONTACT_ID) missing.push("SHARED_CONTACT_ID");
  
  return missing;
}

export class HubSpotMcpServer {
  private server: Server;
  private hubspotClient: HubSpotClient;

  constructor() {
    console.error("Initializing HubSpot MCP server...");
    
    // Log environment variable status
    const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || "";
    const SHARED_CONTACT_ID = process.env.SHARED_CONTACT_ID || "";
    
    if (!HUBSPOT_ACCESS_TOKEN) {
      console.error("WARNING: HUBSPOT_ACCESS_TOKEN is missing. HubSpot integration features will be disabled.");
    } else {
      console.error("INFO: HUBSPOT_ACCESS_TOKEN is configured.");
    }
    
    if (!SHARED_CONTACT_ID) {
      console.error("WARNING: SHARED_CONTACT_ID is missing. HubSpot integration features will be disabled.");
    } else {
      console.error("INFO: SHARED_CONTACT_ID is configured.");
    }
    
    // Initialize MCP server with metadata
    this.server = new Server({
      name: "hubspot-mcp-server",
      version: "0.1.0",
      description:
        "A HubSpot integration server that creates, retrieves, updates, and deletes summary notes.\n" +
        "Tools include:\n" +
        "  • create_shared_summary: Create a note using title, summary, and author.\n" +
        "  • get_summaries: Retrieve notes with flexible filters (date, dayOfWeek, limit, timeRange).\n" +
        "  • update_shared_summary: Update a note by Engagement ID or search query.\n" +
        "  • delete_shared_summary: Delete a note by Engagement ID or via filters.",
    }, {
      capabilities: {
        tools: {
          create_shared_summary: {
            description: "Create a new shared summary for a contact",
            inputSchema: createSharedSummarySchema
          },
          get_summaries: {
            description: "Retrieve summary notes with optional filters",
            inputSchema: getSummariesSchema
          },
          update_shared_summary: {
            description: "Update an existing summary note",
            inputSchema: updateSharedSummarySchema
          },
          delete_shared_summary: {
            description: "Delete a summary note",
            inputSchema: deleteSharedSummarySchema
          }
        }
      }
    });

    // Initialize HubSpot API client
    this.hubspotClient = new HubSpotClient({
      accessToken: HUBSPOT_ACCESS_TOKEN,
    });
    console.error("HubSpot client initialized");

    // Register all tools with the server
    try {
      registerTools(this.server);
      console.error("Tools registered successfully");
    } catch (error) {
      console.error("Failed to register tools:", error);
      this.server.onerror = (error) => console.error("[MCP Error]", error);
      throw error;
    }

    // Global error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    
    process.on("SIGINT", async () => {
      console.error("Received SIGINT signal, shutting down...");
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server using STDIO transport.
   */
  async run() {
    const transport = new StdioServerTransport();
    console.error("Setting up StdioServerTransport...");
    
    try {
      await this.server.connect(transport);
      console.error("HubSpot MCP server running on STDIO");
      // Block indefinitely without relying on STDIN by awaiting a never-resolving promise.
      await new Promise(() => {});
    } catch (error) {
      console.error("Failed to connect to transport:", error);
      throw error;
    }
  }
}