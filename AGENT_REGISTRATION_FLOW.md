# Agent Registration Flow — Step-by-Step Specification

**Version:** 0.1  
**Status:** Workflow Design  
**Purpose:** Define complete user flows for agent registration, key generation, and identity verification  

---

## 1. Overview

The registration flow is the **primary entry point** to Descript. It converts a new user/developer/agent into a registered agent with an assigned Agent ID and cryptographic credentials.

**Core Flows:**
1. **Human-Initiated Registration** — Developer creates agent in dashboard
2. **Direct Registration** — Agent supplies metadata and public key
3. **Key Generation** — System generates Ed25519 keypair, user downloads private key
4. **Identity Verification** — Bytecript is issued and displayed
5. **Credential Management** — Agent can add/rotate credentials after registration

---

## 2. Pre-Registration State

### 2.1 User Entry Points

| Entry Point | User Type | Flow |
| :--- | :--- | :--- |
| **Web Dashboard** | Developer/Admin | Navigate to "Register Agent" |
| **API** | Developer/Agent | POST /api/v1/agents with metadata |
| **Bulk Import** | Admin | CSV/JSON upload multiple agents |
| **OAuth/Third-party** | Agent from framework | SSO from LangChain/CrewAI/etc (future) |

### 2.2 Prerequisites
- User must be authenticated (if dashboard flow)
- Network connectivity required
- Modern browser with JavaScript enabled
- For key generation: 128MB+ RAM for crypto operations

---

## 3. Full Registration Flow (Dashboard)

### 3.1 Step 1: Welcome Screen

**URL:** `/dashboard/agents`

**Screen Content:**
```
┌─────────────────────────────────────┐
│  My Agents                          │
│                                     │
│  [+ CREATE NEW AGENT]               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ No agents yet              │   │
│  │ Create your first agent    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Or upload multiple:               │
│  [BULK IMPORT]                      │
└─────────────────────────────────────┘
```

**User Action:** Click `[CREATE NEW AGENT]`

**Navigation:** → Step 2 (Agent Details Form)

---

### 3.2 Step 2: Agent Details Form

**URL:** `/dashboard/agents/new`

**Form Fields:**

| Field | Type | Validation | Required | Help Text |
| :--- | :--- | :--- | :--- | :--- |
| **Agent Name** | Text Input | 3–64 chars, alphanumeric + spaces | Yes | Name visible to external services (e.g., "API Integration Agent") |
| **Description** | Text Area | 0–512 chars | No | What does this agent do? (optional but recommended) |
| **Byte Network** | Dropdown | Select from available networks | Yes | Network determines identity namespace (e.g., "kiroween", "partner-network") |
| **Agent Type** | Dropdown | LLM / Workflow / Custom | No | Helps with categorization (optional) |
| **Framework** | Dropdown | LangChain / CrewAI / Custom | No | What framework runs this agent? (optional) |

**Form Layout:**
```
┌─────────────────────────────────────────────────┐
│  Register New Agent                             │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Agent Name *                                   │
│  [________________________________]             │
│  3–64 characters, e.g., "API Handler"           │
│                                                 │
│  Description                                    │
│  [________________________________]             │
│  [________________________________] (3 lines)   │
│  Tell us what this agent does (optional)       │
│                                                 │
│  Byte Network *                                 │
│  [▼ kiroween                      ]             │
│  Your identity namespace                       │
│                                                 │
│  Agent Type                                     │
│  [▼ Custom                        ]             │
│                                                 │
│  Framework                                      │
│  [▼ Other                         ]             │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ℹ Networks: Each network has its own      │ │
│  │ governance. Make sure you're choosing     │ │
│  │ the right one. You can't change networks  │ │
│  │ after registration.                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [CANCEL]                    [CONTINUE →]      │
└─────────────────────────────────────────────────┘
```

**Validation:**
- Agent Name: Required, must be 3+ chars
- Network: Required selection
- Real-time validation feedback below each field
- "CONTINUE" button disabled until name & network provided

**User Actions:**
- Fill in form
- Click `[CONTINUE →]`

**Error Handling:**
- Name too short → Show "Name must be at least 3 characters"
- Name with invalid chars → Show "Name can only contain letters, numbers, spaces"
- Duplicate name (optional check) → Show "An agent with this name already exists"

**Navigation:** → Step 3 (Keypair Setup Choice)

