"use client";

export default function Input({
  id,
  label,
  value,
  onChange,
  error,
  suffix,
  prefix,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-ink text-xs sm:text-sm font-bold font-atkinson mb-1.5 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-text-merah">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted text-sm pointer-events-none font-atkinson">
            {prefix}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full h-11 px-3.5 ${prefix ? "pl-9" : ""} ${
            suffix ? "pr-14" : ""
          } bg-surface text-ink rounded-md border text-base font-atkinson transition-all placeholder:text-muted/60 focus:outline-none ${
            error
              ? "border-status-error focus:ring-2 focus:ring-status-error"
              : "border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
          } ${disabled ? "bg-bg cursor-not-allowed opacity-60" : ""} ${className}`}
          {...props}
        />

        {suffix && (
          <span className="absolute right-3.5 text-muted text-sm font-medium font-atkinson pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-status-error text-xs font-medium font-atkinson mt-1.5 flex items-center gap-1"
        >
          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
