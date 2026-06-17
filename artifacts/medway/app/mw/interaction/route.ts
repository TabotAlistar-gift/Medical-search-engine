import { NextRequest, NextResponse } from "next/server";
import { checkDrugInteractions } from "@/lib/ai";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("drugs") || req.nextUrl.searchParams.get("q") || "";
  const drugs = query
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  if (drugs.length === 0) {
    return NextResponse.json({ error: "Missing drugs query parameter" }, { status: 400 });
  }

  try {
    const data = await checkDrugInteractions(drugs);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Interaction checker route error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate interactions" },
      { status: 500 }
    );
  }
}
