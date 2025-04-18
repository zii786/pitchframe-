// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
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

// Your web app's Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCJq9qhMJlKISOtQNTidfg-5JYyAiyrhhM",
    authDomain: "pitchframe-6967a.firebaseapp.com",
    projectId: "pitchframe-6967a",
    storageBucket: "pitchframe-6967a.firebasestorage.app",
    messagingSenderId: "801200566992",
    appId: "1:801200566992:web:9dc20d8ad085577eb724d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to handle user registration
async function registerUser(email, password, firstName, lastName, userType) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            userType: userType,
            createdAt: new Date(),
            profileComplete: false
        });

        if (userType === 'startup') {
            await setDoc(doc(db, 'startups', userCredential.user.uid), {
                founderId: userCredential.user.uid,
                companyName: '',
                industry: '',
                stage: '',
                description: '',
                createdAt: new Date()
            });
        } else if (userType === 'mentor') {
            await setDoc(doc(db, 'mentors', userCredential.user.uid), {
                mentorId: userCredential.user.uid,
                expertise: [],
                availability: true,
                createdAt: new Date()
            });
        } else if (userType === 'investor') {
            await setDoc(doc(db, 'investors', userCredential.user.uid), {
                investorId: userCredential.user.uid,
                investmentFocus: [],
                preferredStages: [],
                createdAt: new Date()
            });
        }

        return userCredential;
    } catch (error) {
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

// Make auth and db available globally
window.auth = auth;
window.db = db;

export {
    auth,
    db,
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
