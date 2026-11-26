# Data Models & State Management — Descript Frontend

**Version:** 0.1  
**Status:** Technical Specification  
**Purpose:** Define frontend data structures, state management, data flow, and API contracts  

---

## 1. Overview

The Descript frontend manages several key data domains:
- **Authentication & User Sessions** — Login state, tokens, user info
- **Agent Identity** — Agent records, credentials, lifecycle status
- **Cryptography** — Public keys, fingerprints, keypair generation
- **UI State** — Notifications, modals, loading states, theme
- **Caching & Persistence** — LocalStorage, session caching, API cache

**State Management Approach:**
- **React Context** for global state (Auth, Theme, Notifications)
- **React Hooks (useState)** for local component state
- **Custom Hooks** for domain logic (useAgent, useKeyGeneration)
- **LocalStorage** for persistence (theme preference, draft forms)
- **API Response Caching** via fetch wrapper or SWR

---

## 2. Authentication & Session State

### 2.1 User Entity
```typescript
// types/auth.ts

export interface User {
  id: string;                        // user_XXXXXXXXXX
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;                 // ISO 8601
  lastLoginAt?: string;
  emailVerified: boolean;
}

export interface AuthSession {
  user: User | null;
  token: string | null;              // JWT bearer token
  refreshToken: string | null;       // For token refresh
  expiresAt?: number;                // Unix timestamp
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: string;                      // 'INVALID_CREDENTIALS', 'NETWORK_ERROR', etc.
  message: string;
  details?: Record<string, unknown>;
}
```

### 2.2 AuthContext
```typescript
// context/AuthContext.tsx

interface AuthContextType {
  session: AuthSession;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('descript_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        // Invalid session data, clear it
        localStorage.removeItem('descript_session');
      }
    }
    setSession(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('descript_session', JSON.stringify(session));
  }, [session]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!session.expiresAt || !session.token) return;

    const timeUntilExpiry = session.expiresAt * 1000 - Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilExpiry < refreshThreshold) {
      refreshSession();
    }

    const timer = setTimeout(refreshSession, timeUntilExpiry - refreshThreshold);
    return () => clearTimeout(timer);
  }, [session.expiresAt, session.token]);

  const login = async (email: string, password: string) => {
    setSession(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post('/auth/login', { email, password });
      setSession(prev => ({
        ...prev,
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      const authError = parseAuthError(error);
      setSession(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
      throw authError;
    }
  };

  const logout = () => {
    setSession({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('descript_session');
  };

  // Additional methods: signup, refreshSession, updateUser...

  return (
    <AuthContext.Provider value={{ session, login, logout, signup, refreshSession, updateUser, isAuthenticated: session.isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 3. Agent & Identity State

### 3.1 Agent Entities
```typescript
// types/agent.ts

export interface Agent {
  id: string;                        // agent_XXXXXXXXXX
  name: string;
  description?: string;
  byteNetwork: string;
  residence: string;
  status: 'pending' | 'active' | 'suspended' | 'revoked' | 'compromised';
  createdAt: string;                 // ISO 8601
  updatedAt: string;
  credentials: Credential[];
  bytecript?: Bytecript;
  publicMetadata?: Record<string, unknown>;
}

export interface Credential {
  id: string;                        // cred_XXXXX
  agentId: string;
  algorithm: 'ed25519' | 'ecdsa';
  publicKey: string;                 // Base64 encoded
  publicKeyFingerprint: string;      // SHA256 hex
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
}

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
  signature?: string;                // Backend signature
}
```

### 3.2 Agent Registration State
```typescript
// types/registration.ts

export interface RegistrationStep {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  data: Partial<RegistrationData>;
  isComplete: boolean;
}

export interface RegistrationData {
  // Step 1: Agent Details
  agentName: string;
  description?: string;
  byteNetwork: string;
  agentType?: string;
  framework?: string;

  // Step 2: Keypair Choice
  keypairSource: 'generate' | 'import';

  // Step 3: Key Material
  publicKey?: string;
  privateKey?: string;                // Only temporarily in state
  keypairAlgorithm?: 'ed25519' | 'ecdsa';

  // Step 4: Confirmation
  agentId?: string;
  registered?: boolean;
}

