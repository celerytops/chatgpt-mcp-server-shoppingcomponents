# Quick Start Guide

Get up and running with MCP servers in 5 minutes! ⚡

---

## 🎯 Try the Live Servers (Fastest!)

No setup required - connect directly to the live servers:

### Step 1: Open ChatGPT
Go to [chat.openai.com](https://chat.openai.com)

### Step 2: Add Connector
1. Click **Settings** (bottom left)
2. Go to **Connectors**
3. Click **Add connector**
4. Paste: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
5. Click **Save**

### Step 3: Use It!
1. Start a new chat
2. Click **Attach** (paperclip icon)
3. Select your connector
4. Try these prompts:

```
"Sign me into my Target account"
"Show me fitness trackers"
"Add the Fitbit Charge 6 to my cart"
"Sign me up for Circle 360"
```

**That's it!** You're using MCP servers. 🎉

---

## 💻 Run Locally (5 Minutes)

Want to run your own server? Here's how:

### Prerequisites
- Node.js 20.x ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))

### Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/chatgpt-mcp-servers.git
cd chatgpt-mcp-servers
npm install
```

### Step 2: Start Server

```bash
npm start
```

You'll see:
```
🚀 MCP servers running on port 8000
```

### Step 3: Connect ChatGPT

1. In **ChatGPT Settings** → **Connectors**
2. Add: `http://localhost:8000/mcp`
3. Test it!

---

## 🚀 Deploy to Heroku (10 Minutes)

Make your server publicly accessible:

### Step 1: Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows/Linux:** [Download Installer](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Login & Create App

```bash
heroku login
heroku create your-mcp-server
```

### Step 3: Deploy

```bash
git push heroku main
```

Wait 1-2 minutes for deployment.

### Step 4: Get Your URL

```bash
heroku open
```

Your MCP server is at: `https://your-mcp-server.herokuapp.com/mcp`

### Step 5: Connect in ChatGPT

Add your new URL as a connector in ChatGPT!

---

## 🛠️ Try All 4 Servers

Each endpoint hosts a different MCP server:

| Endpoint | What It Does | Try This Prompt |
|----------|--------------|-----------------|
| `/mcp` | Authentication | *"Sign me into Target"* |
| `/mcp2` | Product Search | *"Show me coffee makers"* |
| `/mcp3` | Checkout | *"Check out with this item"* |
| `/mcp4` | Membership | *"Sign me up for Circle 360"* |

**Connect all 4:**
```
http://localhost:8000/mcp
http://localhost:8000/mcp2
http://localhost:8000/mcp3
http://localhost:8000/mcp4
```

---

## 🎨 Customize Your First Widget

Let's make a quick change to see how it works!

### Step 1: Open Widget File

```bash
code widgets/target-auth.html
# or
open -a "Visual Studio Code" widgets/target-auth.html
```

### Step 2: Change the Title

Find this line (around line 120):
```html
<h1>Sign In to Target</h1>
```

Change it to:
```html
<h1>Welcome to My Custom MCP!</h1>
```

### Step 3: Save and Restart

```bash
# Stop server (Ctrl+C)
npm start
```

### Step 4: Test in ChatGPT

Reconnect your MCP and see your changes!

---

## 📚 What's Next?

Now that you're running MCP servers, explore:

1. **[README.md](./README.md)** - Full documentation
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - How it all works
3. **[EXAMPLES.md](./EXAMPLES.md)** - Code examples
4. **[SETUP.md](./SETUP.md)** - Detailed setup guide

---

## 🆘 Common Issues

### Issue: "Cannot connect to MCP server"

**Fix**: Make sure your server is running:
```bash
npm start
```

### Issue: "Port 8000 already in use"

**Fix**: Change the port:
```bash
PORT=8001 npm start
```

Then connect to: `http://localhost:8001/mcp`

### Issue: Widget not showing

**Fix**: Check the browser console:
1. Right-click in ChatGPT
2. Select "Inspect"
3. Check for JavaScript errors

### Issue: "UNWRANGLE_API_KEY not set"

**Fix**: MCP2 needs an API key. Either:
- Get one at [unwrangle.com](https://unwrangle.com/)
- Or just use MCP1, MCP3, MCP4 (they don't need it)

---

## 💬 Test Prompts

Try these prompts to explore all features:

### Authentication (MCP1)
```
"Sign me into my Target account"
"Log me into Target"
"Authenticate with Target"
```

### Product Search (MCP2)
```
"Show me fitness trackers"
"Find bluetooth headphones on Target"
"Search for coffee makers"
"What smartwatches does Target have?"
```

### Checkout (MCP3)
```
"Add the Fitbit Charge 6 to my cart"
"Check out with this item"
"Complete my purchase"
```

### Membership (MCP4)
```
"Sign me up for Circle 360"
"What is Circle 360?"
"Enroll me in Target Circle membership"
```

---

## 🎓 Learning Path

**Beginner:** Use live servers → Try all prompts  
**Intermediate:** Run locally → Customize widgets  
**Advanced:** Deploy to Heroku → Build new tools  
**Expert:** Read code → Add your own MCP server  

---

## 🤝 Get Help

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/yourusername/chatgpt-mcp-servers/issues)
- **Documentation**: Check [README.md](./README.md)
- **Examples**: See [EXAMPLES.md](./EXAMPLES.md)

---

## 🎉 You're Ready!

You now have working MCP servers connected to ChatGPT. Start building something awesome!

**Next Challenge**: Create your own MCP tool!

1. Copy an existing tool in `server.js`
2. Change the name and logic
3. Create a new widget in `widgets/`
4. Test it in ChatGPT!

Happy building! 🚀

