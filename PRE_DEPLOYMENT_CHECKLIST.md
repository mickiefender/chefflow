# RestaurantPOS - Pre-Deployment Checklist

## Before You Deploy

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.error or console.warn in production code
- [ ] Environment variables properly configured
- [ ] No sensitive data in code
- [ ] Comments removed from uncommitted changes

### Testing
- [ ] Sign up flow works end-to-end
- [ ] Super admin can register restaurant
- [ ] Restaurant admin can manage staff
- [ ] Staff can login and view orders
- [ ] Customers can order via NFC menu
- [ ] Kitchen staff can update order status
- [ ] Analytics dashboard displays data
- [ ] Activity log shows all actions

### Database
- [ ] Database migration script ran successfully
- [ ] All tables created with correct columns
- [ ] RLS policies applied to all tables
- [ ] Sample data added for testing
- [ ] No errors in Supabase logs

### Security
- [ ] Supabase RLS policies reviewed
- [ ] No authenticated routes exposed
- [ ] Environment variables not in .env file
- [ ] Password requirements set
- [ ] HTTPS enforced (automatic on Vercel)

### Performance
- [ ] Page load time < 3 seconds
- [ ] Database queries optimized
- [ ] No N+1 queries in dashboards
- [ ] Images cached properly
- [ ] API responses < 1 second

### Deployment
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified

### Documentation
- [ ] README.md complete and accurate
- [ ] API documentation updated
- [ ] Installation guide tested
- [ ] Deployment guide followed
- [ ] Known issues documented

### Monitoring Setup
- [ ] Error tracking enabled (Vercel)
- [ ] Email alerts configured
- [ ] Uptime monitoring set up
- [ ] Database monitoring enabled
- [ ] Log aggregation configured

### Final Verification
- [ ] Visit production URL
- [ ] Sign up works on production
- [ ] Can create test restaurant
- [ ] NFC menu loads from production
- [ ] Orders save to production database
- [ ] Analytics show production data

## Deployment Day Checklist

- [ ] Team notified of deployment
- [ ] Backup of production database (if exists)
- [ ] Maintenance window scheduled (if needed)
- [ ] Support team ready
- [ ] Monitoring dashboard open
- [ ] Rollback plan documented

## Post-Deployment

- [ ] Monitor error logs for 1 hour
- [ ] Test all critical workflows
- [ ] Verify analytics capturing data
- [ ] Check database performance
- [ ] Confirm backups running
- [ ] Send launch notification to stakeholders

## Troubleshooting

If issues occur:

1. **Check Vercel Logs**
   \`\`\`bash
   vercel logs --follow
   \`\`\`

2. **Check Supabase Status**
   - Go to Supabase dashboard
   - Check database health

3. **Review Environment Variables**
   - Verify all vars in Vercel
   - Test database connection

4. **Rollback if Necessary**
   - Revert to previous commit
   - Redeploy to Vercel

## After First Week

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Get user feedback
- [ ] Plan improvements
- [ ] Schedule next update
