import { db } from './firebase-config.js';

// Database Collections
const COLLECTIONS = {
    PITCH_DECKS: 'pitch_decks',
    ANALYSIS_RESULTS: 'analysis_results',
    USER_HISTORY: 'user_history'
};

// Pitch Deck Status
const PITCH_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error'
};

// Create a new pitch deck document
export async function createPitchDeck(userId, fileData) {
    try {
        const docRef = await db.collection(COLLECTIONS.PITCH_DECKS).add({
            userId,
            filename: fileData.name,
            fileUrl: fileData.url,
            fileType: fileData.type,
            fileSize: fileData.size,
            status: PITCH_STATUS.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating pitch deck:', error);
        throw error;
    }
}

// Update pitch deck status
export async function updatePitchDeckStatus(docId, status, analysis = null) {
    try {
        const updateData = {
            status,
            updatedAt: new Date()
        };

        if (analysis) {
            updateData.analysis = analysis;
            updateData.analysisDate = new Date();
        }

        await db.collection(COLLECTIONS.PITCH_DECKS).doc(docId).update(updateData);
    } catch (error) {
        console.error('Error updating pitch deck:', error);
        throw error;
    }
}

// Save analysis results
export async function saveAnalysisResults(docId, analysis) {
    try {
        await db.collection(COLLECTIONS.ANALYSIS_RESULTS).add({
            pitchDeckId: docId,
            clarityScore: analysis.clarityScore,
            engagementScore: analysis.engagementScore,
            clarityFeedback: analysis.clarityFeedback,
            engagementFeedback: analysis.engagementFeedback,
            recommendations: analysis.recommendations,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error saving analysis results:', error);
        throw error;
    }
}

// Get user's pitch deck history
export async function getUserPitchHistory(userId) {
    try {
        const snapshot = await db.collection(COLLECTIONS.PITCH_DECKS)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user history:', error);
        throw error;
    }
}

// Get analysis results for a pitch deck
export async function getAnalysisResults(pitchDeckId) {
    try {
        const snapshot = await db.collection(COLLECTIONS.ANALYSIS_RESULTS)
            .where('pitchDeckId', '==', pitchDeckId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data();
    } catch (error) {
        console.error('Error getting analysis results:', error);
        throw error;
    }
}

// Save user's analysis history
export async function saveUserHistory(userId, pitchDeckId, analysis) {
    try {
        await db.collection(COLLECTIONS.USER_HISTORY).add({
            userId,
            pitchDeckId,
            clarityScore: analysis.clarityScore,
            engagementScore: analysis.engagementScore,
            viewedAt: new Date()
        });
    } catch (error) {
        console.error('Error saving user history:', error);
        throw error;
    }
}

// Get user's analysis history
export async function getUserAnalysisHistory(userId) {
    try {
        const snapshot = await db.collection(COLLECTIONS.USER_HISTORY)
            .where('userId', '==', userId)
            .orderBy('viewedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user analysis history:', error);
        throw error;
    }
}

// Export collections and status constants
export { COLLECTIONS, PITCH_STATUS }; 