-- 1. Add balance to users table
ALTER TABLE `users` ADD COLUMN `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `user_type`;

-- 2. Modify payments table to support status 'held'
ALTER TABLE `payments` MODIFY COLUMN `status` ENUM('pending', 'completed', 'failed', 'held', 'released', 'refunded') DEFAULT 'pending';

-- 3. Add released_at to payments
ALTER TABLE `payments` ADD COLUMN `released_at` TIMESTAMP NULL DEFAULT NULL AFTER `paid_at`;

-- 4. Create transactions table for detailed ledger
CREATE TABLE `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL, -- NULL for platform system transactions
  `type` ENUM('deposit', 'release', 'refund', 'fee', 'withdrawal') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `description` VARCHAR(255) NULL,
  `reference_id` INT NULL, -- e.g., payment_id or milestone_id
  `reference_type` VARCHAR(50) NULL, -- 'payment', 'milestone'
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
