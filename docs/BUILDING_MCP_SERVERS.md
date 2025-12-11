# Building MCP Servers for ChatGPT

> A comprehensive guide to creating interactive components for ChatGPT using the Model Context Protocol

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Building Your First MCP Server](#building-your-first-mcp-server)
5. [Creating Interactive Widgets](#creating-interactive-widgets)
6. [State Management](#state-management)
7. [Advanced Patterns](#advanced-patterns)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)

## What is MCP?

The **Model Context Protocol (MCP)** is a standard for connecting AI assistants like ChatGPT to external tools and services. MCP servers can:

- Serve interactive UI components (widgets) directly in ChatGPT
- Maintain state across conversations
- Integrate with external APIs
- Provide rich, branded experiences

### Key Concepts

- **MCP Server**: A Node.js application that implements the MCP protocol
- **Tools**: Functions that ChatGPT can call (like API endpoints)
- **Widgets**: Interactive HTML components displayed in ChatGPT's iframe
- **SSE**: Server-Sent Events for real-time communication
- **`window.openai` API**: JavaScript API for widget-ChatGPT communication

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │   SSE   │              │  HTTP   │             │
│   ChatGPT   │◄────────│  MCP Server  │◄────────│ External    │
│             │         │  (Node.js)   │         │ APIs        │
│             │◄────────┤              │         │             │
│   Widget    │ window. │  Widgets/    │         └─────────────┘
│   (iframe)  │ openai  │  HTML        │
└─────────────┘         └──────────────┘
```

### Communication Flow

1. **ChatGPT → MCP Server**: User asks a question, ChatGPT calls a tool via SSE
2. **MCP Server → ChatGPT**: Server returns widget data in response
3. **ChatGPT → User**: Displays widget in an iframe
4. **Widget → MCP Server**: Widget makes HTTP calls to server endpoints
5. **Widget → ChatGPT**: Widget uses `window.openai` API to send messages/state

## Quick Start

### Prerequisites

```bash
node --version  # v20.x or higher
npm --version   # v10.x or higher
```

### Install Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "express": "^4.18.2"
  }
}
```

### Minimal MCP Server

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

// Create MCP server
function createMcpServer() {
  const server = new Server(
    { name: 'my-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Define a tool
  server.setRequestHandler('tools/list', async () => ({
    tools: [{
      name: 'hello-world',
      description: 'Says hello with a widget',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' }
        },
        required: ['name']
      }
    }]
  }));

  // Handle tool calls
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === 'hello-world') {
      const name = request.params.arguments?.name || 'World';
      
      return {
        content: [{
          type: 'text',
          text: `Hello, ${name}!`
        }],
        widgetData: {
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: sans-serif; padding: 20px; }
                  h1 { color: #007AFF; }
                </style>
              </head>
              <body>
                <h1>Hello, ${name}! 👋</h1>
                <p>This is your first MCP widget!</p>
              </body>
            </html>
          `
        }
      };
    }
  });

  return server;
}

// SSE endpoint for MCP
app.get('/mcp', async (req, res) => {
  const server = createMcpServer();
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// POST endpoint for messages
app.post('/messages', express.text({ type: '*/*' }), (req, res) => {
  // SSE transport handles this
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
```

### Test It

1. Start the server: `node server.js`
2. In ChatGPT: Settings → Connectors → Add `http://localhost:8000/mcp`
3. Ask: *"Say hello to Alice"*

## Building Your First MCP Server

Let's build a **task list MCP server** step by step.

### Step 1: Set Up the Project

```bash
mkdir mcp-tasks
cd mcp-tasks
npm init -y
npm install @modelcontextprotocol/sdk express
```

### Step 2: Define Your Tools

Think about what actions users should be able to perform:

- `add-task`: Add a task to the list
- `list-tasks`: Show all tasks
- `complete-task`: Mark a task as done

### Step 3: Create the Server

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = 8000;

// In-memory task storage
const tasks = [];
let taskIdCounter = 1;

function createTaskServer() {
  const server = new Server(
    { name: 'task-manager', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // List available tools
  server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'add-task',
        description: 'Add a new task',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' }
          },
          required: ['title']
        }
      },
      {
        name: 'list-tasks',
        description: 'List all tasks',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'complete-task',
        description: 'Mark a task as complete',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'number', description: 'Task ID' }
          },
          required: ['taskId']
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'add-task') {
      const task = {
        id: taskIdCounter++,
        title: args.title,
        description: args.description || '',
        completed: false,
        createdAt: new Date().toISOString()
      };
      tasks.push(task);

      return {
        content: [{
          type: 'text',
          text: `Task added: "${task.title}" (ID: ${task.id})`
        }]
      };
    }

    if (name === 'list-tasks') {
      const taskList = tasks.map(t => 
        `${t.completed ? '✅' : '⬜'} [${t.id}] ${t.title}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: tasks.length > 0 ? taskList : 'No tasks yet!'
        }]
      };
    }

    if (name === 'complete-task') {
      const task = tasks.find(t => t.id === args.taskId);
      if (task) {
        task.completed = true;
        return {
          content: [{
            type: 'text',
            text: `Task "${task.title}" marked as complete!`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `Task ${args.taskId} not found`
          }],
          isError: true
        };
      }
    }
  });

  return server;
}

// SSE endpoint
app.get('/mcp', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createTaskServer();
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// POST endpoint for messages
app.post('/messages', express.text({ type: '*/*' }), (req, res) => {
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`Task MCP Server running on http://localhost:${PORT}`);
  console.log(`Connect in ChatGPT: http://localhost:${PORT}/mcp`);
});
```

### Step 4: Test It

```bash
node server.js
```

In ChatGPT:
- *"Add a task to buy groceries"*
- *"List all my tasks"*
- *"Mark task 1 as complete"*

## Creating Interactive Widgets

Widgets bring your MCP server to life with rich UI components.

### Basic Widget Structure

```javascript
return {
  content: [{
    type: 'text',
    text: 'Here is your task list'
  }],
  widgetData: {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Your styles here */
          </style>
        </head>
        <body>
          <!-- Your UI here -->
          <script>
            // Your JavaScript here
          </script>
        </body>
      </html>
    `
  }
};
```

### Widget Best Practices

#### 1. **Self-Contained HTML**

Everything must be in one HTML string:
- Inline CSS in `<style>` tags
- Inline JavaScript in `<script>` tags
- Base64-encoded images or external URLs

#### 2. **Dark/Light Mode Support**

```javascript
<script>
  // Listen for theme changes
  if (window.openai?.theme) {
    window.openai.theme.subscribe((theme) => {
      document.body.className = theme; // 'light' or 'dark'
    });
    
    // Get initial theme
    window.openai.theme.get().then(theme => {
      document.body.className = theme;
    });
  }
</script>

<style>
  body.light { background: white; color: black; }
  body.dark { background: #1a1a1a; color: white; }
</style>
```

#### 3. **Loading States**

Always show a loading state while fetching data:

```javascript
<div id="loading" style="text-align: center; padding: 40px;">
  <div class="spinner"></div>
  <p>Loading tasks...</p>
</div>

<div id="content" style="display: none;">
  <!-- Your content here -->
</div>

<script>
  async function init() {
    // Fetch data
    const data = await fetchTasks();
    
    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  }
  
  init();
</script>
```

#### 4. **Responsive Design**

```css
/* Mobile-first approach */
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}
```

### Using the `window.openai` API

The `window.openai` object provides methods for widget-ChatGPT communication:

#### **Send a Follow-Up Message**

```javascript
window.openai.sendFollowUpMessage({
  message: "Task completed! What's next?",
  includeHistory: false
});
```

#### **Update Widget State**

```javascript
window.openai.setWidgetState({
  taskId: 123,
  status: 'completed',
  timestamp: new Date().toISOString()
});
```

#### **Send Tool Output**

```javascript
window.openai.toolOutput({
  result: 'success',
  data: { taskId: 123 }
});
```

#### **Get Current Theme**

```javascript
const theme = await window.openai.theme.get(); // 'light' or 'dark'
```

### Example: Task Widget

```javascript
widgetData: {
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 20px;
            transition: background-color 0.3s, color 0.3s;
          }
          body.light { background: white; color: #333; }
          body.dark { background: #1a1a1a; color: #e0e0e0; }
          
          .task {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          body.light .task { background: #f5f5f5; }
          body.dark .task { background: #2a2a2a; }
          body.light .task:hover { background: #e8e8e8; }
          body.dark .task:hover { background: #333; }
          
          .checkbox {
            width: 24px;
            height: 24px;
            border: 2px solid #007AFF;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .checkbox.checked {
            background: #007AFF;
          }
          .checkbox.checked::after {
            content: '✓';
            color: white;
            font-weight: bold;
          }
          
          .task-title {
            flex: 1;
            font-weight: 500;
          }
          .task.completed .task-title {
            text-decoration: line-through;
            opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <h2>Your Tasks</h2>
        <div id="task-list"></div>
        
        <script>
          const tasks = ${JSON.stringify(tasks)};
          
          // Apply theme
          if (window.openai?.theme) {
            window.openai.theme.get().then(theme => {
              document.body.className = theme;
            });
            window.openai.theme.subscribe(theme => {
              document.body.className = theme;
            });
          }
          
          // Render tasks
          const taskList = document.getElementById('task-list');
          tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'task' + (task.completed ? ' completed' : '');
            div.innerHTML = \`
              <div class="checkbox \${task.completed ? 'checked' : ''}"></div>
              <div class="task-title">\${task.title}</div>
            \`;
            
            div.onclick = () => {
              if (window.openai?.sendFollowUpMessage) {
                window.openai.sendFollowUpMessage({
                  message: \`Mark task \${task.id} as complete\`,
                  includeHistory: false
                });
              }
            };
            
            taskList.appendChild(div);
          });
        </script>
      </body>
    </html>
  `
}
```

## State Management

### Session-Based State

Use unique session IDs to track users:

```javascript
const sessions = new Map(); // sessionId -> userData

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create-session') {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions.set(sessionId, {
      createdAt: Date.now(),
      authenticated: false,
      tasks: []
    });
    
    return {
      content: [{
        type: 'text',
        text: `Session created: ${sessionId}`
      }],
      structuredContent: { sessionId }
    };
  }
  
  if (request.params.name === 'add-task') {
    const { sessionId, title } = request.params.arguments;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return { content: [{ type: 'text', text: 'Invalid session' }], isError: true };
    }
    
    session.tasks.push({ id: Date.now(), title, completed: false });
    // ... return widget
  }
});
```

### Persistent State

For production, use a database:

```javascript
// Example with Redis
import { createClient } from 'redis';
const redis = createClient();

