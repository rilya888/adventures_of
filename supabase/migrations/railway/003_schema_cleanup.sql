-- Schema cleanup: indexes for common queries
-- Worker polls: jobs WHERE status = 'queued' ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON public.jobs(status, created_at) WHERE status = 'queued';

-- Consents by user (export, consent checks)
CREATE INDEX IF NOT EXISTS idx_consents_user ON public.consents(user_id);

-- Stories by job (job completion flow)
CREATE INDEX IF NOT EXISTS idx_stories_job ON public.stories(job_id);

-- Books by story (order/checkout flow)
CREATE INDEX IF NOT EXISTS idx_books_story ON public.books(story_id);

-- Payments by order (refund flow)
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
