/**
 * AI services using API Stacking (Groq -> Gemini -> OpenRouter fallback)
 */

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.0-flash';
const OPENROUTER_MODEL = 'qwen/qwen3-235b-a22b:free';

async function fetchFromProvider(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  jsonMode: boolean,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API returned an empty or invalid response format.');
  }

  return data.choices[0].message.content || '';
}

async function generateAIContent(prompt: string, jsonMode = false, temperature = 0.3): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  let lastError: Error | null = null;

  // 1. Groq — fastest, most generous free tier
  if (groqKey) {
    try {
      return await fetchFromProvider(
        'https://api.groq.com/openai/v1/chat/completions',
        groqKey,
        GROQ_MODEL,
        prompt,
        temperature,
        jsonMode
      );
    } catch (err: any) {
      console.warn('Groq failed, trying Gemini...', err.message);
      lastError = err;
    }
  }

  // 2. Gemini Flash — 1500 req/day free, very fast
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            },
          }),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini returned empty response.');
      return text;
    } catch (err: any) {
      console.warn('Gemini failed, trying OpenRouter...', err.message);
      lastError = err;
    }
  }

  // 3. OpenRouter — last resort (shared free pool, often rate-limited)
  if (openRouterKey) {
    try {
      return await fetchFromProvider(
        'https://openrouter.ai/api/v1/chat/completions',
        openRouterKey,
        OPENROUTER_MODEL,
        prompt,
        temperature,
        jsonMode,
        { 'HTTP-Referer': 'https://nexus-ai.local', 'X-Title': 'Nexus AI' }
      );
    } catch (err: any) {
      console.warn('OpenRouter failed.', err.message);
      lastError = err;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'No API keys configured.'}`);
}

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from a text response
 * to ensure that standard JSON parsing does not encounter syntax errors.
 */
function parseJsonResponse<T>(text: string): T {
  const cleanText = text.trim();
  const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : cleanText;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error(`AI returned invalid JSON. Raw: ${jsonString.slice(0, 200)}`);
  }
}

/**
 * Performs AI-driven text analysis on a single document or feedback entry.
 */
export async function analyzeText(text: string): Promise<{
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  emotion: string;
  key_issues: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  recommendations: string[];
  confidence_score: number;
}> {
  const prompt = `Analyze the following text and return a JSON object with EXACTLY these fields:
{
  "summary": "concise 1-2 sentence summary",
  "sentiment": "Positive" | "Neutral" | "Negative",
  "emotion": "primary emotion (Joy/Anger/Fear/Sadness/Surprise/Trust/Disgust/Anticipation)",
  "key_issues": ["issue1", "issue2"],
  "risk_level": "Low" | "Medium" | "High",
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence_score": <number 0-100>
}

Text to analyze:
"""${text.slice(0, 3000)}"""

Return ONLY valid JSON, no markdown, no explanation.`;

  const responseText = await generateAIContent(prompt, true, 0.3);
  return parseJsonResponse(responseText);
}

/**
 * Generates aggregated semantic insights from a larger batch of text inputs.
 */
export async function generateBatchInsights(texts: string[]): Promise<{
  trends: string[];
  dominant_emotions: Array<{ emotion: string; percentage: number }>;
  recurring_issues: string[];
  overall_sentiment: { positive: number; neutral: number; negative: number };
  executive_summary: string;
  anomaly_signals: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  top_keywords: string[];
}> {
  const sample = texts.slice(0, 80);
  const joined = sample.map((t) => t.slice(0, 500)).join('\n---\n');

  const prompt = `You are an AI analyst. Analyze the following batch of ${sample.length} text records.
Return a JSON object with EXACTLY these fields:
{
  "trends": ["trend1", "trend2", "trend3"],
  "dominant_emotions": [
    {"emotion": "Joy", "percentage": 35.0},
    {"emotion": "Anger", "percentage": 25.0}
  ],
  "recurring_issues": ["issue1", "issue2", "issue3"],
  "overall_sentiment": {"positive": 45, "neutral": 30, "negative": 25},
  "executive_summary": "2-3 sentence high-level summary",
  "anomaly_signals": ["signal1", "signal2"],
  "risk_level": "Low" | "Medium" | "High",
  "top_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Data records:
${joined}

Return ONLY valid JSON.`;

  const responseText = await generateAIContent(prompt, true, 0.2);
  return parseJsonResponse(responseText);
}

/**
 * Conducts a contextual conversational analysis over user query and dataset sample.
 */
export async function chatWithData(
  query: string,
  contextData: any,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const contextStr = JSON.stringify(contextData, null, 2).slice(0, 6000);

  const historyStr = history.length > 0
    ? 'Previous conversation:\n' + history.slice(-10).map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n') + '\n\n'
    : '';

  const prompt = `You are an expert AI data analyst assistant for Nexus AI.
Answer the user's question based ONLY on the provided data context.
Be concise, analytical, and use specific numbers from the data where available.
If asked about something not in the context, say so clearly.

DATA CONTEXT:
${contextStr}

${historyStr}User question: ${query}

Provide a clear, insightful answer (2-4 sentences). Use bullet points for lists.`;

  return generateAIContent(prompt, false, 0.4);
}

/**
 * Creates a structured executive intelligence report with high-fidelity insights
 */
export async function generateReport(
  title: string,
  contextData: any
): Promise<{
  overview: string;
  key_findings: string[];
  trend_analysis: string;
  risk_assessment: string;
  recommendations: string[];
  metrics: Array<{ label: string; value: string }>;
}> {
  const contextStr = JSON.stringify(contextData, null, 2).slice(0, 5000);

  const prompt = `You are an expert business intelligence analyst at Nexus AI.
Generate a comprehensive executive report titled "${title}" based on the provided data.
Return a JSON object with EXACTLY these fields:
{
  "overview": "2-3 paragraph executive overview",
  "key_findings": ["finding1", "finding2", "finding3", "finding4", "finding5"],
  "trend_analysis": "2-3 paragraph analysis of trends observed in the data",
  "risk_assessment": "2-3 paragraph assessment of identified risks and their potential impact",
  "recommendations": ["actionable rec1", "actionable rec2", "actionable rec3", "actionable rec4"],
  "metrics": [
    {"label": "Total Records Analyzed", "value": "N"},
    {"label": "Overall Sentiment Score", "value": "X/100"},
    {"label": "Primary Risk Level", "value": "Low/Medium/High"},
    {"label": "Top Concern", "value": "topic"}
  ]
}

Data Context:
${contextStr}

Return ONLY valid JSON. Be specific and data-driven in your analysis.`;

  const responseText = await generateAIContent(prompt, true, 0.3);
  return parseJsonResponse(responseText);
}

/**
 * Scans a dataset context to flag anomalies, critical spikes, and potential risks.
 */
export async function scanForAnomalies(contextData: any): Promise<Array<{
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}>> {
  const contextStr = JSON.stringify(contextData, null, 2).slice(0, 4000);

  const prompt = `You are a risk detection AI for Nexus AI. Analyze the data for anomalies.
Identify 3-6 specific issues worth flagging. Return a JSON array:
[
  {
    "title": "Short alert title",
    "message": "Specific explanation of what was detected and why it matters",
    "severity": "low" | "medium" | "high"
  }
]

Severity guidelines:
- high: negative sentiment spike >40%, high-risk keywords, safety concerns
- medium: declining trends, recurring unresolved issues, emerging patterns  
- low: minor anomalies, data quality issues, opportunities

Data Context:
${contextStr}

Return ONLY a valid JSON array. Generate exactly 3-5 alerts.`;

  const responseText = await generateAIContent(prompt, true, 0.3);
  const result = parseJsonResponse<any>(responseText);
  return Array.isArray(result) ? result : (result.alerts || []);
}
