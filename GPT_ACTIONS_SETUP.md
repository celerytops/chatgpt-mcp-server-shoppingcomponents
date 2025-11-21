# 🎯 Custom GPT Actions Setup Guide

This guide shows you how to use the Target authentication component with **Custom GPT Actions** (alternative to MCP Server).

## What's the Difference?

| Feature | MCP Server | Custom GPT Actions |
|---------|-----------|-------------------|
| UI Components | ✅ Yes (rendered in ChatGPT) | ❌ No (API only) |
| Visual Login Form | ✅ Beautiful Target-branded UI | ❌ Text-based only |
| Authentication | Interactive component | API calls in background |
| Best For | Rich user interactions | Simple API integration |
| Availability | ChatGPT with Developer Mode | Any Custom GPT |

## When to Use Each

### Use MCP Server When:
- ✅ You want a visual login form
- ✅ You need interactive components
- ✅ User should see and interact with UI
- ✅ You want the full branded experience

### Use GPT Actions When:
- ✅ You want simple API integration
- ✅ You're building a Custom GPT
- ✅ Visual components aren't needed
- ✅ You prefer API-based auth

## 🚀 Setting Up Custom GPT with Actions

### Step 1: Deploy Your Server

First, deploy to Heroku following [HEROKU_DEPLOYMENT.md](HEROKU_DEPLOYMENT.md).

You'll get a URL like: `https://your-app-name.herokuapp.com`

### Step 2: Verify OpenAPI Schema

Visit your schema endpoint to confirm it's working:

```
https://your-app-name.herokuapp.com/openapi.json
```

You should see a JSON schema with authentication endpoints.

### Step 3: Create a Custom GPT

1. Go to [ChatGPT](https://chatgpt.com)
2. Click your **profile icon** (bottom left)
3. Select **My GPTs**
4. Click **+ Create a GPT**

### Step 4: Configure Your GPT

In the **Configure** tab:

**Name:**
```
Target Team Member Assistant
```

**Description:**
```
Assistant for Target team members with authenticated access to employee information and tools.
```

**Instructions:**
```
You are a helpful assistant for Target team members. 

When a user first interacts with you, greet them and ask if they'd like to sign in with their Target credentials.

To authenticate a user:
1. Ask for their Target email and password
2. Use the authenticateUser action to sign them in
3. Save the sessionId from the response
4. Confirm they are now signed in as [their name]

Once authenticated, you can:
- Retrieve their profile information using getUserProfile
- Help them with Target-related tasks
- Use their authenticated identity for personalized responses

The user will always be authenticated as Lauren Bailey for this demo.

Important: 
- Always greet authenticated users by name
- Keep track of the sessionId for subsequent API calls
- If the sessionId is lost, ask the user to sign in again
```

**Conversation Starters:**
```
Sign in with my Target credentials
Show me my profile
Help me with my Target tasks
What can you help me with?
```

### Step 5: Add Actions

1. Scroll down to **Actions**
2. Click **Create new action**
3. In the **Schema** field, you have two options:

#### Option A: Import from URL (Recommended)

Click **Import from URL** and enter:
```
https://your-app-name.herokuapp.com/openapi.json
```

Click **Import**

#### Option B: Paste Schema Manually

Copy and paste this schema:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Target Team Member Authentication API",
    "description": "API for Target team member authentication and profile management",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://your-app-name.herokuapp.com"
    }
  ],
  "paths": {
    "/api/actions/authenticate": {
      "post": {
        "operationId": "authenticateUser",
        "summary": "Authenticate a Target team member",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string" },
                  "password": { "type": "string" }
                },
                "required": ["email", "password"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successfully authenticated"
          }
        }
      }
    },
    "/api/actions/profile": {
      "get": {
        "operationId": "getUserProfile",
        "summary": "Get authenticated user's profile",
        "parameters": [
          {
            "name": "sessionId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "User profile retrieved"
          }
        }
      }
    },
    "/api/actions/logout": {
      "post": {
        "operationId": "logoutUser",
        "summary": "Log out the current user",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "sessionId": { "type": "string" }
                },
                "required": ["sessionId"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successfully logged out"
          }
        }
      }
    }
  }
}
```

(Replace `your-app-name` with your actual Heroku app name)

### Step 6: Configure Authentication

1. In the Actions panel, under **Authentication**
2. Select **None**
3. (We're handling auth via the API, not OAuth)

### Step 7: Privacy Settings

Set the privacy level:
- **Only me** - Just for testing
- **Anyone with a link** - Share with team
- **Public** - Anyone can use it

### Step 8: Save and Test!

1. Click **Save** (top right)
2. Switch to the **Preview** tab
3. Test it out!

## 🧪 Testing Your Custom GPT

Try these conversations:

### Test 1: Basic Authentication

**You:** 
```
I'd like to sign in
```

**GPT:** 
```
Sure! I can help you sign in. Please provide:
1. Your Target email address
2. Your password
```

**You:**
```
Email: test@target.com
Password: mypassword
```

**GPT:**
```
✓ Welcome back, Lauren Bailey! You're now signed in.

