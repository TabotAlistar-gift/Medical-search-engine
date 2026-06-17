import { NextRequest, NextResponse } from "next/server";
import { generateTimeline } from "@/lib/ai";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const data = await generateTimeline(query);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Timeline route error:", err);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
