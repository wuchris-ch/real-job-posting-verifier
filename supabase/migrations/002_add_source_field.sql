-- Add source field to track where jobs came from
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source text;

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
