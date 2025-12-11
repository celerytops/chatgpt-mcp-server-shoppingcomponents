# Architecture Overview

> How the ChatGPT MCP Server system works under the hood

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           ChatGPT UI                              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  Chat Thread   │  │  Widget Iframe │  │  Widget Iframe  │   │
│  │                │  │                │  │                 │   │
│  │  User: Login   │  │ ┌────────────┐ │  │ ┌─────────────┐│   │
│  │  AI: *widget*  │  │ │ Auth Form  │ │  │ │  Products   ││   │
│  │                │  │ │            │ │  │ │             ││   │
│  │                │  │ │  [Submit]  │ │  │ │  [Carousel] ││   │
│  │                │  │ └────────────┘ │  │ └─────────────┘│   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│          │                    │                    │             │
│          │ SSE                │ window.openai      │             │
│          ▼                    ▼                    ▼             │
└──────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │  HTTP fetch()      │
           │                    └────────┬───────────┘
           │                             │
           ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Node.js Express Server                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   /mcp      │  │   /mcp2     │  │   /mcp3     │ ... /mcp4   │
│  │  Auth MCP   │  │  Search MCP │  │Checkout MCP │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                    │
│         └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                  ┌────────┴────────┐                            │
│                  │ State Storage   │                            │
│                  │ - authSessions  │                            │
│                  │ - cartStorage   │                            │
│                  │ - sseConnections│                            │
│                  └─────────────────┘                            │
│                           │                                      │
│  ┌────────────────────────┴──────────────────────┐             │
│  │          Widget Files (HTML)                   │             │
│  │  - target-auth.html                           │             │
│  │  - product-carousel.html                      │             │
│  │  - checkout.html                              │             │
│  │  - circle-signup.html                         │             │
│  └────────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
           │
           │ HTTP
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      External APIs                                │
│  - Unwrangle Product Search API                                  │
│  - Payment Processing (simulated)                                │
│  - User Database (simulated)                                     │
└──────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. ChatGPT UI Layer

**Responsibilities:**
- Display chat conversation
- Render widgets in iframes
- Handle user interactions
- Manage MCP connections

**Communication:**
- **Outbound**: Calls MCP tools via SSE
- **Inbound**: Receives widget HTML and data

### 2. MCP Servers (4 servers on one Node.js app)

Each MCP server is isolated with its own:
- Tool definitions
- State management
- SSE endpoint (`/mcp`, `/mcp2`, `/mcp3`, `/mcp4`)
- Message handler endpoint

#### MCP Server 1: Authentication (`/mcp`)

**Tools:**
- `create-target-session`: Generate unique session ID
- `authenticate-target`: Show login widget
- `get-target-auth-status`: Check authentication status

**State:**
- `authSessions`: Map<sessionId, userData>

**Widgets:**
- `target-auth.html`: 3-screen login flow

#### MCP Server 2: Product Search (`/mcp2`)

**Tools:**
- `search-target-products`: Display product carousel
- `get-agentforce-recommendations`: Fetch personalized suggestions

**State:**
- `sseConnections2`: Active SSE connections

**Widgets:**
- `product-carousel.html`: Interactive product browser

**External APIs:**
- Unwrangle Product Search API

#### MCP Server 3: Checkout (`/mcp3`)

**Tools:**
- `add-to-cart`: Add item to cart
- `checkout`: Complete purchase

**State:**
- `cartStorage`: Map<sessionId, cartItems>
- `sseConnections3`: Active connections

**Widgets:**
- `add-to-cart.html`: Confirmation screen
- `checkout.html`: Purchase flow

#### MCP Server 4: Membership (`/mcp4`)

**Tools:**
- `check-circle-membership`: Check membership status
- `circle-signup`: Enroll in Circle 360

**State:**
- `sseConnections4`: Active connections

**Widgets:**
- `circle-signup.html`: Tier selection and signup

### 3. State Management

#### Session Storage