// Store session
await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), {
  EX: 3600 // Expire in 1 hour
});

// Retrieve session
const data = await redis.get(`session:${sessionId}`);
const sessionData = JSON.parse(data);
```

### Session Cleanup

Prevent memory leaks:

```javascript
// Clean up old sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > 600000) { // 10 minutes
      sessions.delete(id);
    }
  }
}, 600000);
```

## Advanced Patterns

### Multi-Screen Flows

Create wizards or multi-step processes:

```javascript
// Store current screen in session
session.currentScreen = 'login'; // or 'verification', 'success'

// Widget shows different UI based on screen
widgetData: {
  html: `
    <div id="login-screen" style="display: ${currentScreen === 'login' ? 'block' : 'none'}">
      <!-- Login form -->
    </div>
    <div id="verification-screen" style="display: ${currentScreen === 'verification' ? 'block' : 'none'}">
      <!-- Verification code -->
    </div>
    <div id="success-screen" style="display: ${currentScreen === 'success' ? 'block' : 'none'}">
      <!-- Success message -->
    </div>
  `
}
```

### Widget-to-Server Communication

Create API endpoints for widgets to call:

```javascript
// In server.js
app.post('/api/complete-task', express.json(), (req, res) => {
  const { sessionId, taskId } = req.body;
  const session = sessions.get(sessionId);
  
  if (session) {
    const task = session.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } else {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// In widget
async function completeTask(taskId) {
  const response = await fetch('/api/complete-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, taskId })
  });
  const data = await response.json();
  // ... update UI
}
```

### External API Integration

```javascript
import fetch from 'node-fetch';

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'search-products') {
    const { query } = request.params.arguments;
    
    // Call external API
    const response = await fetch(`https://api.example.com/search?q=${query}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });
    const products = await response.json();
    
    // Return widget with results
    return {
      content: [{
        type: 'text',
        text: `Found ${products.length} products`
      }],
      widgetData: {
        html: renderProductWidget(products)
      }
    };
  }
});
```

### Multiple MCP Servers

Host multiple servers on different endpoints:

```javascript
// MCP 1: Authentication
app.get('/mcp1', async (req, res) => {
  const server = createAuthServer();
  const transport = new SSEServerTransport('/mcp1/messages', res);
  await server.connect(transport);
});

// MCP 2: Tasks
app.get('/mcp2', async (req, res) => {
  const server = createTaskServer();
  const transport = new SSEServerTransport('/mcp2/messages', res);
  await server.connect(transport);
});

// Separate message endpoints
app.post('/mcp1/messages', express.text({ type: '*/*' }), (req, res) => {
  res.status(200).end();
});

app.post('/mcp2/messages', express.text({ type: '*/*' }), (req, res) => {
  res.status(200).end();
});
```

## Deployment

### Heroku

1. **Create `Procfile`:**
```
web: node server.js
```

2. **Deploy:**
```bash
heroku create your-app-name
git push heroku main
```

3. **Set environment variables:**
```bash
heroku config:set API_KEY=your_secret_key
```

### Environment Variables

```javascript
const PORT = process.env.PORT || 8000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn('Warning: API_KEY not set');
}
```

### CORS Configuration

Always enable CORS for ChatGPT:

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
```

## Best Practices

### 1. **Tool Naming**

- Use kebab-case: `add-task`, `get-user-profile`
- Be descriptive: `search-products` not `search`
- Namespace if needed: `target-authenticate`, `target-search`

### 2. **Input Validation**

Always validate tool inputs:

```javascript
const { sessionId, title } = request.params.arguments;

if (!sessionId || typeof sessionId !== 'string') {
  return {
    content: [{ type: 'text', text: 'Invalid sessionId' }],
    isError: true
  };
}

if (!title || title.trim().length === 0) {
  return {
    content: [{ type: 'text', text: 'Title is required' }],
    isError: true
  };
}
```

### 3. **Error Handling**

```javascript
try {
  const data = await fetchFromAPI();
  return { content: [{ type: 'text', text: 'Success' }] };
} catch (error) {
  console.error('API Error:', error);
  return {
    content: [{
      type: 'text',
      text: 'Something went wrong. Please try again.'
    }],
    isError: true
  };
}
```

### 4. **Loading States**

Always show progress:
- Invoking messages: `"Loading tasks..."`
- Invoked messages: `"Tasks loaded"`
- Widget loading screens

### 5. **Security**

- Never expose API keys in widgets
- Validate all user inputs
- Implement rate limiting
- Use HTTPS in production

### 6. **Performance**

- Keep widgets lightweight (< 100KB)
- Minimize API calls
- Cache responses when possible
- Clean up old sessions

### 7. **User Experience**

- Respect dark/light mode
- Show clear error messages
- Provide feedback for all actions
- Make widgets responsive

## Testing

### Local Testing

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Test with curl
curl http://localhost:8000/mcp
```

### ChatGPT Testing

1. Add connector in ChatGPT Settings
2. Test all tools one by one
3. Test error cases
4. Test dark/light mode
5. Test on mobile (if applicable)

### Debugging

Add logging:

```javascript
server.setRequestHandler('tools/call', async (request) => {
  console.log('Tool called:', request.params.name);
  console.log('Arguments:', request.params.arguments);
  
  // ... handle tool
  
  console.log('Response sent');
});
```

Check widget console:

```javascript
// In widget
console.log('Widget loaded');
console.log('Session ID:', sessionId);
console.log('Theme:', theme);
```

## Next Steps

Now that you understand the fundamentals:

1. **Explore the examples** in [docs/examples/](../examples/)
2. **Build your own MCP server** with your unique use case
3. **Deploy to production** and share with users
4. **Contribute** your examples back to the community!

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
- [Example Repository](https://github.com/yourusername/chatgpt-mcp-examples)

---

Happy building! 🚀

