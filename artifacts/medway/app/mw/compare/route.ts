import { NextRequest, NextResponse } from "next/server";
import { compareConditions } from "@/lib/ai";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const q1 = req.nextUrl.searchParams.get("q1")?.trim();
  const q2 = req.nextUrl.searchParams.get("q2")?.trim();

  if (!q1 || !q2) {
    return NextResponse.json({ error: "Missing q1 or q2 parameters" }, { status: 400 });
  }

  try {
    const data = await compareConditions(q1, q2);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Compare route error:", err);
    return NextResponse.json(
      { error: "Failed to compare conditions" },
      { status: 500 }
    );
  }
}
