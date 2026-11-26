# Component Architecture & Design System — Descript Frontend

**Version:** 0.1  
**Status:** Technical Architecture  
**Purpose:** Define React component hierarchy, design system tokens, styling approach, and component composition patterns  

---

## 1. Overview

The Descript frontend is built as a **component-based system** using React 19 with TypeScript. Components are organized in a clear hierarchy, from low-level UI primitives to high-level feature modules.

**Design Philosophy:**
- **Composability** — Small, single-purpose components combine into larger features
- **Reusability** — Common patterns (buttons, inputs, cards) used everywhere
- **Type Safety** — Full TypeScript coverage for props and state
- **Accessibility First** — WCAG 2.1 AA compliance in every component
- **Themeable** — Dark/light mode support via CSS variables
- **Performance** — Lazy loading, code splitting, memoization where needed

---

## 2. Project Structure

```
public/app/src/
├── components/
│   ├── ui/                          # Primitive UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── TextField.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── Toast.tsx
│   │   ├── Spinner.tsx
│   │   └── Icon.tsx
│   │
│   ├── layout/                      # Layout & page structure
│   │   ├── MainLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   │
│   ├── auth/                        # Authentication components
│   │   ├── AuthGuard.tsx
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── SessionHandler.tsx
│   │
│   ├── agent/                       # Agent-specific components
│   │   ├── AgentRegistrationForm.tsx
│   │   ├── AgentList.tsx
│   │   ├── AgentCard.tsx
│   │   ├── AgentProfile.tsx
│   │   ├── KeypairSetupChoices.tsx
│   │   ├── KeyGenerationForm.tsx
│   │   ├── KeyImportForm.tsx
│   │   └── CredentialList.tsx
│   │
│   ├── bytecript/                   # Bytecript digital card
│   │   ├── BytecriptCard.tsx
│   │   ├── BytecriptHeader.tsx
│   │   ├── BytecriptIdentity.tsx
│   │   ├── BytecriptCrypto.tsx
│   │   ├── BytecriptMetadata.tsx
│   │   ├── BytecriptActions.tsx
│   │   ├── StatusBadge.tsx
│   │   └── VerificationSeal.tsx
│   │
│   ├── forms/                       # Form components & hooks
│   │   ├── FormGroup.tsx
│   │   ├── FieldError.tsx
│   │   ├── useFormValidation.ts
│   │   └── validators.ts
│   │
│   └── common/                      # Shared components
│       ├── CopyButton.tsx
│       ├── LoadingState.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfirmDialog.tsx
│       └── NotFoundPage.tsx
│
├── pages/                           # Page components (route targets)
│   ├── Dashboard.tsx
│   ├── RegisterAgent.tsx
│   ├── AgentProfile.tsx
│   ├── NotFound.tsx
│   └── Error.tsx
│
├── hooks/                           # Custom React hooks
│   ├── useAgent.ts
│   ├── useKeyGeneration.ts
│   ├── useCrypto.ts
│   ├── useLocalStorage.ts
│   ├── useTheme.ts
│   ├── useFetch.ts
│   └── useDebounce.ts
│
├── services/                        # API & business logic
│   ├── api.ts                       # API client
│   ├── agentService.ts
│   ├── cryptoService.ts
│   ├── storageService.ts
│   └── errorHandler.ts
│
├── context/                         # React Context
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── AgentContext.tsx
│   └── NotificationContext.tsx
│
├── types/                           # TypeScript interfaces
│   ├── agent.ts
│   ├── credential.ts
│   ├── bytecript.ts
│   ├── api.ts
│   └── ui.ts
│
├── styles/                          # Global styles & design tokens
│   ├── index.css
│   ├── tailwind.config.js
│   ├── tokens.css
│   ├── typography.css
│   └── animations.css
│
├── utils/                           # Utility functions
│   ├── formatting.ts
│   ├── validation.ts
│   ├── crypto.ts
│   ├── download.ts
│   └── clipboard.ts
│
├── constants/                       # App constants
│   ├── api.ts
│   ├── routes.ts
│   ├── messages.ts
│   └── config.ts
│
├── App.tsx                          # Root component
├── main.tsx                         # Entry point
└── index.css                        # Global styles
```

