# Responsive System Documentation

## Overview

The Geev application uses a mobile-first, responsive design system built on Tailwind CSS. This system ensures consistent behavior across all devices (mobile, tablet, desktop) with a standardized grid system, container constraints, and scaling typography/spacing.


## Breakpoints

All responsive decisions are made at these defined breakpoints:

| Breakpoint | Size | Device Type | Use Case |
|-----------|------|------------|----------|
| **default** | < 640px | Mobile phones | Base mobile styles |
| **sm** | 640px+ | Small devices | Large phones, small tablets |
| **md** | 768px+ | Tablets | iPad, tablet devices |
| **lg** | 1024px+ | Small desktops | Laptops, desktop computers |
| **xl** | 1280px+ | Large desktops | Large monitors, wide screens |
| **2xl** | 1536px+ | Extra large | Ultra-wide displays |

### Mobile-First Approach

All styles are written for mobile first, then enhanced for larger screens:

```tsx
// Mobile: 16px padding
// Tablet (md): 32px padding  
// Desktop (lg): 40px padding
<div className="p-4 md:p-8 lg:p-10">Content</div>
```

---

## Container Component

The `Container` component provides a responsive wrapper with:
- Automatic horizontal padding based on screen size
- Max-width constraints to prevent content from becoming too wide
- Consistent margins and alignment

### Usage

```tsx
import { Container } from '@/components/ui/container';

export default function Page() {
  return (
    <Container>
      <h1>Page Title</h1>
      <p>Your content here</p>
    </Container>
  );
}
```

### Container Behavior

| Breakpoint | Padding | Max-Width |
|-----------|---------|-----------|
| Mobile | 16px | 100% |
| sm | 24px | 640px |
| md | 32px | 768px |
| lg | 40px | 1024px |
| xl | 48px | 1280px |

---

## Grid System

### 1-2-3 Column Grid (grid-responsive-1)

Automatically scales from 1 column on mobile to 3 columns on desktop:

```tsx
<div className="grid-responsive-1 gap-responsive">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
  <div>Column 5</div>
  <div>Column 6</div>
</div>
```

**Behavior:**
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (xl): 3 columns

### 1-2 Column Grid (grid-responsive-2)

For simpler two-column layouts:

```tsx
<div className="grid-responsive-2 gap-responsive">
  <div>Sidebar</div>
  <div>Main Content</div>
</div>
```

**Behavior:**
- Mobile: 1 column (stacked)
- Tablet and up (md): 2 columns

### Custom Grid Layouts

Use Tailwind's grid utilities with mobile-first breakpoints:

```tsx
// 1 column mobile, 2 columns tablet, 3 columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// 2 columns mobile, 3 columns tablet, 4 columns desktop
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>
```

---

## Spacing Scale

### Responsive Padding Utilities

Use these utility classes for consistent spacing:

```tsx
// All padding levels scale responsively
<div className="p-responsive">Responsive padding all sides</div>
<div className="px-responsive">Responsive horizontal padding</div>
<div className="py-responsive">Responsive vertical padding</div>
```

**Padding Values:**
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px
- Large Desktop: 40px

### Gap Utilities

For consistent gaps between grid items:

```tsx
<div className="gap-responsive">
  {/* Automatically scales gaps from 16px to 32px */}
</div>
```

**Gap Values:**
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px

---

## Typography Scale

### Responsive Heading Classes

Text sizes scale automatically based on screen size:

```tsx
// H1: 30px → 36px
<h1 className="h1-responsive">Main Heading</h1>

// H2: 24px → 30px
<h2 className="h2-responsive">Section Heading</h2>

// H3: 20px → 24px
<h3 className="h3-responsive">Subsection</h3>
```

### Body Text Scaling

```tsx
// Body text: 16px → 18px
<p className="body-responsive">
  This text scales from 16px on mobile to 18px on desktop
</p>

// Small text: 14px → 16px
<p className="text-sm-responsive">Small responsive text</p>
```

### Manual Font Size Control

For fine-grained control, use Tailwind's text utilities:

```tsx
// Mobile 16px, Tablet 18px, Desktop 20px
<p className="text-base md:text-lg lg:text-xl">Custom sizing</p>
```

---

## Visibility Utilities

### Hide on Mobile, Show on Tablet+

```tsx
<div className="hidden-mobile">
  This element is hidden on mobile devices
</div>
```

### Show on Mobile Only

```tsx
<div className="hidden-tablet-up">
  This element is visible only on mobile
</div>
```

### Hide on Desktop

```tsx
<div className="hidden-desktop">
  This element is hidden on desktop (xl and above)
</div>
```

---

## Common Responsive Patterns

### Sidebar + Main Content Layout

```tsx
// Stacks on mobile, side-by-side on tablet+
<div className="grid-responsive-2 gap-responsive">
  <aside className="lg:w-64">
    <nav>Navigation</nav>
  </aside>
  <main>
    <h1>Main Content</h1>
  </main>
</div>
```

