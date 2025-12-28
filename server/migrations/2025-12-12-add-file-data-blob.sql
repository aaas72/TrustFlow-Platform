ALTER TABLE `milestone_attachments` ADD COLUMN `file_data` LONGBLOB NULL;
ALTER TABLE `milestone_attachments` MODIFY COLUMN `file_path` VARCHAR(255) NULL;
