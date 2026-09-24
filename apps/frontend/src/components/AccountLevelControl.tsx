import Link from "next/link";

const DISPLAY_LEVEL_CAP = 5;

/**
 * FIN-1F-2 "Display Level" control — SAP B1's own Chart of Accounts window has a "Level" field
 * that limits how deep the tree renders. A display/filter concern only: selecting Level N shows
 * the hierarchy through that level (deeper descendants hidden, ancestors kept for context) — it
 * never modifies accounting data, per the owner brief's §21.
 */
export function AccountLevelControl({
  maxLevel,
  activeLevel,
  buildHref,
}: {
  maxLevel: number;
  activeLevel: number | null;
  buildHref: (level: number | null) => string;
}) {
  const shown = Math.min(maxLevel, DISPLAY_LEVEL_CAP);

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-graphite-500">Display level</span>
      <LevelPill label="All" href={buildHref(null)} active={activeLevel === null} />
      {Array.from({ length: shown }, (_, i) => i + 1).map((level) => (
        <LevelPill key={level} label={String(level)} href={buildHref(level)} active={activeLevel === level} />
      ))}
      {maxLevel > DISPLAY_LEVEL_CAP && (
        <LevelPill label={`${DISPLAY_LEVEL_CAP}+`} href={buildHref(DISPLAY_LEVEL_CAP)} active={activeLevel !== null && activeLevel >= DISPLAY_LEVEL_CAP} />
      )}
    </div>
  );
}

function LevelPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active ? "bg-signal text-white" : "border border-border bg-surface text-graphite-500 hover:bg-canvas/60"
      }`}
    >
      {label}
    </Link>
  );
}
