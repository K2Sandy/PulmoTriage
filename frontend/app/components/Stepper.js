"use client";

export default function Stepper({ currentStep, onStepClick, onReset }) {
  const steps = [
    { num: 1, label: "Data Pasien" },
    { num: 2, label: "Unggah Citra" },
    { num: 3, label: "Hasil" },
  ];

  return (
    <div className="w-full h-16 relative border-b border-zinc-200 flex justify-center items-center gap-3.5 bg-white/50 backdrop-blur-xs px-4">
      {/* Left Stepper Label */}
      <div className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 flex-col justify-start items-start">
        <span className="text-gray-500 text-xs font-bold font-atkinson uppercase tracking-wide">
          Langkah {currentStep} dari 3
        </span>
      </div>

      {/* Right Action: Pemeriksaan Baru (on step 3) */}
      {currentStep === 3 && onReset && (
        <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 flex items-center">
          <button
            type="button"
            id="btn-pemeriksaan-baru"
            onClick={onReset}
            className="h-8 px-3.5 bg-white rounded-[10px] border border-cyan-700 text-cyan-700 hover:bg-cyan-50 flex items-center gap-2 text-sm font-bold font-atkinson transition-colors cursor-pointer shadow-xs"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Pemeriksaan baru</span>
          </button>
        </div>
      )}

      {/* Stepper items */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {steps.map((s, idx) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          const isClickable = s.num < currentStep && onStepClick;

          return (
            <div key={s.num} className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(s.num)}
                disabled={!isClickable}
                className={`flex items-center gap-2 transition-all text-left ${
                  isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
              >
                {/* Number Circle */}
                <div
                  className={`size-7 rounded-full flex justify-center items-center shrink-0 transition-colors ${
                    isDone || isCurrent
                      ? "bg-cyan-700 text-white"
                      : "border border-slate-400 bg-white text-gray-500"
                  }`}
                >
                  {isDone ? (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold font-mono leading-none">
                      {s.num}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-sm sm:text-base font-atkinson ${
                    isCurrent
                      ? "text-teal-950 font-bold"
                      : isDone
                      ? "text-teal-950 font-normal"
                      : "text-gray-500 font-normal"
                  }`}
                >
                  {s.label}
                </span>
              </button>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-14 h-px transition-colors ${
                    s.num < currentStep ? "bg-cyan-700" : "bg-slate-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
