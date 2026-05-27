import { GoogleGenAI } from '@google/genai';

// Initialize the Google AI client using the configured environment variable
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({ apiKey });
};

const NEXUS_MODEL = 'gemini-2.5-flash';

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from a text response
 * to ensure that standard JSON parsing does not encounter syntax errors.
 */
function parseJsonResponse<T>(text: string): T {
  const cleanText = text.trim();
  const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : cleanText;
  return JSON.parse(jsonString) as T;
}

/**
 * Performs AI-driven text analysis on a single document or feedback entry.
 * Generates an executive summary, sentiment estimation, risk classification,
 * structural issues, and actionable recommendations.
 * 
 * @param text The raw string content of the user comment or data record to analyze.
 * @returns A structured promise resolving to sentiment, summary, risk score, and issues.
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
  const ai = getGenAIClient();
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

  const response = await ai.models.generateContent({
    model: NEXUS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return parseJsonResponse(response.text);
}

/**
 * Generates aggregated semantic insights from a larger batch of text inputs.
 * Condenses trends, calculates emotional and sentiment distributions,
 * and highlights key concerns to produce a macro-level overview.
 * 
 * @param texts Array of string records representing dataset feedback rows.
 * @returns An executive batch insights summary object.
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
  const ai = getGenAIClient();
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

  const response = await ai.models.generateContent({
    model: NEXUS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return parseJsonResponse(response.text);
}

/**
 * Conducts a contextual conversational analysis over user query and dataset sample.
 * Grounding the model context strictly to user records to prevent hallucinations.
 * 
 * @param query The question or analytical command sent by the user.
 * @param contextData Batch statistics and sample data injected for accuracy.
 * @param history Previous chat history logs.
 * @returns Plain text conversational response.
 */
export async function chatWithData(
  query: string,
  contextData: any,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const ai = getGenAIClient();
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

  const response = await ai.models.generateContent({
    model: NEXUS_MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
    },
  });

  return response.text || 'Unable to analyze the context details.';
}

/**
 * Creates a structured executive intelligence report with high-fidelity insights
 * and metrics suitable for management presentations.
 * 
 * @param title The customized business title of the report.
 * @param contextData Data metrics and trends from the dataset.
 * @returns Structured sections including trend analysis, risks, and findings.
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
  const ai = getGenAIClient();
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

  const response = await ai.models.generateContent({
    model: NEXUS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return parseJsonResponse(response.text);
}

/**
 * Scans a dataset context to flag anomalies, critical spikes, and potential risks.
 * Generates warning indicators to feed directly into the system alerts dashboard.
 * 
 * @param contextData Summary analytics and keywords extracted from datasets.
 * @returns Array of system-level alerts with titles, details, and severities.
 */
export async function scanForAnomalies(contextData: any): Promise<Array<{
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}>> {
  const ai = getGenAIClient();
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

  const response = await ai.models.generateContent({
    model: NEXUS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error('Gemini API returned an empty response.');
  }

  const result = parseJsonResponse<any>(response.text);
  return Array.isArray(result) ? result : (result.alerts || []);
}
