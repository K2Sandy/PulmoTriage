"use client";

export default function Card({
  children,
  className = "",
  title,
  subtitle,
  headerAction,
  footer,
  id,
  as: Component = "section",
  ...props
}) {
  return (
    <Component
      id={id}
      className={`bg-surface text-ink rounded-2xl border border-line p-5 sm:p-6 shadow-xs transition-all ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-line">
          <div>
            {title && (
              <h2 className="text-ink text-lg sm:text-xl font-bold font-atkinson leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted text-xs sm:text-sm font-normal font-atkinson mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {children}

      {footer && (
        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </Component>
  );
}
