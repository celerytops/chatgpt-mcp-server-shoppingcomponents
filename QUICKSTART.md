# ⚡ Quick Start Guide

## 🎯 What This Is

A Target-branded authentication component for ChatGPT that:
- ✅ Shows a beautiful Target login form
- ✅ Always authenticates as **Lauren Bailey** (demo)
- ✅ Works as **MCP Server** OR **Custom GPT Actions**
- ✅ Ready to deploy to Heroku

## 🚀 5-Minute Local Setup

### 1. Start the Server

```bash
cd "/Users/rdinh/ChatGPT Components"
npm start
```

You'll see:
```
🚀 Target Authentication MCP Server
✅ Ready to authenticate Target team members
```

### 2. Test It Works

Open in browser:
```
http://localhost:3000/components/auth.html
```

Try logging in with ANY email and ANY password.
Result: Always authenticates as **Lauren Bailey**.

### 3. Connect to ChatGPT

**Option A: MCP Server (for visual component)**

1. Open [ChatGPT](https://chatgpt.com)
2. Settings → Developer → Enable Developer Mode
3. Create App with URL: `http://localhost:3000`
4. Test: "Show me the login form"

**Option B: Custom GPT Actions (API only)**

See [GPT_ACTIONS_SETUP.md](GPT_ACTIONS_SETUP.md)

## 🌐 Deploy to Heroku (5 Minutes)

### 1. Install Heroku CLI

```bash
brew install heroku/brew/heroku
```

### 2. Deploy

```bash
heroku login
heroku create target-auth-component
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### 3. Get Your URL

```bash
heroku open
```

Your app is now at: `https://target-auth-component-xxxxx.herokuapp.com`

### 4. Connect to ChatGPT

Use your Heroku URL instead of localhost:
```
https://your-app-name.herokuapp.com
```

## 🎨 What Users See

### Target Login Form
- Target red and white branding
- Target bullseye logo
- "Team Member Sign In" header
- Email and password fields
- Red "SIGN IN" button
- Clean, professional design

### After Login
- ✓ Success checkmark
- "Welcome Back!" message
- User confirmed as Lauren Bailey
- ChatGPT knows user identity

## 🧪 Test Prompts

Try these in ChatGPT after setup:

```
Show me the login form
```

```
I need to sign in
```

```
Authenticate me
```

```
Who am I logged in as?
```

```
What's my profile information?
```

## 📋 API Endpoints

### MCP Server Endpoints
- `/.well-known/mcp.json` - Server metadata
- `/mcp/tools/list` - Available tools
- `/mcp/tools/call` - Execute tool

### GPT Actions Endpoints
- `/openapi.json` - OpenAPI schema
- `/api/actions/authenticate` - Login
- `/api/actions/profile` - Get profile
- `/api/actions/logout` - Logout

### Component
- `/components/auth.html` - Login UI

## 🔍 Key Features

1. **Always Returns Lauren Bailey**
   - Any email/password combo works
   - No real authentication
   - Perfect for demos

2. **Target Branding**
   - Official Target red (#cc0000)
   - Bullseye logo
   - Target fonts and styling
   - Professional appearance

3. **Dual Mode**
   - Works as MCP Server (with UI)
   - Works as GPT Actions (API only)
   - Same backend, different frontends

4. **Production Ready**
   - Heroku deployment files included
   - Environment variable support
   - Dynamic URL handling
   - CORS configured

## 📁 Files You Need to Know

```
server.js              - Main backend (MCP + API)
public/components/
  └── auth.html        - Target login form
Procfile               - Heroku config
package.json           - Dependencies
.env                   - Local config
```

## 🎯 Common Tasks

### Update Target Branding

Edit `public/components/auth.html`:
- Colors in `<style>` section
- Change `#cc0000` for different red
- Modify logo styling

### Change User Info

Edit `server.js`, find:
```javascript
const user = {
  id: "TGT-001234",
  email: "lauren.bailey@target.com",
  name: "Lauren Bailey",
  // ... change these values
}
```

### Add More Tools

In `server.js`, add to `/mcp/tools/list` array.

### Test Locally

```bash
# Start server
npm start

# Test in browser
open http://localhost:3000/components/auth.html

# Test MCP metadata
curl http://localhost:3000/.well-known/mcp.json

# Test OpenAPI schema
curl http://localhost:3000/openapi.json

# Test authentication
curl -X POST http://localhost:3000/api/actions/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@target.com","password":"test"}'
```

## 🐛 Troubleshooting

**Server won't start?**
```bash
# Check if port is in use
lsof -i :3000
# Kill it: kill -9 <PID>
```

**Component not showing in ChatGPT?**
- Check server is running
- Verify URL has no trailing slash
- Check browser console (F12)
- Look at server logs

**Heroku deployment issues?**
```bash
heroku logs --tail
```

## 📚 Full Documentation

- [README.md](README.md) - Complete docs
- [HEROKU_DEPLOYMENT.md](HEROKU_DEPLOYMENT.md) - Heroku guide
- [GPT_ACTIONS_SETUP.md](GPT_ACTIONS_SETUP.md) - Custom GPT guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details

## 💡 Pro Tips

1. **Test standalone first** - Open auth.html in browser before ChatGPT
2. **Check logs** - `npm start` shows all requests
3. **Use Heroku free tier** - Perfect for demos
4. **Customize styling** - Edit CSS in auth.html
5. **Add more fields** - Extend user object in server.js

## ✅ Success Checklist

- [ ] Server running locally
- [ ] Can open auth.html in browser
- [ ] Login works (any email/pass)
- [ ] Shows "Lauren Bailey" after login
- [ ] Connected to ChatGPT
- [ ] Tested in ChatGPT conversation
- [ ] Deployed to Heroku (optional)
- [ ] Tested production URL (optional)

## 🎊 You're Ready!

Your Target authentication component is working!

**Next steps:**
1. Customize the branding
2. Deploy to Heroku
3. Connect to ChatGPT
4. Share with your team
5. Build more features!

Questions? Check the full [README.md](README.md) or other guides.

