"use client";

export default function CategoryBadge({
  category = "HIJAU",
  className = "",
  size = "md", // "sm" | "md" | "lg"
  variant = "solid", // "solid" | "subtle"
  label,
  showIcon = true,
}) {
  const normCat = (category || "").toUpperCase();

  const isMerah = normCat.includes("MERAH");
  const isKuning = normCat.includes("KUNING") && !normCat.includes("JANGGAL");
  const isJanggal = normCat.includes("JANGGAL") || normCat.includes("ATYPICAL");
  const isHijau = !isMerah && !isKuning && !isJanggal;

  const sizeClasses = {
    sm: "h-6 px-2 text-xs gap-1 rounded-md",
    md: "h-7 px-2.5 text-xs font-extrabold tracking-wide gap-1.5 rounded-md",
    lg: "h-9 px-3.5 text-sm font-extrabold tracking-wide gap-2 rounded-[10px]",
  }[size] || "h-7 px-2.5 text-xs font-extrabold tracking-wide gap-1.5 rounded-md";

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  }[size] || "size-3.5";

  let colorClasses = "";
  let displayLabel = label || "HIJAU";
  let icon = null;

  if (isMerah) {
    displayLabel = label || "MERAH";
    colorClasses =
      variant === "solid"
        ? "bg-triage-merah text-on-triage-merah"
        : "bg-status-error-bg text-text-merah border border-triage-merah/30";
    icon = (
      <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  } else if (isKuning) {
    displayLabel = label || "KUNING";
    colorClasses =
      variant === "solid"
        ? "bg-triage-kuning text-on-triage-kuning"
        : "bg-status-neutral text-text-kuning border border-triage-kuning/40";
    icon = (
      <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  } else if (isJanggal) {
    displayLabel = label || "Citra Janggal";
    colorClasses =
      variant === "solid"
        ? "bg-triage-kuning text-on-triage-kuning"
        : "bg-status-neutral text-text-kuning border border-triage-kuning/40";
    icon = (
      <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
        <path d="m16 16-1.5-1.5" />
      </svg>
    );
  } else {
    displayLabel = label || "HIJAU";
    colorClasses =
      variant === "solid"
        ? "bg-triage-hijau text-on-triage-hijau"
        : "bg-status-info-bg text-text-hijau border border-triage-hijau/30";
    icon = (
      <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold font-atkinson leading-none shrink-0 ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && icon}
      <span>{displayLabel}</span>
    </span>
  );
}
