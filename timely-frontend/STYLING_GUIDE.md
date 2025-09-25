# 🎨 TIMELY Frontend Styling Guide

This guide shows you how to customize the appearance of your sports management system frontend.

## 🚀 Quick Theme Switching

To change the entire theme, uncomment one of these sections in `src/index.css`:

### 🌙 Dark Theme
```css
:root {
  --bg: #0f172a;
  --panel: #1e293b;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --primary: #3b82f6;
  --primary-100: #1e3a8a;
  --accent: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #06b6d4;
}
```

### 🌿 Nature Theme
```css
:root {
  --primary: #059669;
  --primary-100: #d1fae5;
  --accent: #0d9488;
  --info: #0891b2;
  --warning: #ca8a04;
  --danger: #dc2626;
}
```

### 🔥 Fire Theme
```css
:root {
  --primary: #dc2626;
  --primary-100: #fee2e2;
  --accent: #ea580c;
  --info: #0891b2;
  --warning: #d97706;
  --danger: #b91c1c;
}
```

### 💎 Premium Theme
```css
:root {
  --primary: #7c3aed;
  --primary-100: #ede9fe;
  --accent: #a855f7;
  --info: #06b6d4;
  --warning: #f59e0b;
  --danger: #dc2626;
}
```

## 🎨 Color Customization

### Primary Colors
```css
:root {
  --primary: #2563eb;        /* Main brand color */
  --primary-100: #dbeafe;    /* Light background */
  --primary-200: #bfdbfe;    /* Lighter accent */
  --primary-600: #2563eb;    /* Main button color */
  --primary-700: #1d4ed8;    /* Darker hover state */
}
```

### Accent Colors
```css
:root {
  --accent: #059669;         /* Success/positive actions */
  --danger: #dc2626;         /* Error/destructive actions */
  --warning: #d97706;        /* Warning states */
  --info: #0284c7;           /* Information states */
}
```

### Background Colors
```css
:root {
  --bg: #f8fafc;             /* Main background */
  --panel: #ffffff;          /* Card/panel background */
  --text: #1e293b;           /* Primary text color */
  --muted: #64748b;          /* Secondary text color */
}
```

## 🔤 Typography

### Font Families
The app uses **Inter** font by default. To change:

```css
:root {
  font-family: 'Your-Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Typography Classes
```html
<h1 class="text-display">Display Text</h1>
<h2 class="text-heading">Main Heading</h2>
<h3 class="text-subheading">Subheading</h3>
<p class="text-body">Body text</p>
<span class="text-caption">Caption text</span>
<span class="text-overline">OVERLINE TEXT</span>
```

## 🎯 Button Styles

### Button Variants
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-ghost">Ghost Button</button>
<button class="btn btn-danger">Danger Button</button>
<button class="btn btn-success">Success Button</button>
<button class="btn btn-outline">Outline Button</button>
```

### Button Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Regular</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-xl">Extra Large</button>
```

## 🃏 Card Styles

### Card Variants
```html
<div class="card">Standard Card</div>
<div class="card card-compact">Compact Card</div>
<div class="card card-large">Large Card</div>
<div class="card card-elevated">Elevated Card</div>
<div class="card card-glass">Glass Card</div>
<div class="card card-gradient">Gradient Card</div>
```

## 📝 Form Styles

### Form Elements
```html
<label class="form-label">Label Text</label>
<input class="form-input" placeholder="Enter text...">
<div class="form-error">Error message</div>
<div class="form-help">Help text</div>
<div class="form-success">Success message</div>
```

## 🏆 Sports-Specific Styles

### Score Display
```html
<div class="score-display">42 - 38</div>
```

### Team Badges
```html
<span class="team-badge">Team Alpha</span>
```

### Live Indicator
```html
<span class="live-indicator">LIVE</span>
```

### Trophy Icons
```html
<Trophy className="trophy-icon" />
```

### Medal Colors
```html
<span class="medal-gold">🥇 Gold</span>
<span class="medal-silver">🥈 Silver</span>
<span class="medal-bronze">🥉 Bronze</span>
```

## ✨ Animations

### Animation Classes
```html
<div class="float">Floating element</div>
<div class="pulse-glow">Glowing element</div>
<div class="slide-in-left">Slide from left</div>
<div class="slide-in-right">Slide from right</div>
<div class="bounce-in">Bounce in</div>
```

### Staggered Animations
```html
<div class="slide-in-left stagger-1">Item 1</div>
<div class="slide-in-left stagger-2">Item 2</div>
<div class="slide-in-left stagger-3">Item 3</div>
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Responsive Typography
```html
<h1 class="text-responsive-xl">Responsive Heading</h1>
<p class="text-responsive">Responsive Body Text</p>
```

