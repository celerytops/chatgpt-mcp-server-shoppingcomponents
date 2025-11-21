# 🚀 Quick Setup Guide

Follow these steps to get your ChatGPT components up and running in 5 minutes!

## Step 1: Install Dependencies ⚙️

```bash
cd "/Users/rdinh/ChatGPT Components"
npm install
```

## Step 2: Start the Server 🌐

```bash
npm start
```

You should see:
```
🚀 MCP Server running at http://localhost:3000
```

**Keep this terminal window open!** Your server needs to stay running.

## Step 3: Connect to ChatGPT 🤖

### 3.1 Enable Developer Mode

1. Go to **[ChatGPT](https://chatgpt.com)**
2. Click your **profile icon** (bottom left corner)
3. Select **Settings**
4. Navigate to **Developer** section
5. Toggle **Developer Mode** to ON

### 3.2 Create Your App

1. In the Developer section, click **+ Create App**
2. Fill in the details:
   ```
   Name: My Auth Component
   MCP Server URL: http://localhost:3000
   ```
3. Click **Create**

### 3.3 Activate Your App

1. In ChatGPT's main interface, look for your new app in the apps list
2. Click to activate it

## Step 4: Test It Out! 🎉

Try these prompts in ChatGPT:

### Test Authentication
```
Show me the login form
```

Then fill in:
- **Email**: test@example.com
- **Password**: password123

### Check User Profile
```
Show my profile
```

### Check Authentication Status
```
Am I logged in?
```

### Log Out
```
Log me out
```

## 🎨 What You'll See

### 1. Authentication Component
A beautiful login form with:
- ✅ Email and password fields
- ✅ Loading states
- ✅ Error handling
- ✅ Success confirmation
- ✅ OAuth buttons (placeholder)

### 2. Profile Component
A gorgeous profile card showing:
- 👤 User avatar
- 📧 Email address
- 📊 Stats (demo data)
- ⚙️ Action buttons

## 🔍 Behind the Scenes

### What Happens When You Log In:

```
1. You → ChatGPT: "Show me the login form"
2. ChatGPT → MCP Server: Call tool "authenticate_user"
3. MCP Server → ChatGPT: Here's the component URL
4. ChatGPT: Renders auth.html in iframe
5. You: Fill form and submit
6. Component → MCP Server: /api/authenticate with credentials
7. MCP Server: Validates, creates session
8. Component → ChatGPT: "User authenticated!"
9. ChatGPT: Updates conversation context
```

### Where Data is Stored:

- **Sessions**: In-memory Map (server.js)
- **User Info**: Stored in session
- **Component State**: In iframe + ChatGPT context

## 🧪 Testing Standalone

You can test components directly in your browser:

```
http://localhost:3000/components/auth.html
http://localhost:3000/components/profile.html
```

This is great for development and debugging!

## 🛠️ Customizing Your Components

### Change the Styling

Edit the `<style>` section in:
- `public/components/auth.html`
- `public/components/profile.html`

### Add New Tools

In `server.js`, add to the `tools` array:

```javascript
{
  name: "my_new_tool",
  description: "What this tool does",
  inputSchema: {
    type: "object",
    properties: {
      // your parameters
    }
  },
  ui: {
    type: "component",
    componentUrl: `http://localhost:${PORT}/components/my-component.html`
  }
}
```

Then handle it in the `/mcp/tools/call` endpoint.

### Create New Components

1. Create a new HTML file in `public/components/`
2. Add tool definition in `server.js`
3. Test standalone first
4. Test in ChatGPT

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill the process if needed
kill -9 <PID>

# Or use a different port in .env
PORT=3001 npm start
```

### Component not showing
- ✅ Check server is running
- ✅ Open browser console (F12)
- ✅ Verify URL: http://localhost:3000/.well-known/mcp.json
- ✅ Check ChatGPT Developer Mode is enabled

### Authentication not working
- ✅ Check browser Network tab
- ✅ Look at server logs in terminal
- ✅ Ensure sessionId is being passed
- ✅ Try: Password must be 6+ characters

### CORS errors
- Already handled by server
- If issues persist, check browser security settings

## 📚 Next Steps

### Add Real OAuth

Replace simple auth with OAuth 2.1:
- Auth0: https://auth0.com/docs
- Okta: https://developer.okta.com
- Google: https://developers.google.com/identity

Update the OAuth section in `server.js`.

### Deploy to Production

Options:
- **Vercel**: Easy deployment, serverless
- **Railway**: Full server, easy setup
- **Heroku**: Classic PaaS
- **DigitalOcean**: Full control

Remember to:
1. Update all URLs from `localhost` to your domain
2. Add environment variables
3. Use a real database for sessions
4. Add HTTPS
5. Implement security best practices

### Build More Components

Ideas:
- 📊 **Dashboard** - Analytics and metrics
- 📝 **Task Manager** - Todo lists and projects
- 📅 **Calendar** - Schedule and events
- 🗺️ **Map** - Location-based data
- 🛒 **Shop** - Product catalog
- 📊 **Charts** - Data visualization
- 📧 **Email** - Inbox interface
- 💬 **Chat** - Messaging interface

Check examples: https://github.com/openai/openai-apps-sdk-examples

## 💡 Pro Tips

1. **Use DevTools**: The component is just HTML/JS - debug like any webpage
2. **Test Standalone First**: Build components in browser before ChatGPT
3. **Start Simple**: Get basics working, then add features
4. **Watch Console Logs**: Both browser and server logs are helpful
5. **Handle Errors Gracefully**: Show useful messages to users
6. **Responsive Design**: Test on mobile and desktop
7. **State Management**: Think about what persists where
8. **Security First**: Never store passwords in plain text

## 🎓 Learning Resources

- [Apps SDK Docs](https://developers.openai.com/apps-sdk/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Component Examples](https://github.com/openai/openai-apps-sdk-examples)
- [OAuth 2.1](https://oauth.net/2.1/)

## ❓ Need Help?

1. Check the README.md for detailed docs
2. Look at the example components
3. Read the Apps SDK documentation
4. Check browser and server logs

## 🎉 You're All Set!

You now have a working ChatGPT component with authentication. From here, you can:

- Customize the design
- Add real OAuth
- Create more components
- Deploy to production
- Build something amazing!

Happy coding! 🚀

