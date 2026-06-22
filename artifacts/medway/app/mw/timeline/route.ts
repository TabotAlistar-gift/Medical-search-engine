import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Timeline feature is disabled" }, { status: 404 });
}
