// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
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
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Add user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            userType: userType,
            createdAt: serverTimestamp(),
            profileComplete: false
        });

        // Create user-specific collections based on user type
        if (userType === 'startup') {
            await setDoc(doc(db, 'startups', userCredential.user.uid), {
                founderId: userCredential.user.uid,
                companyName: '',
                industry: '',
                stage: '',
                description: '',
                createdAt: serverTimestamp()
            });
        } else if (userType === 'mentor') {
            await setDoc(doc(db, 'mentors', userCredential.user.uid), {
                mentorId: userCredential.user.uid,
                expertise: [],
                availability: true,
                createdAt: serverTimestamp()
            });
        } else if (userType === 'investor') {
            await setDoc(doc(db, 'investors', userCredential.user.uid), {
                investorId: userCredential.user.uid,
                investmentFocus: [],
                preferredStages: [],
                createdAt: serverTimestamp()
            });
        }

        return userCredential;
    } catch (error) {
        throw error;
    }
}

// Function to handle user login
function loginUser(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Function to handle password reset
function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
}

// Function to handle user logout
function logoutUser() {
    return auth.signOut();
}

// Function to check if user is logged in
function checkAuthState() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            resolve(user);
        });
    });
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
        updatedAt: serverTimestamp()
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
