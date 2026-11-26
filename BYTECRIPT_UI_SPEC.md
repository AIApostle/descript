# Bytecript Digital Identity Card — UI Specification

**Version:** 0.1  
**Status:** Design Specification  
**Component:** Bytecript Display Module  
**Purpose:** Define visual design, layout, interactions, and accessibility for the Bytecript digital identity card UI  

---

## 1. Overview

The **Bytecript** is the hero component of the Descript platform — a beautiful, institutional-grade digital identity card that agents view and share to prove their identity.

**Design Principles:**
- **Institutional Trust** — Looks like a government ID or digital passport, not a consumer app
- **Cryptographic Clarity** — Displays verification status, fingerprints, and cryptographic proofs clearly
- **Responsive** — Works on desktop, tablet, and mobile devices
- **Print-Friendly** — Can be printed or exported as PDF
- **Dark Mode Native** — Supports light and dark themes seamlessly
- **Accessibility First** — WCAG 2.1 AA compliant, keyboard navigable

---

## 2. Bytecript Card Anatomy

### 2.1 Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════════╗ │
│  ║                    BYTECRIPT                            ║ │
│  ║              Digital Identity Card                      ║ │
│  ║                                                          ║ │
│  ║  ┌──────────────────────────────────────────────────┐  ║ │
│  ║  │ ✓ VERIFIED & ACTIVE                              │  ║ │
│  ║  └──────────────────────────────────────────────────┘  ║ │
│  ║                                                          ║ │
│  ║  Agent Name                                             ║ │
│  ║  AI Integration Agent                                   ║ │
│  ║                                                          ║ │
│  ║  Agent ID                                               ║ │
│  ║  agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6 │  ║ │
│  ║                                                          ║ │
│  ║  ─────────────────────────────────────────────────┐    ║ │
│  ║                                                          ║ │
│  ║  Byte Network      │  Residence       │  Status       ║ │
│  ║  kiroween          │  kiroween-res    │  🟢 Active    ║ │
│  ║                                                          ║ │
│  ║  ─────────────────────────────────────────────────┐    ║ │
│  ║                                                          ║ │
│  ║  Public Key Fingerprint                                ║ │
│  ║  ed25519 | SHA256                                      ║ │
│  ║  3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f                  ║ │
│  ║  7e6d5c4b 3a2f1e0d 9c8b7a69 5f4e3d2c                  ║ │
│  ║                                                          ║ │
│  ║  ─────────────────────────────────────────────────┐    ║ │
│  ║                                                          ║ │
│  ║  Issued: 2026-11-22 at 14:30 UTC                       ║ │
│  ║  Version: 1 | Controller Verified                      ║ │
│  ║                                                          ║ │
│  ║  🔐 Cryptographically Signed & Verified                ║ │
│  ║                                                          ║ │
│  ╚════════════════════════════════════════════════════════╝ │
│                                                              │
│  [EXPORT AS JSON]  [SHARE LINK]  [VERIFY SIGNATURE]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Card Dimensions & Spacing

| Dimension | Value | Notes |
| :--- | :--- | :--- |
| **Card Width** | 640px (desktop) | Scales responsively on tablet/mobile |
| **Card Aspect Ratio** | 16:10 | Standard credential card ratio |
| **Padding** | 48px | Internal spacing from border |
| **Line Height** | 1.6 | Readable text spacing |
| **Border Radius** | 16px | Modern card appearance |
| **Border Width** | 2px | Visible boundary, not too heavy |
| **Shadow** | 0 20px 40px rgba(0,0,0,0.15) | Subtle depth in light mode |

---

## 3. Color Palette & Theme Support

### 3.1 Light Mode (Default)

| Element | Color | RGB/Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Card Background** | White | `#FFFFFF` | Main card body |
| **Card Border** | Light Gray | `#E5E7EB` | Card outline |
| **Text Primary** | Dark Charcoal | `#1F2937` | Headings, labels |
| **Text Secondary** | Gray | `#6B7280` | Secondary info |
| **Status Active** | Emerald Green | `#10B981` | Active status badge |
| **Status Suspended** | Amber Yellow | `#F59E0B` | Suspended badge |
| **Status Revoked** | Crimson Red | `#EF4444` | Revoked badge |
| **Accent Border** | Blue | `#3B82F6` | Divider lines, accents |
| **Verification Seal** | Gold | `#F59E0B` | Checkmark, verified badge |

### 3.2 Dark Mode

