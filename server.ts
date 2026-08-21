import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// System Persona & Knowledge Base for BAAGFRESH
const SYSTEM_INSTRUCTION = `You are "BaagFresh Royal Concierge & Sommelier", the prestigious AI advisor for BAAGFRESH (बाघफ्रेश) — Varanasi's premier purveyor of royal grade dry fruits, authentic whole spices, exotic nuts, organic seeds, and handcrafted festive gifting hampers.

Your Responsibilities:
1. Product Expertise: Guide customers on dry fruit quality (e.g. Mamra Almonds vs California Almonds, Cashew Grade W180 King size vs W320, Kashmiri Mongra Grade-A1 Saffron vs Persian, Afghan Green Raisins, Medjool Royal Dates, Kashmiri Walnut Kernels, Whole Green Cardamom, Cloves, Cinnamon).
2. Health & Ayurveda: Provide evidence-based and traditional benefits (e.g. soaked almonds for memory & heart, walnuts for brain health/omega-3, saffron milk for vitality & skin glow, chia/pumpkin seeds for fiber & zinc, figs for digestion).
3. Royal Gifting Concierge: Recommend hampers based on budget, occasion (Weddings, Diwali, Eid, Corporate, Housewarming) and custom combinations.
4. Store Info:
   - Location: Varanasi Hub, Uttar Pradesh, India.
   - Contact: +91 87076 71319 | Email: baagfresh@gmail.com
   - Shipping: Free delivery across India on orders above ₹999. Express delivery in 2-4 business days with vacuum-sealed freshness packaging.
   - Bulk / Corporate: Direct inquiry support with custom laser-engraved wooden boxes & corporate branding.

Product Catalog Overview:
- ID: 'mamra-almonds' | Iranian Mamra Royal Almonds (Grade AAA) | ₹1,450/250g | 100% oil content, cold-pressed quality
- ID: 'kaju-w180' | Royal King Jumbo Cashews (Grade W-180) | ₹680/250g | King-sized whole cashews from Mangalore/Goa
- ID: 'kashmiri-saffron' | Pure Kashmiri Mongra Grade A1 Saffron (Kesar) | ₹599/1g | 100% pure stigma, GI-tagged Pampore harvest
- ID: 'walnut-kashmiri' | Snow-White Kashmiri Walnut Kernels | ₹490/250g | Extra light halves, rich in Omega-3
- ID: 'green-cardamom' | Royal Idukki Green Cardamom 8mm+ Jumbo | ₹580/100g | Aromatic whole pods from Kerala
- ID: 'pistachio-salted' | Jumbo Iranian Roasted & Lightly Salted Pistachios | ₹620/250g | Naturally opened, rich crunch
- ID: 'medjool-dates' | Royal Medjool Jumbo Dates | ₹750/500g | Soft, luscious caramel sweetness
- ID: 'black-pepper' | Malabar Tellicherry Garbled Extra Bold Black Pepper | ₹280/100g | High piperine content
- ID: 'pumpkin-seeds' | Raw Organic Himalayan Pumpkin Seeds | ₹240/250g | Rich in Magnesium & Zinc
- ID: 'chia-seeds' | Pure Organic Black Chia Seeds | ₹210/250g | High fiber & omega fatty acids
- ID: 'cranberries' | Whole Dried Ruby Cranberries | ₹340/250g | Tart-sweet superfood
- ID: 'turkish-figs' | Royal Jumbo Golden Turkish Anjeer | ₹620/250g | Naturally sun-dried, high fiber
- ID: 'royal-gift-trunk' | The Imperial Royal Gifting Trunk | ₹4,200 | Velvet lined wooden chest with 6 royal jars
- ID: 'festive-wooden-box' | Shahi Festive Handcrafted Wooden Dry Fruit Box | ₹2,499 | Intricate heritage brass inlay box

Response Formatting:
- Tone: Warm, refined, respectful, knowledgeable, and hospitable ("Namaste & Welcome to BaagFresh!").
- Formatting: Use concise bullet points, bold product highlights, and clear recommendations.
- When recommending catalog items, mention the exact product name and append special tag \`[PRODUCT:product-id]\` (e.g. \`[PRODUCT:mamra-almonds]\`, \`[PRODUCT:kashmiri-saffron]\`, \`[PRODUCT:kaju-w180]\`, \`[PRODUCT:royal-gift-trunk]\`) so the website can render direct purchase cards!`;

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    service: "BaagFresh Gemini Server",
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Chat API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, role = "sommelier", model = "gemini-3.5-flash" } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGenAI();

    // Check if API key is provided
    if (!ai) {
      // Return a graceful contextual response if API key is pending
      const lastUserMsg = messages[messages.length - 1]?.text || "";
      return res.json({
        text: `Namaste! Welcome to BAAGFRESH Royal Concierge. I am your personal Dry Fruits & Spices Sommelier.\n\nRegarding your query about "${lastUserMsg}":\n• **Royal Mamra Almonds** [PRODUCT:mamra-almonds] and **Grade A1 Kashmiri Saffron** [PRODUCT:kashmiri-saffron] are our most popular premium harvests.\n• For festive gifting, our **Shahi Festive Handcrafted Wooden Box** [PRODUCT:festive-wooden-box] is handcrafted in Varanasi.\n\n*Feel free to browse our complete collection or call us directly at +91 87076 71319.*`,
        modelUsed: "local-fallback",
        recommendedProductIds: ["mamra-almonds", "kashmiri-saffron", "festive-wooden-box"],
      });
    }

    // Determine target model
    let targetModel = "gemini-3.5-flash";
    if (model === "gemini-3.1-pro-preview") {
      targetModel = "gemini-3.1-pro-preview";
    } else if (model === "gemini-3.1-flash-lite") {
      targetModel = "gemini-3.1-flash-lite";
    } else if (model === "gemini-3.7-flash") {
      targetModel = "gemini-3.7-flash";
    }

    // Role-specific instruction modifications
    let roleModifier = "";
    if (role === "health") {
      roleModifier = "\nEmphasis: Focus specifically on ayurvedic wellness, nutritional facts, calorie control, cardiovascular health, pregnancy nutrition, and daily consumption quantities.";
    } else if (role === "gifting") {
      roleModifier = "\nEmphasis: Focus specifically on wedding, corporate, festival (Diwali/Eid), and luxury custom gift hampers, packaging aesthetics, budget options, and personalization.";
    } else if (role === "culinary") {
      roleModifier = "\nEmphasis: Focus specifically on authentic culinary recipes, spice pairings, biryani/kheer preparation, saffron infusion secrets, and proper airtight storage methods.";
    }

    const fullSystemInstruction = `${SYSTEM_INSTRUCTION}\n${roleModifier}`;

    // Transform conversation history into Gemini format
    // Map previous turns: user -> user, assistant -> model
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const replyText = response.text || "Namaste! How may I assist you with BaagFresh premium dry fruits and royal spices today?";

    // Extract product tags if any [PRODUCT:xyz]
    const productTagRegex = /\[PRODUCT:([a-z0-9-]+)\]/gi;
    const recommendedProductIds: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = productTagRegex.exec(replyText)) !== null) {
      if (match[1] && !recommendedProductIds.includes(match[1])) {
        recommendedProductIds.push(match[1]);
      }
    }

    return res.json({
      text: replyText,
      modelUsed: targetModel,
      recommendedProductIds,
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(500).json({
      error: error?.message || "Encountered an issue generating AI response.",
      text: "Namaste! Our concierge encountered a temporary connection issue. Please feel free to explore our royal catalogue or contact our Varanasi team at +91 87076 71319.",
    });
  }
});

// Single prompt question answering endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const { question, model = "gemini-3.5-flash" } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question parameter is required." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        answer: "BAAGFRESH offers farm-direct premium dry fruits, GI-tagged Kashmiri Saffron, and luxury gift hampers with free shipping above ₹999.",
      });
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return res.json({
      answer: response.text,
    });
  } catch (error: any) {
    console.error("Gemini Ask Error:", error);
    return res.status(500).json({ error: error?.message || "Failed to process request." });
  }
});

// Setup Vite middleware for development or serve static dist for production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`BAAGFRESH Server running on http://localhost:${PORT}`);
  });
}

startServer();
