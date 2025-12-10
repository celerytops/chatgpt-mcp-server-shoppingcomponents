# MCP Server Examples

This document provides detailed examples and code snippets for each MCP server.

---

## Table of Contents

1. [Authentication Flow (MCP1)](#authentication-flow-mcp1)
2. [Product Search (MCP2)](#product-search-mcp2)
3. [Checkout System (MCP3)](#checkout-system-mcp3)
4. [Membership Signup (MCP4)](#membership-signup-mcp4)

---

## Authentication Flow (MCP1)

### Use Case
Session-based authentication with a multi-screen UI flow.

### User Flow
1. User: *"Sign me into Target"*
2. ChatGPT calls `create-target-session` → receives `sessionId`
3. ChatGPT calls `authenticate-target` with `sessionId` → widget appears
4. User enters credentials → verification code → success screen
5. ChatGPT receives: *"Successfully authenticated as Lauren Bailey (laurenbailey@gmail.com)"*

### Server Code

```javascript
// Create session
{
  name: 'create-target-session',
  description: 'MUST be called FIRST before authenticate-target. Creates a unique session ID for authentication.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

// In handler:
const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
authSessions.set(sessionId, {
  authenticated: false,
  createdAt: Date.now(),
  email: null,
  name: null
});

return {
  content: [{
    type: 'text',
    text: `Session created: ${sessionId}`
  }],
  structuredContent: { sessionId }
};
```

### Widget Code

```javascript
// widgets/target-auth.html
async function initialize() {
  const toolOutput = await window.openai.toolOutput();
  
  // Wait for sessionId
  if (!toolOutput.sessionId) {
    showLoadingScreen();
    setTimeout(initialize, 100);
    return;
  }
  
  const sessionId = toolOutput.sessionId;
  const isAuthenticated = toolOutput.authenticated || false;
  
  if (isAuthenticated) {
    showSuccessScreen(toolOutput.name);
  } else {
    showLoginScreen(sessionId);
  }
}

// Handle sign in
async function handleSignIn() {
  // Mark session as authenticated
  await fetch(`/api/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sessionId,
      email: 'laurenbailey@gmail.com',
      name: 'Lauren Bailey'
    })
  });
  
  // Update widget state
  await window.openai.setWidgetState({
    authenticated: true,
    email: 'laurenbailey@gmail.com',
    name: 'Lauren Bailey',
    sessionId
  });
  
  // Notify ChatGPT
  await window.openai.sendFollowUpMessage(
    'Successfully authenticated as Lauren Bailey (laurenbailey@gmail.com)'
  );
}
```

### Key Learnings

✅ **Sequential Tool Calls**: Force ChatGPT to call `create-target-session` before `authenticate-target` using clear descriptions  
✅ **Client-Side Polling**: Widget waits for `sessionId` instead of failing  
✅ **State Persistence**: Server stores session state in `Map`  
✅ **Session Cleanup**: Remove sessions older than 10 minutes

---

## Product Search (MCP2)

### Use Case
Search for products and display results in an interactive carousel with AI recommendations.

### User Flow
1. User: *"Show me fitness trackers"*
2. ChatGPT calls `search-target-products` → carousel appears with top 10 products
3. ChatGPT calls `get-agentforce-recommendations` → receives full data + personalized message
4. ChatGPT relays recommendations: *"Based on your purchase history, I recommend the Fitbit Charge 6..."*

### Server Code

```javascript
// Search tool
{
  name: 'search-target-products',
  description: 'Search for products on Target and display results in a carousel widget.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query (e.g., "bluetooth headphones", "coffee maker")'
      },
      page: {
        type: 'string',
        description: 'Page number (default: 1)'
      }
    },
    required: ['query']
  }
}

// In handler:
const response = await fetch(
  `https://data.unwrangle.com/api/getter/?platform=target_search&search=${query}&page=${page}&store_no=3991&api_key=${UNWRANGLE_API_KEY}`
);
const data = await response.json();

const topProducts = data.results.slice(0, 10).map(product => ({
  name: product.name,
  price: product.price,
  image: product.thumbnail,
  rating: product.rating,
  reviews: product.reviews_count,
  url: product.url
}));

return {
  content: [{
    type: 'widget',
    widget: 'product-carousel',
    data: {
      products: topProducts,
      query: query
    }
  }],
  structuredContent: {
    query,
    products: topProducts
  }
};
```

### Agentforce Recommendations

```javascript
// Recommendations tool
{
  name: 'get-agentforce-recommendations',
  description: 'Get detailed product information and personalized AI recommendations based on customer history.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      page: { type: 'string' }
    },
    required: ['query']
  }
}

