"use client";

export default function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "ghost"
  loading = false,
  loadingText,
  disabled = false,
  size = "md", // "sm" (32px) | "md" (44px) | "lg" (48px)
  className = "",
  type = "button",
  onClick,
  id,
  icon,
  ...props
}) {
  const isDisabled = disabled || loading;

  const sizeClasses = {
    sm: "h-8 px-3 text-xs sm:text-sm rounded-[10px]",
    md: "h-11 px-5 text-sm sm:text-base rounded-[10px]",
    lg: "h-12 px-6 text-base rounded-[10px]",
  }[size] || "h-11 px-5 text-base rounded-[10px]";

  const variantClasses = {
    primary: isDisabled
      ? "bg-status-neutral text-muted border border-line cursor-not-allowed"
      : "bg-primary text-on-primary hover:brightness-105 active:scale-[0.99] shadow-xs cursor-pointer",
    secondary: isDisabled
      ? "bg-surface text-muted/60 border border-line cursor-not-allowed"
      : "bg-surface text-primary border border-primary hover:bg-status-info-bg active:scale-[0.99] shadow-xs cursor-pointer",
    outline: isDisabled
      ? "bg-transparent text-muted/50 border border-line cursor-not-allowed"
      : "bg-transparent text-ink border border-line-strong hover:bg-surface active:scale-[0.99] cursor-pointer",
    ghost: isDisabled
      ? "text-muted/40 cursor-not-allowed"
      : "text-muted hover:text-ink hover:bg-surface cursor-pointer",
  }[variant] || "bg-primary text-on-primary";

  return (
    <button
      id={id}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`font-bold font-atkinson inline-flex items-center justify-center gap-2 transition-all select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="size-4 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText || "Memproses..."}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
