# Database Migration Instructions

## Adding Description Field

To add the new candidate management features, you need to run the database migration to add the new column to your existing `candidates` table.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `database-migration.sql` 
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Migration Contents:**
   ```sql
   -- Add new columns to existing candidates table
   ALTER TABLE candidates ADD COLUMN IF NOT EXISTS description TEXT;
   ```

### What this adds:
- **description**: Optional field for short candidate descriptions

### After Migration:
- Your existing candidates will remain unchanged
- The new column will be `NULL` for existing candidates
- You can now use the new candidate management features in the admin panel

### New Admin Features:
- ✅ Add new candidates with name, party, and description
- ✅ Remove existing candidates (with confirmation)
- ✅ Enhanced candidate display with descriptions
- ✅ Real-time updates for candidate additions/removals 