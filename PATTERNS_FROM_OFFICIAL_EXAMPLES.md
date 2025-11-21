# Patterns Learned from Official OpenAI Examples

## Source
Analyzed the [official OpenAI Apps SDK examples](https://github.com/openai/openai-apps-sdk-examples) to understand how to properly build components.

## Key Findings

### 1. Components Don't Make API Calls ❌→✅

**Before (Wrong):**
```javascript
// Our component was calling the server
const response = await fetch(`${serverUrl}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password, sessionId })
});
```

**After (Correct):**
```javascript
// Components work entirely with window.openai.toolOutput
const toolOutput = window.openai?.toolOutput || {};
const sessionId = toolOutput.sessionId;
const message = toolOutput.message;
```

**Why:** The server passes all needed data via `structuredContent`, which becomes `window.openai.toolOutput` in the component. Components should be **self-contained** with all data provided upfront.

### 2. Build Process (For Complex Components)

Official examples use:
- **React/JSX** for components (`src/pizzaz-list/index.jsx`)
- **Vite** to bundle into standalone HTML files (`assets/pizzaz-list.html`)
- **Tailwind CSS** for styling
- Result: Single HTML file with all CSS/JS inlined

For **simple components** (like ours):
- Vanilla HTML/CSS/JS works fine
- No build process needed
- Just ensure all styles are inline or in `<style>` tags

### 3. Server Pattern (Python Example)

```python
# Define widget
widget = PizzazWidget(
    identifier="pizza-list",
    title="Show Pizza List",
    template_uri="ui://widget/pizza-list.html",  # Custom URI scheme
    html=read_widget_html("pizzaz-list"),
    response_text="Rendered a pizza list!"
)

# Tool handler returns
return types.CallToolResult(
    content=[
        types.TextContent(type="text", text=widget.response_text)
    ],
    structuredContent={"pizzaTopping": topping},  # ← Data for component
    _meta={
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked
    }
)

# Resource handler serves HTML
return types.ReadResourceResult(
    contents=[
        types.TextResourceContents(
            uri=widget.template_uri,
            mimeType="text/html+skybridge",  # Special mimeType
            text=widget.html,
            _meta=tool_meta(widget)
        )
    ]
)
```

### 4. Required Metadata

Tools with widgets MUST include these `_meta` fields:

```javascript
{
  "openai/outputTemplate": "ui://widget/target-auth.html",  // URI to widget
  "openai/toolInvocation/invoking": "Opening Target sign-in",  // Loading message
  "openai/toolInvocation/invoked": "Sign-in form ready",  // Complete message
  "openai/widgetAccessible": true,
  "openai/resultCanProduceWidget": true
}
```

### 5. Component Structure

**React Pattern (Official):**
```jsx
function App() {
  return <div>...</div>;
}
createRoot(document.getElementById("pizzaz-list-root")).render(<App />);
```

**Vanilla JS Pattern (Ours):**
```javascript
function render() {
  const root = document.getElementById('auth-root');
  root.innerHTML = `<div>...</div>`;
}
render();
```

Both work! Key is to have a root element that gets populated.

### 6. Data Flow

```
Server → structuredContent → window.openai.toolOutput → Component
```

**Example:**

```javascript
// Server sends:
{
  structuredContent: {
    sessionId: 'sess_123',
    message: 'Sign in to your Target account'
  }
}

// Component receives:
const toolOutput = window.openai.toolOutput;
// toolOutput = { sessionId: 'sess_123', message: '...' }
```

### 7. State Persistence

```javascript
// Save state
await window.openai.setWidgetState({
  authenticated: true,
  user: { name: 'Lauren Bailey' }
});

// Restore state (on re-render)
const widgetState = window.openai.widgetState;
if (widgetState?.authenticated) {
  showAuthenticatedView(widgetState.user);
}
```

### 8. Communication Back to ChatGPT

```javascript
// Send a follow-up message
await window.openai.sendFollowUpMessage({
  prompt: 'Successfully authenticated as Lauren Bailey'
});

// Call another tool (for advanced use)
const result = await window.openai.callTool('get_user_profile', {
  sessionId: sessionId
});
```

## What We Changed

### Component (`auth.html`)

1. ✅ Removed all `fetch()` calls
2. ✅ Made it work entirely from `window.openai.toolOutput`
3. ✅ Simplified to vanilla JS (no build needed)
4. ✅ Added proper state management
5. ✅ Pre-filled form for easy testing
6. ✅ Made authentication instant (demo mode)

### Server (`server.js`)

Already following the correct pattern:
1. ✅ Custom URI scheme: `ui://widget/target-auth.html`
2. ✅ Resource handlers implemented
3. ✅ Special mimeType: `text/html+skybridge`
4. ✅ `structuredContent` in tool response
5. ✅ All required `_meta` fields
6. ✅ SSE transport (GET /mcp + POST /mcp/messages)

## Testing Checklist

When you test in ChatGPT:

1. **Connect the MCP server**
   - URL: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
   - Should show in Settings → Connectors

2. **Add to conversation**
   - Click ⋯ or paperclip
   - Select "Target Auth"

3. **Trigger the widget**
   - Say: "I need to sign in to Target"
   - Should see the red Target login form appear inline

4. **Test the form**
   - Email: `lauren.bailey@example.com` (pre-filled)
   - Password: `password` (pre-filled)
   - Click "Sign In"
   - Should see success message instantly

5. **Verify state persistence**
   - Scroll up/down in the chat
   - Widget should remember you're authenticated

6. **Check console logs** (Browser DevTools)
   ```
   Target Auth Component loaded
   toolOutput: {sessionId: "sess_...", message: "..."}
   Widget state saved
   Follow-up message sent
   Target Auth Component ready
   ```

## Common Issues

### Widget Not Rendering?

1. **Disconnect and reconnect** the MCP server
2. **Start a fresh conversation**
3. **Check Chrome flags** (if using Chrome 142+): Disable `#local-network-access-check`
4. **Check Heroku logs**: `heroku logs --tail --app chatgpt-components`
5. **Test the resource endpoint**:
   ```bash
   curl -X POST https://chatgpt-components-0d9232341440.herokuapp.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"resources/read","params":{"uri":"ui://widget/target-auth.html"},"id":1}'
   ```

### Component Shows But Doesn't Work?

1. Open **Browser DevTools** → Console
2. Check for errors
3. Verify `window.openai` exists
4. Check `window.openai.toolOutput`

## References

- [Official Examples Repo](https://github.com/openai/openai-apps-sdk-examples)
- [Pizzaz Python Server](https://github.com/openai/openai-apps-sdk-examples/blob/main/pizzaz_server_python/main.py)
- [Pizzaz Node Server](https://github.com/openai/openai-apps-sdk-examples/blob/main/pizzaz_server_node/src/server.ts)
- [Pizzaz List Component](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/pizzaz-list/index.jsx)
- [OpenAI Apps SDK Docs](https://developers.openai.com/apps-sdk/)