---

### 3.3 Step 3: Keypair Setup Choice

**URL:** `/dashboard/agents/new/keypair-setup`

**Purpose:** Agent chooses between generating a new keypair or importing an existing public key

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  Agent Keypair Setup                            │
│  ─────────────────────────────────────────────  │
│                                                 │
│  How would you like to set up credentials?     │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │ Generate New Keypair (Recommended)  │      │
│  ├─────────────────────────────────────┤      │
│  │ We'll create a new Ed25519 keypair  │      │
│  │ - Private key shown once (download) │      │
│  │ - Public key registered             │      │
│  │ - Most secure for new agents        │      │
│  │                                     │      │
│  │ [SELECT →]                          │      │
│  └─────────────────────────────────────┘      │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │ Import Existing Public Key          │      │
│  ├─────────────────────────────────────┤      │
│  │ Register a public key you already   │      │
│  │ have from another system            │      │
│  │ - You manage the private key        │      │
│  │ - Paste base64-encoded key          │      │
│  │ - Good for migrating agents         │      │
│  │                                     │      │
│  │ [SELECT →]                          │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

**User Action:** Click one of the two options

**Navigation:**
- Generate: → Step 4a (Key Generation)
- Import: → Step 4b (Key Import)

---

### 3.4a Step 4a: Generate New Keypair

**URL:** `/dashboard/agents/new/generate-keypair`

**Algorithm:** Ed25519 (ECDSA not supported in MVP)

**Process:**
1. User clicks "Generate Keypair"
2. Frontend generates keypair locally (using `tweetnacl-js` or similar)
3. Private key displayed **exactly once**
4. User required to download or copy private key before proceeding

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  Your Private Key (Generated)                   │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ⚠️  IMPORTANT: This is the ONLY time you'll   │
│  see your private key. Download and store it   │
│  securely. You cannot retrieve it later.       │
│                                                 │
│  Algorithm: Ed25519                             │
│  Generated: 2026-11-22 14:30:15 UTC             │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ (monospace, small font)                 │  │
│  │ MC4CAQAwBQYDK2VwBCIEIEQQQQQQQQQQQQQQQQ │  │
│  │ QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ │  │
│  │ QQQQQQQQQQQQQQQQQ=                      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [COPY TO CLIPBOARD]  [DOWNLOAD AS .pem FILE]  │
│                                                 │
│  Your Public Key (for reference):              │
│  ─────────────────────────────────────────────  │
│  ed25519/AAAAC3NzaC1lZDI1NTE5AAAA...           │
│                                                 │
│  [COPY PUBLIC KEY]                              │
│                                                 │
│  ─────────────────────────────────────────────  │
│  ✓ I have securely saved my private key       │
│  (Must check to continue)                      │
│                                                 │
│  [BACK]                           [REGISTER →] │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- **Large, Readable Font** — Monospace, high contrast
- **Multiple Export Options:**
  - Copy to clipboard (single click)
  - Download as `.pem` file
- **Acknowledge Checkbox** — "I have saved my private key" must be checked
- **Public Key Display** — For reference/verification
- **Visual Warnings** — Red background, warning icon, clear language

**Validation:**
- Checkbox must be checked before "REGISTER" button enabled
- Private key stays on screen until user navigates away (no reload persistence)

**Error Handling:**
- If copy fails → "Copy failed, try manual selection"
- If download fails → "Download failed, please copy manually"

**Navigation:**
- Back: ← Step 3 (start over)
- Register: → Step 5 (Registration Confirmation)

---

### 3.4b Step 4b: Import Existing Public Key

