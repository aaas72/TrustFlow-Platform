-- Ensure referential integrity and uniqueness across milestones and attachments
-- 1) Add FK: milestones.project_id -> projects(id)
-- 2) Add FK: milestone_attachments.milestone_id -> milestones(id)
-- 3) Add unique constraint: milestones(project_id, title)

-- Add foreign key from milestones to projects (cascade delete)
ALTER TABLE `milestones`
  ADD CONSTRAINT `fk_milestones_project`
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE;

-- Prevent duplicate milestone titles within the same project
ALTER TABLE `milestones`
  ADD UNIQUE KEY `uniq_project_title` (`project_id`, `title`);

-- Add foreign key from milestone_attachments to milestones (cascade delete)
ALTER TABLE `milestone_attachments`
  ADD CONSTRAINT `fk_attachments_milestone`
    FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE CASCADE;

-- Notes:
-- - If existing duplicate milestone titles exist per project, this migration may fail.
--   Deduplicate before applying or rename duplicates.
-- - Requires that tables already exist per initial schema.

