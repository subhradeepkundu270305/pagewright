import React from 'react';
import { ConversionStep } from '../../utils/types';

interface Props {
  status: ConversionStep;
  message?: string;
  onRetry: () => void;
}

export const StatusMessage: React.FC<Props> = ({ status, message, onRetry }) => {
  if (status !== 'error') return null;

  return (
    <div className="mt-3 rounded-2xl p-4 text-sm animate-slide-up glass bg-red-50/80 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30">
      <div className="flex items-start gap-2.5">
        <span className="text-lg mt-0.5">❌</span>
        <div className="flex-1">
          <p className="font-medium text-[13px] leading-relaxed text-red-700 dark:text-red-300">
            {message}
          </p>
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors press-effect shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
