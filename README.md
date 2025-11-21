# Target Customer Authentication MCP Server

A Target-branded authentication component for ChatGPT, built with the MCP (Model Context Protocol).

## What This Does

Provides a beautiful 3-screen authentication flow:
1. **Login Screen**: Email + Password
2. **Verification Screen**: 6-digit code entry
3. **Success Screen**: Confirmation

Any credentials work (demo mode). After completion, ChatGPT knows the user authenticated as **Lauren Bailey**.

## Local Testing

```bash
npm install
npm start
```

Visit: http://localhost:8000

## Deploy to Heroku

```bash
git add -A
git commit -m "Update Target auth"
git push heroku main
```

## Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors
2. Add connector: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
3. In a conversation, add the connector
4. Ask: **"I need to sign in to Target"** or **"Authenticate me with Target"**

## The Flow

1. User asks to authenticate
2. **Invoking**: "Connecting to Target"
3. **Widget appears** with Target-branded login
4. User enters email + password → Click "Sign In"
5. User enters 6-digit code (any code works)
6. Success screen shows "Welcome Back, Lauren Bailey!"
7. **Invoked**: "Authentication required"
8. ChatGPT receives message: "Successfully authenticated as Lauren Bailey (email)"

## Widget Features

- ✅ Target red branding with bullseye logo
- ✅ 3-screen authentication flow
- ✅ Auto-advancing code inputs
- ✅ Smooth transitions
- ✅ Loading states
- ✅ Responsive design
- ✅ No external dependencies

## Customization

Edit `widgets/target-auth.html` to:
- Change colors/styling
- Modify the flow
- Add real authentication
- Change the user name

Edit `server.js` to:
- Change tool behavior
- Add more tools
- Integrate with real backend