| Element | Color | RGB/Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Card Background** | Slate 900 | `#0F172A` | Main card body |
| **Card Border** | Slate 700 | `#334155` | Card outline |
| **Text Primary** | White | `#FFFFFF` | Headings, labels |
| **Text Secondary** | Slate 400 | `#94A3B8` | Secondary info |
| **Status Active** | Emerald 400 | `#4ADE80` | Active status badge |
| **Status Suspended** | Amber 400 | `#FACC15` | Suspended badge |
| **Status Revoked** | Rose 400 | `#FB7185` | Revoked badge |
| **Accent Border** | Blue 400 | `#60A5FA` | Divider lines |
| **Verification Seal** | Amber 300 | `#FCD34D` | Verification indicator |

---

## 4. Typography & Font Stack

### 4.1 Font Selection

| Usage | Font | Weight | Size | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Card Title** | SF Pro Display / Inter | 700 Bold | 32px | 1.2 |
| **Card Subtitle** | SF Pro Display / Inter | 500 Medium | 14px | 1.4 |
| **Agent Name** | SF Pro Display / Inter | 600 SemiBold | 24px | 1.3 |
| **Section Labels** | SF Pro Display / Inter | 500 Medium | 12px | 1.4 |
| **Body Text** | SF Pro Text / Inter | 400 Regular | 14px | 1.6 |
| **Fingerprint (Monospace)** | SF Mono / JetBrains Mono / Courier | 400 Regular | 12px | 1.8 |
| **Metadata (Small)** | SF Pro Text / Inter | 400 Regular | 11px | 1.5 |

### 4.2 Font Stack (CSS)
```css
/* Display Font */
--font-display: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Text Font */
--font-text: 'SF Pro Text', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace Font (for crypto hashes) */
--font-mono: 'SF Mono', 'JetBrains Mono', 'Courier New', monospace;
```

---

## 5. Card Sections Breakdown

### 5.1 Header Section
**Purpose:** Immediate verification indicator and title

```
┌────────────────────────────────────┐
│  ✓ VERIFIED & ACTIVE               │  ← Status badge (color-coded)
│                                     │
│  BYTECRIPT                          │  ← Card title (32px, bold)
│  Digital Identity Card              │  ← Subtitle (14px, medium)
└────────────────────────────────────┘
```

**Elements:**
- **Status Badge**: Top-left, color-coded (green=active, yellow=suspended, red=revoked)
- **Card Title**: "BYTECRIPT" in large, bold font
- **Subtitle**: "Digital Identity Card" in smaller, muted text

**Accessibility:**
- Status is both icon AND text (no icon-only indicators)
- Color not the only differentiator (text description present)

---

### 5.2 Identity Section
**Purpose:** Show agent's human-readable identity

```
┌────────────────────────────────────┐
│ Agent Name                          │  ← Label (11px, small)
│ AI Integration Agent                │  ← Agent name (24px, semibold)
└────────────────────────────────────┘
```

**Elements:**
- **Agent Name Label**: "Agent Name" (small, secondary text)
- **Agent Name Value**: Large, readable name field
- **Description** (optional): If provided, show below name in secondary text

---

### 5.3 Agent ID Section
**Purpose:** Display unique identifier clearly

```
┌────────────────────────────────────┐
│ Agent ID                            │  ← Label
│ agent_01h8x7xt8x92y4b3c5d6e7f8g9h0 │  ← ID (monospace, copyable)
│                                     │
│ [COPY TO CLIPBOARD]                 │  ← Button on hover
└────────────────────────────────────┘
```

**Elements:**
- **ID Label**: "Agent ID" (small, secondary)
- **ID Value**: Monospace font, full ID visible or truncated with expand option
- **Copy Button**: Appears on hover, copies entire ID
- **Visual Treatment**: Slight background tint to distinguish from other fields

---

### 5.4 Network & Status Section
**Purpose:** Show Byte Network residence and current status

```
┌────────────────────────────────────┐
│ Byte Network  │  Residence   │ Status     │
│ kiroween      │  kiroween-r  │ 🟢 Active  │
└────────────────────────────────────┘
```

**Elements:**
- **Three Columns:**
  1. **Byte Network** — Name of the network (e.g., "kiroween")
  2. **Residence** — Residence identifier (e.g., "kiroween-residence")
  3. **Status** — Current lifecycle status with color indicator
     - 🟢 Green checkmark = Active
     - 🟡 Yellow circle = Pending / Suspended
     - 🔴 Red X = Revoked / Compromised
