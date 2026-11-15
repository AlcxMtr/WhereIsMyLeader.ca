import fs from 'fs';

const SYSTEM_PROMPT =
  "You are a factual, precise research assistant specializing in historical political archiving. You output exclusively in JSON format.";

function formatTimeline(itineraries) {
  return itineraries
    .map(item => {
      const dayActivities = item.activities.length > 0
        ? item.activities.map(act => `- ${act}`).join('\n')
        : '- No explicit activities listed (Private or personal time)';
      return `### Date: ${item.date}\n${dayActivities}`;
    })
    .join('\n\n');
}

function buildPrompt(location, dateRange, timeline) {
  return `
    You are an objective journalist compiling a historical archive of the Canadian Prime Minister's travels.
    Given that this archive is for the Canadian viewer, you SHOULD refer to Canadian Prime Minister Mark Carney simply as "PM Carney".
    Consider the following location and date range.

    Location: ${location}
    Date Range: ${dateRange}

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
    ${timeline}
  `;
}

/**
 * Uses web-search-backed AI to write long/short summaries of a stay.
 * Every call is recorded in a dedicated debug log so the main console stays clean.
 */
export class ItinerarySummarizer {
  /**
   * @param {import('./PerplexityClient.js').PerplexityClient} aiClient
   * @param {string} debugLogPath
   */
  constructor(aiClient, debugLogPath) {
    this.ai = aiClient;
    this.debugLogPath = debugLogPath;
  }

  /**
   * @param {string} arrivalDate - e.g. "2026-06-15"
   * @param {string} departureDate - e.g. "2026-06-17"
   * @param {string} location - e.g. "Évian, France"
   * @param {Array<{date: string, activities: string[]}>} itineraries
   * @returns {Promise<{longSummary: string | null, shortSummary: string | null, citations: string[]}>}
   */
  async summarize(arrivalDate, departureDate, location, itineraries) {
    const dateRange = arrivalDate === departureDate ? arrivalDate : `${arrivalDate} to ${departureDate}`;
    const prompt = buildPrompt(location, dateRange, formatTimeline(itineraries));

    try {
      const { data, raw, citations } = await this.ai.completeJson({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.15,
      });
      this.#logDebug(location, dateRange, prompt, raw, citations);
      return { longSummary: data.long_summary, shortSummary: data.short_summary, citations };
    } catch (error) {
      console.error("Perplexity API Stay Summarization Error:", error);
      this.#logDebug(location, dateRange, prompt, `ERROR: ${error.message}`, []);
      throw error;
    }
  }

  #logDebug(location, dateRange, prompt, summary, citations) {
    const line = '=================================================';
    const entry = `\n${line}\n` +
      `[${new Date().toISOString()}] AI CALL FOR: ${location} (${dateRange})\n` +
      `${line}\n` +
      `--- PROMPT SENT ---\n${prompt.trim()}\n\n` +
      `--- RAW SUMMARY RECEIVED ---\n${summary}\n\n` +
      `--- CITATIONS ---\n${JSON.stringify(citations, null, 2)}\n` +
      `${line}\n`;

    try {
      fs.appendFileSync(this.debugLogPath, entry, 'utf8');
    } catch (err) {
      console.error("Failed to write to ai_debug.log:", err);
    }
  }
}
