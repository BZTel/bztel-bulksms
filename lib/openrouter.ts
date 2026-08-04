export const FREE_OPENROUTER_MODELS = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'inclusionai/ling-3.0-flash:free',
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResult {
  text: string;
  modelUsed: string;
}

export async function generateOpenRouterCompletion(
  messages: ChatMessage[],
  temperature = 0.7
): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  const errors: string[] = [];

  for (const model of FREE_OPENROUTER_MODELS) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://bztel.com',
        'X-Title': 'BZTel Bulk SMS AI Assistant',
      };

      if (apiKey && apiKey !== 'your_openrouter_api_key_here') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 400,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const outputText = data.choices?.[0]?.message?.content?.trim();

        if (outputText) {
          return {
            text: outputText,
            modelUsed: data.model || model,
          };
        }
      } else {
        const errText = await response.text();
        errors.push(`[${model}] HTTP ${response.status}: ${errText}`);
      }
    } catch (err: any) {
      errors.push(`[${model}] Network Error: ${err.message}`);
    }
  }

  throw new Error(`OpenRouter models unavailable. Details:\n${errors.join('\n')}`);
}
