import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export interface OverviewResponse {
  summary: string;
  keyFacts: string[];
  relatedQuestions: string[];
  isAIGenerated: boolean;
  disclaimer: string;
}

export async function generateOverview(
  query: string,
  context: string
): Promise<OverviewResponse> {
  const groq = getGroq();

  if (!groq) {
    // Fallback: use Wikipedia context directly
    const sentences = context.split(". ").slice(0, 6).join(". ");
    return {
      summary: sentences || `Search results for "${query}" are shown below from trusted medical sources.`,
      keyFacts: [],
      relatedQuestions: [],
      isAIGenerated: false,
      disclaimer: "This information is for educational purposes only. Always consult a healthcare professional.",
    };
  }

  const prompt = `You are MedAI, a medical information assistant. Provide a clear, accurate, and accessible overview of the medical topic: "${query}".

${context ? `Use this Wikipedia context as a base:\n${context}\n\n` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "2-3 paragraph comprehensive overview in plain language (300-400 words)",
  "keyFacts": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"],
  "relatedQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}

Guidelines:
- Write for a general audience, not medical professionals
- Be accurate, evidence-based, and neutral
- Include symptoms, causes, and treatments where relevant
- keyFacts should be concise bullet-point facts
- relatedQuestions should be natural follow-up questions people would ask`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable medical information assistant. Always provide accurate, evidence-based information in plain language. Always include a note that this is not a substitute for professional medical advice. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return {
      summary: parsed.summary ?? "",
      keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
      relatedQuestions: Array.isArray(parsed.relatedQuestions)
        ? parsed.relatedQuestions
        : [],
      isAIGenerated: true,
      disclaimer:
        "This AI-generated overview is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment.",
    };
  } catch (err) {
    console.error("Groq overview error:", err);
    return {
      summary: context.split(". ").slice(0, 6).join(". "),
      keyFacts: [],
      relatedQuestions: [],
      isAIGenerated: false,
      disclaimer:
        "This information is for educational purposes only. Always consult a healthcare professional.",
    };
  }
}

export async function* streamChatResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  query: string
): AsyncGenerator<string> {
  const groq = getGroq();

  if (!groq) {
    yield "I'm sorry, the AI chat feature requires a Groq API key. Please set up your `GROQ_API_KEY` environment variable (free at console.groq.com) and restart the app.";
    return;
  }

  const systemPrompt = `You are MedAI, an expert medical information assistant embedded in MedWay, a trusted medical search engine. 

Your role:
- Answer medical questions accurately and clearly in plain language
- Provide evidence-based information on symptoms, conditions, treatments, medications, and prevention
- Always remind users to consult healthcare professionals for personal medical advice
- Be empathetic and informative, not alarming
- If a question is outside medicine/health, politely redirect: "I'm specialized in medical topics. For this, I'd recommend a general-purpose assistant."

Context: The user was searching for "${query}".

Important: Never diagnose individuals. Always include a gentle reminder to consult a doctor for personal health concerns.`;

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.4,
    max_tokens: 1024,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}

export async function getSuggestions(prefix: string): Promise<string[]> {
  if (!prefix.trim()) return [];

  const groq = getGroq();
  if (!groq) {
    // Return Wikipedia-style suggestions without AI
    return [
      `${prefix} symptoms`,
      `${prefix} treatment`,
      `${prefix} causes`,
      `${prefix} diagnosis`,
      `${prefix} prevention`,
    ].slice(0, 5);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Generate 5 medical search query suggestions that start with or are related to: "${prefix}". Return only a JSON array of strings. Example: ["diabetes symptoms", "diabetes treatment"]. Keep them concise and medically relevant.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    // Try to extract array from response
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) return arr.slice(0, 5);
    }
    const parsed = JSON.parse(raw);
    const arr = Object.values(parsed)[0];
    if (Array.isArray(arr)) return (arr as string[]).slice(0, 5);
    return [];
  } catch {
    return [
      `${prefix} symptoms`,
      `${prefix} treatment`,
      `${prefix} causes`,
    ];
  }
}
