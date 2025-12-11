# Example 3: Checkout MCP Server

> Shopping cart and streamlined checkout flow

**Live URL**: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp3`

## Overview

This MCP server demonstrates:
- Add-to-cart confirmation with success animations
- Complete checkout flow with pre-filled data
- Single-item cart enforcement
- State management across tools
- Order processing simulation

## Demo Flow

1. User: *"Add the Fitbit Charge 6 to my cart"*
2. ChatGPT calls `add-to-cart` → confirmation widget appears
3. Widget shows green checkmark and product details
4. User: *"Checkout now"*
5. ChatGPT calls `checkout` → checkout widget appears
6. Widget shows order summary, pre-filled shipping/payment
7. User clicks "Complete Purchase"
8. Processing animation → Success screen
9. ChatGPT: *"Your order has been placed! ✅"*

## Architecture

### Tools

#### 1. `add-to-cart`

**Purpose**: Add item to cart and show confirmation

**Input**:
- `sessionId` (required): User session ID
- `product` (required): Product object
  - `name`: Product name
  - `price`: Price string
  - `image`: Image URL
  - `tcin`: Target product ID

**Output**:
- Confirmation widget
- Text: "Added [product] to cart"

**Cart Storage**:
```javascript
const cartStorage = new Map();

// Structure:
// sessionId -> {
//   product: { name, price, image, tcin },
//   quantity: 1,
//   addedAt: timestamp
// }
```

**Implementation**:
```javascript
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'add-to-cart') {
    const { sessionId, product } = request.params.arguments;
    
    // Enforce single-item cart (replace existing)
    cartStorage.set(sessionId, {
      product: product,
      quantity: 1, // Always locked to 1
      addedAt: Date.now()
    });
    
    return {
      content: [{
        type: 'text',
        text: `Added ${product.name} to cart`
      }],
      widgetData: {
        html: widgetHtml.replace(
          'const productData = null;',
          `const productData = ${JSON.stringify(product)};`
        )
      }
    };
  }
});
```

#### 2. `checkout`

**Purpose**: Display checkout flow and process order

**Input**:
- `sessionId` (optional): If provided, uses cart from storage
- `product` (optional): If provided, adds to cart first
- `cart_items` (optional): Alternative way to provide items

**Priority**:
1. If `product` provided → Use that (bypass add-to-cart)
2. Else if `cart_items` provided → Use those
3. Else → Use `cartStorage[sessionId]`

**Output**:
- Checkout widget with order summary
- Pre-filled shipping and payment
- Text: "Checkout ready"

**Implementation**:
```javascript
if (request.params.name === 'checkout') {
  const { sessionId, product, cart_items } = request.params.arguments;
  
  let items;
  
  // Priority 1: Direct product
  if (product) {
    items = [{ product, quantity: 1 }];
    // Also add to cart
    cartStorage.set(sessionId, { product, quantity: 1, addedAt: Date.now() });
  }
  // Priority 2: Provided cart items
  else if (cart_items && cart_items.length > 0) {
    items = cart_items;
  }
  // Priority 3: Cart storage
  else if (sessionId && cartStorage.has(sessionId)) {
    const cart = cartStorage.get(sessionId);
    items = [{ product: cart.product, quantity: cart.quantity }];
  }
  else {
    return {
      content: [{ type: 'text', text: 'Cart is empty' }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: 'Checkout ready'
    }],
    widgetData: {
      html: checkoutWidget.replace(
        'const cartItems = [];',
        `const cartItems = ${JSON.stringify(items)};`
      )
    }
  };
}
```

### State Management

#### Cart Storage

```javascript
const cartStorage = new Map();

// Key: sessionId
// Value: {
//   product: { name, price, image, tcin },
//   quantity: 1,  // Always 1
//   addedAt: timestamp
// }
```

#### Single-Item Enforcement

The cart is designed to always contain only ONE item:

```javascript
// When adding new item, REPLACE existing cart
cartStorage.set(sessionId, newItem); // Overwrites previous

// Quantity is always locked to 1
const quantity = 1; // Hardcoded
```

**Why?**
- Simplifies demo experience
- Avoids complex cart management
- Focuses on checkout flow

#### Cart Cleanup

```javascript
// Clean up old carts (10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, cart] of cartStorage.entries()) {
    if (now - cart.addedAt > 600000) {
      cartStorage.delete(sessionId);
    }
  }
}, 600000);
```

## Widget 1: add-to-cart.html

### Layout

```
┌─────────────────────────────────────┐
│ [Target Logo]                       │
│                                     │
│         ✓ (animated checkmark)      │
│                                     │
│    Added to Your Cart!              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Image]  Fitbit Charge 6    │   │
│  │          $149.99            │   │
│  │          Qty: 1             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Continue Shopping] [Checkout]     │
│                                     │
└─────────────────────────────────────┘
```

### Features

#### 1. Success Animation

```css
@keyframes checkmark {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #34a853;
  color: white;
  font-size: 48px;
  animation: checkmark 0.6s ease-out;
}
```

#### 2. Product Display

```html
<div class="product-summary">
  <img src="${productData.image}" alt="${productData.name}" />
  <div class="product-details">
    <h3>${productData.name}</h3>
    <p class="price">${productData.price}</p>
    <p class="quantity">Qty: 1</p>
  </div>
