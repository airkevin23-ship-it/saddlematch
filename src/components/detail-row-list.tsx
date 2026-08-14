import { DETAIL_ICONS } from "@/components/detail-icons";

interface DetailRow {
  key: string;
  label: string;
  value: string;
}

// The "About me" detail list on the profile view: a small icon next to a
// bold word, grouped under a serif heading — the same pattern reference
// apps like Krush use for their attribute rows. Pulled out as its own
// component (rather than inlined) so the same treatment can be reused
// elsewhere later without copy-pasting the icon map and markup again.
export default function DetailRowList({
  rows,
  heading = "About me",
}: {
  rows: DetailRow[];
  heading?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-5">
      <h3 className="font-serif-heading text-xl font-bold text-ink">{heading}</h3>
      <div className="mt-3 space-y-0.5">
        {rows.map((row) => {
          const Icon = DETAIL_ICONS[row.key as keyof typeof DETAIL_ICONS];
          return (
            <div key={row.key} className="flex items-center gap-3 py-2">
              {Icon ? (
                <Icon className="h-5 w-5 shrink-0 text-ink-soft" />
              ) : (
                <span className="h-5 w-5 shrink-0" />
              )}
              <span className="font-rounded text-[15px] font-bold text-ink">{row.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
