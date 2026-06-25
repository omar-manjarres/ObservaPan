import type { FullForm, ResponseValue, Variable } from "@/types";
import { VARIABLE_LABELS } from "@/constants/variables";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { QuestionField } from "./QuestionField";

interface Props {
  form: FullForm;
  answers: Record<string, ResponseValue>;
  errors: Record<string, string>;
  onChange: (questionId: string, value: ResponseValue) => void;
  disabled?: boolean;
}

export function DynamicFormRenderer({ form, answers, errors, onChange }: Props) {
  const sections = [...form.sections].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const questions = form.questions
          .filter((q) => q.sectionId === section.id && q.status === "active")
          .sort((a, b) => a.order - b.order);
        return (
          <Card key={section.id}>
            <CardHeader
              title={section.title}
              subtitle={`Variable ${VARIABLE_LABELS[section.variable as Variable]}`}
            />
            <CardBody className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} id={`q-${q.id}`} className="scroll-mt-24">
                  <QuestionField
                    question={q}
                    value={answers[q.id]}
                    error={errors[q.id]}
                    onChange={(v) => onChange(q.id, v)}
                  />
                </div>
              ))}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
