import { auth, db, onAuthStateChanged, getDoc, doc } from './firebase-config.js';

const currentPage = window.location.pathname.split('/').pop();

const protectedPages = [
    'mentor-dashboard.html',
    'investor-dashboard.html',
    'pitch-submission.html',
    'settings.html',
    'history.html',
    'chat.html'
];

onAuthStateChanged(auth, async (user) => {
    const isProtectedPage = protectedPages.includes(currentPage);

    if (user) {
        // User is logged in
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                switch (userData.userType) {
                    case 'mentor':
                        window.location.href = 'mentor-dashboard.html';
                        break;
                    case 'investor':
                        window.location.href = 'investor-dashboard.html';
                        break;
                    case 'startup':
                    default:
                        window.location.href = 'index.html'; // Fallback to index
                        break;
                }
            } else {
                 // If for some reason user doc doesn't exist, send to index
                 window.location.href = 'index.html';
            }
        }
    } else {
        // User is not logged in
        if (isProtectedPage) {
            window.location.href = 'login.html';
        }
    }
});