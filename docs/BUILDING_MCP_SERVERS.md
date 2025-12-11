# Building MCP Servers for ChatGPT

> A beginner-friendly, step-by-step guide to creating interactive components for ChatGPT

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [What You'll Build](#what-youll-build)
3. [Prerequisites](#prerequisites)
4. [Your First MCP Server (15 minutes)](#your-first-mcp-server-15-minutes)
5. [Building a Task Manager](#building-a-task-manager)
6. [Adding Interactive Widgets](#adding-interactive-widgets)
7. [State Management](#state-management)
8. [Advanced Patterns](#advanced-patterns)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## What is MCP?

**MCP (Model Context Protocol)** lets you build custom tools that ChatGPT can use. Instead of just getting text responses, you can create:

- 🎨 **Interactive widgets** (forms, buttons, carousels) inside ChatGPT
- 🔗 **API integrations** (connect to your databases, services, APIs)
- 💾 **Stateful experiences** (remember things across the conversation)
- 🎯 **Custom workflows** (authentication, checkout, data visualization)

### Key Concepts (Don't Worry, We'll Explain Everything)

- **MCP Server**: Your Node.js app that ChatGPT talks to
- **Tools**: Functions ChatGPT can call (like "add task", "search products")
- **Widgets**: HTML pages that show up inside ChatGPT
- **SSE**: How ChatGPT stays connected to your server (we'll set this up for you)

### How It Works (Simple Version)

```
You: "Add a task to buy milk"
    ↓
ChatGPT: "I'll call the add-task tool"
    ↓
Your Server: "Got it! Task added."
    ↓
ChatGPT: "✅ Added: Buy milk"
```

## What You'll Build

By the end of this guide, you'll have:

1. ✅ A working MCP server running on your computer
2. ✅ A task manager that ChatGPT can use
3. ✅ An interactive widget with buttons and styling
4. ✅ Knowledge to build your own custom tools

**Time needed**: 30-45 minutes

## Prerequisites

### Required

1. **Node.js installed** (v20 or higher)
   ```bash
   node --version
   ```
   If you see `v20.x.x` or higher, you're good! If not, download from [nodejs.org](https://nodejs.org/)

2. **A code editor** (VS Code, Sublime, or any text editor)

3. **Terminal/Command Prompt** access

4. **ChatGPT account** (to test your server)

### No Experience Needed With:
- ❌ MCP (we'll teach you)
- ❌ Server development (we'll guide you)
- ❌ Advanced JavaScript (basic understanding helps)

## Your First MCP Server (15 minutes)

Let's build the simplest possible MCP server that actually works.

### Step 1: Create Your Project Folder

Open your terminal and run these commands one at a time:

```bash
# Create a new folder
mkdir my-first-mcp

# Go into that folder
cd my-first-mcp

# Initialize a Node.js project (press Enter to accept all defaults)
npm init -y
```

**✅ What you should see**: A message saying "Wrote to package.json"

### Step 2: Install Required Packages

Still in your terminal, run:

```bash
npm install @modelcontextprotocol/sdk express
```

**✅ What you should see**: Progress bars and "added X packages"

This installs:
- `@modelcontextprotocol/sdk` - Tools to build MCP servers
- `express` - Web server framework

### Step 3: Configure for ES Modules

We need to tell Node.js we're using modern JavaScript. 

**Open `package.json` in your code editor**. It looks like this:

```json
{
  "name": "my-first-mcp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "express": "^4.18.2"
  }
}
```

**Add one line** after `"version"`:

```json
{
  "name": "my-first-mcp",
  "version": "1.0.0",
  "type": "module",              ← ADD THIS LINE
  "description": "",
  ...rest of file
}
```

**Save the file.**

### Step 4: Create Your Server File

In your code editor, create a new file named `server.js` in your project folder.

Paste this code into `server.js`:

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = 8000;

// This function creates your MCP server
function createMcpServer() {
  const server = new Server(
    { name: 'my-first-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // List the tools your server provides
  server.setRequestHandler('tools/list', async () => ({
    tools: [{
      name: 'say-hello',
      description: 'Says hello to someone',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Person\'s name' }
        },
        required: ['name']
      }
    }]
  }));

  // Handle when ChatGPT calls your tool
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === 'say-hello') {
      const name = request.params.arguments?.name || 'World';
      
      return {
        content: [{
          type: 'text',
          text: `Hello, ${name}! 👋 This is your first MCP tool!`
        }]
      };
    }
  });

  return server;
}

// Set up the endpoint where ChatGPT connects
app.get('/mcp', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createMcpServer();
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// Required endpoint for receiving messages
app.post('/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

// Start your server
app.listen(PORT, () => {
  console.log(`✅ MCP Server is running!`);
  console.log(`📍 Connect in ChatGPT using: http://localhost:${PORT}/mcp`);
});
```

**Save the file.**

### Step 5: Start Your Server

In your terminal (make sure you're still in the `my-first-mcp` folder), run:

```bash
node server.js
```

**✅ What you should see**:
```
✅ MCP Server is running!
📍 Connect in ChatGPT using: http://localhost:8000/mcp
```

**🎉 Your server is now running!** Keep this terminal window open.

### Step 6: Connect to ChatGPT

1. **Open ChatGPT** in your web browser
2. Click your **profile icon** (bottom left) → **Settings**
3. Go to **Connectors** section
4. Click **"Add Connector"**
5. Enter: `http://localhost:8000/mcp`
6. Click **"Connect"**

**✅ What you should see**: Your connector appears in the list with a green dot

### Step 7: Test It!

In ChatGPT, start a new conversation and try:

```
Say hello to Alice
```

**✅ What you should see**: ChatGPT responds with "Hello, Alice! 👋 This is your first MCP tool!"

**🎉 Congratulations!** You just built your first MCP server!

### What Just Happened?

1. You started a Node.js server on your computer
2. ChatGPT connected to it via SSE (Server-Sent Events)
3. When you said "Say hello to Alice", ChatGPT called your `say-hello` tool
4. Your server responded with a message
5. ChatGPT showed you the result

---

## Building a Task Manager

Now let's build something more useful - a task manager that ChatGPT can use!

### What We're Building

A tool where you can:
- ✅ Add tasks
- ✅ List all tasks
- ✅ Mark tasks as complete
- ✅ Delete tasks

### Step 1: Create a New Project

Open a new terminal window (keep your old server running if you want) and run:

```bash
# Create new project
mkdir mcp-task-manager
cd mcp-task-manager

# Set up Node.js
npm init -y
npm install @modelcontextprotocol/sdk express
```

### Step 2: Configure package.json

Open `package.json` and add `"type": "module"` after version (just like before).

### Step 3: Create the Task Server

Create `server.js` and paste this code:

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = 8000;

// This is where we'll store tasks (in memory for now)
const tasks = [];
let nextId = 1;

function createTaskServer() {
  const server = new Server(
    { name: 'task-manager', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Define all the tools
  server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'add-task',
        description: 'Add a new task to the list',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'What needs to be done' },
            priority: { type: 'string', description: 'high, medium, or low', enum: ['high', 'medium', 'low'] }
          },
          required: ['title']
        }
      },
      {
        name: 'list-tasks',
        description: 'Show all tasks',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', description: 'Show: all, completed, or pending', enum: ['all', 'completed', 'pending'] }
          }
        }
      },
      {
        name: 'complete-task',
        description: 'Mark a task as complete',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Task ID number' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete-task',
        description: 'Delete a task',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Task ID number' }
          },
          required: ['id']
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler('tools/call', async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    // ADD TASK
    if (toolName === 'add-task') {
      const task = {
        id: nextId++,
        title: args.title,
        priority: args.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      tasks.push(task);
      
      return {
        content: [{
          type: 'text',
          text: `✅ Task added!\n📝 "${task.title}"\n🆔 ID: ${task.id}\n⭐ Priority: ${task.priority}`
        }]
      };
    }

    // LIST TASKS
    if (toolName === 'list-tasks') {
      const filter = args.filter || 'all';
      
      let filteredTasks = tasks;
      if (filter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
      } else if (filter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed);
      }
      
      if (filteredTasks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: filter === 'all' ? '📭 No tasks yet!' : `📭 No ${filter} tasks!`
          }]
        };
      }
      
      const taskList = filteredTasks.map(t => {
        const status = t.completed ? '✅' : '⬜';
        const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
        return `${status} ${priority} [${t.id}] ${t.title}`;
      }).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `📋 Your Tasks (${filteredTasks.length}):\n\n${taskList}`
        }]
      };
    }

    // COMPLETE TASK
    if (toolName === 'complete-task') {
      const task = tasks.find(t => t.id === args.id);
      
      if (!task) {
        return {
          content: [{
            type: 'text',
            text: `❌ Task ${args.id} not found`
          }],
          isError: true
        };
      }
      
      if (task.completed) {
        return {
          content: [{
            type: 'text',
            text: `ℹ️  Task "${task.title}" is already completed`
          }]
        };
      }
      
      task.completed = true;
      
      return {
        content: [{
          type: 'text',
          text: `✅ Completed: "${task.title}"`
        }]
      };
    }

    // DELETE TASK
    if (toolName === 'delete-task') {
      const index = tasks.findIndex(t => t.id === args.id);
      
      if (index === -1) {
        return {
          content: [{
            type: 'text',
            text: `❌ Task ${args.id} not found`
          }],
          isError: true
        };
      }
      
      const task = tasks[index];
      tasks.splice(index, 1);
      
      return {
        content: [{
          type: 'text',
          text: `🗑️  Deleted: "${task.title}"`
        }]
      };
    }

    // If we get here, unknown tool
    return {
      content: [{
        type: 'text',
        text: `Unknown tool: ${toolName}`
      }],
      isError: true
    };
  });

  return server;
}

