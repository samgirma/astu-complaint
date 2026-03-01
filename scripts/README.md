# ASTU Complaint System - Scripts

This directory contains utility scripts for running and managing the ASTU Complaint System.

## Available Scripts

### 🚀 run-test.sh
Runs the production Docker Compose configuration in attach mode using environment variables from `server/.env`.

**Usage:**
```bash
./scripts/run-test.sh
```

**Features:**
- Loads environment variables from `server/.env`
- Runs `docker compose up --build --force-recreate`
- Attaches to container logs
- Graceful shutdown on Ctrl+C
- Color-coded output for better visibility

### 🛠️ run-dev.sh
Runs the development Docker Compose configuration in attach mode using environment variables from `server/.env`.

**Usage:**
```bash
./scripts/run-dev.sh
```

**Features:**
- Loads environment variables from `server/.env`
- Uses `docker-compose.dev.yml` if available, falls back to `docker-compose.yml`
- Sets `NODE_ENV=development`
- Runs `docker compose up --build --force-recreate`
- Attaches to container logs
- Graceful shutdown on Ctrl+C

## Prerequisites

1. **Docker** must be installed and running
2. **Docker Compose v2** must be available (docker compose command)
3. **server/.env** file must exist with proper environment variables

## Environment Variables

The scripts automatically load all required environment variables from `server/.env`:

```bash
# Database
DATABASE_NAME=astu_complaints
DATABASE_USER=astu_user
DATABASE_PASSWORD=your-secure-database-password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-api-key
EMAIL_FROM=noreply@astu.edu.et

# Redis
REDIS_PASSWORD=your-redis-password-optional

# External Services
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Frontend
FRONTEND_URL=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Usage Examples

### Running Production Test
```bash
# Make sure server/.env is configured
cd /home/h4k3r/dev/stem_project
./scripts/run-test.sh
```

### Running Development Environment
```bash
# Make sure server/.env is configured
cd /home/h4k3r/dev/stem_project
./scripts/run-dev.sh
```

## Troubleshooting

### Docker Not Running
```
❌ Error: Docker is not running
Please start Docker and try again
```
**Solution:** Start Docker Desktop or Docker daemon

### Missing Environment File
```
❌ Error: server/.env file not found
Please create server/.env with your environment variables
```
**Solution:** Copy `.env.production` to `server/.env` and fill in values

### Docker Compose Not Found
```
❌ Error: docker compose is not available
Please install Docker Compose v2 or update Docker Desktop
```
**Solution:** Install Docker Compose v2 following official documentation

## Signal Handling

Both scripts handle the following signals gracefully:
- **SIGINT** (Ctrl+C): Stops all containers and exits
- **SIGTERM**: Stops all containers and exits

## Output Colors

The scripts use color-coded output:
- 🔵 **Blue**: Information messages
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings and file paths
- 🔴 **Red**: Error messages

## Customization

You can modify the scripts to:
- Change the compose file path
- Add additional environment variables
- Modify startup commands
- Add health checks

## Logging

All container logs are displayed in the terminal when running in attach mode. You can:
- View logs from all services
- Follow specific service logs
- Use Ctrl+C to stop and cleanup

## Development vs Production

- **Development**: Uses `docker-compose.dev.yml`, sets `NODE_ENV=development`
- **Production**: Uses `docker-compose.yml`, sets `NODE_ENV=production`

Both modes load the same environment variables from `server/.env`.
