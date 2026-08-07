// The Wildflower artifact itself, rendered as a component so the exact same
// card can be shown in two places: as a preview inside the purchase modal, so
// a buyer can see what five dollars actually buys, and later on the recipient
// side once the read path exists.
//
// The flower is inline SVG rather than an image file. That keeps the card a
// single self-contained component with nothing to upload, lets it inherit the
// brand colours, and stays crisp at any size.

function Flower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g stroke="#7d8f6a" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M60 116V64" />
        <path d="M60 92c-10 0-18-6-21-15 10-2 18 3 21 15Z" fill="#8fa07a" stroke="none" />
        <path d="M60 78c9-1 16-7 18-16-9-1-16 4-18 16Z" fill="#8fa07a" stroke="none" />
      </g>
      <g fill="#e9a9a1">
        <ellipse cx="60" cy="30" rx="12" ry="17" />
        <ellipse cx="60" cy="30" rx="12" ry="17" transform="rotate(72 60 47)" />
        <ellipse cx="60" cy="30" rx="12" ry="17" transform="rotate(144 60 47)" />
        <ellipse cx="60" cy="30" rx="12" ry="17" transform="rotate(216 60 47)" />
        <ellipse cx="60" cy="30" rx="12" ry="17" transform="rotate(288 60 47)" />
      </g>
      <circle cx="60" cy="47" r="8" fill="#d98878" />
      <circle cx="60" cy="47" r="4" fill="#c4705f" />
    </svg>
  );
}

export default function WildflowerCard({
  senderName,
  senderPhotoUrl,
  preview = false,
}: {
  senderName: string;
  senderPhotoUrl?: string | null;
  /** Softens the closing line for use as a sample in the purchase modal. */
  preview?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-3xl border border-brand/15 bg-[#fdf4ec] px-6 py-7 text-center">
      <div className="relative mx-auto w-fit">
        <span className="block h-24 w-24 overflow-hidden rounded-full ring-2 ring-brand/40 ring-offset-2 ring-offset-[#fdf4ec]">
          {senderPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={senderPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-line text-xl font-bold text-ink-soft">
              {senderName.slice(0, 1)}
            </span>
          )}
        </span>
        <span className="absolute -bottom-2 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-brand text-sm text-white">
          &#9733;
        </span>
      </div>

      <p className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-ink">
        {senderName} sent you
        <br />
        a <span className="italic text-brand">Wildflower</span>
      </p>

      <Flower className="mx-auto mt-4 h-28 w-28" />

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        An extra-interest signal &mdash; they&rsquo;d really like to get to know
        you.
      </p>

      <div className="mx-auto mt-5 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-brand/25" />
        <span className="text-brand/60">&#10022;</span>
        <span className="h-px w-12 bg-brand/25" />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        {preview
          ? "This is the card they receive. It does not guarantee a match."
          : "Open their profile in Discover to decide whether you would like to connect."}
      </p>
    </div>
  );
}
