# Example 4: Membership MCP Server

> Circle 360 membership signup with tier selection

**Live URL**: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp4`

## Overview

This MCP server demonstrates:
- Multi-tier selection UI
- Dynamic order summary calculations
- Complex form processing
- Success animations (confetti)
- Pre-filled payment information
- Multi-screen transitions

## Demo Flow

1. User: *"Sign me up for Circle 360"*
2. ChatGPT calls `check-circle-membership` → Returns not a member
3. ChatGPT calls `circle-signup` → Signup widget appears
4. Widget shows 3 tiers (Annual, Plus, Premium)
5. User selects tier → Order summary updates
6. User enters payment info (pre-filled)
7. User clicks "Complete Signup"
8. Processing screen (2 seconds)
9. Success screen with confetti animation 🎉
10. ChatGPT: *"Welcome to Circle 360!"*

## Architecture

### Tools

#### 1. `check-circle-membership`

**Purpose**: Check if user has Circle 360 membership

**Input**:
- `sessionId` (optional): User session ID

**Output**:
- Membership status (true/false)
- Current tier (if member)
- Benefits list

**Implementation** (Hardcoded Demo):
```javascript
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'check-circle-membership') {
    return {
      content: [{
        type: 'text',
        text: 'You are not currently a Circle 360 member. Benefits include:\n' +
              '• Same-day delivery without price markups\n' +
              '• Unlimited free shipping\n' +
              '• Exclusive discounts and early access\n' +
              '• Priority customer support'
      }],
      structuredContent: {
        isMember: false,
        tier: null,
        benefits: [
          'Same-day delivery without price markups',
          'Unlimited free shipping',
          'Exclusive discounts and early access',
          'Priority customer support'
        ]
      }
    };
  }
});
```

#### 2. `circle-signup`

**Purpose**: Display Circle 360 signup widget with tier selection

**Input**:
- `sessionId` (optional): User session ID

**Output**:
- Signup widget with 3 tiers
- Text: "Circle 360 signup available"

**Tiers**:

| Tier | Price | Benefits |
|------|-------|----------|
| **Annual** | $99/year | Same-day delivery, Free shipping |
| **Plus** | $14.99/month | Annual + Extended return window |
| **Premium** | $24.99/month | Plus + Priority support + Exclusive deals |

**Implementation**:
```javascript
if (request.params.name === 'circle-signup') {
  return {
    content: [{
      type: 'text',
      text: 'Circle 360 signup available'
    }],
    widgetData: {
      html: fs.readFileSync('./widgets/circle-signup.html', 'utf8')
    }
  };
}
```

## Widget: circle-signup.html

### Layout

```
┌──────────────────────────────────────────────┐
│ [Target Logo] circle 360                     │
│──────────────────────────────────────────────│
│                                              │
│ Choose Your Plan                             │
│                                              │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│ │  Annual   │ │   Plus    │ │  Premium  │  │
│ │ $99/year  │ │$14.99/mo │ │$24.99/mo │  │
│ │           │ │           │ │           │  │
│ │ [Select]  │ │ [Select]  │ │ [Select]  │  │
│ └───────────┘ └───────────┘ └───────────┘  │
│                                              │
│ Order Summary                                │
│ ┌──────────────────────────────────────┐    │
│ │ Circle 360 Premium        $24.99/mo  │    │
│ │ Tax                       $2.06      │    │
│ │ ─────────────────────────────────    │    │
│ │ Total Today               $27.05     │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ Payment Information                          │
│ [Card Number] [Expiry] [CVV]                │
│                                              │
│ Billing Address                              │
│ [Name] [Address] [City] [State] [Zip]       │
│                                              │
│          [Complete Signup]                   │
│                                              │
└──────────────────────────────────────────────┘
```

### Screens

#### Screen 1: Signup Form

Default screen with tier selection, payment, and address.

#### Screen 2: Processing

```html
<div id="processing-content" style="display: none;">
  <div class="spinner"></div>
  <h2>Processing your membership...</h2>
  <p>Setting up your Circle 360 benefits.</p>
