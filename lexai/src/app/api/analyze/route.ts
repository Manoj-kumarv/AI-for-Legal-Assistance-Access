import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Models tried in order if a higher-priority one is unavailable
const MODEL_FALLBACKS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();
      // Only try next model on overload / not-found errors
      if (
        msg.includes("503") ||
        msg.includes("404") ||
        msg.includes("service unavailable") ||
        msg.includes("not found") ||
        msg.includes("no longer available") ||
        msg.includes("high demand")
      ) {
        console.warn(`Model ${modelName} unavailable, trying next...`);
        continue;
      }
      // For other errors (auth, quota, bad request) fail fast
      throw lastError;
    }
  }
  throw lastError ?? new Error("All models unavailable. Please try again.");
}

const SYSTEM_PROMPTS: Record<string, string> = {
  simplify: `You are a legal document simplification expert. Your task is to take complex legal text and rewrite it in plain, easy-to-understand English that a non-lawyer can understand. 

Instructions:
- Replace legal jargon with everyday language
- Break down complex sentences into shorter ones
- Explain what each section means in practical terms
- Use bullet points where helpful
- Maintain accuracy — do not change the meaning
- Add a brief "What this means for you" section at the end

Format your response with clear headings using **bold** for section titles.`,

  summarize: `You are a legal document summarization expert. Create a concise, structured summary of the provided legal document.

Instructions:
- Start with a 2-3 sentence overview of what the document is
- List the key parties involved
- Summarize main terms and conditions
- Note important dates, deadlines, or timeframes
- Highlight key obligations for each party
- End with a "Key Takeaways" section (3-5 bullet points)

Format your response with clear headings using **bold** for section titles.`,

  risks: `You are a legal risk assessment expert. Analyze the provided legal document and identify potential risks, red flags, and concerning clauses.

Instructions:
- Identify clauses that heavily favor one party
- Flag unusual or one-sided terms
- Point out missing standard protections
- Highlight vague or ambiguous language that could be exploited
- Note any unusual liability or indemnification clauses
- Identify potential financial risks
- Rate each risk as 🔴 High, 🟡 Medium, or 🟢 Low

Format your response with clear headings. Be specific about which clause or section contains each risk.`,

  checklist: `You are a legal compliance expert. Generate a practical action checklist based on the provided legal document.

Instructions:
- Create a checklist of all obligations and requirements
- Separate into: "Before Signing", "Ongoing Obligations", and "Important Deadlines"
- Include any notice requirements
- List any actions that must be taken by specific dates
- Note any permissions or consents required
- Include items the other party must fulfill (so you can track them)

Format as a clear checklist with checkboxes using [ ] notation and **bold** section headers.`,

  questions: `You are a legal consultant helping someone prepare for a meeting with their lawyer. Based on the provided legal document, generate smart, targeted questions they should ask their legal professional.

Instructions:
- Generate 10-15 specific questions based on the document content
- Group questions by topic (e.g., Financial Terms, Termination, Liability, etc.)
- Focus on ambiguous terms, unusual clauses, and important decisions
- Include questions about missing standard protections
- Add questions about negotiation points
- Suggest what alternative language or terms they might ask for

Format with **bold** group headers and numbered questions within each group.`,

  compare: `You are a contract comparison expert. The user will provide two documents separated by "=== DOCUMENT 2 ===". Compare them and highlight key differences.

Instructions:
- Create a side-by-side comparison of key terms
- Highlight clauses that appear in one but not the other
- Note terms that differ between the two documents
- Identify which document is more favorable and for which party
- Summarize the most important differences
- Provide a recommendation on which version is preferable

Format with clear **bold** headers and a summary table where applicable.`,

  ask: `You are a helpful legal information assistant. Answer questions about the provided legal document accurately and clearly.

Instructions:
- Answer based only on what is in the document
- If the answer is not in the document, say so clearly
- Use plain language in your answers
- Quote relevant sections when helpful (use blockquotes with >)
- If the question involves a legal decision, provide information but recommend consulting a lawyer
- Be concise but thorough

Always end with a reminder that this is information only and not legal advice.`,
};

export async function POST(req: NextRequest) {
  try {
    const { document, action, question, document2 } = await req.json();

    if (!document || !action) {
      return NextResponse.json(
        { error: "Missing document or action" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[action];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let userContent = `Here is the legal document to analyze:\n\n---\n${document}\n---`;

    if (action === "compare" && document2) {
      userContent = `Here is the first legal document:\n\n---\n${document}\n---\n\n=== DOCUMENT 2 ===\n\nHere is the second legal document:\n\n---\n${document2}\n---`;
    }

    if (action === "ask" && question) {
      userContent = `Here is the legal document:\n\n---\n${document}\n---\n\nQuestion: ${question}`;
    }

    const prompt = `${systemPrompt}\n\n${userContent}`;

    const text = await generateWithFallback(prompt);

    return NextResponse.json({ result: text });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
