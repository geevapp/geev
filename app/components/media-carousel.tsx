"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
    images: Array<{
        id: string;
        url: string;
        type?: 'image' | 'video';
        thumbnail?: string;
    }>;
    className?: string;
}

export function MediaCarousel({ images, className }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});
    const thumbsRef = useRef<HTMLDivElement | null>(null);
    const touchStartX = useRef<number | null>(null);
    const touchDeltaX = useRef(0);

    if (!images || images.length === 0) return null;

    const single = images.length === 1;

    const goToPrevious = () => setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1));
    const goToNext = () => setCurrentIndex((p) => (p === images.length - 1 ? 0 : p + 1));
    const goToIndex = (i: number) => setCurrentIndex(i);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [images.length]);

    useEffect(() => {
        const thumbs = thumbsRef.current;
        const active = thumbs?.querySelectorAll('button')[currentIndex] as
            | HTMLButtonElement
            | undefined;
        if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [currentIndex]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };

    const handleTouchEnd = () => {
        const threshold = 50;
        if (touchDeltaX.current > threshold) goToPrevious();
        else if (touchDeltaX.current < -threshold) goToNext();
        touchStartX.current = null;
        touchDeltaX.current = 0;
    };

    const onImageLoad = (i: number) => setLoaded((s) => ({ ...s, [i]: true }));

    return (
        <div className={cn('relative w-full', className)} aria-roledescription="carousel" aria-label="Post media carousel">
            {/* Single image: simple render */}
            {single ? (
                <div className="w-full aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: '#0f1724' }}>
                    <img src={images[0].url} alt="Post image" className="w-full h-full object-cover" onLoad={() => onImageLoad(0)} />
                </div>
            ) : (
                <>
                    <div
                        className="relative w-full aspect-square rounded-lg overflow-hidden"
                        style={{ backgroundColor: '#0f1724' }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="h-full flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                            {images.map((img, idx) => (
                                <div key={img.id} className="w-full flex-shrink-0 h-full relative">
                                    <img src={img.url} alt={`Image ${idx + 1} of ${images.length}`} className="w-full h-full object-cover" onLoad={() => onImageLoad(idx)} />
                                    {!loaded[idx] && <div className="absolute inset-0 animate-pulse" aria-hidden style={{ backgroundColor: '#0f1724' }} />}
                                </div>
                            ))}
                        </div>

                        {/* Arrows */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-white rounded-full h-10 w-10"
                            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            onClick={goToPrevious}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white rounded-full h-10 w-10"
                            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            onClick={goToNext}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>

                        {/* Counter */}
                        <div className="absolute bottom-4 right-4 text-white px-3 py-1 rounded-full text-sm font-medium" aria-hidden style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2" ref={thumbsRef}>
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                onClick={() => goToIndex(index)}
                                className={cn('relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all')}
                                aria-label={`Go to image ${index + 1}`}
                                aria-current={index === currentIndex}
                                style={
                                    index === currentIndex
                                        ? { borderColor: '#7C3AED', boxShadow: '0 0 0 6px rgba(124,58,237,0.12)' }
                                        : { borderColor: 'transparent' }
                                }
                            >
                                <img src={image.thumbnail ?? image.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                {index === currentIndex && <div className="absolute inset-0" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }} />}
                            </button>
                        ))}
                    </div>

                    {/* Dots for small screens */}
                    {images.length > 1 && images.length <= 5 && (
                        <div className="flex justify-center gap-2 mt-4 md:hidden">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToIndex(index)}
                                    aria-label={`Go to image ${index + 1}`}
                                    aria-current={index === currentIndex}
                                    style={
                                        index === currentIndex
                                            ? { width: 32, height: 8, borderRadius: 9999, background: '#7C3AED' }
                                            : { width: 8, height: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.12)' }
                                    }
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
