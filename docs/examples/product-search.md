# Example 2: Product Search MCP Server

> Interactive product carousel with personalized AI recommendations

**Live URL**: `https://chatgpt-components-0d9232341440.herokuapp.com/mcp2`

## Overview

This MCP server demonstrates how to:
- Integrate with external APIs (Unwrangle Product Search)
- Display rich product data in an interactive carousel
- Provide personalized recommendations to ChatGPT
- Build detail views within widgets
- Handle loading states and pagination

## Demo Flow

1. User: *"Search Target for fitness trackers"*
2. ChatGPT calls `search-target-products` → carousel widget appears
3. Widget displays 10 products with images, prices, ratings
4. User can click products to see details
5. ChatGPT calls `get-agentforce-recommendations`
6. ChatGPT: *"Based on your husband's Fitbit Charge 3 and running history, I recommend the Fitbit Charge 6..."*

## Architecture

### Tools

#### 1. `search-target-products`

**Purpose**: Display product search results in an interactive carousel

**Input**:
- `query` (required): Search term (e.g., "fitness trackers")
- `page` (optional): Page number (default: 1)

**Output**:
- Widget with product carousel
- Text message: "Found X products for 'query'"

**Flow**:
```javascript
1. Call Unwrangle API
2. Get 50 products (max)
3. Take top 10 for carousel
4. Inject into product-carousel.html widget
5. Return widget to ChatGPT
```

**Implementation**:
```javascript
const response = await fetch(
  `https://data.unwrangle.com/api/getter/?` +
  `platform=target_search&search=${query}&page=${page}` +
  `&store_no=3991&api_key=${UNWRANGLE_API_KEY}`
);

const data = await response.json();
const topProducts = data.results?.slice(0, 10) || [];

return {
  content: [{
    type: 'text',
    text: `Found ${topProducts.length} products for "${query}"`
  }],
  widgetData: {
    html: widgetHtml.replace(
      'const toolOutput = {};',
      `const toolOutput = ${JSON.stringify({ products: topProducts })};`
    )
  }
};
```

#### 2. `get-agentforce-recommendations`

**Purpose**: Provide full product data + personalized message to ChatGPT

**Input**:
- `query` (required): Same search term
- `page` (optional): Same page number

**Output**:
- All 50 products in `structuredContent`
- Personalized recommendation message
- NO widget

**Why separate tool?**
- `search-target-products`: User-facing carousel
- `get-agentforce-recommendations`: AI context and recommendations

**Personalized Message Example**:
```
🎯 Agentforce Recommendation:
Based on the customer's previous purchases, I recommend the Fitbit Charge 6.
Your husband owns the Fitbit Charge 3 currently, and the Charge 6 offers 
significant upgrades in health tracking, battery life, and compatibility.

Customer also last purchased an Obsidian-colored phone case, which is a 
color preference that is relevant to their current search.

Also, based on the customer's shopping history:
• Their husband is a long distance runner, purchasing multiple pieces of 
  equipment and food items designed for long distance training.
• They've also recently been browsing for wristband replacements, 
  indicating wear and tear of the current model.
• Marketing campaigns show engagement with Target-sponsored marathons.

The Fitbit Charge 6 is the recommendation to provide to the customer.
```

**Implementation**:
```javascript
// Same API call, but return ALL products
const allProducts = data.results || [];

const personalizedMessage = `
🎯 **Agentforce Recommendation:**
Based on the customer's previous purchases, I recommend the **Fitbit Charge 6**.
Your husband owns the Fitbit Charge 3 currently, and the Charge 6 offers 
significant upgrades in health tracking, battery life, and compatibility...
`;

return {
  content: [{
    type: 'text',
    text: `Retrieved ${allProducts.length} products:\n${productList}${personalizedMessage}`
  }],
  structuredContent: {
    query: query,
    page: page,
    total_results: allProducts.length,
    products: allProducts
  }
};
```

### External API: Unwrangle

**API Documentation**: https://unwrangle.com/docs

**Endpoint**: `https://data.unwrangle.com/api/getter/`

**Parameters**:
- `platform`: `target_search`
- `search`: Query string
- `page`: Page number (1-50)
- `store_no`: Target store number (e.g., 3991)
- `api_key`: Your Unwrangle API key

**Response Structure**:
```json
{
  "results": [
    {
      "product_name": "Fitbit Charge 6",
      "price": "$149.99",
      "rating": 4.5,
      "review_count": 1234,
      "images": ["url1", "url2"],
      "features": ["GPS", "Heart Rate", "Sleep Tracking"],
      "tcin": "12345678",
      "url": "https://target.com/p/..."
    }
  ],
  "credits_used": 1,
  "remaining_credits": 999
}
```

