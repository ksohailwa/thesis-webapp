# Thesis WebApp - Troubleshooting Guide

## Common Issues and Solutions

### 🚫 **403 Forbidden Error**

**Problem**: Getting "403 Forbidden - forbidden" when trying to access certain pages.

**Causes**:
1. **Role Mismatch**: Student trying to access teacher-only features (or vice versa)
2. **Expired Token**: Your login session has expired
3. **Invalid Role**: Token doesn't contain the correct role information

**Solutions**:
1. **Check Your Role**: 
   - Look at the navigation bar - it should show your role (teacher/student)
   - Make sure you're accessing the correct dashboard for your role
   
2. **Re-login**: 
   - Click "Logout" and log back in
   - This will refresh your authentication token
   
3. **Use Correct Account Type**:
   - Teachers: Use `/teacher/login` and access `/teacher/dashboard`
   - Students: Use `/student/login` and access `/student/dashboard`

### 🔐 **401 Unauthorized Error**

**Problem**: Getting "401 Unauthorized - missing token" error.

**Solutions**:
1. **Login Required**: You need to be logged in to access this feature
2. **Clear Browser Cache**: Sometimes old tokens get stuck
3. **Check Network**: Ensure backend server is running on port 4000

### 🚀 **Server Not Starting**

**Problem**: Backend or frontend won't start.

**Backend Issues**:
```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill existing processes if needed
taskkill /PID [process_id] /F

# Restart backend
cd thesis-webapp-backend
npm start
```

**Frontend Issues**:
```bash
# Clear cache and restart
cd thesis-webapp-frontend
rm -rf node_modules/.vite
npm run dev
```

### 📊 **No Data Showing**

**Problem**: Dashboards or analytics showing no data.

**Solutions**:
1. **Seed Database**: 
   ```bash
   cd thesis-webapp-backend
   node scripts/seed.js
   ```

2. **Check Database Connection**: 
   - Ensure MongoDB is running
   - Verify connection string in `.env` file

3. **Create Test Data**:
   - Login as teacher
   - Create a new experiment
   - Generate stories with target words

### 🔄 **API Functions Not Found**

**Problem**: Getting "api.functionName is not a function" errors.

**Solutions**:
1. **Check Imports**: Make sure components import from correct API file
2. **Clear Browser Cache**: Force refresh with Ctrl+F5
3. **Restart Dev Server**: Stop and restart the frontend development server

### 📱 **Mobile Display Issues**

**Problem**: App doesn't look good on mobile devices.

**Solutions**:
1. **Use Mobile Menu**: Look for hamburger menu (☰) on mobile
2. **Zoom Out**: Try zooming out if content is too large
3. **Portrait Mode**: Some features work better in portrait orientation

### 🎯 **Gap Fill Exercise Not Working**

**Problem**: Can't complete gap fill exercises.

**Solutions**:
1. **Use Valid Experiment ID**: Ensure you're using a valid experiment ID
2. **Check Sample Data**: Use the default ID: `507f1f77bcf86cd799439011`
3. **Create New Experiment**: Login as teacher and create a new experiment

### 🔧 **Development Setup Issues**

**Problem**: Can't get the development environment running.

**Prerequisites**:
- Node.js (v16+)
- MongoDB (running locally or connection string)
- Git

**Setup Steps**:
```bash
# Clone and setup backend
cd thesis-webapp-backend
npm install
cp .env.example .env  # Edit with your MongoDB connection
npm start

# Setup frontend (in new terminal)
cd thesis-webapp-frontend  
npm install
npm run dev
```

## 🆘 **Getting Help**

### Quick Checks:
1. ✅ Both servers running (backend on :4000, frontend on :5173/5174)
2. ✅ Database connection working
3. ✅ Logged in with correct account type
4. ✅ Using supported browser (Chrome, Firefox, Safari, Edge)

### Log Files to Check:
- Browser Developer Console (F12)
- Backend terminal output
- Network tab in browser dev tools

### Test Account Creation:
If you need test accounts:

**Teacher Account**:
- Go to `/teacher/signup`
- Use: teacher@example.com / password123
- Role: teacher

**Student Account**:
- Go to `/student/signup` 
- Use: student@example.com / password123
- Role: student

## 🔄 **Common Workflow**

### For Teachers:
1. Signup → Login → Dashboard
2. Create Experiment → Add Target Words
3. Generate Stories → View Analytics
4. Share experiment ID with students

### For Students:
1. Signup → Login → Dashboard
2. Browse Available Experiments
3. Start Gap Fill Exercise
4. Complete and Submit

## 📞 **Still Having Issues?**

If none of these solutions work:

1. **Check Browser Console**: Look for detailed error messages
2. **Try Different Browser**: Sometimes browser-specific issues occur
3. **Clear All Data**: Clear browser cache, cookies, and localStorage
4. **Fresh Setup**: Delete node_modules and reinstall dependencies