- **Horizontal Divider** — Line separating this from next section

---

### 5.5 Cryptography Section
**Purpose:** Display public key fingerprint for verification

```
┌────────────────────────────────────┐
│ Public Key Fingerprint             │  ← Label
│ ed25519 | SHA256                   │  ← Algorithm info
│                                     │
│ 3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f │  ← Fingerprint (monospace)
│ 7e6d5c4b 3a2f1e0d 9c8b7a69 5f4e3d2c │     in 4-byte chunks
│                                     │
│ [COPY FINGERPRINT]  [VIEW FULL KEY] │  ← Actions
└────────────────────────────────────┘
```

**Elements:**
- **Label**: "Public Key Fingerprint"
- **Algorithm**: "ed25519 | SHA256" (show crypto algorithm and hash method)
- **Fingerprint Display**: 
  - Monospace font, large enough to read
  - Break into 4-byte chunks with spaces for readability
  - Total ~64 hex characters (256-bit SHA256)
- **Copy Button**: Copy entire fingerprint
- **View Full Key**: Link to expanded view showing full base64-encoded public key

---

### 5.6 Metadata Section
**Purpose:** Show issuance date, version, and verification status

```
┌────────────────────────────────────┐
│ Issued: 2026-11-22 at 14:30 UTC    │
│ Version: 1 | Controller Verified   │
│                                     │
│ 🔐 Cryptographically Signed        │  ← Verification statement
└────────────────────────────────────┘
```

**Elements:**
- **Issuance Date**: ISO 8601 format with timezone
- **Version**: Credential version number
- **Verification Status**: "Controller Verified" or similar status
- **Security Statement**: "🔐 Cryptographically Signed & Verified"

---

### 5.7 Action Buttons Section
**Purpose:** Provide export, share, and verification actions

```
┌────────────────────────────────────┐
│ [EXPORT AS JSON]                   │
│ [SHARE PUBLIC LINK]                │
│ [VERIFY SIGNATURE]                 │
└────────────────────────────────────┘
```

**Buttons:**

| Button | Action | Output |
| :--- | :--- | :--- |
| **Export as JSON** | Download Bytecript | JSON file with all credential data |
| **Share Public Link** | Generate shareable URL | Link to public agent profile |
| **Verify Signature** | Check cryptographic signature | Modal showing verification result |

**Button Styling:**
- **Primary Action** (Export): Solid color, prominent
- **Secondary Actions** (Share, Verify): Outline style
- **Hover State**: Slight background change, slight lift shadow
- **Active State**: Pressed appearance
- **Disabled State**: Grayed out if action not available

---

## 6. Responsive Behavior

### 6.1 Desktop (1024px+)
- Card width: 640px, centered on page
- All sections visible, full layout
- Fingerprint shown in 2 rows of 4 chunks each
- Three-column status section displays horizontally

### 6.2 Tablet (768px - 1023px)
- Card width: 90% of viewport, max 640px
- All sections stack, remains readable
- Fingerprint shown in 2 rows
- Status section may wrap to 2 rows on smaller tablets

### 6.3 Mobile (< 768px)
- Card width: 100% with padding (16px on each side)
- All sections stack vertically
- Fingerprint shown in 4 rows of 2 chunks each
- Status section stacks into 3 rows
- Buttons full-width on mobile

**Media Query Breakpoints:**
```css
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px) { /* Mobile */ }
```

---

## 7. Interactive States & Animations

### 7.1 Hover Effects
- **Copy buttons**: Slight scale increase (1.05x), color highlight
- **Export/Share buttons**: Background color change, subtle shadow increase
- **Fingerprint text**: Highlight with background color, indicate copyability

### 7.2 Click/Active States
- **Buttons**: Pressed appearance (inset shadow, slight scale down 0.98x)
- **Copy actions**: Feedback message "Copied!" appears for 2 seconds
- **Status badge**: May glow with subtle animation if in alert state (suspended/compromised)

### 7.3 Animations
- **Card Load**: Subtle fade-in over 300ms, slight slide-up animation
- **Copy Feedback**: Toast notification slides in from top-right, stays 2 seconds
- **Status Badge**: Gentle pulse animation if suspended/compromised (3-4 second cycle)