</div>
```

#### Screen 3: Success with Confetti

```html
<div id="success-content" style="display: none;">
  <div class="success-icon">✓</div>
  <h2>Welcome to Circle 360!</h2>
  <p>Your membership is now active</p>
  <p>Confirmation email sent to laurenbailey@gmail.com</p>
</div>

<div class="confetti-container"></div>
```

### Tier Selection

#### HTML Structure

```html
<div class="tiers">
  <div class="tier-card" data-tier="annual" data-price="99" data-billing="year">
    <div class="tier-header">
      <h3>Annual</h3>
      <p class="tier-price">$99<span>/year</span></p>
    </div>
    <ul class="tier-benefits">
      <li>✓ Same-day delivery without price markups</li>
      <li>✓ Unlimited free shipping on orders</li>
    </ul>
    <button class="select-tier-btn">Select Plan</button>
  </div>
  
  <!-- Plus and Premium tiers... -->
</div>
```

#### JavaScript Selection

```javascript
document.querySelectorAll('.select-tier-btn').forEach(btn => {
  btn.onclick = (e) => {
    const card = e.target.closest('.tier-card');
    
    // Remove previous selection
    document.querySelectorAll('.tier-card').forEach(c => {
      c.classList.remove('selected');
      c.querySelector('.select-tier-btn').textContent = 'Select Plan';
    });
    
    // Mark as selected
    card.classList.add('selected');
    btn.textContent = 'Selected ✓';
    
    // Update order summary
    selectedTier = {
      name: card.dataset.tier,
      price: parseFloat(card.dataset.price),
      billing: card.dataset.billing
    };
    
    updateOrderSummary();
  };
});
```

#### Selected State Styling

```css
.tier-card {
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.tier-card.selected {
  border-color: #cc0000;
  box-shadow: 0 4px 16px rgba(204, 0, 0, 0.3);
  transform: translateY(-4px);
}

.tier-card.selected .select-tier-btn {
  background: #34a853;
}
```

### Order Summary

#### Dynamic Calculation

```javascript
function updateOrderSummary() {
  if (!selectedTier) return;
  
  const basePrice = selectedTier.price;
  const tax = basePrice * 0.0825; // 8.25% tax
  const total = basePrice + tax;
  
  document.getElementById('summary-plan').textContent = 
    `Circle 360 ${capitalize(selectedTier.name)}`;
  
  document.getElementById('summary-price').textContent = 
    `$${basePrice.toFixed(2)}/${selectedTier.billing}`;
  
  document.getElementById('summary-tax').textContent = 
    `$${tax.toFixed(2)}`;
  
  document.getElementById('summary-total').textContent = 
    `$${total.toFixed(2)}`;
}
```

#### Styling

```css
.order-summary {
  background: rgba(204, 0, 0, 0.05);
  border: 1px solid rgba(204, 0, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-total {
  font-weight: bold;
  font-size: 18px;
  padding-top: 12px;
  border-top: 2px solid rgba(204, 0, 0, 0.3);
}
```

### Pre-Filled Forms

#### Payment Information

```javascript
const DEMO_PAYMENT = {
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/25',
  cvv: '123'
};

// Pre-fill on load
document.getElementById('card-number').value = DEMO_PAYMENT.cardNumber;
document.getElementById('card-expiry').value = DEMO_PAYMENT.expiry;
document.getElementById('card-cvv').value = DEMO_PAYMENT.cvv;
```

#### Billing Address

```javascript
const DEMO_ADDRESS = {
  name: 'Lauren Bailey',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102'
};

Object.keys(DEMO_ADDRESS).forEach(key => {
  const input = document.getElementById(`billing-${key}`);
  if (input) input.value = DEMO_ADDRESS[key];
});
```

### Confetti Animation

#### Generate Confetti Pieces

```javascript
function createConfetti() {
  const container = document.querySelector('.confetti-container');
  const colors = ['#cc0000', '#ffd700', '#00cc00', '#0066cc', '#ff00ff'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(confetti);
  }
}
```

#### Confetti Styling

```css
.confetti-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 1000;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  bottom: -10px;
  opacity: 0;
  animation: confetti-fall 4s ease-out forwards;
}

@keyframes confetti-fall {
  0% {
    bottom: -10px;
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  50% {
    opacity: 1;
  }
  100% {
    bottom: 100vh;
    opacity: 0;
    transform: translateY(-100vh) rotate(720deg);
  }
}
```

**Key points**:
- Starts from `bottom: -10px` (below viewport)
- Animates upward to `bottom: 100vh`
- Rotates 720 degrees during fall
- Fades out at the top

### Complete Signup Flow

```javascript
document.getElementById('complete-signup-btn').onclick = async () => {
  if (!selectedTier) {
    alert('Please select a plan');
    return;
  }
  
  // Hide signup form
  document.getElementById('signup-content').style.display = 'none';
  
  // Show processing
  document.getElementById('processing-content').style.display = 'flex';
  
  // Simulate processing (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Hide processing
  document.getElementById('processing-content').style.display = 'none';
  
  // Show success
  document.getElementById('success-content').style.display = 'flex';
  
  // Trigger confetti
  createConfetti();
  
  // Notify ChatGPT
  if (window.openai?.toolOutput) {
    window.openai.toolOutput({
      success: true,
      tier: selectedTier.name,
      price: selectedTier.price
    });
  }
  
  if (window.openai?.sendFollowUpMessage) {
    window.openai.sendFollowUpMessage({
      message: `Enrolled in Circle 360 ${selectedTier.name}!`,
      includeHistory: false
    });
  }
};
```

### Dark/Light Mode

```css
/* Light mode */
body.light {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  color: #333;
}

body.light .tier-card {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

body.light .order-summary {
  background: rgba(204, 0, 0, 0.05);
}

/* Dark mode */
body.dark {
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  color: #e0e0e0;
}

body.dark .tier-card {
  background: #2a2a2a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

body.dark .order-summary {
  background: rgba(204, 0, 0, 0.15);
}

body.dark input {
  background: #2a2a2a;
  border-color: #3a3a3a;
  color: #e0e0e0;
}
```

## Server Endpoints

### SSE Endpoint: `GET /mcp4`

```javascript
app.get('/mcp4', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createMcp4Server();
  const transport = new SSEServerTransport('/mcp4/messages', res);
  
  await server.connect(transport);
  
  const sessionId = Date.now().toString();
  sseConnections4.set(sessionId, res);
  
  req.on('close', () => {
    sseConnections4.delete(sessionId);
    transport.close();
  });
});
```

### Message Endpoint: `POST /mcp4/messages`

```javascript
app.post('/mcp4/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});
```

## Usage Examples

### Check Membership Status

```
You: Am I a Circle 360 member?

ChatGPT: [Calls check-circle-membership]
         You're not currently a Circle 360 member. 
         Benefits include same-day delivery, free shipping, 
         and exclusive discounts.
```

### Sign Up

```
You: Sign me up for Circle 360

ChatGPT: [Calls circle-signup]
         [Displays signup widget]
         
[You select Premium tier, click Complete Signup]

ChatGPT: Welcome to Circle 360 Premium! Your membership is active.
```

### Cancel Membership (Future)

```
You: Cancel my Circle 360 membership

ChatGPT: [Could call cancel-circle-membership tool]
         Your membership has been cancelled.
```

## Customization Guide

### Add More Tiers

```html
<div class="tier-card" data-tier="enterprise" data-price="499" data-billing="year">
  <div class="tier-header">
    <h3>Enterprise</h3>
    <p class="tier-price">$499<span>/year</span></p>
  </div>
  <ul class="tier-benefits">
    <li>✓ All Premium benefits</li>
    <li>✓ Dedicated account manager</li>
    <li>✓ Volume discounts</li>
  </ul>
  <button class="select-tier-btn">Select Plan</button>
</div>
```

### Change Tax Rate

```javascript
// Instead of hardcoded 8.25%
function calculateTax(price, zipCode) {
  const TAX_RATES = {
    '94102': 0.0825, // San Francisco
    '10001': 0.08875, // New York
    '60601': 0.1025 // Chicago
  };
  
  const rate = TAX_RATES[zipCode] || 0.08;
  return price * rate;
}
```

### Add Payment Validation

```javascript
function validateCard(cardNumber) {
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
```

### Store Membership in Session

```javascript
// In server.js
const membershipStorage = new Map();

// After successful signup
membershipStorage.set(sessionId, {
  tier: selectedTier.name,
  price: selectedTier.price,
  startDate: Date.now(),
  active: true
});

// In check-circle-membership
const membership = membershipStorage.get(sessionId);
if (membership && membership.active) {
  return {
    content: [{
      type: 'text',
      text: `You are a Circle 360 ${membership.tier} member!`
    }],
    structuredContent: {
      isMember: true,
      tier: membership.tier
    }
  };
}
```

### Add Trial Period

```html
<div class="trial-banner">
  🎉 Start your 30-day free trial today!
</div>
```

```javascript
const membership = {
  tier: selectedTier.name,
  trialEndsAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  price: 0 // No charge during trial
};
```

### Customize Confetti

```javascript
// Different colors per tier
const TIER_COLORS = {
  annual: ['#cc0000', '#ffd700'],
  plus: ['#0066cc', '#00ccff'],
  premium: ['#cc0000', '#ffd700', '#00cc00']
};

function createConfetti(tier) {
  const colors = TIER_COLORS[tier] || ['#cc0000'];
  // ... rest of confetti logic
}
```

## Testing Checklist

- [ ] Check membership returns "not a member"
- [ ] Signup widget displays correctly
- [ ] 3 tiers render with correct prices
- [ ] Tier selection updates UI
- [ ] Order summary calculates correctly
- [ ] Tax calculation accurate
- [ ] Payment fields pre-filled
- [ ] Address fields pre-filled
- [ ] "Complete Signup" button works
- [ ] Processing screen appears
- [ ] Success screen appears after 2 seconds
- [ ] Confetti sprays from bottom corners
- [ ] Confetti animates upward
- [ ] ChatGPT receives success notification
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] Widget resizes properly on success screen

## Common Issues

### Confetti starts from top instead of bottom

**Cause**: CSS animation starts from wrong position

**Fix**: Ensure `bottom: -10px` at 0% and `bottom: 100vh` at 100%

### Widget doesn't resize after success

**Cause**: ChatGPT not detecting height change

**Fix**: Wrap all content sections in single `.widget-wrapper` div

### Order summary doesn't update

**Cause**: `updateOrderSummary()` not called after tier selection

**Fix**: Call function in tier selection click handler

### Confetti is cut off

**Cause**: Parent container has `overflow: hidden`

**Fix**: Set `.confetti-container` to `position: fixed` and `z-index: 1000`

## Performance Optimization

### Limit Confetti Pieces

```javascript
// Instead of 100
const confettiCount = 50; // Reduce for better performance
```

### Remove Confetti After Animation

```javascript
confetti.addEventListener('animationend', () => {
  confetti.remove();
});
```

### Lazy Load Tier Images

If adding images to tiers:

```html
<img src="..." loading="lazy" />
```

## Next Steps

- Add real payment processing (Stripe, PayPal)
- Store memberships in database
- Implement membership renewal
- Add cancellation flow
- Support proration for tier changes
- Add referral program
- Implement member dashboard
- Add usage analytics

---

**Related Examples**:
- [Authentication](authentication.md) - User profiles
- [Checkout](checkout.md) - Payment flows
- [Product Search](product-search.md) - Member discounts
- [Architecture](../ARCHITECTURE.md) - System overview

