# RestaurantPOS - API Reference

## Base URL

Local: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Authentication

All API calls require a valid Supabase session. Authentication is handled automatically via cookies.

## Endpoints

### Orders

#### GET /orders
Fetch orders for a restaurant.

**Query Parameters:**
- `restaurantId` (required): Restaurant UUID

**Response:**
\`\`\`json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "table_id": "uuid",
    "customer_name": "string",
    "status": "pending|in-progress|completed",
    "total_amount": 123.45,
    "created_at": "2025-01-01T00:00:00Z",
    "order_items": []
  }
]
\`\`\`

#### POST /orders
Create a new order.

**Request Body:**
\`\`\`json
{
  "restaurantId": "uuid",
  "tableId": "uuid",
  "customerName": "string",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 1,
      "price": 12.99
    }
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "table_id": "uuid",
  "status": "pending",
  "total_amount": 123.45,
  "created_at": "2025-01-01T00:00:00Z"
}
\`\`\`

#### PUT /orders/:orderId
Update order status.

**Request Body:**
\`\`\`json
{
  "status": "in-progress|completed"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

### Menu

#### GET /menu
Fetch menu items for a restaurant.

**Query Parameters:**
- `restaurantId` (required): Restaurant UUID

**Response:**
\`\`\`json
[
  {
    "id": "uuid",
    "name": "Breakfast",
    "sort_order": 1,
    "menu_items": [
      {
        "id": "uuid",
        "name": "Eggs & Bacon",
        "description": "Fried eggs with bacon",
        "price": 8.99,
        "image_url": "https://...",
        "available": true
      }
    ]
  }
]
\`\`\`

#### POST /menu
Create a new menu item.

**Request Body:**
\`\`\`json
{
  "restaurant_id": "uuid",
  "category_id": "uuid",
  "name": "Item Name",
  "description": "Item description",
  "price": 12.99,
  "image_url": "https://...",
  "available": true
}
\`\`\`

### Analytics

#### GET /analytics
Fetch analytics data for a restaurant.

**Query Parameters:**
- `restaurantId` (required): Restaurant UUID
- `days` (optional, default: 30): Number of days to analyze

**Response:**
\`\`\`json
{
  "totalRevenue": 5000.00,
  "completedOrders": 150,
  "pendingOrders": 10,
  "totalOrders": 160,
  "averageOrderValue": 31.25,
  "dailyData": [
    {
      "date": "2025-01-01",
      "amount": 500.00
    }
  ]
}
\`\`\`

### Staff

#### GET /staff
Fetch staff members for a restaurant or department.

**Query Parameters:**
- `restaurantId` (required): Restaurant UUID
- `departmentId` (optional): Department UUID

**Response:**
\`\`\`json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "department_id": "uuid",
    "email": "staff@restaurant.com",
    "full_name": "John Doe",
    "position": "Head Chef"
  }
]
\`\`\`

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Missing required parameter: restaurantId"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "User not authenticated"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Access denied to this restaurant"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error"
}
\`\`\`

## Rate Limiting

API calls are limited to:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated

## Webhook Events

(Future implementation)

- `order.created`
- `order.updated`
- `order.completed`
- `menu.updated`
- `staff.added`
