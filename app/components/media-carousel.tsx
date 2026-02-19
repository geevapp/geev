'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * MediaCarousel Component
 * 
 * Displays a carousel of images with navigation controls and thumbnail indicators.
 * Supports keyboard navigation and responsive design.
 * 
 * @example
 * ```tsx
 * <MediaCarousel images={[
 *   { id: '1', url: '/image1.jpg', type: 'image' },
 *   { id: '2', url: '/image2.jpg', type: 'image' }
 * ]} />
 * ```
 */

interface MediaCarouselProps {
    images: Array<{
        id: string;
        url: string;
        type: 'image' | 'video';
        thumbnail?: string;
    }>;
    className?: string;
}

export function MediaCarousel({ images, className }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const goToIndex = (index: number) => {
        setCurrentIndex(index);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            goToPrevious();
        } else if (e.key === 'ArrowRight') {
            goToNext();
        }
    };

    const currentImage = images[currentIndex];

    return (
        <div
            className={cn("relative w-full", className)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Main image display */}
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                    src={currentImage.url}
                    alt={`Image ${currentIndex + 1} of ${images.length}`}
                    className="w-full h-full object-cover"
                />

                {/* Navigation buttons - only show if more than 1 image */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                            onClick={goToPrevious}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                            onClick={goToNext}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>

                        {/* Image counter */}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnail indicators - only show if more than 1 image */}
            {images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => goToIndex(index)}
                            className={cn(
                                "relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                                index === currentIndex
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-primary/50"
                            )}
                            aria-label={`Go to image ${index + 1}`}
                        >
                            <img
                                src={image.url}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {index === currentIndex && (
                                <div className="absolute inset-0 bg-primary/10" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Dot indicators for mobile (alternative to thumbnails) */}
            {images.length > 1 && images.length <= 5 && (
                <div className="flex justify-center gap-2 mt-4 md:hidden">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToIndex(index)}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                index === currentIndex
                                    ? "w-8 bg-primary"
                                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
