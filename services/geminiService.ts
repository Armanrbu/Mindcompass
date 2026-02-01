import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIRoutingResponse, PriorityLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Deterministic Safety Net
// These patterns trigger an immediate HIGH priority override, bypassing AI nuance.
const CRISIS_PATTERNS = [
  /suicid/i,
  /kill\s+myself/i,
  /want\s+to\s+die/i,
  /end\s+it\s+all/i,
  /better\s+off\s+dead/i,
  /hurt\s+myself/i,
  /cutting\s+myself/i,
  /take\s+my\s+own\s+life/i,
  /no\s+reason\s+to\s+live/i,
  /can'?t\s+go\s+on/i
];

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    priority: {
      type: Type.STRING,
      enum: [PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH],
      description: "Internal routing flag only. HIGH=Safety risk identified, MEDIUM=Significant stress/impairment, LOW=General reflection.",
    },
    reflection: {
      type: Type.STRING,
      description: "A non-clinical, empathetic reflection (max 30 words).",
    },
  },
  required: ["priority", "reflection"],
};

export const analyzePriority = async (
  checkinScore: number,
  reflectionText: string
): Promise<AIRoutingResponse> => {
  
  const model = "gemini-3-flash-preview";
  
  // Reframed prompt to Combat "Digital Pacifier" Effect
  const prompt = `
    Act as a responsible mental health triage assistant.
    
    Inputs:
    - Self-Reported Distress Score (0-63): ${checkinScore}
    - User's Journal Entry: "${reflectionText}"

    CORE INSTRUCTIONS:
    1. **Do Not Diagnose**: Never use clinical terms like "Depression", "Anxiety Disorder", or "PTSD". 
    2. **Use Mirroring**: Reflect the user's sentiment.
    
    **CRITICAL SAFETY PROTOCOL (Combating "False Comfort"):**
    - If priority is **LOW**: Be warm, validating, and encouraging.
    - If priority is **MEDIUM**: Validate the difficulty, but DO NOT try to "fix" it. Your reflection MUST end with a gentle nudge toward human connection (e.g., "This is a heavy load. Sharing it with a listener could really help.").
    - If priority is **HIGH**: Be brief and serious. Validate the pain, but explicitly state that professional support is needed *now*. Do not offer platitudes.

    INTERNAL PRIORITY LOGIC (For safety routing only):
    - Set 'priority' to 'high' IF: User mentions suicide, self-harm, hopelessness, "ending it", or score > 30.
    - Set 'priority' to 'medium' IF: User mentions panic, inability to function, severe burnout, or score > 15.
    - Set 'priority' to 'low' otherwise.
    
    Output JSON ONLY.
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const parsedResult = JSON.parse(responseText) as AIRoutingResponse;

    // --- DETERMINISTIC SAFETY OVERRIDE ---
    // If the user's text matches known crisis patterns, force HIGH priority.
    // This protects against LLM hallucinations or "soft" interpretations of danger.
    const isCrisis = CRISIS_PATTERNS.some(pattern => pattern.test(reflectionText));
    
    if (isCrisis) {
      console.warn("Crisis keywords detected. Forcing HIGH priority.");
      parsedResult.priority = PriorityLevel.HIGH;
      parsedResult.reflection = "I hear how much pain you are in right now. Please, let's connect you with someone who can help you stay safe.";
    }

    return parsedResult;

  } catch (error) {
    console.error("AI Analysis Failed", error);
    
    // Safety Fallback check even in error state
    const isCrisis = CRISIS_PATTERNS.some(pattern => pattern.test(reflectionText));
    
    return {
      priority: isCrisis ? PriorityLevel.HIGH : PriorityLevel.MEDIUM,
      reflection: "Thank you for sharing your thoughts. It takes courage to reflect on how you're feeling.",
    };
  }
};