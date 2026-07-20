import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Initialize the client pointing to Perplexity's API endpoint
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Helper to write dedicated AI logs without flooding the main console
function logAiDebug(location, dateRange, prompt, summary, citations) {
  const isDocker = process.env.NODE_ENV === 'production';
  const logDir = isDocker ? '/app/data' : path.resolve('../shared-data');
  const logPath = path.join(logDir, 'ai_debug.log');
  
  const timestamp = new Date().toISOString();
  const logEntry = `\n=================================================\n` +
                   `[${timestamp}] AI CALL FOR: ${location} (${dateRange})\n` +
                   `=================================================\n` +
                   `--- PROMPT SENT ---\n${prompt.trim()}\n\n` +
                   `--- RAW SUMMARY RECEIVED ---\n${summary}\n\n` +
                   `--- CITATIONS ---\n${JSON.stringify(citations, null, 2)}\n` +
                   `=================================================\n`;

  try {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (err) {
    console.error("Failed to write to ai_debug.log:", err);
  }
}

/**
 * Searches the web and generates a single cohesive summary for the Prime Minister's entire multi-day stay at a location.
 * @param {string} arrivalDate - The day the PM arrived (e.g., "2026-06-15")
 * @param {string} departureDate - The day the PM departed (e.g., "2026-06-17")
 * @param {string} location - The location of the stay (e.g., "Évian, France")
 * @param {Array<{date: string, activities: string[]}>} itineraries - Array of daily raw scraping entries collected during the stay
 * @returns {Promise<{summary: string, citations: string[]}>}
 */
export async function summarizeItinerary(arrivalDate, departureDate, location, itineraries) {
  const formattedTimeline = itineraries
    .map(item => {
      const dayActivities = item.activities.length > 0 
        ? item.activities.map(act => `- ${act}`).join('\n') 
        : '- No explicit activities listed (Private or personal time)';
      return `### Date: ${item.date}\n${dayActivities}`;
    })
    .join('\n\n');

  const dateRangeString = arrivalDate === departureDate 
    ? arrivalDate 
    : `${arrivalDate} to ${departureDate}`;

  const promptContent = `
    You are an objective journalist compiling an official historical archive of the Canadian Prime Minister's travels.
    Given that this archive is for the Canadian viewer, you SHOULD refer to Canadian Prime Minister Mark Carney simply as "PM Carney"
    Consider the following location and date range.

    Location: ${location}
    Date Range: ${dateRangeString}

    TASK:
    1. Cross-reference this date range and location with news coverage, official press releases, and media reports covering what took place.
    2. Synthesize a concise summary (3-4 sentences total) detailing the overall trip. Focus on what *actually* occurred (e.g., key treaties signed, bilateral meetings held, prominent individuals met, speeches delivered, or major public announcements made).
    
    STRICT CONSTRAINTS:
    - If your web searches reveal absolutely zero public records, press releases, or news coverage about what occurred during this entire date range at this location, you must output: "null"
    - Provide a single continuous summary for the whole trip; do not split it up into individual daily bullet points.

    To help provide some additional context for your research, here is the media advisory itinerary for the Prime Minister's stay at this location.
    
    Collected Daily Itinerary Data:
    ${formattedTimeline}
  `;

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar", 
      messages: [
        { role: "system", content: "You are a factual, precise research assistant specializing in historical political archiving." },
        { role: "user", content: promptContent }
      ],
      temperature: 0.15, 
    });

    const summary = response.choices[0].message.content;
    const citations = response.citations || [];

    // Quietly log the entire transaction to the debug file
    logAiDebug(location, dateRangeString, promptContent, summary, citations);

    return {
      summary: summary.trim(),
      citations: citations
    };

  } catch (error) {
    console.error("Perplexity API Stay Summarization Error:", error);
    // Also log the error to the debug file so you don't lose context
    logAiDebug(location, dateRangeString, promptContent, `ERROR: ${error.message}`, []);
    throw error;
  }
}