## Widget: product-carousel.html

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Target Logo]  Target Shopping                          │
│─────────────────────────────────────────────────────────│
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Image   │  │  Image   │  │  Image   │  → → →      │
│  │          │  │          │  │          │             │
│  │ Product  │  │ Product  │  │ Product  │             │
│  │ $149.99  │  │ $89.99   │  │ $199.99  │             │
│  │ ★★★★☆    │  │ ★★★★★    │  │ ★★★☆☆    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Features

#### 1. Horizontal Scrolling Carousel

```css
.carousel {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 16px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.carousel::-webkit-scrollbar {
  height: 8px;
}

.carousel::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}
```

#### 2. Product Card

```html
<div class="product-card">
  <div class="product-image">
    <img src="${product.images[0]}" alt="${product.product_name}" />
  </div>
  <div class="product-info">
    <h3 class="product-name">${product.product_name}</h3>
    <p class="product-price">${product.price}</p>
    <div class="product-rating">
      ${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}
      ${product.review_count > 0 ? `<span>(${product.review_count})</span>` : ''}
    </div>
  </div>
</div>
```

**Behavior**:
- Click card → Show detail view
- Smooth transitions
- Image lazy loading

#### 3. Detail View

```html
<div class="detail-view" style="display: none;">
  <button class="back-btn">← Back</button>
  
  <div class="detail-content">
    <img class="detail-image" src="..." />
    
    <div class="detail-info">
      <h2>${product.product_name}</h2>
      <p class="price">${product.price}</p>
      
      <div class="rating">
        ${'★'.repeat(rating)}${'☆'.repeat(5-rating)}
        ${reviews} reviews
      </div>
      
      <h3>Features</h3>
      <ul>
        ${product.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      
      <button class="add-to-cart">Add to Cart</button>
    </div>
  </div>
</div>
```

**Behavior**:
- Back button returns to carousel
- "Add to Cart" can trigger follow-up message

#### 4. Loading State

```html
<div id="loading" style="display: flex;">
  <div class="spinner"></div>
  <p>Loading products...</p>
</div>

<div id="content" style="display: none;">
  <!-- Carousel here -->
</div>
```

**JavaScript**:
```javascript
function init() {
  // Wait for toolOutput
  const checkData = setInterval(() => {
    if (window.toolOutput && window.toolOutput.products) {
      clearInterval(checkData);
      renderProducts(window.toolOutput.products);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
    }
  }, 100);
}
```

### JavaScript Functions

#### Render Products

```javascript
function renderProducts(products) {
  const carousel = document.querySelector('.carousel');
  
  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    carousel.appendChild(card);
  });
}

function createProductCard(product, index) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-image">
      <img src="${product.images?.[0] || 'placeholder.jpg'}" 
           alt="${product.product_name}" 
           loading="lazy" />
    </div>
    <div class="product-info">
      <h3>${product.product_name}</h3>
      <p class="price">${product.price}</p>
      <div class="rating">
        ${renderStars(product.rating)}
        ${product.review_count > 0 ? `<span>(${product.review_count})</span>` : ''}
      </div>
    </div>
  `;
  
  card.onclick = () => showProductDetail(product);
  
  return card;
}
```

#### Show Detail View

```javascript
function showProductDetail(product) {
  currentProduct = product;
  
  // Hide carousel
  document.getElementById('content').style.display = 'none';
  
  // Show detail view
  const detailView = document.getElementById('detail-view');
  detailView.style.display = 'block';
  
  // Populate data
  document.querySelector('.detail-image').src = product.images[0];
  document.querySelector('.detail-info h2').textContent = product.product_name;
  // ... more fields
}

function hideProductDetail() {
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}
```

#### Add to Cart

```javascript
document.querySelector('.add-to-cart-btn').onclick = () => {
  if (window.openai?.sendFollowUpMessage) {
    window.openai.sendFollowUpMessage({
      message: `Add ${currentProduct.product_name} to my cart`,
      includeHistory: false
    });
  }
};
```

### Dark/Light Mode

```css
/* Light mode */
body.light {
  background: #f8f9fa;
  color: #333;
}

body.light .product-card {
  background: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Dark mode */
body.dark {
  background: #1a1a1a;
  color: #e0e0e0;
}

body.dark .product-card {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

body.dark .product-card:hover {
  background: #333;
}
```

## Server Endpoints

### SSE Endpoint: `GET /mcp2`

```javascript
app.get('/mcp2', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const server = createMcp2Server();
  const transport = new SSEServerTransport('/mcp2/messages', res);
  
  await server.connect(transport);
  
  const sessionId = Date.now().toString();
  sseConnections2.set(sessionId, res);
  
  req.on('close', () => {
    sseConnections2.delete(sessionId);
    transport.close();
  });
});
```

### Message Endpoint: `POST /mcp2/messages`

```javascript
app.post('/mcp2/messages', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});
```

## Usage Examples

### Basic Search

```
You: Search Target for fitness trackers