</div>
```

#### 3. Action Buttons

```html
<div class="actions">
  <button class="secondary-btn" onclick="continueShopping()">
    Continue Shopping
  </button>
  <button class="primary-btn" onclick="proceedToCheckout()">
    Proceed to Checkout
  </button>
</div>
```

**JavaScript**:
```javascript
function continueShopping() {
  if (window.openai?.sendFollowUpMessage) {
    window.openai.sendFollowUpMessage({
      message: "Continue shopping",
      includeHistory: false
    });
  }
}

function proceedToCheckout() {
  if (window.openai?.sendFollowUpMessage) {
    window.openai.sendFollowUpMessage({
      message: "Proceed to checkout",
      includeHistory: false
    });
  }
}
```

### Dark/Light Mode

```css
body.light {
  background: white;
  color: #333;
}

body.light .product-summary {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
}

body.dark {
  background: #1a1a1a;
  color: #e0e0e0;
}

body.dark .product-summary {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
}
```

## Widget 2: checkout.html

### Layout

```
┌──────────────────────────────────────────┐
│ [Target Logo]  Checkout                  │
│──────────────────────────────────────────│
│                                          │
│ Order Summary                            │
│ ┌────────────────────────────────────┐  │
│ │ [Image] Fitbit Charge 6  $149.99   │  │
│ │         Qty: 1                     │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Shipping Address                         │
│ ┌────────────────────────────────────┐  │
│ │ Lauren Bailey                      │  │
│ │ 123 Main St                        │  │
│ │ San Francisco, CA 94102            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Payment Method                           │
│ ┌────────────────────────────────────┐  │
│ │ Visa •••• 4242                     │  │
│ │ Expires 12/25                      │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Subtotal            $149.99        │  │
│ │ Shipping            FREE           │  │
│ │ Tax                 $12.37         │  │
│ │ ─────────────────────────────      │  │
│ │ Total               $162.36        │  │
│ └────────────────────────────────────┘  │
│                                          │
│      [Complete Purchase]                 │
│                                          │
└──────────────────────────────────────────┘
```

### Screens

#### Screen 1: Order Review

Default screen with order summary, shipping, payment.

#### Screen 2: Processing

```html
<div id="processing-screen" style="display: none;">
  <div class="spinner"></div>
  <h2>Processing your order...</h2>
  <p>Please wait while we confirm your purchase.</p>
</div>
```

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0,0,0,0.1);
  border-top-color: #cc0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

#### Screen 3: Success

```html
<div id="success-screen" style="display: none;">
  <div class="success-icon">✓</div>
  <h2>Order Placed Successfully!</h2>
  <p>Order #TARGET-${Date.now()}</p>
  <p>Confirmation email sent to laurenbailey@gmail.com</p>
  <p>Estimated delivery: 2-3 business days</p>
