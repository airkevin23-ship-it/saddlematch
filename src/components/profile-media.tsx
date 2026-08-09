"use client";

import { useState } from "react";

// One media carousel used everywhere a profile is shown, so Preview is a
// truthful rehearsal of the Discover card rather than a separate rendering
// that drifts. Preview previously hardcoded photo_urls[0] and never mentioned
// intro_video_url at all, which meant a member with three photos and a video
// saw exactly one photo and had no idea their video appeared nowhere.
//
// Video leads when present. It is the highest-signal thing on a dating
// profile and burying it behind three photo taps wastes it. It is not
// autoplayed: sound firing unannounced while someone browses in public is a
// good way to get the app closed.

type MediaItem = { kind: "video" | "photo"; src: string };

export default function ProfileMedia({
  photoUrls,
  videoUrl,
  alt = "Profile media",
}: {
  photoUrls?: string[] | null;
  videoUrl?: string | null;
  alt?: string;
}) {
  // Photos first, video last. The main photo is the one the profile editor
  // promises people will see first, so it has to lead here too. A video that
  // opens on a still frame is a weak first impression next to a chosen photo.
  const items: MediaItem[] = [
    ...(photoUrls ?? []).map((src) => ({ kind: "photo" as const, src })),
    ...(videoUrl ? [{ kind: "video" as const, src: videoUrl }] : []),
  ];

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(items.length - 1, 0));
  const current = items[safeIndex];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-line text-sm text-ink-soft">
        No photos yet
      </div>
    );
  }

  const go = (delta: number) => {
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return items.length - 1;
      if (next >= items.length) return 0;
      return next;
    });
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-line">
      {current.kind === "video" ? (
        <video
          key={current.src}
          src={current.src}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full bg-ink object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.src}
          src={current.src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}

      {items.length > 1 && (
        <>
          {/* Tap targets sit beside the video rather than over it, so they
              never swallow a tap meant for the play button. */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute bottom-0 left-0 top-0 w-14 cursor-pointer bg-transparent"
          />
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute bottom-0 right-0 top-0 w-14 cursor-pointer bg-transparent"
          />

          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center gap-1.5 px-3">
            {items.map((item, i) => (
              <span
                key={item.src}
                className={`h-1 flex-1 rounded-full ${
                  i === safeIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {current.kind === "video" && (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Intro video
            </span>
          )}
        </>
      )}
    </div>
  );
}
