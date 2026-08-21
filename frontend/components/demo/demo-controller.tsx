'use client';

import React from 'react';
import { DemoStepDetail } from '@/lib/types';
import { Play, ArrowLeft, ArrowRight, RotateCcw, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface DemoControllerProps {
  isOpen: boolean;
  currentStep: number;
  stepDetail: DemoStepDetail | null;
  onNextStep: () => void;
  onPrevStep: () => void;
  onResetDemo: () => void;
  onCloseDemo: () => void;
  loading: boolean;
}

export function DemoController({
  isOpen,
  currentStep,
  stepDetail,
  onNextStep,
  onPrevStep,
  onResetDemo,
  onCloseDemo,
  loading,
}: DemoControllerProps) {
  if (!isOpen) return null;

  const totalSteps = 10;
  const progressPct = ((currentStep) / totalSteps) * 100;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 border-2 border-sky-500/60 rounded-xl shadow-2xl backdrop-blur-md p-4 text-slate-100 space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase">
                SIH 2026 OFFICIAL DEMONSTRATION CONTROLLER
              </span>
              <h4 className="text-xs font-bold text-white">
                STEP {currentStep} OF {totalSteps}: {stepDetail?.title || 'Loading Scenario...'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDemo}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors border border-slate-700"
              title="Reset Demo to Baseline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={onCloseDemo}
              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Exit Demo Controller"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-sky-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-sans">
          {stepDetail?.description || 'Evaluating corridor state...'}
        </p>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400 font-mono">
            Target: <span className="text-sky-300 font-bold">{stepDetail?.target_segment_id || 'YE_MAIN_SB_050'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrevStep}
              disabled={currentStep <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={onNextStep}
              disabled={currentStep >= totalSteps || loading}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shadow-lg shadow-sky-900/40 disabled:opacity-40 transition-all"
            >
              <span>{currentStep === totalSteps ? 'Finish Demo' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
