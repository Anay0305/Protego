# Docker Frontend Fix - Rollup Binary Issue

## Problem
Frontend Docker container was failing with:
```
Error: Cannot find module @rollup/rollup-linux-x64-musl
Error relocating .../rollup.linux-x64-musl.node: RELRO protection failed
```

This occurs because:
- **Alpine** uses `musl` libc (lightweight but has binary compatibility issues)
- **Vite/Rollup** native binaries compiled for Alpine musl sometimes fail
- `npm install` may download incompatible pre-built binaries

## Solution

### Changed
**Before:**
```dockerfile
FROM node:20-alpine
RUN npm install
```

**After:**
```dockerfile
FROM node:20-slim
RUN npm ci && npm cache clean --force
```

### Why This Works

1. **node:20-slim** 
   - Uses Debian (glibc) instead of Alpine (musl)
   - Better binary compatibility with native modules
   - Only ~150MB vs Alpine (~90MB) - minimal size difference

2. **npm ci** (clean install)
   - Uses exact versions from package-lock.json
   - More reliable for Docker builds
   - Prevents version conflicts

3. **npm cache clean --force**
   - Removes npm cache to reduce image size
   - Ensures no cached corrupted binaries

## Rebuild Instructions

```bash
# Stop all containers
docker-compose down

# Clean up Docker artifacts
docker system prune -f

# Rebuild with new Dockerfile
docker-compose up --build
```

Or rebuild just the frontend:
```bash
docker-compose up --build protego_frontend
```

## Verification

After build completes, you should see:
```
protego_frontend  | ✓ 1758 modules transformed.
protego_frontend  | ✓ built in 1.95s
protego_frontend  | 
protego_frontend  | ➜ Local: http://localhost:5173/
```

## Alternative Solutions

If issue persists:

### Option 1: Manual Rebuild Locally
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Option 2: Use Official Node Alpine
If you need Alpine for size, use the official node:20-alpine with proper build tools:
```dockerfile
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ libpq-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
...
```

### Option 3: Multi-Stage Build
```dockerfile
FROM node:20-slim as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

## Images Comparison

| Image | Size | Libc | Compatibility |
|-------|------|------|---------------|
| node:20-alpine | ~150MB | musl | ⚠️ Native binary issues |
| node:20-slim | ~190MB | glibc | ✅ Better compatibility |
| node:20 (full) | ~900MB | glibc | ✅ Best compatibility |

## Docker Best Practices Applied

✅ Using `npm ci` instead of `npm install`
✅ Cleaning npm cache to reduce image size
✅ Using non-Alpine for Vite (npm ecosystem)
✅ Proper base image selection for use case

---

**Status**: Fixed and ready to rebuild
**Tested**: Yes, with node:20-slim
**Recommended**: Use this approach for npm/Node.js projects

