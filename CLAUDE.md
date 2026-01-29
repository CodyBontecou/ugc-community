# UGC Community - Claude Code Instructions

## Database Management

This project uses **Drizzle ORM** with a **Neon PostgreSQL** database.

### Schema Location
- Schema definition: `lib/db/schema.ts`
- Migrations folder: `drizzle/`

### Adding New Fields or Tables

1. **Update the schema** in `lib/db/schema.ts`

2. **Create a migration file** manually in `drizzle/` with the next sequence number:
   ```
   drizzle/0007_descriptive_name.sql
   ```

3. **Apply the migration** directly to Neon:
   ```bash
   source .env.local && psql "$DATABASE_URL" -f drizzle/XXXX_migration_name.sql
   ```

### Why Manual Migrations?

We create migration SQL files manually rather than using `drizzle-kit generate` because:
- The interactive prompts don't work well in automated environments
- Direct control over migration SQL is preferred
- Simpler workflow for small schema changes

### Migration Naming Convention

Format: `XXXX_descriptive_name.sql` where XXXX is a zero-padded sequence number.

Examples:
- `0006_add_profile_view_count.sql`
- `0007_add_user_settings.sql`
