# RestaurantPOS - Deployment Guide

## Prerequisites

- Node.js 18+ 
- Vercel account (for deployment)
- Supabase account (for database)
- GitHub account (optional but recommended)

## Step-by-Step Deployment

### 1. Prepare Your Repository

\`\`\`bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: RestaurantPOS system"
\`\`\`

### 2. Push to GitHub

\`\`\`bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/yourusername/restaurant-pos.git
git branch -M main
git push -u origin main
\`\`\`

### 3. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
\`\`\`

When prompted:
- Link to your GitHub project (optional)
- Set project name to `restaurant-pos`
- Framework: Next.js (auto-detected)
- Root directory: ./

### 4. Set Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all Supabase variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
\`\`\`

### 5. Setup Database

In your Supabase dashboard:
1. Go to SQL Editor
2. Create a new query
3. Copy and run the contents of `scripts/01-init-schema.sql`
4. Verify all tables are created

### 6. Test Your Deployment

1. Visit your Vercel deployment URL
2. Sign up as Super Admin
3. Create a test restaurant
4. Test all workflows

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set in Vercel
- [ ] Authentication working
- [ ] Can sign up and login
- [ ] Can create restaurants
- [ ] Can add staff members
- [ ] Menu page loads via NFC link
- [ ] Orders are created successfully
- [ ] Dashboard shows data
- [ ] Analytics page works

## Monitoring

### Check Application Logs

\`\`\`bash
vercel logs
\`\`\`

### Monitor Database

In Supabase:
- Go to Database → Tables
- Check table sizes and activity
- Monitor RLS policy violations

### Set Up Alerts

In Vercel:
1. Go to Settings → Monitoring
2. Enable alerts for errors
3. Set up email notifications

## Database Backups

Supabase automatically backs up daily. Access backups:
1. In Supabase dashboard
2. Go to Backups
3. Download or restore as needed

## Scaling Considerations

### When to Scale

- **Heavy Traffic**: Monitor CPU usage in Vercel Analytics
- **Database Growth**: Monitor storage in Supabase
- **Concurrent Users**: Enable connection pooling in Supabase

### Scaling Steps

1. **Database**: Upgrade Supabase plan
2. **Functions**: Vercel auto-scales (no action needed)
3. **Storage**: Add Vercel Blob if needed

## Custom Domain

1. In Vercel dashboard, go to Settings → Domains
2. Add your domain
3. Follow DNS setup instructions
4. Update your DNS provider

## SSL/TLS Certificate

Vercel automatically provides SSL certificates. No additional setup needed.

## Troubleshooting

### 500 Error on Deploy

\`\`\`bash
# Check build logs
vercel logs --level error
\`\`\`

### Database Connection Failed

- Verify environment variables in Vercel
- Check Supabase URL is correct
- Ensure RLS policies allow your queries

### Authentication Issues

- Clear browser cache and cookies
- Verify Supabase Auth is enabled
- Check email in Supabase auth users

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Performance Tips

1. **Enable Caching**: Use revalidateTag() in Server Actions
2. **Optimize Images**: Use next/image for all images
3. **Database Indexes**: Add indexes on frequently queried fields
4. **Connection Pooling**: Enable in Supabase for many connections

## Security

- Never commit `.env.local` to Git
- Use environment variables for all secrets
- Enable Row Level Security on all tables
- Use HTTPS only (automatic with Vercel)
- Regularly update dependencies: `npm update`