// Personalized message
const personalizedMessage = `
🎯 **Agentforce Recommendation:**

Based on the customer's previous purchases, I recommend the **Fitbit Charge 6** as the best choice. Your husband owns the Fitbit Charge 3 currently, and the Charge 6 offers significant upgrades in health tracking, battery life, and compatibility with their existing fitness ecosystem.

Customer also last purchased an Obsidian-colored phone case, which is a color preference that is relevant to their current search.

Also, based on the customer's shopping history:
* Their husband is a long distance runner, purchasing multiple pieces of equipment and food items, designed for long distance training.
* They've also recently been browsing for wristband replacements, indicating wear and tear of the current model the husband owns.
* Marketing campaigns show that the husband has engaged with Target-sponsored marathons recently.

The Fitbit Charge 6 is the recommendation to provide to the customer. Please provide this back in a bulleted format, highlighting the hypersonalization of the recommendation.
`;
```

### Widget Features

- **Carousel Navigation**: Horizontal scrolling with smooth animations
- **Product Cards**: Image, name, price, rating, reviews
- **Detail View**: Click product → full detail page with back button
- **Dark Mode**: Automatic theme detection and styling
- **Loading State**: Shows spinner while waiting for API response

### Key Learnings

✅ **Two-Tool Pattern**: Separate tools for UI (carousel) and data (recommendations)  
✅ **API Integration**: Fetch real product data from external API  
✅ **Personalization**: Use customer context to generate tailored recommendations  
✅ **Responsive Design**: Carousel works in ChatGPT's narrow iframe

---

## Checkout System (MCP3)

### Use Case
Add products to cart and complete checkout with pre-filled information.

### User Flow
1. User: *"Add Fitbit Charge 6 to my cart"*
2. ChatGPT calls `add-to-cart` → success animation appears
3. User: *"Check out"*
4. ChatGPT calls `checkout` → order summary + pre-filled shipping/payment
5. User clicks "Complete Purchase" → success screen
6. ChatGPT: *"Your order has been placed! Order #12345"*

### Add to Cart

```javascript
{
  name: 'add-to-cart',
  description: 'Add a product to the shopping cart and show confirmation.',
  inputSchema: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'string' },
          image: { type: 'string' },
          quantity: { type: 'number', default: 1 }
        },
        required: ['name', 'price']
      }
    },
    required: ['product']
  }
}

// In handler:
const sessionId = `cart_${Date.now()}`;

// Always replace cart (single item only)
cartStorage.set(sessionId, {
  items: [product],
  createdAt: Date.now()
});

return {
  content: [{
    type: 'widget',
    widget: 'add-to-cart',
    data: {
      product,
      sessionId
    }
  }, {
    type: 'text',
    text: `Added ${product.name} to cart`
  }]
};
```

### Checkout

```javascript
{
  name: 'checkout',
  description: 'Complete the checkout process with pre-filled information.',
  inputSchema: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        description: 'Product to checkout directly (bypasses cart)'
      },
      cart_items: {
        type: 'array',
        description: 'Items from cart to checkout'
      }
    }
  }
}

// In handler:
let items = [];

if (product) {
  // Direct checkout with single product
  items = [product];
  const sessionId = `cart_${Date.now()}`;
  cartStorage.set(sessionId, { items, createdAt: Date.now() });
} else if (cart_items) {
  items = cart_items;
} else {
  // Use items from cartStorage
  for (const [sessionId, cart] of cartStorage.entries()) {
    if (cart.items.length > 0) {
      items = cart.items;
      break;
    }
  }
}

return {
  content: [{
    type: 'widget',
    widget: 'checkout',
    data: {
      items,
      shipping: {
        name: 'Lauren Bailey',
        address: '123 Main St, San Francisco, CA 94102'
      },
      payment: {
        type: 'Visa',
        last4: '4242'
      }
    }
  }]
};
```

### Widget Animations

```css
/* Success animation */
@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.success-icon {
  animation: checkmark 0.6s ease-out;
}

