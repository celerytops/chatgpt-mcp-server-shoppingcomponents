# ChatGPT Authentication Component

A working example of a ChatGPT component with authentication using the OpenAI Apps SDK and MCP (Model Context Protocol).

## 🎯 What This Does

This project demonstrates how to:
- Create interactive UI components that render inside ChatGPT
- Build an MCP server that ChatGPT can communicate with
- Implement user authentication that ChatGPT can access
- Handle state management between ChatGPT and your components

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   ChatGPT   │ ←─MCP──→ │  MCP Server  │ ←─API──→ │  Component  │
│             │         │  (Node.js)   │         │   (HTML/JS) │
└─────────────┘         └──────────────┘         └─────────────┘
                              ↓
                        ┌──────────────┐
                        │   Session    │
                        │   Storage    │
                        └──────────────┘
```

1. **ChatGPT** - The user interface where your component appears
2. **MCP Server** - Backend that defines tools and serves components
3. **Components** - Interactive UI (HTML/CSS/JS) rendered in iframe
4. **Session Storage** - Manages authenticated user state

## 📦 Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Set Up Environment**
```bash
cp .env.example .env
# Edit .env if needed (defaults should work for local dev)
```

3. **Start the Server**
```bash
npm start
```

You should see:
```
🚀 MCP Server running at http://localhost:3000

📋 To connect to ChatGPT:
   1. Open ChatGPT
   2. Enable Developer Mode in settings
   3. Create new app with URL: http://localhost:3000
```

## 🔗 Connecting to ChatGPT

### Step 1: Enable Developer Mode

1. Open [ChatGPT](https://chatgpt.com)
2. Click your profile (bottom left)
3. Go to **Settings** → **Developer** 
4. Enable **Developer Mode**

### Step 2: Add Your App

1. In Developer Mode, click **+ Create App**
2. Enter:
   - **Name**: Authentication Example
   - **MCP Server URL**: `http://localhost:3000`
3. Click **Create**

### Step 3: Test the Component

In ChatGPT, try these prompts:

```
Show me the authentication form
```

```
Authenticate me
```

```
Check if I'm logged in
```

## 🎮 How to Use

### Available Tools

The MCP server exposes three tools that ChatGPT can call:

1. **`authenticate_user`** - Displays the authentication component
2. **`get_user_profile`** - Returns info about the authenticated user
3. **`logout_user`** - Logs out the current user

### Testing Locally

You can also test the component directly in your browser:

```
http://localhost:3000/components/auth.html
```

**Test Credentials:**
- Email: any valid email format
- Password: at least 6 characters

## 🔧 Project Structure

```
ChatGPT Components/
├── server.js                    # MCP server (Express.js)
├── public/
│   └── components/
│       └── auth.html           # Authentication component
├── package.json                # Dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 📝 How It Works

### 1. MCP Server Endpoints

```javascript
GET  /.well-known/mcp.json      # Server metadata
POST /mcp/tools/list            # List available tools
POST /mcp/tools/call            # Execute a tool
POST /api/authenticate          # Handle login
GET  /api/session/:sessionId    # Check auth status
```

### 2. Component Communication

The component uses the `window.openai` API to communicate with ChatGPT:

```javascript
// Get initial data from ChatGPT
const toolOutput = window.openai.toolOutput;

// Send a follow-up message
window.openai.sendFollowUpMessage({
  role: 'user',
  content: 'Successfully authenticated!'
});

// Store persistent state
window.openai.setWidgetState({ sessionId: 'xyz' });
```

### 3. Authentication Flow

```
User in ChatGPT: "I want to sign in"
                 ↓
ChatGPT calls: authenticate_user tool
                 ↓
MCP Server returns: Component URL + session data
                 ↓
ChatGPT renders: auth.html in iframe
                 ↓
User fills form & submits
                 ↓
Component calls: /api/authenticate
                 ↓
Server validates & stores session
                 ↓
Component notifies ChatGPT: "User authenticated!"
                 ↓
ChatGPT can now call: get_user_profile
```

## 🚀 Next Steps

### Adding Real OAuth

Replace the simple authentication with OAuth 2.1:

1. Choose a provider (Auth0, Okta, Google, GitHub)
2. Update `server.js` OAuth configuration
3. Implement OAuth flow in the component
4. See: https://developers.openai.com/apps-sdk/build/auth

### Deploying to Production

1. **Deploy the server** (Vercel, Railway, Heroku, etc.)
2. **Update URLs** in the code to use your production domain
3. **Add security**:
   - Use a real database for sessions
   - Add HTTPS
   - Implement CSRF protection
   - Add rate limiting
4. **Submit to OpenAI** for app review

### Creating More Components

You can create additional components for different use cases:

- **Dashboard** - Show user analytics
- **Data Table** - Display and edit records
- **Map** - Show geo data
- **Calendar** - Schedule management
- **Shopping Cart** - E-commerce flow

Check out examples: https://github.com/openai/openai-apps-sdk-examples

## 📚 Resources

- [Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [Design Components Guide](https://developers.openai.com/apps-sdk/plan/components)
- [Authentication Guide](https://developers.openai.com/apps-sdk/build/auth)
- [Build ChatGPT UI Guide](https://developers.openai.com/apps-sdk/build/chatgpt-ui)
- [Example Components](https://github.com/openai/openai-apps-sdk-examples)

## 🐛 Troubleshooting

### Component not showing in ChatGPT

- Make sure server is running: `http://localhost:3000`
- Check browser console for errors
- Verify MCP metadata: `http://localhost:3000/.well-known/mcp.json`

### Authentication not working

- Check Network tab in browser DevTools
- Verify sessionId is being passed correctly
- Check server logs for errors

### CORS errors

- The server includes CORS headers by default
- If still seeing errors, check your browser's security settings

## 💡 Tips

- Use browser DevTools to debug the component (it's just HTML/JS)
- Check server logs to see what ChatGPT is calling
- Start simple and add features incrementally
- Test the component standalone before integrating with ChatGPT

## 📄 License

MIT - Feel free to use this as a starting point for your own ChatGPT components!

