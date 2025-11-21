# 🏗️ Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           ChatGPT UI                            │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │   User Chat  │     │   Component  │     │   Component  │  │
│  │   Messages   │     │    Iframe    │     │    Iframe    │  │
│  │              │     │  (auth.html) │     │(profile.html)│  │
│  └──────────────┘     └──────────────┘     └──────────────┘  │
│         ↕                     ↕                     ↕          │
└─────────────────────────────────────────────────────────────────┘
                               ↕
                         MCP Protocol
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Server (Node.js)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                               │  │
│  │  • /.well-known/mcp.json    → Server metadata            │  │
│  │  • POST /mcp/tools/list     → Available tools            │  │
│  │  • POST /mcp/tools/call     → Execute tool               │  │
│  │  • POST /api/authenticate   → Login handler              │  │
│  │  • GET  /api/session/:id    → Check auth status          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tools:                                                   │  │
│  │  • authenticate_user  → Shows auth component             │  │
│  │  • get_user_profile   → Returns user info                │  │
│  │  • show_profile       → Shows profile component          │  │
│  │  • logout_user        → Clears session                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Session Storage (In-Memory Map)                          │  │
│  │  sessionId → { user: { id, email, name, ... } }          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               ↕
                         Static Files
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                      public/components/                          │
│                                                                 │
│  ┌──────────────┐                      ┌──────────────┐        │
│  │  auth.html   │                      │ profile.html │        │
│  │              │                      │              │        │
│  │ • Login form │                      │ • User card  │        │
│  │ • Validation │                      │ • Stats      │        │
│  │ • OAuth UI   │                      │ • Actions    │        │
│  └──────────────┘                      └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow: User Authentication

```
Step 1: User Request
┌─────────────┐
│   ChatGPT   │ User types: "I want to log in"
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Model (GPT) │ Decides to call: authenticate_user tool
└──────┬──────┘
       
Step 2: Tool Call
       │
       ↓ POST /mcp/tools/call
┌─────────────┐
│ MCP Server  │ Returns: Component URL + initial data
└──────┬──────┘
       │ { componentUrl: ".../auth.html",
       │   data: { sessionId: "sess_abc123", message: "..." } }
       ↓
       
Step 3: Component Render
┌─────────────┐
│   ChatGPT   │ Renders component in iframe
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  auth.html  │ 1. Loads in iframe
│  Component  │ 2. Reads window.openai.toolOutput
└──────┬──────┘ 3. Initializes with sessionId
       │
       
Step 4: User Interaction
       │
       ↓ User fills form and clicks "Sign In"
┌─────────────┐
│  auth.html  │ Submits: { email, password, sessionId }
└──────┬──────┘
       │
       ↓ POST /api/authenticate
       
Step 5: Authentication
┌─────────────┐
│ MCP Server  │ 1. Validates credentials
│             │ 2. Creates user object
│             │ 3. Stores in sessions Map
│             │ 4. Returns success + user data
└──────┬──────┘
       │
       ↓
       
Step 6: Success Feedback
┌─────────────┐
│  auth.html  │ 1. Shows success message
│  Component  │ 2. Calls window.openai.sendFollowUpMessage()
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   ChatGPT   │ Displays: "Successfully authenticated as John"
└─────────────┘
```

## Data Flow: Session Management

```
┌─────────────────────┐
│  ChatGPT Context    │
│  - Conversation     │
│  - Tool history     │
│  - Active sessionId │
└──────────┬──────────┘
           │
           ↕ MCP Protocol
           │
┌──────────┴──────────┐
│   MCP Server        │
│                     │
│  sessions = Map {   │
│    "sess_abc": {    │
│      user: {        │
│        id: "usr_1"  │
│        email: "..." │
│        name: "..."  │
│      }              │
│    }                │
│  }                  │
└──────────┬──────────┘
           │
           ↕ HTTP API
           │
┌──────────┴──────────┐
│  Component (iframe) │
│                     │
│  window.openai = {  │
│    toolOutput: {    │
│      data: {        │
│        sessionId    │
│        ...         │
│      }              │
│    },               │
│    sendFollowUp,    │
│    setWidgetState   │
│  }                  │
└─────────────────────┘
```