</div>
```

### JavaScript Flow

```javascript
document.getElementById('complete-purchase').onclick = async () => {
  // Hide order review
  document.getElementById('order-content').style.display = 'none';
  
  // Show processing
  document.getElementById('processing-screen').style.display = 'flex';
  
  // Simulate processing (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Hide processing
  document.getElementById('processing-screen').style.display = 'none';
  
  // Show success
  document.getElementById('success-screen').style.display = 'flex';
  
  // Notify ChatGPT
  if (window.openai?.toolOutput) {
    window.openai.toolOutput({
      success: true,
      orderId: `TARGET-${Date.now()}`,
      total: calculateTotal()
    });
  }
  
  // Send follow-up
  if (window.openai?.sendFollowUpMessage) {
    window.openai.sendFollowUpMessage({
      message: "Order placed successfully!",
      includeHistory: false
    });
  }
};
```

### Pre-Filled Data

Hardcoded for demo:

```javascript
const DEMO_DATA = {
  shipping: {
    name: 'Lauren Bailey',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102'
  },
  payment: {
    type: 'Visa',
    last4: '4242',
    expires: '12/25'
  }
};
```

### Calculate Total

```javascript
function calculateTotal() {
  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product.price.replace('$', ''));
    return sum + (price * item.quantity);
  }, 0);
  
  const tax = subtotal * 0.0825; // 8.25% CA tax
  const shipping = 0; // Free shipping
  const total = subtotal + tax + shipping;
  
  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2)
  };
}
```

## Server Endpoints

### SSE Endpoint: `GET /mcp3`

```javascript
app.get('/mcp3', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createMcp3Server();
  const transport = new SSEServerTransport('/mcp3/messages', res);
  
  await server.connect(transport);
  
  const sessionId = Date.now().toString();
  sseConnections3.set(sessionId, res);
  
  req.on('close', () => {
    sseConnections3.delete(sessionId);
    transport.close();
  });
});
```

### Message Endpoint: `POST /mcp3/messages`

```javascript
app.post('/mcp3/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});
```

### Demo Reset: `POST /api/demo/reset`

Clear all carts for new demos:

```javascript
app.post('/api/demo/reset', express.json(), (req, res) => {
  cartStorage.clear();
  authSessions.clear();
  
  res.json({ 
    success: true, 
    message: 'Demo state reset' 
  });
});
```

## Usage Examples

### Add to Cart + Checkout

```
You: Add the Fitbit Charge 6 to my cart

ChatGPT: [Calls add-to-cart]
         [Shows confirmation widget]
         Added to cart!

You: Checkout now

ChatGPT: [Calls checkout]
         [Shows checkout widget]
```

### Direct Checkout (Bypass Cart)

```
You: Buy the Fitbit Charge 6

ChatGPT: [Calls checkout with product directly]
         [Shows checkout widget]
         Ready to complete your purchase!
```

### Check Cart

```
You: What's in my cart?

ChatGPT: [Checks cartStorage]
         You have 1 item: Fitbit Charge 6 ($149.99)
```

## Customization Guide

### Add Multiple Items

Remove single-item enforcement:

```javascript
// Instead of replacing
cartStorage.set(sessionId, newItem);

// Append to array
let cart = cartStorage.get(sessionId) || [];
cart.push(newItem);
cartStorage.set(sessionId, cart);
```

Update widget to display multiple items.

### Change Shipping Options

```html
<div class="shipping-options">
  <label>
    <input type="radio" name="shipping" value="standard" checked />
    Standard (5-7 days) - FREE
  </label>
  <label>
    <input type="radio" name="shipping" value="express" />
    Express (2-3 days) - $9.99
  </label>
  <label>
    <input type="radio" name="shipping" value="overnight" />
    Overnight - $24.99
  </label>
</div>
```

### Add Real Payment Processing

Integrate with Stripe or PayPal:

```javascript
async function processPayment() {
  const stripe = Stripe('pk_test_...');
  
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement
  });
  
  if (error) {
    showError(error.message);
    return;
  }
  
  // Send to server
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethodId: paymentMethod.id,
      amount: total * 100 // cents
    })
  });
  
  // ... handle response
}
```

### Editable Shipping Address

Make fields editable:

```html
<input type="text" id="name" value="Lauren Bailey" />
<input type="text" id="address" value="123 Main St" />
<input type="text" id="city" value="San Francisco" />
<select id="state">
  <option value="CA" selected>California</option>
  <!-- ... other states -->
</select>
<input type="text" id="zip" value="94102" />
```

### Order Tracking

Add tracking after purchase:

```javascript
// Generate tracking number
const trackingNumber = `TGT${Date.now()}`;

// Show in success screen
document.getElementById('success-screen').innerHTML += `
  <p>Tracking #: ${trackingNumber}</p>
  <a href="https://target.com/track/${trackingNumber}" target="_blank">
    Track Your Order
  </a>
`;
```

## Testing Checklist

- [ ] Add to cart shows confirmation widget
- [ ] Checkmark animates on add
- [ ] Product details display correctly
- [ ] "Continue Shopping" sends message
- [ ] "Proceed to Checkout" sends message
- [ ] Checkout displays order summary
- [ ] Shipping address pre-filled
- [ ] Payment method pre-filled
- [ ] Total calculated correctly
- [ ] Tax calculation accurate
- [ ] "Complete Purchase" button works
- [ ] Processing screen appears
- [ ] Success screen appears after 2 seconds
- [ ] Order number generated
- [ ] ChatGPT receives success notification
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] Single-item cart enforcement works
- [ ] Direct checkout (bypass cart) works

## Common Issues

### Cart shows as empty

**Cause**: Session ID mismatch or cart expired

**Fix**: Ensure consistent `sessionId` across tools

### Multiple items in cart (should be 1)

**Cause**: `add-to-cart` appending instead of replacing

**Fix**: Verify `cartStorage.set()` replaces (doesn't push)

### Tax calculation wrong

**Cause**: Hardcoded tax rate (8.25% CA)

**Fix**: Pass tax rate or calculate based on zip code

### Success screen doesn't appear

**Cause**: JavaScript error or missing `window.openai`

**Fix**: Check browser console for errors

## Performance Optimization

### Lazy Load Images

```html
<img src="..." loading="lazy" />
```

### Debounce Input

For editable fields:

```javascript
let timeout;
document.getElementById('zip').oninput = (e) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    calculateShipping(e.target.value);
  }, 500);
};
```

## Next Steps

- Add promo code support
- Implement gift wrapping option
- Add order notes/comments
- Support multiple shipping addresses
- Add saved payment methods
- Implement order history
- Add reorder functionality
- Support gift cards

---

**Related Examples**:
- [Product Search](product-search.md) - Find products to add
- [Authentication](authentication.md) - User profiles
- [Membership](membership.md) - Circle 360 benefits
- [Architecture](../ARCHITECTURE.md) - System overview


