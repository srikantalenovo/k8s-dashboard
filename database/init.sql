-- Users table with RBAC fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "lastLogin" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user
INSERT INTO users (username, email, password, role, permissions)
VALUES (
  'admin',
  'admin@example.com',
  -- Password: Admin@123 (hashed)
  '$2a$12$hBVc638kuWafS5m1fyy.Vu6jBgYlg7ng.H5n51MqZNOynl.iBR/6.',
  'admin',
  '[{"resource": "*", "actions": ["*"]}]'
)
ON CONFLICT (username) DO NOTHING;

-- Create index for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
