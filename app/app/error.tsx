'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * Custom 500/Global Error page for Next.js App Router.
 * 
 * Next.js automatically passes the `error` and `reset` props.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled app error:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="flex flex-col items-center max-w-md text-center animate-in fade-in zoom-in duration-500">
                <div className="p-4 bg-destructive/10 rounded-full mb-6">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-3xl font-bold mb-4 tracking-tight">Something went wrong!</h1>
                <p className="text-muted-foreground mb-8">
                    An unexpected error occurred. We've been notified and are looking into it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={() => reset()}
                        size="lg"
                        className="rounded-full px-8 flex items-center gap-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-8"
                        onClick={() => window.location.href = '/feed'}
                    >
                        Go to Feed
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-12 text-left w-full">
                        <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-widest">Error Details</p>
                        <pre className="p-4 bg-muted/50 rounded-lg text-xs overflow-auto max-h-48 border border-border">
                            {error.message || 'No message available'}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