Your profile:
- Employee ID: TGT-001234
- Department: Store Operations
- Position: Team Lead
- Store: T-2847
```

### Test 2: Get Profile

**You:**
```
Show me my profile information
```

**GPT:**
```
Here's your Target team member profile:

Name: Lauren Bailey
Email: lauren.bailey@target.com
Employee ID: TGT-001234
Department: Store Operations
Position: Team Lead
Store Number: T-2847

Is there anything specific you'd like to know or update?
```

### Test 3: Log Out

**You:**
```
Log me out
```

**GPT:**
```
Lauren Bailey has been successfully signed out. 
Come back anytime! 👋
```

## 🎨 Customizing the Experience

### Add More Context

In the GPT instructions, you can add:

```
After authentication, you have access to:
- Employee schedules
- Shift management
- Store inventory
- Team communications
- Training materials

Always be helpful, professional, and friendly. Use Target's brand voice.
```

### Add More Actions

Extend the OpenAPI schema with additional endpoints:

- `/api/actions/schedule` - Get employee schedule
- `/api/actions/inventory` - Check inventory
- `/api/actions/tasks` - Manage tasks
- `/api/actions/team` - Team information

Update your `server.js` to handle these endpoints.

### Improve Instructions

Make the GPT more conversational:

```
You should:
- Greet users warmly
- Use their name once authenticated
- Offer proactive help
- Explain what you can do
- Ask clarifying questions
- Provide step-by-step guidance
- Use Target terminology
```

## 🔐 How Authentication Works

```
User → GPT: "I want to sign in"
         ↓
GPT: Asks for email and password
         ↓
User: Provides credentials
         ↓
GPT → API: POST /api/actions/authenticate
            { email: "...", password: "..." }
         ↓
API: Returns user profile + sessionId
         ↓
GPT: Saves sessionId (in conversation context)
         ↓
GPT: "Welcome, Lauren Bailey!"
         ↓
User: "Show my profile"
         ↓
GPT → API: GET /api/actions/profile?sessionId=xxx
         ↓
API: Returns profile data
         ↓
GPT: Shows profile to user
```

## 📊 Comparison: MCP vs Actions

### MCP Server Experience

```
User: "Log me in"
  ↓
ChatGPT shows beautiful Target-branded login form
  ↓
User fills in email/password in visual form
  ↓
Clicks red "SIGN IN" button
  ↓
Sees success message with Target branding
  ↓
ChatGPT: "Lauren Bailey is now authenticated"
```

### GPT Actions Experience

```
User: "Log me in"
  ↓
GPT: "Please provide your email and password"
  ↓
User: "test@target.com / password123"
  ↓
GPT: (calls API in background)
  ↓
GPT: "Welcome back, Lauren Bailey!"
```

## 🐛 Troubleshooting

### Actions Not Working

1. **Check the schema URL:**
   ```
   https://your-app-name.herokuapp.com/openapi.json
   ```

2. **Verify server is running:**
   ```bash
   heroku logs --tail
   ```

3. **Test API directly:**
   ```bash
   curl -X POST https://your-app-name.herokuapp.com/api/actions/authenticate \
     -H "Content-Type: application/json" \
     -d '{"email":"test@target.com","password":"test123"}'
   ```

### GPT Doesn't Remember Session

- sessionId should be maintained in conversation context
- If lost, user needs to sign in again
- This is normal GPT behavior

### API Returns Errors

Check Heroku logs:
```bash
heroku logs --tail
```

Look for:
- Request errors
- Missing parameters
- CORS issues

## 💡 Pro Tips

1. **Test API First**: Test endpoints with curl/Postman before adding to GPT
2. **Clear Instructions**: Be very specific in GPT instructions about when/how to call actions
3. **Handle Errors Gracefully**: Tell GPT what to do when API calls fail
4. **Session Management**: Explain in instructions how to handle sessionId
5. **User Experience**: Make authentication feel natural, not technical
6. **Provide Examples**: Give GPT example conversations in instructions

## 🎯 Next Steps

1. ✅ Set up Custom GPT with Actions
2. ✅ Test authentication flow
3. ✅ Add more actions/endpoints
4. ✅ Customize GPT personality
5. ✅ Add team-specific features
6. ✅ Share with team members
7. 📈 Monitor usage
8. 🔄 Iterate based on feedback

## 📚 Resources

- [OpenAI Actions Documentation](https://platform.openai.com/docs/actions)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Custom GPTs Guide](https://help.openai.com/en/articles/8554397-creating-a-gpt)

## 🎊 You're All Set!

You now have both:
- **MCP Server** - For rich, visual authentication with components
- **GPT Actions** - For API-based authentication in Custom GPTs

Use whichever fits your needs best!

