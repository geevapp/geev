import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home } from 'lucide-react';

/**
 * Custom 404 page for invalid post IDs
 * 
 * Displays a user-friendly error message when a post is not found
 * and provides navigation back to the feed.
 */
export default function PostNotFound() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-2xl">
            <Card className="border-destructive/50">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-destructive/10 p-4">
                            <AlertCircle className="h-16 w-16 text-destructive" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                        Post Not Found
                    </h1>

                    <p className="text-lg text-muted-foreground mb-6">
                        Sorry, we couldn't find the post you're looking for. It may have been deleted or the link might be incorrect.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/feed">
                            <Button size="lg" className="w-full sm:w-auto">
                                <Home className="h-5 w-5 mr-2" />
                                Back to Feed
                            </Button>
                        </Link>

                        <Link href="/">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Go to Home
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            If you believe this is an error, please contact support or try refreshing the page.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
