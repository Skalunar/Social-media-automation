var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var aiClient = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.use(import_express.default.json());
app.post("/api/generate-post", async (req, res) => {
  try {
    const { topic, platform, tone, keyword } = req.body;
    if (!topic || !platform) {
      return res.status(400).json({ error: "Topic and Platform are required" });
    }
    const ai = getAi();
    const prompt = `Generate a highly engaging, professional social media post for ${platform}.
    Topic: ${topic}
    Tone: ${tone || "Engaging"}
    Keywords to include: ${keyword || "None"}
    
    Please provide the response in a clean JSON format matching this schema:
    {
      "caption": "The main text caption for the post with appropriate line breaks and spacing. Must be highly styled and include custom call-to-actions.",
      "hashtags": ["list", "of", "relevant", "hashtags"],
      "recommendedTime": "e.g., Tuesday, 2:00 PM EST",
      "engagementHook": "A quick tip or hook to drive comments and shares.",
      "visualSuggestion": "A brief prompt or suggestion for the image or graphic to accompany the post."
    }`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            caption: { type: import_genai.Type.STRING },
            hashtags: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            recommendedTime: { type: import_genai.Type.STRING },
            engagementHook: { type: import_genai.Type.STRING },
            visualSuggestion: { type: import_genai.Type.STRING }
          },
          required: ["caption", "hashtags", "recommendedTime", "engagementHook", "visualSuggestion"]
        }
      }
    });
    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }
    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (err) {
    console.error("Gemini Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate post" });
  }
});
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
}
setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
//# sourceMappingURL=server.cjs.map
