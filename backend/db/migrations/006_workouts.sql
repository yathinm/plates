CREATE TABLE workouts (
    id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id  UUID        REFERENCES routines(id) ON DELETE SET NULL,
    name        VARCHAR(100),
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    notes       TEXT,
    PRIMARY KEY (id, started_at)
);

-- TimescaleDB hypertable: partitions rows by started_at in 7-day chunks
SELECT create_hypertable('workouts', 'started_at');

CREATE INDEX idx_workouts_user ON workouts (user_id, started_at DESC);
