// Check authentication state
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadUserProfile(user);
        loadUserPreferences(user);
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await logoutUser();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
});

// Load user profile
async function loadUserProfile(user) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('email').value = user.email;
            document.getElementById('company').value = userData.company || '';
            document.getElementById('bio').value = userData.bio || '';
            
            if (userData.profilePicture) {
                document.getElementById('profilePicture').src = userData.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile: ' + error.message);
    }
}

// Load user preferences
async function loadUserPreferences(user) {
    try {
        const prefsDoc = await firebase.firestore().collection('user_preferences').doc(user.uid).get();
        if (prefsDoc.exists) {
            const prefs = prefsDoc.data();
            document.getElementById('darkMode').checked = prefs.darkMode || false;
            document.getElementById('notifications').checked = prefs.notifications || false;
            document.getElementById('autoSave').checked = prefs.autoSave || false;
            document.getElementById('language').value = prefs.language || 'en';
            document.getElementById('analysisDepth').value = prefs.analysisDepth || 'standard';
            
            // Set focus areas
            document.getElementById('clarity').checked = prefs.focusAreas?.includes('clarity') || true;
            document.getElementById('engagement').checked = prefs.focusAreas?.includes('engagement') || true;
            document.getElementById('marketAnalysis').checked = prefs.focusAreas?.includes('marketAnalysis') || true;
            document.getElementById('financialAnalysis').checked = prefs.focusAreas?.includes('financialAnalysis') || false;
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Handle profile picture upload
document.getElementById('profilePictureInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`profile_pictures/${auth.currentUser.uid}`);
            await fileRef.put(file);
            const downloadURL = await fileRef.getDownloadURL();
            
            // Update profile picture in Firestore
            await firebase.firestore().collection('users').doc(auth.currentUser.uid).update({
                profilePicture: downloadURL
            });
            
            // Update UI
            document.getElementById('profilePicture').src = downloadURL;
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Error uploading profile picture: ' + error.message);
        }
    }
});

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            company: document.getElementById('company').value,
            bio: document.getElementById('bio').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebase.firestore().collection('users').doc(auth.currentUser.uid).update(userData);
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    }
});

// Handle preferences changes
document.querySelectorAll('.form-check-input, .form-select').forEach(element => {
    element.addEventListener('change', async () => {
        try {
            const prefs = {
                darkMode: document.getElementById('darkMode').checked,
                notifications: document.getElementById('notifications').checked,
                autoSave: document.getElementById('autoSave').checked,
                language: document.getElementById('language').value,
                analysisDepth: document.getElementById('analysisDepth').value,
                focusAreas: [
                    ...(document.getElementById('clarity').checked ? ['clarity'] : []),
                    ...(document.getElementById('engagement').checked ? ['engagement'] : []),
                    ...(document.getElementById('marketAnalysis').checked ? ['marketAnalysis'] : []),
                    ...(document.getElementById('financialAnalysis').checked ? ['financialAnalysis'] : [])
                ],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await firebase.firestore().collection('user_preferences').doc(auth.currentUser.uid).set(prefs, { merge: true });
            
            // Apply dark mode if changed
            if (prefs.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    });
});

// Handle password change
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    try {
        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
        );
        await auth.currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await auth.currentUser.updatePassword(newPassword);
        
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        e.target.reset();
        alert('Password updated successfully!');
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error changing password: ' + error.message);
    }
});

// Handle account deletion
document.getElementById('deleteAccountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('deletePassword').value;
    
    try {
        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            auth.currentUser.email,
            password
        );
        await auth.currentUser.reauthenticateWithCredential(credential);
        
        // Delete user data from Firestore
        await firebase.firestore().collection('users').doc(auth.currentUser.uid).delete();
        await firebase.firestore().collection('user_preferences').doc(auth.currentUser.uid).delete();
        
        // Delete user account
        await auth.currentUser.delete();
        
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account: ' + error.message);
    }
}); 