import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeSingleDay(url) {
  console.log(`Attempting to scrape: ${url}\n`);

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    // FIX: Scope the selector entirely inside the <article> tag to ignore the search bar
    const container = $('article .field--name-body').first();

    let location = "Unknown Location";
    let activities = [];

    // Iterate through the direct HTML children of the article body
    container.children().each((i, el) => {
        // In cheerio, el.name holds the HTML tag (e.g., 'p', 'h2', 'ul')
        const tagName = el.name ? el.name.toLowerCase() : '';
        const text = $(el).text().replace(/\s+/g, ' ').trim(); 
        
        if (!text) return; 
        
        const lowerText = text.toLowerCase();

        // Filter out the standard media and header boilerplate
        if (
            lowerText.includes('note: all times local') ||
            lowerText.includes('note for media') || 
            lowerText.includes('notes for media') || 
            lowerText.includes('open coverage') ||
            lowerText.includes('pooled photo opportunity') ||
            lowerText.includes('closed to media') ||
            lowerText.includes('media are asked to arrive') ||
            lowerText.includes('media@pmo-cpm.gc.ca')
        ) {
            return;
        }

        // The webmaster wraps cities in <h2> tags
        if (tagName === 'h2') {
            if (location === "Unknown Location") {
                location = text;
            } else if (!location.includes(text)) {
                // If he travels to a new city later in the day, append it
                location += ` / ${text}`;
            }
        } 
        // Activities and times are standard paragraphs
        else if (tagName === 'p') {
            activities.push(text);
        }
    });

    const dayData = {
      dateUrl: url,
      location: location,
      activities: activities
    };

    console.log('--- SCRAPE SUCCESSFUL ---');
    console.log(dayData);
    
    return dayData;

  } catch (error) {
    console.error(`Scrape Failed. Error: ${error.response ? error.response.status : error.message}`);
  }
}

const testUrl = "https://www.pm.gc.ca/en/news/media-advisories/2026/03/13/saturday-march-14-2026";
scrapeSingleDay(testUrl);