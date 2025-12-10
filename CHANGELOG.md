# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-10

### 🎉 Initial Release

#### Added
- **MCP1: Authentication Server**
  - Session-based authentication flow
  - 3-screen UI: login → verification → success
  - Session management with auto-cleanup
  - Dark/light mode support
  
- **MCP2: Product Search Server**
  - Integration with Unwrangle API for real Target product data
  - Interactive product carousel widget
  - Product detail pages with back navigation
  - Agentforce-style AI recommendations with personalized messaging
  - Customer context: purchase history, color preferences, family insights
  
- **MCP3: Checkout Server**
  - Add-to-cart functionality with success animations
  - Complete checkout flow with order summary
  - Pre-filled shipping and payment information
  - Direct product checkout (bypass cart)
  - Single-item cart enforcement
  
- **MCP4: Membership Server**
  - Target Circle 360 membership signup
  - 3-tier selection (Standard, Plus, Max)
  - Dynamic pricing display
  - Processing animations
  - Success screen with confetti celebration 🎉
  
- **Infrastructure**
  - Express.js server with SSE transport
  - Session cleanup (10-minute TTL)
  - Demo reset endpoint
  - CORS configuration for ChatGPT
  - Heroku deployment support
  - OpenAPI schema for Custom GPT Actions
  
- **Documentation**
  - Comprehensive README with live server URLs
  - SETUP.md with detailed installation instructions
  - EXAMPLES.md with code patterns and best practices
  - ARCHITECTURE.md explaining system design
  - QUICKSTART.md for rapid onboarding
  - CONTRIBUTING.md with guidelines
  - MIT License
  
- **Widgets**
  - Dark/light mode detection and support
  - Loading states for all components
  - Error handling and user feedback
  - Responsive design for ChatGPT's iframe
  - Target branding (logo, colors, styling)
  - Smooth animations and transitions

### Fixed
- Circular reference crash in SSE cleanup
- JSON schema validation errors
- Session termination errors
- Dark mode text visibility issues
- Parallel tool call handling
- Widget loading race conditions
- Confetti animation direction (bottom-up spray)
- Cart quantity enforcement (single item only)
- Widget height detection for ChatGPT resizing

### Security
- Environment variable management for API keys
- Input validation for all tool parameters
- Session ID format validation
- CORS headers for production

---

## [Unreleased]

### Planned Features
- [ ] Redis integration for session persistence
- [ ] Rate limiting for API endpoints
- [ ] Unit tests and integration tests
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Additional MCP server examples
- [ ] Video tutorials and demos
- [ ] Docker deployment option
- [ ] Kubernetes manifests
- [ ] Performance monitoring dashboard
- [ ] Analytics and usage tracking

### Known Issues
- In-memory storage (not suitable for multi-instance deployment)
- No persistent state between server restarts
- Limited error recovery for external API failures
- Heroku free tier sleep mode (10-second cold start)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting changes.

## Support

- Report bugs: [GitHub Issues](https://github.com/yourusername/chatgpt-mcp-servers/issues)
- Documentation: [README.md](./README.md)
- Examples: [EXAMPLES.md](./EXAMPLES.md)

---

**[1.0.0]**: https://github.com/yourusername/chatgpt-mcp-servers/releases/tag/v1.0.0

