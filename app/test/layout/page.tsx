'use client';

import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

export default function LayoutTestPage() {
  // RESPONSIVE BREAKPOINT INDICATOR - Shows current active breakpoint
  const [activeBreakpoint, setActiveBreakpoint] = useState<string>('mobile');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setActiveBreakpoint('mobile (<640px)');
      else if (width < 768) setActiveBreakpoint('sm (640px - 767px)');
      else if (width < 1024) setActiveBreakpoint('md (768px - 1023px)');
      else if (width < 1280) setActiveBreakpoint('lg (1024px - 1279px)');
      else if (width < 1536) setActiveBreakpoint('xl (1280px - 1535px)');
      else setActiveBreakpoint('2xl (1536px+)');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return (
    <Container className="py-10">
      <div className="space-y-12">
        {/* HEADER */}
        <div>
          <h1 className="h1-responsive mb-2">Responsive Layout Testing</h1>
          <p className="body-responsive text-muted-foreground">
            Resize your browser to test responsive behavior across breakpoints
          </p>
        </div>

        {/* ACTIVE BREAKPOINT INDICATOR */}
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle>Current Breakpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeBreakpoint}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Viewport Width: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
            </p>
          </CardContent>
        </Card>

        {/* CONTAINER MAX-WIDTH VISUALIZATION */}
        <Card>
          <CardHeader>
            <CardTitle>Container Max-Width Visualization</CardTitle>
            <CardDescription>Shows how container constrains width at each breakpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/50">
              <div className="bg-primary text-primary-foreground p-4 rounded text-center text-sm font-medium">
                Content Area (Container applied)
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>Mobile: 100% width with 16px padding</p>
              <p>Tablet (md): 100% width with 32px padding</p>
              <p>Desktop (lg): max-width 1024px</p>
              <p>Large Desktop (xl): max-width 1280px</p>
            </div>
          </CardContent>
        </Card>

        {/* RESPONSIVE GRID SYSTEM */}
        <Card>
          <CardHeader>
            <CardTitle>Grid System Testing</CardTitle>
            <CardDescription>
              Mobile: 1 column | Tablet (md): 2 columns | Desktop (xl): 3 columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-responsive-1 gap-responsive">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-accent/10 border border-accent rounded-lg p-6 text-center"
                >
                  <div className="text-lg font-semibold text-accent">Column {item}</div>
                  <p className="text-sm text-muted-foreground mt-2">Grid Item</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RESPONSIVE SPACING SCALE */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Spacing Scale</CardTitle>
            <CardDescription>Padding changes at different breakpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* MOBILE PADDING: p-4 */}
            <div>
              <p className="text-sm font-medium mb-2">Mobile Padding (p-4 = 16px)</p>
              <div className="bg-muted p-4 rounded border border-border">
                <div className="bg-primary/20 text-center text-sm font-medium py-4">
                  16px padding
                </div>
              </div>
            </div>

            {/* TABLET PADDING: md:p-6 */}
            <div>
              <p className="text-sm font-medium mb-2">Tablet Padding (md:p-6 = 24px)</p>
              <div className="bg-muted p-4 md:p-6 rounded border border-border">
                <div className="bg-secondary/20 text-center text-sm font-medium py-4">
                  24px on tablets and up
                </div>
              </div>
            </div>

            {/* DESKTOP PADDING: lg:p-8 */}
            <div>
              <p className="text-sm font-medium mb-2">Desktop Padding (lg:p-8 = 32px)</p>
              <div className="bg-muted p-4 md:p-6 lg:p-8 rounded border border-border">
                <div className="bg-destructive/20 text-center text-sm font-medium py-4">
                  32px on desktops and up
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESPONSIVE TYPOGRAPHY */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Typography Scale</CardTitle>
            <CardDescription>Font sizes scale from mobile to desktop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">H1 (Mobile: 30px → Desktop: 36px)</p>
              <h1 className="h1-responsive">Heading 1</h1>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">H2 (Mobile: 24px → Desktop: 30px)</p>
              <h2 className="h2-responsive">Heading 2</h2>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">H3 (Mobile: 20px → Desktop: 24px)</p>
              <h3 className="h3-responsive">Heading 3</h3>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Body (Mobile: 16px → Desktop: 18px)</p>
              <p className="body-responsive">
                This is body text that scales responsively. On mobile devices it starts at 16px, and on
                desktop it grows to 18px for better readability.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VISIBILITY UTILITIES */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility Utilities</CardTitle>
            <CardDescription>Show/hide content based on breakpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden-mobile bg-primary text-primary-foreground p-4 rounded text-center">
              Hidden on mobile, visible on tablet and up
            </div>

            <div className="hidden-tablet-up bg-secondary text-secondary-foreground p-4 rounded text-center">
              Visible on mobile only
            </div>

            <div className="hidden-desktop bg-accent text-accent-foreground p-4 rounded text-center">
              Hidden on desktop, visible on tablet and below
            </div>
          </CardContent>
        </Card>

        {/* BREAKPOINT REFERENCE */}
        <Card>
          <CardHeader>
            <CardTitle>Breakpoint Reference</CardTitle>
            <CardDescription>Defined breakpoints for the responsive system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">sm</span>
                <span className="text-sm text-muted-foreground">640px (small devices)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">md</span>
                <span className="text-sm text-muted-foreground">768px (tablets)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">lg</span>
                <span className="text-sm text-muted-foreground">1024px (small desktops)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">xl</span>
                <span className="text-sm text-muted-foreground">1280px (large desktops)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">2xl</span>
                <span className="text-sm text-muted-foreground">1536px (extra large)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LAYOUT PATTERNS */}
        <Card>
          <CardHeader>
            <CardTitle>Common Responsive Patterns</CardTitle>
            <CardDescription>Examples of mobile-first responsive layouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Responsive Two-Column Layout</p>
              <div className="grid grid-responsive-2 gap-responsive">
                <div className="bg-primary/10 border border-primary rounded p-4 text-center">
                  Column 1
                </div>
                <div className="bg-primary/10 border border-primary rounded p-4 text-center">
                  Column 2
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Responsive Padding</p>
              <div className="p-responsive bg-muted rounded border border-border">
                <div className="text-center text-sm">
                  Padding: 16px mobile | 24px tablet | 40px desktop
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TESTING CHECKLIST */}
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle>Testing Checklist</CardTitle>
            <CardDescription>Verify responsive behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" /> No content cut off at any breakpoint
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" /> No horizontal scroll at any size
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" /> Touch targets ≥44px on mobile
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" /> Text readable (min 16px on mobile)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" /> Smooth transitions between breakpoints
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

// Note: This page is intended for development and testing purposes only.