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
 * Searches the web and generates a cohesive summary for the Prime Minister's stay.
 * @param {string} arrivalDate - The day the PM arrived (e.g., "2026-06-15")
 * @param {string} departureDate - The day the PM departed (e.g., "2026-06-17")
 * @param {string} location - The location of the stay (e.g., "Évian, France")
 * @param {Array<{date: string, activities: string[]}>} itineraries - Array of daily raw scraping entries
 * @returns {Promise<{longSummary: string | null, shortSummary: string | null, citations: string[]}>}
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

  // PROMPT MODIFIED TO REQUIRE STRICT JSON OUTPUT
  const promptContent = `
    You are an objective journalist compiling a historical archive of the Canadian Prime Minister's travels.
    Given that this archive is for the Canadian viewer, you SHOULD refer to Canadian Prime Minister Mark Carney simply as "PM Carney".
    Consider the following location and date range.

    Location: ${location}
    Date Range: ${dateRangeString}

    TASK:
    1. Cross-reference this date range and location with news coverage, official press releases, and media reports.
    2. Synthesize your findings strictly into the following JSON format. You MUST return valid JSON matching this exact schema:
    {
      "long_summary": "A concise description (3-4 sentences total) detailing the overall trip. Focus on what *actually* occurred.",
      "short_summary": "An even shorter ONE SENTENCE summary of the trip."
    }
    
    STRICT CONSTRAINTS:
    - If your web searches reveal absolutely zero public records, press releases, or news coverage about what occurred, you MUST return this exact JSON: {"long_summary": null, "short_summary": null}
    - Do not include conversational filler, introductory text, or markdown formatting. Output ONLY the JSON object.
    - Provide a continuous summary; do not split it up into individual daily bullet points.
    - Please refer to dates in user friendly format. For example, don't write "2026-07-19", write "July 19th" instead.

    To help provide some additional context for your research, here is the media advisory itinerary for the Prime Minister's stay at this location.
    
    Collected Daily Itinerary Data:
    ${formattedTimeline}
  `;

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar", 
      messages: [
        { role: "system", content: "You are a factual, precise research assistant specializing in historical political archiving. You output exclusively in JSON format." },
        { role: "user", content: promptContent }
      ],
      temperature: 0.15, 
    });

    const rawContent = response.choices[0].message.content.trim();
    const citations = response.citations || [];

    // Strip markdown code fences if the LLM ignores the "no markdown" constraint
    const jsonString = rawContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON from LLM output. Raw string: ${rawContent}`);
    }

    // Quietly log the raw transaction to the debug file
    logAiDebug(location, dateRangeString, promptContent, rawContent, citations);

    return {
      longSummary: parsedData.long_summary,
      shortSummary: parsedData.short_summary,
      citations: citations
    };

  } catch (error) {
    console.error("Perplexity API Stay Summarization Error:", error);
    logAiDebug(location, dateRangeString, promptContent, `ERROR: ${error.message}`, []);
    throw error;
  }
}