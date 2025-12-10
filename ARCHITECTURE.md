# Architecture Overview

This document explains how MCP servers work and how this project is structured.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         ChatGPT                              │
│                                                              │
│  ┌─────────────┐        ┌──────────────────────────────┐   │
│  │ Chat Window │───────▶│ MCP Connector Manager        │   │
│  └─────────────┘        └──────────────────────────────┘   │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       │ SSE (Server-Sent Events)
                                       │ + JSON-RPC
                                       │
┌──────────────────────────────────────▼───────────────────────┐
│                    Your MCP Server                           │
│                  (Node.js + Express)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MCP Protocol Layer (@modelcontextprotocol/sdk)       │  │
│  │  - SSE Transport                                     │  │
│  │  - Tool Registration                                 │  │
│  │  - Request/Response Handling                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┼─────────────────────────────┐   │
│  │                       ▼                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ MCP1: Authentication                        │   │   │
│  │  │  - create-target-session                    │   │   │
│  │  │  - authenticate-target                      │   │   │
│  │  │  - get-target-auth-status                   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ MCP2: Product Search                        │   │   │
│  │  │  - search-target-products                   │   │   │
│  │  │  - get-agentforce-recommendations           │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ MCP3: Checkout                              │   │   │
│  │  │  - add-to-cart                              │   │   │
│  │  │  - checkout                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ MCP4: Membership                            │   │   │
│  │  │  - check-circle-membership                  │   │   │
│  │  │  - circle-signup                            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────┼─────────────────────────────┐   │
│  │                       ▼                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Session Management                          │   │   │
│  │  │  - authSessions (Map)                       │   │   │
│  │  │  - cartStorage (Map)                        │   │   │
│  │  │  - sseConnections (Map)                     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────┼─────────────────────────────┐   │
│  │                       ▼                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ External APIs                               │   │   │
│  │  │  - Unwrangle API (product data)             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### Example: Authentication Flow

```
User: "Sign me into Target"
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ ChatGPT analyzes request and decides to use authentication │
└────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 1: Create Session                                     │
│                                                            │
│ ChatGPT ──▶ POST /mcp/messages                            │
│             { tool: "create-target-session" }              │
│                                                            │
│ Server ───▶ Generate sessionId: "sess_1234567890_abc"    │
│                                                            │
│ Server ───▶ Store in authSessions Map:                   │
│             { authenticated: false, createdAt: ... }       │
│                                                            │
│ Server ───▶ Return to ChatGPT:                           │
│             { sessionId: "sess_1234567890_abc" }          │
└────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 2: Show Authentication Widget                        │
│                                                            │
│ ChatGPT ──▶ POST /mcp/messages                            │
│             { tool: "authenticate-target",                 │
│               args: { sessionId: "sess_..." } }           │
│                                                            │
│ Server ───▶ Lookup session in authSessions                │
│                                                            │
│ Server ───▶ Return widget response:                      │
│             {                                              │
│               type: "widget",                              │
│               widget: "target-auth",                       │
│               data: {                                      │
│                 sessionId: "sess_...",                     │
│                 authenticated: false                       │
│               }                                            │
│             }                                              │
│                                                            │
│ ChatGPT ──▶ Render widget in iframe                      │
│             Load: /widgets/target-auth.html                │
└────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Step 3: User Interacts with Widget                        │
│                                                            │
│ Widget ───▶ Loaded in ChatGPT iframe                     │
│                                                            │
│ Widget ───▶ await window.openai.toolOutput()             │
│             → { sessionId: "sess_...", authenticated: false }│
│                                                            │
│ Widget ───▶ Show login form                               │
│                                                            │
│ User ─────▶ Enters email + password                      │
│                                                            │
│ User ─────▶ Clicks "Sign In"                             │
│                                                            │
│ Widget ───▶ POST /api/session/authenticate                │
│             { sessionId: "sess_...",                       │
│               email: "laurenbailey@gmail.com",             │
│               name: "Lauren Bailey" }                      │
│                                                            │
│ Server ───▶ Update authSessions Map:                     │
│             { authenticated: true,                         │
│               email: "laurenbailey@gmail.com",             │
│               name: "Lauren Bailey" }                      │
│                                                            │
│ Widget ───▶ await window.openai.setWidgetState(...)      │
│             → Save state for ChatGPT                       │
│                                                            │
│ Widget ───▶ await window.openai.sendFollowUpMessage(      │
│               "Successfully authenticated as Lauren Bailey"│
│             )                                              │
│                                                            │
│ ChatGPT ──▶ Receives message and continues conversation  │
└────────────────────────────────────────────────────────────┘
```