---

## 3. Component Hierarchy

### 3.1 UI Primitives (Layer 1)

**Purpose:** Low-level, reusable UI elements

```
Button.tsx
├── Props: label, onClick, variant, size, disabled, icon, loading
├── Variants: primary | secondary | outline | ghost | danger
├── Sizes: sm | md | lg
└── Example: <Button variant="primary" size="md">Submit</Button>

Input.tsx
├── Props: type, placeholder, value, onChange, error, icon, disabled
├── Types: text | email | password | number | url
├── Example: <Input type="email" placeholder="name@example.com" />

Card.tsx
├── Props: title, children, footer, className, bordered
├── Example: <Card title="Agent Details">{content}</Card>

Modal.tsx
├── Props: isOpen, onClose, title, children, footer, size
├── Sizes: sm | md | lg | xl
└── Example: <Modal isOpen={true} title="Confirm">Content</Modal>

Badge.tsx
├── Props: label, variant, icon, size
├── Variants: success | warning | error | info | neutral
└── Example: <Badge variant="success" label="Active" />

TextField.tsx
├── Props: label, required, error, hint, value, onChange
└── Combines Input + Label + Error + Hint

Select.tsx
├── Props: options, value, onChange, placeholder, disabled
└── Example: <Select options={networks} />

Checkbox.tsx
├── Props: label, checked, onChange, disabled
└── Example: <Checkbox label="I agree" />

RadioGroup.tsx
├── Props: options, value, onChange, name
└── Example: <RadioGroup options={choices} />

Toast.tsx
├── Props: message, type, duration, onClose
├── Types: success | error | warning | info
└── Used via context hook: useToast()

Spinner.tsx
├── Props: size, variant
├── Sizes: sm | md | lg
└── Example: <Spinner size="md" />

Icon.tsx
├── Props: name, size, color, className
├── Names: check, x, arrow, etc. (SVG based)
└── Example: <Icon name="check" size={24} />
```

---

### 3.2 Layout Components (Layer 2)

**Purpose:** Page structure and common layouts

```
MainLayout.tsx
├── Structure: Header + Main Content
├── Props: children, title, description
└── Used for: Public pages

DashboardLayout.tsx
├── Structure: Sidebar + Header + Main Content
├── Props: children
├── State: Sidebar open/closed
└── Used for: Authenticated pages

Header.tsx
├── Logo
├── Navigation Links
├── User Menu (Profile, Settings, Logout)
└── Theme Toggle

Sidebar.tsx
├── Navigation Menu
├── Agent List (if authenticated)
├── Collapsible on mobile
└── Active route highlighting

Navigation.tsx
├── Router setup (React Router v6)
├── Route guards (AuthGuard)
├── Lazy loading per route
└── 404 handling
```

---

### 3.3 Authentication Components (Layer 3)

**Purpose:** Login, signup, and session management

```
AuthGuard.tsx
├── Props: children, requiredRole?
├── Redirects to login if not authenticated
├── Protects routes

LoginForm.tsx
├── Fields: Email, Password
├── Validation: Real-time
├── Error handling: Network, credentials
├── Submission: POST /api/v1/auth/login
└── On success: Store token, redirect

SignupForm.tsx
├── Fields: Email, Password, Confirm Password
├── Validation: Password strength
├── CAPTCHA: Optional (future)
└── Submission: POST /api/v1/auth/signup

SessionHandler.tsx
├── Monitors token expiration
├── Auto-refresh before expiry
├── Handle logout/timeout
└── Provides session context
```

---

### 3.4 Agent Components (Layer 4)

**Purpose:** Agent registration, management, and display

