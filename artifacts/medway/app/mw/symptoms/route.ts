import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/ai";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const data = await analyzeSymptoms(query);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Symptoms route error:", err);
    return NextResponse.json(
      { error: "Failed to analyze symptoms" },
      { status: 500 }
    );
  }
}