**URL:** `/dashboard/agents/new/import-key`

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  Import Existing Public Key                     │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Paste your public key (base64 or PEM format) │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Supported formats:                       │  │
│  │ - Base64 encoded (AAAA...)               │  │
│  │ - PEM format (-----BEGIN PUBLIC KEY---) │  │
│  │ - OpenSSH format (ssh-ed25519 AAAA...)  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Paste public key here:                         │
│  ┌──────────────────────────────────────────┐  │
│  │ [                                       ]│  │
│  │ [                                       ]│  │
│  │ [                                       ]│  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [VALIDATE KEY]                                 │
│                                                 │
│  Key Details (detected after validation):      │
│  Algorithm: Ed25519                             │
│  Fingerprint: 3f4a2b1c9e8d7c6b...              │
│  [✓ Valid]                                      │
│                                                 │
│  [BACK]                           [REGISTER →] │
└─────────────────────────────────────────────────┘
```

**Validation:**
- User pastes public key
- Click "VALIDATE KEY" to parse and verify
- Display detected algorithm and fingerprint
- Show checkmark if valid, error if invalid
- "REGISTER" button enabled only if valid key detected

**Error Handling:**
- Invalid format → "Key format not recognized. Try base64 or PEM"
- Unsupported algorithm → "Only Ed25519 is supported in MVP. Your key uses ECDSA"
- Malformed key → "Key appears corrupted. Check for missing characters"

**Navigation:**
- Back: ← Step 3
- Register: → Step 5

---

### 3.5 Step 5: Registration Confirmation & Agent ID Assignment

**URL:** `/dashboard/agents/new/confirm`

**Process:**
1. Frontend submits agent registration data to backend
2. Backend validates, generates Agent ID, creates record in DB
3. Frontend receives Agent ID and displays confirmation

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  Agent Registered! ✓                            │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Your new agent is ready.                       │
│                                                 │
│  Agent Name:    AI Integration Agent            │
│  Agent ID:      agent_01h8x7xt8x92y4b3c5d6e7f8 │
│  Byte Network:  kiroween                        │
│  Status:        🟢 ACTIVE                       │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Copy Agent ID                            │  │
│  │ agent_01h8x7xt8x92y4b3c5d6e7f8 [COPY]   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Next Steps:                                    │
│  1. View your Bytecript digital ID card        │
│  2. Share your Agent ID with services          │
│  3. Use this ID to authenticate                │
│                                                 │
│  [VIEW BYTECRIPT →]    [DONE]                  │
└─────────────────────────────────────────────────┘
```

**Success Indicators:**
- Green checkmark and "Registered!" message
- Agent ID displayed and copyable
- All metadata confirmed
- Status showing as "ACTIVE"

**Navigation:**
- View Bytecript: → Agent Profile Page (Step 6)
- Done: → Dashboard

**API Call (Backend):**
```
POST /api/v1/agents
{
  "name": "AI Integration Agent",
  "description": "Handles API requests",
  "byteNetwork": "kiroween",
  "publicKey": "base64-encoded-key",
  "agentType": "custom",
  "framework": "other"
}

Response:
{
  "id": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6",
  "name": "AI Integration Agent",
  "byteNetwork": "kiroween",
  "residence": "kiroween-residence",
  "status": "active",
  "createdAt": "2026-11-22T14:30:00Z",
  "publicKey": {...},
  "bytecript": {...}
}
```

---

### 3.6 Step 6: Agent Profile & Bytecript Display

**URL:** `/agents/{agentId}`

**Screen Content:**
```
┌─────────────────────────────────────────────────┐
│  Agent Profile                                  │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [← Back to Agents]                             │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │      [Bytecript Digital Card]            │  │
│  │      (Beautiful card display)            │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [EXPORT AS JSON]  [SHARE PROFILE]  [EDIT]     │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Credentials                                    │
│                                                 │
│  Public Key Fingerprint:                        │
│  3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f          │
│  [COPY]                                         │
│                                                 │
│  [+ ADD NEW CREDENTIAL]  [REVOKE] [VIEW AUDIT] │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Settings                                       │
│                                                 │
│  Status: 🟢 Active                              │
│  Network: kiroween                              │
│  Residence: kiroween-residence                  │
│  Created: 2026-11-22 at 14:30 UTC              │
│                                                 │
│  [SUSPEND IDENTITY]  [VIEW ACTIVITY LOG]        │
└─────────────────────────────────────────────────┘
```

**Key Actions:**
- **Export Bytecript** — Download as JSON credential
- **Share Profile** — Generate public link
- **Add Credential** — Generate/import another keypair
- **Revoke Credential** — Remove a credential from active use
- **Edit Metadata** — Update agent name/description
- **Suspend Identity** — Temporarily disable agent
- **View Audit Log** — See all credential and status changes

---

## 4. Alternative Flows

### 4.1 API-Initiated Registration (Developers)

**Endpoint:** `POST /api/v1/agents`

**Request:**
```json
{
  "name": "Background Worker",
  "description": "Processes async tasks",
  "byteNetwork": "kiroween",
  "publicKey": "MC4CAQAwBQYDK2VwBCIEIEQQQQ...",
  "agentType": "worker",
  "framework": "celery"
}
```

