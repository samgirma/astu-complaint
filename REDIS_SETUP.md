# Redis Setup for ASTU Complaint System

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Start Redis Container:**
   ```bash
   docker compose -f docker-compose.redis.yml up -d
   ```

2. **Verify Redis is Running:**
   ```bash
   docker exec astu-redis redis-cli ping
   # Should return: PONG
   ```

3. **Check Redis Status:**
   ```bash
   docker exec astu-redis redis-cli info
   ```

### Using the Start Script

```bash
./scripts/start-redis.sh
```

## 📋 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### Docker Compose Services

The Redis container is configured with:

- **Image**: `redis:7-alpine`
- **Port**: `6379:6379`
- **Persistence**: AOF (Append Only File) enabled
- **Volume**: `redis_data` for data persistence
- **Network**: `astu-network` for service communication

## 🔧 Redis Schema for OTP System

### Data Structure

```
otp:[email]              # 6-digit code, 10-minute TTL
attempts:[email]         # Failed attempt counter, 24-hour TTL
resend_cooldown:[email]  # 60-second resend protection
```

### Example Keys

```
otp:user@astu.edu.et           → "123456"
attempts:user@astu.edu.et      → "2"
resend_cooldown:user@astu.edu.et → "blocked"
```

## 🛡️ Security Features

### Rate Limiting

- **3 Attempts Maximum**: Block after 3 failed attempts
- **24-Hour Ban**: Automatic suspension after limit exceeded
- **60-Second Cooldown**: Prevent immediate OTP resending
- **Automatic Cleanup**: TTL-based expiration prevents memory bloat

### TTL Configuration

```
OTP Code:        10 minutes (600 seconds)
Failed Attempts: 24 hours (86400 seconds)
Resend Cooldown: 60 seconds
```

## 📊 Monitoring

### Check Redis Data

```bash
# List all keys
docker exec astu-redis redis-cli keys "*"

# Get specific OTP
docker exec astu-redis redis-cli get "otp:user@astu.edu.et"

# Check attempts
docker exec astu-redis redis-cli get "attempts:user@astu.edu.et"

# Check TTL
docker exec astu-redis redis-cli ttl "otp:user@astu.edu.et"
```

### Monitor Redis Performance

```bash
# Redis info
docker exec astu-redis redis-cli info

# Memory usage
docker exec astu-redis redis-cli info memory

# Connected clients
docker exec astu-redis redis-cli info clients
```

## 🔄 Development Workflow

### Start Development Environment

1. **Start Redis:**
   ```bash
   docker compose -f docker-compose.redis.yml up -d
   ```

2. **Start Backend:**
   ```bash
   cd server && npm run dev
   ```

3. **Start Frontend:**
   ```bash
   cd client && npm run dev
   ```

### Production Deployment

Use the main docker-compose.yml:

```bash
docker compose up -d
```

This includes:
- PostgreSQL database
- Redis for OTP/caching
- Backend server
- Frontend application
- Nginx reverse proxy

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed:**
   ```bash
   # Check if Redis is running
   docker ps | grep astu-redis
   
   # Check Redis logs
   docker logs astu-redis
   ```

2. **Permission Denied:**
   ```bash
   # Make sure script is executable
   chmod +x scripts/start-redis.sh
   ```

3. **Port Already in Use:**
   ```bash
   # Check what's using port 6379
   lsof -i :6379
   
   # Stop Redis container
   docker compose -f docker-compose.redis.yml down
   ```

### Reset Redis Data

```bash
# Clear all data
docker exec astu-redis redis-cli flushall

# Restart container
docker compose -f docker-compose.redis.yml restart
```

## 📈 Performance Tips

1. **Memory Optimization:**
   - Monitor memory usage: `docker exec astu-redis redis-cli info memory`
   - Set appropriate maxmemory in production
   - Use Redis eviction policies if needed

2. **Persistence:**
   - AOF is enabled for durability
   - Backups: `docker exec astu-redis redis-cli bgrewriteaof`
   - Monitor disk space usage

3. **Network:**
   - Use dedicated Redis network in production
   - Enable TLS for secure connections
   - Configure firewall rules appropriately

## 🔗 Integration

### Backend Integration

The OTP service automatically connects to Redis using the configured environment variables:

```javascript
// server/services/otpService.js
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});
```

### API Endpoints

- `POST /api/auth/otp/send-otp` - Send OTP to email
- `POST /api/auth/otp/verify-otp` - Verify OTP code
- `GET /api/auth/otp-status` - Check OTP status

## 📞 Support

For Redis-related issues:
1. Check container logs: `docker logs astu-redis`
2. Verify network connectivity
3. Check environment variables
4. Monitor system resources (memory, disk space)
