# Example 1: Authentication MCP Server

> Session-based authentication with a 3-screen flow

**Live URL**: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`

## Overview

This MCP server demonstrates how to build a secure, multi-step authentication flow within ChatGPT. It showcases:
- Session management with unique IDs
- Multi-screen UI transitions
- State persistence across tool calls
- Widget-to-server communication

## Demo Flow

1. User: *"Log me into my Target account"*
2. ChatGPT creates a session ID
3. ChatGPT calls authentication tool → widget appears
4. User enters credentials (any work for demo)
5. User enters verification code (any 6 digits)
6. Success screen shows "Welcome Back, Lauren Bailey!"
7. ChatGPT knows user is authenticated as Lauren Bailey

## Architecture

### Tools

#### 1. `create-target-session`

**Purpose**: Generate a unique session ID for tracking authentication state

**Input**: None

**Output**:
```json
{
  "sessionId": "sess_1234567890_abc",
  "message": "Session created"
}
```

**Implementation**:
```javascript
const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
authSessions.set(sessionId, {
  authenticated: false,
  email: null,
  name: null,
  createdAt: Date.now()
});
```

#### 2. `authenticate-target`

**Purpose**: Display authentication widget and handle login flow

**Input**:
- `sessionId` (required): Session ID from `create-target-session`

**Output**:
- Widget displaying login form OR authenticated confirmation
- Text message for ChatGPT

**Implementation**:
```javascript
const session = authSessions.get(sessionId);
if (!session) {
  return { content: [{ type: 'text', text: 'Invalid session' }], isError: true };
}

if (session.authenticated) {
  // Show success message
} else {
  // Show login widget
  return {
    content: [{ type: 'text', text: 'Authentication required' }],
    widgetData: {
      html: fs.readFileSync('./widgets/target-auth.html', 'utf8')
        .replace('{{sessionId}}', sessionId)
        .replace('{{authenticated}}', 'false')
    }
  };
}
```

#### 3. `get-target-auth-status`

**Purpose**: Check authentication status without showing widget

**Input**:
- `sessionId` (required)

**Output**:
```json
{
  "authenticated": true,
  "email": "laurenbailey@gmail.com",
  "name": "Lauren Bailey"
}
```

**Why needed?**: After authentication, ChatGPT needs to retrieve user details without re-displaying the login widget.

### State Management

#### Session Storage

```javascript
const authSessions = new Map();

// Structure:
// sessionId -> {
//   authenticated: boolean,
//   email: string | null,
//   name: string | null,
//   createdAt: number
// }
```

#### Session Cleanup

Automatic cleanup prevents memory leaks:

```javascript
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of authSessions.entries()) {
    if (now - session.createdAt > 600000) { // 10 minutes
      authSessions.delete(id);
      console.log(`Cleaned up session: ${id}`);
    }
  }
}, 600000); // Run every 10 minutes
```

## Widget: target-auth.html

### Screens

#### Screen 1: Login

```html
<div id="login-screen">
  <input type="email" placeholder="Email address" />
  <input type="password" placeholder="Password" />
  <button id="sign-in-btn">Sign In</button>
</div>
```

**Behavior**:
- User enters email and password (any credentials work)
- Clicks "Sign In"
- Transitions to verification screen

#### Screen 2: Verification

```html
<div id="verification-screen" style="display: none;">
  <p>Enter the 6-digit code</p>
  <div class="code-inputs">
    <input maxlength="1" />
    <input maxlength="1" />
    <input maxlength="1" />
    <input maxlength="1" />
    <input maxlength="1" />
    <input maxlength="1" />
  </div>
</div>
```

**Behavior**:
- Auto-advance inputs as user types
- Any 6-digit code works
- Calls `/api/session/authenticate` to mark session as authenticated
- Transitions to success screen

#### Screen 3: Success

```html
<div id="success-screen" style="display: none;">
  <div class="checkmark">✓</div>
  <h2>Welcome Back!</h2>
  <p>Authenticated as Lauren Bailey</p>
</div>
```

**Behavior**:
- Shows green checkmark animation
- Displays hardcoded user name
- Calls `window.openai.setWidgetState({ authenticated: true })`

### Key JavaScript Functions

#### Transition Between Screens

```javascript
function showVerificationScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('verification-screen').style.display = 'flex';
  // Focus first input
  codeInputs[0].focus();
}

