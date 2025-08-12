import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { spawn } from "child_process";
import { config } from "@/config";
import { fileExists } from "@/lib/file-utils";
import { stat } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fileName: string | undefined = body?.fileName;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Missing or invalid fileName" }, { status: 400 });
    }

    // Resolve paths
    const videosDir = join(config.storageDir, "videos");
    const processedDir = join(config.storageDir, "processed");
    const videoPath = join(videosDir, fileName);

    // Script lives outside of the Next.js app directory
    const scriptPath = join(process.cwd(), "..", "backend", "videoprocessing", "generate_sprite.py");

    // Validate paths exist
    const exists = await fileExists(videoPath);
    if (!exists) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    const scriptExists = await fileExists(scriptPath);
    if (!scriptExists) {
      return NextResponse.json({ error: "Sprite generator script not found" }, { status: 500 });
    }

    // Log context
    console.log(`[sprite] Starting sprite generation for ${fileName}`);
    console.log(`[sprite] Script: ${scriptPath}`);
    console.log(`[sprite] Video: ${videoPath}`);
    console.log(`[sprite] Output dir: ${processedDir}`);

    // Spawn python with unbuffered stdout to stream in real-time
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const args = ["-u", scriptPath, "--input", videoPath];

    const child = spawn(pythonCmd, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(`[sprite:${fileName}] ${chunk.toString()}`);
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(`[sprite:${fileName}:err] ${chunk.toString()}`);
    });

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", (code) => resolve(code ?? 0));
    });

    if (exitCode !== 0) {
      console.error(`[sprite] Generation failed for ${fileName} with code ${exitCode}`);
      return NextResponse.json({ ok: false, fileName, exitCode }, { status: 500 });
    }

    // Touch processed dir to produce a timestamp (ensures directory exists and is accessible)
    try { await stat(processedDir); } catch {}

    console.log(`[sprite] Generation completed for ${fileName}`);
    return NextResponse.json({ ok: true, fileName });
  } catch (error) {
    console.error("[sprite] Internal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
