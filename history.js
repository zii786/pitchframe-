// Import Firebase configuration and services
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { collection, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadAnalysisHistory(user);
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
});

// File upload handling
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0d6efd';
    dropZone.style.backgroundColor = '#f8f9fa';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'white';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'white';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

// Handle file upload
async function handleFileUpload(file, isLink = false, linkUrl = null) {
    try {
        // Show progress bar
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Create a unique filename/identifier
        const timestamp = new Date().getTime();
        const filename = isLink ? 
            `${auth.currentUser.uid}/${timestamp}_link` :
            `${auth.currentUser.uid}/${timestamp}_${file.name}`;

        if (isLink) {
            // For link submissions, create a metadata-only entry
            const metadata = {
                customMetadata: {
                    isLink: 'true',
                    originalUrl: linkUrl
                }
            };

            // Create an empty file with metadata in Firebase Storage
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(filename);
            await fileRef.putString('', 'raw', metadata);

            // Save link metadata to Firestore
            await firebase.firestore().collection('pitch_decks').add({
                userId: auth.currentUser.uid,
                filename: 'External Link',
                downloadURL: linkUrl,
                uploadType: 'link',
                uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'processing'
            });

            // Hide progress bar and show success
            uploadProgress.classList.add('d-none');
            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            alert('Link submitted successfully! Analysis will begin shortly.');
            loadAnalysisHistory(auth.currentUser);
            return;
        }

        // For file uploads, validate file type
        const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or PowerPoint file');
            uploadProgress.classList.add('d-none');
            return;
        }

        // Upload file to Firebase Storage
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(filename);
        const uploadTask = fileRef.put(file);

        // Monitor upload progress
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = `${progress}%`;
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Error uploading file: ' + error.message);
                uploadProgress.classList.add('d-none');
            },
            async () => {
                // Get download URL
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                // Save file metadata to Firestore
                await firebase.firestore().collection('pitch_decks').add({
                    userId: auth.currentUser.uid,
                    filename: file.name,
                    downloadURL: downloadURL,
                    uploadType: 'file',
                    uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'processing'
                });

                // Hide progress bar
                uploadProgress.classList.add('d-none');
                bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
                alert('File uploaded successfully! Analysis will begin shortly.');
                loadAnalysisHistory(auth.currentUser);
            }
        );
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        uploadProgress.classList.add('d-none');
    }
}

// Add link submission handler
function handleLinkSubmission(linkUrl) {
    if (!linkUrl) {
        alert('Please enter a valid URL');
        return;
    }

    try {
        new URL(linkUrl);
    } catch (error) {
        alert('Please enter a valid URL');
        return;
    }

    handleFileUpload(null, true, linkUrl);
}

// Load analysis history
async function loadAnalysisHistory() {
    try {
        // Show loading state
        const analysisList = document.getElementById('analysisList');
        analysisList.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading analysis history...</p>
            </div>
        `;

        // Get current user
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Get filters
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        // Create base query
        let q = query(
            collection(db, 'pitches'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        // Apply date filter
        if (dateFilter !== 'all') {
            const startDate = getFilterDate(dateFilter);
            q = query(q, where('createdAt', '>=', startDate));
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            q = query(q, where('status', '==', statusFilter));
        }

        // Get documents
        const querySnapshot = await getDocs(q);

        // Clear loading state
        analysisList.innerHTML = '';

        if (querySnapshot.empty) {
            analysisList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                    <h5>No analysis history found</h5>
                    <p class="text-muted">Upload a pitch deck to get started</p>
                </div>
            `;
            return;
        }

        // Process and display results
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = createAnalysisCard(data, doc.id);
            analysisList.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading history:', error);
        
        // Show error state with retry button
        const analysisList = document.getElementById('analysisList');
        analysisList.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                <h5>Error loading analysis history</h5>
                <p class="text-muted">${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="loadAnalysisHistory()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;

        // If the error is about missing index, show helpful message
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            analysisList.innerHTML += `
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle"></i>
                    <strong>First-time setup:</strong> The system is creating necessary database indexes. 
                    This may take a few minutes. Please try again shortly.
                </div>
            `;
        }
    }
}

// Helper function to get date for filtering
function getFilterDate(filter) {
    const now = new Date();
    switch (filter) {
        case 'today':
            return new Date(now.setHours(0, 0, 0, 0));
        case 'week':
            return new Date(now.setDate(now.getDate() - 7));
        case 'month':
            return new Date(now.setMonth(now.getMonth() - 1));
        default:
            return null;
    }
}

