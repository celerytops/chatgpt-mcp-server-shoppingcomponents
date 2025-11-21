# Pizzaz MCP Server

A working copy of the [OpenAI Apps SDK Pizzaz example](https://github.com/openai/openai-apps-sdk-examples) deployed to Heroku.

## What This Does

Shows a simple pizza list widget in ChatGPT with a "pizzaTopping" parameter.

## Local Testing

```bash
npm install
npm start
```

Visit: http://localhost:8000

## Deploy to Heroku

```bash
git add -A
git commit -m "Deploy Pizzaz example"
git push heroku main
```

## Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors
2. Add connector with URL: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp`
3. In a conversation, add the connector
4. Ask: "Show me a pizza list with pepperoni"

## Test Endpoints

```bash
# Check server
curl https://chatgpt-components-0d9232341440.herokuapp.com/

# List tools
curl -X POST https://chatgpt-components-0d9232341440.herokuapp.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Next Steps

Once this works, we can:
- Modify the widget HTML (`widgets/pizza-list.html`)
- Change the data structure
- Add more widgets
- Customize for Target authentication

