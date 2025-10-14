import { auth, db, onAuthStateChanged, getDoc, doc, updateMentorAvailability } from './firebase-config.js';

const currentPage = window.location.pathname.split('/').pop();

const protectedPages = [
    'mentor-dashboard.html',
    'investor-dashboard.html',
    'pitch-submission.html',
    'settings.html',
    'history.html',
    'chat.html',
    'mentor-matching.html'
];

onAuthStateChanged(auth, async (user) => {
    const isProtectedPage = protectedPages.includes(currentPage);
    const isLoginPage = currentPage === 'login.html';
    const isRegisterPage = currentPage === 'register.html';

    console.log('Auth state changed:', { user: !!user, currentPage, isProtectedPage, isLoginPage });

    if (user) {
        // User is logged in
        console.log('User is logged in, checking redirect logic...');
        
        // Only redirect away from login/register pages if user is already authenticated
        if (isLoginPage || isRegisterPage) {
            console.log('User is on login/register page but already authenticated, redirecting...');
            
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('User data found:', userData.userType);
                    
                    // Update mentor availability if they're a mentor
                    if (userData.userType === 'mentor') {
                        try {
                            await updateMentorAvailability(user.uid, true);
                        } catch (error) {
                            console.error('Error updating mentor availability:', error);
                        }
                    }
                    
                    // Redirect based on user type (with small delay to ensure login completes)
                    setTimeout(() => {
                        switch (userData.userType) {
                            case 'mentor':
                                console.log('Redirecting mentor to dashboard...');
                                window.location.href = 'mentor-dashboard.html';
                                break;
                            case 'investor':
                                console.log('Redirecting investor to dashboard...');
                                window.location.href = 'investor-dashboard.html';
                                break;
                            case 'startup':
                            default:
                                console.log('Redirecting startup to home...');
                                window.location.href = 'index.html';
                                break;
                        }
                    }, 1000); // 1 second delay
                } else {
                    console.log('User document not found, redirecting to home...');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                window.location.href = 'index.html';
            }
        }
        // If user is logged in and on other pages, do nothing (let them stay)
    } else {
        // User is not logged in
        console.log('User is not logged in');
        
        if (isProtectedPage) {
            console.log('User not logged in on protected page, redirecting to login...');
            window.location.href = 'login.html';
        }
        // If user is not logged in and on login/register pages, do nothing (let them stay)
    }
});