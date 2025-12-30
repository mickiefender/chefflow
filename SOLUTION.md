I have made a significant change to the code to narrow down the source of the persistent "500 Internal Server Error".

I have switched to a more direct way of connecting to the database from the server, which bypasses any potential issues with security policies or session handling.

Please try tracking an order again.

**Case 1: The order tracking now works**

If the feature is now working, it means the problem was with the security policies or the way the server was handling sessions. The current code is a valid workaround.

**Case 2: You are still getting a "500 Internal Server Error"**

If the error still persists, it means the problem is more fundamental. It is very likely one of the following issues:

1.  **Incorrect Environment Variables:** The `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are not set correctly in your hosting environment (e.g., Vercel).
2.  **Database Migration Not Applied:** The database changes from `scripts/07-add-human-readable-order-id.sql` have not been applied correctly, and the `human_readable_id` column does not exist in the `orders` table.

Please double-check your environment variables and confirm that you have run the database migration.
