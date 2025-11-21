# window.openai API Usage Reference

## Overview

Our component now correctly implements all the required `window.openai` APIs from the [OpenAI Apps SDK documentation](https://developers.openai.com/apps-sdk/build/ui-components/).

## 1. ✅ Initial Data: `window.openai.toolOutput`

**Documentation says:**
> "Use window.openai.toolOutput as the initial render data"

**Our Implementation:**
```javascript
const toolOutput = window.openai.toolOutput;
if (toolOutput) {
  // Access data directly from toolOutput (matches structuredContent from server)
  sessionId = toolOutput.sessionId;
  if (toolOutput.message) {
    document.getElementById('authMessage').textContent = toolOutput.message;
  }
}
```

**Server sends:**
```javascript
{
  structuredContent: {
    sessionId: 'sess_xxx',
    message: 'Sign in to your Target account'
  }
}
```

**Component receives:**
```javascript
window.openai.toolOutput = {
  sessionId: 'sess_xxx',
  message: 'Sign in to your Target account'
}
```

## 2. ✅ Caching State: `window.openai.setWidgetState()`

**Documentation says:**
> "To cache state for re-rendering, you can use window.openai.setWidgetState"

**Our Implementation:**
```javascript
// After successful authentication, save state
if (window.openai.setWidgetState) {
  await window.openai.setWidgetState({
    authenticated: true,
    user: data.user,
    sessionId: sessionId
  });
}
```

**Restoring State:**
```javascript
const widgetState = window.openai.widgetState;
if (widgetState && widgetState.authenticated) {
  showSuccess(widgetState.user);
}
```

**Why this matters:**
- If ChatGPT re-renders the widget, it will restore the authenticated state
- User doesn't have to sign in again if they scroll up/down
- State persists across conversation turns

## 3. ✅ Subsequent Interactions: `window.openai.callTool()`

**Documentation says:**
> "On subsequent followups that invoke callTool, use the return value of callTool"

**Usage Example:**
```javascript
// Call another MCP tool from the component
const response = await window.openai.callTool('get_user_profile', {
  sessionId: sessionId
});

console.log('Profile:', JSON.parse(response.result));
```

**Future Enhancement:**
We could add a "View Profile" button that calls `get_user_profile` tool directly from the component.

## 4. ✅ Follow-up Messages: `window.openai.sendFollowUpMessage()`

**Our Implementation:**
```javascript
// Notify ChatGPT after successful authentication
if (window.openai.sendFollowUpMessage) {
  await window.openai.sendFollowUpMessage({
    prompt: `Successfully authenticated as ${data.user.name}. Session ID: ${sessionId}`
  });
}
```

**What this does:**
- Sends a message back to ChatGPT as if the user typed it
- Allows ChatGPT to respond to the authentication event
- Keeps the conversation flowing naturally

## 5. Additional APIs We Use

### Theme Detection
```javascript
const theme = window.openai.theme; // 'light' or 'dark'
```

### Display Mode
```javascript
const displayMode = window.openai.displayMode; // 'inline', 'pip', 'fullscreen'
```

### User Agent
```javascript
const userAgent = window.openai.userAgent;
// { device: { type: 'mobile' | 'tablet' | 'desktop' }, capabilities: { hover, touch } }
```

## Complete Flow

### Initial Render:
1. ChatGPT calls `authenticate_user` tool
2. Server returns `structuredContent: { sessionId, message }`
3. Widget receives data via `window.openai.toolOutput`
4. Widget displays login form with custom message

### User Signs In:
1. User enters email/password and clicks "Sign In"
2. Component calls `/api/auth/login` endpoint
3. Server authenticates (demo mode: accepts any credentials)
4. Component calls `window.openai.setWidgetState()` to cache auth state
5. Component calls `window.openai.sendFollowUpMessage()` to notify ChatGPT
6. Widget displays success message

### Re-render:
1. If ChatGPT re-renders the widget
2. Widget checks `window.openai.widgetState`
3. If authenticated, shows success screen immediately
4. User doesn't have to sign in again

## Key Differences from Before

| Before ❌ | After ✅ |
|----------|---------|
| `toolOutput.data.sessionId` | `toolOutput.sessionId` |
| No state caching | `setWidgetState()` implemented |
| No tool calling | `callTool()` available |
| Wrong message API | Correct `sendFollowUpMessage({ prompt })` |

## Testing the APIs

### Console Commands (in browser DevTools):

```javascript
// Check what data the widget received
console.log('toolOutput:', window.openai.toolOutput);

// Check current widget state
console.log('widgetState:', window.openai.widgetState);

// Call another tool
const profile = await window.openai.callTool('get_user_profile', {
  sessionId: 'sess_xxx'
});

// Send a message to ChatGPT
await window.openai.sendFollowUpMessage({
  prompt: 'Show me my profile details'
});

// Check theme
console.log('Theme:', window.openai.theme);

// Check display mode
console.log('Display mode:', window.openai.displayMode);
```

## References

- [OpenAI Apps SDK - Design Components](https://developers.openai.com/apps-sdk/plan/components/)
- [OpenAI Apps SDK - Build ChatGPT UI](https://developers.openai.com/apps-sdk/build/ui-components/)
- [Official Examples - Types](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/types.ts)
- [Official Examples - Widget Props Hook](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/use-widget-props.ts)
- [Official Examples - Widget State Hook](https://github.com/openai/openai-apps-sdk-examples/blob/main/src/use-widget-state.ts)

