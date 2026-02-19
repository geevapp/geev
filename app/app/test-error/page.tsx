'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * A component designed to throw an error for testing the ErrorBoundary.
 */
function BuggyComponent() {
    throw new Error('Test error: BuggyComponent crashed!');
    return <div>This will never render</div>;
}

export default function TestErrorPage() {
    const [shouldCrash, setShouldCrash] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <h1 className="text-2xl font-bold mb-4">Error Boundary Test Page</h1>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
                Click the button below to trigger a JavaScript error in a child component.
                The Error Boundary should catch it and show a fallback UI.
            </p>

            {shouldCrash ? (
                <BuggyComponent />
            ) : (
                <div className="flex gap-4">
                    <Button
                        variant="destructive"
                        onClick={() => setShouldCrash(true)}
                    >
                        Trigger Crash
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            toast.error('Operation Failed', {
                                description: 'This is a test error toast notification.',
                                action: {
                                    label: 'Retry',
                                    onClick: () => console.log('Retry clicked'),
                                },
                            });
                        }}
                    >
                        Trigger Error Toast
                    </Button>
                </div>
            )}
        </div>
    );
}
