# ESG FOODPOINT - Quick UI Reference Guide

## 🎨 Design System Quick Reference

### Color Variables (CSS)
```css
/* Backgrounds */
--bg-main: Main page background
--bg-card: Card/container background
--bg-strong: Dark background

/* Text */
--text-primary: Primary text color
--text-secondary: Secondary/muted text
--text-muted: Very muted text

/* Brand */
--color-primary: Primary action color (orange)

/* Borders */
--border: Standard border color
```

### Rounded Corners
- Buttons: `rounded-xl` (12px)
- Cards: `rounded-2xl` (16px)
- Small elements: `rounded-lg` (8px)

### Shadows
- `shadow-sm` - Subtle shadow (default)
- `shadow-md` - Medium shadow (hover state)
- `shadow-lg` - Large shadow (modals)

### Spacing Units
- `p-4` - 1rem (small card)
- `p-6` - 1.5rem (standard card)
- `p-8` - 2rem (large section)
- `gap-4` - 1rem (between items)
- `gap-6` - 1.5rem (between sections)

---

## 🔘 Button Styles

### Primary Button (CTAs)
```jsx
className="rounded-xl bg-[var(--color-primary)] text-white px-4 py-2 font-semibold hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50"
```

### Secondary Button
```jsx
className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2 hover:bg-[var(--bg-main)] transition-all duration-200 active:scale-95"
```

### Danger Button
```jsx
className="rounded-xl bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700 transition-all duration-200 active:scale-95 disabled:opacity-50"
```

### Tab Active State
```jsx
className="px-4 py-2 font-semibold rounded-xl bg-[var(--color-primary)] text-white shadow-md"
```

### Tab Inactive State
```jsx
className="px-4 py-2 font-semibold rounded-xl bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--border)]"
```

---

## 📝 Input Fields

### Text Input
```jsx
className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
```

### Textarea
```jsx
className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none transition-all duration-200"
```

---

## 🎯 Cards & Containers

### Standard Card
```jsx
className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005]"
```

### Order/Item Card
```jsx
className="rounded-2xl border p-5 transition-all duration-200 bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md hover:scale-[1.02]"
```

### Selected State
```jsx
className="border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md scale-[1.01]"
```

---

## 🏷️ Badges & Status

### Status Badge
```jsx
className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm"
```

### Success Badge
```jsx
className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold"
```

### Warning Badge
```jsx
className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-semibold"
```

---

## 📐 Spacing Patterns

### Section Layout
```jsx
<div className="space-y-8"> {/* Between major sections */}
  <div className="mx-auto max-w-7xl px-6 py-8">
    {/* Content */}
  </div>
</div>
```

### Card Group
```jsx
<div className="space-y-3"> {/* Between cards */}
  {items.map(item => (
    <div className="rounded-2xl border border-[var(--border)] p-5" key={item.id}>
      {/* Card content */}
    </div>
  ))}
</div>
```

### Form Inputs
```jsx
<div className="space-y-4"> {/* Between form fields */}
  <input type="text" className="..." />
  <input type="email" className="..." />
</div>
```

---

## 🎭 Typography

### Page Title
```jsx
className="text-3xl font-bold text-[var(--text-primary)]"
```

### Section Title
```jsx
className="text-lg font-semibold text-[var(--text-primary)]"
```

### Card Title
```jsx
className="text-lg font-bold text-[var(--text-primary)]"
```

### Secondary Text
```jsx
className="text-sm text-[var(--text-secondary)]"
```

### Muted Text
```jsx
className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.08em]"
```

---

## ⚡ Common Interactions

### Smooth Hover
```jsx
className="transition-all duration-200 hover:shadow-md hover:scale-[1.005]"
```

### Button Feedback
```jsx
className="transition-all duration-200 hover:opacity-90 active:scale-95"
```

### Focus State
```jsx
className="focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
```

### Loading State
```jsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

---

## 🌙 Dark Mode

All components automatically support dark mode through CSS variables:
- Light: `--bg-card` = white, `--text-primary` = dark
- Dark: `--bg-card` = dark, `--text-primary` = light

Add dark-specific overrides where needed:
```jsx
className="dark:bg-green-900/30 dark:text-green-400"
```

---

## 📱 Responsive Breakpoints

- Mobile: Default (no breakpoint needed)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Large: `xl:` (1280px+)

Example:
```jsx
className="px-4 md:px-6 lg:px-8"
```

---

## ✅ Quality Checklist

When adding new components:
- [ ] Use `rounded-xl` or `rounded-2xl`
- [ ] Add hover states with `transition-all duration-200`
- [ ] Use CSS variables for colors
- [ ] Follow spacing units (p-4/6/8, gap-4/6)
- [ ] Support dark mode
- [ ] Test on mobile
- [ ] Add scale/shadow feedback for interactive elements
- [ ] Use semantic font sizes

---

**Last Updated:** April 26, 2026
