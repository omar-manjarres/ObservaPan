import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
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
Input.displayName = "Input";
