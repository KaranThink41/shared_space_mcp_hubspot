import { checkHubSpotConfig } from "../server.js";

export const updateSharedSummarySchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Optional: Engagement ID of the note" },
    query: { type: "string", description: "Optional: Keyword to search in note content" },
    title: { type: "string", description: "Optional: Updated title" },
    summary: { type: "string", description: "Optional: Updated content" },
    author: { type: "string", description: "Optional: Updated author" },
  },
};

export async function updateSharedSummary({ id, query, title, summary, author }: { id?: string; query?: string; title?: string; summary?: string; author?: string }): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  console.error(`Updating shared summary with params: ${JSON.stringify({ id, query, title, summary, author })}`);
  
  const missing = checkHubSpotConfig();
  if (missing.length > 0) {
    console.error(`Error: Missing required environment variables: ${missing.join(", ")}`);
    return { content: [{ type: "text", text: `Error: Missing required environment variables: ${missing.join(", ")}` }], isError: true };
  }

  const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || "";
  
  try {
    let targetId: string | undefined = id;
    
    if (!targetId && query) {
      console.error(`No ID provided, searching for notes with query: "${query}"`);
      
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
      
      let candidates = data.results.filter((record: any) => {
        const body = record.metadata.body || "";
        return body.toLowerCase().includes(query.toLowerCase());
      });
      
      console.error(`Found ${candidates.length} notes matching query "${query}"`);
      
      candidates.sort((a: any, b: any) => b.engagement.timestamp - a.engagement.timestamp);
      
      if (candidates.length === 0) {
        throw new Error("No summary found matching the provided query.");
      }
      
      targetId = candidates[0].engagement.id;
      console.error(`Selected note with ID: ${targetId}`);
    }
    
    if (!targetId) {
      throw new Error("Please provide an Engagement ID or a search query to locate the summary note.");
    }
    
    console.error(`Retrieving current content for note with ID: ${targetId}`);
    const getRes = await fetch(`https://api.hubapi.com/engagements/v1/engagements/${targetId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${HUBSPOT_ACCESS_TOKEN}` },
    });
    
    const getData = await getRes.json();
    if (!getRes.ok) {
      console.error(`HubSpot API error: HTTP-Code: ${getRes.status}, Message: ${getData.message}`);
      throw new Error(`HTTP-Code: ${getRes.status}\nMessage: ${getData.message}`);
    }
    
    const currentBody = getData.metadata.body;
    let currentTitle = "";
    let currentSummary = "";
    let currentAuthor = "";
    
    console.error("Parsing current note content");
    const lines = currentBody.split("\n");
    lines.forEach((line: string) => {
      if (line.startsWith("Title: ")) {
        currentTitle = line.replace("Title: ", "");
      } else if (line.startsWith("Summary: ")) {
        currentSummary = line.replace("Summary: ", "");
      } else if (line.startsWith("Author: ")) {
        currentAuthor = line.replace("Author: ", "");
      }
    });
    
    const newTitle = title || currentTitle;
    const newSummary = summary || currentSummary;
    const newAuthor = author || currentAuthor;
    
    console.error("Preparing updated note content");
    const updatedBody = `Title: ${newTitle}\nSummary: ${newSummary}\nAuthor: ${newAuthor}`;
    
    console.error(`Updating note with ID: ${targetId}`);
    const resUpdate = await fetch(`https://api.hubapi.com/engagements/v1/engagements/${targetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ metadata: { body: updatedBody } }),
    });
    
    const dataUpdate = await resUpdate.json();
    if (!resUpdate.ok) {
      console.error(`HubSpot API error: HTTP-Code: ${resUpdate.status}, Message: ${dataUpdate.message}`);
      throw new Error(`HTTP-Code: ${resUpdate.status}\nMessage: ${dataUpdate.message}`);
    }
    
    console.error(`Summary updated successfully. Engagement ID: ${dataUpdate.engagement.id}`);
    return { content: [{ type: "text", text: `Summary updated successfully. Engagement ID: ${dataUpdate.engagement.id}` }] };
  } catch (error: any) {
    console.error("Error updating summary:", error);
    return { content: [{ type: "text", text: `Error updating summary: ${error.message}` }], isError: true };
  }
}