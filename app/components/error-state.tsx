import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * ErrorState component for displaying friendly error or empty states.
 * 
 * When to use:
 * - When a data fetch fails.
 * - When a list is empty.
 * - When a search returns no results.
 */
export function ErrorState({ title, message, action }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
                {message}
            </p>
            {action && (
                <Button onClick={action.onClick} className="transition-all hover:scale-105 active:scale-95">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
