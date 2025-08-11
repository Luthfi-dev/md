
-- This file is for documentation purposes and to keep track of the database schema.
-- It is not executed automatically.

CREATE TABLE `users` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT(11) NOT NULL,
  `status` ENUM('active', 'deactivated', 'blocked') NOT NULL DEFAULT 'active',
  `avatar_url` VARCHAR(255) NULL,
  `phone_number` VARCHAR(255) NULL, -- Encrypted
  `points` VARCHAR(255) NULL DEFAULT NULL, -- Encrypted
  `referral_code` VARCHAR(255) NULL,
  `browser_fingerprint` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `user_id` BIGINT(20) NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `login_history` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `login_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `referrals` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `referrer_id` BIGINT(20) NOT NULL,
  `referred_id` BIGINT(20) NOT NULL,
  `status` ENUM('valid', 'invalid', 'pending') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notes` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `uuid` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC),
  INDEX `idx_user_id` (`user_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `note_items` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `note_id` BIGINT(20) UNSIGNED NOT NULL,
  `uuid` VARCHAR(36) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC),
  INDEX `fk_note_items_note_id_idx` (`note_id` ASC),
  CONSTRAINT `fk_note_items_note_id`
    FOREIGN KEY (`note_id`)
    REFERENCES `notes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tables for Group Notebooks
CREATE TABLE `note_groups` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `avatar_url` VARCHAR(255) NULL,
  `created_by` BIGINT(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `group_members` (
  `group_id` BIGINT(20) NOT NULL,
  `user_id` BIGINT(20) NOT NULL,
  `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `group_tasks` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT(20) NOT NULL,
  `uuid` VARCHAR(36) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` BIGINT(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC),
  CONSTRAINT `fk_task_group_id`
    FOREIGN KEY (`group_id`)
    REFERENCES `note_groups` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `group_task_items` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT(20) NOT NULL,
  `uuid` VARCHAR(36) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC),
  INDEX `idx_task_id` (`task_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `group_task_assignees` (
  `task_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tables for Digital Wallet
CREATE TABLE `transaction_categories` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `icon` VARCHAR(50) NULL DEFAULT 'Package',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `category_id` BIGINT(20) UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `description` VARCHAR(255) NULL,
  `transaction_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id` ASC),
  INDEX `idx_category_id` (`category_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budgets` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `category_id` BIGINT(20) UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `month` VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_category_month_unique` (`user_id` ASC, `category_id` ASC, `month` ASC),
  INDEX `idx_user_month` (`user_id` ASC, `month` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default categories (user_id IS NULL means they are for everyone)
INSERT INTO `transaction_categories` (`user_id`, `name`, `type`, `icon`) VALUES
(NULL, 'Gaji', 'income', 'Landmark'),
(NULL, 'Hadiah', 'income', 'Gift'),
(NULL, 'Investasi', 'income', 'TrendingUp'),
(NULL, 'Lainnya', 'income', 'Package'),
(NULL, 'Makanan & Minuman', 'expense', 'Utensils'),
(NULL, 'Transportasi', 'expense', 'Car'),
(NULL, 'Tagihan & Utilitas', 'expense', 'Receipt'),
(NULL, 'Belanja', 'expense', 'ShoppingCart'),
(NULL, 'Hiburan', 'expense', 'Ticket'),
(NULL, 'Kesehatan', 'expense', 'HeartPulse'),
(NULL, 'Pendidikan', 'expense', 'BookOpen'),
(NULL, 'Keluarga', 'expense', 'Home'),
(NULL, 'Lainnya', 'expense', 'Package');
