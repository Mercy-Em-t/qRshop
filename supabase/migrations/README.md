# Supabase Migration Governance

Use this directory for **ordered, versioned migrations** instead of ad-hoc root-level SQL patches.

## Naming convention

`YYYYMMDDHHMMSS__short_description.sql`

Example:

`20260409192000__create_payment_audit_log.sql`

## Rules

1. New schema changes should be added here first.
2. Keep migration files immutable after merge.
3. Reflect major schema changes in `DATABASE_SCHEMA.md` and architecture docs.
