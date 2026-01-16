import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardFormProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function WizardForm({
  steps,
  onComplete,
  onCancel,
  submitLabel = "Simpan",
  isSubmitting = false,
  className,
}: WizardFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    const step = steps[currentStep];
    
    // Validate current step if validation function exists
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }

    // Mark step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (isLastStep) {
      await onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Only allow clicking on completed steps or the next step
    if (completedSteps.has(index) || index === currentStep || index === currentStep + 1) {
      // Validate current step before moving
      const step = steps[currentStep];
      if (index > currentStep && step.validate) {
        step.validate().then((isValid) => {
          if (isValid) {
            setCompletedSteps((prev) => new Set([...prev, currentStep]));
            setCurrentStep(index);
          }
        });
      } else {
        setCurrentStep(index);
      }
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isClickable = isCompleted || isCurrent || index === currentStep + 1;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all text-sm",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="font-medium">{index + 1}</span>
                    )}
                  </div>
                  {/* Step Title */}
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:inline",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-2 transition-colors",
                      completedSteps.has(index) ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {steps[currentStep].content}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Sebelumnya
          </Button>
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            {isLastStep ? (
              isSubmitting ? (
                "Menyimpan..."
              ) : (
                submitLabel
              )
            ) : (
              <>
                Selanjutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
