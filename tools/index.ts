import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Import tool handlers
import { createSharedSummary, createSharedSummarySchema } from "./create_shared_summary.js";
import { getSummaries, getSummariesSchema } from "./get_summaries.js";
import { updateSharedSummary, updateSharedSummarySchema } from "./update_shared_summary.js";
import { deleteSharedSummary, deleteSharedSummarySchema } from "./delete_shared_summary.js";

export function registerTools(server: Server) {
  console.error("Registering tools with MCP server...");
  
  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("ListTools request received");
    return {
      tools: [
        {
          name: "create_shared_summary",
          description:
            "Step 1: Accept a title, summary, and author.\n" +
            "Step 2: Combine these into a note body.\n" +
            "Step 3: Create a new HubSpot Note engagement associated with a dedicated contact.",
          inputSchema: createSharedSummarySchema,
        },
        {
          name: "get_summaries",
          description:
            "Retrieve summary notes from HubSpot with flexible filters.\n" +
            "Optional filters:\n" +
            "  • date: (YYYY-MM-DD) to filter by a specific date.\n" +
            "  • dayOfWeek: e.g., 'Monday' to filter by day of the week.\n" +
            "  • limit: Number of most recent summaries to return.\n" +
            "  • timeRange: { start: 'HH:MM', end: 'HH:MM' } to filter by time of day.",
          inputSchema: getSummariesSchema,
        },
        {
          name: "update_shared_summary",
          description:
            "Step 1: Provide an explicit Engagement ID OR a search query (query) to locate the note.\n" +
            "Step 2: Retrieve the current note content.\n" +
            "Step 3: Merge existing values with any provided updates (title, summary, author).\n" +
            "Step 4: Update the note while preserving unchanged fields.",
          inputSchema: updateSharedSummarySchema,
        },
        {
          name: "delete_shared_summary",
          description:
            "Delete a summary note from HubSpot.\n" +
            "Either provide an explicit Engagement ID (id) or use optional filters (date, dayOfWeek, limit, timeRange) " +
            "to select a candidate note (e.g., 'delete my last summary').",
          inputSchema: deleteSharedSummarySchema,
        },
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error(`CallTool request received: ${JSON.stringify(request, null, 2)}`);
    
    if (!request.params) {
      console.error("No params object in request");
      throw new McpError(ErrorCode.InvalidParams, "No params object in request");
    }

    if (!request.params.name) {
      console.error("No tool name provided in request");
      throw new McpError(ErrorCode.InvalidParams, "No tool name provided");
    }

    if (!request.params.arguments) {
      console.error("No arguments provided for tool call");
      throw new McpError(ErrorCode.InvalidParams, "No arguments provided");
    }

    const toolName = request.params.name;
    const args = request.params.arguments;

    switch (toolName) {
      case "create_shared_summary": {
        const requiredArgs = args as { title: string; summary: string; author: string };
        if (!requiredArgs.title || !requiredArgs.summary || !requiredArgs.author) {
          console.error("Missing required arguments for create_shared_summary");
          throw new McpError(ErrorCode.InvalidParams, "Missing required arguments: title, summary, and author");
        }
        return await createSharedSummary(requiredArgs);
      }
      case "get_summaries": {
        const optionalArgs = args as { date?: string; dayOfWeek?: string; limit?: number; timeRange?: { start: string; end: string } };
        return await getSummaries(optionalArgs);
      }
      case "update_shared_summary": {
        const optionalArgs = args as { id?: string; query?: string; title?: string; summary?: string; author?: string };
        return await updateSharedSummary(optionalArgs);
      }
      case "delete_shared_summary": {
        const optionalArgs = args as { id?: string; date?: string; dayOfWeek?: string; limit?: number; timeRange?: { start: string; end: string } };
        return await deleteSharedSummary(optionalArgs);
      }
      default:
        console.error(`Unknown tool requested: ${toolName}`);
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  });
  
  console.error("Tool registration complete");
}