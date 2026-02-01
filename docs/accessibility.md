# Accessibility Checklist

Quick reference for building accessible components.

## New Component Checklist

### Interactive Elements

- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<mat-label>` or `aria-label`
- [ ] Clickable elements are `<button>` (actions) or `<a>` (navigation)

### Dynamic Content

- [ ] Error messages have `role="alert"`
- [ ] Success/status messages have `role="status"`
- [ ] Loading states use `aria-busy="true"` or `role="status"` with `aria-live="polite"`
- [ ] Content that updates has `aria-live="polite"` (or `"assertive"` for errors)

### Visual

- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Focus is visible (`:focus-visible` styling)
- [ ] Color is not the only indicator (add icons/text for errors)

### Structure

- [ ] Headings follow hierarchy (h1 → h2 → h3)
- [ ] Landmark roles where appropriate (`role="navigation"`, `role="main"`)

---

## Common Patterns

### Icon Button

```html
<button mat-icon-button aria-label="Delete item">
  <mat-icon>delete</mat-icon>
</button>
```

### Password Toggle

```html
<button mat-icon-button [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
</button>
```

### Error Message

```html
@if (error) {
<p class="error" role="alert">{{ error }}</p>
}
```

### Loading State

```html
<div role="status" aria-live="polite">
  <mat-spinner aria-hidden="true"></mat-spinner>
  <span class="visually-hidden">Loading...</span>
</div>
```

### Live Region (for dynamic content)

```html
<div aria-live="polite" aria-atomic="true">{{ dynamicMessage }}</div>
```

---

## Automated Testing

Run accessibility tests:

```bash
npx playwright test e2e/accessibility.spec.ts
```

Tests use [axe-core](https://github.com/dequelabs/axe-core) to catch common issues automatically.

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Angular Material Accessibility](https://material.angular.io/cdk/a11y/overview)
