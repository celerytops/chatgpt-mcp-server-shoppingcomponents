# Usage Guide

Learn how to use each MCP server effectively with real examples and prompts.

---

## Table of Contents

1. [MCP1: Authentication](#mcp1-authentication)
2. [MCP2: Product Search](#mcp2-product-search)
3. [MCP3: Checkout](#mcp3-checkout)
4. [MCP4: Membership](#mcp4-membership)
5. [Multi-Server Workflows](#multi-server-workflows)
6. [Advanced Tips](#advanced-tips)

---

## MCP1: Authentication

**Endpoint**: `/mcp`

### What It Does
Provides a session-based authentication flow with a Target-branded UI.

### How to Use

#### 1. Basic Authentication

**Prompt:**
```
Sign me into my Target account
```

**What Happens:**
1. ChatGPT creates a session ID
2. Authentication widget appears with login form
3. You enter email + password (any credentials work in demo mode)
4. Verification screen appears (enter any 6-digit code)
5. Success screen confirms authentication as Lauren Bailey
6. ChatGPT receives authentication confirmation

#### 2. Check Authentication Status

**Prompt:**
```
Am I signed into Target?
```

**What Happens:**
- ChatGPT checks your session status
- Returns: "You are authenticated as Lauren Bailey (laurenbailey@gmail.com)"
- Or: "You are not currently authenticated"

### Useful Prompts

```
"Log me into Target"
"Authenticate with my Target account"
"I need to sign in to Target"
"Check if I'm logged into Target"
"What's my Target account status?"
```

### Demo Credentials

In demo mode, **any credentials work**:
- Email: `any@email.com`
- Password: `anything`
- Verification Code: `123456` (or any 6 digits)

The system always authenticates as **Lauren Bailey** (laurenbailey@gmail.com).

---

## MCP2: Product Search

**Endpoint**: `/mcp2`

### What It Does
Searches Target's product catalog and displays results in an interactive carousel with AI-powered recommendations.

### How to Use

#### 1. Basic Product Search

**Prompt:**
```
Show me fitness trackers on Target
```

**What Happens:**
1. ChatGPT searches Target products via Unwrangle API
2. Carousel widget appears with top 10 products
3. Each product shows: image, name, price, rating, reviews
4. ChatGPT receives detailed product data and Agentforce recommendations
5. ChatGPT shares personalized recommendation based on customer history

#### 2. Browse Product Details

**In the Carousel:**
- Scroll left/right to see all products
- Click any product to view details
- Click "Back to Results" to return to carousel
- See ratings, reviews, and descriptions

#### 3. Get Recommendations

**Prompt:**
```
Which fitness tracker should I buy?
```

**What Happens:**
- ChatGPT uses Agentforce recommendation data
- Considers your purchase history (Fitbit Charge 3)
- Factors in color preferences (Obsidian phone case)
- Includes family context (husband's running activities)
- Provides personalized recommendation in bullet format

### Useful Prompts

```
"Find bluetooth headphones on Target"
"Show me coffee makers"
"Search for running shoes"
"What smartwatches does Target have?"
"Find kitchen appliances under $100"
"Show me the best rated fitness trackers"
```

### Search Tips

- **Be Specific**: "wireless over-ear headphones" vs. "headphones"
- **Use Categories**: "kitchen appliances", "home decor", "electronics"
- **Add Filters**: "under $50", "highly rated", "best selling"
- **Brand Names**: "Apple AirPods", "Fitbit", "KitchenAid"

### Customer Context (Demo)

The Agentforce recommendations use this simulated customer profile:

- **Previous Purchase**: Fitbit Charge 3 (owned by husband)
- **Recent Purchase**: Obsidian-colored phone case (color preference)
- **Browsing History**: Wristband replacements (indicates wear)
- **Shopping Patterns**: Long-distance running equipment and nutrition
- **Marketing Engagement**: Target-sponsored marathons

---

## MCP3: Checkout

**Endpoint**: `/mcp3`

### What It Does
Handles adding items to cart and completing purchases with pre-filled information.

### How to Use

#### 1. Add to Cart

**Prompt:**
```
Add the Fitbit Charge 6 to my cart
```

**What Happens:**
1. Widget appears with product details
2. Green success animation plays
3. Cart is updated (single item, quantity 1)
4. ChatGPT confirms item added

#### 2. Complete Checkout

**Prompt:**
```
Check out
```

**What Happens:**
1. Checkout widget appears with order summary
2. Pre-filled shipping address (Lauren Bailey, 123 Main St, San Francisco, CA)
3. Pre-filled payment method (Visa ending in 4242)
4. You click "Complete Purchase"
5. Loading animation plays
6. Success screen confirms order
7. ChatGPT receives order confirmation

#### 3. Direct Checkout (Skip Cart)

**Prompt:**
```
Buy the Fitbit Charge 6
```

**What Happens:**
- Product is added to cart automatically
- Checkout widget appears immediately
- Complete purchase in one step

### Useful Prompts

```
"Add this item to my cart"
"Add the [product name] to my Target cart"
"Check out with these items"
"Complete my purchase"
"Buy this product"
"Proceed to checkout"
```

### Pre-Filled Information (Demo)

- **Name**: Lauren Bailey
- **Shipping**: 123 Main St, San Francisco, CA 94102
- **Payment**: Visa •••• 4242
- **Order Total**: Based on product price + tax

### Cart Rules

- **Single Item Only**: Cart always contains exactly 1 item
- **Quantity Locked**: Quantity is always 1 (cannot change)
- **Auto-Replace**: Adding new item replaces existing item

---

## MCP4: Membership

**Endpoint**: `/mcp4`

### What It Does
Allows users to check membership status and sign up for Target Circle 360.

### How to Use

#### 1. Check Membership Status

**Prompt:**
```
Am I a Circle 360 member?
```

**What Happens:**
- ChatGPT checks membership status
- Returns: "You are not currently a Circle 360 member"
- Lists benefits: unlimited same-day delivery, exclusive deals, free shipping, partner perks

#### 2. Sign Up for Membership

**Prompt:**
```
Sign me up for Circle 360
```

**What Happens:**
1. Widget appears with 3 membership tiers
2. You select a tier (Standard $49, Plus $99, Max $149)
3. Order summary updates with selected tier
4. Pre-filled payment and address
5. Click "Complete Signup"
6. Processing animation plays
7. Success screen with confetti 🎉
8. ChatGPT confirms enrollment

### Membership Tiers

#### Standard - $49/year
- Same-day delivery from Target & more local stores without price markups
- Free shipping on all orders
- Exclusive deals and early access
- Priority customer support

#### Plus - $99/year
- Everything in Standard
- DoorDash DashPass membership (12 months)
- Additional partner perks
- Extended return window

#### Max - $149/year
- Everything in Plus
- Shipt membership (12 months)
- Premium partner perks bundle
- VIP customer support

### Useful Prompts

```
"What is Circle 360?"
"Sign me up for Target Circle membership"
"Enroll me in Circle 360 Max"
"What are the benefits of Circle 360?"
"How much does Circle 360 cost?"
"Compare Circle 360 tiers"
```

---

## Multi-Server Workflows

Combine multiple MCP servers for complete workflows!

### Workflow 1: Shop and Buy

**Connect**: MCP1, MCP2, MCP3

```
1. "Sign me into Target"
   → Authenticate with MCP1

2. "Show me fitness trackers"
   → Search products with MCP2

3. "Which one should I buy?"
   → Get Agentforce recommendation

4. "Add the Fitbit Charge 6 to my cart"
   → Add to cart with MCP3

5. "Check out"
   → Complete purchase with MCP3
```

### Workflow 2: Join Membership First

**Connect**: MCP1, MCP4, MCP2, MCP3

```
1. "Sign me into Target"
   → Authenticate with MCP1

2. "Sign me up for Circle 360 Max"
   → Enroll with MCP4

3. "Now show me running shoes"
   → Search products with MCP2

4. "Buy the recommended pair"
   → Checkout with MCP3 (with membership discount!)
```

### Workflow 3: Research and Compare

**Connect**: MCP2

```
1. "Show me fitness trackers"
   → View product carousel

2. "Compare the top 3"
   → ChatGPT analyzes product data

3. "What's best for running?"
   → Get filtered recommendation

4. "Show me reviews for the Fitbit Charge 6"
   → View product details
```

---

## Advanced Tips

### 1. Natural Language

You don't need exact commands! Try natural variations:

```
❌ Bad: "execute tool authenticate-target"
✅ Good: "Sign me into Target"
✅ Good: "I'd like to log in"
✅ Good: "Can you authenticate me?"
```

### 2. Combine Multiple Actions

```
"Sign me in, then show me coffee makers, and add the best one to my cart"
```

ChatGPT will:
1. Call MCP1 (authentication)
2. Call MCP2 (product search)
3. Call MCP3 (add to cart)

### 3. Ask for Comparisons

```
"Compare Circle 360 Standard vs Max"
"What's the difference between these fitness trackers?"
"Which one is better for my needs?"
```

ChatGPT will use the data from MCP servers to provide comparisons.

### 4. Check Status Anytime

```
"Am I signed in?"
"What's in my cart?"
"Do I have a Circle 360 membership?"
```

### 5. Reset Between Demos

Call the reset endpoint:

```bash
curl -X POST https://your-mcp-server.herokuapp.com/api/demo/reset
```

This clears:
- All authentication sessions
- Shopping cart contents
- Cached data

Perfect for starting fresh demos!

---

## Troubleshooting

### Widget Not Showing

**Try:**
```
"Show me the authentication screen again"
"Refresh the product search"
"Display the checkout page"
```

### Session Expired

**Try:**
```
"Sign me in again"
"Create a new session"
"Re-authenticate"
```

### Wrong Information Displayed

**Try:**
```
"Reset my session"
"Start over"
"Clear my cart"
```

Then call the demo reset endpoint.

---

## Best Practices

### ✅ Do

- Use natural language prompts
- Combine multiple MCP servers for workflows
- Ask follow-up questions
- Experiment with different phrasings
- Check status before taking actions

### ❌ Don't

- Try to use multiple items in cart (single item only)
- Expect real authentication (demo mode)
- Expect real purchases (simulation only)
- Call tools directly by name (let ChatGPT decide)

---

## Example Conversations

### Conversation 1: Quick Purchase

```
You: Sign me into Target

ChatGPT: [Shows authentication widget]
[You complete authentication]

ChatGPT: You're now signed in as Lauren Bailey!

You: Show me fitness trackers

ChatGPT: [Shows product carousel]
Based on your history, I recommend the Fitbit Charge 6...

You: Add it to my cart and check out

ChatGPT: [Shows add-to-cart widget, then checkout]
[You complete purchase]

ChatGPT: Your order is confirmed! Order #12345
```

### Conversation 2: Research Mode

```
You: What fitness trackers does Target have?

ChatGPT: [Shows product carousel with 10 options]

You: Which is best for marathon training?

ChatGPT: Given your husband's long-distance running...
I recommend the Fitbit Charge 6 because...

You: How much is it?

ChatGPT: The Fitbit Charge 6 is $149.99

You: Show me alternatives under $100

ChatGPT: Here are fitness trackers under $100...
```

### Conversation 3: Membership Focus

```
You: What is Circle 360?

ChatGPT: Target Circle 360 is a membership program...
[Lists benefits and tiers]

You: Which tier is best for frequent shoppers?

ChatGPT: For frequent shoppers, I recommend Circle 360 Max...

You: Sign me up for that

ChatGPT: [Shows signup widget]
[You complete signup]

ChatGPT: Welcome to Circle 360 Max! 🎉
```

---

## Getting Help

- **Documentation**: See [README.md](./README.md)
- **Setup Issues**: See [SETUP.md](./SETUP.md)
- **Code Examples**: See [EXAMPLES.md](./EXAMPLES.md)
- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/chatgpt-mcp-servers/issues)

---

Happy shopping! 🛒🎯

