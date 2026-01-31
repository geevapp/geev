import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

/**
 * Custom 404 Not Found page for Next.js App Router.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="flex flex-col items-center max-w-md text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <FileQuestion className="h-24 w-24 text-primary relative z-10" />
        </div>
        <h1 className="text-7xl font-extrabold mb-2 tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Link href="/feed">Return to Feed</Link>
        </Button>
      </div>
    </div>
  );
}
