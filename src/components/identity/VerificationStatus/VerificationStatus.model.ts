export type VerificationStepStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "error";

export interface VerificationStep {
  id: string;
  label: string;
  status: VerificationStepStatus;
}

export interface Claim {
  key: string;
  value: string | boolean;
}

export interface VerificationStatusProps {
  steps: VerificationStep[];
  claims?: Claim[];
}