// SSE endpoint for ChatGPT
app.get('/mcp', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createTaskServer();
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// Message endpoint
app.post('/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Task Manager MCP Server is running!`);
  console.log(`📍 Connect in ChatGPT: http://localhost:${PORT}/mcp`);
  console.log(`\n🎯 Try saying:`);
  console.log(`   - "Add a task to buy groceries"`);
  console.log(`   - "List all my tasks"`);
  console.log(`   - "Complete task 1"`);
});
```

**Save the file.**

### Step 4: Start the Server

```bash
node server.js
```

**✅ What you should see**:
```
✅ Task Manager MCP Server is running!
📍 Connect in ChatGPT: http://localhost:8000/mcp

🎯 Try saying:
   - "Add a task to buy groceries"
   - "List all my tasks"
   - "Complete task 1"
```

### Step 5: Connect to ChatGPT

Same as before:
1. ChatGPT Settings → Connectors → Add Connector
2. Enter: `http://localhost:8000/mcp`
3. Connect!

### Step 6: Test Your Task Manager

Try these commands in ChatGPT:

```
Add a high priority task to buy groceries
```

```
Add a task to call mom
```

```
List all my tasks
```

```
Complete task 1
```

```
List my tasks
```

```
Delete task 2
```

**✅ What you should see**: ChatGPT managing your tasks with emojis and formatting!

