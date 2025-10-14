// Firebase Configuration and Services
// Unified configuration for PitchFrame application

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    getRedirectResult,
    fetchSignInMethodsForEmail,
    connectAuthEmulator,
    EmailAuthProvider,
    updateProfile,
    deleteUser,
    reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    onSnapshot,
    serverTimestamp,
    connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// Firebase Storage imports removed - using simulated uploads only

// Environment configuration loader with fallbacks
function loadFirebaseConfig() {
    // Try to load from environment variables first
    try {
        // Check if we're in a Vite environment
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            const config = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID
            };
            
            // Check if all values are present
            const hasAllValues = Object.values(config).every(value => value && value !== 'your-firebase-api-key-here');
            if (hasAllValues) {
                console.log('Using Vite environment variables for Firebase configuration');
                return config;
            }
        }
        
        // Try to load from window.env (injected by script)
        if (typeof window !== 'undefined' && window.env) {
            const config = {
                apiKey: window.env.VITE_FIREBASE_API_KEY || window.env.FIREBASE_API_KEY,
                authDomain: window.env.VITE_FIREBASE_AUTH_DOMAIN || window.env.FIREBASE_AUTH_DOMAIN,
                projectId: window.env.VITE_FIREBASE_PROJECT_ID || window.env.FIREBASE_PROJECT_ID,
                storageBucket: window.env.VITE_FIREBASE_STORAGE_BUCKET || window.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: window.env.VITE_FIREBASE_MESSAGING_SENDER_ID || window.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: window.env.VITE_FIREBASE_APP_ID || window.env.FIREBASE_APP_ID
            };
            
            // Check if all values are present
            const hasAllValues = Object.values(config).every(value => value && value !== 'your-firebase-api-key-here');
            if (hasAllValues) {
                console.log('Using injected environment variables for Firebase configuration');
                return config;
            }
        }
        
        // Try to load from script tag with environment variables
        const envScript = document.querySelector('script[type="application/json"][data-env]');
        if (envScript) {
            try {
                const envData = JSON.parse(envScript.textContent);
                const config = {
                    apiKey: envData.VITE_FIREBASE_API_KEY || envData.FIREBASE_API_KEY,
                    authDomain: envData.VITE_FIREBASE_AUTH_DOMAIN || envData.FIREBASE_AUTH_DOMAIN,
                    projectId: envData.VITE_FIREBASE_PROJECT_ID || envData.FIREBASE_PROJECT_ID,
                    storageBucket: envData.VITE_FIREBASE_STORAGE_BUCKET || envData.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: envData.VITE_FIREBASE_MESSAGING_SENDER_ID || envData.FIREBASE_MESSAGING_SENDER_ID,
                    appId: envData.VITE_FIREBASE_APP_ID || envData.FIREBASE_APP_ID
                };
                
                // Check if all values are present
                const hasAllValues = Object.values(config).every(value => value && value !== 'your-firebase-api-key-here');
                if (hasAllValues) {
                    console.log('Using script tag environment variables for Firebase configuration');
                    return config;
                }
            } catch (error) {
                console.warn('Failed to parse environment variables from script tag:', error);
            }
        }
    } catch (error) {
        console.warn('Failed to load environment variables:', error);
    }
    
    // Fallback to hardcoded values (for development/testing)
    console.log('Using fallback Firebase configuration');
    return {
        apiKey: "AIzaSyCKPLJWseR3pr6zH-ejWKV5LU2UXJhUNlE",
        authDomain: "pitchframe-ismail.firebaseapp.com",
        projectId: "pitchframe-ismail",
        storageBucket: "pitchframe-ismail.appspot.com",
        messagingSenderId: "912391061237",
        appId: "1:912391061237:web:26b27963efcc3f5ddf4fbc"
    };
}

// Firebase configuration
const firebaseConfig = loadFirebaseConfig();

// Validate required configuration
function validateFirebaseConfig(config) {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
        console.error('Missing Firebase configuration:', missing);
        throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
    }
}

validateFirebaseConfig(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
// Storage removed - using simulated uploads only

// Connect to emulators in development (only for local development)
function isDevelopment() {
    return (location.hostname === 'localhost' || location.hostname === '127.0.0.1') &&
           (typeof window !== 'undefined' && window.env && window.env.VITE_DEV_MODE === 'true');
}

if (isDevelopment()) {
    console.log("Connecting to local Firebase emulators...");
    try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
        console.log("Emulators already connected or not available");
    }
} else {
    console.log("Using production Firebase services");
}

// Authentication functions
async function registerUser(email, password, firstName, lastName, userType) {
    try {
        console.log('Starting user registration...');
        
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('User created:', user.uid);
        
        // Create user profile document
        const userProfile = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            userType: userType,
            createdAt: new Date(),
            profileComplete: true,
            uid: user.uid
        };
        
        // Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log('User profile saved to Firestore');
        
        // Create type-specific profile
        const typeSpecificProfile = {
            createdAt: new Date(),
            userId: user.uid
        };
        
        if (userType === 'startup') {
            await setDoc(doc(db, 'startups', user.uid), {
                ...typeSpecificProfile,
                companyName: '',
                industry: '',
                stage: '',
                description: ''
            });
        } else if (userType === 'mentor') {
            await setDoc(doc(db, 'mentors', user.uid), {
                ...typeSpecificProfile,
                firstName: firstName,
                lastName: lastName,
                email: email,
                expertise: [],
                domain: '',
                availability: true,
                yearsOfExperience: 0,
                rating: 0,
                totalReviews: 0,
                lastActive: new Date(),
                profileComplete: false
            });
        } else if (userType === 'investor') {
            await setDoc(doc(db, 'investors', user.uid), {
                ...typeSpecificProfile,
                investmentFocus: [],
                preferredStages: []
            });
        }
        
        console.log('Registration completed successfully');
        return userCredential;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        console.log('Starting user login...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user.uid);
        return userCredential;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function loginWithGoogle() {
    try {
        console.log('Starting Google login...');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('Google login successful:', result.user.uid);
        return result;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

async function resetPassword(email) {
    try {
        console.log('Sending password reset email...');
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email sent');
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

async function logoutUser() {
    try {
        console.log('Logging out user...');
        await signOut(auth);
        console.log('Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

function getCurrentUser() {
    return auth.currentUser;
}

export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// Firestore functions
async function getUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

async function updateUserProfile(userId, data) {
    try {
        await updateDoc(doc(db, 'users', userId), {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Update mentor availability and last active time
async function updateMentorAvailability(userId, isAvailable = true) {
    try {
        await updateDoc(doc(db, 'mentors', userId), {
            availability: isAvailable,
            lastActive: new Date()
        });
        console.log('Mentor availability updated');
    } catch (error) {
        console.error('Error updating mentor availability:', error);
        throw error;
    }
}

// Firebase Storage functions removed - using simulated uploads only
// All file uploads are now simulated in the frontend for demonstration purposes

// Export Firebase services and functions (Storage removed)
export {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  registerUser,
  loginUser,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateMentorAvailability,
  updateDoc,
  fetchSignInMethodsForEmail
};