```javascript
// In-memory Maps
const authSessions = new Map();     // sessionId -> { authenticated, email, name }
const cartStorage = new Map();      // sessionId -> { product, quantity }
const sseConnections = new Map();   // sessionId -> SSE response
const sseConnections2 = new Map();  // MCP2 connections
const sseConnections3 = new Map();  // MCP3 connections
const sseConnections4 = new Map();  // MCP4 connections
```

#### Session Lifecycle

1. **Creation**: User calls `create-target-session`
2. **Usage**: Session ID passed to all subsequent tools
3. **Cleanup**: Automatic removal after 10 minutes of inactivity
4. **Reset**: `/api/demo/reset` endpoint clears all state

### 4. Widget Layer

Widgets are self-contained HTML files with:
- Inline CSS
- Inline JavaScript
- No external dependencies

#### Widget Communication Patterns

**A. Widget → Server (HTTP)**
```javascript
// Widget makes fetch() call to server endpoint
const response = await fetch('/api/session/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, email })
});
```

**B. Widget → ChatGPT (window.openai)**
```javascript
// Send follow-up message
window.openai.sendFollowUpMessage({
  message: "I've authenticated!",
  includeHistory: false
});

// Update widget state
window.openai.setWidgetState({ authenticated: true });

// Send tool output
window.openai.toolOutput({ result: 'success' });
```

**C. ChatGPT → Widget (props injection)**
```javascript
// Server injects data into HTML
widgetData: {
  html: `
    <script>
      const sessionId = "${sessionId}";
      const products = ${JSON.stringify(products)};
    </script>
  `
}
```

**D. Widget ← ChatGPT Theme (window.openai.theme)**
```javascript
// Subscribe to theme changes
window.openai.theme.subscribe((theme) => {
  document.body.className = theme; // 'light' or 'dark'
});
```

## Communication Protocols

### Server-Sent Events (SSE)

ChatGPT maintains persistent connections to MCP servers via SSE:

```javascript
// Client (ChatGPT) connects
GET /mcp
Accept: text/event-stream

// Server responds with SSE stream
HTTP/1.1 200 OK
Content-Type: text/event-stream
Connection: keep-alive

data: {"jsonrpc":"2.0","method":"initialized",...}

// Tool call from ChatGPT
POST /messages
Content-Type: application/json

{"jsonrpc":"2.0","method":"tools/call","params":{...}}

// Server responds via SSE stream
data: {"jsonrpc":"2.0","result":{...}}
```

### JSON-RPC 2.0

All MCP communication uses JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "authenticate-target",
    "arguments": {
      "sessionId": "sess_abc123"
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "Authentication required"
    }],
    "widgetData": {
      "html": "<!DOCTYPE html>..."
    }
  }
}
```

## Data Flow Examples

### Example 1: User Authentication

```
User: "Log me into Target"
    │
    ▼
ChatGPT calls create-target-session
    │
    ▼
MCP1: Generate sessionId = "sess_abc123"
      Store in authSessions: { authenticated: false }
    │
    ▼
Return: { sessionId: "sess_abc123" }
    │
    ▼
ChatGPT calls authenticate-target(sessionId)
    │
    ▼
MCP1: Check authSessions["sess_abc123"]
      Not authenticated → Show login widget
    │
    ▼
Return: { widgetData: { html: target-auth.html } }
    │
    ▼
ChatGPT: Render widget in iframe
    │
    ▼
User: Enters email + password, clicks "Sign In"
    │
    ▼
Widget: fetch('/api/session/authenticate', { sessionId })
    │
    ▼
MCP1: Update authSessions["sess_abc123"] = { 
        authenticated: true, 
        email: "lauren@example.com",
        name: "Lauren Bailey"
      }
    │
    ▼
Widget: Show success screen
        window.openai.setWidgetState({ authenticated: true })
    │
    ▼
ChatGPT: Receives state update
    │
    ▼
ChatGPT calls get-target-auth-status(sessionId)
    │
    ▼
MCP1: Return authSessions["sess_abc123"] data
    │
    ▼