**Response:**
```json
{
  "id": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6",
  "name": "Background Worker",
  "byteNetwork": "kiroween",
  "residence": "kiroween-residence",
  "status": "active",
  "createdAt": "2026-11-22T14:30:00Z",
  "bytecript": {
    "agentId": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6",
    "agentName": "Background Worker",
    "byteNetwork": "kiroween",
    "credentials": [{
      "algorithm": "ed25519",
      "publicKeyFingerprint": "3f4a2b1c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a695f4e3d2c"
    }],
    "status": "active",
    "issuedAt": "2026-11-22T14:30:00Z"
  }
}
```

---

### 4.2 Bulk Import (CSV/JSON)

**File Format:**
```csv
name,description,byteNetwork,publicKey,agentType
"Agent 1","Description 1",kiroween,"AAAA...",llm
"Agent 2","Description 2",partner,"BBBB...",workflow
```

**Process:**
1. Admin uploads file
2. System validates all rows
3. Shows preview of agents to be created
4. Confirmation dialog
5. Batch registration
6. Success report with Agent IDs

---

## 5. Error Scenarios & Recovery

### 5.1 Registration Failures

| Scenario | Error Message | Recovery |
| :--- | :--- | :--- |
| **Duplicate Agent Name** | "Agent name already exists" | Suggest unique name, try different name |
| **Invalid Network** | "Network not found or not available to you" | Show available networks, select another |
| **Invalid Public Key** | "Public key format invalid or unsupported algorithm" | Show format examples, re-paste key |
| **Network Error** | "Registration failed. Check connection and retry." | Show retry button |
| **Server Error** | "Server error (500). Please contact support." | Show support contact info |

### 5.2 Key Generation Failures

| Scenario | Error Message | Recovery |
| :--- | :--- | :--- |
| **Insufficient Entropy** | "Could not generate keypair. Refresh page and try again." | Reload page, retry |
| **Browser Crypto Unavailable** | "Your browser doesn't support required cryptography." | Suggest modern browser |
| **Download Failed** | "Could not save file. Try copying instead." | Show copy button, guide to manual save |

---

## 6. Accessibility Considerations

### 6.1 Keyboard Navigation
- All form fields accessible via Tab
- Submit buttons activated via Enter
- Modals closable via Escape
- Focus indicator visible on all interactive elements

### 6.2 Screen Reader Support
```html
<form aria-labelledby="registration-title" role="main">
  <h1 id="registration-title">Register New Agent</h1>
  
  <label htmlFor="agent-name">
    Agent Name
    <span aria-label="Required"> *</span>
  </label>
  <input 
    id="agent-name" 
    type="text" 
    aria-required="true"
    aria-describedby="agent-name-help"
  />
  <div id="agent-name-help">3–64 characters, e.g., "API Handler"</div>
</form>
```

### 6.3 Color Not Alone
- Status badges have both icon AND text
- Errors marked with both color AND icon
- Success marked with both checkmark AND text

---

## 7. Security Considerations

### 7.1 Private Key Handling
- **Generated locally** — Never transmitted to server
- **Shown once** — Not stored, not cached, not logged
- **User responsible** — Kiro Platform not responsible for lost keys
- **No recovery** — If lost, user must generate new key and revoke old one

### 7.2 HTTPS Only
- All communication encrypted
- HSTS headers enforced
- No fallback to HTTP

### 7.3 CSRF Protection
- All POST requests include CSRF token
- Token rotated after registration
- Tokens stored in secure, HTTP-only cookies

### 7.4 Rate Limiting
- Registration: 10 agents per hour per IP
- Key generation: 100 per hour per IP
- Error messages don't reveal rate limit details

---

## 8. Data Validation Rules

### 8.1 Agent Name
- Length: 3–64 characters
- Allowed: Letters, numbers, spaces, hyphens, underscores
- Regex: `^[a-zA-Z0-9\s\-_]{3,64}$`
- Not allowed: Special chars, emojis, scripts

### 8.2 Public Key
- Format: Base64, PEM, or OpenSSH
- Algorithm: Ed25519 only (MVP)
- Length: 32 bytes minimum
- Validation: Parse and verify correct format

