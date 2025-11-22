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
          name: 'create-target-session',
          description: 'Create a new Target authentication session. Call this FIRST to get a session ID before authenticating.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
          title: 'Create Target Session',
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: true
          }
        },
        {
          name: widget.id,
          description: 'Authenticate a Target customer. REQUIRES a sessionId from create-target-session. Will show login flow if not authenticated, or confirmation if already authenticated.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'The session ID from create-target-session'
              }
            },
            required: ['sessionId'],
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
      // Handle create-target-session
      if (request.params.name === 'create-target-session') {
        const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
        
        // Create new unauthenticated session
        authSessions.set(sessionId, {
          authenticated: false,
          email: null,
          name: null,
          createdAt: Date.now()
        });
        
        console.log(`Created new session: ${sessionId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: `Session created: ${sessionId}. Use this session ID with authenticate-target.`
            }
          ],
          structuredContent: {
            sessionId: sessionId
          }
        };
      }
      
      // Handle authenticate-target
      if (request.params.name === widget.id) {
        const args = request.params.arguments || {};
        const sessionId = args.sessionId;
        
        if (!sessionId) {
          throw new Error('sessionId is required. Call create-target-session first to get a session ID.');
        }
        
        // Get or create session
        let session = authSessions.get(sessionId);
        if (!session) {
          // Create session if it doesn't exist
          session = {
            authenticated: false,
            email: null,
            name: null,
            createdAt: Date.now()
          };
          authSessions.set(sessionId, session);
        }
        
        console.log(`Auth check for session ${sessionId}:`, session);
        
        return {
          content: [
            {
              type: 'text',
              text: session.authenticated 
                ? `Authentication confirmed. ${session.name} is signed in.`
                : widget.responseText
            }
          ],
          structuredContent: {
            sessionId: sessionId,
            authenticated: session.authenticated,
            email: session.email,
            name: session.name
          },
          _meta: widgetInvocationMeta(widget)
        };
      }
      
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
  );

  return server;
}

// Session management for SSE connections
const sseConnections = new Map();

// Authentication session tracking
const authSessions = new Map(); // sessionId -> { authenticated: boolean, email: string, name: string }

const ssePath = '/mcp';
const postPath = '/mcp/messages';

// Handle SSE request
async function handleSseRequest(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = createPizzazServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sseConnections.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sseConnections.delete(sessionId);
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

  const connection = sseConnections.get(sessionId);

  if (!connection) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await connection.transport.handlePostMessage(req, res);
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

    // Session authentication endpoint (for widget to mark session as authenticated)
    if (req.method === 'POST' && url.pathname === '/api/session/authenticate') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'content-type');
      res.setHeader('Content-Type', 'application/json');
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { sessionId, email, name } = data;
          
          if (!sessionId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'sessionId required' }));
            return;
          }
          
          const session = authSessions.get(sessionId);
          if (!session) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
          }
          
          // Mark session as authenticated
          session.authenticated = true;
          session.email = email || null;
          session.name = name || 'Lauren Bailey';
          authSessions.set(sessionId, session);
          
          console.log(`Session ${sessionId} marked as authenticated:`, session);
          
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, session }));
        } catch (error) {
          console.error('Error authenticating session:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // CORS preflight for session endpoint
    if (req.method === 'OPTIONS' && url.pathname === '/api/session/authenticate') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
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

