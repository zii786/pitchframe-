// Import the functions you need from the SDKs you need
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc,
    getDoc, 
    updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';



const firebaseConfig = {
  apiKey: "AIzaSyCJq9qhMJlKISOtQNTidfg-5JYyAiyrhhM",
  authDomain: "pitchframe-6967a.firebaseapp.com",
  databaseURL: "https://pitchframe-6967a-default-rtdb.firebaseio.com",
  projectId: "pitchframe-6967a",
  storageBucket: "pitchframe-6967a.firebasestorage.app",
  messagingSenderId: "801200566992",
  appId: "1:801200566992:web:d4460e0f21707aaab724d5"
};

// Initialize Firebase only if it hasn't been initialized
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    // If Firebase is already initialized, get the existing instance
    app = getApp();
}

// Initialize Firebase services with CORS settings
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, undefined, {
    customDomain: undefined,
    cors: {
        origin: [
            'http://localhost:8000', 
            'http://127.0.0.1:8000',
            'https://exquisite-puppy-fb8537.netlify.app',
            'https://exquisite-puppy-fb8537.netlify.app/',
            'https://pitchframe-6967a.firebaseapp.com',
            'https://pitchframe-6967a.web.app'
        ],
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 3600
    }
});

// Set CORS configuration
const corsSettings = {
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
  maxAge: 3600
};

const storageRef = ref(storage);

// Function to handle user registration
async function registerUser(email, password, firstName, lastName, userType) {
    try {
        // First create the user authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Then create the user profile
        const userProfile = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            userType: userType,
            createdAt: new Date(),
            profileComplete: false,
            uid: user.uid
        };

        // Create user document
        await setDoc(doc(db, 'users', user.uid), userProfile);

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
                expertise: [],
                availability: true
            });
        } else if (userType === 'investor') {
            await setDoc(doc(db, 'investors', user.uid), {
                ...typeSpecificProfile,
                investmentFocus: [],
                preferredStages: []
            });
        }

        return userCredential;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Function to handle user login
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        throw error;
    }
}

// Function to handle password reset
async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error;
    }
}

// Function to handle user logout
async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
}

// Function to check if user is logged in
function checkAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

// Function to get user profile data
async function getUserProfile(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
}

// Function to update user profile
async function updateUserProfile(userId, data) {
    await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: new Date()
    });
}

// Function to get startup profile
async function getStartupProfile(userId) {
    const startupDoc = await getDoc(doc(db, 'startups', userId));
    return startupDoc.exists() ? startupDoc.data() : null;
}

// Function to get mentor profile
async function getMentorProfile(userId) {
    const mentorDoc = await getDoc(doc(db, 'mentors', userId));
    return mentorDoc.exists() ? mentorDoc.data() : null;
}

// Function to get investor profile
async function getInvestorProfile(userId) {
    const investorDoc = await getDoc(doc(db, 'investors', userId));
    return investorDoc.exists() ? investorDoc.data() : null;
}

// Export functions and variables
export {
    auth,
    db,
    storage,
    storageRef,
    corsSettings,
    firebaseConfig,
    registerUser,
    loginUser,
    resetPassword,
    logoutUser,
    checkAuthState,
    getUserProfile,
    updateUserProfile,
    getStartupProfile,
    getMentorProfile,
    getInvestorProfile
};