```
AgentRegistrationForm.tsx (Master component)
├── Step 1: Agent Details
│   ├── Input: Name, Description, Network, Type
│   ├── Validation: Real-time
│   └── Next: Go to Step 2
│
├── Step 2: Keypair Setup Choice
│   ├── Option A: Generate New
│   ├── Option B: Import Existing
│   └── Navigate based on choice
│
├── Step 3a: Key Generation (if option A)
│   ├── Button: Generate Keypair
│   ├── Display: Private Key (once)
│   ├── Actions: Copy, Download
│   ├── Checkbox: "I have saved key"
│   └── Validation: Checkbox must be checked
│
├── Step 3b: Key Import (if option B)
│   ├── TextArea: Paste public key
│   ├── Button: Validate Key
│   ├── Display: Algorithm, Fingerprint
│   └── Validation: Key format
│
├── Step 4: Confirmation
│   ├── Display: Agent ID, Status
│   ├── Copy: Agent ID button
│   └── Navigation: View Bytecript or Done
│
└── State management: useState for current step

AgentList.tsx
├── Table or Grid of agents
├── Columns: ID, Name, Network, Status, Actions
├── Actions: View, Edit, Suspend, Delete
├── Sorting & filtering
└── Pagination (if many agents)

AgentCard.tsx
├── Compact display of single agent
├── Shows: Name, Status, Network, Created Date
├── Click: Navigate to profile

AgentProfile.tsx (Layout for agent details)
├── Bytecript Card (hero)
├── Credentials section
├── Settings section
├── Activity log section
└── Action buttons

KeypairSetupChoices.tsx
├── Two radio card options
├── Option 1: Generate New (recommended badge)
├── Option 2: Import Existing
├── Description for each
└── Selection handling

KeyGenerationForm.tsx
├── Generate button
├── Display generated keys
├── Warning messages
├── Copy/Download buttons
└── Acknowledgment checkbox

KeyImportForm.tsx
├── TextArea for key paste
├── Format examples
├── Validate button
├── Display detected algorithm
└── Error handling

CredentialList.tsx
├── Table of credentials
├── Columns: Algorithm, Fingerprint, Status, Created, Actions
├── Actions: Copy, View Full, Revoke
└── Add new credential button
```

---

### 3.5 Bytecript Components (Layer 5)

**Purpose:** Digital identity card display and interactions

```
BytecriptCard.tsx (Main component)
├── Props: agent, credential, isLoading, error
├── Renders full card with all sections
├── Handles export/share/verify actions
└── Responsive to viewport size

BytecriptHeader.tsx
├── Status badge (color, text, icon)
├── Title: "BYTECRIPT"
├── Subtitle: "Digital Identity Card"
└── Responsive typography

BytecriptIdentity.tsx
├── Agent Name display
├── Agent Description (if available)
└── Prominent, readable text

BytecriptAgentID.tsx
├── Agent ID in monospace
├── Copy button on hover
├── Copyable to clipboard
└── Visual distinction

BytecriptNetworkStatus.tsx
├── Three columns: Network, Residence, Status
├── Color-coded status
├── Status pill (🟢 Active, etc.)
└── Responsive to mobile

BytecriptCrypto.tsx
├── Algorithm display (Ed25519)
├── Public key fingerprint (4-byte chunks)
├── Monospace font
├── Copy fingerprint button
├── View full key link

BytecriptMetadata.tsx
├── Issuance date & time
├── Version number
├── Controller verified status
├── Verification statement
└── Security seal icon

BytecriptActions.tsx
├── Export as JSON button
├── Share profile link button
├── Verify signature button
└── Edit agent button

StatusBadge.tsx
├── Props: status
├── Colors: active (green), pending (yellow), revoked (red), etc.
├── Icon representation
├── Text label
└── Example: <StatusBadge status="active" />

VerificationSeal.tsx
├── 🔐 Icon with text
├── "Cryptographically Signed & Verified"
├── Positioned at bottom of card
└── Accessibility-aware
```

---

### 3.6 Form Components (Layer 6)

**Purpose:** Form building blocks and validation

