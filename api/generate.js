import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const formattedAnswers = data.answers?.map((a) =>
      `- ${a.question}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`
    ).join('\n') || 'None';

    const prompt = `You are an expert AI prompt engineer. Generate a detailed, structured prompt for building: ${data.idea || 'a web application'}
Category: ${data.category || 'Web App'}
User answers:
${formattedAnswers}

Format the output EXACTLY with these uppercase headings:

CONCEPT
[2-3 sentences describing the app, value prop, and target user]

DESIGN
[Describe visual aesthetic, colors, typography, spacing based on their answers]

CORE FEATURES
[Numbered list of key features with 1-2 sentences of detail each]

TECH STACK
[Recommended tech stack including specific libraries]

RULES
[4-5 strict constraints as bullet points]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return new Response(JSON.stringify({ prompt: response.text?.trim() || 'Failed to generate prompt.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error generating prompt:", error);
    return new Response(JSON.stringify({ error: "Failed to generate prompt" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
