-- This file contains the schema for tables that might need to be created manually.

-- Table for linking tasks to assigned users in a group notebook.
CREATE TABLE `group_task_assignees` (
  `task_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
