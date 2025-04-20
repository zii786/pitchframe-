import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// Function to update navigation based on user state
async function updateNavigation(user) {
    try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const userType = userData.userType;

        // Get navigation elements
        const mentorDashboardLink = document.querySelector('a[href="mentor-dashboard.html"]')?.parentElement;
        const pitchSubmissionLink = document.querySelector('a[href="pitch-submission.html"]')?.parentElement;
        const aiAnalyzerLink = document.querySelector('a[href="AI_analyzer.html"]')?.parentElement;
        const navLoginItem = document.querySelector('.navbar-nav .btn-primary')?.parentElement;

        if (!navLoginItem) return;

        // Show/hide elements based on user type
        if (mentorDashboardLink) {
            mentorDashboardLink.style.display = userType === 'mentor' ? 'block' : 'none';
        }
        if (pitchSubmissionLink) {
            pitchSubmissionLink.style.display = userType === 'mentor' ? 'none' : 'block';
        }

        // Update the profile dropdown
        navLoginItem.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user me-2"></i>${userData.firstName || 'Profile'}
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                    <li><a class="dropdown-item" href="settings.html"><i class="fas fa-cog me-2"></i>Settings</a></li>
                    ${userType === 'mentor' ? `
                        <li><a class="dropdown-item" href="mentor-dashboard.html"><i class="fas fa-columns me-2"></i>Mentor Dashboard</a></li>
                        <li><a class="dropdown-item" href="mentor-notifications.html"><i class="fas fa-bell me-2"></i>Notifications</a></li>
                    ` : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutButton"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;

        // Add logout functionality
        document.getElementById('logoutButton').addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });

    } catch (error) {
        console.error('Error updating navigation:', error);
    }
}

// Initialize navigation updates
export function initNavigation() {
    const navLoginItem = document.querySelector('.navbar-nav .btn-primary')?.parentElement;
    
    if (!navLoginItem) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in, update navigation based on role
            await updateNavigation(user);
        } else {
            // User is not logged in, show default navigation
            navLoginItem.innerHTML = `
                <a class="nav-link btn btn-primary ms-2 text-white px-4" href="login.html">Login</a>
            `;
            
            // Hide mentor-specific items
            const mentorDashboardLink = document.querySelector('a[href="mentor-dashboard.html"]')?.parentElement;
            if (mentorDashboardLink) {
                mentorDashboardLink.style.display = 'none';
            }
        }
    });
} 