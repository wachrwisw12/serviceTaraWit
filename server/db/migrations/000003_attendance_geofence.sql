-- Geofence settings and audit data for attendance.
ALTER TABLE attendance_settings
    ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_location_accuracy_m DOUBLE PRECISION NOT NULL DEFAULT 100
        CHECK (max_location_accuracy_m > 0 AND max_location_accuracy_m <= 5000);

CREATE TABLE IF NOT EXISTS attendance_locations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    radius_m DOUBLE PRECISION NOT NULL CHECK (radius_m > 0 AND radius_m <= 50000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_group_members (
    group_id BIGINT NOT NULL REFERENCES attendance_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_group_members_user
    ON attendance_group_members(user_id);

CREATE TABLE IF NOT EXISTS attendance_outside_user_permissions (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_outside_group_permissions (
    group_id BIGINT PRIMARY KEY REFERENCES attendance_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS check_in_latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_accuracy_m DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_distance_m DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_in_location_id BIGINT REFERENCES attendance_locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS check_in_inside_area BOOLEAN,
    ADD COLUMN IF NOT EXISTS check_in_outside_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS check_out_latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_accuracy_m DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_distance_m DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS check_out_location_id BIGINT REFERENCES attendance_locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS check_out_inside_area BOOLEAN,
    ADD COLUMN IF NOT EXISTS check_out_outside_allowed BOOLEAN NOT NULL DEFAULT FALSE;
