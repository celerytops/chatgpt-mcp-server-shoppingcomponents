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

// Root endpoint - redirect to MCP metadata
app.get('/', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    name: "Target Customer Authentication",
    version: "1.0.0",
    description: "MCP server for Target customer authentication",
    endpoints: {
      mcp_metadata: `${baseUrl}/.well-known/mcp.json`,
      openapi_schema: `${baseUrl}/openapi.json`,
      privacy_policy: `${baseUrl}/privacy`,
      auth_component: `${baseUrl}/components/auth.html`
    }
  });
});

// MCP metadata helper
function getMCPMetadata() {
  return {
    "name": "Target Customer Authentication",
    "description": "Target customer authentication and profile access",
    "version": "1.0.0",
    "capabilities": {
      "tools": true,
      "ui": true
    },
    "oauth": {
      "enabled": false
    }
  };
}

// MCP Server Metadata Endpoint (standard location)
app.get('/.well-known/mcp.json', (req, res) => {
  res.json(getMCPMetadata());
});

// MCP Server Metadata Endpoint (alternative /mcp location)
app.get('/mcp', (req, res) => {
  res.json(getMCPMetadata());
});

// MCP Tools Definition
app.post('/mcp/tools/list', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    tools: [
      {
        name: "authenticate_user",
        description: "Display Target customer authentication form",
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
        description: "Get the authenticated Target customer's profile information",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "logout_user",
        description: "Log out the current Target customer",
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
              message: args?.message || "Sign in to your Target account",
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
              text: `✓ Authenticated as ${session.user.name}\nEmail: ${session.user.email}\nCircle Rewards: ${session.user.rewardsMember}\nMember Since: ${session.user.memberSince}`
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

// Privacy Policy page (required for Custom GPT Actions)
app.get('/privacy', (req, res) => {
  res.send(`
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
  <p>This application is a demonstration component and does not collect, store, or process real personal information. When you use the authentication feature:</p>
  <ul>
    <li>Email addresses and passwords entered are not stored</li>
    <li>All authentication requests return a demo user profile</li>
    <li>Session data is stored temporarily in memory and is cleared when the server restarts</li>
    <li>No persistent storage or databases are used</li>
  </ul>

  <h2>2. How We Use Information</h2>
  <p>The demo application uses provided information solely to:</p>
  <ul>
    <li>Demonstrate authentication flow in ChatGPT</li>
    <li>Return a consistent test user profile for development and testing purposes</li>
    <li>Maintain temporary session state during your interaction</li>
  </ul>

  <h2>3. Data Storage and Security</h2>
  <ul>
    <li><strong>No Persistent Storage:</strong> No user data is written to databases or permanent storage</li>
    <li><strong>Session Data:</strong> Temporary session identifiers are stored in memory only</li>
    <li><strong>Automatic Deletion:</strong> All session data is automatically cleared when the server restarts</li>
    <li><strong>HTTPS:</strong> All communications are encrypted via HTTPS</li>
  </ul>

  <h2>4. Third-Party Services</h2>
  <p>This application is hosted on Heroku and integrates with OpenAI's ChatGPT. Please review their privacy policies:</p>
  <ul>
    <li><a href="https://www.heroku.com/policy/security" target="_blank">Heroku Security Policy</a></li>
    <li><a href="https://openai.com/privacy/" target="_blank">OpenAI Privacy Policy</a></li>
  </ul>

  <h2>5. Cookies and Tracking</h2>
  <p>This application does not use cookies or tracking technologies. Session management is handled via session IDs passed in API requests.</p>

  <h2>6. Data Sharing</h2>
  <p>We do not share, sell, or distribute any data. This is a closed demonstration application that:</p>
  <ul>
    <li>Does not integrate with external marketing services</li>
    <li>Does not share data with third parties</li>
    <li>Does not use analytics or tracking services</li>
  </ul>

  <h2>7. User Rights</h2>
  <p>Since no real personal data is collected or stored, there is no data to access, modify, or delete. Each interaction is stateless beyond the temporary session.</p>

  <h2>8. Children's Privacy</h2>
  <p>This application is designed for demonstration purposes and is not directed at children under 13. No information is collected from users of any age.</p>

  <h2>9. Changes to This Policy</h2>
  <p>We may update this privacy policy to reflect changes in our practices or for legal reasons. The "Last Updated" date at the top indicates when changes were made.</p>

  <h2>10. Contact Information</h2>
  <p>For questions about this privacy policy or the demo application, please contact your system administrator.</p>

  <h2>11. Demonstration Application Disclaimer</h2>
  <p><strong>Important:</strong> This is a demonstration and testing application only. It should not be used for:</p>
  <ul>
    <li>Real authentication or authorization</li>
    <li>Production environments</li>
    <li>Storing or processing real user credentials</li>
    <li>Any purpose requiring actual data security</li>
  </ul>
  <p>All authentication in this demo returns the same test user profile regardless of input. No real authentication is performed.</p>

  <hr style="margin: 40px 0; border: none; border-top: 1px solid #ccc;">
  
  <p style="text-align: center; color: #666; font-size: 14px;">
    Target Customer Authentication Demo<br>
    Demonstration Application Only
  </p>
</body>
</html>
  `);
});

// OpenAPI Schema for Custom GPT Actions
app.get('/openapi.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    "openapi": "3.1.0",
    "info": {
      "title": "Target Customer Authentication API",
      "description": "API for Target customer authentication and profile management. This allows ChatGPT to authenticate customers and retrieve their profile information. This is a demonstration application that always returns the same test user profile.",
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
          "description": "Authenticates a Target customer and returns their profile. Always returns Lauren Bailey's profile for demo purposes.",
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
          "description": "Returns the currently authenticated Target customer's profile information",
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
          "description": "Ends the current Target customer's session",
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

// Helper functions
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Target Customer Authentication MCP Server`);
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
  
  console.log(`\n✅ Ready to authenticate Target customers\n`);
});

