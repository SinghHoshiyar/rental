# Troubleshooting Guide

## Common Issues and Solutions

### 1. CORS Error - "Access-Control-Allow-Origin" header issue

**Problem:** Frontend can't connect to backend due to CORS policy.

**Solution:**
1. Make sure both frontend and backend are running
2. Frontend should be on `http://localhost:3000`
3. Backend should be on `http://localhost:5000`
4. The backend CORS is configured to allow both ports

**Quick Fix:**
- Restart both servers
- Clear browser cache
- Check that Vite proxy is working in `vite.config.js`

### 2. Backend Server Won't Start

**Problem:** Missing route files or model dependencies.

**Solution:**
1. Make sure all dependencies are installed:
```bash
cd rental-management/backend
npm install
```

2. Check that all required files exist:
- `routes/` directory with all route files
- `models/` directory with all model files
- `middleware/` directory with auth files

### 3. Database Connection Issues

**Problem:** MongoDB connection fails.

**Solution:**
1. Make sure MongoDB is running locally, or
2. Update `.env` with correct MongoDB Atlas connection string
3. Check network connectivity

### 4. Frontend Build Issues

**Problem:** Missing Tailwind plugins or dependencies.

**Solution:**
1. Install missing dependencies:
```bash
cd rental-management/frontend
npm install
```

2. If Tailwind plugins are missing, they've been removed from config
3. Clear node_modules and reinstall if needed:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 5. Authentication Issues

**Problem:** JWT token errors or login failures.

**Solution:**
1. Check JWT_SECRET in backend `.env`
2. Clear localStorage in browser
3. Make sure user exists in database (run seed script)

### 6. API Proxy Not Working

**Problem:** API calls going directly to localhost:5000 instead of using proxy.

**Solution:**
1. Make sure `VITE_API_URL` is empty in `.env`
2. Restart Vite dev server
3. Check `vite.config.js` proxy configuration

## Running the Application

### Step 1: Start Backend
```bash
cd rental-management/backend
npm install
npm run seed  # Only first time
npm start
```

### Step 2: Start Frontend (in new terminal)
```bash
cd rental-management/frontend
npm install
npm run dev
```

### Step 3: Test the Application
1. Open `http://localhost:3000`
2. Try registering a new account
3. Or login with test accounts:
   - Admin: `admin@rentalhub.com` / `admin123`
   - Customer: `customer@example.com` / `customer123`

## Checking if Everything Works

1. **Backend Health Check:** Visit `http://localhost:5000/api/health`
2. **Frontend Loading:** Visit `http://localhost:3000`
3. **API Connection:** Try logging in or viewing products
4. **Database:** Check if sample products appear on products page

## Getting Help

If you're still having issues:
1. Check browser console for errors
2. Check backend terminal for error messages
3. Verify all environment variables are set
4. Make sure ports 3000 and 5000 are not in use by other applications