import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon: Icon,
      className = '',
      type = 'button',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

    const variants = {
      primary: 'bg-night text-white hover:bg-night-soft',
      secondary: 'bg-gold text-night hover:bg-gold-dark hover:text-white',
      outline: 'border border-night/30 bg-transparent text-night hover:border-gold hover:text-gold-dark',
      royal: 'bg-royal text-white hover:bg-royal-dark',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    const isDisabled = disabled || isLoading;
    const finalDisabledClasses = isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '';

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    const combinedClassName = [baseClasses, variantClass, sizeClass, finalDisabledClasses, className]
      .filter(Boolean)
      .join(' ');

    if (props.href) {
      return (
        <a
          ref={ref}
          className={combinedClassName}
          aria-busy={isLoading}
          {...props}
        >
          {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {!isLoading && Icon && <Icon size={16} aria-hidden="true" />}
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {!isLoading && Icon && <Icon size={16} aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
