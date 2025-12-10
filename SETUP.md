# Setup Guide

Complete setup instructions for running and deploying your own MCP servers.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Heroku CLI** (optional, for deployment) ([Download](https://devcenter.heroku.com/articles/heroku-cli))
- **ChatGPT Plus or Pro** account (for testing MCP connectors)

---

## Quick Start (Use Live Servers)

The fastest way to try these examples is to use the live servers:

1. Open **ChatGPT** (chat.openai.com)
2. Go to **Settings** → **Connectors**
3. Click **Add connector**
4. Enter: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
5. In a chat, click **Attach** and select the connector
6. Try: *"Sign me into my Target account"*

**Other Live Servers:**
- MCP2 (Product Search): `https://chatgpt-components-0d9232341440.herokuapp.com/mcp2`
- MCP3 (Checkout): `https://chatgpt-components-0d9232341440.herokuapp.com/mcp3`
- MCP4 (Membership): `https://chatgpt-components-0d9232341440.herokuapp.com/mcp4`

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatgpt-mcp-servers.git
cd chatgpt-mcp-servers
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Optional: For MCP2 product search (Unwrangle API)
UNWRANGLE_API_KEY=your_api_key_here

# Port (default: 8000)
PORT=8000
```

**Note**: MCP2 (product search) requires an Unwrangle API key. Get one at [unwrangle.com](https://unwrangle.com/). The other MCP servers work without any API keys.

### 4. Start the Server

```bash
npm start
```

You should see:

```
🚀 MCP servers running on port 8000

Available endpoints:
- MCP1 (Auth): http://localhost:8000/mcp
- MCP2 (Products): http://localhost:8000/mcp2
- MCP3 (Checkout): http://localhost:8000/mcp3
- MCP4 (Membership): http://localhost:8000/mcp4
- OpenAPI Schema: http://localhost:8000/openapi.json
- Demo Reset: POST http://localhost:8000/api/demo/reset
```

### 5. Test Locally in ChatGPT

1. In **ChatGPT Settings** → **Connectors**, add: `http://localhost:8000/mcp`
2. Attach the connector in a conversation
3. Try: *"Sign me into Target"*

**Important**: Your local server must be running for ChatGPT to connect to it. ChatGPT can reach `localhost` when running on your machine.

---

## Understanding the Code Structure

```
chatgpt-mcp-servers/
├── server.js                 # Main server file with all 4 MCP servers
├── package.json             # Dependencies and scripts
├── Procfile                 # Heroku deployment config
├── .env                     # Environment variables (create this)
│
├── widgets/                 # UI components
│   ├── target-auth.html    # MCP1: Authentication widget
│   ├── product-carousel.html # MCP2: Product search widget
│   ├── add-to-cart.html    # MCP3: Add to cart widget
│   ├── checkout.html       # MCP3: Checkout widget
│   └── circle-signup.html  # MCP4: Membership signup widget
│
├── public/                  # Static files (for Custom GPT Actions)
│   ├── auth.html           # External authentication page
│   └── privacy.html        # Privacy policy page
│
└── README.md               # Main documentation
```

---

## Deploying to Heroku

### One-Time Setup

#### 1. Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows/Linux:** Download from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

#### 2. Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

#### 3. Create a New Heroku App

```bash
heroku create your-mcp-server-name
```

This will:
- Create a new Heroku app
- Add a Git remote called `heroku`
- Generate a URL like: `https://your-mcp-server-name.herokuapp.com`

**Note**: If you don't specify a name, Heroku will generate a random one.

#### 4. Set Environment Variables (Optional)

```bash
# For MCP2 product search
heroku config:set UNWRANGLE_API_KEY=your_api_key_here
```

### Deploying Updates

Every time you make changes:

```bash
# Stage your changes
git add -A

# Commit with a message
git commit -m "Updated authentication flow"

# Push to Heroku
git push heroku main
```

**Deployment Process:**
1. Heroku receives your code
2. Detects Node.js project
3. Installs dependencies (`npm install`)
4. Builds the app
5. Starts the server with `npm start`
6. Your app is live!

### View Logs

```bash
# Stream real-time logs
heroku logs --tail

# View recent logs
heroku logs --num 100
```

### Restart Server

```bash
heroku restart
```

### Open Your App

```bash
heroku open
```

---

## Connecting to ChatGPT

### Method 1: MCP Connectors (Recommended)

**Best for**: Interactive widgets, rich UI, session management

1. Open **ChatGPT** → **Settings** → **Connectors**
2. Click **Add connector**
3. Enter your MCP URL:
   - Local: `http://localhost:8000/mcp`
   - Production: `https://your-app.herokuapp.com/mcp`
4. Click **Save**
5. In a conversation, click **Attach** (paperclip icon)
6. Select your connector
7. Start chatting!

**Available MCP Endpoints:**
- `/mcp` - Authentication (MCP1)
- `/mcp2` - Product Search (MCP2)
- `/mcp3` - Checkout (MCP3)
- `/mcp4` - Membership (MCP4)

### Method 2: Custom GPT Actions

**Best for**: API-only integrations, no UI widgets

1. Create a new **Custom GPT** in ChatGPT
2. Go to **Configure** → **Actions**
3. Click **Import from URL**
4. Enter: `https://your-app.herokuapp.com/openapi.json`
5. Save your GPT

**Note**: This method uses REST API endpoints instead of MCP protocol. The widget features won't work, but you can still use the backend logic.

---

## Testing Your MCP Server

### Manual Testing Checklist

#### MCP1: Authentication
- [ ] Call `create-target-session` → Returns session ID
- [ ] Call `authenticate-target` with session ID → Widget appears
- [ ] Enter email + password → Verification screen appears
- [ ] Enter 6-digit code → Success screen appears
- [ ] Call `get-target-auth-status` → Returns authenticated status
- [ ] Test in dark mode and light mode

#### MCP2: Product Search
- [ ] Search for "fitness trackers" → Carousel appears with products
- [ ] Product names, prices, ratings display correctly
- [ ] Click a product → Detail page appears
- [ ] Click back → Returns to carousel
- [ ] Call `get-agentforce-recommendations` → Receives personalized message

#### MCP3: Checkout
- [ ] Add product to cart → Success animation appears
- [ ] Call `checkout` → Order summary displays
- [ ] Pre-filled shipping and payment info appears
- [ ] Click "Complete Purchase" → Success screen
- [ ] Test with direct product checkout (bypassing cart)

#### MCP4: Membership
- [ ] Check membership status → Returns non-member
- [ ] Call `circle-signup` → Widget with 3 tiers appears
- [ ] Select a tier → Price updates
- [ ] Click "Complete Signup" → Processing animation
- [ ] Success screen with confetti appears

### Automated Testing (Optional)

Create test scripts in `tests/` directory:

```javascript
// tests/auth.test.js
const assert = require('assert');

describe('Authentication Flow', () => {
  it('should create a session', async () => {
    const result = await createSession();
    assert(result.sessionId);
    assert(result.sessionId.startsWith('sess_'));
  });
  
  it('should authenticate with valid session', async () => {
    const session = await createSession();
    const result = await authenticate(session.sessionId);
    assert(result.success);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to MCP server"

**Possible Causes:**
1. Server is not running
2. Firewall blocking port 8000
3. Wrong URL in ChatGPT connector settings

**Solutions:**
```bash
# Check if server is running
curl http://localhost:8000/mcp

# Check server logs
heroku logs --tail

# Verify port
echo $PORT  # Should be 8000
```

#### Issue: "Session terminated" error

**Cause**: SSE connection error

**Fix**: Check `server.js` for proper SSE cleanup:

```javascript
transport.onclose = async () => {
  sseConnections.delete(sessionId);  // ✅ Correct
  // NOT: await server.close();  // ❌ Wrong
};
```

#### Issue: Widget not displaying

**Possible Causes:**
1. Widget HTML file not found
2. JavaScript error in widget
3. Theme detection failing

**Solutions:**
```bash
# Check widget files exist
ls -la widgets/

# Check browser console in ChatGPT
# (Right-click widget → Inspect)

# Verify widget is returned
console.log('Widget data:', widgetData);
```

#### Issue: Dark mode text not visible

**Cause**: CSS not detecting theme

**Fix**: Add theme detection:

```javascript
const theme = await window.openai.theme();
document.documentElement.setAttribute('data-theme', theme);
```

```css
:root[data-theme="dark"] {
  --text-color: #ffffff;
  --bg-color: #1a1a1a;
}

:root[data-theme="light"] {
  --text-color: #000000;
  --bg-color: #ffffff;
}
```

#### Issue: API rate limits (MCP2)

**Cause**: Too many Unwrangle API calls

**Solutions:**
1. Implement caching:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResult(query) {
  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

2. Use the demo API key (limited requests)

#### Issue: Heroku dyno sleeping

**Cause**: Free tier dynos sleep after 30 minutes of inactivity

**Solutions:**
1. Upgrade to paid tier (Hobby/Professional)
2. Use a service like [Kaffeine](https://kaffeine.herokuapp.com/) to keep it awake
3. Accept the 10-second cold start delay

---

## Environment-Specific Configuration

### Development (.env file)

```bash
PORT=8000
NODE_ENV=development
UNWRANGLE_API_KEY=dev_key_here
LOG_LEVEL=debug
```

### Production (Heroku Config)

```bash
# Set production variables
heroku config:set NODE_ENV=production
heroku config:set UNWRANGLE_API_KEY=prod_key_here
heroku config:set LOG_LEVEL=info

# View all config
heroku config
```

---

## Scaling Your MCP Server

### Performance Tips

1. **Enable Caching**: Cache API responses and static files
2. **Use CDN**: Serve widgets and assets from a CDN
3. **Database**: Move from in-memory `Map` to Redis/PostgreSQL
4. **Load Balancing**: Use multiple dynos with Heroku's load balancer
5. **Optimize Widgets**: Minify HTML/CSS/JS, compress images

### Example: Redis Session Storage

```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Store session
await client.set(`session:${sessionId}`, JSON.stringify(sessionData));

// Retrieve session
const sessionData = JSON.parse(await client.get(`session:${sessionId}`));

// Set expiration (10 minutes)
await client.expire(`session:${sessionId}`, 600);
```

---

## Security Best Practices

1. **API Keys**: Never commit `.env` to Git
2. **CORS**: Limit origins to ChatGPT domains only
3. **Rate Limiting**: Implement rate limits per session
4. **Input Validation**: Sanitize all user inputs
5. **HTTPS Only**: Always use HTTPS in production

```javascript
// Example: Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Getting Help

- **GitHub Issues**: Open an issue in this repository
- **MCP Documentation**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Heroku Support**: [help.heroku.com](https://help.heroku.com/)
- **Community**: Join the MCP Discord or forums

---

## Next Steps

✅ Set up your local environment  
✅ Test all 4 MCP servers  
✅ Deploy to Heroku  
✅ Connect to ChatGPT  

**Now try building your own MCP server!** Check out [EXAMPLES.md](./EXAMPLES.md) for code patterns and best practices.

Happy building! 🚀

