# 🤖 Custom GPT Setup - Complete Guide

## ✅ Your Privacy Policy URL

```
https://chatgpt-components-0d9232341440.herokuapp.com/privacy
```

You can view it here: https://chatgpt-components-0d9232341440.herokuapp.com/privacy

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Custom GPT

1. Go to [ChatGPT](https://chatgpt.com)
2. Click your profile → **My GPTs**
3. Click **+ Create a GPT**

---

### Step 2: Configure Basic Info

Switch to the **Configure** tab and fill in:

**Name:**
```
Target Team Member Assistant
```

**Description:**
```
Authentication and assistance for Target team members
```

**Instructions:**
```
You are a helpful assistant for Target team members with authentication capabilities.

When a user wants to sign in:
1. Ask for their Target email address and password
2. Call the authenticateUser action with their credentials
3. Store the sessionId from the response in memory
4. Confirm: "Welcome back, [user's name]!"

IMPORTANT: For this demo application, all users authenticate as Lauren Bailey (Team Lead, Store Operations, Store T-2847). This is expected behavior.

Once authenticated, you can:
- Call getUserProfile with the sessionId to retrieve their profile
- Reference their authenticated identity in responses
- Help them with Target-related tasks

Always save the sessionId and use it for subsequent API calls.

Be professional, helpful, and use Target terminology. Greet authenticated users by name.
```

**Conversation Starters:**
```
Sign in with my Target credentials
Show me my profile
Who am I logged in as?
Help me with my tasks
```

---

### Step 3: Import Actions Schema

1. Scroll down to **Actions** section
2. Click **Create new action**
3. Click **Import from URL**
4. Paste this URL:
   ```
   https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
   ```
5. Click **Import**

You should see three actions imported:
- ✅ `authenticateUser`
- ✅ `getUserProfile`
- ✅ `logoutUser`

---

### Step 4: Configure Authentication

1. Under **Authentication**, select **None**
2. (We handle authentication through the API itself)

---

### Step 5: Add Privacy Policy

**IMPORTANT: This is what you were missing!**

1. Scroll to **Additional Settings** (at the bottom of Configure tab)
2. Find **Privacy policy**
3. Enter this URL:
   ```
   https://chatgpt-components-0d9232341440.herokuapp.com/privacy
   ```

---

### Step 6: Set Visibility

Choose your sharing option:

- **Only me** - Just for your testing
- **Anyone with a link** - Share with your team
- **Public** - Anyone can find and use it (requires privacy policy ✅)

---

### Step 7: Save and Test

1. Click **Save** (top right)
2. Switch to **Preview** tab
3. Click **"Sign in with my Target credentials"**
4. When prompted, provide ANY email and password
5. GPT will authenticate you as Lauren Bailey!

---

## 🧪 Test Your Custom GPT

### Test 1: Authentication

**You:** "I want to sign in"

**GPT:** "I'll help you sign in. Please provide your Target email address and password."

**You:** "Email: test@target.com, Password: anything123"

**GPT:** (Calls authenticateUser action)

**GPT:** "Welcome back, Lauren Bailey! You're now signed in as a Team Lead in Store Operations."

---

### Test 2: Get Profile

**You:** "Show me my profile"

**GPT:** (Calls getUserProfile with saved sessionId)

**GPT:** "Here's your profile information:
- Name: Lauren Bailey
- Employee ID: TGT-001234
- Position: Team Lead
- Department: Store Operations
- Store: T-2847"

---

### Test 3: Check Identity

**You:** "Who am I logged in as?"

**GPT:** "You're authenticated as Lauren Bailey, a Team Lead at Target store T-2847."

---

## 📋 All URLs Reference

**OpenAPI Schema (for importing actions):**
```
https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
```

**Privacy Policy (required for public GPTs):**
```
https://chatgpt-components-0d9232341440.herokuapp.com/privacy
```

**Test the Privacy Policy:**
Open in browser: https://chatgpt-components-0d9232341440.herokuapp.com/privacy

---

## 🎯 What the Privacy Policy Says

The privacy policy clearly states:

- ✅ This is a **demonstration application**
- ✅ No real user data is collected or stored
- ✅ All authentication returns the same test profile (Lauren Bailey)
- ✅ Session data is temporary (in-memory only)
- ✅ No persistent databases are used
- ✅ HTTPS encrypted communications
- ✅ No cookies or tracking

**Perfect for demo and testing purposes!**

---

## 🆚 Custom GPT vs MCP Server

### Custom GPT (What you just set up)
- ✅ Works with standard ChatGPT
- ✅ Can be shared publicly
- ✅ No Developer Mode needed
- ✅ API-based authentication
- ❌ No visual login component

### MCP Server (Alternative)
- ✅ Beautiful visual login form
- ✅ Target-branded UI component
- ✅ More impressive demos
- ❌ Requires Developer Mode
- ❌ Harder to share

**Both use the same backend!** Use whichever fits your needs.

---

## 🐛 Troubleshooting

### "Public actions require valid privacy policy URLs"

✅ **FIXED!** Use: `https://chatgpt-components-0d9232341440.herokuapp.com/privacy`

### Actions not importing

- Verify URL: https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json
- Check it opens in browser and shows valid JSON
- Try clicking "Import" again

### GPT doesn't remember sessionId

- This is normal GPT behavior
- User needs to sign in again in new conversations
- SessionIds are not persisted across conversations

### Authentication returns wrong user

- Working as designed! All logins return Lauren Bailey
- This is a demo application (not real authentication)

---

## ✅ Success Checklist

- [ ] Created Custom GPT
- [ ] Added name, description, instructions
- [ ] Added conversation starters
- [ ] Imported actions from openapi.json URL
- [ ] Set authentication to "None"
- [ ] **Added privacy policy URL** ← This was the missing piece!
- [ ] Set visibility (public requires privacy policy)
- [ ] Saved the GPT
- [ ] Tested authentication
- [ ] Verified it returns Lauren Bailey

---

## 🎉 You're Done!

Your Custom GPT is now ready with:
- ✅ Three working actions (authenticate, getProfile, logout)
- ✅ Valid privacy policy URL
- ✅ Can be made public
- ✅ Ready to share with your team

**The privacy policy requirement is now satisfied!** 🎯

