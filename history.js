// Check authentication state
auth.onAuthStateChanged((user) => {
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
        await logoutUser();
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
async function handleFileUpload(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or PowerPoint file');
        return;
    }

    try {
        // Show progress bar
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Create a unique filename
        const timestamp = new Date().getTime();
        const filename = `${auth.currentUser.uid}/${timestamp}_${file.name}`;

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
                    uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'processing'
                });

                // Hide progress bar
                uploadProgress.classList.add('d-none');

                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();

                // Show success message
                alert('File uploaded successfully! Analysis will begin shortly.');

                // Reload history
                loadAnalysisHistory(auth.currentUser);
            }
        );
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        uploadProgress.classList.add('d-none');
    }
}

// Load analysis history
async function loadAnalysisHistory(user) {
    try {
        const analysisList = document.getElementById('analysisList');
        analysisList.innerHTML = ''; // Clear existing content

        // Get user preferences for filtering
        const prefsDoc = await firebase.firestore().collection('user_preferences').doc(user.uid).get();
        const prefs = prefsDoc.exists ? prefsDoc.data() : {};

        // Get date filter
        const dateFilter = document.getElementById('dateFilter').value;
        let startDate = new Date();
        switch (dateFilter) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'all':
            default:
                startDate = null;
        }

        // Get status filter
        const statusFilter = document.getElementById('statusFilter').value;

        // Get sort order
        const sortBy = document.getElementById('sortBy').value;
        const [sortField, sortOrder] = sortBy.split('-');

        // Build query
        let query = firebase.firestore().collection('pitch_decks')
            .where('userId', '==', user.uid);

        if (startDate) {
            query = query.where('uploadDate', '>=', startDate);
        }

        if (statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }

        // Add sorting
        query = query.orderBy(sortField === 'date' ? 'uploadDate' : 'analysis.score', 
            sortOrder === 'desc' ? 'desc' : 'asc');

        const snapshot = await query.get();

        if (snapshot.empty) {
            analysisList.innerHTML = '<div class="text-center text-muted">No analyses found</div>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const analysisCard = createAnalysisCard(doc.id, data);
            analysisList.appendChild(analysisCard);
        });
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Error loading analysis history: ' + error.message);
    }
}

// Create analysis card
function createAnalysisCard(id, data) {
    const card = document.createElement('div');
    card.className = 'analysis-card';
    
    const date = data.uploadDate ? data.uploadDate.toDate().toLocaleDateString() : 'N/A';
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
                <h5 class="mb-1">${data.filename}</h5>
                <div class="analysis-date mb-2">Uploaded on ${date}</div>
                <span class="analysis-status ${statusClass}">${statusText}</span>
            </div>
            ${scoreHtml}
        </div>
        ${data.status === 'completed' && data.analysis ? `
            <div class="mt-3">
                <h6>Key Recommendations:</h6>
                <ul class="list-group list-group-flush">
                    ${data.analysis.recommendations.slice(0, 3).map(rec => `
                        <li class="list-group-item">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            ${rec}
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
        <div class="mt-3">
            <button class="btn btn-outline-primary btn-sm" onclick="viewAnalysis('${id}')">
                View Details
            </button>
            ${data.status === 'completed' ? `
                <button class="btn btn-outline-secondary btn-sm ms-2" onclick="downloadReport('${id}')">
                    Download Report
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// View analysis details
function viewAnalysis(id) {
    // Store the analysis ID in session storage
    sessionStorage.setItem('currentAnalysisId', id);
    // Redirect to AI analyzer page
    window.location.href = 'AI_analyzer.html';
}

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

// Add event listeners for filters
document.getElementById('dateFilter').addEventListener('change', () => loadAnalysisHistory(auth.currentUser));
document.getElementById('statusFilter').addEventListener('change', () => loadAnalysisHistory(auth.currentUser));
document.getElementById('sortBy').addEventListener('change', () => loadAnalysisHistory(auth.currentUser)); 