### 7.4 Transitions
```css
/* All state changes animated smoothly */
transition: background-color 200ms ease, 
            box-shadow 200ms ease, 
            transform 200ms ease;
```

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Color Contrast
- **Text on background**: Minimum 4.5:1 ratio (normal text), 3:1 (large text)
- **Status indicators**: Color + text/icon (never color alone)
- **Verified seals**: Clear visual and text indicators

### 8.2 Keyboard Navigation
- **Tab order**: Top to bottom, all interactive elements
  1. Export button
  2. Share button
  3. Verify button
  4. Copy Agent ID
  5. Copy Fingerprint
  6. View Full Key
- **Focus indicator**: 2px solid outline in contrasting color
- **Enter key**: Activates focused button
- **Escape key**: Closes any open modals

### 8.3 Screen Reader Support
```html
<!-- Status badge -->
<div aria-label="Status: Active, verified and in good standing">
  🟢 Active
</div>

<!-- Copy button -->
<button aria-label="Copy Agent ID to clipboard">
  [COPY]
</button>

<!-- Full card -->
<section aria-label="Bytecript Digital Identity Card">
  <!-- content -->
</section>
```

### 8.4 Text Alternatives
- All icons have alt text or aria-labels
- Status badges have text descriptions, not just colors
- Charts/visualizations have textual equivalents

### 8.5 Font Sizing
- Minimum 14px for body text
- Minimum 12px for secondary text
- Monospace fingerprints: 12px with 1.8 line-height for readability

---

## 9. Print & Export Functionality

### 9.1 Print Stylesheet
When printed or exported to PDF:
- Card displays at standard document width (6.5" x 4.1")
- Colors preserved (or convert to grayscale-friendly)
- Monospace fingerprints remain readable
- No interactive elements needed
- Page breaks handled gracefully

```css
@media print {
  .bytecript-card {
    width: 6.5in;
    height: 4.1in;
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #000;
  }
}
```

### 9.2 Export as JSON
When "Export as JSON" is clicked:
```json
{
  "type": "Bytecript",
  "version": 1,
  "agentId": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0",
  "agentName": "AI Integration Agent",
  "byteNetwork": "kiroween",
  "residence": "kiroween-residence",
  "status": "active",
  "credentials": [
    {
      "algorithm": "ed25519",
      "publicKeyFingerprint": "3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c",
      "publicKey": "base64-encoded-key-here"
    }
  ],
  "issuedAt": "2026-11-22T14:30:00Z",
  "controllerVerified": true,
  "signature": "hex-encoded-signature-here"
}
```

### 9.3 Public Share Link
URL format: `https://descript.app/agent/{agentId}`

Shows:
- Read-only Bytecript card
- Public metadata only
- Verification status
- Link to verify signature

---

## 10. Dark Mode Implementation

### 10.1 System Preference Detection
```typescript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Allow manual toggle
const [isDarkMode, setIsDarkMode] = useState(prefersDark);
```

### 10.2 Dark Mode Styles
- Background: Slate 900 (`#0F172A`)
- Text: White or Slate 100
- Borders: Slate 700
- Shadows: Adjusted for dark background (reduced opacity)
- Status badges: Slightly lighter greens/reds for contrast

### 10.3 Toggle Control
- User can override system preference
- Setting persists in localStorage
- Smooth transition between light/dark (200ms)

---

## 11. Error & Loading States

### 11.1 Loading State
- Skeleton loader showing card shape
- Subtle pulsing animation
- "Loading credential..." message

### 11.2 Error State
- Red border on card
- Error icon and message
- "Retry" button
- Error details in expandable section (for debugging)

### 11.3 Credential Invalid / Expired
- Yellow/red background tint
- Clear warning message
- Explanation of what's invalid
- Action button (e.g., "Request New Credential")

---

## 12. Component Composition

### 12.1 Bytecript Card Component Structure
```
<BytecriptCard>
  ├── <CardHeader>
  │   ├── <StatusBadge>
  │   ├── <CardTitle>
  │   └── <CardSubtitle>
  ├── <CardBody>
  │   ├── <IdentitySection>
  │   │   ├── <AgentNameField>
  │   │   └── <AgentDescriptionField>
  │   ├── <AgentIDSection>
  │   │   ├── <IDDisplay>
  │   │   └── <CopyButton>
  │   ├── <NetworkStatusSection>
  │   │   ├── <NetworkField>
  │   │   ├── <ResidenceField>
  │   │   └── <StatusField>
  │   ├── <CryptoSection>
  │   │   ├── <FingerprintDisplay>
  │   │   ├── <CopyFingerprintButton>
  │   │   └── <ViewFullKeyButton>
  │   └── <MetadataSection>
  │       ├── <IssuanceDateField>
  │       ├── <VersionField>
  │       └── <VerificationIndicator>
  └── <CardActions>
      ├── <ExportButton>
      ├── <ShareButton>
      └── <VerifyButton>
```