## Component Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION                                            │
└──────────────────────────────────────────────────────────────┘
    ChatGPT calls tool
         ↓
    MCP Server returns component URL + data
         ↓
    ChatGPT creates iframe with URL
         ↓
    Component HTML loads
         ↓
    JavaScript reads window.openai.toolOutput

┌──────────────────────────────────────────────────────────────┐
│ 2. RENDERING                                                 │
└──────────────────────────────────────────────────────────────┘
    Component parses initial data
         ↓
    Sets up UI based on data
         ↓
    Renders form/content
         ↓
    Attaches event listeners

┌──────────────────────────────────────────────────────────────┐
│ 3. INTERACTION                                               │
└──────────────────────────────────────────────────────────────┘
    User interacts with UI
         ↓
    Component validates input
         ↓
    Makes API call to server
         ↓
    Updates UI based on response

┌──────────────────────────────────────────────────────────────┐
│ 4. COMMUNICATION                                             │
└──────────────────────────────────────────────────────────────┘
    Component calls window.openai.sendFollowUpMessage()
         ↓
    ChatGPT receives message
         ↓
    Model processes message
         ↓
    May trigger additional tool calls

┌──────────────────────────────────────────────────────────────┐
│ 5. STATE PERSISTENCE                                         │
└──────────────────────────────────────────────────────────────┘
    Component calls window.openai.setWidgetState()
         ↓
    ChatGPT stores state
         ↓
    On next tool call, state is available
         ↓
    Component can restore previous state
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

1. IFRAME SANDBOX
   ┌─────────────────────┐
   │   Component runs    │
   │   in sandboxed      │ ← Isolated from ChatGPT domain
   │   iframe            │
   └─────────────────────┘

2. CONTENT SECURITY POLICY (CSP)
   • Only allow loading from specified domains
   • Prevent XSS attacks
   • Control script execution

3. CORS (Cross-Origin Resource Sharing)
   • Server explicitly allows ChatGPT origin
   • Validates requests

4. SESSION MANAGEMENT
   • Short-lived sessions
   • Secure session IDs
   • Server-side validation

5. OAUTH 2.1 (Production)
   • Industry standard authentication
   • Token-based authorization
   • No password storage
```

## Technology Stack

```
Frontend (Component)
├── HTML5
├── CSS3 (with CSS Variables)
├── Vanilla JavaScript
└── window.openai API

Backend (MCP Server)
├── Node.js (ES Modules)
├── Express.js
├── CORS middleware
└── dotenv (config)

Protocol
└── MCP (Model Context Protocol)
    ├── Tool definitions
    ├── Component metadata
    └── OAuth configuration

Deployment
├── Development: localhost
└── Production options:
    ├── Vercel
    ├── Railway
    ├── Heroku
    └── DigitalOcean
```

## File Structure

```
ChatGPT Components/
│
├── 📄 server.js                 # MCP server (Express)
│   ├── Metadata endpoint
│   ├── Tools definition
│   ├── Tool execution
│   ├── Auth API
│   └── Session management
│
├── 📁 public/
│   └── 📁 components/
│       ├── auth.html            # Login component
│       └── profile.html         # Profile component
│
├── 📄 package.json              # Dependencies
├── 📄 .env                      # Configuration
├── 📄 .gitignore               # Git ignore rules
│
└── 📚 Documentation/
    ├── README.md                # Main documentation
    ├── SETUP_GUIDE.md          # Quick start guide
    └── ARCHITECTURE.md         # This file
```

## API Endpoints Reference

### MCP Protocol Endpoints

#### `GET /.well-known/mcp.json`
Returns server metadata and capabilities.

**Response:**
```json
{
  "name": "Authentication Example",
  "description": "...",
  "version": "1.0.0",
  "capabilities": {
    "tools": true,
    "ui": true
  },
  "oauth": { ... }
}
```

#### `POST /mcp/tools/list`
Lists all available tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "authenticate_user",
      "description": "...",
      "inputSchema": { ... },
      "ui": { ... }
    }
  ]
}
```

