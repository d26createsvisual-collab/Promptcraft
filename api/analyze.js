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
      model: 'gemini-2.5-flash
      contents: {
        parts: [
          {
            inlineData: {
              data: data.image.split(',')[1],
              mimeType: data.image.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
            }
          },
          {
            text: `You are an expert frontend engineer and UI/UX designer.
Analyze this screenshot and generate a detailed prompt to recreate it or build upon it.
User context/instructions: ${data.imageContext || 'None provided.'}

Format the output EXACTLY with these uppercase headings (no markdown formatting for headings):
ANALYSIS
[Detailed breakdown of the layout, components, and visual hierarchy seen in the image]

CONCEPT
[What this interface represents and its primary function]

DESIGN
[Extract the design system: colors (estimate hex codes), typography style, spacing patterns, border radius, shadows]

CORE FEATURES
[Numbered list of the interactive elements and features visible or implied]

TECH STACK
[Recommended modern frontend stack to build this (e.g., React, Tailwind, specific UI libraries)]

RULES
[4-5 strict constraints for recreating this accurately (e.g., Pixel-perfect spacing, Responsive behavior)]`
          }
        ]
      }
    });

    return new Response(JSON.stringify({ prompt: response.text?.trim() || 'Failed to generate prompt.' }), {
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
