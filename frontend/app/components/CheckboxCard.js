"use client";

export default function CheckboxCard({
  id,
  checked = false,
  onChange,
  label,
  description,
  className = "",
  disabled = false,
}) {
  return (
    <label
      htmlFor={id}
      className={`group relative flex items-center gap-3 ${
        description ? "p-3.5 sm:p-4 rounded-xl items-start" : "h-12 px-3.5 rounded-[10px]"
      } border transition-all cursor-pointer select-none ${
        checked
          ? "bg-status-info-bg border-primary shadow-xs"
          : "bg-surface border-line hover:border-line-strong hover:bg-bg"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />

      {/* Custom styled checkbox indicator */}
      <div
        className={`size-5 rounded-md border shrink-0 flex items-center justify-center transition-all mt-0.5 ${
          checked
            ? "bg-primary border-primary text-on-primary"
            : "bg-surface border-line-strong group-hover:border-primary"
        }`}
      >
        {checked && (
          <svg
            className="size-3.5 stroke-[3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="block text-base font-atkinson leading-snug transition-colors select-none text-ink font-normal">
          {label}
        </span>
        {description && (
          <span className="block text-xs sm:text-sm text-muted font-normal font-atkinson leading-normal mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
