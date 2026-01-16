-- Drop ticket replies table
DROP TABLE IF EXISTS support_ticket_replies;

-- Remove columns from support_tickets
ALTER TABLE support_tickets DROP COLUMN IF EXISTS user_id;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS category;
