import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Label } from './Label';

const textareaVariants = cva(
  'flex w-full rounded-lg border bg-white text-gray-900 transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      textareaSize: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-3 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
      },
      state: {
        default: 'border-gray-300 hover:border-gray-400',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
    },
    defaultVariants: {
      textareaSize: 'md',
      state: 'default',
    },
  }
);

interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'size'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  autoResize?: boolean;
  maxCharacters?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      textareaSize,
      state,
      label,
      error,
      helperText,
      required,
      autoResize = false,
      maxCharacters,
      id,
      value,
      defaultValue,
      onChange,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const computedState = error ? 'error' : state;
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = useState(
      () => String(value ?? defaultValue ?? '').length
    );

    const handleResize = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);

    useEffect(() => {
      handleResize();
    }, [value, handleResize]);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <div className="space-y-1.5">
        {label && (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          rows={rows}
          className={cn(
            textareaVariants({ textareaSize, state: computedState }),
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          value={value}
          defaultValue={defaultValue}
          maxLength={maxCharacters}
          onChange={(e) => {
            setCharCount(e.target.value.length);
            handleResize();
            onChange?.(e);
          }}
          {...props}
        />
        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {helperText && !error && (
              <p id={`${textareaId}-helper`} className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>
          {maxCharacters !== undefined && (
            <p
              className={cn(
                'text-xs',
                charCount >= maxCharacters ? 'text-red-600' : 'text-gray-400'
              )}
            >
              {charCount}/{maxCharacters}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
