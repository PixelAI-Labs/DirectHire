import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#8b92b4] mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-lg border bg-[#0c1324] px-4 py-2.5 text-[#dce1fb] transition-colors focus:border-[#adc6ff] focus:outline-none focus:ring-1 focus:ring-[#adc6ff] ${
            error ? 'border-[#f87171]' : 'border-[#2a3150]'
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-[#f87171]">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
