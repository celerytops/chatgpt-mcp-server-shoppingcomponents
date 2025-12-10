# Building MCP Servers for ChatGPT: A Complete Guide

![MCP Server Examples](https://img.shields.io/badge/MCP-Ready-brightgreen) ![Node.js](https://img.shields.io/badge/node-%3E%3D20.x-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

**Live Demo MCP Servers** | Built for ChatGPT's Model Context Protocol

This repository demonstrates how to build production-ready MCP (Model Context Protocol) servers that integrate with ChatGPT. It includes **4 complete examples** with interactive UI widgets, session management, and real-world use cases.

## 🎯 What You'll Learn

- How to create MCP servers that ChatGPT can connect to
- Building interactive UI widgets that render inside ChatGPT
- Managing user sessions across multiple tool calls
- Designing seamless authentication flows
- Creating product carousels and checkout experiences
- Implementing real-time state management with SSE
- Supporting both light and dark modes
- Deploying MCP servers to production (Heroku)

## 🚀 Live MCP Servers (Ready to Use!)

You can connect to these live servers directly in ChatGPT:

| Server | URL | What It Does |
|--------|-----|--------------|
| **MCP1: Authentication** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp` | Session-based Target login with 3-screen flow |
| **MCP2: Product Search** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp2` | Product carousel + Agentforce AI recommendations |
| **MCP3: Checkout** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp3` | Add-to-cart + complete checkout flow |
| **MCP4: Membership** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp4` | Circle 360 membership signup |

### How to Connect in ChatGPT

1. Open **ChatGPT Settings** → **Connectors**
2. Click **Add connector**
3. Paste any MCP URL from above
4. In a conversation, click **Attach** and select the connector
5. Start using it! Try: *"Sign me into my Target account"*

---

## 📦 What's Included

### MCP Server 1: Authentication
**Files**: `widgets/target-auth.html`

A session-based authentication system that demonstrates:
- Creating unique session IDs
- Managing authentication state across tool calls
- 3-screen UI flow (login → verification → success)
- Dark/light mode support
- Loading states and error handling

**Try it**: *"I need to sign in to Target"*

**Tools**:
- `create-target-session`: Generates a unique session ID
- `authenticate-target`: Shows login widget tied to session
- `get-target-auth-status`: Checks if session is authenticated

---

### MCP Server 2: Product Search
**Files**: `widgets/product-carousel.html`

A product search system with AI-powered recommendations:
- Calls Unwrangle API for real Target product data
- Displays results in an interactive carousel
- Product detail pages with back navigation
- Agentforce-style personalized recommendations

**Try it**: *"Show me fitness trackers on Target"*

**Tools**:
- `search-target-products`: Returns carousel widget with top 10 products
- `get-agentforce-recommendations`: Returns full product data + personalized message

---

### MCP Server 3: Checkout
**Files**: `widgets/add-to-cart.html`, `widgets/checkout.html`

A complete e-commerce checkout flow:
- Add products to cart with confirmation animation
- Pre-filled shipping and payment (demo mode)
- Order summary and success screens
- Cart state management

**Try it**: *"Add the Fitbit Charge 6 to my cart and check out"*

**Tools**:
- `add-to-cart`: Shows success animation, adds to cart
- `checkout`: Complete purchase flow with order summary

---

### MCP Server 4: Membership
**Files**: `widgets/circle-signup.html`

A membership enrollment component:
- 3-tier membership selection (Standard, Plus, Max)
- Dynamic pricing and benefits display
- Processing animations and success confetti 🎉
- Responsive design with dark mode

**Try it**: *"Sign me up for Circle 360"*

**Tools**:
- `check-circle-membership`: Returns membership status and benefits
- `circle-signup`: Shows enrollment widget

---

## 🛠️ Technical Architecture

### MCP Server Structure

```javascript
// Create an MCP server
function createMcpServer(serverName, tools) {
  const server = new Server({
    name: serverName,
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Define tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Return widget + data
  });

  return server;
}
```

### Widget Communication

Widgets use the `window.openai` API to interact with ChatGPT:

```javascript
// Get data passed from server
const toolOutput = await window.openai.toolOutput();

// Send messages back to ChatGPT
await window.openai.sendFollowUpMessage('User authenticated!');

// Update widget state
await window.openai.setWidgetState({ authenticated: true });

// Get current theme
const theme = await window.openai.theme(); // 'light' or 'dark'
```

### Session Management

```javascript
// Store sessions in memory
const authSessions = new Map();
const cartStorage = new Map();

// Create session
const sessionId = `sess_${Date.now()}_${Math.random()}`;
authSessions.set(sessionId, {
  authenticated: false,
  createdAt: Date.now()
});

// Check session
const session = authSessions.get(sessionId);
if (session?.authenticated) {
  // User is authenticated
}
```

### Tool Response Format

```javascript
return {
  content: [
    {
      type: 'widget',
      widget: 'auth-widget',
      data: {
        sessionId: 'sess_123',
        authenticated: false
      }
    },
    {
      type: 'text',
      text: 'Authentication widget displayed'
    }
  ],
  structuredContent: {
    sessionId: 'sess_123',
    status: 'pending'
  }
};
```

---

## 💻 Local Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/chatgpt-mcp-servers.git
cd chatgpt-mcp-servers

# Install dependencies
npm install

# Start the server
npm start
```

The server will run at `http://localhost:8000`

### Test Locally

1. Start the server with `npm start`
2. In ChatGPT Settings → Connectors, add: `http://localhost:8000/mcp`
3. Test your tools!

---

## 🌐 Deploying to Heroku

### One-Time Setup

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login

# Create a new app
heroku create your-app-name

# Set environment variables (if needed)
heroku config:set UNWRANGLE_API_KEY=your_key_here
```

### Deploy

```bash
# Commit your changes
git add -A
git commit -m "Your update message"

# Push to Heroku
git push heroku main
```

Your MCP server will be live at: `https://your-app-name.herokuapp.com/mcp`

---

## 📚 Key Concepts

### 1. Sequential vs Parallel Tool Calls

ChatGPT may try to call tools in parallel. For session-based flows:

```javascript
// ❌ Bad: Requires sessionId but might be called before session exists
authenticate-target { sessionId: undefined }

// ✅ Good: Force sequential with clear descriptions
tools: [
  {
    name: 'create-target-session',
    description: 'MUST be called FIRST. Creates a session ID.'
  },
  {
    name: 'authenticate-target',
    description: 'Requires sessionId from create-target-session.'
  }
]
```

### 2. Widget Loading States

Always show a loading screen while waiting for data:

```javascript
// In widget
const toolOutput = await window.openai.toolOutput();

if (!toolOutput || !toolOutput.sessionId) {
  // Show loading spinner
  showLoading();
  // Poll until data arrives
  setTimeout(checkAgain, 100);
}
```

### 3. Dark Mode Support

```css
/* Detect theme */
const theme = await window.openai.theme();

/* Apply theme-specific styles */
:root[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

:root[data-theme="light"] {
  --bg-color: #ffffff;
  --text-color: #000000;
}
```

### 4. State Management

For multi-step flows, store state server-side:

```javascript
// Store cart items tied to session
const cartStorage = new Map();
cartStorage.set(sessionId, { items: [...] });

// Clear old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of authSessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      authSessions.delete(id);
    }
  }
}, 60000);
```

---

## 🎨 Widget Design Best Practices

### 1. Responsive Layout
- Use `max-width` for content containers
- Support both mobile and desktop
- Test in ChatGPT's iframe (narrow width)

### 2. Animations
- Keep animations subtle and purposeful
- Use CSS transitions for smooth state changes
- Loading spinners for async operations

### 3. Accessibility
- Clear button labels
- High contrast ratios
- Keyboard navigation support

### 4. Branding
- Consistent color scheme
- Logo placement (top-left recommended)
- Typography that matches your brand

---

## 🔧 Customization Guide

### Adding a New Tool

1. Define the tool in `server.setRequestHandler(ListToolsRequestSchema)`:

```javascript
{
  name: 'my-new-tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'User input' }
    },
    required: ['query']
  }
}
```

2. Handle the tool call:

```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my-new-tool') {
    return {
      content: [
        {
          type: 'widget',
          widget: 'my-widget',
          data: { /* widget data */ }
        }
      ]
    };
  }
});
```

3. Create the widget HTML in `widgets/my-widget.html`

---

## 🐛 Common Issues & Solutions

### Issue: "Session terminated" error

**Cause**: SSE connection cleanup error  
**Fix**: Ensure proper error handling in SSE setup:

```javascript
transport.onclose = async () => {
  sseConnections.delete(sessionId); // Not server.close()
};
```

### Issue: Widget shows before session ID is created

**Cause**: Parallel tool calls  
**Fix**: Add client-side polling in widget:

```javascript
async function waitForSession() {
  const output = await window.openai.toolOutput();
  if (!output.sessionId) {
    setTimeout(waitForSession, 100);
  } else {
    initializeWidget(output.sessionId);
  }
}
```

### Issue: Dark mode text not visible

**Cause**: CSS specificity issues  
**Fix**: Use theme detection and explicit classes:

```javascript
const theme = await window.openai.theme();
document.documentElement.setAttribute('data-theme', theme);
```

---

## 📖 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [OpenAI MCP Integration Guide](https://platform.openai.com/docs/guides/mcp)
- [Heroku Node.js Deployment](https://devcenter.heroku.com/articles/deploying-nodejs)

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this code for your own projects!

---

## 🙏 Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Express.js](https://expressjs.com/)
- [Unwrangle API](https://unwrangle.com/) for product data

---

## 💬 Questions?

Open an issue or reach out! We'd love to see what you build with MCP servers.

**Happy Building! 🚀**