```
FormGroup.tsx
├── Props: label, required, hint, error, children
├── Combines label + input + hint + error
└── Consistent spacing

FieldError.tsx
├── Props: error
├── Displays validation error message
├── Red color, icon indicator
└── Visible only if error exists

useFormValidation.ts (Custom hook)
├── Manages form state
├── Validation functions
├── Error tracking per field
├── Real-time or on-blur validation
├── Example: useFormValidation(initialValues, validateFn)
└── Returns: values, errors, isValid, setFieldValue, setFieldError

validators.ts
├── agentNameValidator()
├── emailValidator()
├── publicKeyValidator()
├── networkValidator()
├── passwordValidator()
└── Custom validation rules
```

---

### 3.7 Common/Shared Components (Layer 7)

**Purpose:** Utilities and cross-cutting concerns

```
CopyButton.tsx
├── Props: text, label
├── Copy on click
├── Show "Copied!" feedback
└── Example: <CopyButton text={agentID} label="Copy ID" />

LoadingState.tsx
├── Props: isLoading, error, children
├── Shows spinner while loading
├── Shows error if failed
├── Shows content if loaded

ErrorBoundary.tsx
├── Catches React errors
├── Displays fallback UI
├── Logs to error service
└── Prevents full page crash

ConfirmDialog.tsx
├── Props: isOpen, title, message, onConfirm, onCancel
├── Two action buttons
├── Modal overlay
└── Example: <ConfirmDialog title="Delete?" />

NotFoundPage.tsx
├── 404 error page
├── Link back to dashboard
└── Helpful messaging
```

---

## 4. Design System Tokens

### 4.1 Color Tokens

```css
/* Primary Brand Colors */
--color-primary: #3B82F6;          /* Blue */
--color-primary-dark: #1E40AF;
--color-primary-light: #DBEAFE;

/* Status Colors */
--color-success: #10B981;          /* Green - Active */
--color-warning: #F59E0B;          /* Amber - Pending/Suspended */
--color-danger: #EF4444;           /* Red - Revoked/Error */
--color-info: #06B6D4;             /* Cyan - Info */

/* Neutral Colors */
--color-bg-primary: #FFFFFF;       /* Light mode background */
--color-bg-secondary: #F3F4F6;
--color-bg-tertiary: #E5E7EB;

--color-text-primary: #1F2937;     /* Dark gray - Main text */
--color-text-secondary: #6B7280;   /* Medium gray - Secondary text */
--color-text-tertiary: #9CA3AF;    /* Light gray - Tertiary text */

--color-border: #E5E7EB;
--color-border-light: #F3F4F6;

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  --color-bg-primary: #0F172A;
  --color-bg-secondary: #1E293B;
  --color-bg-tertiary: #334155;
  
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #94A3B8;
  --color-text-tertiary: #64748B;
  
  --color-border: #334155;
  --color-border-light: #1E293B;
}
```

### 4.2 Typography Tokens

```css
/* Font Stack */
--font-display: 'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-text: 'SF Pro Text', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Courier New', monospace;

/* Heading Sizes */
--text-h1: 32px, 700, 1.2;
--text-h2: 28px, 600, 1.3;
--text-h3: 24px, 600, 1.3;
--text-h4: 20px, 600, 1.4;

/* Body Text */
--text-body-lg: 16px, 400, 1.6;
--text-body-md: 14px, 400, 1.6;
--text-body-sm: 12px, 400, 1.5;

/* Monospace (for crypto data) */
--text-mono-lg: 14px, 400, 1.8;
--text-mono-md: 12px, 400, 1.8;
--text-mono-sm: 11px, 400, 1.8;
```

### 4.3 Spacing Tokens

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;

/* Padding/Margin shortcuts */
--p-card: var(--spacing-2xl);      /* 48px */
--p-section: var(--spacing-lg);    /* 24px */
--p-input: var(--spacing-md);      /* 16px */
--gap-form: var(--spacing-md);     /* 16px between form fields */
--gap-section: var(--spacing-lg);  /* 24px between sections */
```

### 4.4 Border Radius Tokens

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 9999px;

/* Component usage */
--radius-button: var(--radius-sm);
--radius-input: var(--radius-md);
--radius-card: var(--radius-lg);
--radius-modal: var(--radius-lg);
```