export interface RegistrationState {
  currentStep: number;
  data: RegistrationData;
  isLoading: boolean;
  error: RegistrationError | null;
  completedSteps: number[];
}

export interface RegistrationError {
  step: number;
  field?: string;
  code: string;
  message: string;
}
```

### 3.3 AgentContext
```typescript
// context/AgentContext.tsx

interface AgentContextType {
  // Data
  agents: Agent[];
  currentAgent: Agent | null;
  selectedAgentId: string | null;
  
  // Registration flow
  registrationState: RegistrationState;

  // Loading & errors
  isLoading: boolean;
  error: Error | null;

  // Actions
  selectAgent: (agentId: string) => void;
  loadAgents: () => Promise<void>;
  createAgent: (data: AgentCreateDTO) => Promise<Agent>;
  updateAgentMetadata: (agentId: string, updates: Partial<Agent>) => Promise<void>;
  suspendAgent: (agentId: string) => Promise<void>;
  reactivateAgent: (agentId: string) => Promise<void>;
  revokeAgent: (agentId: string) => Promise<void>;
  
  // Registration
  setRegistrationStep: (step: number) => void;
  setRegistrationData: (data: Partial<RegistrationData>) => void;
  resetRegistration: () => void;
  submitRegistration: () => Promise<Agent>;
}

export const AgentContext = React.createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    currentStep: 1,
    data: {},
    isLoading: false,
    error: null,
    completedSteps: [],
  });

  // Load agents on mount and when user changes
  useEffect(() => {
    if (session.isAuthenticated) {
      loadAgents();
    } else {
      setAgents([]);
      setSelectedAgentId(null);
    }
  }, [session.isAuthenticated]);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/agents');
      setAgents(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (payload: AgentCreateDTO): Promise<Agent> => {
    setIsLoading(true);
    try {
      const newAgent = await api.post('/agents', payload);
      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const currentAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  );

  const setRegistrationStep = (step: number) => {
    setRegistrationState(prev => ({
      ...prev,
      currentStep: step,
      completedSteps: [...new Set([...prev.completedSteps, step])],
    }));
  };

  const setRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationState(prev => ({
      ...prev,
      data: { ...prev.data, ...data },
      error: null, // Clear error when user makes changes
    }));
  };

  const resetRegistration = () => {
    setRegistrationState({
      currentStep: 1,
      data: {},
      isLoading: false,
      error: null,
      completedSteps: [],
    });
  };

  const submitRegistration = async (): Promise<Agent> => {
    setRegistrationState(prev => ({ ...prev, isLoading: true }));
    try {
      const agent = await createAgent({
        name: registrationState.data.agentName!,
        description: registrationState.data.description,
        byteNetwork: registrationState.data.byteNetwork!,
        publicKey: registrationState.data.publicKey!,
        agentType: registrationState.data.agentType,
        framework: registrationState.data.framework,
      });
      resetRegistration();
      return agent;
    } catch (err) {
      const error = err as RegistrationError;
      setRegistrationState(prev => ({
        ...prev,
        isLoading: false,
        error,
      }));
      throw error;
    }
  };

  // Additional methods: suspend, reactivate, revoke, etc.

  return (
    <AgentContext.Provider value={{
      agents,
      currentAgent,
      selectedAgentId,
      registrationState,
      isLoading,
      error,
      selectAgent,
      loadAgents,
      createAgent,
      setRegistrationStep,
      setRegistrationData,
      resetRegistration,
      submitRegistration,
      // ... other methods
    }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgents = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within AgentProvider');
  }
  return context;
};
```

---

## 4. Cryptography State

### 4.1 Keypair Entities
```typescript
// types/crypto.ts

export interface Keypair {
  publicKey: string;                 // Base64 encoded
  privateKey: string;                // Base64 encoded (temporary)
  algorithm: 'ed25519' | 'ecdsa';
  fingerprint: string;               // SHA256 hex hash
  generatedAt: string;               // ISO 8601
}

export interface CryptoState {
  currentKeypair: Keypair | null;
  isGenerating: boolean;
  error: CryptoError | null;
  privateKeyVisibility: boolean;    // Show/hide private key
}

export interface CryptoError {
  code: string;
  message: string;
  details?: unknown;
}
```

### 4.2 useKeyGeneration Hook
```typescript
// hooks/useKeyGeneration.ts

export const useKeyGeneration = () => {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<CryptoError | null>(null);

  const generateKeypair = async (algorithm: 'ed25519' | 'ecdsa' = 'ed25519'): Promise<Keypair> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Client-side Ed25519 generation using tweetnacl-js
      const { publicKey, secretKey } = nacl.sign.keyPair();

      const newKeypair: Keypair = {
        publicKey: Buffer.from(publicKey).toString('base64'),
        privateKey: Buffer.from(secretKey).toString('base64'),
        algorithm,
        fingerprint: generateFingerprint(publicKey),
        generatedAt: new Date().toISOString(),
      };

      setKeypair(newKeypair);
      return newKeypair;
    } catch (err) {
      const cryptoError: CryptoError = {
        code: 'KEYPAIR_GENERATION_FAILED',
        message: 'Failed to generate keypair',
        details: err,
      };
      setError(cryptoError);
      throw cryptoError;
    } finally {
      setIsGenerating(false);
    }
  };

  const importPublicKey = async (publicKeyString: string): Promise<Keypair> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Validate and parse public key
      const publicKey = parsePublicKey(publicKeyString);
      
      const newKeypair: Keypair = {
        publicKey: Buffer.from(publicKey).toString('base64'),
        privateKey: '', // No private key when importing
        algorithm: 'ed25519',
        fingerprint: generateFingerprint(publicKey),
        generatedAt: new Date().toISOString(),
      };

      setKeypair(newKeypair);
      return newKeypair;
    } catch (err) {
      const cryptoError: CryptoError = {
        code: 'INVALID_PUBLIC_KEY',
        message: 'Public key format not recognized',
        details: err,
      };
      setError(cryptoError);
      throw cryptoError;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearKeypair = () => {
    setKeypair(null);
    setError(null);
  };

  return {
    keypair,
    isGenerating,
    error,
    generateKeypair,
    importPublicKey,
    clearKeypair,
  };
};

