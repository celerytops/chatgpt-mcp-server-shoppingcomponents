# Contributing to ChatGPT MCP Examples

Thank you for your interest in contributing to this project! This repository is designed to help developers learn how to build MCP servers for ChatGPT through practical examples.

## Ways to Contribute

### 1. Report Issues

Found a bug or have a suggestion?
- Check existing issues first
- Open a new issue with a clear description
- Include steps to reproduce (if bug)
- Include your environment details

### 2. Improve Documentation

- Fix typos or unclear explanations
- Add more examples or use cases
- Improve code comments
- Translate documentation

### 3. Add New Examples

We welcome new MCP server examples! Ideal examples should:
- Demonstrate a unique pattern or use case
- Include comprehensive documentation
- Follow the existing structure
- Be production-ready (or clearly marked as demo)

**Example categories we'd love to see:**
- File upload/download
- Real-time data (WebSockets)
- Database integration
- OAuth authentication
- Third-party API integrations
- Analytics dashboards
- Form builders
- Image processing
- PDF generation

### 4. Enhance Existing Examples

- Add features to existing servers
- Improve UI/UX
- Optimize performance
- Add tests
- Fix security issues

## Development Setup

1. **Fork the repository**

2. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/chatgpt-mcp-examples.git
cd chatgpt-mcp-examples
```

3. **Install dependencies**
```bash
npm install
```

4. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

5. **Make your changes**
   - Follow the existing code style
   - Test your changes locally
   - Update documentation

6. **Test in ChatGPT**
   - Start server: `npm start`
   - Add connector in ChatGPT: `http://localhost:8000/mcp`
   - Test all affected tools

7. **Commit your changes**
```bash
git add .
git commit -m "Add: Description of your changes"
```

8. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

9. **Open a Pull Request**
   - Describe what you changed and why
   - Link any related issues
   - Include screenshots (if UI changes)

## Code Style

### JavaScript

- Use ES6+ features (import/export, async/await, arrow functions)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

**Example:**
```javascript
// Good
async function fetchProducts(query, page = 1) {
  const response = await fetch(`/api/products?q=${query}&page=${page}`);
  return await response.json();
}

// Avoid
async function f(q, p) {
  return await (await fetch(`/api/products?q=${q}&page=${p}`)).json();
}
```

### HTML/CSS

- Use semantic HTML5 tags
- Keep inline styles minimal
- Support dark/light mode
- Make widgets responsive
- Use CSS variables for themes

**Example:**
```css
:root {
  --primary-color: #cc0000;
  --text-color-light: #333;
  --text-color-dark: #e0e0e0;
}

body.light { color: var(--text-color-light); }
body.dark { color: var(--text-color-dark); }
```

### Documentation

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Document all API endpoints
- Explain the "why" not just the "what"

## Project Structure

When adding a new MCP server:

```
ChatGPT Components/
├── server.js                    # Add your server here
├── widgets/
│   └── your-widget.html         # Add widget HTML here
├── docs/
│   └── examples/
│       └── your-example.md      # Add documentation here
└── README.md                    # Update with your server URL
```

## Testing Checklist

Before submitting a PR:

- [ ] Code runs without errors
- [ ] All tools work in ChatGPT
- [ ] Widgets render correctly
- [ ] Dark mode works
- [ ] Light mode works
- [ ] No console errors
- [ ] Documentation is complete
- [ ] README.md updated (if needed)

## Commit Message Guidelines

Use clear, descriptive commit messages:

- **Add:** New features or files
- **Fix:** Bug fixes
- **Update:** Changes to existing features
- **Docs:** Documentation changes
- **Refactor:** Code restructuring
- **Style:** Formatting changes
- **Test:** Adding or updating tests

**Examples:**
```
Add: Circle 360 membership signup widget
Fix: Confetti animation starting from wrong position
Update: Product carousel dark mode colors
Docs: Add architecture diagram
```

## Pull Request Guidelines

### Title

Use a clear, descriptive title:
- "Add authentication MCP server example"
- "Fix dark mode text color in checkout widget"
- "Update README with deployment instructions"

### Description

Include:
1. **What** changed
2. **Why** it changed
3. **How** to test it
4. Screenshots (if applicable)
5. Related issues

**Template:**
```markdown
## Description
Added a new MCP server for file uploads with drag-and-drop UI.

## Why
Many developers need file upload capabilities in their MCP servers.

## How to Test
1. Start server: `npm start`
2. Connect to `/mcp5`
3. Ask: "Upload a file"
4. Drag and drop a file into the widget

## Screenshots
[Screenshot of widget]

Fixes #123
```

## Code Review Process

1. Maintainer reviews your PR
2. Feedback provided (if needed)
3. You make requested changes
4. Maintainer approves and merges

Typical review time: 2-5 days

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions
- **Documentation**: Check [docs/](docs/) first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in the project's contributors
- Credited in release notes
- Appreciated forever! 🙏

---

Thank you for contributing! Every contribution, no matter how small, makes this project better for everyone.

