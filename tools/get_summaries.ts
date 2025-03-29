import { checkHubSpotConfig } from "../server.js";

export const getSummariesSchema = {
  type: "object",
  properties: {
    date: { type: "string", description: "Optional: Date in YYYY-MM-DD format" },
    dayOfWeek: { type: "string", description: "Optional: Day of the week (e.g., Monday)" },
    limit: { type: "integer", minimum: 1, description: "Optional: Number of summaries to return" },
    timeRange: {
      type: "object",
      properties: {
        start: { type: "string", description: "Optional: Start time in HH:MM" },
        end: { type: "string", description: "Optional: End time in HH:MM" },
      },
      description: "Optional: Time range filter",
    },
  },
};

export async function getSummaries({ date, dayOfWeek, limit, timeRange }: { date?: string; dayOfWeek?: string; limit?: number; timeRange?: { start: string; end: string } }): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  console.error(`Getting summaries with filters: ${JSON.stringify({ date, dayOfWeek, limit, timeRange })}`);
  
  const missing = checkHubSpotConfig();
  if (missing.length > 0) {
    console.error(`Error: Missing required environment variables: ${missing.join(", ")}`);
    return { content: [{ type: "text", text: `Error: Missing required environment variables: ${missing.join(", ")}` }], isError: true };
  }

  const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || "";
  
  try {
    console.error("Making API request to HubSpot to retrieve engagements");
    
    const res = await fetch("https://api.hubapi.com/engagements/v1/engagements/paged?limit=100", {
      method: "GET",
      headers: { "Authorization": `Bearer ${HUBSPOT_ACCESS_TOKEN}` },
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error(`HubSpot API error: HTTP-Code: ${res.status}, Message: ${data.message}`);
      throw new Error(`HTTP-Code: ${res.status}\nMessage: ${data.message}`);
    }
    
    console.error(`Retrieved ${data.results.length} engagements from HubSpot`);
    
    let results = data.results;
    if (date) {
      console.error(`Filtering by date: ${date}`);
      results = results.filter((record: any) => {
        const ts = record.engagement.timestamp;
        return new Date(ts).toISOString().split("T")[0] === date;
      });
      console.error(`After date filter: ${results.length} results remaining`);
    }
    
    if (dayOfWeek) {
      console.error(`Filtering by day of week: ${dayOfWeek}`);
      const dayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      const targetDay = dayMap[dayOfWeek.toLowerCase()];
      if (targetDay === undefined) {
        throw new Error(`Invalid dayOfWeek provided: ${dayOfWeek}`);
      }
      results = results.filter((record: any) => {
        const ts = record.engagement.timestamp;
        return new Date(ts).getDay() === targetDay;
      });
      console.error(`After dayOfWeek filter: ${results.length} results remaining`);
    }
    
    if (timeRange && timeRange.start && timeRange.end) {
      console.error(`Filtering by time range: ${timeRange.start} to ${timeRange.end}`);
      results = results.filter((record: any) => {
        const ts = record.engagement.timestamp;
        const dateObj = new Date(ts);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const currentTime = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
        return currentTime >= timeRange.start && currentTime <= timeRange.end;
      });
      console.error(`After timeRange filter: ${results.length} results remaining`);
    }
    
    console.error("Sorting results by timestamp (descending)");
    results.sort((a: any, b: any) => b.engagement.timestamp - a.engagement.timestamp);
    
    if (limit && limit > 0) {
      console.error(`Limiting to ${limit} results`);
      results = results.slice(0, limit);
    } else if (limit && limit < 1) {
      throw new Error("Limit must be a positive number greater than 0");
    }
    
    console.error(`Returning ${results.length} results`);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  } catch (error: any) {
    console.error("Error retrieving summaries:", error);
    return { content: [{ type: "text", text: `Error retrieving summaries: ${error.message}` }], isError: true };
  }
}