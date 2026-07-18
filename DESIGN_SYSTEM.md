# Agent Society Design System

## Design Philosophy
**Principles:**
- Clarity over decoration
- Functionality first, aesthetics second
- Consistency across all touchpoints
- Accessibility as a default
- Performance and responsiveness
- Elegant simplicity

## Visual Identity
**Brand Attributes:**
- Innovative but grounded
- Professional yet approachable
- Technical excellence
- Trust and reliability
- Premium quality

## Color System

### Primary Colors
```css
--color-primary-50: #f0f9ff
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9
--color-primary-600: #0284c7
--color-primary-700: #0369a1
--color-primary-800: #075985
--color-primary-900: #0c4a6e
--color-primary-950: #082f49
```

### Neutral Colors (Dark Theme)
```css
--color-neutral-950: #020617
--color-neutral-900: #0f172a
--color-neutral-800: #1e293b
--color-neutral-700: #334155
--color-neutral-600: #475569
--color-neutral-500: #64748b
--color-neutral-400: #94a3b8
--color-neutral-300: #cbd5e1
--color-neutral-200: #e2e8f0
--color-neutral-100: #f1f5f9
--color-neutral-50: #f8fafc
```

### Semantic Colors
```css
/* Success */
--color-success-500: #10b981
--color-success-600: #059669

/* Warning */
--color-warning-500: #f59e0b
--color-warning-600: #d97706

/* Error */
--color-error-500: #ef4444
--color-error-600: #dc2626

/* Info */
--color-info-500: #3b82f6
--color-info-600: #2563eb
```

## Typography

### Font Families
```css
--font-sans: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', monospace
--font-display: 'Inter', sans-serif
```

### Type Scale
```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
--text-6xl: 3.75rem     /* 60px */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### Line Heights
```css
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

## Spacing System

### Scale
```css
--space-0: 0
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
--space-24: 6rem      /* 96px */
--space-32: 8rem      /* 128px */
```

### Container Widths
```css
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px
```

## Border Radius

```css
--radius-none: 0
--radius-sm: 0.125rem    /* 2px */
--radius-md: 0.375rem    /* 6px */
--radius-lg: 0.5rem      /* 8px */
--radius-xl: 0.75rem     /* 12px */
--radius-2xl: 1rem       /* 16px */
--radius-3xl: 1.5rem     /* 24px */
--radius-full: 9999px
```

## Shadows

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)
```

## Transitions

```css
--transition-fast: 150ms ease-in-out
--transition-base: 200ms ease-in-out
--transition-slow: 300ms ease-in-out
--transition-slower: 500ms ease-in-out
```

## Z-Index Scale

```css
--z-dropdown: 1000
--z-sticky: 1020
--z-fixed: 1030
--z-modal-backdrop: 1040
--z-modal: 1050
--z-popover: 1060
--z-tooltip: 1070
```

## Breakpoints

```css
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

## Component Guidelines

### Buttons
- Clear visual hierarchy (primary, secondary, ghost)
- Consistent padding and sizing
- Hover and active states
- Loading states
- Disabled states
- Icon support

### Cards
- Consistent padding and spacing
- Subtle shadows for depth
- Hover effects for interactivity
- Clear content hierarchy
- Responsive layouts

### Inputs
- Clear focus states
- Error and validation states
- Consistent sizing
- Label positioning
- Helper text support

### Navigation
- Clear active states
- Smooth transitions
- Responsive behavior
- Keyboard navigation
- Accessible labels

### Modals
- Backdrop blur
- Smooth animations
- Clear close actions
- Focus management
- Responsive sizing

## Animation Guidelines

### Principles
- Purposeful motion
- Smooth transitions
- Respect user preferences
- Performance optimized
- Accessibility aware

### Duration
- Micro-interactions: 150-200ms
- Component transitions: 200-300ms
- Page transitions: 300-500ms
- Complex animations: 500-800ms

### Easing
- Ease-out for entering elements
- Ease-in for exiting elements
- Ease-in-out for state changes

## Accessibility Standards

### Color Contrast
- WCAG AA: 4.5:1 for normal text
- WCAG AA: 3:1 for large text
- WCAG AAA: 7:1 for normal text

### Focus States
- Visible focus indicators
- Logical tab order
- Skip navigation links
- Keyboard shortcuts

### Screen Readers
- ARIA labels
- Semantic HTML
- Live regions
- Error announcements

### Reduced Motion
- Respect prefers-reduced-motion
- Provide alternatives
- Disable animations when needed

## Responsive Strategy

### Mobile First
- Design for mobile first
- Progressive enhancement
- Touch-friendly targets
- Optimized layouts

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1280px

### Grid System
- 12-column grid
- Flexible gutters
- Responsive containers
- Auto-layout support
