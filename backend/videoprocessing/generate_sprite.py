#!/usr/bin/env python3
"""
Video thumbnail sprite & WebVTT generator - cleaned up version.
"""

import argparse
import math
import subprocess
import tempfile
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys
import os


def get_worker_count() -> int:
    """Get optimal worker count."""
    return min(8, max(2, os.cpu_count() or 4))


def probe_duration(input_path: Path) -> float:
    """Get video duration."""
    result = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(input_path)
    ], capture_output=True, text=True, check=True)
    return float(result.stdout.strip())


def format_timestamp(seconds: float) -> str:
    """Format timestamp for WebVTT."""
    ms = int((seconds - int(seconds)) * 1000)
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def write_vtt(timestamps: list, cols: int, size: tuple, sprite_rel: str, out_vtt: Path):
    """Write WebVTT file."""
    width, height = size
    lines = ["WEBVTT", ""]
    for idx, ts in enumerate(timestamps):
        start = format_timestamp(ts)
        end = format_timestamp(timestamps[idx + 1]) if idx + 1 < len(timestamps) else format_timestamp(ts + 1)
        x, y = (idx % cols) * width, (idx // cols) * height
        lines.append(f"{start} --> {end}")
        lines.append(f"{sprite_rel}#xywh={x},{y},{width},{height}")
        lines.append("")
    out_vtt.write_text("\n".join(lines), encoding="utf-8")


def create_sprite_single_command(input_path: Path, timestamps: list, size: tuple, cols: int,
                                output_path: Path, image_format: str, quality: int) -> bool:
    """Create sprite using single FFmpeg command."""
    tile_w, tile_h = size
    total_frames = len(timestamps)
    rows = math.ceil(total_frames / cols)
    
    if total_frames > 50:
        return False
    
    select_expr = "+".join([f"eq(t,{ts})" for ts in timestamps[:50]])
    
    cmd = ["ffmpeg", "-y", "-i", str(input_path)]
    filter_chain = f"select='{select_expr}',scale={tile_w}:{tile_h}:flags=lanczos,tile={cols}x{rows}"
    cmd += ["-filter_complex", filter_chain]
    
    if image_format.lower() == "webp":
        cmd += ["-c:v", "libwebp", "-quality", str(quality), "-compression_level", "6"]
    elif image_format.lower() in ("jpg", "jpeg"):
        q_val = max(2, min(31, 32 - (quality * 30 // 100)))
        cmd += ["-c:v", "mjpeg", "-q:v", str(q_val)]
    else:
        cmd += ["-c:v", "png", "-compression_level", "6"]
    
    cmd += ["-threads", str(get_worker_count()), str(output_path), "-hide_banner", "-loglevel", "error"]
    
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def extract_frame(input_path: Path, ts: float, size: tuple, out: Path, quality: int):
    """Extract single frame."""
    width, height = size
    q_val = max(2, min(31, 32 - (quality * 30 // 100)))
    cmd = [
        "ffmpeg", "-y", "-ss", str(ts), "-i", str(input_path), "-frames:v", "1",
        "-vf", f"scale={width}:{height}:flags=lanczos",
        "-c:v", "mjpeg", "-q:v", str(q_val),
        str(out), "-hide_banner", "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True)


def create_sprite_streaming(input_path: Path, timestamps: list, size: tuple, cols: int,
                           output_path: Path, image_format: str, quality: int):
    """Create sprite using streaming method for large videos."""
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        total = len(timestamps)
        rows = math.ceil(total / cols)
        
        def extract_worker(args):
            idx, ts = args
            out = tmpdir / f"frame_{idx:05d}.jpg"
            extract_frame(input_path, ts, size, out, quality)
            return idx
        
        # Extract frames
        with ThreadPoolExecutor(max_workers=get_worker_count()) as executor:
            futures = [executor.submit(extract_worker, (idx, ts)) for idx, ts in enumerate(timestamps)]
            completed = 0
            for future in as_completed(futures):
                future.result()
                completed += 1
                sys.stdout.write(f"\rExtracting frames: {completed}/{total}")
                sys.stdout.flush()
        print()
        
        # Assemble sprite
        input_pattern = tmpdir / "frame_%05d.jpg"
        cmd = ["ffmpeg", "-y", "-framerate", "1", "-i", str(input_pattern)]
        cmd += ["-filter_complex", f"tile={cols}x{rows}"]
        
        if image_format.lower() == "webp":
            cmd += ["-c:v", "libwebp", "-quality", str(quality), "-compression_level", "6"]
        elif image_format.lower() in ("jpg", "jpeg"):
            q_val = max(2, min(31, 32 - (quality * 30 // 100)))
            cmd += ["-c:v", "mjpeg", "-q:v", str(q_val)]
        else:
            cmd += ["-c:v", "png", "-compression_level", "6"]
        
        cmd += [str(output_path), "-hide_banner", "-loglevel", "error"]
        subprocess.run(cmd, check=True)


def process_video(input_path: Path, outdir: Path, cols: int, width: int, height: int, 
                 interval: int, image_format: str, image_quality: int):
    """Process single video."""
    start_time = time.time()
    
    duration = probe_duration(input_path)
    timestamps = [max(0.5, i) for i in range(0, int(duration), interval)]
    if not timestamps:
        timestamps = [0.5]
    
    base = input_path.stem
    outdir.mkdir(parents=True, exist_ok=True)
    
    sprite_path = outdir / f"{base}_sprite.{image_format}"
    vtt_path = outdir / f"{base}_sprite.vtt"
    
    # Try single command first, fallback to streaming
    if len(timestamps) <= 50 and create_sprite_single_command(
        input_path, timestamps, (width, height), cols, 
        sprite_path, image_format, image_quality
    ):
        print(f"Processing {base}...")
    else:
        print(f"Processing {base} ({len(timestamps)} frames)...")
        create_sprite_streaming(input_path, timestamps, (width, height), cols,
                               sprite_path, image_format, image_quality)
    
    write_vtt(timestamps, cols, (width, height), sprite_path.name, vtt_path)
    
    file_size = sprite_path.stat().st_size / (1024 * 1024)
    elapsed = time.time() - start_time
    print(f"{base}: {len(timestamps)} frames, {file_size:.1f}MB, {elapsed:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="Video thumbnail sprite generator")
    parser.add_argument("--input", help="Input video file or directory", default="../filen/videos")
    parser.add_argument("--outdir", help="Output directory", default="../filen/processed")
    parser.add_argument("--cols", type=int, default=10, help="Sprite columns")
    parser.add_argument("--width", type=int, default=320, help="Thumbnail width")
    parser.add_argument("--height", type=int, default=180, help="Thumbnail height")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between thumbnails")
    parser.add_argument("--image-format", choices=["webp", "jpg", "png"], default="webp")
    parser.add_argument("--image-quality", type=int, default=85, help="Image quality 1-100")
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    outdir = Path(args.outdir)
    
    if input_path.is_dir():
        video_files = []
        for ext in ("*.mp4", "*.mov", "*.avi", "*.mkv", "*.webm", "*.m4v"):
            video_files.extend(sorted(input_path.glob(ext)))
        
        if not video_files:
            print(f"No video files found in: {input_path}")
            sys.exit(1)
        
        for video in video_files:
            process_video(video, outdir, args.cols, args.width, args.height,
                         args.interval, args.image_format, args.image_quality)
    
    elif input_path.is_file():
        process_video(input_path, outdir, args.cols, args.width, args.height,
                     args.interval, args.image_format, args.image_quality)
    else:
        print("Input path not found")
        sys.exit(1)


if __name__ == "__main__":
    main()