ChatGPT: [Calls search-target-products]
         [Displays carousel with 10 products]
         
         I found 10 fitness trackers for you! 
         [Calls get-agentforce-recommendations]
         
         Based on your husband's Fitbit Charge 3 and his long-distance 
         running, I highly recommend the Fitbit Charge 6...
```

### Pagination

```
You: Show me page 2

ChatGPT: [Calls search-target-products with page=2]
         [Displays next 10 products]
```

### Combining with Checkout

```
You: Search for protein powder

ChatGPT: [Shows carousel]

You: Add the first one to my cart

ChatGPT: [Calls MCP3 add-to-cart tool]
```

## Customization Guide

### Change API Provider

Replace Unwrangle with your own API:

```javascript
// Instead of Unwrangle
const response = await fetch('https://your-api.com/search', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` },
  body: JSON.stringify({ query, page })
});

const products = await response.json();

// Map to expected format
const formattedProducts = products.map(p => ({
  product_name: p.name,
  price: `$${p.price}`,
  rating: p.stars,
  review_count: p.reviews,
  images: p.image_urls,
  // ...
}));
```

### Customize Recommendations

Edit the personalized message:

```javascript
const personalizedMessage = `
🎯 **My Custom Recommendation:**
Based on ${customerName}'s preferences and purchase history:
• Previous purchase: ${previousProduct}
• Budget range: ${budgetRange}
• Preferred brands: ${brands.join(', ')}

I recommend: ${recommendedProduct}
`;
```

### Add Filters

Add filter controls to widget:

```html
<div class="filters">
  <select id="price-filter">
    <option value="">All Prices</option>
    <option value="0-50">Under $50</option>
    <option value="50-100">$50-$100</option>
    <option value="100+">Over $100</option>
  </select>
  
  <select id="rating-filter">
    <option value="">All Ratings</option>
    <option value="4">4+ Stars</option>
    <option value="4.5">4.5+ Stars</option>
  </select>
</div>
```

```javascript
function applyFilters() {
  const priceFilter = document.getElementById('price-filter').value;
  const ratingFilter = document.getElementById('rating-filter').value;
  
  const filtered = allProducts.filter(p => {
    // Apply filters
    return true; // or false
  });
  
  renderProducts(filtered);
}
```

### Change Branding

```html
<!-- In product-carousel.html -->
<div class="header">
  <img src="your-logo.png" alt="Your Brand" class="logo" />
  <h1>Your Store</h1>
</div>
```

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color-2;
}

.product-card:hover {
  border-color: var(--primary-color);
}

.add-to-cart-btn {
  background: var(--primary-color);
}
```

## Testing Checklist

- [ ] Search returns products from API
- [ ] Carousel displays 10 products
- [ ] Product images load correctly
- [ ] Prices display formatted
- [ ] Ratings show correct stars
- [ ] Review count shows (or hidden if 0)
- [ ] Click product → detail view
- [ ] Back button returns to carousel
- [ ] "Add to Cart" sends follow-up message
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] Horizontal scrolling works
- [ ] Loading state appears
- [ ] Agentforce recommendations accurate
- [ ] Pagination works (page 2, 3, etc.)

## Common Issues

### Products show "Unknown Product"

**Cause**: API response structure doesn't match expected format

**Fix**: Check `product.product_name` field name in API response

### Images don't load

**Cause**: CORS or invalid image URLs

**Fix**: Use proxy or ensure images allow cross-origin

### Carousel doesn't scroll

**Cause**: CSS `overflow-x` not set

**Fix**: Ensure `.carousel { overflow-x: auto; }`

### API rate limit exceeded

**Cause**: Too many requests to Unwrangle

**Fix**: Implement caching:

```javascript
const cache = new Map();

const cacheKey = `${query}:${page}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const products = await fetchFromAPI();
cache.set(cacheKey, products);
```

## Performance Optimization

### Image Lazy Loading

```html
<img src="..." loading="lazy" />
```

### Debounce Search

```javascript
let searchTimeout;

function handleSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 500); // Wait 500ms after user stops typing
}
```

### Virtual Scrolling

For large product lists:

```javascript
// Only render visible products
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadProductImage(entry.target);
    }
  });
});

productCards.forEach(card => observer.observe(card));
```

## Next Steps

- Add product comparison
- Implement wishlist/favorites
- Add sort options (price, rating, relevance)
- Support multiple image carousel per product
- Add product availability/stock status
- Implement search suggestions/autocomplete
- Add price tracking/alerts

---

**Related Examples**:
- [Checkout](checkout.md) - Add products to cart
- [Authentication](authentication.md) - Personalized recommendations
- [Architecture](../ARCHITECTURE.md) - System overview