function parsePublicKey(keyString: string): Uint8Array {
  // Parse various key formats (base64, PEM, OpenSSH)
  // Return Uint8Array of key data
}

function generateFingerprint(publicKey: Uint8Array): string {
  // SHA256 hash of public key, return as hex string
  const hash = crypto.subtle.digest('SHA-256', publicKey);
  // Convert to hex and return
}
```

### 4.3 useCrypto Hook
```typescript
// hooks/useCrypto.ts

export const useCrypto = () => {
  const validatePublicKey = (keyString: string): boolean => {
    try {
      parsePublicKey(keyString);
      return true;
    } catch {
      return false;
    }
  };

  const generateFingerprint = (publicKeyString: string): string => {
    const publicKey = parsePublicKey(publicKeyString);
    // Generate SHA256 fingerprint and return as hex
    const hash = crypto.subtle.digest('SHA-256', publicKey);
    return arrayToHex(new Uint8Array(hash));
  };

  const formatFingerprint = (fingerprint: string): string => {
    // Format fingerprint as "3f4a2b1c 9e8d7c6b ..." (4-byte chunks)
    return fingerprint.match(/.{1,8}/g)?.join(' ') || fingerprint;
  };

  const exportKeypair = (keypair: Keypair, format: 'base64' | 'pem' = 'base64'): string => {
    if (format === 'base64') {
      return keypair.privateKey;
    }
    // Convert to PEM format
    return `-----BEGIN PRIVATE KEY-----\n${formatBase64PEM(keypair.privateKey)}\n-----END PRIVATE KEY-----`;
  };

  return {
    validatePublicKey,
    generateFingerprint,
    formatFingerprint,
    exportKeypair,
  };
};
```

---

## 5. UI/Notification State

### 5.1 Notification Entity
```typescript
// types/notification.ts

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;                 // ms, default 3000
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  title: string;
  message: string;
  type: 'confirm' | 'alert' | 'prompt';
  buttons: Array<{
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
    onClick: (value?: string) => void;
  }>;
  isOpen: boolean;
}

export interface NotificationState {
  toasts: Toast[];
  modals: Modal[];
}
```

### 5.2 NotificationContext
```typescript
// context/NotificationContext.tsx

