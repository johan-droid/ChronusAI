import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'cosmic'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden group font-["Orbitron"]'
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105',
      outline: 'border border-primary/30 hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105',
      cosmic: 'bg-gradient-to-r from-primary via-accent to-secondary text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] hover:scale-105'
    }
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 py-2 px-4',
      lg: 'h-12 px-8 text-lg'
    }

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
        </span>
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
