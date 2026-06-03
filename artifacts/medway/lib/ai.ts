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
    // Fallback: extract the most relevant sentences from Wikipedia context
    const sentences = context
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.length > 30)
      .slice(0, 5)
      .join(" ");
    return {
      summary:
        sentences ||
        `Search results for "${query}" are shown below from trusted medical sources.`,
      keyFacts: [],
      relatedQuestions: [],
      isAIGenerated: false,
      disclaimer:
        "This information is for educational purposes only. Always consult a healthcare professional.",
    };
  }

  const prompt = `A user searched for: "${query}"

${context ? `Background information from trusted sources:\n${context}\n\n` : ""}

Your task: Directly and completely answer the user's query as an AI Overview, exactly like Google's AI Overview feature. 

Rules:
- If it's a "who" question → identify the person(s) and explain their role with context
- If it's a "what is" question → define it clearly and explain it
- If it's a "how" question → explain the process or mechanism
- If it's a "why" question → explain the reasons/causes
- If it's a symptom/condition search → explain what it is, causes, and key facts
- Always be direct — start the answer immediately, don't say "Great question" or repeat the query
- Write 2–3 focused paragraphs that actually answer the question
- Keep language clear for a general audience

Respond ONLY with valid JSON:
{
  "summary": "2-3 paragraphs directly answering the query (200-350 words total)",
  "keyFacts": ["short fact 1", "short fact 2", "short fact 3", "short fact 4", "short fact 5"],
  "relatedQuestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3", "follow-up question 4", "follow-up question 5"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a medical AI assistant that directly answers health and medical questions. Always give specific, accurate answers — never vague overviews. If asked 'who discovered X', name the person. If asked 'what causes Y', explain the causes. Respond only with valid JSON.",
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
        "AI-generated overview for educational purposes only. Not a substitute for professional medical advice.",
    };
  } catch (err) {
    console.error("Groq overview error:", err);
    const sentences = context
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.length > 30)
      .slice(0, 5)
      .join(" ");
    return {
      summary: sentences,
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
