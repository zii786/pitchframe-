import { auth, db, storage } from './firebase-config.js';
import { performAnalysis, generateAnalysisReport } from './ai-service.js';
import { 
    createPitchDeck, 
    updatePitchDeckStatus, 
    saveAnalysisResults, 
    getUserPitchHistory,
    getAnalysisResults,
    saveUserHistory,
    COLLECTIONS,
    PITCH_STATUS
} from './firebase-db.js';

// Initialize Firebase
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');
const processingAlert = document.getElementById('processingAlert');

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
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

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0d6efd';
    dropZone.style.backgroundColor = '#f8f9fa';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

async function handleFileUpload(file) {
    try {
        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!validTypes.includes(file.type)) {
            throw new Error('Please upload a PDF or PowerPoint file');
        }

        // Show upload progress
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Upload file to Firebase Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`pitch_decks/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
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
                try {
                    // Get download URL
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                    // Create pitch deck document
                    const docId = await createPitchDeck(auth.currentUser.uid, {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size
                    });

                    // Update status to processing
                    await updatePitchDeckStatus(docId, PITCH_STATUS.PROCESSING);

                    // Start AI analysis
                    const analysis = await performAnalysis(downloadURL, auth.currentUser.uid, docId);

                    // Save analysis results
                    await saveAnalysisResults(docId, analysis);

                    // Update pitch deck status to completed
                    await updatePitchDeckStatus(docId, PITCH_STATUS.COMPLETED, analysis);

                    // Save to user history
                    await saveUserHistory(auth.currentUser.uid, docId, analysis);

                    // Hide progress bar
                    uploadProgress.classList.add('d-none');

                    // Show success message
                    alert('File uploaded successfully! AI analysis completed.');

                    // Update UI with results
                    updateAnalysisResults(analysis);
                } catch (error) {
                    console.error('Analysis error:', error);
                    await updatePitchDeckStatus(docId, PITCH_STATUS.ERROR, { error: error.message });
                    alert('Error during analysis: ' + error.message);
                }
            }
        );
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        uploadProgress.classList.add('d-none');
    }
}

// Function to update analysis results in the UI
function updateAnalysisResults(analysis) {
    // Show analysis results section
    document.getElementById('analysisResults').style.display = 'block';

    // Update clarity score
    const clarityScore = document.getElementById('clarityScore');
    const clarityBadge = document.getElementById('clarityBadge');
    clarityScore.style.width = `${analysis.clarityScore * 10}%`;
    clarityScore.setAttribute('aria-valuenow', analysis.clarityScore);
    clarityBadge.textContent = `${analysis.clarityScore}/10`;
    document.getElementById('clarityFeedback').textContent = analysis.clarityFeedback;

    // Update engagement score
    const engagementScore = document.getElementById('engagementScore');
    const engagementBadge = document.getElementById('engagementBadge');
    engagementScore.style.width = `${analysis.engagementScore * 10}%`;
    engagementScore.setAttribute('aria-valuenow', analysis.engagementScore);
    engagementBadge.textContent = `${analysis.engagementScore}/10`;
    document.getElementById('engagementFeedback').textContent = analysis.engagementFeedback;

    // Update recommendations
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    analysis.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <i class="fas fa-check-circle text-success me-2"></i>
            ${rec}
        `;
        recommendationsList.appendChild(li);
    });
}

// Listen for real-time updates on pitch deck analysis
db.collection(COLLECTIONS.PITCH_DECKS)
    .where('userId', '==', auth.currentUser.uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
                const doc = change.doc;
                if (doc.data().status === PITCH_STATUS.COMPLETED) {
                    updateAnalysisResults(doc.data().analysis);
                } else if (doc.data().status === PITCH_STATUS.ERROR) {
                    alert('Error during AI analysis: ' + doc.data().error);
                }
            }
        });
    });

// Add event listener for download report button
document.getElementById('downloadReportBtn').addEventListener('click', async () => {
    try {
        const docId = sessionStorage.getItem('currentAnalysisId');
        if (!docId) {
            throw new Error('No analysis found to download');
        }

        const analysis = await getAnalysisResults(docId);
        if (!analysis) {
            throw new Error('Analysis not found');
        }

        const report = await generateAnalysisReport(analysis);

        // Create and download HTML report
        const blob = new Blob([report], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pitch-analysis-report-${docId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading report: ' + error.message);
    }
});

// Add event listener for save analysis button
document.getElementById('saveAnalysisBtn').addEventListener('click', async () => {
    try {
        const docId = sessionStorage.getItem('currentAnalysisId');
        if (!docId) {
            throw new Error('No analysis found to save');
        }

        const analysis = await getAnalysisResults(docId);
        if (!analysis) {
            throw new Error('Analysis not found');
        }

        // Save to user history
        await saveUserHistory(auth.currentUser.uid, docId, analysis);

        alert('Analysis saved successfully!');
    } catch (error) {
        console.error('Save error:', error);
        alert('Error saving analysis: ' + error.message);
    }
});

// Add tooltips to help users understand the scores
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}); 