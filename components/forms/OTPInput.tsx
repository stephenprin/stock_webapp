import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/utils";

interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onKeyDown' | 'onChange' | 'value'> {
  value: string;
  index: number;
  onValueChange: (index: number, value: string) => void;
  onKeyDown?: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const OTPInput = forwardRef<HTMLInputElement, OTPInputProps>(
  (
    {
      value,
      index,
      onValueChange,
      onKeyDown,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (inputValue.length <= 1 && /^\d*$/.test(inputValue)) {
            onValueChange(index, inputValue);
          }
        }}
        onKeyDown={(e) => onKeyDown?.(index, e)}
        disabled={disabled}
        className={cn(
          "w-12 h-14 text-center text-2xl font-semibold bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

OTPInput.displayName = "OTPInput";

export default OTPInput;

