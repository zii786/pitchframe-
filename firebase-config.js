// Import the functions you need from the SDKs you need
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
    connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKPLJWseR3pr6zH-ejWKV5LU2UXJhUNlE",
    authDomain: "pitchframe-ismail.firebaseapp.com",
    projectId: "pitchframe-ismail",
    storageBucket: "pitchframe-ismail.firebasestorage.app",
    messagingSenderId: "912391061237",
    appId: "1:912391061237:web:26b27963efcc3f5ddf4fbc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log("Connecting to local Firebase emulators...");
    try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
        console.log("Emulators already connected or not available");
    }
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

// Storage functions
export async function uploadFile(file, path) {
    try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress tracking
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload progress:', progress + '%');
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Export Firebase services and functions
export {
  auth,
  db,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
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
  updateDoc,
  fetchSignInMethodsForEmail
};