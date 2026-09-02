import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/session";

export async function GET() {
  const profile = await getProfile();
  
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.json(profile);
}
