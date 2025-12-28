-- Create table to store per-project plan JSON and status
CREATE TABLE IF NOT EXISTS project_plans (
  project_id INT NOT NULL PRIMARY KEY,
  plan_json JSON NOT NULL,
  status ENUM('submitted','approved','revision_requested') NOT NULL DEFAULT 'submitted',
  review_note TEXT NULL,
  submitted_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_plans_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