---

## MCP Protocol Deep Dive

### What is MCP?

**Model Context Protocol (MCP)** is a standard protocol for AI assistants to interact with external tools and services. It defines:

1. **Tool Registration**: How servers advertise available tools
2. **Request Format**: How ChatGPT calls tools (JSON-RPC)
3. **Response Format**: How servers return data and widgets
4. **Transport**: How data flows (SSE for real-time, POST for requests)

### Transport Layer: SSE (Server-Sent Events)

SSE is a one-way persistent connection from server → client.

**Why SSE?**
- Persistent connection stays open
- Server can push updates to ChatGPT
- Low latency for real-time interactions
- Native browser support

**SSE Endpoint**: `/mcp`, `/mcp2`, `/mcp3`, `/mcp4`

```javascript
// Server sets up SSE
app.get('/mcp', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send keep-alive pings
  const intervalId = setInterval(() => {
    res.write(':ping\n\n');
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});
```

### Request Layer: JSON-RPC

Tool calls use JSON-RPC 2.0 over HTTP POST.

**POST Endpoint**: `/mcp/messages`

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "authenticate-target",
    "arguments": {
      "sessionId": "sess_1234567890_abc"
    }
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "widget",
        "widget": "target-auth",
        "data": {
          "sessionId": "sess_1234567890_abc",
          "authenticated": false
        }
      },
      {
        "type": "text",
        "text": "Authentication widget displayed"
      }
    ],
    "structuredContent": {
      "sessionId": "sess_1234567890_abc",
      "status": "pending"
    }
  }
}
```

---

## Widget Architecture

### Widget Lifecycle

```
1. Server returns widget in tool response
     │
     ▼
2. ChatGPT creates iframe and loads widget HTML
     │
     ▼
3. Widget HTML loads and runs JavaScript
     │
     ▼
4. Widget calls window.openai.toolOutput() to get data
     │
     ▼
5. Widget renders UI based on data
     │
     ▼
6. User interacts with widget
     │
     ▼
7. Widget calls backend APIs
     │
     ▼
8. Widget calls window.openai.sendFollowUpMessage()
     │
     ▼
9. ChatGPT receives message and continues conversation
```

### Widget Communication APIs

The `window.openai` object provides these methods:

#### 1. Get Data from Server

```javascript
const toolOutput = await window.openai.toolOutput();
// Returns the 'data' object from server's widget response
```

#### 2. Send Messages to ChatGPT

```javascript
await window.openai.sendFollowUpMessage('User completed action');
// ChatGPT receives this and can respond
```

#### 3. Save Widget State

```javascript
await window.openai.setWidgetState({
  step: 'completed',
  userId: 123
});
// Saved state is passed back if widget is re-rendered
```

#### 4. Get Current Theme

```javascript
const theme = await window.openai.theme();
// Returns 'light' or 'dark'
```

#### 5. Listen for Theme Changes

```javascript
window.openai.addEventListener('themeChanged', async () => {
  const newTheme = await window.openai.theme();
  applyTheme(newTheme);
});
```

#### 6. Notify Background Color (Optional)

```javascript
window.openai.notifyBackgroundColor('#1a1a1a');
// Helps ChatGPT adjust surrounding UI
```

---

## State Management

### Server-Side State

All state is stored in memory using JavaScript `Map` objects:

```javascript
// Authentication sessions
const authSessions = new Map();
// Key: sessionId (string)
// Value: { authenticated: boolean, email: string, name: string, createdAt: number }

// Shopping cart
const cartStorage = new Map();
// Key: sessionId (string)
// Value: { items: Array, createdAt: number }