### 4.5 Shadow Tokens

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);

/* Dark mode shadows (reduced opacity) */
@media (prefers-color-scheme: dark) {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
}
```

### 4.6 Animation Tokens

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

--easing-in: cubic-bezier(0.4, 0, 1, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 5. Context API Structure

### 5.1 AuthContext
```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
}

// Usage: const { user, login } = useAuth();
```

### 5.2 ThemeContext
```typescript
interface ThemeContext {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  prefersDark: boolean;
}

// Usage: const { theme, toggleTheme } = useTheme();
```

### 5.3 AgentContext
```typescript
interface AgentContext {
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  selectAgent: (agentId: string) => void;
  refreshAgents: () => Promise<void>;
  createAgent: (data: AgentCreateDTO) => Promise<Agent>;
}

// Usage: const { agents, currentAgent, createAgent } = useAgents();
```

### 5.4 NotificationContext
```typescript
interface NotificationContext {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

// Usage: const { showToast } = useNotification();
```

---

## 6. Custom Hooks

### 6.1 useAgent
```typescript
const useAgent = (agentId: string) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch agent data
  }, [agentId]);

  return { agent, isLoading, error };
};
```

### 6.2 useKeyGeneration
```typescript
const useKeyGeneration = () => {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKeypair = async () => {
    // Generate Ed25519 keypair
    // Return { publicKey, privateKey }
  };

  return { keypair, isGenerating, generateKeypair };
};
```

### 6.3 useCrypto
```typescript
const useCrypto = () => {
  const validatePublicKey = (key: string): boolean => {
    // Validate public key format
  };

  const generateFingerprint = (publicKey: string): string => {
    // Generate SHA256 fingerprint
  };

  return { validatePublicKey, generateFingerprint };
};
```

### 6.4 useLocalStorage
```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Read from localStorage
  });

  return [storedValue, setStoredValue] as const;
};
```

### 6.5 useTheme
```typescript
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Detect system preference
  });

  const toggleTheme = () => {
    // Toggle theme and save preference
  };

  return { theme, toggleTheme };
};
```

---

## 7. Styling Approach

### 7.1 TailwindCSS Configuration
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color tokens
      },
      spacing: {
        // Custom spacing tokens
      },
      fontFamily: {
        display: ['SF Pro Display', 'Inter'],
        text: ['SF Pro Text', 'Inter'],
        mono: ['SF Mono', 'JetBrains Mono'],
      },
    },
  },
  plugins: [
    // Dark mode plugin
  ],
};
```

### 7.2 CSS Architecture
- **Global styles** in `index.css` (resets, base styles)
- **Design tokens** in `styles/tokens.css` (CSS variables)
- **Component styles** as Tailwind + CSS Modules per component
- **Animations** in `styles/animations.css`
- **Typography** in `styles/typography.css`

### 7.3 Example Component Styling
```tsx
// Button.tsx using Tailwind + CSS Modules

import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-text-primary hover:bg-secondary-light',
    outline: 'border border-primary text-primary hover:bg-primary-light',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 8. Type Definitions

### 8.1 Agent Types
```typescript
// types/agent.ts

export interface Agent {
  id: string;                        // agent_XXXXXXXXXX
  name: string;
  description?: string;
  byteNetwork: string;               // e.g., "kiroween"
  residence: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked' | 'compromised';
  createdAt: string;                 // ISO 8601
  updatedAt: string;
  publicMetadata?: Record<string, unknown>;
}

export interface AgentCreateDTO {
  name: string;
  description?: string;
  byteNetwork: string;
  publicKey: string;                 // Base64 or PEM
  agentType?: string;
  framework?: string;
}
```

### 8.2 Credential Types
```typescript
// types/credential.ts

