import { forwardRef, useId } from 'react';

const Input = forwardRef(
  ({ label, error, id: propId, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;

    const baseInputClasses = 'w-full bg-transparent border border-gray-200 rounded-md px-4 py-3 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors';
    
    const stateClasses = error
      ? 'border-red-500 focus:border-red-500'
      : 'focus:border-gold';

    const inputClassName = [baseInputClasses, stateClasses].filter(Boolean).join(' ');
    const wrapperClassName = className ? className : '';

    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={id} className="block mb-2 text-xs uppercase tracking-widest text-ink-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
