-- Seed data for initial prompts
-- Run this SQL after initial migration:
-- psql $DATABASE_URL -f apps/backend/src/modules/prompt/data/seed.sql
--
-- Prompts table seed data
-- All prompts start as 'approved' for demo purposes
-- All prompts are multi-version (is_multi_version = true) for this seed

INSERT INTO prompts (id, title, category, status, base_path, current_version, is_multi_version) VALUES
('11111111-1111-1111-1111-111111111111', 'Professional Email Responder', 'Business Communication', 'approved', 'prompts/1', 1, true),
('22222222-2222-2222-2222-222222222222', 'Blog Post Writer', 'Content Marketing', 'approved', 'prompts/2', 1, true),
('33333333-3333-3333-3333-333333333333', 'Code Commenter', 'Developer Tools', 'approved', 'prompts/3', 1, true),
('44444444-4444-4444-4444-444444444444', 'Meeting Notes', 'Productivity', 'approved', 'prompts/4', 1, true),
('55555555-5555-5555-5555-555555555555', 'Social Media Manager', 'Marketing', 'approved', 'prompts/5', 1, true),
('66666666-6666-6666-6666-666666666666', 'Product Description', 'Product Marketing', 'approved', 'prompts/6', 1, true),
('77777777-7777-7777-7777-777777777777', 'Customer Support Response', 'Customer Success', 'approved', 'prompts/7', 1, true),
('88888888-8888-8888-8888-888888888888', 'FAQ Writer', 'Content Creation', 'approved', 'prompts/8', 1, true),
('99999999-9999-9999-9999-999999999999', 'Press Release', 'Corporate Communications', 'approved', 'prompts/9', 1, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Video Script', 'Video Production', 'approved', 'prompts/10', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Prompt versions seed data
INSERT INTO prompt_versions (id, prompt_id, version_number, needs_grading) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, true),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, true),
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, true),
('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 1, true),
('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 1, true),
('e6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 1, true),
('e7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 1, true),
('e8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 1, true),
('e9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 1, true),
('eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Prompt version files (maps versions to actual files)
INSERT INTO prompt_version_files (id, prompt_version_id, level, file_name) VALUES
-- Prompt 1: Email Responder
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'starter', 'starter.md'),
('f1111112-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111111', 'builder', 'builder.md'),
('f1111113-1111-1111-1111-111111111113', 'e1111111-1111-1111-1111-111111111111', 'pro', 'pro.md'),
('f1111114-1111-1111-1111-111111111114', 'e1111111-1111-1111-1111-111111111111', 'super', 'super.md'),
-- Prompt 2: Blog Post Writer
('f2222221-2222-2222-2222-222222222221', 'e2222222-2222-2222-2222-222222222222', 'starter', 'starter.md'),
('f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'builder', 'builder.md'),
('f2222223-2222-2222-2222-222222222223', 'e2222222-2222-2222-2222-222222222222', 'pro', 'pro.md'),
('f2222224-2222-2222-2222-222222222224', 'e2222222-2222-2222-2222-222222222222', 'super', 'super.md'),
-- Prompt 3: Code Commenter
('f3333331-3333-3333-3333-333333333331', 'e3333333-3333-3333-3333-333333333333', 'starter', 'starter.md'),
('f3333332-3333-3333-3333-333333333332', 'e3333333-3333-3333-3333-333333333333', 'builder', 'builder.md'),
('f3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'pro', 'pro.md'),
('f3333334-3333-3333-3333-333333333334', 'e3333333-3333-3333-3333-333333333333', 'super', 'super.md'),
-- Prompt 4: Meeting Notes
('f4444441-4444-4444-4444-444444444441', 'e4444444-4444-4444-4444-444444444444', 'starter', 'starter.md'),
('f4444442-4444-4444-4444-444444444442', 'e4444444-4444-4444-4444-444444444444', 'builder', 'builder.md'),
('f4444443-4444-4444-4444-444444444443', 'e4444444-4444-4444-4444-444444444444', 'pro', 'pro.md'),
('f4444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444', 'super', 'super.md'),
-- Prompt 5: Social Media
('f5555551-5555-5555-5555-555555555551', 'e5555555-5555-5555-5555-555555555555', 'starter', 'starter.md'),
('f5555552-5555-5555-5555-555555555552', 'e5555555-5555-5555-5555-555555555555', 'builder', 'builder.md'),
('f5555553-5555-5555-5555-555555555553', 'e5555555-5555-5555-5555-555555555555', 'pro', 'pro.md'),
('f5555554-5555-5555-5555-555555555554', 'e5555555-5555-5555-5555-555555555555', 'super', 'super.md'),
-- Prompt 6: Product Description
('f6666661-6666-6666-6666-666666666661', 'e6666666-6666-6666-6666-666666666666', 'starter', 'starter.md'),
('f6666662-6666-6666-6666-666666666662', 'e6666666-6666-6666-6666-666666666666', 'builder', 'builder.md'),
('f6666663-6666-6666-6666-666666666663', 'e6666666-6666-6666-6666-666666666666', 'pro', 'pro.md'),
('f6666664-6666-6666-6666-666666666664', 'e6666666-6666-6666-6666-666666666666', 'super', 'super.md'),
-- Prompt 7: Customer Support
('f7777771-7777-7777-7777-777777777771', 'e7777777-7777-7777-7777-777777777777', 'starter', 'starter.md'),
('f7777772-7777-7777-7777-777777777772', 'e7777777-7777-7777-7777-777777777777', 'builder', 'builder.md'),
('f7777773-7777-7777-7777-777777777773', 'e7777777-7777-7777-7777-777777777777', 'pro', 'pro.md'),
('f7777774-7777-7777-7777-777777777774', 'e7777777-7777-7777-7777-777777777777', 'super', 'super.md'),
-- Prompt 8: FAQ Writer
('f8888881-8888-8888-8888-888888888881', 'e8888888-8888-8888-8888-888888888888', 'starter', 'starter.md'),
('f8888882-8888-8888-8888-888888888882', 'e8888888-8888-8888-8888-888888888888', 'builder', 'builder.md'),
('f8888883-8888-8888-8888-888888888883', 'e8888888-8888-8888-8888-888888888888', 'pro', 'pro.md'),
('f8888884-8888-8888-8888-888888888884', 'e8888888-8888-8888-8888-888888888888', 'super', 'super.md'),
-- Prompt 9: Press Release
('f9999991-9999-9999-9999-999999999991', 'e9999999-9999-9999-9999-999999999999', 'starter', 'starter.md'),
('f9999992-9999-9999-9999-999999999992', 'e9999999-9999-9999-9999-999999999999', 'builder', 'builder.md'),
('f9999993-9999-9999-9999-999999999993', 'e9999999-9999-9999-9999-999999999999', 'pro', 'pro.md'),
('f9999994-9999-9999-9999-999999999994', 'e9999999-9999-9999-9999-999999999999', 'super', 'super.md'),
-- Prompt 10: Video Script
('faaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'starter', 'starter.md'),
('faaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'builder', 'builder.md'),
('faaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pro', 'pro.md'),
('faaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super', 'super.md')
ON CONFLICT (id) DO NOTHING;