/* Loading spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Key Learnings

✅ **Single-Item Cart**: Enforce `quantity: 1` and replace cart on each add  
✅ **Direct Checkout**: Support `checkout` with product parameter to bypass cart  
✅ **Pre-filled Forms**: Show saved shipping/payment for smooth demo experience  
✅ **Success States**: Visual feedback with animations and confirmations

---

## Membership Signup (MCP4)

### Use Case
Enroll in Target Circle 360 membership with tiered pricing.

### User Flow
1. User: *"Sign me up for Circle 360"*
2. ChatGPT calls `check-circle-membership` → returns current status (non-member)
3. ChatGPT calls `circle-signup` → widget appears with 3 tiers
4. User selects tier → enters payment → clicks "Complete Signup"
5. Processing animation → Confetti success screen
6. ChatGPT: *"You're now enrolled in Circle 360 Max! Welcome!"*

### Check Membership

```javascript
{
  name: 'check-circle-membership',
  description: 'Check if the user is a Circle 360 member and return membership details.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

// In handler:
return {
  content: [{
    type: 'text',
    text: 'User is not currently a Circle 360 member. Benefits include: unlimited same-day delivery, exclusive deals, free shipping.'
  }],
  structuredContent: {
    is_member: false,
    benefits: [
      'Unlimited same-day delivery',
      'Exclusive deals & early access',
      'Free shipping on all orders',
      'Partner perks (Shipt, DoorDash)'
    ]
  }
};
```

### Signup Widget

```javascript
{
  name: 'circle-signup',
  description: 'Show the Circle 360 membership signup widget with tier selection.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

// In handler:
return {
  content: [{
    type: 'widget',
    widget: 'circle-signup',
    data: {
      tiers: [
        {
          id: 'standard',
          name: 'Standard',
          price: '$49/year',
          features: ['Same-day delivery', 'Free shipping']
        },
        {
          id: 'plus',
          name: 'Plus',
          price: '$99/year',
          features: ['Everything in Standard', 'Priority support', 'Exclusive deals']
        },
        {
          id: 'max',
          name: 'Max',
          price: '$149/year',
          features: ['Everything in Plus', 'Partner perks', 'Early access']
        }
      ]
    }
  }]
};
```

### Confetti Animation

```javascript
// Create confetti particles
function createConfetti() {
  const confettiContainer = document.getElementById('confetti-container');
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = ['#CC0000', '#FFD700', '#00A1E0'][Math.floor(Math.random() * 3)];
    confettiContainer.appendChild(confetti);
  }
}
```

```css
.confetti {
  position: fixed;
  bottom: -10px;
  width: 10px;
  height: 10px;
  animation: confetti-fall 3s ease-out forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  10% {
    transform: translateY(-200px) rotate(180deg);
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
```

### Key Learnings

✅ **Multi-Screen Flow**: Signup form → Processing → Success  
✅ **Tier Selection**: Dynamic UI based on user choice  
✅ **Confetti Effect**: Celebrate success with bottom-up spray  
✅ **Wrapper Pattern**: Use single container for height detection

---

## Demo Reset Endpoint

```javascript
// Reset demo state between sessions
app.post('/api/demo/reset', (req, res) => {
  authSessions.clear();
  cartStorage.clear();
  
  res.json({
    success: true,
    message: 'Demo state cleared. Sessions and cart reset.'
  });
});
```

**Usage**: Call this endpoint between demos to ensure fresh state.

---

## General Widget Patterns

### Theme Detection

```javascript
async function applyTheme() {
  const theme = await window.openai.theme();
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update background color for ChatGPT
  window.openai.notifyBackgroundColor(
    theme === 'dark' ? '#1a1a1a' : '#ffffff'
  );
}

// Listen for theme changes
window.openai.addEventListener('themeChanged', applyTheme);
```

### Loading State

```javascript
// Show loading until data is ready
async function initialize() {
  showLoadingScreen();
  
  const toolOutput = await window.openai.toolOutput();
  
  if (!toolOutput || Object.keys(toolOutput).length === 0) {
    setTimeout(initialize, 100);
    return;
  }
  
  hideLoadingScreen();
  renderContent(toolOutput);
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const result = await response.json();
  handleSuccess(result);
} catch (error) {
  console.error('Error:', error);
  showErrorScreen('Something went wrong. Please try again.');
}
```

---

## Testing Your MCP Server

### Manual Testing

1. Start server: `npm start`
2. Connect in ChatGPT with `http://localhost:8000/mcp`
3. Test each tool with natural language prompts
4. Check console logs for errors
5. Verify widget rendering in light/dark mode

### Debugging Tips

- **Check Server Logs**: Look for tool call parameters and errors
- **Inspect Widget Console**: Open browser DevTools in ChatGPT
- **Test SSE Connection**: Ensure `/mcp` endpoint streams events
- **Verify JSON Schema**: Use a JSON Schema validator
- **Monitor Session State**: Log `authSessions` and `cartStorage` contents

---

Happy building! 🚀

