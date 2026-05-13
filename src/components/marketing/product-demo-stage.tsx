import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { cn } from "@/lib/utils";

type ProductDemoStageProps = {
  title: string;
  body: string;
  posterAlt: string;
  posterSrc?: string;
  videoSrc?: string;
  className?: string;
};

export function ProductDemoStage({
  title,
  body,
  posterAlt,
  posterSrc = "/marketing/northline-demo-poster.png",
  videoSrc,
  className,
}: ProductDemoStageProps) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border bg-raised shadow-soft",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
            <PlayCircle aria-hidden="true" className="size-5" />
          </span>
          <div>
            <Badge tone="teal">Preview workflow</Badge>
            <p className="mt-2 text-caption text-muted">
              Synthetic product walkthrough
            </p>
          </div>
        </div>
        <span className="hidden rounded-sm border border-border bg-canvas px-2.5 py-1 font-mono text-caption font-black text-muted sm:inline-flex">
          40 sec demo slot
        </span>
      </div>

      <div className="relative aspect-video overflow-hidden bg-subtle">
        {videoSrc ? (
          <video
            className="size-full object-cover"
            poster={posterSrc}
            muted
            loop
            playsInline
            preload="metadata"
            controls
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={posterSrc}
            alt={posterAlt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="grid gap-3 border-t border-border p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-title-sm font-black leading-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-body-sm leading-6 text-muted">
            {body}
          </p>
        </div>
        <p className="text-caption font-bold leading-5 text-muted lg:max-w-48 lg:text-right">
          Poster first. Muted video-ready stage when the generated MP4 is added.
        </p>
      </div>
    </div>
  );
}
