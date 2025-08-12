import { NextRequest, NextResponse } from "next/server";
import { VideoService } from "@/lib/video-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fileName: string | undefined = body?.fileName;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Missing or invalid fileName" }, { status: 400 });
    }

    const url = await VideoService.regenerateThumbnail(fileName);

    if (!url) {
      return NextResponse.json({ ok: false, message: "Could not regenerate thumbnail" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, thumbnailUrl: url });
  } catch (error) {
    console.error("[thumbnail] Internal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


