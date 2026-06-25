import type { Question, ResponseValue } from "@/types";
import {
  FREQUENCY_OPTIONS,
  LIKERT_OPTIONS,
  YES_NO_OPTIONS,
} from "@/constants/variables";
import { Input, Select, Textarea } from "@/components/ui";

interface Props {
  question: Question;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  error?: string;
}

export function QuestionField({ question, value, onChange, error }: Props) {
  const choiceOptions = (opts: readonly string[]) =>
    opts.map((o) => ({ value: o, label: o }));

  const label = (
    <span>
      {question.text}
      {question.required && <span className="text-critical"> *</span>}
    </span>
  );

  const wrapper = (input: React.ReactNode) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {question.helpText && <p className="text-xs text-gray-400">{question.helpText}</p>}
      {input}
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );

  switch (question.type) {
    case "short_text":
      return wrapper(
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />,
      );
    case "long_text":
      return wrapper(
        <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />,
      );
    case "number":
      return wrapper(
        <Input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />,
      );
    case "date":
      return wrapper(
        <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />,
      );
    case "frequency_scale":
      return wrapper(
        <Select
          placeholder="Selecciona una opción"
          options={choiceOptions(FREQUENCY_OPTIONS)}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "likert":
      return wrapper(
        <Select
          placeholder="Selecciona una opción"
          options={choiceOptions(LIKERT_OPTIONS)}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "yes_no":
      return wrapper(
        <Select
          placeholder="Selecciona"
          options={choiceOptions(YES_NO_OPTIONS)}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "single_choice":
      return wrapper(
        <Select
          placeholder="Selecciona una opción"
          options={choiceOptions(question.options ?? [])}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "multiple_choice":
      return wrapper(
        <div className="space-y-1">
          {(question.options ?? []).map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(o);
            return (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onChange(
                      e.target.checked ? [...arr, o] : arr.filter((x) => x !== o),
                    )
                  }
                />
                {o}
              </label>
            );
          })}
        </div>,
      );
    default:
      return null;
  }
}
