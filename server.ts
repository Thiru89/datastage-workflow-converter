import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API endpoint for AI-assisted ETL analysis and modernization recommendations
app.post("/api/gemini/analyze-etl", async (req, res) => {
  try {
    const { jobData, targetPlatform = "Snowflake / dbt" } = req.body;
    if (!jobData) {
      return res.status(400).json({ error: "Missing jobData in request body." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
        fallbackNotice: "Using deterministic rule-based analysis.",
      });
    }

    const prompt = `You are a Principal Data Architect and IBM InfoSphere DataStage Migration Specialist.
Analyze the following parsed DataStage ETL job and provide an expert architectural summary, business logic translation, and modern cloud migration roadmap.

DataStage Job Details:
- Job Name: ${jobData.jobName || "Unknown"}
- Category: ${jobData.category || "General"}
- Total Stages: ${jobData.stages?.length || 0}
- Sources: ${JSON.stringify(jobData.sources || [])}
- Targets: ${JSON.stringify(jobData.targets || [])}
- Joins: ${JSON.stringify(jobData.joins || [])}
- Filters: ${JSON.stringify(jobData.filters || [])}
- Key Transformations & Derivations Sample:
${JSON.stringify((jobData.transformations || []).slice(0, 15), null, 2)}

Target Migration Platform: ${targetPlatform}

Please provide:
1. "businessPurpose": A clear 2-3 sentence explanation of what this ETL pipeline accomplishes in business terms.
2. "transformationInsights": Highlight key derivation logic, stage variable calculations, or business rules identified.
3. "modernizationStrategy": How this DataStage job maps to modern paradigms (${targetPlatform}) like CTEs, window functions, incremental dbt models, or automated orchestration.
4. "potentialMigrationRisks": 3-4 specific technical watch-outs (e.g., null handling differences, collation/charset, date formatting tokens, join outer/inner behavior).
5. "recommendedSqlOptimizations": Practical tips for executing this pipeline efficiently on the target database.

Return your response in pure JSON matching this schema:
{
  "businessPurpose": "string",
  "transformationInsights": ["string"],
  "modernizationStrategy": "string",
  "potentialMigrationRisks": ["string"],
  "recommendedSqlOptimizations": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error("Error analyzing DataStage job with Gemini:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze ETL job with AI.",
    });
  }
});

// API endpoint to translate complex DataStage expressions to target SQL
app.post("/api/gemini/convert-expression", async (req, res) => {
  try {
    const { expression, dialect = "Snowflake", context } = req.body;
    if (!expression) {
      return res.status(400).json({ error: "Missing expression in request body." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured.",
      });
    }

    const prompt = `Convert this IBM DataStage Transformer expression to standard ${dialect} SQL expression.
DataStage Expression: "${expression}"
Context / Link Info: "${context || "Standard Link Column Derivation"}"

Return JSON:
{
  "sqlExpression": "string (the translated SQL expression)",
  "explanation": "string (how the DataStage functions were mapped to SQL)",
  "edgeCases": "string (any null or type edge cases to be aware of)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return res.json({ success: true, result: JSON.parse(text) });
  } catch (error: any) {
    console.error("Error converting expression:", error);
    return res.status(500).json({
      error: error.message || "Failed to convert expression.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DataStage ETL Scanner Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
