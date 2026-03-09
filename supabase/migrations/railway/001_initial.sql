-- Railway: Initial schema (no Supabase Auth dependency)
-- Run this instead of 001, 002, 003 when deploying to Railway

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  email TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_band TEXT NOT NULL CHECK (age_band IN ('4-6', '7-9')),
  interests TEXT[] DEFAULT '{}',
  favorites TEXT[] DEFAULT '{}',
  fears_to_avoid TEXT[] DEFAULT '{}',
  reading_preference TEXT,
  gender TEXT,
  pronouns TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('generation', 'marketing_demo')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  proof_event_id TEXT,
  text_version TEXT
);

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('photo', 'generated_image')),
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  job_id UUID,
  beat_id TEXT,
  page_index INT,
  storage_path TEXT NOT NULL,
  cdn_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  retention_until TIMESTAMPTZ
);

CREATE TYPE job_type AS ENUM ('preview', 'full');
CREATE TYPE job_status AS ENUM ('queued', 'generating', 'assembling', 'ready', 'failed', 'cancelled');

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  blueprint_snapshot JSONB,
  photo_asset_ids UUID[] DEFAULT '{}',
  preview_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  parent_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  progress JSONB DEFAULT '{}',
  error TEXT,
  failed_at_beat_id TEXT,
  story_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.assets ADD CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  version INT DEFAULT 1,
  age_bands TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  blueprint JSONB NOT NULL,
  title TEXT NOT NULL,
  beats JSONB NOT NULL DEFAULT '[]',
  reading_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.jobs ADD CONSTRAINT fk_story FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE SET NULL;

CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID,
  asset_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_provider_id TEXT,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.books ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status payment_status NOT NULL DEFAULT 'pending',
  provider_payment_id TEXT,
  amount_cents INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX idx_jobs_idempotency ON public.jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_assets_owner ON public.assets(owner_user_id);
CREATE INDEX idx_children_user ON public.children(user_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
