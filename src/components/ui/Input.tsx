import React, { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a random ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    // Base input classes
    const baseInputClasses = 'block bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
    
    // Error state classes
    const errorStateClasses = error
      ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
      : 'border-gray-300 dark:border-gray-600';
    
    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';
    
    // Disabled classes
    const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : '';
    
    // Icon padding
    const iconPaddingLeft = leftIcon ? 'pl-10' : 'pl-3';
    const iconPaddingRight = rightIcon ? 'pr-10' : 'pr-3';
    
    return (
      <div className={`${widthClasses} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseInputClasses}
              ${errorStateClasses}
              ${disabledClasses}
              ${iconPaddingLeft}
              ${iconPaddingRight}
              py-2
              border
            `}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;