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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: data.image.replace(/^data:image\/\w+;base64,/, ''),
                mimeType: data.image.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
              }
            },
            {
              text: `You are an expert frontend engineer and UI/UX designer. Analyze this screenshot and generate a detailed prompt to recreate it or build upon it.

Format the output EXACTLY with these uppercase headings:

ANALYSIS
[Describe the layout, color scheme, typography, and key UI components you see]

CONCEPT
[2-3 sentences describing what this interface is and its purpose]

DESIGN
[Detailed design system: colors, fonts, spacing, border radius, shadows]

CORE FEATURES
[Numbered list of key features visible in the screenshot]

TECH STACK
[Recommended tech stack to build this]

RULES
[4-5 specific constraints to match this design faithfully]`
            }
          ]
        }
      ]
    });

    return new Response(JSON.stringify({ prompt: response.text?.trim() || 'Failed to analyze screenshot.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze screenshot" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}