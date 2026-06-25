import { forwardRef, type SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className = "", id, ...rest }, ref) => {
    const sid = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={sid} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          id={sid}
          ref={ref}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
            error ? "border-critical" : "border-gray-300"
          } ${className}`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
