---
name: tailwind-css-4
description: Use when styling with Tailwind CSS 4 — covers utility classes, dark mode, theming, responsive design, and Vite plugin setup
---

# Tailwind CSS 4 Best Practices

## Setup (Vite Plugin)

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [tailwindcss()] });
```

```css
/* src/index.css */
@import "tailwindcss";
```

**No PostCSS config needed** — v4 uses Vite plugin directly.

## Utility Class Principles

1. **Utility-first** — compose styles in JSX, not CSS files
2. **Mobile-first** — base styles = mobile, `md:` = desktop
3. **State variants** — `hover:`, `focus:`, `dark:`, `active:`
4. **Composition** — combine utilities in `className`

## Dark Mode

```tsx
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

### Class-based (manual toggle)

```tsx
<html className={theme === 'dark' ? 'dark' : ''}>
```

### Theme cycling pattern

```tsx
const themes = ['light', 'dark', 'midnight'] as const;
const next = themes[(themes.indexOf(current) + 1) % themes.length];
```

## Responsive Design

```tsx
{/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

| Prefix | Min-width |
|--------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

## Common Patterns

### Glass morphism

```tsx
className="bg-white/70 backdrop-blur-xl border border-white/20"
```

### Gradient backgrounds

```tsx
className="bg-linear-to-br from-blue-600 to-indigo-600"
```

### Transitions

```tsx
className="transition-colors duration-300"
```

### Sticky header

```tsx
className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl"
```

### Animations

```tsx
className="animate-spin"  {/* Loader2 */}
className="transition active:scale-90"  {/* Button press */}
```

## Theming with CSS Variables

```css
@theme {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
}
```

```tsx
className="bg-primary text-secondary"
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `@apply` everywhere | Prefer inline utilities |
| `bg-[#fff]` for standard colors | Use `bg-white` |
| Missing `dark:` variants | Always add dark mode styles |
| Using `style={}` for simple styles | Use Tailwind classes |
| Inconsistent spacing scale | Use Tailwind's 4px grid (p-1 = 4px, p-2 = 8px) |