// Create analysis card
function createAnalysisCard(data, id) {
    const card = document.createElement('div');
    card.className = 'analysis-card';
    
    const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
    const statusClass = `status-${data.status}`;
    const statusText = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    
    let scoreHtml = '';
    if (data.status === 'completed' && data.analysis) {
        const avgScore = ((data.analysis.clarityScore + data.analysis.engagementScore) / 2).toFixed(1);
        scoreHtml = `
            <div class="analysis-score">${avgScore}/10</div>
            <div class="progress mt-2">
                <div class="progress-bar" style="width: ${avgScore * 10}%"></div>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h5 class="mb-1">${data.companyName}</h5>
                <div class="analysis-date mb-2">Submitted on ${date}</div>
                <span class="analysis-status ${statusClass}">${statusText}</span>
            </div>
            ${scoreHtml}
        </div>
        <div class="mt-3">
            <p class="mb-2">${data.tagline || ''}</p>
            <p class="mb-2 text-muted">Industry: ${data.industry}</p>
        </div>
        <div class="mt-3">
            <button class="btn btn-outline-primary btn-sm" onclick="window.location.href='${data.pitchDeckUrl}'">
                <i class="fas fa-file-download me-2"></i>View Pitch Deck
            </button>
            ${data.status === 'completed' ? `
                <button class="btn btn-outline-success btn-sm ms-2" onclick="viewAnalysis('${id}')">
                    <i class="fas fa-chart-bar me-2"></i>View Analysis
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// View analysis details
window.viewAnalysis = function(id) {
    sessionStorage.setItem('currentAnalysisId', id);
    window.location.href = 'AI_analyzer.html';
};

// Download analysis report
async function downloadReport(id) {
    try {
        const doc = await firebase.firestore().collection('pitch_decks').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.status === 'completed' && data.analysis) {
                // Create a downloadable report
                const report = {
                    filename: data.filename,
                    uploadDate: data.uploadDate.toDate().toLocaleDateString(),
                    analysis: data.analysis
                };
                
                // Convert to JSON and create download
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${data.filename.replace(/\.[^/.]+$/, '')}_analysis.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report: ' + error.message);
    }
}

// Add filter change handlers
document.getElementById('dateFilter').addEventListener('change', () => loadAnalysisHistory(auth.currentUser));
document.getElementById('statusFilter').addEventListener('change', () => loadAnalysisHistory(auth.currentUser));
document.getElementById('sortBy').addEventListener('change', () => loadAnalysisHistory(auth.currentUser));

// Add this function to handle viewing pitch decks
function viewPitchDeck(pitchDeckUrl, uploadType) {
    if (!pitchDeckUrl) {
        showError('No pitch deck available');
        return;
    }

    if (uploadType === 'link') {
        // For cloud storage links, open in new tab
        window.open(pitchDeckUrl, '_blank');
    } else {
        // For uploaded files, handle Firebase Storage URLs
        const storageRef = ref(storage, pitchDeckUrl);
        getDownloadURL(storageRef)
            .then((url) => {
                window.open(url, '_blank');
            })
            .catch((error) => {
                console.error('Error getting pitch deck:', error);
                showError('Error accessing pitch deck: ' + error.message);
            });
    }
}

// Update the createHistoryCard function to include upload type
function createHistoryCard(pitch) {
    const date = pitch.createdAt.toDate();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="history-card">
            <div class="history-header">
                <h3>${pitch.companyName}</h3>
                <span class="badge ${getStatusBadgeClass(pitch.status)}">${pitch.status}</span>
            </div>
            <p class="submission-date">Submitted on ${formattedDate}</p>
            <div class="history-actions">
                <button class="btn btn-primary" onclick="viewPitchDeck('${pitch.pitchDeckUrl}', '${pitch.uploadType || 'file'}')">
                    <i class="fas ${pitch.uploadType === 'link' ? 'fa-external-link-alt' : 'fa-file-download'} me-2"></i>
                    View Pitch Deck
                </button>
                ${pitch.status === 'reviewed' ? `
                    <button class="btn btn-success" onclick="viewFeedback('${pitch.id}')">
                        <i class="fas fa-comment-alt me-2"></i>
                        View Feedback
                    </button>
                ` : ''}
            </div>
        </div>
    `;
} 