# Contributing to ChatGPT MCP Servers

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

---

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. **Clear Title**: Describe the issue concisely
2. **Description**: What happened vs. what you expected
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Environment**: OS, Node.js version, browser
5. **Screenshots/Logs**: If applicable

**Example:**

```
Title: Widget not displaying in dark mode

Description: When ChatGPT is in dark mode, the authentication widget shows a blank screen.

Steps to Reproduce:
1. Enable dark mode in ChatGPT
2. Connect to MCP1 authentication server
3. Ask "Sign me into Target"
4. Widget appears blank

Environment:
- macOS 14.0
- Node.js 20.10.0
- Chrome 120.0

Screenshot: [attach screenshot]
```

---

### Suggesting Features

We welcome feature suggestions! Please open an issue with:

1. **Use Case**: What problem does this solve?
2. **Proposed Solution**: How would it work?
3. **Alternatives**: Other approaches you've considered
4. **Impact**: Who would benefit from this feature?

---

### Pull Requests

#### Before You Start

1. **Check Existing Issues**: Make sure your change isn't already being worked on
2. **Open an Issue First**: For major changes, discuss the approach first
3. **Fork the Repository**: Create your own fork to work on
4. **One Change Per PR**: Keep pull requests focused on a single feature/fix

#### Development Workflow

1. **Fork and Clone**

```bash
git clone https://github.com/YOUR_USERNAME/chatgpt-mcp-servers.git
cd chatgpt-mcp-servers
```

2. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use descriptive branch names:
- `feature/add-payment-widget`
- `fix/dark-mode-text-color`
- `docs/update-setup-guide`

3. **Make Your Changes**

- Follow the existing code style
- Add comments for complex logic
- Test your changes locally
- Update documentation if needed

4. **Test Thoroughly**

```bash
# Start the server
npm start

# Test in ChatGPT
# - Connect to http://localhost:8000/mcp
# - Test your changes in light/dark mode
# - Verify all 4 MCP servers still work
```

5. **Commit Your Changes**

Use clear, descriptive commit messages:

```bash
git add -A
git commit -m "Add payment widget for checkout flow

- Created new payment-method.html widget
- Added select-payment tool to MCP3
- Supports saved cards and new card entry
- Tested in light/dark mode"
```

**Commit Message Format:**
- First line: Brief summary (50 chars or less)
- Blank line
- Detailed description with bullet points
- Reference issues: "Fixes #123" or "Related to #456"

6. **Push and Create PR**

```bash
git push origin feature/your-feature-name
```

Then go to GitHub and create a pull request.

#### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested locally with `npm start`
- [ ] Tested in ChatGPT (light mode)
- [ ] Tested in ChatGPT (dark mode)
- [ ] All 4 MCP servers still work
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes thoroughly

## Related Issues
Fixes #[issue number]
```

---

## Code Style Guidelines

### JavaScript

- Use **ES6+** syntax (const, let, arrow functions, async/await)
- Use **2 spaces** for indentation
- Use **single quotes** for strings (except in HTML)
- Add **semicolons** at the end of statements
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes

**Example:**

```javascript
// ✅ Good
async function handleAuthentication(sessionId) {
  const session = authSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  return {
    authenticated: session.authenticated,
    email: session.email,
    name: session.name
  };
}

// ❌ Bad
async function handle_authentication(session_id) {
    var session = authSessions.get(session_id)
    if(!session){
      throw new Error("Session not found")
    }
    return {authenticated:session.authenticated,email:session.email,name:session.name}
}
```

### HTML/CSS

- Use **2 spaces** for indentation
- Use **double quotes** for HTML attributes
- Use **kebab-case** for CSS classes
- Group related styles together
- Add comments for complex layouts

**Example:**

```html
<!-- ✅ Good -->
<div class="auth-container" data-theme="light">
  <h1 class="auth-title">Welcome Back</h1>
  <button class="btn-primary" id="sign-in-btn">
    Sign In
  </button>
</div>
```

```css
/* ✅ Good */
.auth-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Primary button styling */
.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
```

### Widget Best Practices

1. **Always Support Dark Mode**

```javascript
async function applyTheme() {
  const theme = await window.openai.theme();
  document.documentElement.setAttribute('data-theme', theme);
}

