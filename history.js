// Import Firebase configuration and services
import {
    auth,
    db,
    storage,
    onAuthStateChanged,
    signOut,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    ref,
    getDownloadURL,
    uploadBytesResumable
} from './firebase-config.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadAnalysisHistory();
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

            const storageRef = ref(storage, filename);
            const emptyBlob = new Blob(['']);
            await uploadBytesResumable(storageRef, emptyBlob, { customMetadata: metadata });

            // Save link metadata to Firestore (using 'pitches' collection)
            await addDoc(collection(db, 'pitches'), {
                userId: auth.currentUser.uid,
                companyName: 'External Link',
                fileName: 'External Link',
                fileUrl: linkUrl,
                uploadType: 'link',
                createdAt: new Date(),
                status: 'pending'
            });

            // Hide progress bar and show success
            uploadProgress.classList.add('d-none');
            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            alert('Link submitted successfully! Analysis will begin shortly.');
            loadAnalysisHistory();
            return;
        }

        // For file uploads, validate file type
        const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or PowerPoint file');
            uploadProgress.classList.add('d-none');
            return;
        }

        const storageRef = ref(storage, filename);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Monitor upload progress
        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = `${progress}%`;
        }, (error) => {
            console.error('Upload error:', error);
            alert('Error uploading file: ' + error.message);
            uploadProgress.classList.add('d-none');
        }, async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save file metadata to Firestore (using 'pitches' collection)
            // This part is likely handled by pitch-submission.html now,
            // but adding it here makes the modal upload functional.
            await addDoc(collection(db, 'pitches'), {
                userId: auth.currentUser.uid,
                companyName: file.name.split('.')[0], // Guess company name from filename
                fileName: file.name,
                fileUrl: downloadURL,
                uploadType: 'file',
                createdAt: new Date(),
                status: 'pending'
            });

            // Hide progress bar
            uploadProgress.classList.add('d-none');
            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            alert('File uploaded successfully! Analysis will begin shortly.');
            loadAnalysisHistory();
        });
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
        const refreshBtn = document.getElementById('refreshBtn');
        
        // Add loading animation to refresh button
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            refreshBtn.disabled = true;
        }
        
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
                <div class="text-center py-5">
                    <i class="fas fa-history fa-4x text-muted mb-4"></i>
                    <h4 class="text-muted">No pitch submissions found</h4>
                    <p class="text-muted mb-4">You haven't submitted any pitches yet. Start by uploading your first pitch deck!</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                        <i class="fas fa-plus me-2"></i>Submit Your First Pitch
                    </button>
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
            <div class="alert alert-danger text-center py-4">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                <h5>Error loading analysis history</h5>
                <p class="text-muted">${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="loadAnalysisHistory()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;

        // If the error is about missing index, show helpful message
        if (error.code === 'failed-precondition') {
            analysisList.innerHTML += `
                <div class="alert alert-warning mt-3">
                    <h5 class="alert-heading"><i class="fas fa-database me-2"></i>Database Index Required</h5>
                    <p>Your filters require a database index. This is a one-time setup. Please click the link below to create it in Firebase, then wait a few minutes and refresh the page.</p>
                    <hr>
                    <a href="${error.message.split('here: ')[1]}" target="_blank" class="btn btn-warning">Create Firestore Index</a>
                </div>
            `;
        }
    } finally {
        // Remove loading animation from refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
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
    
    // Handle different date formats
    let date = 'N/A';
    if (data.createdAt) {
        if (data.createdAt.seconds) {
            date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
        } else if (data.createdAt instanceof Date) {
            date = data.createdAt.toLocaleDateString();
        } else {
            date = new Date(data.createdAt).toLocaleDateString();
        }
    }
    
    const statusClass = `status-${data.status}`;
    const statusText = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    
    // Calculate overall score
    let scoreHtml = '';
    if (data.status === 'completed' || data.status === 'analyzed') {
        if (data.analysis && data.analysis.overallScore) {
            const overallScore = data.analysis.overallScore;
            scoreHtml = `
                <div class="analysis-score">${overallScore}/10</div>
                <div class="progress mt-2" style="height: 8px;">
                    <div class="progress-bar bg-success" style="width: ${overallScore * 10}%"></div>
                </div>
            `;
        } else if (data.analysis && data.analysis.clarityScore) {
            const avgScore = Math.round(
                (data.analysis.clarityScore + data.analysis.engagementScore + 
                 data.analysis.marketFitScore + data.analysis.uniquenessScore + 
                 data.analysis.financialViabilityScore + data.analysis.teamStrengthScore) / 6
            );
            scoreHtml = `
                <div class="analysis-score">${avgScore}/10</div>
                <div class="progress mt-2" style="height: 8px;">
                    <div class="progress-bar bg-success" style="width: ${avgScore * 10}%"></div>
                </div>
            `;
        }
    } else if (data.status === 'analyzing') {
        scoreHtml = `
            <div class="analysis-score text-warning">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="text-warning small">Analyzing...</div>
        `;
    } else if (data.status === 'error') {
        scoreHtml = `
            <div class="analysis-score text-danger">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="text-danger small">Error</div>
        `;
    }
    
    // Get company name and tagline
    const companyName = data.companyName || data.fileName || 'Untitled Pitch';
    const tagline = data.tagline || data.problem || 'No description available';
    const industry = data.industry || 'Not specified';
    const fundingStage = data.fundingStage || 'Not specified';
    const fundingAmount = data.fundingAmount ? `$${data.fundingAmount.toLocaleString()}` : 'Not specified';
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h5 class="mb-1">${companyName}</h5>
                <div class="analysis-date mb-2">
                    <i class="fas fa-calendar-alt me-1"></i>
                    Submitted on ${date}
                </div>
                <span class="analysis-status ${statusClass}">
                    <i class="fas fa-${getStatusIcon(data.status)} me-1"></i>
                    ${statusText}
                </span>
            </div>
            <div class="text-end">
                ${scoreHtml}
            </div>
        </div>
        
        <div class="mt-3">
            <p class="mb-2 text-muted">
                <i class="fas fa-tag me-1"></i>
                ${tagline}
            </p>
            <div class="row">
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-industry me-1"></i>
                        <strong>Industry:</strong> ${industry}
                    </small>
                </div>
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-layer-group me-1"></i>
                        <strong>Stage:</strong> ${fundingStage}
                    </small>
                </div>
            </div>
            ${data.fundingAmount ? `
                <div class="mt-1">
                    <small class="text-muted">
                        <i class="fas fa-dollar-sign me-1"></i>
                        <strong>Funding:</strong> ${fundingAmount}
                    </small>
                </div>
            ` : ''}
        </div>
        
        <div class="mt-3 d-flex flex-wrap gap-2">
            <button class="btn btn-outline-primary btn-sm" onclick="viewPitchDeck('${data.fileUrl}', '${data.fileName}')">
                <i class="fas fa-file-download me-1"></i>View Pitch Deck
            </button>
            ${data.status === 'analyzed' || data.status === 'completed' ? `
                <button class="btn btn-outline-success btn-sm" onclick="viewAnalysis('${id}', event)">
                    <i class="fas fa-chart-bar me-1"></i>View Analysis
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="downloadReport('${id}')">
                    <i class="fas fa-download me-1"></i>Download Report
                </button>
            ` : ''}
            ${data.status === 'error' ? `
                <button class="btn btn-outline-warning btn-sm" onclick="retryAnalysis('${id}')">
                    <i class="fas fa-redo me-1"></i>Retry Analysis
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Helper function to get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'completed':
        case 'analyzed':
            return 'check-circle';
        case 'analyzing':
            return 'spinner';
        case 'error':
            return 'exclamation-triangle';
        case 'pending':
            return 'clock';
        default:
            return 'question-circle';
    }
}

// View analysis details
window.viewAnalysis = function(id, event) {
    event.stopPropagation(); // Prevent card click
    window.location.href = `AI_analyzer.html?pitchId=${id}`;
};

// Retry analysis for failed pitches
window.retryAnalysis = async function(id) {
    try {
        const pitchDoc = await getDoc(doc(db, "pitches", id));
        if (!pitchDoc.exists) {
            throw new Error("Pitch not found");
        }
        
        const data = pitchDoc.data();
        
        // Update status to analyzing
        await updateDoc(doc(db, "pitches", id), {
            status: 'analyzing',
            errorMessage: null,
            retryCount: (data.retryCount || 0) + 1,
            lastRetryAt: new Date()
        });
        
        // Import AI service and retry analysis
        const { performAnalysis } = await import('./ai-service.js');
        
        // Trigger analysis
        await performAnalysis(db, doc, updateDoc, data.fileUrl, data.userId, id, data.fileType);
        
        alert('Analysis retry initiated successfully!');
        loadAnalysisHistory(); // Refresh the list
        
    } catch (error) {
        console.error('Error retrying analysis:', error);
        alert('Error retrying analysis: ' + error.message);
    }
};

// Download analysis report
async function downloadReport(id) {
    try {
        const pitchDoc = await getDoc(doc(db, "pitches", id));
        if (!pitchDoc.exists) {
            throw new Error("Pitch not found");
        }
        
        const data = pitchDoc.data();
        
        if ((data.status === 'completed' || data.status === 'analyzed') && data.analysis) {
            // Create a comprehensive report
            const report = {
                companyName: data.companyName,
                industry: data.industry,
                tagline: data.tagline,
                problem: data.problem,
                solution: data.solution,
                businessModel: data.businessModel,
                fundingStage: data.fundingStage,
                fundingAmount: data.fundingAmount,
                uploadDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
                fileName: data.fileName,
                analysis: data.analysis,
                generatedAt: new Date().toISOString()
            };
            
            // Convert to JSON and create download
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.companyName || 'pitch'}_analysis_report.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Report downloaded successfully!');
        } else {
            alert("Analysis is not yet complete for this pitch.");
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report: ' + error.message);
    }
}
window.downloadReport = downloadReport;

// Add filter change handlers
document.getElementById('dateFilter').addEventListener('change', loadAnalysisHistory);
document.getElementById('statusFilter').addEventListener('change', loadAnalysisHistory);
document.getElementById('sortBy').addEventListener('change', loadAnalysisHistory);

// Add this function to handle viewing pitch decks
window.viewPitchDeck = function(pitchDeckUrl, fileName = '') {
    if (!pitchDeckUrl) {
        alert('No pitch deck available');
        return;
    }

    try {
        // Check if it's a Firebase Storage URL
        if (pitchDeckUrl.includes('firebasestorage.googleapis.com')) {
            // For Firebase Storage URLs, open in new tab
            window.open(pitchDeckUrl, '_blank');
        } else if (pitchDeckUrl.startsWith('http')) {
            // For external URLs, open in new tab
            window.open(pitchDeckUrl, '_blank');
        } else {
            // For local files or other formats, try to open
            window.open(pitchDeckUrl, '_blank');
        }
    } catch (error) {
        console.error('Error opening pitch deck:', error);
        alert('Error opening pitch deck: ' + error.message);
    }
};