// SSE connections
const sseConnections = new Map();
// Key: sessionId (string)
// Value: Response object
```

### Session Cleanup

Sessions are automatically cleaned up after 10 minutes:

```javascript
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of authSessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      authSessions.delete(sessionId);
    }
  }
}, 60000); // Run every minute
```

### Why In-Memory?

- **Simplicity**: No database setup required
- **Fast**: Sub-millisecond lookups
- **Demo-Friendly**: Easy to reset between demos
- **Sufficient**: Works for moderate traffic

**For Production**: Replace with Redis or PostgreSQL for persistence and scalability.

---

## Security Considerations

### CORS (Cross-Origin Resource Sharing)

```javascript
app.use(cors({
  origin: '*', // Allow ChatGPT to connect
  credentials: true
}));
```

**Note**: In production, restrict to ChatGPT's domains only.

### Input Validation

```javascript
// Always validate tool inputs
if (!sessionId || typeof sessionId !== 'string') {
  throw new Error('Invalid sessionId');
}

if (!sessionId.startsWith('sess_')) {
  throw new Error('Invalid sessionId format');
}
```

### API Key Management

```javascript
// Never commit API keys to Git
const UNWRANGLE_API_KEY = process.env.UNWRANGLE_API_KEY;

if (!UNWRANGLE_API_KEY) {
  console.warn('UNWRANGLE_API_KEY not set, MCP2 will not work');
}
```

### Rate Limiting

```javascript
// Implement rate limiting for production
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Max 100 requests per 15 minutes
});

app.use('/api/', limiter);
```

---

## Performance Optimization

### Caching API Responses

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedProducts(query) {
  const cached = cache.get(query);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchProducts(query);
  cache.set(query, { data, timestamp: Date.now() });
  
  return data;
}
```

### Widget Loading Optimization

```javascript
// Minimize widget HTML size
// - Inline CSS (avoid external stylesheets)
// - Inline JavaScript (avoid external scripts)
// - Compress images or use SVG
// - Minimize DOM elements
```

### Connection Pooling

For production with databases:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max 20 connections
  idleTimeoutMillis: 30000
});
```

---

## Scaling Strategy

### Vertical Scaling (Single Server)

- Increase Heroku dyno size (Hobby → Standard → Performance)
- Add more memory and CPU
- Good for: < 1000 concurrent users

### Horizontal Scaling (Multiple Servers)

- Use Heroku's load balancer
- Store sessions in Redis (shared across servers)
- Use CDN for static assets (widgets, images)
- Good for: > 1000 concurrent users

```javascript
// Replace Map with Redis
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Store session
await client.set(`session:${sessionId}`, JSON.stringify(session));
await client.expire(`session:${sessionId}`, 600); // 10 minutes

// Retrieve session
const sessionData = await client.get(`session:${sessionId}`);
const session = JSON.parse(sessionData);
```

---

## Error Handling

### Server-Side Errors

```javascript
try {
  // Tool logic here
} catch (error) {
  console.error('Tool error:', error);
  
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
```

### Widget-Side Errors

```javascript
window.addEventListener('error', (event) => {
  console.error('Widget error:', event.error);
  showErrorScreen('Something went wrong. Please try again.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showErrorScreen('Something went wrong. Please try again.');
});
```

---

## Monitoring & Logging

### Server Logs

```javascript
// Log all tool calls
console.log(`[${new Date().toISOString()}] Tool called: ${toolName}`, params);

// Log errors
console.error(`[${new Date().toISOString()}] Error in ${toolName}:`, error);

// Log session events
console.log(`[${new Date().toISOString()}] Session created: ${sessionId}`);
```

### Heroku Logs

```bash
# View real-time logs
heroku logs --tail

# Search for errors
heroku logs --tail | grep ERROR

# View last 1000 lines
heroku logs --num 1000
```

### Production Monitoring

For production, use services like:
- **Sentry**: Error tracking
- **LogDNA/Papertrail**: Log aggregation
- **New Relic**: Performance monitoring
- **Pingdom**: Uptime monitoring

---

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Node.js server (localhost:8000)
├── Live reload on file changes
└── Direct connection to ChatGPT
```

### Production Environment (Heroku)

```
Internet
    │
    ▼
Heroku Load Balancer
    │
    ▼
Heroku Dyno (Container)
├── Node.js server
├── Environment variables
└── Automatic SSL (HTTPS)
    │
    ▼
External APIs (Unwrangle, etc.)
```

---

## Next Steps

Now that you understand the architecture:

1. **Read the Code**: Start with `server.js` and trace a request flow
2. **Modify a Widget**: Change colors, text, or add features
3. **Add a New Tool**: Follow the patterns in existing tools
4. **Deploy Your Changes**: Push to Heroku and test

Happy building! 🚀

