import Image from "next/image";

// The Wildflower card — the moment the whole feature exists for.
//
// Kevin's premium design: gradient cream field, bronze ring on the photo, a
// soft aura behind the bloom, gradient hairline dividers. Values are his.
//
// The bloom is a prop rather than a hardcoded path so the card cannot render a
// broken image if the artwork is missing. Same for the photo.

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
    <div
      className="animate-elegantReveal w-full max-w-[380px] rounded-[24px] border border-[#E6DEC8] bg-[linear-gradient(180deg,#FCF9F2_0%,#F5EFE4_100%)] px-[35px] py-[45px] text-center opacity-0"
      style={{
        boxShadow:
          "0 20px 40px rgba(45, 35, 25, 0.08), 0 4px 12px rgba(45, 35, 25, 0.04), inset 0 1px 0px rgba(255, 255, 255, 0.8)",
      }}
    >
      {/* Photo in a bronze gradient ring */}
      <div className="relative mx-auto mb-[35px] h-[144px] w-[144px]">
        <div className="h-full w-full rounded-full bg-[linear-gradient(135deg,#E6B999_0%,#C87A64_50%,#8A4B37_100%)] p-[3px] shadow-[0_8px_16px_rgba(200,122,100,0.2)]">
          <div className="relative h-full w-full overflow-hidden rounded-full border-[4px] border-[#FCF9F2] bg-[#E4DED6]">
            {senderPhotoUrl ? (
              <Image
                src={senderPhotoUrl}
                alt={senderName}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : null}
          </div>
        </div>
        <div className="absolute -bottom-[6px] left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[#F8F3E9] bg-[linear-gradient(135deg,#D48873_0%,#B86A54_100%)] shadow-[0_4px_8px_rgba(184,106,84,0.3)] text-white">
          <Sparkle className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* font-display is Playfair. Tailwind's font-serif would fall back to a
          generic system serif and lose the brand face entirely. */}
      <h1 className="font-display mb-[15px] text-[34px] leading-[1.15] tracking-[-0.5px] text-[#24211F]">
        <span className="font-semibold">{senderName}</span> sent you
        <br />a{" "}
        <span className="font-display text-[42px] italic tracking-normal text-[#B86A54]">
          Wildflower
        </span>
      </h1>

      <div className="relative my-[25px] flex justify-center">
        <div className="absolute left-1/2 top-1/2 z-0 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,122,100,0.08)_0%,rgba(252,249,242,0)_70%)]" />
        {flowerSrc ? (
          <Image
            src={flowerSrc}
            alt=""
            width={640}
            height={722}
            className="relative z-10 h-auto w-[220px] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.03)]"
          />
        ) : (
          <div className="h-[220px]" />
        )}
      </div>

      <p className="mb-[30px] text-[17px] font-normal leading-[1.6] text-[#3A3532]">
        <span className="mb-[6px] block text-[11px] font-medium uppercase tracking-[2px] text-[#8C8279]">
          An extra-interest signal
        </span>
        {p.contraction} really like to get to know you.
      </p>

      <div className="my-[30px] flex items-center justify-center gap-[15px] opacity-70">
        <div className="h-px w-[70px] bg-[linear-gradient(90deg,rgba(230,222,200,0)_0%,#D4C7B0_50%,rgba(230,222,200,0)_100%)]" />
        <Sparkle className="h-2.5 w-2.5 text-[#B86A54]" />
        <div className="h-px w-[70px] bg-[linear-gradient(90deg,rgba(230,222,200,0)_0%,#D4C7B0_50%,rgba(230,222,200,0)_100%)]" />
      </div>

      <p className="text-[14px] font-light leading-[1.6] text-[#8C8279]">
        Open {p.possessive} profile in Discover to decide
        <br />
        whether you&rsquo;d like to connect.
      </p>
    </div>
  );
}
