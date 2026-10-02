import React from 'react';
import { ConversionStep, STEP_LABELS } from '../../utils/types';

interface Props {
  status: ConversionStep;
}

const PROGRESS_STEPS: ConversionStep[] = ['extracting', 'cleaning', 'analyzing', 'rendering', 'generating', 'saving'];

export const ProgressBar: React.FC<Props> = ({ status }) => {
  if (status === 'idle') return null;

  const isError = status === 'error';
  const isDone = status === 'done';
  const isWorking = !isError && !isDone;
  const currentStepIndex = PROGRESS_STEPS.indexOf(status);
  const progress = isDone ? 100 : isError ? 0 : Math.max(0, ((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100);

  return (
    <div className="mt-2 midnight-card rounded-xl p-2.5 animate-slide-up">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
            isError ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'progress-gradient'
          }`}
          style={{ width: `${progress}%` }}
        />
        {isWorking && (
          <div className="absolute inset-0 shimmer rounded-full" />
        )}
      </div>

      {/* Step indicator dots */}
      <div className="flex items-center justify-between mb-2">
        {PROGRESS_STEPS.map((step, i) => {
          const isActive = i === currentStepIndex;
          const isComplete = i < currentStepIndex || isDone;
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-400 scale-100 shadow-sm shadow-emerald-500/50'
                    : isActive
                    ? 'bg-cyan-400 scale-125 shadow-md shadow-cyan-500/50'
                    : 'bg-white/20 scale-75'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2">
        {isWorking && (
          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
        {isDone && (
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {isError && (
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className={`text-[11px] font-semibold ${
          isError ? 'text-red-400' : isDone ? 'text-emerald-300 font-bold' : 'text-slate-300'
        }`}>
          {STEP_LABELS[status] || status}
        </span>
      </div>
    </div>
  );
};
