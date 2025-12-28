-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 06, 2025 at 08:36 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `guven_akisi`
--

-- --------------------------------------------------------

--
-- Table structure for table `bids`
--

CREATE TABLE `bids` (
  `id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `freelancer_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `proposal` text,
  `delivery_time` varchar(50) DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `bids`
--

INSERT INTO `bids` (`id`, `project_id`, `freelancer_id`, `amount`, `proposal`, `delivery_time`, `status`, `created_at`) VALUES
(43, 44, 15, 10000.00, 'Merhaba, projeye katılmak istiyorum. Tahmini bütçe: 10000.', '7 days', 'accepted', '2025-12-06 19:06:15');

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `client_id` int NOT NULL,
  `freelancer_id` int NOT NULL,
  `status` enum('open','flagged','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int NOT NULL,
  `chat_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `content` text NOT NULL,
  `content_type` enum('text','image','file') NOT NULL DEFAULT 'text',
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `milestones`
--

CREATE TABLE `milestones` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(10,2) NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('pending','funded','in_progress','submitted','revision_requested','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `milestones`
--

INSERT INTO `milestones` (`id`, `project_id`, `title`, `description`, `amount`, `deadline`, `status`, `submitted_at`, `approved_at`, `created_at`) VALUES
(33, 44, 'Aşama 1', 'Aşama Açıklaması *\nAşama Açıklaması *\nAşama Açıklaması *\nAşama Açıklaması *\nAşama Açıklaması *\n', 10000.00, '2025-12-26', 'approved', '2025-12-06 19:26:59', '2025-12-06 19:37:08', '2025-12-06 19:26:08');

-- --------------------------------------------------------

--
-- Table structure for table `milestone_attachments`
--

CREATE TABLE `milestone_attachments` (
  `id` int NOT NULL,
  `milestone_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `milestone_attachments`
--

INSERT INTO `milestone_attachments` (`id`, `milestone_id`, `file_name`, `file_path`, `file_type`, `uploaded_at`) VALUES
(12, 33, 'Gemini_Generated_Image_dk1kyndk1kyndk1k.png', 'uploads/milestones/33/1765049219577-50995970-Gemini_Generated_Image_dk1kyndk1kyndk1k.png', 'image/png', '2025-12-06 19:26:59');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `actor_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `milestone_id` int DEFAULT NULL,
  `chat_id` int DEFAULT NULL,
  `chat_message_id` int DEFAULT NULL,
  `bid_id` int DEFAULT NULL,
  `payment_id` int DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `action_required` tinyint(1) NOT NULL DEFAULT '0',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `actor_id`, `project_id`, `milestone_id`, `chat_id`, `chat_message_id`, `bid_id`, `payment_id`, `type`, `title`, `message`, `priority`, `action_required`, `is_read`, `read_at`, `created_at`) VALUES
(154, 14, 15, 44, NULL, NULL, NULL, 43, NULL, 'bid_submitted', 'Projenize yeni teklif', 'Bir serbest çalışan projenize yeni bir teklif verdi', 'medium', 1, 0, NULL, '2025-12-06 19:06:15'),
(155, 15, NULL, 44, NULL, NULL, NULL, 43, NULL, 'bid_accepted', 'Teklifiniz kabul edildi', 'Teklifiniz kabul edildi ve proje başladı', 'high', 0, 0, NULL, '2025-12-06 19:06:33'),
(156, 15, 14, 44, 33, NULL, NULL, NULL, NULL, 'milestone', 'İlk aşama başladı', 'İlk aşama (Aşama 1) başlatıldı.', 'medium', 0, 0, NULL, '2025-12-06 19:26:09'),
(157, 14, 15, 44, 33, NULL, NULL, NULL, NULL, 'milestone_submitted', 'Aşama dosyaları gönderildi', 'Aşama Aşama 1 için dosyalar yüklendi ve gönderildi. Lütfen inceleyin.', 'medium', 1, 0, NULL, '2025-12-06 19:26:59'),
(158, 15, 14, 44, 33, NULL, NULL, NULL, NULL, 'milestone_approved', 'Aşama güncellemesi', 'Aşama Aşama 1 müşteri tarafından onaylandı. Ödeme süreci başlatıldı.', 'medium', 0, 0, NULL, '2025-12-06 19:37:08'),
(159, 15, 14, 44, 33, NULL, NULL, NULL, 28, 'payment_released', 'Ödeme serbest bırakıldı', 'Aşama ödemesi hesabınıza aktarıldı', 'medium', 0, 0, NULL, '2025-12-06 19:37:08'),
(160, 14, 15, 44, 33, NULL, NULL, NULL, 28, 'payment_released', 'Ödeme tamamlandı', 'Bu aşamanın ödemesi tamamlandı', 'low', 0, 0, NULL, '2025-12-06 19:37:08');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `milestone_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed','held','released','refunded') DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `milestone_id`, `amount`, `payment_method`, `transaction_id`, `status`, `paid_at`, `released_at`, `created_at`) VALUES
(28, 33, 10000.00, 'automatic_on_approval', 'auto_pay_33_1765049828182', 'completed', NULL, NULL, '2025-12-06 19:37:08');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open_for_bids',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_bid_id` int DEFAULT NULL,
  `freelancer_id` int DEFAULT NULL,
  `bidding_deadline` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `description`, `budget`, `deadline`, `client_id`, `status`, `created_at`, `accepted_bid_id`, `freelancer_id`, `bidding_deadline`) VALUES
(44, 'Web App', 'Detaylı Proje Açıklaması  Detaylı Proje Açıklaması Detaylı Proje Açıklaması Detaylı Proje Açıklaması Detaylı Proje Açıklaması Detaylı Proje Açıklaması', 10000.00, '2025-12-31', 14, 'in_progress', '2025-12-06 19:05:07', 43, 15, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_plans`
--

CREATE TABLE `project_plans` (
  `project_id` int NOT NULL,
  `plan_json` json NOT NULL,
  `status` enum('submitted','approved','revision_requested') NOT NULL DEFAULT 'submitted',
  `review_note` text,
  `submitted_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_plans`
--

INSERT INTO `project_plans` (`project_id`, `plan_json`, `status`, `review_note`, `submitted_by`, `created_at`, `updated_at`) VALUES
(44, '{\"steps\": [{\"id\": \"1\", \"title\": \"Aşama 1\", \"amount\": 10000, \"endDate\": \"2025-12-27\", \"startDate\": \"2025-12-07\", \"description\": \"Aşama Açıklaması *\\nAşama Açıklaması *\\nAşama Açıklaması *\\nAşama Açıklaması *\\nAşama Açıklaması *\\n\", \"deliverables\": [\"e\"], \"estimatedDays\": 20}], \"summary\": \"Plan Türü: Plan Türü\\nPlan Adı: Plan Adı\\nToplam Tahmini Süre (Gün): 45\\nHedefler: \\nKapsam: \\nBaşarı Kriterleri: \\nGenel Açıklama: Planın Genel Açıklaması\"}', 'approved', NULL, 15, '2025-12-06 19:08:11', '2025-12-06 19:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `project_skills`
--

CREATE TABLE `project_skills` (
  `project_id` int NOT NULL,
  `skill_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `project_skills`
--

INSERT INTO `project_skills` (`project_id`, `skill_id`) VALUES
(44, 1),
(44, 2),
(44, 4),
(44, 60),
(44, 61),
(44, 70),
(44, 85),
(44, 92),
(44, 98);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `reviewee_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `name`) VALUES
(11, 'Angular'),
(98, 'CI/CD'),
(5, 'CSS'),
(14, 'Dijital Pazarlama'),
(12, 'Django'),
(103, 'Docker'),
(134, 'ertgfdfdg'),
(60, 'Express'),
(13, 'Grafik Tasarım'),
(92, 'GraphQL'),
(6, 'HTML'),
(23, 'İçerik Yazımı'),
(24, 'JavaScript'),
(135, 'Jest'),
(21, 'Laravel'),
(85, 'MongoDB'),
(3, 'MySQL'),
(2, 'Node.js'),
(19, 'PHP'),
(61, 'PostgreSQL'),
(8, 'Python'),
(1, 'React'),
(70, 'TailwindCSS'),
(4, 'TypeScript'),
(34, 'UI/UX Tasarım'),
(121, 'web'),
(35, 'Web Development');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `type` enum('deposit','release','refund','fee','withdrawal') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('client','freelancer','admin') NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `user_type`, `balance`, `created_at`) VALUES
(14, 'Client', 'client@example.com', '$2a$10$U228SNL7ABLaMn3mWEdddOoPJI8wWnqk4a59CVInnAdeeHA53CTJG', 'client', 0.00, '2025-12-06 13:24:22'),
(15, 'freelancer', 'freelancer@example.com', '$2a$10$uApJx7PAI.C9uYw0VxaYtexKK/7SyN1pVE56if5YMEqGq0qZW8JpW', 'freelancer', 0.00, '2025-12-06 13:28:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bids`
--
ALTER TABLE `bids`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uc_project_freelancer` (`project_id`,`freelancer_id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `freelancer_id` (`freelancer_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_project_chat` (`project_id`),
  ADD KEY `fk_chats_client` (`client_id`),
  ADD KEY `fk_chats_freelancer` (`freelancer_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_messages_sender` (`sender_id`),
  ADD KEY `idx_chat_created` (`chat_id`,`created_at`);

--
-- Indexes for table `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_project_title` (`project_id`,`title`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `milestone_attachments`
--
ALTER TABLE `milestone_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `milestone_id` (`milestone_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notifications_user` (`user_id`),
  ADD KEY `fk_notifications_actor` (`actor_id`),
  ADD KEY `fk_notifications_project` (`project_id`),
  ADD KEY `fk_notifications_milestone` (`milestone_id`),
  ADD KEY `fk_notifications_chat` (`chat_id`),
  ADD KEY `fk_notifications_chat_message` (`chat_message_id`),
  ADD KEY `fk_notifications_bid` (`bid_id`),
  ADD KEY `fk_notifications_payment` (`payment_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `milestone_id` (`milestone_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `fk_projects_freelancer` (`freelancer_id`);

--
-- Indexes for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD PRIMARY KEY (`project_id`);

--
-- Indexes for table `project_skills`
--
ALTER TABLE `project_skills`
  ADD PRIMARY KEY (`project_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_project_reviewer` (`project_id`,`reviewer_id`),
  ADD KEY `fk_reviews_reviewer` (`reviewer_id`),
  ADD KEY `fk_reviews_reviewee` (`reviewee_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bids`
--
ALTER TABLE `bids`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `milestones`
--
ALTER TABLE `milestones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `milestone_attachments`
--
ALTER TABLE `milestone_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bids`
--
ALTER TABLE `bids`
  ADD CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `fk_chats_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_chats_freelancer` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_chats_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`),
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `fk_milestones_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `milestone_attachments`
--
ALTER TABLE `milestone_attachments`
  ADD CONSTRAINT `fk_attachments_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `milestone_attachments_ibfk_1` FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_bid` FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_chat_message` FOREIGN KEY (`chat_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_freelancer` FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD CONSTRAINT `fk_project_plans_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_skills`
--
ALTER TABLE `project_skills`
  ADD CONSTRAINT `project_skills_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `fk_reviews_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
