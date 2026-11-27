# Design Taste Skill — Descript Implementation

**Design Read:** B2B SaaS landing for technical developers and agent builders, with a Linear-style minimalist-but-premium language, leaning toward Tailwind utilities + Geist font + restrained motion, communicating identity infrastructure and cryptographic verification.

**Dials:** VARIANCE: 7, MOTION: 6, DENSITY: 4

## 1. Core Brand Principles for Descript

### 1.1 Product Identity
Descript is infrastructure for AI agent identities. It must communicate:
- **Identity & Trust** — Persistent, verifiable agent identities
- **Infrastructure** — Developer-grade, reliable platform
- **Connectivity** — Agents connect across platforms
- **Verification** — Cryptographic proofs and secure credentials
- **Developer Empowerment** — Clean SDKs and integration experience

### 1.2 Design Tone
- **Professional** but not cold
- **Technical** but not intimidating  
- **Premium** but not ostentatious
- **Modern** but not trendy
- **Trustworthy** but not old-fashioned

## 2. Design System Implementation

### 2.1 Color Palette

```css
/* Primary Identity Colors */
--color-identity: #4f46e5;          /* Descript indigo */
--color-identity-light: #6366f1;    /* Lighter for hover */
--color-identity-dark: #3730a3;     /* Darker for pressed */

/* Trust & Status Colors */
--color-trust: #10b981;             /* Emerald green for active/verified */
--color-trust-light: #34d399;       /* Lighter trust state */
--color-warning: #f59e0b;           /* Amber for pending */
--color-danger: #ef4444;            /* Red for revoked/error */

/* Neutral Base */
--color-base-0: #ffffff;            /* Pure white */
--color-base-50: #f8fafc;           /* Lightest background */
--color-base-100: #f1f5f9;          /* Light background */
--color-base-200: #e2e8f0;          /* Borders, dividers */
--color-base-300: #cbd5e1;          /* Subtle UI elements */
--color-base-400: #94a3b8;          /* Secondary text */
--color-base-500: #64748b;          /* Body text */
--color-base-600: #475569;          /* Strong text */
--color-base-700: #334155;          /* Headings */
--color-base-800: #1e293b;          /* Dark mode text */
--color-base-900: #0f172a;          /* Dark backgrounds */
```

### 2.2 Typography

**Font Stack:**
- Primary: `Geist` (sans-serif)
- Monospace: `Geist Mono` for cryptographic data

**Scale:**
- Display: `text-4xl md:text-6xl lg:text-7xl` (hero only)
- Headline: `text-3xl md:text-4xl lg:text-5xl`
- Subhead: `text-xl md:text-2xl lg:text-3xl`
- Body Large: `text-lg`
- Body: `text-base`
- Small: `text-sm`
- X-Small: `text-xs`

**Line Height:**
- Headlines: `leading-tight` (1.1-1.2)
- Body: `leading-relaxed` (1.6-1.8)
- Monospace: `leading-loose` (2.0) for cryptographic hashes

### 2.3 Spacing Scale

Based on 4px (`0.25rem`) unit:
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px
- `space-12`: 48px
- `space-16`: 64px
- `space-24`: 96px

**Layout Max Widths:**
- Narrow: `max-w-4xl` (56rem)
- Wide: `max-w-7xl` (80rem)

## 3. Component Design Rules

### 3.1 Buttons

```css
/* Primary Button */
.btn-primary {
  @apply bg-identity text-white hover:bg-identity-light 
         active:bg-identity-dark transition-colors
         font-semibold rounded-lg px-6 py-3;
}

/* Secondary Button */  
.btn-secondary {
  @apply bg-base-100 text-base-700 border border-base-200
         hover:bg-base-200 active:bg-base-300 transition-colors
         font-semibold rounded-lg px-6 py-3;
}

/* Ghost Button */
.btn-ghost {
  @apply text-base-600 hover:bg-base-100 active:bg-base-200
         transition-colors font-medium rounded-lg px-4 py-2;
}
```

**Button Rules:**
- Minimum touch target: `44px`
- Always have visible hover/active states
- Never use white text on white backgrounds
- Maximum 3 words per CTA label
- One primary CTA per section

