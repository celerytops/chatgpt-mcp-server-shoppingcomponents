# Test the Pizzaz Widget in ChatGPT

## ✅ Server Status
- **Deployed**: https://chatgpt-components-0d9232341440.herokuapp.com/
- **MCP Endpoint**: https://chatgpt-components-0d9232341440.herokuapp.com/mcp

## Step 1: Connect to ChatGPT

1. Open **ChatGPT**
2. Go to **Settings → Connectors**
3. Click **"Add connector"** or **"Create new app"**
4. Enter this URL:
   ```
   https://chatgpt-components-0d9232341440.herokuapp.com/mcp
   ```
5. Give it a name: **"Pizzaz Demo"**
6. Save

## Step 2: Test the Widget

1. **Start a new conversation**
2. Click the **"More" (⋯)** button or **paperclip icon**
3. Select **"Pizzaz Demo"** from your connectors
4. Ask ChatGPT:
   ```
   Show me a pizza list with pepperoni
   ```
   or
   ```
   I want to see pizza places with mushrooms
   ```

## Expected Result

You should see:
- 🍕 A **beautiful pizza list widget** appear inline
- The widget showing **"Featuring [topping] pizzas"** with your chosen topping
- A list of 5 pizza places with names, cities, and ratings
- Clean, modern styling with hover effects

## Troubleshooting

### Widget Not Showing?
1. **Disconnect and reconnect** the connector in Settings
2. **Start a fresh conversation**
3. Make sure you **added the connector** to the conversation
4. **Check Chrome flags** (if using Chrome 142+): Disable `#local-network-access-check`

### Check Server Logs
```bash
heroku logs --tail --app chatgpt-components
```

## What's Working

This is a **working copy** of the official [OpenAI Pizzaz example](https://github.com/openai/openai-apps-sdk-examples):
- ✅ MCP server properly configured
- ✅ SSE transport working
- ✅ Resource handlers serving widget HTML
- ✅ Tool definition with proper metadata
- ✅ Widget receives data via `window.openai.toolOutput`

## Next Steps

Once this works, we can:

### 1. Modify the Widget
Edit `widgets/pizza-list.html` to:
- Change the styling
- Add more data
- Make it interactive

### 2. Change the Data Structure
Edit `server.js` to:
- Pass different data in `structuredContent`
- Add more parameters
- Create different tools

### 3. Build Target Auth
Copy this pattern to create:
- `widgets/target-auth.html` - Target-branded login
- New tool: `authenticate-target-customer`
- Pass session data through `structuredContent`

### 4. Add More Widgets
Create additional widgets:
- Profile viewer
- Order history
- Circle rewards dashboard

## Files to Customize

```
widgets/
  pizza-list.html    ← Modify this for UI changes
  
server.js            ← Modify this for data/tools changes
```

The pattern is simple:
1. Widget receives data via `window.openai.toolOutput`
2. Widget renders using that data
3. No API calls from the widget
4. All data comes from `structuredContent` in server response

## Architecture

```
ChatGPT
  ↓ (calls tool)
Server.js
  ↓ (returns structuredContent)
ChatGPT
  ↓ (requests resource)
Server.js (serves HTML)
  ↓ (renders with toolOutput)
Widget displays!
```