function showSuccessScreen() {
  document.getElementById('verification-screen').style.display = 'none';
  document.getElementById('success-screen').style.display = 'flex';
}
```

#### Auto-Advancing Code Inputs

```javascript
codeInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    if (e.target.value.length === 1 && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus(); // Move to next input
    }
    
    // Check if all 6 digits entered
    const code = Array.from(codeInputs).map(i => i.value).join('');
    if (code.length === 6) {
      verifyCode(); // Proceed to next screen
    }
  });
});
```

#### Mark Session as Authenticated

```javascript
async function markSessionAuthenticated() {
  const response = await fetch('/api/session/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      email: emailInput.value,
      name: 'Lauren Bailey' // Hardcoded for demo
    })
  });
  
  const data = await response.json();
  if (data.success) {
    showSuccessScreen();
    
    // Notify ChatGPT
    if (window.openai?.setWidgetState) {
      window.openai.setWidgetState({
        authenticated: true,
        email: emailInput.value,
        name: 'Lauren Bailey',
        sessionId: sessionId
      });
    }
  }
}
```

### Dark/Light Mode Support

```javascript
// Get theme from ChatGPT
if (window.openai?.theme) {
  window.openai.theme.get().then(theme => {
    document.body.className = theme;
  });
  
  window.openai.theme.subscribe(theme => {
    document.body.className = theme;
  });
}
```

```css
/* Theme-specific styles */
body.light {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

body.dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
}

body.light .auth-card {
  background: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

body.dark .auth-card {
  background: #2a2a3e;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
```

## Server Endpoints

### SSE Endpoint: `GET /mcp`

Establishes SSE connection for ChatGPT to call tools:

```javascript
app.get('/mcp', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createPizzazServer();
  const transport = new SSEServerTransport('/messages', res);
  
  await server.connect(transport);
  
  sseConnections.set(Date.now().toString(), res);
  
  req.on('close', () => {
    transport.close();
  });
});
```

### Message Endpoint: `POST /messages`

Receives JSON-RPC messages from ChatGPT:

```javascript
app.post('/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});
```

### Authentication Endpoint: `POST /api/session/authenticate`

Called by widget to mark session as authenticated:

```javascript
app.post('/api/session/authenticate', express.json(), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { sessionId, email, name } = req.body;
  
  if (authSessions.has(sessionId)) {
    authSessions.set(sessionId, {
      authenticated: true,
      email: email,
      name: name,
      createdAt: authSessions.get(sessionId).createdAt
    });
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});
```

## Usage Examples

### Basic Authentication

```
You: Log me into my Target account

ChatGPT: [Creates session, displays login widget]

[You enter credentials in widget]

ChatGPT: You're now authenticated as Lauren Bailey!
```

### Check Status

```
You: Am I logged in?

ChatGPT: [Calls get-target-auth-status]
         Yes, you're logged in as Lauren Bailey (laurenbailey@gmail.com)
```

### Session Expires

```
You: [Wait 10+ minutes]
     Am I still logged in?

ChatGPT: [Calls get-target-auth-status]
         Your session has expired. Please log in again.
```

## Customization Guide

### Change Hardcoded User

In `widgets/target-auth.html`:

```javascript
// Change this line
name: 'Lauren Bailey'

// To your preferred name
name: 'John Doe'
```

In `server.js` (if you want to simulate different users):

```javascript
const DEMO_USERS = {
  'user1@example.com': { name: 'Alice Smith', role: 'admin' },
  'user2@example.com': { name: 'Bob Jones', role: 'user' }
};

// In authenticate endpoint
const user = DEMO_USERS[email] || { name: 'Guest User', role: 'guest' };
```

### Add Real Authentication

Replace demo logic with actual authentication:

```javascript
// Instead of always accepting credentials
const isValid = await verifyCredentials(email, password);

if (!isValid) {
  return { error: 'Invalid credentials' };
}

// Verify 2FA code
const isCodeValid = await verify2FACode(email, code);
```

### Change Branding

In `widgets/target-auth.html`:

```html
<!-- Change logo -->
<img src="your-logo-url.png" alt="Your Brand" />

<!-- Change colors -->
<style>
  body.light {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
  }
  
  .sign-in-btn {
    background: #your-brand-color;
  }
</style>
```

## Testing Checklist

- [ ] Session creation returns unique IDs
- [ ] Login widget displays correctly
- [ ] Any email/password works (demo mode)
- [ ] Verification code auto-advances inputs
- [ ] Any 6-digit code works
- [ ] Success screen appears with correct name
- [ ] ChatGPT receives authenticated state
- [ ] `get-target-auth-status` returns correct data
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] Session cleanup works (wait 10+ minutes)
- [ ] Multiple sessions don't interfere

## Common Issues

### Widget shows "Loading..." indefinitely

**Cause**: `sessionId` not passed to widget

**Fix**: Ensure `authenticate-target` is called AFTER `create-target-session`

### "Session not found" error

**Cause**: Session expired or never created

**Fix**: Create a new session with `create-target-session`

### Widget appears twice

**Cause**: ChatGPT calling `authenticate-target` multiple times

**Fix**: This is expected behavior. The second call should show the success screen if already authenticated.

## Next Steps

- Add real OAuth integration (Google, Microsoft)
- Store sessions in Redis for persistence
- Add password reset flow
- Implement rate limiting
- Add CAPTCHA for security
- Support multiple user profiles

---

**Related Examples**:
- [Product Search](product-search.md) - Uses authentication session
- [Checkout](checkout.md) - Requires authenticated user
- [Architecture](../ARCHITECTURE.md) - System overview