### 🎉 You Did It!

You now have a fully functional task manager that ChatGPT can use! You can:
- Add tasks with priorities
- View all, completed, or pending tasks
- Mark tasks as complete
- Delete tasks

---

## Adding Interactive Widgets

Now let's make it visual! We'll add a widget that shows up inside ChatGPT.

### What We're Building

When you list tasks, instead of just text, you'll see a beautiful interactive widget with:
- ✨ Nice styling
- 🎨 Dark/light mode support
- 🔘 Clickable buttons
- ✅ Checkboxes

### Step 1: Create a Widgets Folder

In your terminal (in the `mcp-task-manager` folder):

```bash
mkdir widgets
```

### Step 2: Create the Widget HTML

Create a new file: `widgets/task-list.html`

Paste this code:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
      transition: background-color 0.3s, color 0.3s;
    }

    /* Light mode (default) */
    body.light {
      background: #ffffff;
      color: #333333;
    }

    /* Dark mode */
    body.dark {
      background: #1a1a1a;
      color: #e0e0e0;
    }

    h2 {
      margin-bottom: 20px;
      font-size: 24px;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    body.light .task-item {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
    }

    body.dark .task-item {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
    }

    .task-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .task-checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid #007AFF;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .task-checkbox.checked {
      background: #007AFF;
    }

    .task-checkbox.checked::after {
      content: '✓';
      color: white;
      font-weight: bold;
      font-size: 16px;
    }

    .priority-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .priority-high { background: #ff3b30; }
    .priority-medium { background: #ffcc00; }
    .priority-low { background: #34c759; }

    .task-title {
      flex: 1;
      font-size: 16px;
    }

    .task-item.completed .task-title {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .task-id {
      font-size: 12px;
      opacity: 0.6;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      opacity: 0.6;
    }

    .loading {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 122, 255, 0.2);
      border-top-color: #007AFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <div class="spinner"></div>
    <p>Loading tasks...</p>
  </div>

  <div id="content" style="display: none;">
    <h2>📋 Your Tasks</h2>
    <div id="task-list"></div>
  </div>

  <script>
    // Get tasks data from the server (injected)
    const tasks = window.tasksData || [];

    // Apply ChatGPT's theme
    function applyTheme(theme) {
      document.body.className = theme; // 'light' or 'dark'
    }

    // Check for theme API
    if (window.openai?.theme) {
      window.openai.theme.get().then(applyTheme);
      window.openai.theme.subscribe(applyTheme);
    }

    // Render tasks
    function renderTasks() {
      const container = document.getElementById('task-list');
      
      if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No tasks yet!<br>Ask ChatGPT to add one!</div>';
        return;
      }

      container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
          <div class="priority-badge priority-${task.priority}"></div>
          <div class="task-title">${task.title}</div>
          <div class="task-id">#${task.id}</div>
        </div>
      `).join('');

      // Add click handlers
      document.querySelectorAll('.task-item').forEach(item => {
        item.onclick = () => {
          const id = item.dataset.id;
          const task = tasks.find(t => t.id == id);
          
          if (task && !task.completed && window.openai?.sendFollowUpMessage) {
            window.openai.sendFollowUpMessage({
              message: `Complete task ${id}`,
              includeHistory: false
            });
          }
        };
      });
    }

    // Initialize
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      renderTasks();
    }, 500);
  </script>
</body>
</html>
```

**Save the file.**

### Step 3: Update server.js to Use the Widget

Open `server.js` and add this at the very top (after the imports):

```javascript
import { readFileSync } from 'fs';
```

Then find the `list-tasks` tool handler (around line 100) and replace it with this:

```javascript
// LIST TASKS
if (toolName === 'list-tasks') {
  const filter = args.filter || 'all';
  
  let filteredTasks = tasks;
  if (filter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  } else if (filter === 'pending') {
    filteredTasks = tasks.filter(t => !t.completed);
  }
  
  // Read the widget HTML
  let widgetHtml = readFileSync('./widgets/task-list.html', 'utf8');
  
  // Inject the tasks data into the HTML
  widgetHtml = widgetHtml.replace(
    'const tasks = window.tasksData || [];',
    `const tasks = ${JSON.stringify(filteredTasks)};`
  );
  
  return {
    content: [{
      type: 'text',
      text: filteredTasks.length === 0 
        ? '📭 No tasks yet!' 
        : `Found ${filteredTasks.length} task(s)`
    }],
    widgetData: {
      html: widgetHtml
    }
  };
}
```

**Save the file.**

### Step 4: Restart Your Server

In your terminal, press `Ctrl+C` to stop the server, then:

```bash
node server.js
```

### Step 5: Test the Widget

In ChatGPT, try:

```
Add a high priority task to finish the report
```

```
Add a medium priority task to buy groceries
```

```
Add a low priority task to water plants
```

```
List all my tasks
```

**✅ What you should see**: A beautiful interactive widget appears with your tasks!

- Click on an incomplete task to mark it as complete
- See different colors for priorities
- Automatic dark/light mode switching
- Smooth animations

### 🎉 You Built an Interactive Widget!

Your tasks now show up in a beautiful, clickable interface inside ChatGPT!

---

## State Management

Right now, if you restart your server, all tasks are lost. Let's fix that!

### Option 1: Save to a File (Simple)

Add this to your `server.js`:

```javascript
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Load tasks from file at startup
const TASKS_FILE = './tasks.json';

let tasks = [];
let nextId = 1;

// Load existing tasks
if (existsSync(TASKS_FILE)) {
  const data = JSON.parse(readFileSync(TASKS_FILE, 'utf8'));
  tasks = data.tasks || [];
  nextId = data.nextId || 1;
  console.log(`📂 Loaded ${tasks.length} existing tasks`);
}

// Save tasks to file
function saveTasks() {
  writeFileSync(TASKS_FILE, JSON.stringify({ tasks, nextId }, null, 2));
}

// Then after any task operation (add, complete, delete), call:
saveTasks();
```

Now your tasks persist between restarts!

### Option 2: Use a Database (Production)

For real applications, use a database like:
- **SQLite** (simple, file-based)
- **PostgreSQL** (powerful, scalable)
- **MongoDB** (flexible, NoSQL)

Example with SQLite:

```bash
npm install better-sqlite3
```

```javascript
import Database from 'better-sqlite3';

const db = new Database('tasks.db');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT
  )
`);

// Add task
const insert = db.prepare('INSERT INTO tasks (title, priority, created_at) VALUES (?, ?, ?)');
insert.run(task.title, task.priority, new Date().toISOString());

// Get all tasks
const tasks = db.prepare('SELECT * FROM tasks').all();
```

---

## Advanced Patterns

### Multi-Screen Widgets

Create workflows with multiple steps:

```javascript
// Screen 1: Form
// Screen 2: Confirmation
// Screen 3: Success

const currentScreen = session.screen || 'form';

if (currentScreen === 'form') {
  // Show input form
} else if (currentScreen === 'confirmation') {
  // Show "Are you sure?"
} else {
  // Show success message
}
```

### Widget-to-Server Communication

Let widgets call your server:

```javascript
// In server.js - add a new endpoint
app.post('/api/complete-task', express.json(), (req, res) => {
  const { taskId } = req.body;
  const task = tasks.find(t => t.id === taskId);
  
  if (task) {
    task.completed = true;
    saveTasks();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// In widget HTML
async function completeTask(id) {
  const response = await fetch('http://localhost:8000/api/complete-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId: id })
  });
  
  if (response.ok) {
    // Refresh the widget
    location.reload();
  }
}
```

### External API Integration

Connect to any API:

```javascript
import fetch from 'node-fetch';

// Example: Get weather
const response = await fetch(
  `https://api.weather.com/v1/current?city=${city}&key=${API_KEY}`
);
const weather = await response.json();

return {
  content: [{
    type: 'text',
    text: `🌤️ ${weather.temp}°F in ${city}`
  }]
};
```

---

## Deployment

### Deploy to Heroku (Free Tier)

1. **Install Heroku CLI**: [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)

2. **Create a Procfile** in your project folder:
   ```
   web: node server.js
   ```

3. **Update server.js** to use dynamic port:
   ```javascript
   const PORT = process.env.PORT || 8000;
   ```

4. **Deploy**:
   ```bash
   # Login to Heroku
   heroku login
   
   # Create app
   heroku create your-app-name
   
   # Initialize git (if not already)
   git init
   git add .
   git commit -m "Initial commit"
   
   # Deploy
   git push heroku main
   ```

5. **Your server is live!**
   ```
   https://your-app-name.herokuapp.com/mcp
   ```

Now anyone can connect to your MCP server from ChatGPT!

---

## Troubleshooting

### "Cannot use import statement outside a module"

**Fix**: Add `"type": "module"` to your `package.json`

### "EADDRINUSE: address already in use"

**Fix**: Another server is running on port 8000. Stop it with:
```bash
# Find process on port 8000
lsof -i :8000

# Kill it (replace PID with the number shown)
kill -9 PID
```

Or change your PORT in server.js to 8001 or 3000.

### "Module not found: @modelcontextprotocol/sdk"

**Fix**: Run `npm install @modelcontextprotocol/sdk express`

### Widget doesn't appear in ChatGPT

**Check**:
1. Is your server running? (Should see "✅ MCP Server is running!")
2. Did you connect the right URL? (`http://localhost:8000/mcp`)
3. Check your terminal for errors
4. Try disconnecting and reconnecting in ChatGPT Settings

### "fetch is not defined"

**Fix**: Install node-fetch:
```bash
npm install node-fetch
```

Then import it:
```javascript
import fetch from 'node-fetch';
```

### Widget shows old data

**Fix**: Restart your server and refresh ChatGPT. Browsers cache widget HTML.

---

## Next Steps

You now know how to build MCP servers! Here are ideas for what to build next:

### Beginner Projects
- 📝 Note-taking app
- 🎲 Dice roller with animations
- 🌤️ Weather checker
- 💱 Currency converter
- ⏰ Reminder system

### Intermediate Projects
- 🛍️ Shopping cart with checkout
- 📊 Data visualization dashboard
- 🔐 Authentication system
- 📧 Email sender
- 📸 Image gallery

### Advanced Projects
- 💳 Payment processing
- 📈 Analytics platform
- 🤖 AI agent with multiple tools
- 🎮 Interactive game
- 🔄 Workflow automation

## Learn More

- **Examples in this repo**: See [docs/examples/](examples/) for 4 production-ready examples
- **Architecture guide**: [docs/ARCHITECTURE.md](ARCHITECTURE.md) explains how everything works
- **Official MCP docs**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## Get Help

- **Check examples**: Look at the 4 working servers in this repo
- **Read docs**: All patterns are documented
- **Try live servers**: Connect to the URLs in README.md to see how they work

---

## You Did It! 🎉

You learned how to:
- ✅ Build MCP servers from scratch
- ✅ Create interactive widgets
- ✅ Manage state
- ✅ Deploy to production

Now go build something amazing! 🚀