#### `POST /mcp/tools/call`
Executes a tool.

**Request:**
```json
{
  "name": "authenticate_user",
  "arguments": { ... },
  "sessionId": "sess_abc123"
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "component",
      "componentUrl": "http://localhost:3000/components/auth.html",
      "data": { ... }
    }
  ]
}
```

### Custom API Endpoints

#### `POST /api/authenticate`
Authenticates a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "sessionId": "sess_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_xyz",
    "email": "user@example.com",
    "name": "user"
  }
}
```

#### `GET /api/session/:sessionId`
Checks authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": { ... }
}
```

## window.openai API

Components have access to the `window.openai` object:

```javascript
// Get initial data
const toolOutput = window.openai.toolOutput;
// { data: { sessionId: "...", message: "..." } }

// Send a follow-up message to ChatGPT
window.openai.sendFollowUpMessage({
  role: 'user',
  content: 'Successfully authenticated!'
});

// Persist state for next tool call
window.openai.setWidgetState({
  scrollPosition: 100,
  selectedTab: 'profile'
});

// Get previously saved state
const state = window.openai.getWidgetState();

// Call another tool
const result = await window.openai.callTool({
  name: 'get_user_profile',
  arguments: {}
});
```

## Scaling Considerations

### From Prototype to Production

#### 1. Session Storage
```
Development:  In-memory Map
            ↓
Production:   Redis / PostgreSQL / MongoDB
```

#### 2. Authentication
```
Development:  Simple email/password
            ↓
Production:   OAuth 2.1 (Auth0, Okta, Google)
```

#### 3. Hosting
```
Development:  localhost:3000
            ↓
Production:   Cloud provider with HTTPS
```

#### 4. State Management
```
Development:  Server-side sessions
            ↓
Production:   Distributed cache (Redis)
                + Database backup
```

#### 5. Security
```
Development:  Basic validation
            ↓
Production:   • Rate limiting
              • CSRF protection
              • Input sanitization
              • Security headers
              • Audit logging
```

## Performance Optimization

```
┌─────────────────────────────────────┐
│ Component Loading                    │
├─────────────────────────────────────┤
│ • Minimize HTML/CSS/JS size         │
│ • Use CDN for assets               │
│ • Lazy load images                 │
│ • Cache static resources           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Server Response Time                 │
├─────────────────────────────────────┤
│ • Cache tool definitions           │
│ • Use connection pooling           │
│ • Optimize database queries        │
│ • Implement request debouncing     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ State Synchronization                │
├─────────────────────────────────────┤
│ • Minimize state transfers         │
│ • Use efficient JSON structures    │
│ • Batch API calls                  │
│ • Implement optimistic updates     │
└─────────────────────────────────────┘
```

## Common Patterns

### 1. Progressive Enhancement
Start with basic functionality, add features:
- Basic form → Validation → OAuth → 2FA

### 2. Error Recovery
Always provide fallbacks:
- Component fails → Show structured JSON
- API error → Retry with exponential backoff
- Session expired → Prompt re-authentication

### 3. State Synchronization
Keep component and ChatGPT in sync:
- Use `setWidgetState()` for persistence
- Send meaningful follow-up messages
- Update UI based on tool responses

### 4. Responsive Design
Support all screen sizes:
- Mobile-first CSS
- Flexible layouts
- Touch-friendly interactions

## Debug Checklist

```
□ Server is running (check terminal)
□ Port 3000 is not in use
□ Browser console shows no errors
□ Network tab shows successful requests
□ MCP metadata is accessible
□ ChatGPT Developer Mode is enabled
□ App is created in ChatGPT
□ SessionId is being passed correctly
□ CORS headers are set
□ Component loads in standalone mode
```

---

This architecture is designed to be:
- **Scalable**: Easy to add new components and tools
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple layers of security
- **Extensible**: Simple to integrate with existing systems
- **User-friendly**: Smooth experience in ChatGPT

