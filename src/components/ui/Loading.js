import { motion } from 'motion/react';
import { cn } from './cn';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const LoadingSkeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-neutral-800 rounded',
    text: 'bg-neutral-800 rounded h-4',
    circle: 'bg-neutral-800 rounded-full',
    card: 'bg-neutral-800 rounded-xl',
  };

  return (
    <motion.div
      className={cn(variants[variant], className)}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export function LoadingState({ message = 'Loading...', className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" className="text-primary-500 mb-4" />
      <p className="text-neutral-400 text-sm">{message}</p>
    </div>
  );
}

export { LoadingSpinner, LoadingSkeleton };
