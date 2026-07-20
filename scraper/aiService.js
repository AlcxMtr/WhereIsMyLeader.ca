// FIX: Force Node.js inside the Docker container to accept the SSL certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import OpenAI from "openai";

// Initialize the client pointing to Perplexity's API endpoint
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

/**
 * Searches the web and generates a single cohesive summary for the Prime Minister's entire multi-day stay at a location.
 * @param {string} arrivalDate - The day the PM arrived (e.g., "2026-06-15")
 * @param {string} departureDate - The day the PM departed (e.g., "2026-06-17")
 * @param {string} location - The location of the stay (e.g., "Évian, France")
 * @param {Array<{date: string, activities: string[]}>} itineraries - Array of daily raw scraping entries collected during the stay
 * @returns {Promise<{summary: string, citations: string[]}>}
 */
export async function summarizeItinerary(arrivalDate, departureDate, location, itineraries) {
  // Format the raw itineraries array into a clean textual timeline for the LLM prompt context
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
    You are a meticulous, objective researcher compiling an official historical archive of the Prime Minister's travels.
    Below is the complete collected itinerary timeline for the Prime Minister's stay at a specific location.
    
    Location: ${location}
    Date Range: ${dateRangeString}
    
    Collected Daily Itinerary Data:
    ${formattedTimeline}

    TASK:
    1. Cross-reference this date range and location against the live web to find news coverage, official press releases, and confirmed media reports covering what took place.
    2. Synthesize a concise, highly relevant, and interesting narrative summary (3-4 sentences total) detailing the overall trip. Focus on what *actually* occurred (e.g., key treaties signed, bilateral meetings held, prominent individuals met, speeches delivered, or major public announcements made).
    
    STRICT CONSTRAINTS:
    - If your web searches reveal absolutely zero public records, press releases, or news coverage about what occurred during this entire date range at this location, you MUST output exactly: "null"
    - Provide a single continuous summary for the whole trip; do not split it up into individual daily bullet points.
    - Do NOT infer, guess, or generalize based on typical political visits. Stick strictly to facts reported in the active search results.
  `;

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar", // Perplexity's search-grounded model
      messages: [
        { role: "system", content: "You are a factual, precise research assistant specializing in historical political archiving." },
        { role: "user", content: promptContent }
      ],
      temperature: 0.15, // Slightly higher to allow narrative synthesis while enforcing factual boundaries
    });

    const summary = response.choices[0].message.content;
    
    // Perplexity automatically maps source URLs into this array property
    const citations = response.citations || [];

    return {
      summary: summary.trim(),
      citations: citations
    };

  } catch (error) {
    console.error("Perplexity API Stay Summarization Error:", error);
    throw error;
  }
}