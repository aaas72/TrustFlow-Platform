import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      rightElement,
      labelClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full h-[40px] rounded border border-blue-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? "border-red-500" : ""
            } ${rightElement ? "pr-16" : ""} ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
