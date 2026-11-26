# Design Taste Skill for Descript

This directory contains the Design Taste skill configuration for the Descript agent identity platform. The skill provides design system guidance, component specifications, and quality gates to ensure consistent, high-quality implementation.

## What's Included

### 1. Design System Documentation
- **`steering/design-taste.md`** — Complete design system specification with:
  - Color palette and usage guidelines
  - Typography scale and font choices
  - Component design rules (buttons, forms, cards)
  - Layout principles and spacing system
  - Motion and interaction guidelines
  - Accessibility requirements (WCAG 2.1 AA)
  - Quality gates and pre-flight checks

### 2. Design Tokens
The design system uses Tailwind CSS with custom extensions defined in:
- `tailwind.config.js` — Design token configuration
- `src/index.css` — Global styles and CSS variables

### 3. Implementation Guidelines

#### For Developers:
1. **Read the Design Taste document** before implementing any UI
2. **Follow the component patterns** exactly as specified
3. **Use the provided design tokens** (colors, spacing, typography)
4. **Run quality checks** before committing changes
5. **Test accessibility** with keyboard navigation and screen readers

#### For Design Review:
1. **Check button contrast** — All CTAs must pass WCAG AA
2. **Verify form accessibility** — Labels, errors, focus states
3. **Test mobile responsiveness** — Touch targets, stacking behavior
4. **Review layout variety** — Avoid repetitive patterns
5. **Check visual hierarchy** — Clear importance ordering

## Key Design Principles

### 1. Product Identity
Descript is infrastructure for AI agent identities. The design must communicate:
- **Trust & Verification** — Cryptographic proofs, secure credentials
- **Infrastructure** — Developer-grade, reliable platform  
- **Connectivity** — Agents connecting across platforms
- **Developer Experience** — Clean SDKs, clear documentation

### 2. Visual Language
- **Professional but approachable** — Serious infrastructure, friendly UX
- **Technical but clear** — Developer-focused but understandable
- **Modern but timeless** — Current design patterns without trend-chasing
- **Accessible by default** — WCAG 2.1 AA compliance

### 3. Layout Discipline
- **Hero sections** — Fit in viewport, clear hierarchy
- **Navigation** — Clean, responsive, accessible
- **Section variety** — Avoid repetitive patterns
- **White space** — Balanced visual density

## Quality Gates

### Pre-Flight Checks (Before Shipping)
1. ✅ **Button Contrast** — All CTAs pass WCAG AA contrast
2. ✅ **Form Accessibility** — Labels, errors, focus states correct
3. ✅ **Hero Viewport Fit** — Hero visible without scroll on desktop
4. ✅ **Layout Variety** — No more than 2 consecutive similar layouts
5. ✅ **Eyebrow Restraint** — Max 1 eyebrow per 3 sections
6. ✅ **CTA Uniqueness** — No duplicate intent CTAs
7. ✅ **Mobile Responsiveness** — Touch targets ≥44px, no horizontal scroll

### Performance Targets
- Lighthouse score: >90
- Page load: <3s
- Bundle size: <200KB gzipped
- No layout shifts

## Usage with Kiro

When Kiro works on the Descript frontend, it should:
1. **Always read** the design taste skill first
2. **Apply the design principles** consistently
3. **Use the provided design tokens** (not arbitrary values)
4. **Run quality checks** before declaring completion
5. **Test on mobile** and with accessibility tools

## Design Dials

The current dial settings for Descript:
- **VARIANCE**: 7 (balanced layout diversity)
- **MOTION**: 6 (moderate, purposeful animation)
- **DENSITY**: 4 (moderate white space)

## File Structure

```
.kiro/
├── README.md                    # This file
├── package.json                 # Design skill package
└── steering/
    └── design-taste.md          # Complete design system specification
```

## Related Files

- `tailwind.config.js` — Design token configuration
- `src/index.css` — Global styles with design tokens
- `src/App.tsx` — Main application with design system applied

---

**Maintained by:** Descript Platform Team  
**Last Updated:** November 2026  
**Design System Version:** 1.0
