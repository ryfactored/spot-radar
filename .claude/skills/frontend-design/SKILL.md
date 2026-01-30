---
name: frontend-design
description: Review and suggest UX/UI improvements for Angular Material apps. Use when evaluating layout, navigation, responsiveness, accessibility, or visual consistency.
allowed-tools: Read, Grep, Glob
---

# Frontend Design Review

When reviewing or suggesting UI/UX improvements for this Angular + Material app:

## Process

1. **Audit current state** — Read component templates, styles, and layout files to understand existing patterns
2. **Check consistency** — Compare spacing, typography, color usage, button placement, and card layouts across pages
3. **Evaluate responsiveness** — Look for media queries, flexible grids, sidenav breakpoint handling
4. **Assess accessibility** — ARIA labels, keyboard navigation, focus management, color contrast, skip links
5. **Review information architecture** — Navigation structure, page hierarchy, empty/loading/error states

## Design Principles (for a starter template)

- **Simple over clever** — Patterns should be easy to understand and extend
- **Material Design conventions** — Follow Angular Material guidelines; don't fight the framework
- **Consistent spacing** — Use a predictable scale (8px grid: 8, 16, 24, 32, 48)
- **Mobile-first** — Layouts should work on small screens without horizontal scrolling
- **Progressive disclosure** — Show essential content first; details on demand
- **Accessible by default** — Semantic HTML, ARIA where needed, keyboard-operable

## What to Look For

- Inconsistent header patterns (h1 placement, spacing, action button alignment)
- Cards that don't align to a grid or have inconsistent padding
- Missing loading/empty/error states on data-driven pages
- Forms without proper validation feedback
- Navigation that doesn't indicate the active route
- Hard-coded colors instead of theme variables
- Styles that would break on narrow viewports

## Output Format

Organize findings by category (Layout, Navigation, Consistency, Responsiveness, Accessibility). For each finding, state the current behavior, why it matters, and a concrete suggestion.
