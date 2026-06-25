import { forwardRef, type TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const tid = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={tid} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          id={tid}
          ref={ref}
          rows={3}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
            error ? "border-critical" : "border-gray-300"
          } ${className}`}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
