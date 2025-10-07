# 🔥 Firebase Setup Guide - Do This Later

## Quick Summary
Your website is ready, but needs Firebase connection for:
- User login/registration
- Storing pitch data
- File uploads
- Real-time features

## When You're Ready (5-10 minutes):

### Step 1: Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project"
3. Name: `pitchframe-yourname`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Web App
1. Click web icon (`</>`)
2. App name: `PitchFrame Web`
3. **Don't check** "Set up Firebase Hosting"
4. Click "Register app"
5. **COPY THE CONFIG** (you'll need this!)

### Step 3: Update Configuration
1. Open `firebase-config-template.js`
2. Find this section:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```
3. Replace with your actual config from Step 2
4. Save as `firebase-config.js` (replace the old one)

### Step 4: Enable Services
1. **Authentication:**
   - Go to Authentication → Get started
   - Sign-in method → Email/Password → Enable

2. **Firestore Database:**
   - Go to Firestore Database → Create database
   - Start in test mode → Choose region → Done

3. **Storage:**
   - Go to Storage → Get started
   - Start in test mode → Choose region → Done

### Step 5: Test Connection
1. Open `test-my-firebase.html` in browser
2. Click test buttons
3. Should see green success messages

## Your Website Features (After Firebase Setup):
- ✅ User registration and login
- ✅ Pitch submission and storage
- ✅ AI-powered pitch analysis
- ✅ Mentor matching system
- ✅ Real-time chat
- ✅ Multiple user roles (startup, mentor, investor)

## Files Ready for You:
- `firebase-config-template.js` - Template to update
- `test-my-firebase.html` - Test your connection
- `FIREBASE_SETUP_LATER.md` - This guide

## Need Help?
- Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)
- Firebase Docs: [firebase.google.com/docs](https://firebase.google.com/docs)

---
**Take your time! Firebase setup is optional for now. Your website will work without it, just without user accounts and data storage.**