interface NotificationContextType {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: string) => Promise<void>;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modals, setModals] = useState<Modal[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) => {
    const id = generateId();
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = generateId();
      const modal: Modal = {
        id,
        title,
        message,
        type: 'confirm',
        buttons: [
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => {
              setModals(prev => prev.filter(m => m.id !== id));
              resolve(false);
            },
          },
          {
            label: 'Confirm',
            variant: 'primary',
            onClick: () => {
              setModals(prev => prev.filter(m => m.id !== id));
              resolve(true);
            },
          },
        ],
        isOpen: true,
      };
      setModals(prev => [...prev, modal]);
    });
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
    setModals([]);
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, showAlert, dismissToast, dismissAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
```

---

## 6. Theme & UI Preferences State

### 6.1 Theme Entity
```typescript
// types/theme.ts

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  prefersDark: boolean;
  isDarkMode: boolean;
}
```

### 6.2 ThemeContext
```typescript
// context/ThemeContext.tsx

interface ThemeContextType {
  theme: ThemeState;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeState>(() => {
    const saved = localStorage.getItem('descript_theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const mode = saved || 'system';
    const isDarkMode = mode === 'dark' || (mode === 'system' && prefersDark);

    return { mode, prefersDark, isDarkMode };
  });

  useEffect(() => {
    localStorage.setItem('descript_theme', theme.mode);
    
    // Apply to DOM
    if (theme.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.isDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme.mode === 'system') {
        setThemeState(prev => ({
          ...prev,
          isDarkMode: e.matches,
        }));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode]);

  const setTheme = (mode: ThemeMode) => {
    const prefersDark = theme.prefersDark;
    const isDarkMode = mode === 'dark' || (mode === 'system' && prefersDark);
    setThemeState({ mode, prefersDark, isDarkMode });
  };

  const toggleTheme = () => {
    setTheme(theme.isDarkMode ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## 7. API Client & Data Fetching

### 7.1 API Client
```typescript
// services/api.ts

class APIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('descript_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('descript_token', token);
    } else {
      localStorage.removeItem('descript_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new APIError(response.status, response.statusText);
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'Network error');
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

class APIError extends Error {
  constructor(public status: number, public statusText: string) {
    super(`${status}: ${statusText}`);
    this.name = 'APIError';
  }
}

export const api = new APIClient();
```

### 7.2 useFetch Hook
```typescript
// hooks/useFetch.ts

interface UseFetchOptions<T> {
  initialData?: T;
  refetchInterval?: number;
  skipFetch?: boolean;
}

export const useFetch = <T,>(
  endpoint: string,
  options: UseFetchOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [isLoading, setIsLoading] = useState(!options.skipFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<T>(endpoint);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (options.skipFetch) return;
    
    fetchData();

    if (options.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [endpoint, fetchData, options.refetchInterval, options.skipFetch]);

  return { data, isLoading, error, refetch: fetchData };
};
```

---

## 8. Form State Management

### 8.1 Form Validation
```typescript
// hooks/useFormValidation.ts

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  values: T;
  errors: FormErrors;
  touched: Set<string>;
  isDirty: boolean;
  isValid: boolean;
}

type Validator<T> = (values: T) => FormErrors;

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validate: Validator<T>
) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: new Set(),
    isDirty: false,
    isValid: true,
  });

  const setFieldValue = (field: keyof T, value: unknown) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const errors = validate(newValues);
      return {
        ...prev,
        values: newValues,
        errors,
        isDirty: true,
        isValid: Object.keys(errors).length === 0,
      };
    });
  };

  const setFieldTouched = (field: keyof T) => {
    setState(prev => ({
      ...prev,
      touched: new Set([...prev.touched, field]),
    }));
  };

  const setFieldError = (field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  };

  const resetForm = () => {
    setState({
      values: initialValues,
      errors: {},
      touched: new Set(),
      isDirty: false,
      isValid: true,
    });
  };

  return {
    ...state,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
  };
};
```

---

## 9. LocalStorage Persistence

### 9.1 useLocalStorage Hook
```typescript
// hooks/useLocalStorage.ts

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};
```

---

## 10. API Contract Examples

### 10.1 Agent Endpoints
```typescript
// services/agentService.ts

export const agentService = {
  // List all agents for authenticated user
  async getAgents(): Promise<Agent[]> {
    return api.get('/agents');
  },

  // Get specific agent
  async getAgent(agentId: string): Promise<Agent> {
    return api.get(`/agents/${agentId}`);
  },

  // Create new agent
  async createAgent(data: AgentCreateDTO): Promise<Agent> {
    return api.post('/agents', data);
  },

  // Update agent metadata
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    return api.patch(`/agents/${agentId}`, updates);
  },

  // Get Bytecript credential
  async getBytecript(agentId: string): Promise<Bytecript> {
    return api.get(`/agents/${agentId}/bytecript`);
  },

  // Get all credentials for agent
  async getCredentials(agentId: string): Promise<Credential[]> {
    return api.get(`/agents/${agentId}/credentials`);
  },

  // Add new credential
  async addCredential(agentId: string, publicKey: string, algorithm: string): Promise<Credential> {
    return api.post(`/agents/${agentId}/credentials`, { publicKey, algorithm });
  },

  // Revoke credential
  async revokeCredential(agentId: string, credentialId: string): Promise<void> {
    return api.delete(`/agents/${agentId}/credentials/${credentialId}`);
  },

  // Suspend agent
  async suspendAgent(agentId: string): Promise<Agent> {
    return api.patch(`/agents/${agentId}`, { status: 'suspended' });
  },

  // Reactivate agent
  async reactivateAgent(agentId: string): Promise<Agent> {
    return api.patch(`/agents/${agentId}`, { status: 'active' });
  },

  // Revoke agent
  async revokeAgent(agentId: string): Promise<Agent> {
    return api.patch(`/agents/${agentId}`, { status: 'revoked' });
  },
};
```

---

## 11. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Application                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Interaction                                                    │
│  (Click, Type, Submit)                                              │
│         │                                                            │
│         ↓                                                            │
│  ┌──────────────────┐                                               │
│  │ Component Event  │                                               │
│  │ Handler          │                                               │
│  └──────────────────┘                                               │
│         │                                                            │
│         ↓                                                            │
│  ┌──────────────────┐        ┌─────────────────┐                   │
│  │ Custom Hook or   │───────→│ Context Action  │                   │
│  │ Service Call     │        │ (setState)      │                   │
│  └──────────────────┘        └─────────────────┘                   │
│         │                            │                               │
│         │ (optional)                 ↓                               │
│         └───────────────→ ┌─────────────────┐                       │
│                            │ API Request     │                       │
│                            │ (Fetch to /api) │                       │
│                            └─────────────────┘                       │
│                                   │                                   │
│                                   ↓                                   │
│                            ┌─────────────────┐                       │
│                            │ API Response    │                       │
│                            │ (JSON data)     │                       │
│                            └─────────────────┘                       │
│                                   │                                   │
│                                   ↓                                   │
│                            ┌─────────────────┐                       │
│                            │ Update State    │                       │
│                            │ (setState)      │                       │
│                            └─────────────────┘                       │
│                                   │                                   │
│                                   ↓                                   │
│                            ┌─────────────────┐                       │
│                            │ Re-render       │                       │
│                            │ Component       │                       │
│                            └─────────────────┘                       │
│                                   │                                   │
│                                   ↓                                   │
│                            ┌─────────────────┐                       │
│                            │ Updated UI      │                       │
│                            │ Displayed       │                       │
│                            └─────────────────┘                       │
│                                                                       │
│  Optional Persistence:                                              │
│  State ←→ LocalStorage                                               │
│  State ←→ SessionStorage                                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Performance Considerations

### 12.1 Memoization
- Use `useMemo` for expensive computations (fingerprint generation)
- Use `useCallback` for stable function references
- Memoize components that receive frequently changing props

### 12.2 Lazy Loading
- Code split registration flow pages
- Lazy load agent details modal
- Defer loading of large lists

### 12.3 Caching
- Cache API responses in memory (via Context)
- Cache agent list, update when modified
- Avoid redundant API calls for same data

---

## 13. Next Steps

1. ✅ Define data models
2. 📋 Implement AuthContext & useAuth hook
3. 📋 Implement AgentContext & useAgents hook
4. 📋 Implement useKeyGeneration hook
5. 📋 Implement form validation hooks
6. 📋 Set up API client
7. 📋 Integrate contexts in App.tsx
8. 📋 Test data flow with components

---

**Document Prepared:** November 2026  
**Data Models Version:** 0.1  
**Last Updated:** 2026-11-22
