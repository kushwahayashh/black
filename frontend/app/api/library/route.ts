import { NextResponse } from "next/server";
import { VideoService } from "@/lib/video-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const videos = await VideoService.getAllVideos();
    return NextResponse.json(videos, {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[library] Failed to load videos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


