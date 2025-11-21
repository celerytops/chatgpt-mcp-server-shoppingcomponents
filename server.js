#!/usr/bin/env node

/**
 * Target Customer Authentication MCP Server
 * Following the official OpenAI Apps SDK patterns
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// In-memory session storage
const sessions = new Map();
const mcpSessions = new Map();

// Helper functions
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function readWidgetHtml(componentName) {
  const htmlPath = join(__dirname, 'public', 'components', `${componentName}.html`);
  
  if (!existsSync(htmlPath)) {
    throw new Error(`Widget HTML for "${componentName}" not found at ${htmlPath}`);
  }
  
  return readFileSync(htmlPath, 'utf8');
}

// Demo customer data
const demoUser = {
  id: 'cust_lauren_bailey',
  name: 'Lauren Bailey',
  email: 'lauren.bailey@example.com',
  phone: '(555) 123-4567',
  rewardsMember: true,
  circleStatus: 'Gold',
  lifetimeSavings: '$847.32',
  recentOrders: 3,
  favoriteStore: 'Target Minneapolis North',
  memberSince: '2019-03-15'
};

// Widget configuration
const AUTH_WIDGET = {
  id: 'authenticate_user',
  title: 'Target Customer Sign In',
  templateUri: 'ui://widget/target-auth.html',
  invoking: 'Opening Target sign-in',
  invoked: 'Sign-in form ready',
  html: readWidgetHtml('auth')
};

// Widget metadata helpers
function widgetDescriptorMeta(widget) {
  return {
    'openai/outputTemplate': widget.templateUri,
    'openai/toolInvocation/invoking': widget.invoking,
    'openai/toolInvocation/invoked': widget.invoked,
    'openai/widgetAccessible': true,
    'openai/resultCanProduceWidget': true
  };
}

function widgetInvocationMeta(widget) {
  return {
    'openai/toolInvocation/invoking': widget.invoking,
    'openai/toolInvocation/invoked': widget.invoked
  };
}

/**
 * Create MCP Server with proper resource and tool handlers
 */
function createTargetAuthServer() {
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

  // List available resources (widgets)
  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request) => ({
      resources: [
        {
          uri: AUTH_WIDGET.templateUri,
          name: AUTH_WIDGET.title,
          description: `${AUTH_WIDGET.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(AUTH_WIDGET)
        }
      ]
    })
  );

  // Read resource content (serve widget HTML)
  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      if (request.params.uri === AUTH_WIDGET.templateUri) {
        return {
          contents: [
            {
              uri: AUTH_WIDGET.templateUri,
              mimeType: 'text/html+skybridge',
              text: AUTH_WIDGET.html,
              _meta: widgetDescriptorMeta(AUTH_WIDGET)
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
          uriTemplate: AUTH_WIDGET.templateUri,
          name: AUTH_WIDGET.title,
          description: `${AUTH_WIDGET.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(AUTH_WIDGET)
        }
      ]
    })
  );

  // List available tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request) => ({
      tools: [
        {
          name: 'authenticate_user',
          description: 'Display Target customer authentication form. Shows a beautiful Target-branded login component where customers can sign in.',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Optional message to show to the user'
              }
            },
            additionalProperties: false
          },
          title: AUTH_WIDGET.title,
          _meta: widgetDescriptorMeta(AUTH_WIDGET),
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: false
          }
        },
        {
          name: 'get_user_profile',
          description: 'Get the authenticated Target customer\'s profile information including Circle rewards status.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'Session ID from authentication'
              }
            },
            required: ['sessionId'],
            additionalProperties: false
          },
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: true
          }
        },
        {
          name: 'logout_user',
          description: 'Log out the current Target customer and end their session.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'Session ID to terminate'
              }
            },
            required: ['sessionId'],
            additionalProperties: false
          },
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: false
          }
        }
      ]
    })
  );

  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};

      switch (toolName) {
        case 'authenticate_user': {
          const sessionId = generateSessionId();
          
          return {
            content: [
              {
                type: 'text',
                text: 'Please sign in to your Target account using the form below.'
              }
            ],
            structuredContent: {
              sessionId: sessionId,
              message: args.message || 'Sign in to your Target account'
            },
            _meta: widgetInvocationMeta(AUTH_WIDGET)
          };
        }

        case 'get_user_profile': {
          const session = sessions.get(args.sessionId);
          
          if (session && session.user) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    authenticated: true,
                    user: session.user,
                    message: `Authenticated as ${session.user.name}`
                  }, null, 2)
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    authenticated: false,
                    error: 'Not authenticated. Please sign in first.',
                    sessionId: args.sessionId
                  }, null, 2)
                }
              ]
            };
          }
        }

        case 'logout_user': {
          if (args.sessionId && sessions.has(args.sessionId)) {
            const userName = sessions.get(args.sessionId).user.name;
            sessions.delete(args.sessionId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: `${userName} has been signed out successfully.`
                  }, null, 2)
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: 'No active session found.'
                  }, null, 2)
                }
              ]
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    }
  );

  return server;
}

