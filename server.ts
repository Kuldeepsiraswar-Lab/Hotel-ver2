import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for body parsing
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Receipt Scanner Endpoint
app.post("/api/ai/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No receipt image data provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const prompt = `Analyze this restaurant vendor invoice or grocery/utility expense receipt image carefully.
Extract the following information in strict JSON format:
- vendorName (string, e.g. "Metro Food Supplies", "Sysco", "Local Farmers Market", "Fresh Veggie Distributors")
- invoiceNumber (string, if visible or generate an empty string)
- date (ISO string YYYY-MM-DD or date found on receipt)
- category (One of: "Raw Ingredients & Produce", "Beverages & Bar", "Kitchen Equipment & Maintenance", "Staff Wages & Payroll", "Utilities & Rent", "Packaging & Disposables", "Marketing & Delivery", "Cleaning & Hygiene", "General Operations")
- items (Array of objects with: name (string), quantity (number or 1), unitPrice (number), totalPrice (number))
- subtotal (number)
- tax (number)
- total (number)
- paymentMethod (string, e.g. "Cash", "Credit Card", "Bank Transfer", "Pending / On Account")
- notes (brief summary of what was purchased)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendorName: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                },
                required: ["name", "totalPrice"],
              },
            },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            paymentMethod: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ["vendorName", "total", "category"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error scanning receipt with Gemini:", error);
    return res.status(500).json({
      error: error.message || "Failed to parse receipt with AI",
    });
  }
});

// AI Invoice Assistant / Catering Proposal Notes Generator
app.post("/api/ai/draft-invoice-notes", async (req, res) => {
  try {
    const { clientName, eventType, totalAmount, terms } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const prompt = `Draft a warm, highly professional client memo and payment terms for a restaurant invoice/catering bill:
Client: ${clientName || "Valued Customer"}
Event / Purpose: ${eventType || "Corporate Luncheon / Dining Service"}
Total Amount: ${totalAmount}
Terms: ${terms || "Due upon receipt"}

Return JSON with:
- "thankYouNote": A polite 2-sentence note expressing appreciation.
- "paymentInstructions": Clear payment guideline mentioning bank transfer, card or QR code.
- "cateringTerms": Short bulleted policies (e.g. headcount lock, cancellation window, dietary compliance).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thankYouNote: { type: Type.STRING },
            paymentInstructions: { type: Type.STRING },
            cateringTerms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["thankYouNote", "paymentInstructions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error drafting invoice notes with Gemini:", error);
    return res.status(500).json({
      error: error.message || "Failed to draft invoice notes",
    });
  }
});

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restaurant Billing & Expense Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
