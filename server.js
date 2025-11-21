#!/usr/bin/env node

/**
 * MCP Server for Target Customer Authentication
 * 
 * Provides both MCP (Model Context Protocol) and REST API endpoints
 * for customer authentication and profile management.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// In-memory session storage
const sessions = new Map();

// Helper functions
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

/**
 * MCP Server Implementation
 */
class TargetAuthMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'target-customer-auth',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.handleToolCall(request.params.name, request.params.arguments);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
              }, null, 2)
            }
          ]
        };
      }
    });
  }

  /**
   * Define all available MCP tools
   */
  getTools() {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    
    return [
      {
        name: 'authenticate_user',
        description: 'Display Target customer authentication form. This shows a beautiful Target-branded login component.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Optional message to show to the user'
            }
          },
          additionalProperties: false
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
        }
      }
    ];
  }

  /**
   * Handle tool calls
   */
  async handleToolCall(toolName, args) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    let result;

    switch (toolName) {
      case 'authenticate_user':
        const sessionId = generateSessionId();
        result = {
          type: 'component',
          componentUrl: `${baseUrl}/components/auth.html`,
          sessionId: sessionId,
          message: args?.message || 'Sign in to your Target account',
          instructions: 'A login form will be displayed. After the user authenticates, use get_user_profile with the sessionId to retrieve their information.'
        };
        break;

      case 'get_user_profile':
        const session = sessions.get(args.sessionId);
        if (session && session.user) {
          result = {
            authenticated: true,
            user: session.user,
            message: `Authenticated as ${session.user.name}`
          };
        } else {
          result = {
            authenticated: false,
            error: 'Not authenticated. Please sign in first.',
            sessionId: args.sessionId
          };
        }
        break;

      case 'logout_user':
        if (args.sessionId && sessions.has(args.sessionId)) {
          const userName = sessions.get(args.sessionId).user.name;
          sessions.delete(args.sessionId);
          result = {
            success: true,
            message: `${userName} has been signed out successfully.`
          };
        } else {
          result = {
            success: false,
            message: 'No active session found.'
          };
        }
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Create a new MCP Server instance for a connection
   */
  createServerInstance() {
    const server = new Server(
      {
        name: 'target-customer-auth',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup handlers for this instance
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.handleToolCall(request.params.name, request.params.arguments);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
              }, null, 2)
            }
          ]
        };
      }
    });

    return server;
  }

  /**
   * Start HTTP server with MCP and REST endpoints
   */
  async startHttp(port = 3000) {
    const app = express();
    
    // Enable CORS
    app.use(cors());
    app.use(express.json());
    app.use(express.static('public'));

    // Root endpoint
    app.get('/', (req, res) => {
      const baseUrl = getBaseUrl(req);
      res.json({
        name: 'Target Customer Authentication',
        version: '1.0.0',
        description: 'MCP server for Target customer authentication',
        endpoints: {
          mcp: `${baseUrl}/mcp`,
          openapi_schema: `${baseUrl}/openapi.json`,
          privacy_policy: `${baseUrl}/privacy`,
          auth_component: `${baseUrl}/components/auth.html`
        }
      });
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'target-customer-auth', version: '1.0.0' });
    });

    // Store active MCP sessions
    const mcpSessions = new Map();

    // MCP endpoint - POST for JSON-RPC
    app.post('/mcp', async (req, res) => {
      const baseUrl = getBaseUrl(req);
      
      console.log(`MCP POST request - Method: ${req.body?.method}`);
      
      try {
        const jsonrpcRequest = req.body;
        
        // Validate JSON-RPC request
        if (!jsonrpcRequest || jsonrpcRequest.jsonrpc !== '2.0') {
          return res.status(200).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: Not a valid JSON-RPC 2.0 request'
            },
            id: null
          });
        }

        let result;
        
        switch (jsonrpcRequest.method) {
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'target-customer-auth',
                version: '1.0.0'
              }
            };
            break;

          case 'tools/list':
            result = {
              tools: this.getTools()
            };
            break;

          case 'tools/call':
            const toolName = jsonrpcRequest.params?.name;
            const toolArgs = jsonrpcRequest.params?.arguments || {};
            
            if (!toolName) {
              throw new Error('Tool name is required');
            }

            // Set base URL for tool execution
            process.env.BASE_URL = baseUrl;
            
            const toolResult = await this.handleToolCall(toolName, toolArgs);
            result = toolResult;
            break;

          default:
            return res.status(200).json({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: `Method not found: ${jsonrpcRequest.method}`
              },
              id: jsonrpcRequest.id
            });
        }

        // Send successful response
        res.status(200).json({
          jsonrpc: '2.0',
          result: result,
          id: jsonrpcRequest.id
        });

      } catch (error) {
        console.error('Error handling JSON-RPC request:', error);
        
        res.status(200).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error'
          },
          id: req.body?.id || null
        });
      }
    });

    // MCP endpoint - GET for SSE
    app.get('/mcp', async (req, res) => {
      console.log('MCP GET request (SSE) - establishing connection');
      
      try {
        const sessionId = Math.random().toString(36).substring(7);
        const serverInstance = this.createServerInstance();
        mcpSessions.set(sessionId, serverInstance);
        
        const transport = new SSEServerTransport('/mcp', res);
        await serverInstance.connect(transport);
        
        req.on('close', () => {
          console.log(`Session ${sessionId}: Connection closed`);
          mcpSessions.delete(sessionId);
        });
      } catch (error) {
        console.error('Error establishing SSE connection:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
      }
    });

    // REST API Endpoints

    // Authentication endpoint (called by component)
    app.post('/api/authenticate', (req, res) => {
      const { email, password, sessionId } = req.body;

      if (email && password) {
        const user = {
          id: "CUST-89234",
          email: "lauren.bailey@gmail.com",
          name: "Lauren Bailey",
          phone: "(555) 123-4567",
          rewardsMember: "Circle Member",
          memberSince: "2019",
          accountStatus: "Active",
          authenticatedAt: new Date().toISOString()
        };

        sessions.set(sessionId, { user });

        res.json({
          success: true,
          user
        });
      } else {
        res.status(401).json({
          success: false,
          error: "Please enter both email and password."
        });
      }
    });

    // Session validation
    app.get('/api/session/:sessionId', (req, res) => {
      const session = sessions.get(req.params.sessionId);
      if (session && session.user) {
        res.json({
          authenticated: true,
          user: session.user
        });
      } else {
        res.json({
          authenticated: false
        });
      }
    });

    // REST API for GPT Actions
    app.post('/api/actions/authenticate', (req, res) => {
      const { email, password } = req.body;

      if (email && password) {
        const sessionId = generateSessionId();
        const user = {
          id: "CUST-89234",
          email: "lauren.bailey@gmail.com",
          name: "Lauren Bailey",
          phone: "(555) 123-4567",
          rewardsMember: "Circle Member",
          memberSince: "2019",
          accountStatus: "Active",
          authenticatedAt: new Date().toISOString()
        };

        sessions.set(sessionId, { user });

        res.json({
          success: true,
          user,
          sessionId,
          message: `Successfully authenticated as ${user.name}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }
    });

    app.get('/api/actions/profile', (req, res) => {
      const sessionId = req.query.sessionId;
      const session = sessions.get(sessionId);

      if (session && session.user) {
        res.json({
          user: session.user
        });
      } else {
        res.status(401).json({
          error: "Not authenticated. Please sign in first."
        });
      }
    });

    app.post('/api/actions/logout', (req, res) => {
      const { sessionId } = req.body;

      if (sessionId && sessions.has(sessionId)) {
        const userName = sessions.get(sessionId).user.name;
        sessions.delete(sessionId);
        res.json({
          success: true,
          message: `${userName} has been signed out successfully.`
        });
      } else {
        res.json({
          success: false,
          message: "No active session found."
        });
      }
    });

    // OpenAPI Schema
    app.get('/openapi.json', (req, res) => {
      const baseUrl = getBaseUrl(req);
      res.json({
        "openapi": "3.1.0",
        "info": {
          "title": "Target Customer Authentication API",
          "description": "API for Target customer authentication and profile management.",
          "version": "1.0.0",
          "x-privacy-policy-url": `${baseUrl}/privacy`
        },
        "servers": [
          {
            "url": baseUrl,
            "description": "Target Authentication Server"
          }
        ],
        "paths": {
          "/api/actions/authenticate": {
            "post": {
              "operationId": "authenticateUser",
              "summary": "Authenticate a Target customer",
              "description": "Authenticates a Target customer and returns their profile.",
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "email": {
                          "type": "string",
                          "description": "Customer's email address"
                        },
                        "password": {
                          "type": "string",
                          "description": "Customer's password"
                        }
                      },
                      "required": ["email", "password"]
                    }
                  }
                }
              },
              "responses": {
                "200": {
                  "description": "Successfully authenticated"
                }
              }
            }
          },
          "/api/actions/profile": {
            "get": {
              "operationId": "getUserProfile",
              "summary": "Get authenticated user's profile",
              "description": "Returns the currently authenticated Target customer's profile",
              "parameters": [
                {
                  "name": "sessionId",
                  "in": "query",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                }
              ],
              "responses": {
                "200": {
                  "description": "User profile retrieved successfully"
                }
              }
            }
          },
          "/api/actions/logout": {
            "post": {
              "operationId": "logoutUser",
              "summary": "Log out the current user",
              "description": "Ends the current Target customer's session",
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "sessionId": {
                          "type": "string"
                        }
                      },
                      "required": ["sessionId"]
                    }
                  }
                }
              },
              "responses": {
                "200": {
                  "description": "Successfully logged out"
                }
              }
            }
          }
        }
      });
    });

    // Privacy Policy
    app.get('/privacy', (req, res) => {
      res.type('html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Target Customer Authentication</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #cc0000;
      border-bottom: 3px solid #cc0000;
      padding-bottom: 10px;
    }
    h2 {
      color: #cc0000;
      margin-top: 30px;
    }
    .last-updated {
      color: #666;
      font-style: italic;
    }
    .demo-notice {
      background: #fff3cd;
      border-left: 4px solid #cc0000;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="last-updated">Last Updated: November 21, 2024</p>
  
  <div class="demo-notice">
    <strong>Demo Application Notice:</strong> This is a demonstration application. 
    All authentication returns the same test user profile (Lauren Bailey) regardless 
    of credentials provided. No real user data is collected or stored.
  </div>

  <h2>1. Information We Collect</h2>
  <p>This application is a demonstration component and does not collect, store, or process real personal information.</p>

  <h2>2. Data Storage</h2>
  <ul>
    <li><strong>No Persistent Storage:</strong> No user data is written to databases</li>
    <li><strong>Session Data:</strong> Temporary session identifiers stored in memory only</li>
    <li><strong>Automatic Deletion:</strong> All session data cleared when server restarts</li>
  </ul>

  <h2>3. Security</h2>
  <p>All communications are encrypted via HTTPS.</p>

  <p style="text-align: center; color: #666; font-size: 14px; margin-top: 40px;">
    Target Customer Authentication Demo<br>
    Demonstration Application Only
  </p>
</body>
</html>
      `);
    });

    // Start server
    app.listen(port, () => {
      console.log(`\n🚀 Target Customer Authentication MCP Server`);
      console.log(`\n📍 Server running on port ${port}`);
      
      if (isProduction) {
        console.log(`\n🌐 Production Mode`);
      } else {
        console.log(`\n🔧 Development Mode`);
        console.log(`\n🔗 Endpoints:`);
        console.log(`   Root: http://localhost:${port}`);
        console.log(`   MCP: http://localhost:${port}/mcp`);
        console.log(`   OpenAPI: http://localhost:${port}/openapi.json`);
        console.log(`   Auth UI: http://localhost:${port}/components/auth.html`);
      }
      
      console.log(`\n✅ Ready to authenticate Target customers\n`);
    });
  }

  async start() {
    const port = parseInt(process.env.PORT || '3000', 10);
    await this.startHttp(port);
  }
}

// Start the server
const server = new TargetAuthMCPServer();
server.start().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
