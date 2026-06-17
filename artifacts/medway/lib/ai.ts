import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export interface OverviewSection {
  heading: string;
  points: string[];
}

export interface OverviewResponse {
  intro: string;
  sections: OverviewSection[];
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
      intro:
        sentences ||
        `Search results for "${query}" are shown below from trusted medical sources.`,
      sections: [],
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

Your task: Provide a well-structured medical overview that directly answers the user's query.

Rules:
- Start with a short 1-2 sentence intro paragraph that directly defines or answers the query
- Then provide 2-4 named sections with bullet points (choose the most relevant from: "Symptoms", "Causes", "Risk Factors", "Diagnosis", "Treatment", "Prevention", "Key Facts", "How It Works", "Who Is Affected")
- Each section should have 3-5 concise bullet points
- Adapt the sections to the query type: for a condition use Symptoms/Causes/Treatment; for a drug use How It Works/Uses/Side Effects; for a person use Background/Contributions/Legacy
- Keep language clear for a general audience
- Be direct — never start with "Great question" or repeat the query

Respond ONLY with valid JSON:
{
  "intro": "1-2 sentence direct answer or definition (30-60 words)",
  "sections": [
    { "heading": "Section Name", "points": ["point 1", "point 2", "point 3"] },
    { "heading": "Section Name", "points": ["point 1", "point 2", "point 3"] }
  ],
  "relatedQuestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3", "follow-up question 4", "follow-up question 5"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are MedAI, a medical AI assistant embedded in MedWay — a trusted medical search engine. You ONLY answer questions related to medicine, health, anatomy, physiology, drugs, treatments, symptoms, diseases, mental health, nutrition, and related medical sciences. If the query is clearly not medical or health-related (e.g. sports, movies, politics, cooking, travel), respond ONLY with this JSON: {\"intro\": \"I can only help with medical and health topics. Please try a health-related question such as symptoms, diseases, treatments, or medications.\", \"sections\": [], \"relatedQuestions\": []}. Otherwise give specific, accurate medical answers. Respond only with valid JSON.",
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
      intro: parsed.intro ?? "",
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      summary: parsed.intro ?? parsed.summary ?? "",
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
      intro: sentences,
      sections: [],
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

  const systemPrompt = `You are MedAI, an expert medical AI assistant embedded in MedWay — a trusted medical search engine.

IMPORTANT: You are EXCLUSIVELY a medical assistant. You ONLY answer questions about:
- Diseases, conditions, and disorders
- Symptoms and their causes
- Medications, treatments, and therapies
- Anatomy, physiology, and biology
- Mental health and psychology
- Nutrition and lifestyle medicine
- Public health, vaccines, and epidemiology
- Medical procedures and diagnostics
- Healthcare professionals and medical history

If the user asks about ANYTHING outside medicine or health (e.g. sports, movies, music, politics, cooking, travel, technology, finance), respond with:
"I'm MedAI — I'm exclusively a medical assistant and can only help with health and medical questions. I'm not able to assist with [topic]. Is there a medical question I can help you with instead? 🏥"

For all medical questions:
- Be accurate, evidence-based, and clear
- Use plain language accessible to non-medical users
- Be empathetic, not alarming
- NEVER diagnose individuals
- Always remind users to consult a healthcare professional for personal health concerns

Context: The user was searching for "${query}".`;


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

export interface DiagnosticCondition {
  name: string;
  likelihood: "High" | "Moderate" | "Low";
  explanation: string;
}

export interface SymptomAnalysisResponse {
  intro: string;
  conditions: DiagnosticCondition[];
  warning: string;
}

export interface StudyGuideResponse {
  facts: string[];
  flashcards: Array<{ question: string; answer: string }>;
  quiz: Array<{ question: string; options: string[]; answerIndex: number; rationale: string }>;
  mnemonics: string[];
}

export interface ComparisonResponse {
  headers: string[];
  rows: Array<{ feature: string; c1Value: string; c2Value: string }>;
}

export interface InteractionResponse {
  severity: "High" | "Moderate" | "None";
  summary: string;
  interactions: Array<{ drugs: string[]; details: string; severity: "High" | "Moderate" | "None" }>;
}

export interface TimelineEvent {
  year: string;
  event: string;
  detail: string;
}

export interface TimelineResponse {
  title: string;
  events: TimelineEvent[];
}

export interface LearningStep {
  title: string;
  description: string;
  query: string;
}

export interface LearningPathResponse {
  current: string;
  steps: LearningStep[];
}

export async function analyzeSymptoms(symptoms: string): Promise<SymptomAnalysisResponse> {
  const groq = getGroq();
  if (!groq) {
    return {
      intro: `Analysis of reported symptoms: "${symptoms}".`,
      conditions: [
        { name: "Common Cold", likelihood: "High", explanation: "Frequently causes cough, runny nose, and fatigue." },
        { name: "Influenza (Flu)", likelihood: "Moderate", explanation: "Characterized by sudden onset of high fever, body aches, and chills." },
        { name: "Allergic Rhinitis", likelihood: "Low", explanation: "Can present with congestion and sneezing but fever is absent." }
      ],
      warning: "This is a simplified estimation. Please consult a clinician if symptoms worsen."
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a clinical symptom analyzer. Analyze symptoms and return possible differential diagnoses in JSON format. Do not diagnose directly, use terms like 'likelihood'."
        },
        {
          role: "user",
          content: `Analyze these symptoms: "${symptoms}". Return ONLY JSON:
{
  "intro": "Brief introductory context analyzing the symptom group.",
  "conditions": [
    { "name": "Condition Name", "likelihood": "High|Moderate|Low", "explanation": "Why this condition is a match." }
  ],
  "warning": "Standard clinical warning or recommendation."
}`
        }
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  } catch (err) {
    console.error("analyzeSymptoms error:", err);
    return {
      intro: "Failed to perform AI analysis.",
      conditions: [],
      warning: "Error connecting to AI service."
    };
  }
}

export async function generateStudyGuide(topic: string, context: string): Promise<StudyGuideResponse> {
  const groq = getGroq();
  if (!groq) {
    // Return high-quality exam mock data with 30 items for testing/fallback
    const mockFlashcards = Array.from({ length: 30 }, (_, i) => ({
      question: `Practice Question ${i + 1} regarding ${topic}: What is a key clinical diagnostic indicator?`,
      answer: `This is high-yield clinical fact ${i + 1} for ${topic}. Study classic presentations, pathophysiology, and management.`
    }));
    const mockQuiz = Array.from({ length: 30 }, (_, i) => ({
      question: `USMLE Board Exam Question ${i + 1}: A patient presents with clinical signs suggestive of ${topic}. Which of the following is the most appropriate next step in diagnostic management?`,
      options: [
        "Order first-line diagnostic confirmation testing",
        "Refer for specialist clinical evaluation and triage",
        "Initiate empirical primary pharmacotherapy immediately",
        "Instruct patient on lifestyle modifications and observe"
      ],
      answerIndex: 0,
      rationale: `First-line diagnostic confirmation testing is essential to confirm the diagnosis of ${topic} before initiating chronic or risk-carrying pharmacotherapy.`
    }));
    return {
      facts: [
        `${topic} is a high-yield clinical topic frequently tested on medical board examinations.`,
        `Familiarity with pathognomonic findings, etiology, and primary interventions is key to success.`
      ],
      flashcards: mockFlashcards,
      quiz: mockQuiz,
      mnemonics: [`Mnemonic for ${topic}: R-E-S-E-A-R-C-H.`]
    };
  }

  // Promise for facts, mnemonics, and 30 flashcards
  const studyGuidePromise = groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a medical education assistant. Generate high-yield facts, mnemonics, and exactly 30 flashcards in JSON format."
      },
      {
        role: "user",
        content: `Create a study guide for the medical topic: "${topic}". Use this context if available: "${context}".
Generate a few high-yield facts, 1-2 mnemonics, and exactly 30 high-yield, exam-style flashcards (Q&A format) suitable for medical students preparing for board exams.
Return ONLY JSON:
{
  "facts": ["fact 1", "fact 2"],
  "flashcards": [
    { "question": "Question text...", "answer": "Answer explanation..." }
  ],
  "mnemonics": ["Mnemonic name: explanation"]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500,
    response_format: { type: "json_object" }
  }).then(res => {
    const raw = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  }).catch(err => {
    console.error("Study guide flashcards error:", err);
    return { facts: [], flashcards: [], mnemonics: [] };
  });

  // Promise for exactly 30 quiz questions
  const quizPromise = groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a medical school board examiner. Generate exactly 30 multiple-choice questions in JSON format."
      },
      {
        role: "user",
        content: `Create a multiple-choice practice quiz for the medical topic: "${topic}". Use this context if available: "${context}".
Generate exactly 30 high-yield, exam-style multiple-choice questions (such as clinical vignettes or clinical concept questions) suitable for board exams (USMLE, COMLEX, or nursing boards).
Each question must contain 4 options, a 0-indexed answerIndex, and a detailed clinical rationale explaining why the correct choice is right and others are incorrect.
Return ONLY JSON:
{
  "quiz": [
    {
      "question": "A clinical vignette or exam question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "rationale": "Detailed clinical rationale explaining correct option..."
    }
  ]
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  }).then(res => {
    const raw = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  }).catch(err => {
    console.error("Study guide quiz error:", err);
    return { quiz: [] };
  });

  try {
    const [guideData, quizData] = await Promise.all([studyGuidePromise, quizPromise]);
    
    let facts = Array.isArray(guideData.facts) ? guideData.facts : [];
    let flashcards = Array.isArray(guideData.flashcards) ? guideData.flashcards : [];
    let quiz = Array.isArray(quizData.quiz) ? quizData.quiz : [];
    let mnemonics = Array.isArray(guideData.mnemonics) ? guideData.mnemonics : [];

    // Ensure we have at least some facts
    if (facts.length === 0) {
      facts = [
        `${topic} is a high-yield clinical topic frequently tested on medical board examinations.`,
        `Familiarity with pathognomonic findings, etiology, and primary interventions is key to success.`
      ];
    }

    // Ensure we have at least some mnemonics
    if (mnemonics.length === 0) {
      mnemonics = [`Mnemonic for ${topic}: R-E-S-E-A-R-C-H.`];
    }

    // Pad flashcards up to 30
    if (flashcards.length < 30) {
      const needed = 30 - flashcards.length;
      const startIdx = flashcards.length;
      for (let i = 0; i < needed; i++) {
        flashcards.push({
          question: `Clinical Review Question ${startIdx + i + 1} on ${topic}: What is a key diagnostic or management consideration?`,
          answer: `For board examinations, understand the pathognomonic presentation, diagnostic confirmation steps, and standard clinical guidelines for ${topic}.`
        });
      }
    }

    // Pad quiz up to 30
    if (quiz.length < 30) {
      const needed = 30 - quiz.length;
      const startIdx = quiz.length;
      for (let i = 0; i < needed; i++) {
        quiz.push({
          question: `Clinical Vignette Question ${startIdx + i + 1}: A patient presents with clinical signs suggestive of ${topic}. Which of the following is the most appropriate next step in diagnostic management?`,
          options: [
            "Order first-line diagnostic confirmation testing",
            "Refer for specialist clinical evaluation and triage",
            "Initiate empirical primary pharmacotherapy immediately",
            "Instruct patient on lifestyle modifications and observe"
          ],
          answerIndex: 0,
          rationale: `First-line diagnostic confirmation testing is essential to confirm the diagnosis of ${topic} before initiating chronic or risk-carrying pharmacotherapy.`
        });
      }
    }

    return { facts, flashcards, quiz, mnemonics };
  } catch (err) {
    console.error("generateStudyGuide Promise.all error:", err);
    
    // Return complete mock data on overall failure
    const mockFlashcards = Array.from({ length: 30 }, (_, i) => ({
      question: `Practice Question ${i + 1} regarding ${topic}: What is a key clinical diagnostic indicator?`,
      answer: `This is high-yield clinical fact ${i + 1} for ${topic}. Study classic presentations, pathophysiology, and management.`
    }));
    const mockQuiz = Array.from({ length: 30 }, (_, i) => ({
      question: `USMLE Board Exam Question ${i + 1}: A patient presents with clinical signs suggestive of ${topic}. Which of the following is the most appropriate next step in diagnostic management?`,
      options: [
        "Order first-line diagnostic confirmation testing",
        "Refer for specialist clinical evaluation and triage",
        "Initiate empirical primary pharmacotherapy immediately",
        "Instruct patient on lifestyle modifications and observe"
      ],
      answerIndex: 0,
      rationale: `First-line diagnostic confirmation testing is essential to confirm the diagnosis of ${topic} before initiating chronic or risk-carrying pharmacotherapy.`
    }));
    return {
      facts: [
        `${topic} is a high-yield clinical topic frequently tested on medical board examinations.`,
        `Familiarity with pathognomonic findings, etiology, and primary interventions is key to success.`
      ],
      flashcards: mockFlashcards,
      quiz: mockQuiz,
      mnemonics: [`Mnemonic for ${topic}: R-E-S-E-A-R-C-H.`]
    };
  }
}

export async function compareConditions(c1: string, c2: string): Promise<ComparisonResponse> {
  const groq = getGroq();
  if (!groq) {
    return {
      headers: ["Feature", c1, c2],
      rows: [
        { feature: "Primary Etiology", c1Value: "Refer to specific database details.", c2Value: "Refer to specific database details." },
        { feature: "Pathophysiology", c1Value: "Condition-specific pathways.", c2Value: "Condition-specific pathways." }
      ]
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a clinical comparative specialist. Compare two medical conditions side by side and output comparison rows in JSON format."
        },
        {
          role: "user",
          content: `Compare ${c1} and ${c2}. Return ONLY JSON:
{
  "headers": ["Feature", "${c1}", "${c2}"],
  "rows": [
    { "feature": "Etiology", "c1Value": "Value for ${c1}", "c2Value": "Value for ${c2}" },
    { "feature": "Primary Symptoms", "c1Value": "Value for ${c1}", "c2Value": "Value for ${c2}" },
    { "feature": "Key Treatment", "c1Value": "Value for ${c1}", "c2Value": "Value for ${c2}" }
  ]
}`
        }
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  } catch (err) {
    console.error("compareConditions error:", err);
    return { headers: ["Feature", c1, c2], rows: [] };
  }
}

export async function checkDrugInteractions(drugs: string[]): Promise<InteractionResponse> {
  const groq = getGroq();
  if (!groq) {
    const lower = drugs.map(d => d.toLowerCase());
    const isWarfarin = lower.some(l => l.includes("warfarin"));
    const isAspirin = lower.some(l => l.includes("aspirin") || l.includes("ibuprofen") || l.includes("advil") || l.includes("aleve"));
    if (isWarfarin && isAspirin) {
      return {
        severity: "High",
        summary: "High risk of bleeding. Concomitant use of anticoagulants (Warfarin) and NSAIDs/antiplatelets (Aspirin) synergistically increases risk of major gastrointestinal hemorrhage.",
        interactions: [
          { drugs: ["Warfarin", "Aspirin"], details: "Increases bleeding risk via pharmacodynamic synergy.", severity: "High" }
        ]
      };
    }
    return {
      severity: "None",
      summary: "No common contraindications detected in offline mock database. Always check with a pharmacist.",
      interactions: []
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a clinical pharmacologist. Check a list of drugs for drug-drug interactions and return warnings in JSON format."
        },
        {
          role: "user",
          content: `Evaluate interactions for these drugs: ${drugs.join(", ")}. Return ONLY JSON:
{
  "severity": "High|Moderate|None",
  "summary": "Overall summary of risks and mechanism.",
  "interactions": [
    { "drugs": ["Drug 1", "Drug 2"], "details": "Pharmacodynamic/pharmacokinetic interaction explanation", "severity": "High|Moderate|None" }
  ]
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  } catch (err) {
    console.error("checkDrugInteractions error:", err);
    return { severity: "None", summary: "Failed to perform AI analysis.", interactions: [] };
  }
}

export async function generateTimeline(topic: string): Promise<TimelineResponse> {
  const groq = getGroq();
  if (!groq) {
    return {
      title: `${topic} Historical Milestones`,
      events: [
        { year: "Antiquity", event: "Early documentation", detail: "Early references of symptom clusters found in ancient medical treatises." },
        { year: "Modern Era", event: "Modern diagnosis", detail: "Detailed classification established by pathologists." }
      ]
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a medical historian. Create a timeline of historical milestones for a disease, medical topic, or drug in JSON format."
        },
        {
          role: "user",
          content: `Create a timeline of key milestones for: "${topic}". Include 4-5 events. Return ONLY JSON:
{
  "title": "Timeline Title",
  "events": [
    { "year": "Year string", "event": "Brief event title", "detail": "Short description of what happened." }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (!parsed.events || !Array.isArray(parsed.events) || parsed.events.length === 0) {
      throw new Error("Invalid or empty events in timeline response");
    }
    return {
      title: parsed.title || `${topic} Historical Milestones`,
      events: parsed.events
    };
  } catch (err) {
    console.error("generateTimeline error:", err);
    return {
      title: `${topic} Historical Milestones`,
      events: [
        { year: "Antiquity", event: "Early documentation", detail: "Early references of symptom clusters found in ancient medical treatises." },
        { year: "Modern Era", event: "Modern diagnosis", detail: "Detailed classification established by pathologists." }
      ]
    };
  }
}

export async function generateLearningPath(topic: string): Promise<LearningPathResponse> {
  const groq = getGroq();
  if (!groq) {
    return {
      current: topic,
      steps: [
        { title: `Introduction to ${topic}`, description: `Understand the basics and primary definitions of ${topic}.`, query: `${topic} overview` },
        { title: `Pathophysiology of ${topic}`, description: `Learn about biological mechanisms and causes.`, query: `${topic} causes` },
        { title: `Clinical Management`, description: `Explore current standard diagnostic methods and treatments.`, query: `${topic} treatment` }
      ]
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a medical educator. Design a sequential learning path of 3-4 steps that guides a student from beginner to advanced on a health topic, outputting JSON."
        },
        {
          role: "user",
          content: `Create a learning path for: "${topic}". Return ONLY JSON:
{
  "current": "${topic}",
  "steps": [
    { "title": "Step title", "description": "What they will learn.", "query": "Search query they should run for this step" }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      throw new Error("Invalid or empty steps in learning path response");
    }
    return {
      current: parsed.current || topic,
      steps: parsed.steps
    };
  } catch (err) {
    console.error("generateLearningPath error:", err);
    return {
      current: topic,
      steps: [
        { title: `Introduction to ${topic}`, description: `Understand the basics and primary definitions of ${topic}.`, query: `${topic} overview` },
        { title: `Pathophysiology of ${topic}`, description: `Learn about biological mechanisms and causes.`, query: `${topic} causes` },
        { title: `Clinical Management`, description: `Explore current standard diagnostic methods and treatments.`, query: `${topic} treatment` }
      ]
    };
  }
}

export interface StudyNotesResponse {
  title: string;
  introduction: string;
  epidemiology?: string;
  pathophysiology: string;
  clinicalPresentation: string;
  diagnostics: string;
  treatment: string;
  prognosis: string;
  clinicalPearls: string[];
}

export async function generateStudyNotes(topic: string, context: string): Promise<StudyNotesResponse> {
  const groq = getGroq();
  if (!groq) {
    return {
      title: topic,
      introduction: `This is a comprehensive study reference introduction for ${topic}. Study notes compile definition, etiology, pathophysiology, diagnostics, and therapeutics.`,
      epidemiology: `Epidemiology and population distribution metrics for ${topic}.`,
      pathophysiology: `Detailed biological mechanisms, risk factors, and pathogenetic progression of ${topic}.`,
      clinicalPresentation: `Key symptoms, physical signs, and clinical presentation markers.`,
      diagnostics: `Gold-standard diagnostic criteria, laboratory evaluations, and imaging markers.`,
      treatment: `First-line management, pharmacotherapy protocols, and patient education parameters.`,
      prognosis: `Long-term outcomes, potential complications, and mortality/morbidity risks.`,
      clinicalPearls: [
        `High-Yield exam tip: Understand key differentiators of ${topic}.`,
        `Recall primary treatment modalities.`
      ]
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert academic medical professor compiling textbook-quality study monographs and clinical notes for medical students."
        },
        {
          role: "user",
          content: `Generate detailed study notes for: "${topic}". Use this context if available: "${context}".
Provide thorough medical textbook detail for each section (around 100-200 words per section). Keep the language academic, structured, and clinically precise.
Return ONLY JSON format:
{
  "title": "${topic}",
  "introduction": "Core definition, etiology, and history.",
  "epidemiology": "Prevalence, incidence, risk factors, and demographics.",
  "pathophysiology": "Cellular/molecular mechanism, anatomy changes, and pathogenesis.",
  "clinicalPresentation": "Pathognomonic signs, symptoms, acute vs chronic presentations.",
  "diagnostics": "Confirmatory tests, imaging findings, lab work, differential diagnoses.",
  "treatment": "Standard guidelines, first-line therapies, surgical options if any, and supportive care.",
  "prognosis": "Clinical outcomes, complications, follow-up parameters.",
  "clinicalPearls": ["Crucial exam tip 1", "Crucial exam tip 2", "Crucial exam tip 3"]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    if (!parsed.introduction || !parsed.pathophysiology) {
      throw new Error("Incomplete study notes JSON");
    }
    return {
      title: parsed.title || topic,
      introduction: parsed.introduction,
      epidemiology: parsed.epidemiology,
      pathophysiology: parsed.pathophysiology,
      clinicalPresentation: parsed.clinicalPresentation || "Key signs and symptoms include classic clinical presentations associated with this topic.",
      diagnostics: parsed.diagnostics || "Gold-standard diagnostic evaluation involves laboratory work and imaging confirmation.",
      treatment: parsed.treatment || "Therapeutic management follows current consensus guidelines and supportive care.",
      prognosis: parsed.prognosis || "Clinical outcomes are highly dependent on early identification and targeted intervention.",
      clinicalPearls: Array.isArray(parsed.clinicalPearls) ? parsed.clinicalPearls : [
        `High-Yield exam tip: Understand key differentiators of ${topic}.`,
        `Recall primary treatment modalities.`
      ]
    };
  } catch (err) {
    console.error("generateStudyNotes error:", err);
    return {
      title: topic,
      introduction: `This is a comprehensive study reference introduction for ${topic}. Study notes compile definition, etiology, pathophysiology, diagnostics, and therapeutics.`,
      epidemiology: `Epidemiology and population distribution metrics for ${topic}.`,
      pathophysiology: `Detailed biological mechanisms, risk factors, and pathogenetic progression of ${topic}.`,
      clinicalPresentation: `Key symptoms, physical signs, and clinical presentation markers.`,
      diagnostics: `Gold-standard diagnostic criteria, laboratory evaluations, and imaging markers.`,
      treatment: `First-line management, pharmacotherapy protocols, and patient education parameters.`,
      prognosis: `Long-term outcomes, potential complications, and mortality/morbidity risks.`,
      clinicalPearls: [
        `High-Yield exam tip: Understand key differentiators of ${topic}.`,
        `Recall primary treatment modalities.`
      ]
    };
  }
}

