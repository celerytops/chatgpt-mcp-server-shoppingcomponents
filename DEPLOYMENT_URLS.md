# 🌐 Your Heroku Deployment URLs

## Base URL
```
https://chatgpt-components-0d9232341440.herokuapp.com
```

---

## 🤖 For Regular ChatGPT (MCP Server with Visual Component)

### Setup Instructions:
1. Go to [ChatGPT](https://chatgpt.com)
2. Click your profile → **Settings**
3. Go to **Developer** section
4. Enable **Developer Mode**
5. Click **+ Create App**
6. Enter this **exact URL**:

```
https://chatgpt-components-0d9232341440.herokuapp.com
```

7. Name it: **Target Team Member Authentication**
8. Click **Create**

### What This Does:
- ChatGPT will automatically find the MCP metadata at `/.well-known/mcp.json`
- You'll be able to use commands like "Show me the login form"
- The beautiful Target-branded login component will appear
- Users can authenticate and ChatGPT will know them as Lauren Bailey

### Test It:
Once connected, try these prompts:
```
Show me the login form
```
```
I need to authenticate
```
```
Sign me in as a Target team member
```

---

## 🎯 For Custom GPT (Actions/API Only)

### Setup Instructions:
1. Go to [ChatGPT](https://chatgpt.com)
2. Click your profile → **My GPTs**
3. Click **+ Create a GPT**
4. Switch to **Configure** tab
5. Scroll to **Actions** section
6. Click **Create new action**
7. Click **Import from URL**
8. Paste this **exact URL**:

```
https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
```

9. Click **Import**
10. Set **Authentication** to **None**
11. Click **Save**

### What This Does:
- Imports three actions: authenticateUser, getUserProfile, logoutUser
- No visual component (API-based only)
- ChatGPT will handle authentication via API calls
- Still returns Lauren Bailey for all authentications

### Configure Your GPT:

**Name:**
```
Target Team Member Assistant
```

**Instructions:**
```
You are a helpful assistant for Target team members.

When a user wants to sign in:
1. Ask for their Target email and password
2. Use the authenticateUser action
3. Save the sessionId from the response
4. Confirm: "Welcome back, [name]!"

For this demo, all users authenticate as Lauren Bailey (Team Lead, Store Operations, Store T-2847).

Once authenticated, you can:
- Retrieve their profile using getUserProfile (pass the sessionId)
- Help with Target-related tasks
- Reference their authenticated identity

Always be helpful and professional.
```

**Conversation Starters:**
```
Sign in with my Target credentials
Show me my profile
Help me with my Target tasks
Who am I logged in as?
```

---

## 🧪 Testing Your Deployment

### Test the MCP Metadata:
```bash
curl https://chatgpt-components-0d9232341440.herokuapp.com/.well-known/mcp.json
```

Expected: JSON with "Target Team Member Authentication"

### Test the OpenAPI Schema:
```bash
curl https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
```

Expected: OpenAPI 3.1.0 schema with authentication endpoints

### Test the Auth Component:
Open in browser:
```
https://chatgpt-components-0d9232341440.herokuapp.com/components/auth.html
```

Expected: Beautiful Target login form

### Test Authentication API:
```bash
curl -X POST https://chatgpt-components-0d9232341440.herokuapp.com/api/actions/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@target.com","password":"test123"}'
```

Expected: Returns Lauren Bailey's profile with sessionId

---

## 📋 All Available Endpoints

### MCP Server (for regular ChatGPT)
```
GET  https://chatgpt-components-0d9232341440.herokuapp.com/.well-known/mcp.json
POST https://chatgpt-components-0d9232341440.herokuapp.com/mcp/tools/list
POST https://chatgpt-components-0d9232341440.herokuapp.com/mcp/tools/call
```

### Custom GPT Actions
```
GET  https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
POST https://chatgpt-components-0d9232341440.herokuapp.com/api/actions/authenticate
GET  https://chatgpt-components-0d9232341440.herokuapp.com/api/actions/profile?sessionId=xxx
POST https://chatgpt-components-0d9232341440.herokuapp.com/api/actions/logout
```

### UI Component
```
GET  https://chatgpt-components-0d9232341440.herokuapp.com/components/auth.html
```

---

## 🎨 Visual vs API Comparison

### Regular ChatGPT (MCP Server)
```
User: "Show me the login form"
  ↓
[Beautiful Target-branded login component appears]
  ↓
User fills email/password and clicks red SIGN IN button
  ↓
ChatGPT: "✓ Successfully authenticated as Lauren Bailey"
```

### Custom GPT (Actions)
```
User: "Sign me in"
  ↓
GPT: "Please provide your Target email and password"
  ↓
User: "test@target.com / password123"
  ↓
[API call happens in background]
  ↓
GPT: "Welcome back, Lauren Bailey!"
```

---

## 🔍 Quick Reference Card

**Base URL:**
```
https://chatgpt-components-0d9232341440.herokuapp.com
```

**For Regular ChatGPT MCP:**
- Use base URL when creating app
- Enables visual login component

**For Custom GPT Actions:**
- Import schema from: `/openapi.json`
- API-based authentication only

**Both modes:**
- ✅ Return Lauren Bailey
- ✅ Accept any credentials
- ✅ Work simultaneously
- ✅ Same backend

---

## ✅ Ready to Use!

Your Target authentication component is live and ready for both:
1. **Regular ChatGPT** with beautiful visual component
2. **Custom GPT** with API-based actions

Just use the URLs above! 🚀

