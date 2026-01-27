import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    className = '',
    id,
    ...props
}, ref) => {
    const autoId = useId();
    const inputId = id || `input-${autoId}`;

    const baseInputStyles = 'w-full bg-white text-gray-900 border rounded-lg placeholder:text-gray-400 transition-all duration-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

    const normalStyles = 'border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';
    const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

    const paddingStyles = icon
        ? (iconPosition === 'left' ? 'pl-11 pr-4 py-3' : 'pl-4 pr-11 py-3')
        : 'px-4 py-3';

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={`${baseInputStyles} ${error ? errorStyles : normalStyles} ${paddingStyles}`}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
