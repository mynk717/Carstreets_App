import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(  // FIXED: Correct ref type
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          className={cn(
            // Base styles with FIXED text contrast
            'w-full px-3 py-2.5 border border-gray-300 rounded-lg',
            'bg-white text-gray-900 font-medium', // FIXED: Dark text, medium weight
            'placeholder:text-gray-500 placeholder:font-normal', // FIXED: Visible placeholder
            
            // Focus states
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            
            // Disabled states  
            'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
            
            // Smooth transitions
            'transition-all duration-200',
            
            // Error state override
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            
            className
          )}
          ref={ref}  // FIXED: Now properly typed
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
