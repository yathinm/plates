CREATE TABLE routines (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    is_public      BOOLEAN NOT NULL DEFAULT FALSE,
    forked_from_id UUID REFERENCES routines(id) ON DELETE SET NULL,
    fork_count     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE routine_exercises (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id   UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id  UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    position     INT NOT NULL,
    target_sets  INT NOT NULL DEFAULT 3,
    target_reps  INT NOT NULL DEFAULT 10,
    notes        TEXT,
    UNIQUE (routine_id, position)
);

CREATE INDEX idx_routines_user   ON routines (user_id);
CREATE INDEX idx_routines_public ON routines (is_public) WHERE is_public = TRUE;
CREATE INDEX idx_routine_ex_routine ON routine_exercises (routine_id);