## 🎨 Custom Gradients

### Available Gradients
```css
background: var(--gradient-primary);   /* Blue gradient */
background: var(--gradient-success);   /* Green gradient */
background: var(--gradient-warning);   /* Orange gradient */
background: var(--gradient-danger);    /* Red gradient */
background: var(--gradient-info);      /* Cyan gradient */
```

## 🔧 Layout Customization

### Border Radius
```css
:root {
  --radius: 12px;      /* Default radius */
  --radius-sm: 8px;    /* Small radius */
  --radius-lg: 16px;   /* Large radius */
  --radius-xl: 20px;   /* Extra large radius */
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Spacing Scale
```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
}
```

## 🌙 Dark Mode

Dark mode is ready to implement. Uncomment the dark mode section in `src/index.css`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --panel: #1e293b;
    --text: #f1f5f9;
    --muted: #94a3b8;
  }
}
```

## 🎯 Status Badges

### Status Colors
```html
<span class="status-badge status-approved">Approved</span>
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-rejected">Rejected</span>
<span class="status-badge status-cancelled">Cancelled</span>
```

### Connection Status
```html
<span class="status-indicator status-online">Online</span>
<span class="status-indicator status-offline">Offline</span>
<span class="status-indicator status-connecting">Connecting</span>
<span class="status-indicator status-error">Error</span>
```

## 🎨 Custom Scrollbars

Apply to any scrollable element:
```html
<div class="custom-scrollbar">Scrollable content</div>
```

## 📄 Print Styles

Print-optimized styles are included. Use these classes:
```html
<div class="no-print">Hidden when printing</div>
<div class="print-break">Page break before this element</div>
```

## 🚀 Quick Customization Examples

### 1. Change Brand Colors
```css
:root {
  --primary: #your-brand-color;
  --primary-100: #your-light-color;
  --primary-700: #your-dark-color;
}
```

### 2. Add Custom Font
```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');

:root {
  font-family: 'YourFont', sans-serif;
}
```

### 3. Create Custom Button
```css
.btn-custom {
  @apply btn;
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
  border: 2px solid #your-border-color;
}
```

### 4. Add Custom Animation
```css
@keyframes yourAnimation {
  0% { /* start state */ }
  100% { /* end state */ }
}

.your-animation {
  animation: yourAnimation 1s ease-in-out;
}
```

## 🎯 Best Practices

1. **Use CSS Variables**: Always use the defined CSS variables for consistency
2. **Mobile First**: Design for mobile, then enhance for larger screens
3. **Accessibility**: Ensure sufficient color contrast and focus states
4. **Performance**: Use `transform` and `opacity` for animations
5. **Consistency**: Stick to the design system for a cohesive look

## 🔧 Development Tips

1. **Hot Reload**: Changes to `src/index.css` will automatically reload
2. **Browser DevTools**: Use browser dev tools to experiment with styles
3. **CSS Variables**: You can override CSS variables in browser dev tools
4. **Component Isolation**: Each component can have its own styles if needed

---

**Happy Styling! 🎨✨**
