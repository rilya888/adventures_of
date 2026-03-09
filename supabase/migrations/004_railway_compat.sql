-- Railway compatibility: remove Supabase Auth dependency
-- Run after 001, 002, 003 on Railway Postgres

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;
DROP INDEX IF EXISTS idx_users_auth;
ALTER TABLE public.users ALTER COLUMN auth_user_id DROP NOT NULL;