### 3.2 Cards & Containers

**Bytecript Card:**
- Border radius: `16px` (rounded-xl)
- Background: `white` or `base-50`
- Shadow: `shadow-lg` for elevation
- Padding: `32px` minimum (`p-8`)
- Max width: `640px` on desktop

**Section Cards:**
- Use varied layouts to avoid repetition
- Max 3 consecutive similar cards
- Alternate full-width and split layouts

### 3.3 Forms

**Input Design:**
```css
.input-field {
  @apply w-full px-4 py-3 rounded-lg border border-base-300
         focus:border-identity focus:ring-2 focus:ring-identity/20
         bg-white placeholder:text-base-400 transition-all;
}

.input-error {
  @apply border-danger focus:border-danger focus:ring-danger/20;
}
```

**Form Rules:**
- Labels above inputs
- Never use placeholder as label
- Helper text optional but helpful
- Errors below input with clear styling
- Always validate before submit

### 3.4 Status Indicators

**Agent Status Badges:**
- Active: `bg-trust-100 text-trust-800 border-trust-200`
- Pending: `bg-warning-100 text-warning-800 border-warning-200`
- Suspended: `bg-warning-100 text-warning-800 border-warning-200`
- Revoked: `bg-danger-100 text-danger-800 border-danger-200`
- Compromised: `bg-danger-100 text-danger-800 border-danger-200`

**Verification Badges:**
- Verified: Green check + text
- Not Verified: Gray with question mark
- Always show icon AND text

## 4. Layout Discipline

### 4.1 Hero Section Rules

**Maximum 4 text elements:**
1. Eyebrow (optional) OR brand strip
2. Headline (max 2 lines)
3. Subtext (max 20 words, 3-4 lines)
4. CTAs (1 primary + 1 secondary max)

**Hero Banned Elements:**
- Tagline below CTAs
- Trust logo wall inside hero
- Pricing teaser
- Feature bullet list
- Social proof avatar row

**Hero Top Padding Cap:** `pt-24` maximum (6rem)

### 4.2 Navigation Rules

- Single line on desktop (max 6 items)
- Height: `64px-72px` (4-4.5rem)
- Logo left, nav center, CTAs right
- Mobile: hamburger with proper overlay

### 4.3 Section Layout Variety

**Banned Patterns:**
- No more than 2 consecutive "left-image/right-text" zigzag sections
- No repeated 3-column card grids for every feature section
- No generic white-on-white card repetition

**Layout Families to Alternate:**
1. Split screen (50/50 text + visual)
2. Full-width headline with centered content
3. Bento grid (asymmetric tile arrangement)
4. Stacked cards with varied heights
5. Interactive preview + explanation
6. Code examples + commentary

### 4.4 White Space Guidelines

**Vertical Rhythm:**
- Between sections: `space-24` (96px)
- Between major elements: `space-12` (48px)
- Between related items: `space-6` (24px)
- Between form fields: `space-4` (16px)

**Visual Density:** `4` (moderate)
- Enough breathing room for serious content
- Not so sparse it feels empty
- Group related items visually

## 5. Visual Asset Strategy

### 5.1 Product Visuals

**Required Visuals:**
1. **Bytecript Identity Card** — Central hero visual
2. **Agent Identity Flow** — How identity works across platforms
3. **Network Visualization** — Byte Networks concept
4. **Developer SDK Example** — Code preview with syntax highlighting
5. **Verification Process** — How cryptographic verification works

**Visual Style:**
- Clean, minimalist representations
- Use brand colors consistently
- Avoid generic AI robot illustrations
- Use meaningful icons (fingerprint, key, network, checkmark)
- Prioritize clarity over decoration

### 5.2 Iconography

**Icon Library:** `lucide-react`
**Stroke Width:** `1.5`
**Size Scale:** `16px`, `20px`, `24px`

**Common Icons:**
- Identity: `Fingerprint`, `Key`, `Shield`
- Network: `Globe`, `Network`, `Link`
- Verification: `CheckCircle`, `Verified`, `Lock`
- Communication: `MessageSquare`, `Inbox`, `Bell`
- Development: `Code`, `Terminal`, `Cpu`

