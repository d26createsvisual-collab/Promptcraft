import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const data = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const formattedAnswers = data.answers?.map((a: any) => `- ${a.question}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`).join('\n') || 'None';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an expert software architect and UI/UX designer. 
Generate a highly detailed, structured prompt that the user can copy and paste into an AI coding tool to build their app.

User Input:
- Idea: ${data.idea}
- Project Type: ${data.projectType || 'General'}
${formattedAnswers}

Format the output EXACTLY with these uppercase headings (no markdown formatting for headings):
CONCEPT
[2-3 sentences describing the app, value prop, and target user]

DESIGN
[Describe visual aesthetic, colors, typography, spacing based on their answers]

CORE FEATURES
[Numbered list of key features with 1-2 sentences of detail each based on their answers]

TECH STACK
[Recommended tech stack including specific libraries based on their answers]

RULES
[4-5 strict constraints as bullet points (e.g., Mobile responsive, Include loading states)]`
      });

      res.json({ prompt: response.text?.trim() || 'Failed to generate prompt.' });
    } catch (error) {
      console.error("Error generating prompt:", error);
      res.status(500).json({ error: "Failed to generate prompt" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const data = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
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

      res.json({ prompt: response.text?.trim() || 'Failed to generate prompt.' });
    } catch (error) {
      console.error("Error analyzing screenshot:", error);
      res.status(500).json({ error: "Failed to analyze screenshot" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
