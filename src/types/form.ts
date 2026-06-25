import type { Timestamp } from "firebase/firestore";
import type { Variable } from "./common";

export type FormStatus = "active" | "inactive" | "draft";
export type QuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "single_choice"
  | "multiple_choice"
  | "frequency_scale"
  | "likert"
  | "yes_no";
export type Direction = "positive" | "negative" | "neutral";

export interface DiagnosticForm {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: FormStatus;
  variables: Variable[];
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface FormSection {
  id: string;
  title: string;
  variable: Variable;
  description?: string;
  order: number;
}

export interface Question {
  id: string;
  sectionId: string;
  text: string;
  helpText?: string;
  variable: Variable;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  affectsScore: boolean;
  direction: Direction;
  weight: number;
  status: "active" | "inactive";
}

export interface FullForm {
  form: DiagnosticForm;
  sections: FormSection[];
  questions: Question[];
}
