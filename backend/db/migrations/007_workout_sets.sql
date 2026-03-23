CREATE TABLE workout_sets (
    id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
    workout_id   UUID        NOT NULL,
    exercise_id  UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number   SMALLINT    NOT NULL,
    weight_kg    NUMERIC(6,2),
    reps         SMALLINT,
    rpe          NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10),
    rir          SMALLINT     CHECK (rir >= 0 AND rir <= 10),
    duration_sec INT,
    rest_sec     INT,
    video_url    TEXT,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, performed_at)
);

-- TimescaleDB hypertable: this is the heaviest write table in the system
SELECT create_hypertable('workout_sets', 'performed_at');

CREATE INDEX idx_sets_workout  ON workout_sets (workout_id, performed_at DESC);
CREATE INDEX idx_sets_exercise ON workout_sets (exercise_id, performed_at DESC);
