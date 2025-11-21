#!/usr/bin/env node

/**
 * Pizzaz MCP Server (Node.js)
 * Copied from https://github.com/openai/openai-apps-sdk-examples
 */

import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGETS_DIR = path.resolve(__dirname, 'widgets');

// Widget configuration
const widget = {
  id: 'authenticate-target',
  title: 'Target Customer Authentication',
  templateUri: 'ui://widget/target-auth.html',
  invoking: 'Connecting to Target',
  invoked: 'Authentication required',
  html: null,
  responseText: 'Please sign in to your Target account using the form above.'
};

// Read widget HTML
function readWidgetHtml(componentName) {
  const htmlPath = path.join(WIDGETS_DIR, `${componentName}.html`);
  
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Widget HTML for "${componentName}" not found at ${htmlPath}`);
  }
  
  return fs.readFileSync(htmlPath, 'utf8');
}

// Load widget HTML
widget.html = readWidgetHtml('target-auth');

// Widget metadata helpers
function widgetDescriptorMeta(w) {
  return {
    'openai/outputTemplate': w.templateUri,
    'openai/toolInvocation/invoking': w.invoking,
    'openai/toolInvocation/invoked': w.invoked,
    'openai/widgetAccessible': true,
    'openai/resultCanProduceWidget': true
  };
}

function widgetInvocationMeta(w) {
  return {
    'openai/toolInvocation/invoking': w.invoking,
    'openai/toolInvocation/invoked': w.invoked
  };
}

/**
 * Create MCP Server
 */
function createPizzazServer() {
  const server = new Server(
    {
      name: 'target-auth',
      version: '1.0.0'
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  // List resources
  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request) => ({
      resources: [
        {
          uri: widget.templateUri,
          name: widget.title,
          description: `${widget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(widget)
        }
      ]
    })
  );

  // Read resource
  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      if (request.params.uri === widget.templateUri) {
        return {
          contents: [
            {
              uri: widget.templateUri,
              mimeType: 'text/html+skybridge',
              text: widget.html,
              _meta: widgetDescriptorMeta(widget)
            }
          ]
        };
      }
      
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }
  );

  // List resource templates
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request) => ({
      resourceTemplates: [
        {
          uriTemplate: widget.templateUri,
          name: widget.title,
          description: `${widget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(widget)
        }
      ]
    })
  );

  // List tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request) => ({
      tools: [
        {
          name: widget.id,
          description: 'Authenticate a Target customer. Call with authenticated=false to show login form. After user completes authentication, call with authenticated=true to show confirmation.',
          inputSchema: {
            type: 'object',
            properties: {
              authenticated: {
                type: 'boolean',
                description: 'Whether the customer is already authenticated. Use false for initial login, true for showing confirmation after authentication.',
                default: false
              }
            },
            additionalProperties: false
          },
          title: widget.title,
          _meta: widgetDescriptorMeta(widget),
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: false
          }
        }
      ]
    })
  );

  // Call tool
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      if (request.params.name !== widget.id) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      // Get authenticated status from arguments (default to false)
      const args = request.params.arguments || {};
      const authenticated = args.authenticated === true;

      // Generate a session ID for this authentication
      const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);

      return {
        content: [
          {
            type: 'text',
            text: authenticated 
              ? 'Authentication confirmed. Lauren Bailey is signed in.'
              : widget.responseText
          }
        ],
        structuredContent: {
          sessionId: sessionId,
          authenticated: authenticated
        },
        _meta: widgetInvocationMeta(widget)
      };
    }
  );

  return server;
}

// Session management
const sessions = new Map();

const ssePath = '/mcp';
const postPath = '/mcp/messages';

// Handle SSE request
async function handleSseRequest(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = createPizzazServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    // NOTE: Do NOT call server.close() here - it creates circular reference:
    // transport.onclose -> server.close() -> transport.close() -> transport.onclose -> ...
  };

  transport.onerror = (error) => {
    console.error('SSE transport error', error);
  };

  try {
    await server.connect(transport);
    console.log(`✓ SSE session ${sessionId} connected`);
  } catch (error) {
    sessions.delete(sessionId);
    console.error('Failed to start SSE session:', error.message);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to establish SSE connection');
    }
  }
}

// Handle POST message
async function handlePostMessage(req, res, url) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    res.writeHead(400).end('Missing sessionId query parameter');
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process message', error);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to process message');
    }
  }
}

// Server setup
const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end('Missing URL');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    // CORS preflight
    if (req.method === 'OPTIONS' && url.pathname === postPath) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // Root endpoint
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'Target Authentication MCP Server',
        version: '1.0.0',
        description: 'Target customer authentication component for ChatGPT',
        endpoints: {
          mcp: ssePath,
          messages: postPath
        }
      }));
      return;
    }

    // SSE endpoint
    if (req.method === 'GET' && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    // POST messages endpoint (SSE only, no stateless)
    if (req.method === 'POST' && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    res.writeHead(404).end('Not Found');
  }
);

httpServer.on('clientError', (err, socket) => {
  console.error('HTTP client error', err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

httpServer.listen(port, () => {
  console.log(`\n🎯 Target Authentication MCP Server`);
  console.log(`📍 Running on: http://localhost:${port}`);
  console.log(`\nEndpoints:`);
  console.log(`  🔌 MCP: http://localhost:${port}${ssePath}`);
  console.log(`  📨 Messages: http://localhost:${port}${postPath}`);
  console.log(`\nReady to connect to ChatGPT! 🚀\n`);
});

