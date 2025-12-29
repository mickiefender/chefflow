# RestaurantPOS - Installation Guide

## Local Development Setup

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/restaurant-pos.git
cd restaurant-pos
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Setup Supabase

#### Option A: Using Existing Supabase Project
1. Go to https://supabase.com
2. Create a new project or use existing
3. Note your Project URL and Anon Key

#### Option B: Quick Setup
1. Create `.env.local` file
2. Add your Supabase credentials:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

### 4. Initialize Database

\`\`\`bash
# Copy the SQL from scripts/01-init-schema.sql
# Paste it into Supabase SQL Editor and run
\`\`\`

Or use the Supabase CLI:

\`\`\`bash
supabase db push
\`\`\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## First Time Setup

### Create Super Admin Account

1. Visit http://localhost:3000
2. Click "Get Started"
3. Sign up with Super Admin account type
4. Complete onboarding

### Register Your First Restaurant

1. Go to Super Admin Dashboard
2. Click "Register Restaurant"
3. Fill in restaurant details
4. Create restaurant admin account

### Add Staff Members

1. Go to Restaurant Admin Dashboard
2. Click "Manage Staff"
3. Add kitchen, bar, and waiter staff

### Setup Menu Items

1. Click "Manage Menu"
2. Create categories (Breakfast, Lunch, etc.)
3. Add menu items with prices

### Test NFC Menu

1. Create a table in restaurant settings
2. Generate NFC tap link: `/menu/[table-id]`
3. Open on mobile device
4. Order items from menu

## Development Workflow

### Making Changes

\`\`\`bash
# Make changes to files
# Server automatically reloads

# If issues, restart:
npm run dev
\`\`\`

### Database Changes

\`\`\`bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push
\`\`\`

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Troubleshooting

### Port 3000 Already in Use

\`\`\`bash
# Use different port
npm run dev -- -p 3001
\`\`\`

### Database Connection Error

\`\`\`bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify Supabase project is active
\`\`\`

### Module Not Found

\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
\`\`\`

### TypeScript Errors

\`\`\`bash
# Check tsconfig
npm run type-check
\`\`\`

## Next Steps

- [ ] Read the README.md for architecture overview
- [ ] Review database schema in Supabase
- [ ] Explore API routes in `/app/api`
- [ ] Test all user workflows
- [ ] Customize branding and colors
- [ ] Deploy to Vercel
