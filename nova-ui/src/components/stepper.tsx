import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepConfig {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
}

export type StepState = "completed" | "current" | "upcoming" | "error";

export interface StepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStepState(index: number, currentStep: number): StepState {
  if (index < currentStep) return "completed";
  if (index === currentStep) return "current";
  return "upcoming";
}

interface StepIndicatorProps {
  state: StepState;
  number: number;
  icon?: ReactNode;
}

function StepIndicator({ state, number, icon }: StepIndicatorProps) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
        state === "completed" && "bg-success text-white",
        state === "current" && "bg-accent text-accent-foreground shadow-nova",
        state === "upcoming" && "border-2 border-border bg-surface text-muted",
        state === "error" && "bg-danger text-danger-foreground",
      )}
    >
      {state === "completed" ? (
        <Check className="size-4" aria-hidden="true" />
      ) : icon ? (
        icon
      ) : (
        number + 1
      )}
    </div>
  );
}

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  orientation = "horizontal",
  className,
}: StepperProps) {
  if (orientation === "vertical") {
    return (
      <nav aria-label="Progress" className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const state = getStepState(index, currentStep);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Left column: indicator + connector */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepChange?.(index)}
                  disabled={!onStepChange}
                  aria-current={state === "current" ? "step" : undefined}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full disabled:cursor-default"
                >
                  <StepIndicator state={state} number={index} icon={step.icon} />
                </button>
                {!isLast && (
                  <div className="my-1 w-0.5 flex-1 bg-border">
                    <div
                      className="w-full bg-accent transition-all duration-500"
                      style={{ height: index < currentStep ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>

              {/* Right column: label + description */}
              <div className={cn("pb-6 pt-1", isLast && "pb-0")}>
                <div
                  className={cn(
                    "text-sm font-medium transition-colors",
                    state === "current" && "text-foreground",
                    state === "completed" && "text-foreground",
                    state === "upcoming" && "text-muted",
                  )}
                >
                  {step.label}
                  {step.optional && (
                    <span className="ml-1 text-xs font-normal text-subtle">(optional)</span>
                  )}
                </div>
                {step.description && (
                  <div className="mt-0.5 text-xs text-subtle">{step.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  // Horizontal orientation
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const state = getStepState(index, currentStep);
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className={cn("flex flex-col items-center", !isLast && "flex-1")}>
              <div className="flex w-full items-center">
                <button
                  type="button"
                  onClick={() => onStepChange?.(index)}
                  disabled={!onStepChange}
                  aria-current={state === "current" ? "step" : undefined}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full disabled:cursor-default shrink-0"
                >
                  <StepIndicator state={state} number={index} icon={step.icon} />
                </button>

                {!isLast && (
                  <div className="flex-1 h-0.5 bg-border mt-0 mx-2">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: index < currentStep ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>

              {/* Label below */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-xs font-medium transition-colors",
                    state === "current" && "text-foreground",
                    state === "completed" && "text-foreground",
                    state === "upcoming" && "text-muted",
                  )}
                >
                  {step.label}
                  {step.optional && (
                    <span className="block text-[10px] font-normal text-subtle">optional</span>
                  )}
                </div>
                {step.description && (
                  <div className="mt-0.5 text-[10px] text-subtle max-w-[6rem]">
                    {step.description}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface UseStepperReturn {
  currentStep: number;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function useStepper(
  steps: StepConfig[],
  options?: { initialStep?: number },
): UseStepperReturn {
  const [currentStep, setCurrentStep] = useState(options?.initialStep ?? 0);

  return {
    currentStep,
    goTo: (i: number) => setCurrentStep(clamp(i, 0, steps.length - 1)),
    next: () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1)),
    prev: () => setCurrentStep((s) => Math.max(s - 1, 0)),
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
    canGoNext: currentStep < steps.length - 1,
    canGoPrev: currentStep > 0,
  };
}
