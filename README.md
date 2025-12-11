# ChatGPT MCP Server Examples

> Build interactive, branded components for ChatGPT using the Model Context Protocol (MCP)

This repository contains **complete, production-ready examples** of MCP servers that demonstrate how to create rich, interactive experiences within ChatGPT. Each example showcases different UI patterns, state management techniques, and integration strategies.

## 🎯 What You'll Learn

- How to build MCP servers that serve interactive widgets to ChatGPT
- State management across user sessions
- Dark/light mode support
- Multi-step UI flows with transitions
- API integration and data presentation
- Deployment strategies

## 🚀 Live MCP Server URLs

You can connect to these live servers directly in ChatGPT:

| MCP Server | URL | Description |
|------------|-----|-------------|
| **Authentication** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp` | Session-based authentication with 3-screen flow |
| **Product Search** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp2` | Interactive product carousel with Agentforce recommendations |
| **Checkout** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp3` | Shopping cart and checkout flow |
| **Membership** | `https://chatgpt-components-0d9232341440.herokuapp.com/mcp4` | Circle 360 membership signup with tier selection |

### How to Connect

1. Open ChatGPT → **Settings** → **Connectors**
2. Click **"Add Connector"**
3. Paste one of the URLs above
4. Start chatting! Try: *"Log me into my Target account"* or *"Search for fitness trackers"*

## 📚 What's Included

### 4 Complete MCP Server Examples

#### 1. **Authentication Server** (`/mcp`)
- 3-screen authentication flow (login → verification → success)
- Session management with unique session IDs
- State persistence across tool calls
- Demo credentials for testing

**Example prompt:** *"I need to sign in to Target"*

#### 2. **Product Search Server** (`/mcp2`)
- Product carousel widget with images, prices, ratings
- Agentforce personalized recommendations
- Integration with Unwrangle API
- Detail view for individual products
- Dark/light mode support

**Example prompt:** *"Search Target for fitness trackers"*

#### 3. **Checkout Server** (`/mcp3`)
- Add-to-cart confirmation widget
- Complete checkout flow with pre-filled payment/shipping
- Order summary and success animations
- Single-item cart enforcement

**Example prompt:** *"Add the Fitbit to my cart and checkout"*

#### 4. **Membership Server** (`/mcp4`)
- Circle 360 membership signup
- 3-tier selection UI
- Dynamic order summary
- Processing screen with success confetti
- Demo reset endpoint for testing

**Example prompt:** *"Sign me up for Circle 360"*

## 🏗️ Repository Structure

```
ChatGPT Components/
├── server.js                 # Main Node.js MCP server (all 4 servers)
├── widgets/                  # Interactive HTML components
│   ├── target-auth.html      # Authentication widget
│   ├── product-carousel.html # Product search widget
│   ├── add-to-cart.html      # Add to cart widget
│   ├── checkout.html         # Checkout widget
│   └── circle-signup.html    # Membership signup widget
├── public/                   # Static pages
│   ├── auth.html            # External auth page (Custom GPT Actions)
│   └── privacy.html         # Privacy policy
├── docs/                     # Documentation
│   ├── BUILDING_MCP_SERVERS.md    # Tutorial: Build your own
│   ├── ARCHITECTURE.md            # System design overview
│   └── examples/                  # Detailed example docs
│       ├── authentication.md
│       ├── product-search.md
│       ├── checkout.md
│       └── membership.md
├── package.json             # Dependencies
├── Procfile                 # Heroku deployment config
└── README.md               # You are here
```

## 🎓 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- (Optional) Heroku CLI for deployment

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ChatGPT-Components
```

2. **Install dependencies**
```bash
npm install
```

3. **Set environment variables**
```bash
export UNWRANGLE_API_KEY=your_api_key_here  # For product search
```

4. **Start the server**
```bash
npm start
```

5. **Test in ChatGPT**
   - Add connector: `http://localhost:8000/mcp` (or `/mcp2`, `/mcp3`, `/mcp4`)
   - Start chatting!

### Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set UNWRANGLE_API_KEY=your_api_key_here
git push heroku main
```

Your MCP servers will be available at:
- `https://your-app-name.herokuapp.com/mcp`
- `https://your-app-name.herokuapp.com/mcp2`
- `https://your-app-name.herokuapp.com/mcp3`
- `https://your-app-name.herokuapp.com/mcp4`

## 📖 Learn More

- **[Building MCP Servers Tutorial](docs/BUILDING_MCP_SERVERS.md)** - Step-by-step guide to creating your own MCP server
- **[Architecture Overview](docs/ARCHITECTURE.md)** - How the system works under the hood
- **[Example Documentation](docs/examples/)** - Deep dives into each example server

## 🎨 Key Features Demonstrated

### UI/UX Patterns
- ✅ Multi-screen flows with smooth transitions
- ✅ Loading states and progress indicators
- ✅ Success animations (checkmarks, confetti)
- ✅ Dark/light mode support (respects ChatGPT theme)
- ✅ Responsive design
- ✅ Form validation and error handling

### Technical Patterns
- ✅ Session management with unique IDs
- ✅ State persistence across tool calls
- ✅ SSE (Server-Sent Events) for real-time communication
- ✅ Multiple MCP servers on one Node.js app
- ✅ External API integration
- ✅ Widget-to-server communication
- ✅ `window.openai` API usage

### Business Logic
- ✅ Authentication flows
- ✅ Product recommendations
- ✅ Shopping cart management
- ✅ Payment/checkout flows
- ✅ Membership signups

## 🔧 Customization

Each widget is self-contained in `widgets/` and can be customized:
- **Styling**: Modify CSS within each HTML file
- **Branding**: Change colors, logos, and text
- **Flow**: Add/remove steps in multi-screen flows
- **Behavior**: Edit JavaScript event handlers

Server logic is in `server.js`:
- **Tools**: Add new tool definitions in each `createMcpXServer` function
- **Sessions**: Customize state management in `authSessions`, `cartStorage`, etc.
- **APIs**: Integrate your own backend services

## 🤝 Contributing

This repository is designed to be:
- **Educational**: Learn by example
- **Modular**: Copy what you need
- **Production-ready**: Use as-is or customize

Feel free to fork, modify, and build upon these examples!

## 📝 License

MIT License - feel free to use this code in your own projects!

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check the [documentation](docs/)
- **Examples**: See detailed guides in [docs/examples/](docs/examples/)

## 🌟 What's Next?

After exploring these examples, try:
1. Building your own MCP server from scratch
2. Combining multiple tools in creative ways
3. Integrating with your own APIs and services
4. Deploying to production

Check out **[BUILDING_MCP_SERVERS.md](docs/BUILDING_MCP_SERVERS.md)** to get started!

---

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io/)
