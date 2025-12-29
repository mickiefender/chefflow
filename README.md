# RestaurantPOS - Complete Restaurant Management System

A comprehensive Next.js and Supabase-based POS system with NFC menu ordering, real-time kitchen tracking, and multi-level dashboard access.

## System Architecture

### User Roles

1. **Super Admin** - System owner who manages all restaurants
2. **Restaurant Admin** - Manages a specific restaurant and its staff
3. **Department Staff** - Kitchen, Bar, Waiter, etc. with role-specific dashboards
4. **Customers** - Order via NFC tap interface

### Key Features

- **NFC Menu Interface**: Customers tap phones to NFC cards at tables to view menu
- **Real-time Order Management**: Instant order transmission and status updates
- **Staff Tracking**: Individual credentials for accountability and audit trails
- **Department Dashboards**: Separate dashboards for each department
- **Admin Analytics**: Comprehensive sales and performance reports
- **Multi-restaurant Support**: Scale to manage multiple locations

## Tech Stack

- **Frontend**: Next.js 16+ with React 19
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui

## Database Schema

### Core Tables

- `super_admins` - System administrators
- `restaurants` - Restaurant data
- `restaurant_admins` - Restaurant-level admins
- `departments` - Departments (Kitchen, Bar, Waiter, etc.)
- `staff_members` - Individual staff with login credentials
- `restaurant_tables` - Physical tables with NFC tags
- `menu_categories` - Menu organization
- `menu_items` - Individual menu items
- `orders` - Customer orders
- `order_items` - Items in each order
- `activity_logs` - Audit trail for all actions

## Setup Instructions

### 1. Database Setup

Run the migration script to create all tables:

\`\`\`bash
npm run seed:db
\`\`\`

Or manually run `scripts/01-init-schema.sql` in your Supabase SQL editor.

### 2. Environment Variables

Add to your `.env.local`:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

These are automatically set if you've connected Supabase integration.

### 3. Start Development

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## User Workflows

### Super Admin Flow

1. Sign up as Super Admin
2. Navigate to Super Admin Dashboard
3. Register new restaurants
4. Manage restaurant admins and view analytics

### Restaurant Admin Flow

1. Get invited to restaurant or create restaurant via signup
2. Access Restaurant Admin Dashboard
3. Manage menu items
4. Register staff members
5. View sales and performance metrics
6. Set up departments

### Staff Flow

1. Receive login credentials from admin
2. Sign in to staff dashboard
3. View orders for their department
4. Update order status in real-time
5. Logout when shift ends

### Customer Flow

1. Sit at restaurant table
2. Tap NFC card with phone
3. View menu on their device
4. Select items and quantities
5. Place order
6. Track order status in real-time

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:restaurantId` - Get restaurant orders
- `PUT /api/orders/:orderId` - Update order status
- `GET /api/orders/:restaurantId/analytics` - Order analytics

### Menu
- `GET /api/menu/:restaurantId` - Get menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:itemId` - Update menu item

### Staff
- `GET /api/staff/:restaurantId` - Get staff list
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:staffId` - Update staff

## Security

### Row Level Security (RLS)

All tables have RLS policies to ensure:
- Users can only see data they have access to
- Staff members can only modify orders from their restaurant
- Restaurant admins can only manage their own restaurants

### Authentication

- Supabase Auth handles all authentication
- Passwords are hashed with bcrypt
- Session management via secure cookies
- JWT tokens for API access

## Deployment

### Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
\`\`\`

Environment variables are automatically pulled from your Vercel project.

### Database Backups

Supabase automatically backs up your data. Access backups in your Supabase dashboard.

## Development Roadmap

- [ ] Payment integration (Stripe)
- [ ] SMS/Email notifications
- [ ] Advanced reporting and analytics
- [ ] Mobile app for staff
- [ ] QR code alternative to NFC
- [ ] Inventory management
- [ ] Supplier integration
- [ ] Employee scheduling
- [ ] Customer loyalty program

## Troubleshooting

### Common Issues

**401 Unauthorized when accessing dashboard**
- Ensure user is logged in
- Check Supabase authentication is configured
- Verify RLS policies are set correctly

**Orders not showing up**
- Check restaurant_id matches in orders and staff_members tables
- Verify RLS policies allow access
- Check order status in activity_logs

**NFC menu not loading**
- Verify table exists in restaurant_tables
- Check restaurant_id is correct
- Ensure menu items exist for restaurant

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check Next.js documentation: https://nextjs.org/docs

## License

MIT License - feel free to use this for your restaurant business.
