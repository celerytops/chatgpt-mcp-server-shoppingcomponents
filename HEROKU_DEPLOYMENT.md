# 🚀 Heroku Deployment Guide

## Quick Deploy to Heroku

### Prerequisites
- [Heroku Account](https://signup.heroku.com/) (free tier works!)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git installed

### Step 1: Prepare Your Project

```bash
cd "/Users/rdinh/ChatGPT Components"
```

### Step 2: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Target auth component"
```

### Step 3: Login to Heroku

```bash
heroku login
```

This will open your browser for authentication.

### Step 4: Create Heroku App

```bash
heroku create target-auth-component
```

Or with a specific name:
```bash
heroku create your-custom-name
```

Heroku will give you a URL like: `https://target-auth-component-abc123.herokuapp.com`

### Step 5: Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
```

### Step 6: Deploy

```bash
git push heroku main
```

Or if you're on master branch:
```bash
git push heroku master
```

### Step 7: Open Your App

```bash
heroku open
```

### Step 8: View Logs (if needed)

```bash
heroku logs --tail
```

## 🎉 Your App is Live!

Your MCP server is now running at: `https://your-app-name.herokuapp.com`

### Test Your Deployment

1. **Check MCP Metadata:**
   ```
   https://your-app-name.herokuapp.com/.well-known/mcp.json
   ```

2. **Check OpenAPI Schema:**
   ```
   https://your-app-name.herokuapp.com/openapi.json
   ```

3. **Test Auth Component:**
   ```
   https://your-app-name.herokuapp.com/components/auth.html
   ```

## 📱 Connect to ChatGPT

### For MCP Server (ChatGPT Apps)

1. Open [ChatGPT](https://chatgpt.com)
2. Go to **Settings** → **Developer**
3. Enable **Developer Mode**
4. Click **+ Create App**
5. Enter:
   - **Name**: Target Team Member Auth
   - **MCP Server URL**: `https://your-app-name.herokuapp.com`
6. Click **Create**

### For Custom GPT (Actions)

1. Go to [ChatGPT](https://chatgpt.com)
2. Click your profile → **My GPTs**
3. Click **+ Create a GPT**
4. In the **Configure** tab:
   - Give it a name: "Target Team Member Assistant"
   - Add description
5. Scroll to **Actions** → **Create new action**
6. Import schema from:
   ```
   https://your-app-name.herokuapp.com/openapi.json
   ```
7. Click **Import**
8. Set **Authentication** to "None"
9. Test the actions!

## 🔧 Updating Your App

When you make changes:

```bash
git add .
git commit -m "Your update message"
git push heroku main
```

## 🎛️ Heroku Commands Cheat Sheet

```bash
# View app info
heroku info

# Open app in browser
heroku open

# View logs (live)
heroku logs --tail

# View logs (last 200 lines)
heroku logs -n 200

# Restart the app
heroku restart

# Check dyno status
heroku ps

# Scale dynos (if needed)
heroku ps:scale web=1

# Set config variable
heroku config:set VARIABLE_NAME=value

# View all config variables
heroku config

# Remove config variable
heroku config:unset VARIABLE_NAME

# Run commands on Heroku
heroku run node -v
```

## 💰 Cost Information

**Free Tier Includes:**
- 550-1000 free dyno hours per month
- Enough for one app running 24/7
- Auto-sleeps after 30 minutes of inactivity
- Wakes up automatically when accessed (3-5 second delay)

**To Prevent Sleep (Paid Dyno):**
```bash
heroku ps:type hobby
# Costs $7/month
```

## 🔒 Security Best Practices

### 1. Use Environment Variables

Never commit sensitive data. Use Heroku config vars:

```bash
heroku config:set API_KEY=your_api_key_here
```

### 2. Enable HTTPS

Heroku provides HTTPS automatically! All your endpoints are secure.

### 3. Add Rate Limiting (Optional)

Update your server.js to add rate limiting:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

Then install:
```bash
npm install express-rate-limit
git add .
git commit -m "Add rate limiting"
git push heroku main
```

## 🐛 Troubleshooting

### App Crashes on Startup

```bash
heroku logs --tail
```

Common issues:
- Missing dependencies → `npm install`
- Wrong Node version → Check `engines` in package.json
- Port binding → Make sure using `process.env.PORT`

### Can't Connect from ChatGPT

- ✅ Check app is running: `heroku ps`
- ✅ Verify URL is correct (no trailing slash)
- ✅ Test MCP endpoint: `https://your-app.herokuapp.com/.well-known/mcp.json`
- ✅ Check CORS is enabled in server.js
- ✅ Look at Heroku logs for errors

### Slow Response Times

Free dynos sleep after 30 minutes of inactivity:
- First request after sleep takes 3-5 seconds
- Upgrade to hobby dyno ($7/mo) for always-on
- Or use a ping service to keep it awake

### Database/Session Issues

Currently using in-memory sessions. On Heroku:
- Sessions reset when dyno restarts
- Use Redis for persistent sessions:

```bash
heroku addons:create heroku-redis:mini
```

Then update server.js to use Redis.

## 📊 Monitoring

### View Metrics

```bash
heroku logs --tail
```

### Application Metrics

Free in Heroku Dashboard:
- Response times
- Memory usage
- Request volume
- Error rates

### Custom Logging

Add to server.js:

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## 🔄 CI/CD (Optional)

### Connect to GitHub

1. Go to your Heroku Dashboard
2. Select your app
3. Go to **Deploy** tab
4. Choose **GitHub** as deployment method
5. Connect your repository
6. Enable **Automatic Deploys** from main branch

Now every push to GitHub automatically deploys!

## 🌍 Custom Domain (Optional)

Add your own domain:

```bash
heroku domains:add www.yourdomain.com
```

Then update your DNS:
- Add CNAME record pointing to your Heroku app
- Follow Heroku's DNS instructions

## 📦 Addons You Might Want

```bash
# Redis (for sessions)
heroku addons:create heroku-redis:mini

# PostgreSQL (for data)
heroku addons:create heroku-postgresql:mini

# Papertrail (better logging)
heroku addons:create papertrail:chokinonlogs

# New Relic (monitoring)
heroku addons:create newrelic:wayne
```

## 🎯 Next Steps

1. ✅ Deploy to Heroku
2. ✅ Test all endpoints
3. ✅ Connect to ChatGPT (MCP or Actions)
4. ✅ Test authentication flow
5. ✅ Monitor logs for issues
6. 📈 Add monitoring and analytics
7. 🔒 Implement rate limiting
8. 💾 Add Redis for sessions
9. 🎨 Customize branding further
10. 🚀 Launch to users!

## 📚 Resources

- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku CLI Commands](https://devcenter.heroku.com/articles/heroku-cli-commands)
- [Heroku Logs](https://devcenter.heroku.com/articles/logging)
- [Heroku Environment Variables](https://devcenter.heroku.com/articles/config-vars)
- [Heroku Dyno Types](https://www.heroku.com/dynos)

## 💡 Pro Tips

1. **Keep Dependencies Updated**: Regularly run `npm update`
2. **Monitor Your Logs**: Set up Papertrail for better log management
3. **Use Redis**: For persistent sessions across dyno restarts
4. **Add Health Check**: Create `/health` endpoint for monitoring
5. **Environment-Specific Code**: Use `process.env.NODE_ENV` for dev vs prod
6. **Backup Important Data**: Heroku is not a database
7. **Test Locally First**: Always test changes locally before deploying
8. **Use Git Branches**: Create feature branches, test, then merge

## 🎊 You're Done!

Your Target authentication component is now live on Heroku and ready to use with ChatGPT!

Questions? Check the [main README](README.md) or [Architecture docs](ARCHITECTURE.md).

