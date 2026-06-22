import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/ai";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const symptoms = req.nextUrl.searchParams.get("symptoms")?.trim() || q;
  const age = req.nextUrl.searchParams.get("age")?.trim();
  const gender = req.nextUrl.searchParams.get("gender")?.trim();
  const duration = req.nextUrl.searchParams.get("duration")?.trim();
  const severity = req.nextUrl.searchParams.get("severity")?.trim();
  const mode = req.nextUrl.searchParams.get("mode")?.trim() as "patient" | "clinician" | undefined;

  if (!symptoms) {
    return NextResponse.json({ error: "Missing symptoms or query parameter" }, { status: 400 });
  }

  try {
    const data = await analyzeSymptoms(symptoms, age, gender, duration, severity, mode);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Symptoms route error:", err);
    return NextResponse.json(
      { error: "Failed to analyze symptoms" },
      { status: 500 }
    );
  }
}
