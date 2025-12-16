#!/bin/bash
# PostgreSQL Database Setup Script

set -e

echo "🐘 Setting up PostgreSQL database..."

# Variables
DB_NAME="protego"
DB_USER="protego_user"
DB_PASSWORD="$(openssl rand -base64 32)"

echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;

EOF

echo "✅ Database setup complete!"
echo ""
echo "Database credentials:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo "Update your .env file with:"
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