export interface Credential {
  id: string;                        // cred_XXXXX
  algorithm: 'ed25519' | 'ecdsa';
  publicKey: string;                 // Base64
  fingerprint: string;               // SHA256 hex
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
}
```

### 8.3 Bytecript Types
```typescript
// types/bytecript.ts

export interface Bytecript {
  agentId: string;
  agentName: string;
  byteNetwork: string;
  residence: string;
  credentials: Array<{
    algorithm: string;
    publicKeyFingerprint: string;
  }>;
  status: string;
  issuedAt: string;
  version: number;
}
```

---

## 9. Performance Optimization Strategies

### 9.1 Code Splitting
```typescript
// routes.ts
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegisterAgent = lazy(() => import('./pages/RegisterAgent'));
const AgentProfile = lazy(() => import('./pages/AgentProfile'));

// Each page loads separately
```

### 9.2 Memoization
```typescript
// High-value memoization
export const BytecriptCard = React.memo(({ agent, credential }: Props) => {
  return (/* render */);
});

// Only re-render if agent or credential changes
```

### 9.3 Hook Optimization
```typescript
// useMemo for expensive computations
const fingerprint = useMemo(() => {
  return generateFingerprint(credential.publicKey);
}, [credential.publicKey]);

// useCallback for stable function references
const handleCopy = useCallback(() => {
  copyToClipboard(value);
}, [value]);
```

### 9.4 Bundle Size Targets
- **Total bundle:** < 200KB (gzipped)
- **Crypto library:** < 50KB (gzipped)
- **UI framework:** < 40KB (React + React DOM)
- **Utilities:** < 20KB

---

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 10.2 Integration Tests
```typescript
// AgentRegistration.integration.test.tsx
describe('Agent Registration Flow', () => {
  it('completes full registration with generated keys', async () => {
    render(<AgentRegistrationForm />);
    
    // Fill form
    userEvent.type(screen.getByLabelText('Agent Name'), 'Test Agent');
    userEvent.selectOption(screen.getByLabelText('Network'), 'kiroween');
    
    // Continue to keypair
    userEvent.click(screen.getByText('Continue'));
    
    // Generate keypair
    userEvent.click(screen.getByText('Generate Keypair'));
    
    // Check acknowledgment
    userEvent.click(screen.getByLabelText('I have saved my key'));
    
    // Submit
    userEvent.click(screen.getByText('Register'));
    
    // Assert success
    await waitFor(() => {
      expect(screen.getByText(/Agent Registered/i)).toBeInTheDocument();
    });
  });
});
```

---

## 11. Accessibility Implementation

### 11.1 ARIA Labels
```tsx
<button 
  aria-label="Copy Agent ID to clipboard"
  onClick={copyAgentId}
>
  [COPY]
</button>
```

### 11.2 Semantic HTML
```tsx
<section aria-labelledby="agent-details-heading">
  <h2 id="agent-details-heading">Agent Details</h2>
  <p>Agent information here</p>
</section>
```

### 11.3 Keyboard Navigation
```tsx
<div 
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
  role="button"
  tabIndex={0}
>
  Clickable element
</div>
```

---

## 12. Component Development Checklist

For each new component, ensure:

- [ ] TypeScript interfaces defined
- [ ] Props fully typed
- [ ] Default props specified
- [ ] Unit tests written (80%+ coverage)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Dark mode styling tested
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Storybook story created (optional for MVP)
- [ ] Documentation added
- [ ] Performance profiled if heavy computation

---

## 13. Next Steps

1. ✅ Define component hierarchy
2. 📋 Implement UI primitives
3. 📋 Build layout components
4. 📋 Create form components
5. 📋 Implement Bytecript card
6. 📋 Build agent registration flow
7. 📋 Add state management
8. 📋 Implement routing
9. 📋 Add tests
10. 📋 Performance optimization

---

**Document Prepared:** November 2026  
**Architecture Version:** 0.1  
**Last Updated:** 2026-11-22
