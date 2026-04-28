-- Clean seed data - let DB generate UUIDs

-- Insert prompts
INSERT INTO prompts (title, category, status, base_path, current_version, is_multi_version) VALUES
('Professional Email Responder', 'Business Communication', 'approved', 'prompts/1', 1, true),
('Blog Post Writer', 'Content Marketing', 'approved', 'prompts/2', 1, true),
('Code Commenter', 'Developer Tools', 'approved', 'prompts/3', 1, true),
('Meeting Notes', 'Productivity', 'approved', 'prompts/4', 1, true),
('Social Media Manager', 'Marketing', 'approved', 'prompts/5', 1, true),
('Product Description', 'Product Marketing', 'approved', 'prompts/6', 1, true),
('Customer Support Response', 'Customer Success', 'approved', 'prompts/7', 1, true),
('FAQ Writer', 'Content Creation', 'approved', 'prompts/8', 1, true),
('Press Release', 'Corporate Communications', 'approved', 'prompts/9', 1, true),
('Video Script', 'Video Production', 'approved', 'prompts/10', 1, true);

-- Insert versions (one per prompt)
INSERT INTO prompt_versions (prompt_id, version_number, needs_grading)
SELECT id, 1, false FROM prompts;

-- Insert version files (4 per prompt version) with explicit cast
INSERT INTO prompt_version_files (prompt_version_id, level, file_name)
SELECT pv.id, pv.level::prompt_level, pv.file_name
FROM (
  SELECT pv.id, 'starter' as level, 'starter.md' as file_name FROM prompt_versions pv
  UNION ALL
  SELECT pv.id, 'builder', 'builder.md' FROM prompt_versions pv
  UNION ALL
  SELECT pv.id, 'pro', 'pro.md' FROM prompt_versions pv
  UNION ALL
  SELECT pv.id, 'super', 'super.md' FROM prompt_versions pv
) pv;