-- Ensure admin user exists
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin'
   ) THEN
      CREATE USER admin WITH PASSWORD 'admin123';
   END IF;
END
$$;

-- Ensure grepmind database exists and owned by admin
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'grepmind'
   ) THEN
      CREATE DATABASE grepmind OWNER admin;
   END IF;
END
$$;

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE grepmind TO admin;

-- Connect to grepmind
\connect grepmind

-- Ensure role_enum type exists (ENUM for RBAC roles)
DO
$$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
      CREATE TYPE role_enum AS ENUM ('admin', 'editor', 'viewer');
   END IF;
END
$$;

-- Create lowercase users table with RBAC fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "lastLogin" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE,
    role role_enum DEFAULT 'viewer', -- ✅ ENUM type matches Sequelize
    permissions JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user if not exists
INSERT INTO users (username, email, password, role, permissions)
VALUES (
  'admin',
  'admin@example.com',
  -- Password: Admin@123 (hashed)
  '$2b$10$ni1/GpqCU46ygraE8eXoGuP42W9ijO7FcKD43D21Sk/k4GuDp/so.',
  'admin',
  '[{"resource": "*", "actions": ["*"]}]'
)
ON CONFLICT (username) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Ensure privileges on schema objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- Default privileges for future tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO admin;
