import { Request, Response } from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_MODEL } from "../utils/constants";

export const messageIntelligence = async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "No message provided" });
    return;
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey: process.env.GEMINI_API_KEY,
      maxOutputTokens: 2048,
    });
    const response = await model.invoke(message);
    res.json({ response: response.content });
  } catch (error) {
    res.status(500).json({
      error: "AI error",
      details: error instanceof Error ? error.message : error,
    });
  }
};