### 5.3 Image Guidelines

**Do Not Use:**
- Stock photos of random people
- Generic robot/AI illustrations
- Purple/blue AI gradients everywhere
- Meaningless dashboard screenshots
- Emojis as design elements

**Do Use:**
- Purposeful product visualizations
- Clean diagrams and flow charts
- Typographic treatments for emphasis
- Subtle gradients where they reinforce brand
- Realistic mockups of Bytecript card

## 6. Motion & Interaction

### 6.1 Animation Dial: `6` (moderate)

**Animation Types:**
- Fade in: `fadeIn 0.5s ease-out`
- Slide up: `slideUp 0.5s ease-out`
- Scale in: `scaleIn 0.2s ease-out`
- Subtle pulse: `pulseSuble 2s ease-in-out infinite`

**Use Cases:**
- Page load reveals
- Form validation feedback
- Success/error states
- Navigation transitions
- Hover interactions

**Banned Motions:**
- Infinite-loop micro-animations everywhere
- Excessive parallax scrolling
- Complex physics animations without purpose
- Distracting loading spinners

### 6.2 Interactive States

**Always Implement:**
- Hover states for all interactive elements
- Active/pressed states
- Focus states for keyboard navigation
- Loading states (skeleton preferred)
- Empty states with helpful guidance
- Error states with clear recovery paths

**Tactile Feedback:**
- Buttons: `scale-[0.98]` on active
- Cards: `translate-y-[-2px]` on hover
- Inputs: clear focus ring

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Never rely on color alone for meaning

**Keyboard Navigation:**
- Tab through all interactive elements
- Visible focus indicators
- Skip navigation links
- Logical tab order

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels where needed
- Alt text for all images
- Live regions for dynamic content

### 7.2 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.3 Form Accessibility

- Every input has associated label
- Every error has clear text description
- Every required field indicated
- Every success state announced

## 8. Quality Gates

### 8.1 Pre-Flight Checks

Before shipping any design:
1. **Button Contrast** — All CTAs pass WCAG AA
2. **Form Contrast** — All inputs, labels, placeholders pass contrast
3. **Hero Fit** — Hero fits initial viewport on desktop
4. **Layout Variety** — No more than 2 consecutive similar layouts
5. **Eyebrow Restraint** — Max 1 eyebrow per 3 sections
6. **CTA Uniqueness** — No duplicate intent CTAs on same page
7. **Visual Density** — Not too sparse, not too crowded

### 8.2 Mobile Testing Checklist

- All content readable without horizontal scroll
- Tap targets minimum `44px`
- Navigation collapses to hamburger
- Forms stack vertically
- Images scale appropriately
- No horizontal overflow

### 8.3 Performance Targets

- Lighthouse score: >90
- Page load: <3s
- Bundle size: <200KB gzipped
- No layout shifts
- Optimized images

## 9. Implementation Notes for Descript

### 9.1 Bytecript Card Specifics

**Must Include:**
1. Agent name (large, prominent)
2. Agent ID (monospace, copyable)
3. Byte Network + Residence
4. Status indicator (color + text)
5. Public key fingerprint (formatted)
6. Verification seal
7. Issuance timestamp
8. Export/share actions

**Visual Treatment:**
- Looks like official digital ID
- Clean, institutional design
- Cryptographic trust indicators
- Status immediately visible

### 9.2 Registration Flow

**Key Generation Security:**
- Private key shown exactly once
- Clear download/copy options
- Mandatory acknowledgment checkbox
- Never logged or stored on server

**Form Progression:**
- Clear step indicators
- Validation at each step
- Ability to go back
- Success confirmation with Agent ID

### 9.3 Developer Experience Emphasis

**Code Examples:**
- Realistic SDK usage
- Syntax highlighting
- Language switching (TypeScript/Python)
- Copy-to-clipboard functionality

**Integration Guides:**
- Clear steps for platform integration
- API endpoint documentation
- Authentication flow diagrams
- Error handling examples

---

**Last Updated:** November 2026  
**Design System Version:** 1.0  
**Applied to:** Descript Agent Identity Platform
