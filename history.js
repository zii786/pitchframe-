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
async function loadAnalysisHistory(user) {
    try {
        const analysisList = document.getElementById('analysisList');
        analysisList.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading your pitches...</p></div>';

        // Simplified query - just get user's pitches ordered by creation date
        let q = query(
            collection(db, 'pitches'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        // Get documents
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            analysisList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>No pitches found</p>
                    <a href="pitch-submission.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus me-2"></i>Submit a Pitch
                    </a>
                </div>`;
            return;
        }

        // Clear loading state
        analysisList.innerHTML = '';

        // Create cards for each pitch
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = createAnalysisCard(doc.id, data);
            analysisList.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading history:', error);
        analysisList.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading pitch history: ${error.message}
                <hr>
                <p class="mb-0">Please try <a href="javascript:location.reload()" class="alert-link">refreshing the page</a> or <a href="pitch-submission.html" class="alert-link">submit a new pitch</a>.</p>
            </div>`;
    }
}

// Create analysis card
function createAnalysisCard(id, data) {
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