### 8.3 Description
- Length: 0–512 characters
- Allowed: Any printable text (sanitized)
- Markdown support: Optional (future feature)

---

## 9. API Contract Examples

### 9.1 Register Agent (Dashboard)
```typescript
POST /api/v1/agents
Content-Type: application/json
Authorization: Bearer {userToken}

{
  "name": "API Integration Agent",
  "description": "Handles external API calls",
  "byteNetwork": "kiroween",
  "publicKey": "base64-encoded-key-or-pem",
  "agentType": "custom",
  "framework": "other"
}

// Success Response (201)
{
  "id": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6",
  "name": "API Integration Agent",
  "description": "Handles external API calls",
  "byteNetwork": "kiroween",
  "residence": "kiroween-residence",
  "status": "active",
  "createdAt": "2026-11-22T14:30:00Z",
  "updatedAt": "2026-11-22T14:30:00Z",
  "publicMetadata": { ... },
  "bytecript": { ... }
}

// Error Response (400)
{
  "error": "INVALID_PUBLIC_KEY",
  "message": "Public key format not recognized",
  "details": {
    "field": "publicKey",
    "expected": "base64, PEM, or OpenSSH format"
  }
}
```

### 9.2 Get Agent Profile
```typescript
GET /api/v1/agents/{agentId}
Authorization: Bearer {userToken}

// Response (200)
{
  "id": "agent_01h8x7xt8x92y4b3c5d6e7f8g9h0i1j2k3l4m5n6",
  "name": "API Integration Agent",
  "byteNetwork": "kiroween",
  "residence": "kiroween-residence",
  "status": "active",
  "credentials": [
    {
      "id": "cred_77a...",
      "algorithm": "ed25519",
      "fingerprint": "3f4a2b1c...",
      "status": "active",
      "createdAt": "2026-11-22T14:30:00Z"
    }
  ],
  "bytecript": { ... }
}
```

---

## 10. Testing Scenarios

### 10.1 Happy Path
1. ✅ Fill form with valid data
2. ✅ Generate keypair
3. ✅ Download private key
4. ✅ Check acknowledgment
5. ✅ Submit registration
6. ✅ Receive Agent ID
7. ✅ View Bytecript
8. ✅ Export credential

### 10.2 Edge Cases
1. ✅ Very long agent name (64 chars max)
2. ✅ Special characters in description
3. ✅ Network timeout during registration
4. ✅ User closes browser during key generation
5. ✅ Paste invalid key and fix
6. ✅ Duplicate agent name submission
7. ✅ Register while offline (show error)
8. ✅ Multiple registrations in quick succession

### 10.3 Security Tests
1. ✅ Private key not logged in network requests
2. ✅ Private key not stored in browser storage
3. ✅ HTTPS enforced
4. ✅ CSRF token validated
5. ✅ Rate limiting blocks abuse
6. ✅ SQL injection attempts rejected
7. ✅ XSS payload in agent name sanitized

---

## 11. Performance Targets

| Metric | Target |
| :--- | :--- |
| **Form load time** | < 1.5s |
| **Keypair generation** | < 2s |
| **Registration submission** | < 3s |
| **Bytecript display** | < 1s |
| **Bundle size** | < 200KB (gzipped) |
| **Crypto lib size** | < 50KB (gzipped) |

---

## 12. Success Criteria

- [ ] Agent name, network, and pubkey form validates correctly
- [ ] Key generation produces valid Ed25519 keypair
- [ ] Private key displayed exactly once, not cached
- [ ] Download/copy of private key works without errors
- [ ] Acknowledgment checkbox required before proceed
- [ ] Registration API called with correct payload
- [ ] Agent ID assigned and returned immediately
- [ ] Bytecript generated and displayed
- [ ] All error states show helpful messages
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all form labels and errors
- [ ] Mobile responsive layout functional
- [ ] Dark mode styling applied correctly
- [ ] No console errors or warnings
- [ ] Crypto operations <2 seconds

---

## 13. Next Steps

1. ✅ Finalize flow specification
2. 📋 Create wireframes for each screen
3. 📋 Design visual mockups
4. 📋 Build React components
5. 📋 Implement form validation
6. 📋 Integrate with backend API
7. 📋 Test all scenarios
8. 📋 Security audit

---

**Document Prepared:** November 2026  
**Specification Version:** 0.1  
**Last Updated:** 2026-11-22