ChatGPT: "You're logged in as Lauren Bailey"
```

### Example 2: Product Search

```
User: "Search for fitness trackers"
    │
    ▼
ChatGPT calls search-target-products(query: "fitness trackers", page: 1)
    │
    ▼
MCP2: fetch('https://data.unwrangle.com/api/getter/?...')
    │
    ▼
Unwrangle API: Returns 50 products
    │
    ▼
MCP2: Take top 10 products
      Inject into product-carousel.html
    │
    ▼
Return: {
  widgetData: { html: "...with products..." },
  structuredContent: { products: [...] }
}
    │
    ▼
ChatGPT: Render carousel widget
    │
    ▼
ChatGPT calls get-agentforce-recommendations(same query)
    │
    ▼
MCP2: Same API call, get all 50 products
      Build personalized message
    │
    ▼
Return: {
  text: "Based on your history, recommend Fitbit Charge 6...",
  structuredContent: { full product data }
}
    │
    ▼
ChatGPT: "I found 10 fitness trackers. Based on your husband's
          Fitbit Charge 3 and running history, I recommend..."
```

### Example 3: Checkout

```
User: "Add the Fitbit to my cart and checkout"
    │
    ▼
ChatGPT calls add-to-cart(sessionId, product: {...})
    │
    ▼
MCP3: cartStorage[sessionId] = [product] (replace existing)
      Show add-to-cart.html widget
    │
    ▼
Widget: Displays product with green checkmark animation
        window.openai.sendFollowUpMessage("Added to cart")
    │
    ▼
ChatGPT calls checkout(sessionId)
    │
    ▼
MCP3: Get cartStorage[sessionId]
      Inject into checkout.html
    │
    ▼
Widget: Shows order summary, pre-filled shipping/payment
        User clicks "Complete Purchase"
        Shows processing animation → Success screen
        window.openai.toolOutput({ success: true })
    │
    ▼
ChatGPT: "Your order has been placed! ✅"
```

## Security Considerations

### Current Implementation (Demo)

- **No real authentication**: All credentials work
- **In-memory state**: Data lost on server restart
- **No encryption**: Data transmitted in plain text
- **No rate limiting**: Unlimited requests allowed
- **CORS wide open**: `Access-Control-Allow-Origin: *`

### Production Recommendations

1. **Authentication**
   - Integrate with OAuth 2.0 (Google, Microsoft, etc.)
   - Issue JWT tokens
   - Validate tokens on every request

2. **State Management**
   - Use Redis or database for session storage
   - Encrypt sensitive data at rest
   - Set proper session expiration

3. **API Security**
   - Store API keys in environment variables
   - Never expose keys in widget HTML
   - Implement rate limiting (e.g., 100 req/min per user)
   - Validate all inputs

4. **CORS**
   - Restrict to ChatGPT domains only:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', 'https://chatgpt.com');
   ```

5. **HTTPS**
   - Use HTTPS in production (Heroku provides this)
   - Set `Secure` and `HttpOnly` flags on cookies

6. **Input Validation**
   - Sanitize all user inputs
   - Validate against schema
   - Prevent XSS attacks in widgets

## Performance Optimizations

### Current Implementation

- In-memory storage (fast but not scalable)
- No caching
- Synchronous session cleanup

### Production Recommendations

1. **Caching**
   ```javascript
   import NodeCache from 'node-cache';
   const cache = new NodeCache({ stdTTL: 600 });
   
   // Cache API responses
   const cacheKey = `products:${query}:${page}`;
   let products = cache.get(cacheKey);
   if (!products) {
     products = await fetchFromAPI(query, page);
     cache.set(cacheKey, products);
   }
   ```

2. **Database Indexing**
   - Index session IDs
   - Index user IDs
   - Use connection pooling

3. **Widget Optimization**
   - Minify HTML/CSS/JS
   - Compress images (use WebP)
   - Lazy load images in carousel

4. **Server Optimization**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement connection pooling

## Scalability

### Current Limitations

