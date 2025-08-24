
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";

interface ProgressStep {
  label: string;
  duration: number; // in seconds
}

const PROGRESS_STEPS: ProgressStep[] = [
  { label: "Fact Checking", duration: 17 },
  { label: "Headline Generation", duration: 17 },
  { label: "Best Headline Selection", duration: 17 },
  { label: "Caption Generation", duration: 17 },
  { label: "Image Keyword Generation", duration: 16 },
  { label: "Image Creation", duration: 16 },
  { label: "Final Output Delivered", duration: 20 }
];

interface ProgressTrackerProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const ProgressTracker = ({ isVisible, onComplete }: ProgressTrackerProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setStepProgress(0);
      return;
    }

    const totalDuration = 120; // Exactly 2 minutes (120 seconds)
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 1;
      
      // Calculate which step we're on based on elapsed time
      let cumulativeTime = 0;
      let stepIndex = 0;
      
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        if (elapsed <= cumulativeTime + PROGRESS_STEPS[i].duration) {
          stepIndex = i;
          const stepElapsed = elapsed - cumulativeTime;
          const progressPercentage = (stepElapsed / PROGRESS_STEPS[i].duration) * 100;
          setStepProgress(Math.min(progressPercentage, 100));
          break;
        }
        cumulativeTime += PROGRESS_STEPS[i].duration;
      }
      
      setCurrentStep(stepIndex);
      
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setCurrentStep(PROGRESS_STEPS.length - 1);
        setStepProgress(100);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <Card className="w-full mb-6 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Processing Content</CardTitle>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isMinimized ? "Show" : "Minimize"}
          </button>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="space-y-4">
          {PROGRESS_STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : index === currentStep ? (
                  <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {index === currentStep && (
                  <Progress value={stepProgress} className="mt-1 h-2" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};
