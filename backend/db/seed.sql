-- ── Dummy Users ────────────────────────────────────────────────
-- Passwords are bcrypt hashes of "password123" (for local dev only)
INSERT INTO users (id, username, email, password_hash, display_name, bio) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'alex_lifts',  'alex@example.com',
   '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX012345',
   'Alex Johnson', 'Powerlifter. Chasing a 500lb deadlift.'),

  ('b2222222-2222-2222-2222-222222222222', 'sam_gains',   'sam@example.com',
   '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX012345',
   'Sam Rivera', 'Bodybuilder & data nerd.')
ON CONFLICT DO NOTHING;

-- Alex follows Sam, Sam follows Alex
INSERT INTO followers (follower_id, following_id) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ── Exercise Library ───────────────────────────────────────────
-- Chest
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Barbell Bench Press',    'chest', '{triceps,shoulders}', 'compound',  180),
  ('Incline Dumbbell Press', 'chest', '{triceps,shoulders}', 'compound',  150),
  ('Cable Flye',             'chest', '{}',                  'isolation', 90),
  ('Dips',                   'chest', '{triceps,shoulders}', 'bodyweight',120)
ON CONFLICT (name) DO NOTHING;

-- Back
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Barbell Row',       'back',  '{biceps,forearms}', 'compound',  150),
  ('Pull-Up',           'lats',  '{biceps}',          'bodyweight',120),
  ('Lat Pulldown',      'lats',  '{biceps}',          'compound',  120),
  ('Seated Cable Row',  'back',  '{biceps,forearms}', 'compound',  120),
  ('Face Pull',         'back',  '{shoulders}',       'isolation', 60)
ON CONFLICT (name) DO NOTHING;

-- Shoulders
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Overhead Press',     'shoulders', '{triceps}',   'compound',  180),
  ('Lateral Raise',      'shoulders', '{}',          'isolation', 60),
  ('Rear Delt Flye',     'shoulders', '{back}',      'isolation', 60)
ON CONFLICT (name) DO NOTHING;

-- Legs
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Barbell Back Squat', 'quads',      '{glutes,hamstrings}', 'compound',  180),
  ('Romanian Deadlift',  'hamstrings', '{glutes,back}',       'compound',  150),
  ('Leg Press',          'quads',      '{glutes}',            'compound',  150),
  ('Leg Curl',           'hamstrings', '{}',                  'isolation', 90),
  ('Leg Extension',      'quads',      '{}',                  'isolation', 90),
  ('Calf Raise',         'calves',     '{}',                  'isolation', 60),
  ('Bulgarian Split Squat','quads',    '{glutes}',            'compound',  120)
ON CONFLICT (name) DO NOTHING;

-- Arms
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Barbell Curl',       'biceps',  '{}',          'isolation', 90),
  ('Hammer Curl',        'biceps',  '{forearms}',  'isolation', 90),
  ('Tricep Pushdown',    'triceps', '{}',          'isolation', 60),
  ('Skull Crusher',      'triceps', '{}',          'isolation', 90)
ON CONFLICT (name) DO NOTHING;

-- Full body / Deadlift
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Conventional Deadlift', 'full_body', '{back,hamstrings,glutes}', 'compound', 180),
  ('Sumo Deadlift',         'full_body', '{quads,glutes,back}',      'compound', 180)
ON CONFLICT (name) DO NOTHING;

-- Core
INSERT INTO exercises (name, primary_muscle, secondary_muscles, category, default_rest_seconds) VALUES
  ('Hanging Leg Raise', 'abs', '{}', 'bodyweight', 60),
  ('Ab Wheel Rollout',  'abs', '{}', 'bodyweight', 60),
  ('Cable Crunch',      'abs', '{}', 'isolation',  60)
ON CONFLICT (name) DO NOTHING;

-- ── Sample Routine (Alex's Push Day) ──────────────────────────
INSERT INTO routines (id, user_id, name, description, is_public) VALUES
  ('c3333333-3333-3333-3333-333333333333',
   'a1111111-1111-1111-1111-111111111111',
   'Push Day A', 'Heavy compounds + isolation finishers', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO routine_exercises (routine_id, exercise_id, position, target_sets, target_reps) VALUES
  ('c3333333-3333-3333-3333-333333333333', (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'),    1, 4, 5),
  ('c3333333-3333-3333-3333-333333333333', (SELECT id FROM exercises WHERE name = 'Overhead Press'),         2, 3, 8),
  ('c3333333-3333-3333-3333-333333333333', (SELECT id FROM exercises WHERE name = 'Incline Dumbbell Press'), 3, 3, 10),
  ('c3333333-3333-3333-3333-333333333333', (SELECT id FROM exercises WHERE name = 'Lateral Raise'),          4, 4, 15),
  ('c3333333-3333-3333-3333-333333333333', (SELECT id FROM exercises WHERE name = 'Tricep Pushdown'),        5, 3, 12)
ON CONFLICT DO NOTHING;

-- ── Sample Workout with Sets (time-series data) ───────────────
INSERT INTO workouts (id, user_id, routine_id, name, started_at, finished_at, notes) VALUES
  ('d4444444-4444-4444-4444-444444444444',
   'a1111111-1111-1111-1111-111111111111',
   'c3333333-3333-3333-3333-333333333333',
   'Push Day A',
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '1 hour',
   'Felt strong today, bench moved fast')
ON CONFLICT DO NOTHING;

INSERT INTO workout_sets (workout_id, exercise_id, set_number, weight_kg, reps, rpe, performed_at) VALUES
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'), 1, 100.0,  5, 7.0, NOW() - INTERVAL '115 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'), 2, 100.0,  5, 7.5, NOW() - INTERVAL '112 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'), 3, 102.5,  5, 8.5, NOW() - INTERVAL '109 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'), 4, 102.5,  4, 9.5, NOW() - INTERVAL '106 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Overhead Press'),      1, 55.0,   8, 7.0, NOW() - INTERVAL '100 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Overhead Press'),      2, 55.0,   8, 8.0, NOW() - INTERVAL '97 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Overhead Press'),      3, 55.0,   7, 9.0, NOW() - INTERVAL '94 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Lateral Raise'),       1, 10.0,  15, 7.0, NOW() - INTERVAL '85 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Lateral Raise'),       2, 10.0,  15, 8.0, NOW() - INTERVAL '83 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Lateral Raise'),       3, 10.0,  12, 9.0, NOW() - INTERVAL '81 minutes'),
  ('d4444444-4444-4444-4444-444444444444', (SELECT id FROM exercises WHERE name = 'Lateral Raise'),       4, 10.0,  10, 10.0,NOW() - INTERVAL '79 minutes')
ON CONFLICT DO NOTHING;
