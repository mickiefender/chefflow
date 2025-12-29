# RestaurantPOS - Quick Start Guide

## 30-Second Setup

1. **Clone & Install**
   \`\`\`bash
   git clone <repo>
   cd restaurant-pos
   npm install
   \`\`\`

2. **Configure Supabase**
   - Create account at https://supabase.com
   - Create new project
   - Copy URL and Anon Key
   - Add to `.env.local`

3. **Initialize Database**
   - Go to Supabase SQL Editor
   - Run `scripts/01-init-schema.sql`

4. **Start Development**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access App**
   - Visit http://localhost:3000
   - Sign up as Super Admin
   - Create restaurant
   - Start managing!

## Common Tasks

### Add a Restaurant
1. Super Admin Dashboard
2. Click "Register Restaurant"
3. Fill details and submit
4. Restaurant admin dashboard opens

### Add Staff Member
1. Restaurant Dashboard → "Manage Staff"
2. Click "Add Staff"
3. Enter email, name, department
4. Staff gets login credentials via email

### Create Menu Item
1. Restaurant Dashboard → "Manage Menu"
2. Click "Add Item"
3. Fill name, price, category
4. Item appears on customer menu

### Access Customer Menu
1. Create table in restaurant settings
2. Share link: `https://yoursite.com/menu/[table-id]`
3. Customer taps link with NFC card
4. Menu loads on their device

### View Orders in Real-Time
- Kitchen Dashboard: See pending orders
- Waiter Dashboard: See ready orders
- Bar Dashboard: See drink orders
- Manager Dashboard: See all orders

### Check Analytics
1. Restaurant Dashboard
2. Click "Analytics"
3. View revenue, orders, trends

## Need Help?

- **Setup Issues**: Check INSTALLATION.md
- **Deployment**: See DEPLOYMENT.md
- **API Details**: Review API_REFERENCE.md
- **Architecture**: Read README.md

## Next Steps

After setup:
1. Customize restaurant branding
2. Set up all departments
3. Create menu categories and items
4. Register all staff members
5. Deploy to production
6. Train staff on system
7. Invite customers to order
