# ⏱️ Docker Restart Timing Issue - SOLVED

## Problem

After running `docker compose restart`, you may see these errors in the browser:
```
AxiosError: Network Error
GET http://localhost:8000/api/user net::ERR_EMPTY_RESPONSE
```

## Why This Happens

When Docker containers restart:
1. **Database** restarts immediately (~5 seconds)
2. **Backend** needs to reinstall Composer dependencies (~30-60 seconds)
3. **Frontend** starts immediately and tries to connect to the backend
4. **Result:** Frontend connects before backend is ready → Network Error

## Solutions

### ✅ Solution 1: Use the Startup Scripts (Recommended)

**Windows PowerShell:**
```powershell
.\start.ps1
```

**macOS/Linux:**
```bash
./start.sh
```

These scripts automatically wait for all services to be ready before opening your browser.

### ✅ Solution 2: Wait After Manual Restart

If you manually restart with `docker compose restart`:

1. Wait 30-60 seconds after seeing "Server running on [http://0.0.0.0:8000]" in logs
2. Check backend readiness:
   ```bash
   curl http://localhost:8000/api/health
   ```
3. You should see: `{"status":"healthy","timestamp":"...","service":"..."}`
4. Now refresh your browser at http://localhost:3000

### ✅ Solution 3: Use Docker Compose Up (Slower but Reliable)

```bash
docker compose down
docker compose up -d
```

This triggers the healthcheck system which ensures frontend only starts after backend is ready.

## How We Fixed This

1. **Added healthcheck to backend** in `docker-compose.yml`:
   - Checks `/api/health` endpoint every 10 seconds
   - Waits up to 60 seconds for backend to be ready
   
2. **Frontend now depends on backend health**:
   - Frontend won't start until backend healthcheck passes
   - Eliminates timing issues

3. **Created startup scripts**:
   - `start.ps1` for Windows
   - `start.sh` for macOS/Linux
   - Automatically wait for all services
   - Open browser when everything is ready

## Quick Reference

| Method | Command | Wait Time | Best For |
|--------|---------|-----------|----------|
| Startup Script | `./start.ps1` or `./start.sh` | Automatic | **First time users** |
| Docker Up | `docker compose up -d` | Automatic | **Most reliable** |
| Docker Restart | `docker compose restart` | 30-60s manual | **Quick restarts** |

## For Production Deployment

In production, this isn't an issue because:
- Dependencies are baked into the Docker image
- No reinstallation happens on restart
- Services use proper healthchecks
- Load balancers wait for healthy status

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

---

**Bottom Line:** Use `./start.ps1` (Windows) or `./start.sh` (macOS/Linux) for the best experience! 🚀