/**
 * Express App Setup
 */
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  res.json({
    name: 'Target Customer Authentication MCP Server',
    version: '1.0.0',
    description: 'MCP server for Target customer authentication with UI components',
    endpoints: {
      mcp: `${baseUrl}/mcp`,
      openapi: `${baseUrl}/openapi.json`,
      privacy: `${baseUrl}/privacy`
    },
    capabilities: ['resources', 'tools', 'authentication']
  });
});

// MCP SSE endpoint (GET /mcp)
app.get('/mcp', async (req, res) => {
  console.log('New SSE connection request');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  
  const server = createTargetAuthServer();
  const transport = new SSEServerTransport('/mcp/messages', res);
  const sessionId = transport.sessionId;
  
  mcpSessions.set(sessionId, { server, transport });
  
  transport.onclose = async () => {
    console.log(`SSE session ${sessionId} closed`);
    mcpSessions.delete(sessionId);
    await server.close();
  };
  
  transport.onerror = (error) => {
    console.error('SSE transport error', error);
  };
  
  try {
    await server.connect(transport);
    console.log(`SSE session ${sessionId} connected`);
  } catch (error) {
    console.error('Failed to start SSE session', error);
    mcpSessions.delete(sessionId);
    if (!res.headersSent) {
      res.status(500).end('Failed to establish SSE connection');
    }
  }
});

// MCP message endpoint (POST /mcp/messages)
app.post('/mcp/messages', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  
  const sessionId = req.query.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId query parameter' });
  }
  
  const session = mcpSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Unknown session' });
  }
  
  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process message', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

// OPTIONS handler for CORS
app.options(['/mcp', '/mcp/messages'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.status(204).end();
});

// Authentication API endpoint (for the component to call)
app.post('/api/auth/login', (req, res) => {
  const { email, password, sessionId } = req.body;
  
  // Demo: Accept any email/password
  sessions.set(sessionId, {
    user: demoUser,
    authenticatedAt: new Date().toISOString()
  });
  
  res.json({
    success: true,
    user: demoUser,
    sessionId: sessionId
  });
});

// OpenAPI schema for Custom GPT Actions
app.get('/openapi.json', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'Target Customer Authentication API',
      version: '1.0.0',
      description: 'API for Target customer authentication and profile management'
    },
    servers: [
      {
        url: baseUrl
      }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          operationId: 'authenticateUser',
          summary: 'Authenticate a Target customer',
          description: 'Authenticate a customer with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      description: 'Customer email address'
                    },
                    password: {
                      type: 'string',
                      description: 'Customer password'
                    },
                    sessionId: {
                      type: 'string',
                      description: 'Session ID'
                    }
                  },
                  required: ['email', 'password', 'sessionId']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { type: 'object' },
                      sessionId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    'x-privacy-policy-url': `${baseUrl}/privacy`
  });
});

// Privacy policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Target Auth - Privacy Policy</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.6;
          color: #333;
        }
        h1 { color: #cc0000; }
        h2 { color: #444; margin-top: 30px; }
        .notice { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> November 21, 2025</p>
      
      <div class="notice">
        <strong>⚠️ Demo Application:</strong> This is a demonstration application. No real authentication is performed.
      </div>
      
      <h2>Data Collection</h2>
      <p>This demo application:</p>
      <ul>
        <li>Does not collect or store any real customer data</li>
        <li>Accepts any email/password combination for demonstration purposes</li>
        <li>Returns a demo profile for "Lauren Bailey" regardless of input</li>
        <li>Stores session data in memory only (cleared on server restart)</li>
      </ul>
      
      <h2>Data Storage</h2>
      <p>All data is stored temporarily in server memory and is automatically deleted when:</p>
      <ul>
        <li>The session expires</li>
        <li>The server restarts</li>
        <li>You explicitly log out</li>
      </ul>
      
      <h2>Third-Party Services</h2>
      <p>This application integrates with:</p>
      <ul>
        <li><strong>ChatGPT:</strong> via the OpenAI Apps SDK and Model Context Protocol</li>
        <li><strong>Heroku:</strong> for hosting the demo server</li>
      </ul>
      
      <h2>Contact</h2>
      <p>For questions about this privacy policy, please contact the application administrator.</p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎯 Target Customer Authentication MCP Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  🔌 MCP: http://localhost:${PORT}/mcp`);
  console.log(`  📋 OpenAPI: http://localhost:${PORT}/openapi.json`);
  console.log(`  🔒 Privacy: http://localhost:${PORT}/privacy`);
  console.log(`\nReady to connect to ChatGPT! 🚀\n`);
});
