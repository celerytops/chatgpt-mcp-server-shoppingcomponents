# Target Authentication Integration Guide

## Two Integration Methods

### Method 1: MCP Connector (Rich Embedded Experience) ✨

**Best for:** Users who want the full branded experience embedded in ChatGPT

**Connection URL:**
```
https://chatgpt-components-0d9232341440.herokuapp.com/mcp
```

**Features:**
- ✅ Beautiful Target-branded login widget embedded directly in chat
- ✅ 3-screen authentication flow (email/password → verification code → success)
- ✅ Dark/light mode support
- ✅ Loading states and animations
- ✅ Real-time session management

**How to Connect:**
1. Open ChatGPT
2. Go to Settings → Personalization → Memory & Connectors
3. Click "Add Connector"
4. Paste: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
5. Done! Users can now say "Log me into my Target account"

**User Experience:**
```
User: "Log me into my Target account"
→ ChatGPT creates session
→ Beautiful Target login widget appears in chat
→ User enters email/password → verification code → success
→ ChatGPT knows user is "Lauren Bailey"
```

---

### Method 2: Custom GPT Actions (Link-Based Flow) 🔗

**Best for:** Custom GPTs that need simpler authentication without requiring MCP connector

**OpenAPI Schema URL:**
```
https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
```

**Features:**
- ✅ No MCP connection required
- ✅ Same beautiful Target login page (opens in new tab)
- ✅ Simple two-action workflow
- ✅ Works with any Custom GPT

**How to Set Up:**
1. Create/Edit Custom GPT at https://chat.openai.com/gpts/editor
2. Go to "Actions" section
3. Click "Import from URL"
4. Paste: `https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json`
5. Click "Import"

**User Experience:**
```
User: "I need to sign in to my Target account"
→ GPT calls createTargetSession
→ GPT generates link: https://chatgpt-components-0d9232341440.herokuapp.com/auth?session=sess_abc
→ GPT: "Please click this link to sign in: [link]"
→ User clicks → sees Target login page → authenticates
→ User: "I'm done"
→ GPT calls getAuthStatus
→ GPT: "Welcome back, Lauren Bailey!"
```

---

## API Endpoints (for Custom GPT Actions)

### 1. Create Session
```http
POST /api/auth/create-session
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "Session created. Use this sessionId to check authentication status."
}
```

### 2. Check Auth Status
```http
GET /api/auth/status/{sessionId}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "authenticated": true,
  "email": "lauren@example.com",
  "name": "Lauren Bailey"
}
```

### 3. Authentication Page
```
https://chatgpt-components-0d9232341440.herokuapp.com/auth?session={sessionId}
```

---

## MCP Tools (for MCP Connector)

### 1. create-target-session
- Creates a new authentication session
- Returns session ID
- Optional (authenticate-target creates one automatically)

### 2. authenticate-target
- Shows the embedded Target login widget
- Requires session ID
- Displays 3-screen authentication flow

### 3. get-target-auth-status
- Checks authentication status
- Returns customer data (name, email)
- Does NOT show UI (just data)

---

## Demo Credentials

Both methods support any credentials (this is a demo):

**Login Screen:**
- Email: Any email works
- Password: Any password works

**Verification Code:**
- Any 6-digit code works

**Result:**
- Always authenticates as "Lauren Bailey"

---

## Which Method to Use?

| Feature | MCP Connector | Custom GPT Actions |
|---------|---------------|-------------------|
| Embedded UI in chat | ✅ | ❌ (opens link) |
| Setup required | MCP connection | Import schema |
| User friction | None | Must click link |
| Branding | Full | Full (on separate page) |
| Best for | ChatGPT users | Custom GPT builders |

**Recommendation:**
- Use **MCP Connector** for the best user experience
- Use **Custom GPT Actions** if you can't ask users to connect MCP

---

## Testing

### Test MCP Connector:
1. Connect: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
2. Say: "Log me into my Target account"
3. Complete the authentication flow
4. Verify ChatGPT addresses you as "Lauren Bailey"

### Test Custom GPT Actions:
1. Import schema: `https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json`
2. Say: "I need to authenticate to Target"
3. Click the generated link
4. Complete authentication
5. Say: "I'm done authenticating"
6. Verify GPT confirms your authentication

---

**Deployed Version:** v50
**Heroku App:** https://chatgpt-components-0d9232341440.herokuapp.com/

