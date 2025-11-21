# Testing Guide - Target Customer Authentication Component

## What Changed

Your server has been **completely rebuilt** to follow the [official OpenAI Apps SDK patterns](https://github.com/openai/openai-apps-sdk-examples):

### Key Improvements:
1. ✅ **Custom URI scheme**: Uses `ui://widget/target-auth.html` instead of HTTP URLs
2. ✅ **Resource handlers**: Implements MCP resource reading (ChatGPT fetches HTML from your server)
3. ✅ **Special mimeType**: Uses `text/html+skybridge` for widgets
4. ✅ **structuredContent**: Proper data structure for widget props
5. ✅ **Complete metadata**: All required `_meta` fields for widget rendering
6. ✅ **SSE transport**: Proper Server-Sent Events implementation

## How to Test in ChatGPT

### Step 1: Connect Your MCP Server

1. Open ChatGPT Settings → **Connectors**
2. Click **"Add connector"** or **"Create new app"**
3. Enter the **MCP URL**:
   ```
   https://chatgpt-components-0d9232341440.herokuapp.com/mcp
   ```
4. Give it a name like: **"Target Auth"**
5. Save the connector

### Step 2: Add the Connector to Your Conversation

1. Start a new chat in ChatGPT
2. Click the **"More" (⋯)** button or **paperclip icon**
3. Select **"Target Auth"** from the list of available connectors
4. The connector should now be active in your conversation

### Step 3: Test the Authentication Component

Ask ChatGPT something like:

> "I need to sign in to my Target account"

or

> "Authenticate me with Target"

or

> "Show me the Target login"

### Expected Result

You should see:
- ✅ A **beautiful red Target-branded login form** rendered inline in the chat
- ✅ The form has email and password fields
- ✅ The Target bullseye logo is visible
- ✅ The form is interactive and styled

### Step 4: "Sign In" (Demo Mode)

1. Enter **any email** (e.g., `test@example.com`)
2. Enter **any password** (e.g., `password123`)
3. Click **"Sign In"**

The demo will authenticate you as **Lauren Bailey** regardless of what you enter.

### Step 5: Get Your Profile

After signing in, ask ChatGPT:

> "Show me my profile"

or

> "What's my Circle status?"

ChatGPT should retrieve and display your demo profile information.

## Troubleshooting

### Widget Not Rendering?

If you still don't see the widget:

1. **Disconnect and reconnect** the MCP server in ChatGPT settings
2. **Start a fresh conversation** - widgets may not appear in old conversations
3. **Check Chrome flags**: If using Chrome 142+, disable `#local-network-access-check` (see [known issue](https://github.com/openai/openai-apps-sdk-examples#note))

### Check Server Status

Visit: https://chatgpt-components-0d9232341440.herokuapp.com/

You should see server information and endpoints.

### View Heroku Logs

```bash
heroku logs --tail --app chatgpt-components
```

## Custom GPT Actions (Alternative)

If you want to use this with a Custom GPT instead:

1. Create a new Custom GPT
2. Go to **Actions** → **Import from URL**
3. Use: `https://chatgpt-components-0d9232341440.herokuapp.com/openapi.json`
4. Add privacy policy: `https://chatgpt-components-0d9232341440.herokuapp.com/privacy`

Note: Custom GPT Actions won't render the UI component - they only call the API endpoints.

## Differences from Before

| Before | After |
|--------|-------|
| `https://...` URLs | `ui://widget/...` custom URIs |
| No resource handlers | Full MCP resource implementation |
| `text/html` mimeType | `text/html+skybridge` mimeType |
| Simple text response | `structuredContent` with metadata |
| Missing widget metadata | Complete `_meta` fields |
| POST /mcp | GET /mcp (SSE) + POST /mcp/messages |

## What Happens Behind the Scenes

1. ChatGPT connects to your server via SSE (Server-Sent Events)
2. It queries available tools and sees `authenticate_user` has a widget
3. When called, the tool returns:
   - Text content for the model
   - `structuredContent` for the widget props
   - `_meta` pointing to the widget URI
4. ChatGPT fetches the widget HTML from your resource handler
5. It renders the HTML inline with the `structuredContent` as props
6. The widget uses `window.openai` to interact with ChatGPT

## Next Steps

Once the widget renders successfully:

- Customize the widget styling in `public/components/auth.html`
- Add more tools with their own widgets
- Implement real authentication (right now it's demo mode)
- Add error handling and validation

## Need Help?

Check the official examples:
- https://github.com/openai/openai-apps-sdk-examples
- https://developers.openai.com/apps-sdk/

