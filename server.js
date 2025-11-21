import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory session storage (use Redis/DB in production)
const sessions = new Map();

// Get the base URL dynamically
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

// MCP Server Metadata Endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    "name": "Target Team Member Authentication",
    "description": "Target team member authentication and profile access",
    "version": "1.0.0",
    "capabilities": {
      "tools": true,
      "ui": true
    },
    "oauth": {
      "enabled": false
    }
  });
});

// MCP Tools Definition
app.post('/mcp/tools/list', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    tools: [
      {
        name: "authenticate_user",
        description: "Display Target team member authentication form",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Optional message to show to the user"
            }
          }
        },
        ui: {
          type: "component",
          componentUrl: `${baseUrl}/components/auth.html`
        }
      },
      {
        name: "get_user_profile",
        description: "Get the authenticated Target team member's profile information",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "logout_user",
        description: "Log out the current Target team member",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  });
});

// MCP Tool Execution
app.post('/mcp/tools/call', (req, res) => {
  const { name, arguments: args, sessionId } = req.body;
  const baseUrl = getBaseUrl(req);
  const currentSessionId = sessionId || generateSessionId();

  switch (name) {
    case "authenticate_user":
      // Return component metadata
      res.json({
        content: [
          {
            type: "component",
            componentUrl: `${baseUrl}/components/auth.html`,
            data: {
              message: args?.message || "Sign in with your Target credentials",
              sessionId: currentSessionId
            }
          }
        ]
      });
      break;

    case "get_user_profile":
      const session = sessions.get(sessionId);
      if (session && session.user) {
        res.json({
          content: [
            {
              type: "text",
              text: `✓ Authenticated as ${session.user.name}\nEmail: ${session.user.email}\nEmployee ID: ${session.user.employeeId}\nDepartment: ${session.user.department}`
            }
          ]
        });
      } else {
        res.json({
          content: [
            {
              type: "text",
              text: "Not authenticated. Please sign in first."
            }
          ],
          isError: true
        });
      }
      break;

    case "logout_user":
      if (sessionId && sessions.has(sessionId)) {
        const userName = sessions.get(sessionId).user.name;
        sessions.delete(sessionId);
        res.json({
          content: [
            {
              type: "text",
              text: `${userName} has been signed out successfully.`
            }
          ]
        });
      } else {
        res.json({
          content: [
            {
              type: "text",
              text: "No active session found."
            }
          ]
        });
      }
      break;

    default:
      res.status(404).json({ error: "Tool not found" });
  }
});

// Authentication endpoint (called by component)
// Always authenticates as Lauren Bailey regardless of input
app.post('/api/authenticate', (req, res) => {
  const { email, password, sessionId } = req.body;

  // Accept any email/password combination
  if (email && password) {
    const user = {
      id: "TGT-001234",
      email: "lauren.bailey@target.com",
      name: "Lauren Bailey",
      employeeId: "TGT-001234",
      department: "Store Operations",
      storeNumber: "T-2847",
      position: "Team Lead",
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

// Session validation endpoint
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

// OpenAPI Schema for Custom GPT Actions
app.get('/openapi.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    "openapi": "3.1.0",
    "info": {
      "title": "Target Team Member Authentication API",
      "description": "API for Target team member authentication and profile management. This allows ChatGPT to authenticate users and retrieve their profile information.",
      "version": "1.0.0"
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
          "summary": "Authenticate a Target team member",
          "description": "Authenticates a Target team member and returns their profile. Always returns Lauren Bailey's profile for demo purposes.",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "email": {
                      "type": "string",
                      "description": "Team member's Target email address"
                    },
                    "password": {
                      "type": "string",
                      "description": "Team member's password"
                    }
                  },
                  "required": ["email", "password"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully authenticated",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "user": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "name": {
                            "type": "string"
                          },
                          "email": {
                            "type": "string"
                          },
                          "employeeId": {
                            "type": "string"
                          },
                          "department": {
                            "type": "string"
                          },
                          "storeNumber": {
                            "type": "string"
                          },
                          "position": {
                            "type": "string"
                          }
                        }
                      },
                      "sessionId": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/actions/profile": {
        "get": {
          "operationId": "getUserProfile",
          "summary": "Get authenticated user's profile",
          "description": "Returns the currently authenticated Target team member's profile information",
          "parameters": [
            {
              "name": "sessionId",
              "in": "query",
              "required": true,
              "schema": {
                "type": "string"
              },
              "description": "Session ID from authentication"
            }
          ],
          "responses": {
            "200": {
              "description": "User profile retrieved successfully",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "user": {
                        "type": "object",
                        "properties": {
                          "name": {
                            "type": "string"
                          },
                          "email": {
                            "type": "string"
                          },
                          "employeeId": {
                            "type": "string"
                          },
                          "department": {
                            "type": "string"
                          },
                          "storeNumber": {
                            "type": "string"
                          },
                          "position": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/actions/logout": {
        "post": {
          "operationId": "logoutUser",
          "summary": "Log out the current user",
          "description": "Ends the current Target team member's session",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "sessionId": {
                      "type": "string",
                      "description": "Session ID to terminate"
                    }
                  },
                  "required": ["sessionId"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully logged out",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "message": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

// GPT Actions Endpoints (simplified API for Custom GPT)
app.post('/api/actions/authenticate', (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const sessionId = generateSessionId();
    const user = {
      id: "TGT-001234",
      email: "lauren.bailey@target.com",
      name: "Lauren Bailey",
      employeeId: "TGT-001234",
      department: "Store Operations",
      storeNumber: "T-2847",
      position: "Team Lead",
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

// Helper functions
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Target Authentication MCP Server`);
  console.log(`\n📍 Server running on port ${PORT}`);
  
  if (isProduction) {
    console.log(`\n🌐 Production Mode`);
    console.log(`   Access your server at your Heroku URL`);
  } else {
    console.log(`\n🔧 Development Mode`);
    console.log(`\n📋 To connect to ChatGPT:`);
    console.log(`   1. Open ChatGPT`);
    console.log(`   2. Enable Developer Mode in settings`);
    console.log(`   3. Create new app with URL: http://localhost:${PORT}`);
    console.log(`\n🔗 Endpoints:`);
    console.log(`   MCP Metadata: http://localhost:${PORT}/.well-known/mcp.json`);
    console.log(`   OpenAPI Schema: http://localhost:${PORT}/openapi.json`);
    console.log(`   Auth Component: http://localhost:${PORT}/components/auth.html`);
  }
  
  console.log(`\n✅ Ready to authenticate Target team members\n`);
});

