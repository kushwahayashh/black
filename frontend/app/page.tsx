import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, FolderOpen, Play, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Video Library
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A modern, responsive video library management system. Organize, browse, and play your videos with ease.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Link href="/videos">
              <Button size="lg" className="w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4" />
                Browse Videos
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-20 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Organized Library</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically scan and organize your video collection with customizable folder configurations.
            </p>
          </div>
          
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Play className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Instant Playback</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click and play any video instantly with our built-in video player. Support for multiple formats.
            </p>
          </div>
          
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Easy Configuration</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simple configuration file to set up your video and thumbnail directories. No complex setup required.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to get started? Add your videos to the configured directory and they&apos;ll appear automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