- Single server instance
- In-memory state (doesn't scale horizontally)
- No load balancing

### Scaling Strategy

1. **Stateless Sessions**
   ```javascript
   // Move to Redis for shared state
   import { createClient } from 'redis';
   const redis = createClient({ url: process.env.REDIS_URL });
   
   await redis.set(`session:${sessionId}`, JSON.stringify(data));
   const data = JSON.parse(await redis.get(`session:${sessionId}`));
   ```

2. **Load Balancing**
   - Deploy multiple server instances
   - Use Heroku's load balancer or Nginx
   - Share state via Redis/database

3. **Microservices**
   - Split into separate services:
     - Auth Service
     - Product Service
     - Checkout Service
   - Each service scales independently

## Error Handling

### Current Implementation

```javascript
try {
  // Tool logic
  return { content: [...] };
} catch (error) {
  console.error('Error:', error);
  return {
    content: [{ type: 'text', text: 'Something went wrong' }],
    isError: true
  };
}
```

### Production Best Practices

1. **Structured Logging**
   ```javascript
   import winston from 'winston';
   
   logger.error('Authentication failed', {
     sessionId,
     error: error.message,
     stack: error.stack
   });
   ```

2. **Error Categories**
   - Validation errors → 400
   - Authentication errors → 401
   - Not found → 404
   - Server errors → 500

3. **User-Friendly Messages**
   ```javascript
   const ERROR_MESSAGES = {
     INVALID_SESSION: 'Your session expired. Please try again.',
     API_ERROR: 'Unable to fetch products. Please try again.',
     NETWORK_ERROR: 'Connection lost. Please check your internet.'
   };
   ```

## Monitoring & Observability

### Recommended Tools

1. **Application Monitoring**
   - Heroku Metrics
   - New Relic
   - Datadog

2. **Error Tracking**
   - Sentry
   - Rollbar

3. **Logging**
   - Papertrail (Heroku addon)
   - Loggly
   - Splunk

4. **Metrics to Track**
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Active sessions
   - Widget load time

## Testing Strategy

### Unit Tests

```javascript
import { describe, it, expect } from 'vitest';

describe('Session Management', () => {
  it('should create unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
  });
  
  it('should store session data', () => {
    const sessionId = 'test_123';
    authSessions.set(sessionId, { authenticated: false });
    expect(authSessions.get(sessionId)).toEqual({ authenticated: false });
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from './server.js';

describe('MCP Endpoints', () => {
  it('should connect to /mcp', async () => {
    const response = await request(app).get('/mcp');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
  });
});
```

### E2E Tests

Test in actual ChatGPT:
1. Connect to MCP server
2. Call each tool
3. Verify widget rendering
4. Test error cases
5. Test theme switching

## Deployment Architecture

### Heroku Setup

```
┌─────────────────────────────────────┐
│         Heroku Platform              │
│  ┌────────────────────────────────┐ │
│  │  Web Dyno (Container)          │ │
│  │  - Node.js 20.x                │ │
│  │  - server.js                   │ │
│  │  - Port: $PORT                 │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  Config Vars (Environment)     │ │
│  │  - UNWRANGLE_API_KEY           │ │
│  │  - PORT                        │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  Git Repository                │ │
│  │  - Auto-deploy from main       │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     HTTPS/SSL (Automatic)            │
│  chatgpt-components-xxx.herokuapp... │
└─────────────────────────────────────┘
```

## Future Enhancements

1. **WebSocket Support**: For real-time bidirectional communication
2. **File Uploads**: Allow widgets to upload files
3. **Multi-User Support**: Real authentication and user management
4. **Analytics**: Track widget usage and engagement
5. **A/B Testing**: Test different widget designs
6. **Internationalization**: Multi-language support
7. **Accessibility**: ARIA labels, keyboard navigation

---

This architecture is designed to be:
- **Modular**: Easy to add new MCP servers
- **Scalable**: Can grow from demo to production
- **Maintainable**: Clear separation of concerns
- **Extensible**: Build upon existing patterns

For specific implementation details, see the [example documentation](examples/).


