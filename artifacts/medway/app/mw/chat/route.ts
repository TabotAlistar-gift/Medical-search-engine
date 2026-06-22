import { NextRequest } from "next/server";
import { streamChatResponse } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, query, mode } = body as {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    query: string;
    mode?: "patient" | "clinician";
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid request", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChatResponse(messages, query ?? "", mode)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
