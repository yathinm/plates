CREATE TYPE muscle_group AS ENUM (
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'forearms', 'quads', 'hamstrings', 'glutes', 'calves',
    'abs', 'traps', 'lats', 'full_body'
);

CREATE TYPE exercise_category AS ENUM ('compound', 'isolation', 'cardio', 'bodyweight');

CREATE TABLE exercises (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                 VARCHAR(100) UNIQUE NOT NULL,
    primary_muscle       muscle_group NOT NULL,
    secondary_muscles    muscle_group[] DEFAULT '{}',
    category             exercise_category NOT NULL,
    default_rest_seconds INT NOT NULL DEFAULT 90,
    created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    is_custom            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle   ON exercises (primary_muscle);
CREATE INDEX idx_exercises_category ON exercises (category);
