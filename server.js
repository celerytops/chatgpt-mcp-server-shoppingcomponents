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
          description: 'STEP 1: Create a new Target authentication session. You MUST call this FIRST to get a sessionId. Returns a sessionId that must be passed to authenticate-target.',
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
          description: 'STEP 2: Show Target authentication UI. REQUIRES sessionId from create-target-session (STEP 1). DO NOT call this until you have a sessionId from create-target-session. After user completes auth, use get-target-auth-status to check status.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'REQUIRED: The session ID from create-target-session. This parameter is mandatory.'
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
        },
        {
          name: 'get-target-auth-status',
          description: 'Check authentication status and retrieve user profile. Call this AFTER the user has clicked the authentication link and says they have signed in. Returns authenticated customer name and email. No UI is shown.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'The session ID to check'
              }
            },
            required: ['sessionId'],
            additionalProperties: false
          },
          title: 'Get Target Auth Status',
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: true
          }
        }
      ]
    })
  );

  // Call tool
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      try {
        console.log(`Tool called: ${request.params.name}`, request.params.arguments);
        
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
          
          console.log(`✓ Created new auth session: ${sessionId}`);
          console.log(`  Total auth sessions: ${authSessions.size}`);
          
          // Clean up old sessions (older than 10 minutes)
          const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
          for (const [sid, sess] of authSessions.entries()) {
            if (sess.createdAt < tenMinutesAgo) {
              authSessions.delete(sid);
              console.log(`  Cleaned up old session: ${sid}`);
            }
          }
          
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
      
      // Handle authenticate-target (shows UI)
      if (request.params.name === widget.id) {
        const args = request.params.arguments || {};
        const sessionId = args.sessionId;
        
        // REQUIRE sessionId - must call create-target-session first
        if (!sessionId) {
          throw new Error('sessionId is REQUIRED. You must call create-target-session FIRST to get a sessionId, then pass it to authenticate-target.');
        }
        
        // Get session (should already exist from create-target-session)
        let session = authSessions.get(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found. Call create-target-session to create a valid session first.`);
        }
        
        console.log(`Showing auth UI for session ${sessionId}:`, session);
        
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
      
      // Handle get-target-auth-status (NO UI, just data)
      if (request.params.name === 'get-target-auth-status') {
        const args = request.params.arguments || {};
        const sessionId = args.sessionId;
        
        if (!sessionId) {
          throw new Error('sessionId is required.');
        }
        
        const session = authSessions.get(sessionId);
        
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: `Session ${sessionId} not found. Create a session with create-target-session first.`
              }
            ]
          };
        }
        
        console.log(`Getting auth status for session ${sessionId}:`, session);
        
        return {
          content: [
            {
              type: 'text',
              text: session.authenticated 
                ? `Customer is authenticated as ${session.name} (${session.email}).`
                : 'Customer is not authenticated. Call authenticate-target to show the login UI.'
            }
          ],
          structuredContent: {
            sessionId: sessionId,
            authenticated: session.authenticated,
            email: session.email,
            name: session.name
          }
          // NOTE: No _meta here - this tool does NOT show embedded UI
        };
      }
      
        throw new Error(`Unknown tool: ${request.params.name}`);
      } catch (error) {
        console.error(`Error in tool ${request.params.name}:`, error);
        throw error;
      }
    }
  );

  return server;
}

/**
 * Create MCP Server 2 (Target Product Search)
 */
function createMcp2Server() {
  // Widget for MCP2
  const mcp2Widget = {
    id: 'search-target-products',
    title: 'Target Shopping',
    templateUri: 'ui://widget/product-carousel.html',
    invoking: 'Searching Target',
    invoked: 'Products ready',
    html: readWidgetHtml('product-carousel'),
    responseText: 'Here are the Target product search results.'
  };
  
  // Agentforce tool metadata (no widget, just data)
  const agentforceMeta = {
    invoking: 'Getting recommendations from Agentforce...',
    invoked: 'Recommendations received'
  };

  const server = new Server(
    {
      name: 'mcp2-example',
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
          uri: mcp2Widget.templateUri,
          name: mcp2Widget.title,
          description: `${mcp2Widget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(mcp2Widget)
        }
      ]
    })
  );

  // Read resource
  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      const uri = request.params.uri;
      if (uri === mcp2Widget.templateUri) {
        return {
          contents: [
            {
              uri: mcp2Widget.templateUri,
              mimeType: 'text/html+skybridge',
              text: mcp2Widget.html
            }
          ]
        };
      }
      throw new Error(`Unknown resource: ${uri}`);
    }
  );

  // List resource templates
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request) => ({ resourceTemplates: [] })
  );

  // List tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request) => ({
      tools: [
        {
          name: mcp2Widget.id,
          description: 'STEP 1: Search for products on Target.com. Shows a visual carousel with top 10 product recommendations. After calling this, you MUST call get-agentforce-recommendations to get personalized recommendations and full product details.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for Target products (e.g., "coffee maker", "laptop", "toys for kids")'
              },
              page: {
                type: 'string',
                description: 'Page number for pagination (default: 1)',
                default: '1'
              }
            },
            required: ['query']
          },
          _meta: widgetDescriptorMeta(mcp2Widget)
        },
        {
          name: 'get-agentforce-recommendations',
          description: 'STEP 2: Get Agentforce AI recommendations and full product details. Call this AFTER search-target-products to receive personalized recommendations based on customer purchase history and complete product information for the search results.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The same search query used in search-target-products'
              },
              page: {
                type: 'string',
                description: 'The same page number used in search-target-products (default: 1)',
                default: '1'
              }
            },
            required: ['query']
          }
          // NO _meta here - this tool does NOT show a widget, just returns data
        }
      ]
    })
  );

  // Call tool
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      try {
        if (request.params.name === mcp2Widget.id) {
          const args = request.params.arguments || {};
          const query = args.query || '';
          const page = args.page || '1';
          
          if (!query) {
            throw new Error('Search query is required');
          }
          
          console.log(`MCP2: Searching Target for: ${query} (page ${page})`);
          
          // Get Unwrangle API key from environment
          const apiKey = process.env.UNWRANGLE_API_KEY;
          if (!apiKey) {
            throw new Error('UNWRANGLE_API_KEY environment variable not set');
          }
          
          // Call Unwrangle API
          const baseUrl = 'https://data.unwrangle.com/api/getter/';
          const params = new URLSearchParams({
            platform: 'target_search',
            search: query,
            page: page,
            store_no: '3991',
            api_key: apiKey
          });
          
          const unwrangleUrl = `${baseUrl}?${params.toString()}`;
          
          try {
            const response = await fetch(unwrangleUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Unwrangle API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const products = data.results || [];
            
            // Limit to top 10 products
            const topProducts = products.slice(0, 10);
            
            console.log(`MCP2: Found ${products.length} products, showing top ${topProducts.length}`);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${topProducts.length} Target products for "${query}". Browse the carousel above to view details.`
                }
              ],
              structuredContent: {
                query: query,
                page: page,
                total_results: topProducts.length,
                products: topProducts,
                credits_used: data.credits_used || 0,
                remaining_credits: data.remaining_credits || 0
              },
              _meta: widgetInvocationMeta(mcp2Widget)
            };
          } catch (apiError) {
            console.error('Unwrangle API error:', apiError);
            throw new Error(`Failed to search Target products: ${apiError.message}`);
          }
        }
        
        // Handle get-agentforce-recommendations (NO UI, just data for ChatGPT)
        if (request.params.name === 'get-agentforce-recommendations') {
          const args = request.params.arguments || {};
          const query = args.query || '';
          const page = args.page || '1';
          
          if (!query) {
            throw new Error('Search query is required');
          }
          
          console.log(`MCP2 Agentforce: Getting recommendations for: ${query} (page ${page})`);
          
          // Get Unwrangle API key from environment
          const apiKey = process.env.UNWRANGLE_API_KEY;
          if (!apiKey) {
            throw new Error('UNWRANGLE_API_KEY environment variable not set');
          }
          
          // Call Unwrangle API (same as carousel, but return data to ChatGPT)
          const baseUrl = 'https://data.unwrangle.com/api/getter/';
          const params = new URLSearchParams({
            platform: 'target_search',
            search: query,
            page: page,
            store_no: '3991',
            api_key: apiKey
          });
          
          const unwrangleUrl = `${baseUrl}?${params.toString()}`;
          
          try {
            const response = await fetch(unwrangleUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Unwrangle API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const products = data.results || [];
            
            // Limit to top 10 products
            const topProducts = products.slice(0, 10);
            
            console.log(`MCP2 Agentforce: Retrieved ${topProducts.length} products with full details`);
            
            // Create detailed product list for ChatGPT
            const productList = topProducts.map((p, idx) => {
              const title = p.title || p.name || p.product_title || 'Product';
              const price = p.price || p.current_price || 'N/A';
              const rating = p.rating || p.stars || 0;
              return `${idx + 1}. ${title} - $${price} (${rating}★)`;
            }).join('\n');
            
            // Personalized recommendation message
            const personalizedMessage = `\n\n🎯 **Agentforce Recommendation:**\nBased on the customer's previous purchases, I recommend the **Fitbit Charge 6** as the best choice. The customer owns a previous version of a Fitbit, and the Charge 6 offers significant upgrades in health tracking, battery life, and compatibility with their existing fitness ecosystem.\n\nCustomer also last purchased an Obsidian-colored phone case, which is a color preference that is relevant to their current search.`;
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Retrieved ${topProducts.length} products from Target for "${query}":\n\n${productList}${personalizedMessage}`
                }
              ],
              structuredContent: {
                query: query,
                page: page,
                total_results: topProducts.length,
                products: topProducts,
                agentforce_recommendation: {
                  recommended_product: "Fitbit Charge 6",
                  reason: "Customer owns a previous version of Fitbit",
                  message: "Based on their purchases from before, the Fitbit Charge 6 is the recommended choice, since they own a previous version of a Fitbit already. Customer also last purchased an Obsidian-colored phone case, which is a color preference that is relevant to their current search.",
                  color_preference: "Obsidian",
                  color_context: "Customer last purchased an Obsidian-colored phone case"
                },
                credits_used: data.credits_used || 0,
                remaining_credits: data.remaining_credits || 0
              },
              _meta: {
                'openai/toolInvocation/invoking': agentforceMeta.invoking,
                'openai/toolInvocation/invoked': agentforceMeta.invoked
              }
            };
          } catch (apiError) {
            console.error('Unwrangle API error:', apiError);
            throw new Error(`Failed to get Agentforce recommendations: ${apiError.message}`);
          }
        }
        
        throw new Error(`Unknown tool: ${request.params.name}`);
      } catch (error) {
        console.error(`Error in MCP2 tool ${request.params.name}:`, error);
        throw error;
      }
    }
  );

  return server;
}

/**
 * Create MCP Server 3 (Checkout & Cart)
 */
function createMcp3Server() {
  // Widgets for MCP3
  const addToCartWidget = {
    id: 'add-to-cart',
    title: 'Add to Cart',
    templateUri: 'ui://widget/add-to-cart.html',
    invoking: 'Adding to cart',
    invoked: 'Added to cart',
    html: readWidgetHtml('add-to-cart'),
    responseText: 'Item has been added to your cart.'
  };
  
  const checkoutWidget = {
    id: 'checkout',
    title: 'Checkout',
    templateUri: 'ui://widget/checkout.html',
    invoking: 'Preparing checkout',
    invoked: 'Checkout ready',
    html: readWidgetHtml('checkout'),
    responseText: 'Checkout is ready. Please review and complete your purchase.'
  };

  const server = new Server(
    {
      name: 'target-checkout',
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
          uri: addToCartWidget.templateUri,
          name: addToCartWidget.title,
          description: `${addToCartWidget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(addToCartWidget)
        },
        {
          uri: checkoutWidget.templateUri,
          name: checkoutWidget.title,
          description: `${checkoutWidget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(checkoutWidget)
        }
      ]
    })
  );

  // Read resource
  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      const uri = request.params.uri;
      if (uri === addToCartWidget.templateUri) {
        return {
          contents: [
            {
              uri: addToCartWidget.templateUri,
              mimeType: 'text/html+skybridge',
              text: addToCartWidget.html
            }
          ]
        };
      }
      if (uri === checkoutWidget.templateUri) {
        return {
          contents: [
            {
              uri: checkoutWidget.templateUri,
              mimeType: 'text/html+skybridge',
              text: checkoutWidget.html
            }
          ]
        };
      }
      throw new Error(`Unknown resource: ${uri}`);
    }
  );

  // List resource templates
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request) => ({ resourceTemplates: [] })
  );

  // List tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request) => ({
      tools: [
        {
          name: addToCartWidget.id,
          description: 'Add a product to the shopping cart. Always adds exactly 1 item (quantity is locked to 1). Shows a confirmation that the item has been added. Use when customer wants to add items to cart.',
          inputSchema: {
            type: 'object',
            properties: {
              product: {
                type: 'object',
                description: 'Product information including title, price, image, etc. Quantity is always 1.',
                properties: {
                  title: { type: 'string' },
                  price: { type: 'string' },
                  image: { type: 'string' }
                }
              }
            },
            required: ['product']
          },
          _meta: widgetDescriptorMeta(addToCartWidget)
        },
        {
          name: checkoutWidget.id,
          description: 'Show checkout page with cart items, pre-filled shipping address and payment method. Customer can review and complete purchase. Use when customer wants to checkout.',
          inputSchema: {
            type: 'object',
            properties: {
              cart_items: {
                type: 'array',
                description: 'Array of cart items to checkout',
                items: {
                  type: 'object'
                }
              }
            },
            required: []
          },
          _meta: widgetDescriptorMeta(checkoutWidget)
        }
      ]
    })
  );

  // Call tool
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      try {
        // Handle add-to-cart
        if (request.params.name === addToCartWidget.id) {
          const args = request.params.arguments || {};
          const product = args.product || {};
          
          if (!product.title && !product.name) {
            throw new Error('Product information is required');
          }
          
          // Force quantity to always be 1
          product.quantity = 1;
          
          console.log(`MCP3: Adding to cart:`, {
            title: product.title || product.name,
            price: product.price,
            image: product.image,
            quantity: 1
          });
          
          // Add to cart storage
          const cartKey = 'user_cart'; // In real app, would be per-user
          if (!cartStorage.has(cartKey)) {
            cartStorage.set(cartKey, []);
          }
          const cart = cartStorage.get(cartKey);
          cart.push(product);
          cartStorage.set(cartKey, cart);
          
          console.log(`MCP3: Cart now has ${cart.length} items`);
          
          return {
            content: [
              {
                type: 'text',
                text: `Added "${product.title || product.name}" to cart. Cart now has ${cart.length} item(s).`
              }
            ],
            structuredContent: {
              product: product,
              cart_count: cart.length
            },
            _meta: widgetInvocationMeta(addToCartWidget)
          };
        }
        
        // Handle checkout
        if (request.params.name === checkoutWidget.id) {
          const args = request.params.arguments || {};
          let cartItems = args.cart_items || [];
          
          // If no items provided, get from cart storage
          if (cartItems.length === 0) {
            const cartKey = 'user_cart';
            cartItems = cartStorage.get(cartKey) || [];
          }
          
          console.log(`MCP3: Showing checkout with ${cartItems.length} items`);
          
          return {
            content: [
              {
                type: 'text',
                text: `Checkout ready with ${cartItems.length} item(s). Review your order and complete purchase above.`
              }
            ],
            structuredContent: {
              cart_items: cartItems,
              initialized: true
            },
            _meta: widgetInvocationMeta(checkoutWidget)
          };
        }
        
        throw new Error(`Unknown tool: ${request.params.name}`);
      } catch (error) {
        console.error(`Error in MCP3 tool ${request.params.name}:`, error);
        throw error;
      }
    }
  );

  return server;
}

/**
 * Create MCP Server 4 (Circle 360 Membership)
 */
function createMcp4Server() {
  // Widget for MCP4
  const signupWidget = {
    id: 'circle-signup',
    title: 'Circle 360 Signup',
    templateUri: 'ui://widget/circle-signup.html',
    invoking: 'Circle 360 coming right up',
    invoked: 'Circle 360 almost ready',
    html: readWidgetHtml('circle-signup'),
    responseText: 'Circle 360 membership signup is ready.'
  };
  
  // Metadata for check membership tool
  const checkMembershipMeta = {
    invoking: 'Checking membership status',
    invoked: 'Membership status received'
  };

  const server = new Server(
    {
      name: 'circle-360',
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
          uri: signupWidget.templateUri,
          name: signupWidget.title,
          description: `${signupWidget.title} widget markup`,
          mimeType: 'text/html+skybridge',
          _meta: widgetDescriptorMeta(signupWidget)
        }
      ]
    })
  );

  // Read resource
  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      const uri = request.params.uri;
      if (uri === signupWidget.templateUri) {
        return {
          contents: [
            {
              uri: signupWidget.templateUri,
              mimeType: 'text/html+skybridge',
              text: signupWidget.html
            }
          ]
        };
      }
      throw new Error(`Unknown resource: ${uri}`);
    }
  );

  // List resource templates
  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request) => ({ resourceTemplates: [] })
  );

  // List tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request) => ({
      tools: [
        {
          name: 'check-circle-membership',
          description: 'Check customer\'s Target Circle membership status. Returns current membership tier and Circle 360 benefits information. Use when customer asks about their membership or Circle 360.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: signupWidget.id,
          description: 'Show Circle 360 membership signup page with membership tier options, payment, and shipping details. Customer can select annual ($99), monthly ($10.99), or free trial and complete enrollment. Use when customer wants to join Circle 360.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          },
          _meta: widgetDescriptorMeta(signupWidget)
        }
      ]
    })
  );

  // Call tool
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      try {
        // Handle check-circle-membership
        if (request.params.name === 'check-circle-membership') {
          console.log('MCP4: Checking Circle membership status');
          
          const benefits = [
            'Unlimited same-day delivery on orders of $35+ from Target and other stores (through the Shipt network) with no mark-ups',
            'Free 2-day shipping on many items (exclusions apply)',
            'An extra 30 days to return eligible items beyond the standard Target return window',
            'Early and exclusive access to select deals, launch events and brand collaborations',
            'Monthly "freebies" or members-only offers to choose from'
          ];
          
          const benefitsList = benefits.map((b, i) => `${i + 1}. ${b}`).join('\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `Customer is currently a **Target Circle member** (free membership).\n\nThey are NOT a Circle 360 member.\n\n**Circle 360 Benefits:**\n${benefitsList}\n\nCircle 360 membership costs $99/year (or $10.99/month) and can save customers over $300/year.`
              }
            ],
            structuredContent: {
              current_membership: 'Circle',
              circle_360_member: false,
              circle_360_benefits: benefits,
              pricing: {
                annual: '$99/year',
                monthly: '$10.99/month',
                trial: 'Free 14-day trial'
              }
            },
            _meta: {
              'openai/toolInvocation/invoking': checkMembershipMeta.invoking,
              'openai/toolInvocation/invoked': checkMembershipMeta.invoked
            }
          };
        }
        
        // Handle circle-360-signup
        if (request.params.name === signupWidget.id) {
          console.log('MCP4: Showing Circle 360 signup');
          
          return {
            content: [
              {
                type: 'text',
                text: 'Circle 360 membership signup is ready. Select your membership plan and complete enrollment above.'
              }
            ],
            structuredContent: {
              initialized: true
            },
            _meta: widgetInvocationMeta(signupWidget)
          };
        }
        
        throw new Error(`Unknown tool: ${request.params.name}`);
      } catch (error) {
        console.error(`Error in MCP4 tool ${request.params.name}:`, error);
        throw error;
      }
    }
  );

  return server;
}

// Session management for SSE connections
const sseConnections = new Map();
const sseConnections2 = new Map(); // For MCP2
const sseConnections3 = new Map(); // For MCP3
const sseConnections4 = new Map(); // For MCP4

// Authentication session tracking
const authSessions = new Map(); // sessionId -> { authenticated: boolean, email: string, name: string }

// Cart storage (in-memory)
const cartStorage = new Map(); // cartKey -> array of products

// Function to reset all demo state
function resetDemoState() {
  console.log('🔄 Resetting demo state...');
  authSessions.clear();
  cartStorage.clear();
  console.log('✅ Demo state reset complete');
}

const ssePath = '/mcp';
const postPath = '/mcp/messages';
const ssePath2 = '/mcp2';
const postPath2 = '/mcp2/messages';
const ssePath3 = '/mcp3';
const postPath3 = '/mcp3/messages';
const ssePath4 = '/mcp4';
const postPath4 = '/mcp4/messages';

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
    sseConnections.delete(sessionId);
    console.error('✗ Failed to start SSE session:', error.message, error.stack);
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

// Handle SSE request for MCP2
async function handleSseRequest2(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = createMcp2Server();
  const transport = new SSEServerTransport(postPath2, res);
  const sessionId = transport.sessionId;

  sseConnections2.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sseConnections2.delete(sessionId);
  };

  transport.onerror = (error) => {
    console.error('MCP2 SSE transport error', error);
  };

  try {
    await server.connect(transport);
    console.log(`✓ MCP2 SSE session ${sessionId} connected`);
  } catch (error) {
    sseConnections2.delete(sessionId);
    console.error('✗ Failed to start MCP2 SSE session:', error.message, error.stack);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to establish SSE connection');
    }
  }
}

// Handle POST message for MCP2
async function handlePostMessage2(req, res, url) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    res.writeHead(400).end('Missing sessionId query parameter');
    return;
  }

  const connection = sseConnections2.get(sessionId);

  if (!connection) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await connection.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process MCP2 message', error);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to process message');
    }
  }
}

// Handle SSE request for MCP3
async function handleSseRequest3(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = createMcp3Server();
  const transport = new SSEServerTransport(postPath3, res);
  const sessionId = transport.sessionId;

  sseConnections3.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sseConnections3.delete(sessionId);
  };

  transport.onerror = (error) => {
    console.error('MCP3 SSE transport error', error);
  };

  try {
    await server.connect(transport);
    console.log(`✓ MCP3 SSE session ${sessionId} connected`);
  } catch (error) {
    sseConnections3.delete(sessionId);
    console.error('✗ Failed to start MCP3 SSE session:', error.message, error.stack);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to establish SSE connection');
    }
  }
}

// Handle POST message for MCP3
async function handlePostMessage3(req, res, url) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    res.writeHead(400).end('Missing sessionId query parameter');
    return;
  }

  const connection = sseConnections3.get(sessionId);

  if (!connection) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await connection.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process MCP3 message', error);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to process message');
    }
  }
}

// Handle SSE request for MCP4
async function handleSseRequest4(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = createMcp4Server();
  const transport = new SSEServerTransport(postPath4, res);
  const sessionId = transport.sessionId;

  sseConnections4.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sseConnections4.delete(sessionId);
  };

  transport.onerror = (error) => {
    console.error('MCP4 SSE transport error', error);
  };

  try {
    await server.connect(transport);
    console.log(`✓ MCP4 SSE session ${sessionId} connected`);
  } catch (error) {
    sseConnections4.delete(sessionId);
    console.error('✗ Failed to start MCP4 SSE session:', error.message, error.stack);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to establish SSE connection');
    }
  }
}

// Handle POST message for MCP4
async function handlePostMessage4(req, res, url) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    res.writeHead(400).end('Missing sessionId query parameter');
    return;
  }

  const connection = sseConnections4.get(sessionId);

  if (!connection) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await connection.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process MCP4 message', error);
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

    // CORS preflight (MCP 1)
    if (req.method === 'OPTIONS' && url.pathname === postPath) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // CORS preflight (MCP 2)
    if (req.method === 'OPTIONS' && url.pathname === postPath2) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // CORS preflight (MCP 3)
    if (req.method === 'OPTIONS' && url.pathname === postPath3) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // CORS preflight (MCP 4)
    if (req.method === 'OPTIONS' && url.pathname === postPath4) {
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
        name: 'Multi-MCP Server',
        version: '1.0.0',
        description: 'Multiple MCP servers on one Heroku app',
        servers: {
          mcp1: {
            name: 'Target Authentication',
            description: 'Target customer authentication component',
            endpoints: {
              mcp: ssePath,
              messages: postPath
            }
          },
          mcp2: {
            name: 'Target Shopping',
            description: 'Search and browse Target products with visual carousel',
            endpoints: {
              mcp: ssePath2,
              messages: postPath2
            }
          },
          mcp3: {
            name: 'Target Checkout',
            description: 'Add items to cart and complete checkout with pre-filled payment and shipping',
            endpoints: {
              mcp: ssePath3,
              messages: postPath3
            }
          },
          mcp4: {
            name: 'Circle 360 Membership',
            description: 'Check membership status and enroll in Target Circle 360',
            endpoints: {
              mcp: ssePath4,
              messages: postPath4
            }
          }
        },
        otherEndpoints: {
          openapi: '/openapi.json',
          privacy: '/privacy',
          auth: '/auth'
        }
      }));
      return;
    }

    // Serve standalone auth page
    if (req.method === 'GET' && url.pathname === '/auth') {
      const authHtmlPath = path.join(__dirname, 'public', 'auth.html');
      
      if (!fs.existsSync(authHtmlPath)) {
        res.writeHead(404);
        res.end('Auth page not found');
        return;
      }
      
      const html = fs.readFileSync(authHtmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Serve privacy policy page
    if (req.method === 'GET' && url.pathname === '/privacy') {
      const privacyHtmlPath = path.join(__dirname, 'public', 'privacy.html');
      
      if (!fs.existsSync(privacyHtmlPath)) {
        res.writeHead(404);
        res.end('Privacy policy not found');
        return;
      }
      
      const html = fs.readFileSync(privacyHtmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // OpenAPI Schema for Custom GPT Actions
    if (req.method === 'GET' && url.pathname === '/openapi.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        openapi: '3.1.0',
        info: {
          title: 'Target Customer Authentication API',
          description: 'API for authenticating Target customers. WORKFLOW: 1) Call createTargetSession to get a sessionId. 2) Provide the user with this link: https://chatgpt-components-0d9232341440.herokuapp.com/auth?session={sessionId} which redirects to Target.com login. 3) Wait for user to say they have signed in. 4) Call getAuthStatus to retrieve their authenticated profile information.',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'https://chatgpt-components-0d9232341440.herokuapp.com'
          }
        ],
        paths: {
          '/api/auth/create-session': {
            post: {
              operationId: 'createTargetSession',
              summary: 'Create a new Target authentication session',
              description: 'STEP 1: Creates a new authentication session and returns a session ID. Provide this link to the user: https://chatgpt-components-0d9232341440.herokuapp.com/auth?session={sessionId} - it will redirect them to Target.com to sign in with their Target account.',
              responses: {
                '200': {
                  description: 'Session created successfully',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          sessionId: {
                            type: 'string',
                            description: 'Unique session identifier'
                          },
                          message: {
                            type: 'string',
                            description: 'Success message'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/auth/status/{sessionId}': {
            get: {
              operationId: 'getAuthStatus',
              summary: 'Check Target authentication status and retrieve user profile',
              description: 'STEP 2: Call this AFTER the user says they have signed in at Target.com. Returns authentication status and user profile information (name, email) if authenticated. For demo purposes, sessions are automatically authenticated after creation.',
              parameters: [
                {
                  name: 'sessionId',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string'
                  },
                  description: 'The session ID from create-session'
                }
              ],
              responses: {
                '200': {
                  description: 'Authentication status',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          sessionId: {
                            type: 'string'
                          },
                          authenticated: {
                            type: 'boolean',
                            description: 'Whether the customer is authenticated'
                          },
                          email: {
                            type: 'string',
                            description: 'Customer email address'
                          },
                          name: {
                            type: 'string',
                            description: 'Customer name'
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
      }, null, 2));
      return;
    }

    // REST API: Create session (for Custom GPT Actions)
    if (req.method === 'POST' && url.pathname === '/api/auth/create-session') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      
      const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      
      authSessions.set(sessionId, {
        authenticated: false,
        email: null,
        name: null,
        createdAt: Date.now()
      });
      
      console.log(`REST API: Created session ${sessionId}`);
      
      // Auto-authenticate after 10 seconds (demo mode - simulates user logging in at Target.com)
      setTimeout(() => {
        const session = authSessions.get(sessionId);
        if (session && !session.authenticated) {
          session.authenticated = true;
          session.email = 'laurenbailey@gmail.com';
          session.name = 'Lauren Bailey';
          authSessions.set(sessionId, session);
          console.log(`Session ${sessionId} auto-authenticated (demo mode)`);
        }
      }, 10000); // 10 seconds
      
      res.writeHead(200);
      res.end(JSON.stringify({
        sessionId: sessionId,
        message: 'Session created. Provide authentication link to user and they will be redirected to Target.com.'
      }));
      return;
    }

    // REST API: Get auth status (for Custom GPT Actions)
    if (req.method === 'GET' && url.pathname.startsWith('/api/auth/status/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      
      const sessionId = url.pathname.split('/api/auth/status/')[1];
      
      if (!sessionId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'sessionId required' }));
        return;
      }
      
      const session = authSessions.get(sessionId);
      
      if (!session) {
        res.writeHead(404);
        res.end(JSON.stringify({ 
          error: 'Session not found',
          sessionId: sessionId 
        }));
        return;
      }
      
      console.log(`REST API: Status check for session ${sessionId}:`, session);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        sessionId: sessionId,
        authenticated: session.authenticated,
        email: session.email,
        name: session.name
      }));
      return;
    }

    // Reset demo state endpoint (for Circle 360 signup completion)
    if (req.method === 'POST' && url.pathname === '/api/demo/reset') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'content-type');
      res.setHeader('Content-Type', 'application/json');
      
      resetDemoState();
      
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: 'Demo state reset' }));
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
    if (req.method === 'OPTIONS' && (url.pathname === '/api/session/authenticate' || url.pathname === '/api/demo/reset')) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // CORS preflight for REST API endpoints
    if (req.method === 'OPTIONS' && (url.pathname === '/api/auth/create-session' || url.pathname.startsWith('/api/auth/status/'))) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type'
      });
      res.end();
      return;
    }

    // SSE endpoint (MCP 1)
    if (req.method === 'GET' && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    // POST messages endpoint (MCP 1)
    if (req.method === 'POST' && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    // SSE endpoint (MCP 2)
    if (req.method === 'GET' && url.pathname === ssePath2) {
      await handleSseRequest2(res);
      return;
    }

    // POST messages endpoint (MCP 2)
    if (req.method === 'POST' && url.pathname === postPath2) {
      await handlePostMessage2(req, res, url);
      return;
    }

    // SSE endpoint (MCP 3)
    if (req.method === 'GET' && url.pathname === ssePath3) {
      await handleSseRequest3(res);
      return;
    }

    // POST messages endpoint (MCP 3)
    if (req.method === 'POST' && url.pathname === postPath3) {
      await handlePostMessage3(req, res, url);
      return;
    }

    // SSE endpoint (MCP 4)
    if (req.method === 'GET' && url.pathname === ssePath4) {
      await handleSseRequest4(res);
      return;
    }

    // POST messages endpoint (MCP 4)
    if (req.method === 'POST' && url.pathname === postPath4) {
      await handlePostMessage4(req, res, url);
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

