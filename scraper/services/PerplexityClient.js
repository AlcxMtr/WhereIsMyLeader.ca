import OpenAI from 'openai';

function stripCodeFences(text) {
  return text.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
}

/**
 * Thin wrapper around Perplexity's OpenAI-compatible API that expects JSON replies.
 */
export class PerplexityClient {
  constructor({ apiKey, baseURL, model }) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }

  /**
   * Sends a prompt and parses the reply as JSON.
   * Throws if the request fails or the reply isn't valid JSON.
   * @returns {Promise<{data: any, raw: string, citations: string[]}>}
   */
  async completeJson({ systemPrompt, userPrompt, temperature }) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    });

    const raw = response.choices[0].message.content.trim();
    const citations = response.citations || [];

    try {
      return { data: JSON.parse(stripCodeFences(raw)), raw, citations };
    } catch {
      throw new Error(`Failed to parse JSON from LLM output. Raw string: ${raw}`);
    }
  }
}
