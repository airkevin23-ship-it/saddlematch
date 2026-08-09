import Image from "next/image";

// The Wildflower card — the moment the whole feature exists for. Sizes and
// colours below are Kevin's CSS translated one-for-one: 380px card, #FAF4EB
// cream, #C87A64 terracotta, 140px photo, 32px badge, 200px bloom.
//
// The bloom is passed in rather than hardcoded so this cannot render a broken
// image while the artwork is still being made. Without it the card still reads.

type Pronouns = { possessive: string; contraction: string };

// Gender is free text in the profiles table, so anything unrecognised falls
// through to they/their. Getting someone's pronouns wrong on the one screen
// built to make them feel good is worse than being slightly generic.
function pronounsFor(gender?: string | null): Pronouns {
  const g = (gender ?? "").trim().toLowerCase();
  if (["man", "male", "m"].includes(g)) {
    return { possessive: "his", contraction: "he’d" };
  }
  if (["woman", "female", "f"].includes(g)) {
    return { possessive: "her", contraction: "she’d" };
  }
  return { possessive: "their", contraction: "they’d" };
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

export default function WildflowerCard({
  senderName,
  senderPhotoUrl,
  senderGender,
  flowerSrc,
}: {
  senderName: string;
  senderPhotoUrl?: string | null;
  senderGender?: string | null;
  flowerSrc?: string;
}) {
  const p = pronounsFor(senderGender);

  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[20px] border border-[#EBE1D1] bg-[#FAF4EB] px-[30px] py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      {/* 140px photo. The 3px terracotta ring plus 4px of padding is what
          creates the double-ring look in the mockup. */}
      <div className="relative mx-auto mb-[30px] h-[140px] w-[140px]">
        <div className="h-full w-full rounded-full border-[3px] border-[#C87A64] p-1">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-stone-200">
            {senderPhotoUrl ? (
              <Image
                src={senderPhotoUrl}
                alt={senderName}
                fill
                sizes="140px"
                className="object-cover"
              />
            ) : null}
          </div>
        </div>
        {/* The badge's border matches the card background, so it reads as
            punched through the photo ring rather than sitting on top of it. */}
        <span className="absolute -bottom-2.5 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[#FAF4EB] bg-[#C87A64] text-white">
          <Sparkle className="h-3 w-3" />
        </span>
      </div>

      <h1 className="font-display mb-5 text-[32px] leading-[1.2] text-[#2D2D2D]">
        <span className="font-semibold">{senderName}</span> sent you
        <br />a{" "}
        <span className="font-display text-[38px] italic text-[#C87A64]">Wildflower</span>
      </h1>

      {flowerSrc ? (
        <div className="my-[30px]">
          <Image
            src={flowerSrc}
            alt=""
            width={600}
            height={600}
            className="mx-auto h-auto w-[200px] object-contain"
          />
        </div>
      ) : (
        <div className="my-10" />
      )}

      <p className="mb-[25px] text-base leading-[1.5] text-[#4A4A4A]">
        An extra-interest signal &mdash;
        <br />
        {p.contraction} really like to get to know you.
      </p>

      <div className="my-[25px] flex items-center justify-center gap-[15px]">
        <span className="h-px w-[60px] bg-[#E6D9C8]" />
        <Sparkle className="h-2.5 w-2.5 text-[#C87A64]" />
        <span className="h-px w-[60px] bg-[#E6D9C8]" />
      </div>

      <p className="text-sm leading-[1.5] text-[#737373]">
        Open {p.possessive} profile in Discover to decide
        <br />
        whether you&rsquo;d like to connect.
      </p>
    </div>
  );
}