### Three-Column Dashboard Layout

```tsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid-responsive-1 gap-responsive">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
  <div>Card 5</div>
  <div>Card 6</div>
</div>
```

### Responsive Image Grid

```tsx
// 1 image mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-responsive">
  {images.map((img) => (
    <img key={img.id} src={img.url} alt={img.alt} className="w-full" />
  ))}
</div>
```

### Hide/Show Columns Based on Screen

```tsx
// Left column hidden on mobile
<div className="grid grid-cols-1 md:grid-cols-3 gap-responsive">
  <aside className="hidden md:block">Sidebar</aside>
  <main className="md:col-span-2">Content</main>
</div>
```

---

## Best Practices

### 1. Mobile-First Development

Always start with mobile styles first, then add complexity for larger screens:

```tsx
// ✅ Good - mobile first
<div className="flex-col md:flex-row">
  Content
</div>

// ❌ Avoid - desktop first
<div className="flex-row sm:flex-col">
  Content
</div>
```

### 2. Use Consistent Spacing

Stick to the defined spacing scale:

```tsx
// ✅ Good - uses defined scale
<div className="p-responsive gap-responsive">
  Items
</div>

// ❌ Avoid - inconsistent values
<div className="p-5 gap-3">
  Items
</div>
```

### 3. Readable Text on Mobile

Ensure minimum 16px font size on mobile devices:

```tsx
// ✅ Good - readable on mobile
<p className="text-base md:text-lg">Text</p>

// ❌ Avoid - too small on mobile
<p className="text-xs md:text-base">Text</p>
```

### 4. Touch Targets

Ensure interactive elements are at least 44px x 44px on mobile:

```tsx
// ✅ Good - adequate touch target
<button className="px-4 py-3 md:px-6 md:py-2">
  Click me
</button>

// ❌ Avoid - too small
<button className="px-2 py-1">Small button</button>
```

### 5. No Horizontal Scroll

Never allow horizontal scrolling at any breakpoint:

```tsx
// ✅ Good - responsive with proper max-width
<Container>
  <div className="grid-responsive-1">Items</div>
</Container>

// ❌ Avoid - potential overflow
<div className="w-screen overflow-x-auto">
  {/* Content wider than viewport */}
</div>
```

---

## Testing

### Testing Breakpoints

Use Chrome DevTools responsive mode or physical devices:

1. **Mobile Portrait**: 375px × 667px (iPhone)
2. **Mobile Landscape**: 667px × 375px (iPhone rotated)
3. **Tablet Portrait**: 768px × 1024px (iPad)
4. **Tablet Landscape**: 1024px × 768px (iPad rotated)
5. **Desktop**: 1280px × 720px (typical desktop)
6. **Wide Desktop**: 1920px × 1080px (large monitor)

### Testing Checklist

- [ ] No content cut off at any breakpoint
- [ ] No horizontal scroll at any size
- [ ] Touch targets ≥44px on mobile
- [ ] Text is readable (min 16px on mobile)
- [ ] Smooth transitions when resizing
- [ ] Images scale properly
- [ ] Navigation works on all sizes
- [ ] Forms are usable on mobile
- [ ] Breakpoint transitions feel natural

### Layout Testing Page

Visit `/test/layout` to see all responsive patterns in action. This page includes:
- Current breakpoint indicator
- Container max-width visualization
- Grid system examples
- Spacing scale examples
- Typography scaling examples
- Visibility utility examples
- Breakpoint reference table


## Implementation Example: Contact Form

Here's a complete example showing responsive form layout:

```tsx
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ContactForm() {
  return (
    <Container>
      <div className="max-w-2xl mx-auto py-responsive">
        <h1 className="h1-responsive mb-6">Contact Us</h1>

        <form className="space-y-6">
          {/* Two-column layout on desktop, single on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input placeholder="Doe" />
            </div>
          </div>

          {/* Full width email field */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input type="email" placeholder="john@example.com" />
          </div>

          {/* Full width textarea */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea placeholder="Your message..." rows={5} />
          </div>

          {/* Responsive button */}
          <Button className="w-full md:w-auto">Send Message</Button>
        </form>
      </div>
    </Container>
  );
}
```


## Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs/responsive-design
- **Layout Testing Page**: `/test/layout` - Visual demonstrations of all patterns
- **Container Component**: `/components/ui/container.tsx`
- **Global Utilities**: `/app/globals.css` (search for responsive utilities)
- **Tailwind Config**: `/tailwind.config.ts` - Breakpoint definitions


## Support & Questions

For issues or questions about the responsive system:

1. Check the layout testing page at `/test/layout`
2. Review this documentation
3. Check component implementations in `/components`
4. Open an issue on GitHub with your question
