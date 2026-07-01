import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ severity: "None", summary: "Removed", interactions: [] });
}
