"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { CreatorData } from "@/lib/portfolio/creator-data";

export function VideoShowcase({ creator }: { creator: CreatorData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { videos } = creator;

  if (videos.length === 0) {
    return null;
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const featuredVideo = videos.find((v) => v.featured) || videos[0];
  const otherVideos = videos.filter((v) => v !== featuredVideo);

  return (
    <section id="videos" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Video Content
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl text-balance">
          Featured Videos
        </h2>
        <p className="mt-3 text-muted-foreground">Authentic content that connects with audiences</p>

        {featuredVideo && (
          <div className="mt-10">
            <div className="relative aspect-[9/16] max-w-sm mx-auto overflow-hidden rounded-lg bg-muted shadow-lg">
              <video
                ref={videoRef}
                src={featuredVideo.url}
                poster={featuredVideo.thumbnailUrl}
                className="h-full w-full object-cover"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
              />

              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/20 transition-colors hover:bg-foreground/30"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg">
                    <Play className="h-7 w-7 ml-1" />
                  </div>
                </button>
              )}

              {isPlaying && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground"
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                  <button
                    onClick={toggleMute}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent p-4 pt-16 pointer-events-none">
                <p className="text-sm font-semibold text-background">{featuredVideo.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-background/80 capitalize">
                    {featuredVideo.platform}
                  </span>
                  {featuredVideo.views && (
                    <>
                      <span className="text-xs text-background/60">•</span>
                      <span className="text-xs text-background/80">{featuredVideo.views}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {otherVideos.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {otherVideos.map((video) => (
              <a
                key={video.url}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[9/16] bg-muted overflow-hidden rounded-lg cursor-pointer"
              >
                {video.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                    <Play className="h-5 w-5 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-12">
                  <p className="text-sm font-medium text-background">{video.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-background/80 capitalize">
                      {video.platform}
                    </span>
                    {video.views && (
                      <>
                        <span className="text-xs text-background/60">•</span>
                        <span className="text-xs text-background/80">{video.views}</span>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
