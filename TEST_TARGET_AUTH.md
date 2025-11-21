# Test Target Authentication in ChatGPT

## ✅ Deployed
**URL**: https://chatgpt-components-0d9232341440.herokuapp.com/mcp

## Quick Test

1. **Disconnect and reconnect** the connector in ChatGPT Settings
2. **Start a new conversation**
3. Add the connector
4. Say: **"I need to sign in to Target"** or **"Authenticate me with Target"**

## Expected Flow

### 1. Invoking Message
You'll see: **"Connecting to Target"**

### 2. Widget Appears - Screen 1: Login
- 🎯 Target bullseye logo (red with white rings)
- "Sign In" title
- Email input field
- Password input field
- Red "Sign In" button

**Try**: Enter any email/password (everything works!)

### 3. Screen 2: Verification Code
- "Enter the 6-digit code sent to your phone"
- 6 code input boxes
- Auto-advances as you type
- Red "Submit Code" button

**Try**: Enter any 6 digits (e.g., `123456`)

### 4. Screen 3: Success
- ✓ Green checkmark
- "Welcome Back!"
- "You're now signed in"
- Shows: **"Authenticated as Lauren Bailey"**
- Shows the email you entered

### 5. ChatGPT Gets Notified
ChatGPT receives: "Successfully authenticated as Lauren Bailey (your-email@example.com)"

## What Happens

After authentication, ChatGPT knows:
- ✅ User is authenticated
- ✅ Name: **Lauren Bailey**
- ✅ Email: (whatever you entered)
- ✅ Session ID: Generated unique ID

You can now ask ChatGPT things like:
- "What's my name?"
- "Show me my profile"
- "What email am I using?"

## Features

- 🎨 Target-branded (red color scheme)
- 🔄 3-screen flow with smooth transitions
- ⚡ Auto-advancing code inputs
- 📱 Responsive design
- 🔒 No real authentication (demo mode)
- ✨ Beautiful loading states

## Troubleshooting

### Widget Not Showing?
1. Disconnect and reconnect in Settings
2. Make sure you added the connector to the conversation
3. Try: "Authenticate with Target" or "Sign in to Target"

### Wrong Tool Called?
Try being more explicit:
- "I need to authenticate with Target"
- "Show me the Target login"
- "Sign in to my Target account"