window.openai.addEventListener('themeChanged', applyTheme);
```

2. **Show Loading States**

```javascript
async function initialize() {
  showLoadingScreen();
  
  const toolOutput = await window.openai.toolOutput();
  
  if (!toolOutput || !toolOutput.sessionId) {
    setTimeout(initialize, 100);
    return;
  }
  
  hideLoadingScreen();
  renderContent(toolOutput);
}
```

3. **Handle Errors Gracefully**

```javascript
try {
  const response = await fetch('/api/endpoint', { method: 'POST' });
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
  handleSuccess(data);
} catch (error) {
  console.error('Error:', error);
  showErrorScreen('Something went wrong. Please try again.');
}
```

4. **Notify ChatGPT of State Changes**

```javascript
// After important actions
await window.openai.setWidgetState({ step: 'completed' });
await window.openai.sendFollowUpMessage('User completed authentication');
```

---

## Documentation Guidelines

### When to Update Documentation

- **Always** update docs when adding new features
- **Always** update docs when changing APIs
- Update examples when changing behavior
- Add troubleshooting entries for common issues

### Documentation Files

- **README.md**: High-level overview, getting started
- **SETUP.md**: Detailed setup and deployment instructions
- **EXAMPLES.md**: Code examples and patterns
- **CONTRIBUTING.md**: This file (contribution guidelines)

### Documentation Style

- Use **clear, concise language**
- Include **code examples** for clarity
- Add **screenshots** for UI changes
- Use **headings** to organize content
- Add **links** to related sections
- Use **emoji sparingly** (✅ ❌ 🚀)

---

## Project Structure

When adding new features, follow this structure:

```
chatgpt-mcp-servers/
├── server.js              # Main server file
│   ├── MCP1: Authentication
│   ├── MCP2: Product Search
│   ├── MCP3: Checkout
│   ├── MCP4: Membership
│   └── Shared utilities
│
├── widgets/              # UI components
│   └── [feature-name].html
│
├── public/              # Static assets
│   └── [asset-name]
│
├── tests/              # Test files (optional)
│   └── [feature].test.js
│
└── docs/               # Additional documentation
    └── [topic].md
```

---

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Server starts without errors (`npm start`)
- [ ] All MCP endpoints work (`/mcp`, `/mcp2`, `/mcp3`, `/mcp4`)
- [ ] Widgets render correctly in ChatGPT
- [ ] Dark mode works (toggle in ChatGPT settings)
- [ ] Light mode works
- [ ] No console errors in browser DevTools
- [ ] No errors in server logs
- [ ] Session management works correctly
- [ ] Demo reset endpoint works (`POST /api/demo/reset`)

### Testing in ChatGPT

1. **Connect Locally**: Use `http://localhost:8000/mcp`
2. **Test Each MCP Server**: Try all 4 endpoints
3. **Test Edge Cases**: Invalid inputs, missing data, etc.
4. **Test Across Themes**: Light and dark mode
5. **Test Sequential Flows**: Multi-step processes like authentication

---

## Review Process

### What We Look For

✅ **Code Quality**
- Clean, readable code
- Proper error handling
- Efficient algorithms
- No unnecessary complexity

✅ **Functionality**
- Feature works as described
- No breaking changes (unless discussed)
- Edge cases handled

✅ **Documentation**
- Code comments for complex logic
- Updated README/SETUP/EXAMPLES as needed
- Clear commit messages

✅ **Testing**
- Manually tested locally
- Tested in ChatGPT
- No regressions in existing features

### Timeline

- **Initial Review**: Within 3-5 days
- **Feedback**: We'll provide constructive feedback
- **Iterations**: Make requested changes
- **Merge**: Once approved, we'll merge your PR!

---

## Community Guidelines

### Be Respectful

- Be kind and constructive in discussions
- Welcome newcomers and help them get started
- Give credit where credit is due
- Assume good intentions

### Be Collaborative

- Share your ideas openly
- Ask questions if something is unclear
- Offer help to other contributors
- Celebrate successes together!

### Be Patient

- Maintainers are volunteers with limited time
- Reviews may take a few days
- Not all PRs can be merged
- We appreciate your understanding!

---

## Recognition

Contributors will be:
- Listed in the project's contributors section
- Credited in release notes
- Mentioned in relevant documentation

Thank you for making this project better! 🎉

---

## Questions?

If you have questions about contributing:

1. Check the [README.md](./README.md)
2. Check the [SETUP.md](./SETUP.md)
3. Check existing issues
4. Open a new issue with the "question" label

We're here to help! 😊