---

## 13. Design System Tokens

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--spacing-base` | 8px | Fundamental unit |
| `--spacing-2x` | 16px | Padding, gaps |
| `--spacing-3x` | 24px | Section spacing |
| `--spacing-6x` | 48px | Card padding |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 16px | Card border |
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.1) | Subtle elements |
| `--shadow-md` | 0 10px 20px rgba(0,0,0,0.1) | Card shadows |
| `--shadow-lg` | 0 20px 40px rgba(0,0,0,0.15) | Floating elements |
| `--transition-fast` | 150ms | Micro-interactions |
| `--transition-base` | 200ms | Standard transitions |
| `--transition-slow` | 300ms | Entrance animations |

---

## 14. Copy Text / Microcopy

| Action | Feedback | Icon | Tone |
| :--- | :--- | :--- | :--- |
| **Copy Agent ID** | "Copied to clipboard" | ✓ | Confirmation |
| **Copy Fingerprint** | "Fingerprint copied" | ✓ | Confirmation |
| **Export JSON** | "Downloading..." → "Saved to Downloads" | ⬇ | Informative |
| **Share** | "Link copied to clipboard" | ✓ | Confirmation |
| **Verify Signature** | "Signature verified ✓" or "Signature invalid ✗" | ✓/✗ | Clear |
| **Status: Active** | "Active and verified" | — | Neutral |
| **Status: Suspended** | "Suspended - credential temporarily disabled" | — | Alert |
| **Status: Revoked** | "Revoked - credential no longer valid" | — | Error |

---

## 15. Acceptance Criteria

- [ ] Card displays centered on page with proper dimensions
- [ ] All text sections render with correct typography and sizing
- [ ] Status badge shows correct color and icon for each status
- [ ] Fingerprint displays in readable monospace font with 4-byte chunks
- [ ] All buttons are clickable and provide feedback
- [ ] Copy functions work (Agent ID, fingerprint, export)
- [ ] Dark mode toggle switches theme smoothly
- [ ] Responsive design works on 320px, 768px, 1024px viewports
- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] Screen reader announces all content correctly
- [ ] Print layout shows card at standard credential dimensions
- [ ] Export JSON produces valid, structured credential object
- [ ] Loading state shows skeleton/spinner
- [ ] Error state displays clearly with retry option
- [ ] Animations are smooth and performant (<60fps)

---

## 16. Design Files & Assets

**Design Tool:** Figma / Sketch  
**Export Formats:** SVG, PNG (2x), CSS variables  

**Assets Needed:**
- [ ] Bytecript card component (desktop)
- [ ] Bytecript card (tablet responsive)
- [ ] Bytecript card (mobile responsive)
- [ ] Status badge icons (active, pending, suspended, revoked, compromised)
- [ ] Verification seal icon
- [ ] Copy icon (for buttons)
- [ ] Export icon
- [ ] Share icon
- [ ] Verify icon
- [ ] Dark mode variants of all above

---

## 17. Implementation Notes for Developers

### 17.1 Component Props
```typescript
interface BytecriptCardProps {
  agent: Agent;
  credential: Credential;
  isLoading?: boolean;
  error?: Error;
  onExport?: () => void;
  onShare?: () => void;
  onVerify?: () => void;
  isDarkMode?: boolean;
  locale?: string; // For i18n
}
```

### 17.2 CSS Architecture
- Use CSS Custom Properties (variables) for colors and spacing
- Utility-first approach (TailwindCSS) for rapid development
- BEM naming for custom components
- Dark mode via media query + class toggle

### 17.3 Animations
- Use CSS transitions for state changes
- Use React Spring or Framer Motion for complex entrance animations
- Ensure animations respect `prefers-reduced-motion`

---

## 18. Next Steps

1. ✅ Finalize color palette and typography
2. 📋 Create high-fidelity mockups in Figma
3. 📋 Implement React component
4. 📋 Add copy/export functionality
5. 📋 Implement dark mode
6. 📋 Accessibility audit
7. 📋 Performance testing
8. 📋 User testing

---

**Document Prepared:** November 2026  
**Specification Version:** 0.1  
**Last Updated:** 2026-11-22
