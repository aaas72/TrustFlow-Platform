-- Update milestones.status to include all states used by the app
-- Current app uses: pending, funded, in_progress, submitted, revision_requested, approved, rejected, completed

ALTER TABLE `milestones`
  MODIFY COLUMN `status` ENUM(
    'pending',
    'funded',
    'in_progress',
    'submitted',
    'revision_requested',
    'approved',
    'rejected',
    'completed',
    'paid'
  ) NOT NULL DEFAULT 'pending';
