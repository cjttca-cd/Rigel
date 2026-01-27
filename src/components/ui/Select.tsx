import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label,
    error,
    options,
    placeholder,
    className = '',
    id,
    ...props
}, ref) => {
    const autoId = useId();
    const selectId = id || `select-${autoId}`;

    const baseStyles = 'w-full bg-white text-gray-900 border rounded-lg transition-all duration-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer';

    const normalStyles = 'border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';
    const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    className={`${baseStyles} ${error ? errorStyles : normalStyles} pl-4 pr-10 py-3`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';
