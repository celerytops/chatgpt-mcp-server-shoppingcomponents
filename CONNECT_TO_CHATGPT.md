# 🚀 Connect Your Target Auth to ChatGPT

Your app is live at: **https://chatgpt-components-0d9232341440.herokuapp.com**

## Option 1: Regular ChatGPT with Visual Component (MCP) ⭐ RECOMMENDED

### Step-by-Step:

1️⃣ **Open ChatGPT**
   - Go to: https://chatgpt.com

2️⃣ **Enable Developer Mode**
   - Click your profile icon (bottom left)
   - Click **Settings**
   - Click **Developer** (in left sidebar)
   - Toggle **Developer Mode** to ON

3️⃣ **Create Your App**
   - Click **+ Create App**
   - Fill in the form:
     - **Name:** `Target Team Member Authentication`
     - **MCP Server URL:** `https://chatgpt-components-0d9232341440.herokuapp.com`
   - Click **Create**

4️⃣ **Test It!**
   - In ChatGPT, type: **"Show me the login form"**
   - You'll see the beautiful Target-branded login component!
   - Try logging in with ANY email and password
   - Result: "Welcome back, Lauren Bailey!"

### What You Get:
✅ Beautiful Target-branded visual login form  
✅ Interactive component rendered in ChatGPT  
✅ Red Target colors and bullseye logo  
✅ Professional user experience  

---

## Option 2: Custom GPT with Actions (API Only)

### Step-by-Step:

1️⃣ **Create a Custom GPT**
   - Go to: https://chatgpt.com
   - Click your profile → **My GPTs**
   - Click **+ Create a GPT**

2️⃣ **Configure Basic Info**
   - Switch to **Configure** tab
   - **Name:** `Target Team Member Assistant`
   - **Description:** `Assistant for Target team members with authentication`

3️⃣ **Add Instructions**
   - In the **Instructions** field, paste:

```
You are a helpful assistant for Target team members.

When a user wants to sign in:
1. Ask for their Target email and password
2. Use the authenticateUser action with their credentials
3. Save the sessionId from the response
4. Confirm they are signed in as [name]

For this demo, all users authenticate as Lauren Bailey (Team Lead, Store Operations).

Once authenticated, you can:
- Use getUserProfile with the sessionId to get their info
- Help them with Target-related tasks
- Reference their identity in responses

Important: Always save and use the sessionId for subsequent API calls.

Be helpful, professional, and use Target terminology.
```

4️⃣ **Add Conversation Starters**
   - Click **+ Add** under Conversation Starters
   - Add these four:
     - `Sign in with my Target credentials`
     - `Show me my profile`
     - `Help me with my tasks`
     - `Who am I logged in as?`

5️⃣ **Import the Schema**
   - Scroll down to **Actions**
   - Click **Create new action**
   - Click **Import from URL**
   - Paste this URL:
     ```
     https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
     ```
   - Click **Import**

6️⃣ **Set Authentication**
   - Under **Authentication**, select **None**
   - (We handle auth through the API)

7️⃣ **Save and Test**
   - Click **Save** (top right)
   - Switch to **Preview** tab
   - Click **"Sign in with my Target credentials"**
   - Provide any email/password
   - GPT will authenticate as Lauren Bailey!

### What You Get:
✅ Custom GPT with authentication capability  
✅ API-based (no visual component)  
✅ Can be shared with others  
✅ Works in standard ChatGPT (no Developer Mode needed)  

---

## 🎯 Which Should You Use?

### Use MCP Server (Option 1) If:
- ✅ You want the beautiful visual login form
- ✅ You want to impress with the Target branding
- ✅ You're doing a demo or presentation
- ✅ You want the best user experience

### Use Custom GPT Actions (Option 2) If:
- ✅ You want to share with others easily
- ✅ You prefer API-based integration
- ✅ You don't need visual components
- ✅ You want to customize the GPT's behavior more

**Pro Tip:** You can set up BOTH! They use the same backend.

---

## 🧪 Test Commands

### For MCP Server (Option 1):
```
Show me the login form
```
```
I need to authenticate
```
```
Sign me in as a Target team member
```
```
Who am I logged in as?
```

### For Custom GPT (Option 2):
Just click the conversation starters or type naturally:
```
I want to sign in
```
```
Show my profile
```

---

## 🎨 What the Visual Component Looks Like

When using MCP Server, users see:

```
┌────────────────────────────────────┐
│                                    │
│         🎯 Target Logo             │
│    (red bullseye, pure CSS)        │
│                                    │
│     Team Member Sign In            │
│  Sign in with your Target creds    │
│                                    │
│  Target Email                      │
│  ┌──────────────────────────────┐ │
│  │ yourname@target.com          │ │
│  └──────────────────────────────┘ │
│                                    │
│  Password                          │
│  ┌──────────────────────────────┐ │
│  │ ••••••••••••                 │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │       SIGN IN                │ │
│  └──────────────────────────────┘ │
│      (big red button)              │
│                                    │
│  Need help? Target IT Support      │
│                                    │
└────────────────────────────────────┘
```

Target red (#cc0000), white background, professional design!

---

## ✅ Verification Checklist

Before connecting to ChatGPT, verify these URLs work:

**MCP Metadata:**
```
https://chatgpt-components-0d9232341440.herokuapp.com/.well-known/mcp.json
```
Open in browser → Should show JSON with "Target Team Member Authentication"

**OpenAPI Schema:**
```
https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
```
Open in browser → Should show OpenAPI 3.1.0 schema

**Login Component:**
```
https://chatgpt-components-0d9232341440.herokuapp.com/components/auth.html
```
Open in browser → Should show Target login form

All working? ✅ You're ready to connect to ChatGPT!

---

## 🎉 You're All Set!

Both options are ready to use:

**Option 1 (MCP):** Beautiful visual component  
**Option 2 (Actions):** API-based Custom GPT  

Choose what fits your needs, or set up both! 🚀

