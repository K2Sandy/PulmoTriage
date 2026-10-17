"use client";

export default function TriageRibbon({
  id,
  category = "HIJAU",
  title = "",
  action = "",
  className = "",
  isAtypical = false,
}) {
  const normCat = (category || "").toUpperCase();

  const isMerah = normCat.includes("MERAH");
  const isKuning = (normCat.includes("KUNING") || isAtypical) && !isMerah;
  const isHijau = !isMerah && !isKuning;

  let bgClass = "bg-triage-hijau text-on-triage-hijau";
  let label = "HIJAU";
  let icon = (
    <svg className="size-6 sm:size-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );

  if (isMerah) {
    bgClass = "bg-triage-merah text-on-triage-merah";
    label = "MERAH";
    icon = (
      <svg className="size-6 sm:size-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  } else if (isKuning) {
    bgClass = "bg-triage-kuning text-on-triage-kuning";
    label = isAtypical ? "Citra Janggal" : "KUNING";
    icon = isAtypical ? (
      <svg className="size-6 sm:size-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
        <path d="m16 16-1.5-1.5" />
      </svg>
    ) : (
      <svg className="size-6 sm:size-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className={`w-full rounded-[10px] p-3.5 sm:p-4 flex items-start gap-3.5 transition-all shadow-xs ${bgClass} ${className}`}
    >
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-atkinson text-xl sm:text-[22px] font-extrabold tracking-[0.02em] uppercase leading-tight">
            {label}
          </span>
          {title && (
            <span className="font-atkinson text-base sm:text-lg font-bold leading-tight opacity-95">
              — {title}
            </span>
          )}
        </div>
        {action && (
          <p className="mt-1 font-atkinson text-sm sm:text-base font-normal leading-snug opacity-90">
            {action}
          </p>
        )}
      </div>
    </div>
  );
}
