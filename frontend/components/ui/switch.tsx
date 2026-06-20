'use client';
import { cn } from '../../lib/cn';

export interface SwitchProps {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    className?: string;
    'aria-label'?: string;
}

export function Switch({ checked, onCheckedChange, className, ...rest }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={rest['aria-label']}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex h-4 w-7 items-center transition-colors',
                checked ? 'bg-[var(--color-fg)]' : 'bg-[var(--color-line-strong)]',
                className
            )}
        >
            <span
                className={cn(
                    'inline-block h-3 w-3 transform bg-[var(--color-bg)] transition-transform',
                    checked ? 'translate-x-[14px]' : 'translate-x-[2px]'
                )}
            />
        </button>
    );
}
