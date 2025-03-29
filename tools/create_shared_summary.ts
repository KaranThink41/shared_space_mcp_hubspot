import { checkHubSpotConfig } from "../server.js";

export const createSharedSummarySchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Title of the summary" },
    summary: { type: "string", description: "Content of the summary" },
    author: { type: "string", description: "Name of the author" },
  },
  required: ["title", "summary", "author"],
};

export async function createSharedSummary({ title, summary, author }: { title: string; summary: string; author: string }): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  console.error(`Creating shared summary with title: "${title}"`);
  
  const missing = checkHubSpotConfig();
  if (missing.length > 0) {
    console.error(`Error: Missing required environment variables: ${missing.join(", ")}`);
    return { content: [{ type: "text", text: `Error: Missing required environment variables: ${missing.join(", ")}` }], isError: true };
  }

  const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || "";
  const SHARED_CONTACT_ID = process.env.SHARED_CONTACT_ID || "";
  
  try {
    const noteBody = `Title: ${title}\nSummary: ${summary}\nAuthor: ${author}`;
    console.error("Making API request to HubSpot to create engagement");
    
    const res = await fetch("https://api.hubapi.com/engagements/v1/engagements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        engagement: { active: true, type: "NOTE", timestamp: new Date().getTime() },
        associations: { contactIds: [parseInt(SHARED_CONTACT_ID)] },
        metadata: { body: noteBody },
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error(`HubSpot API error: HTTP-Code: ${res.status}, Message: ${data.message}`);
      throw new Error(`HTTP-Code: ${res.status}\nMessage: ${data.message}`);
    }
    
    console.error(`Summary created successfully. Engagement ID: ${data.engagement.id}`);
    return { content: [{ type: "text", text: `Summary created successfully. Engagement ID: ${data.engagement.id}` }] };
  } catch (error: any) {
    console.error("Error creating summary:", error);
    return { content: [{ type: "text", text: `Error creating summary: ${error.message || "Unknown error"}` }], isError: true };
  }
}