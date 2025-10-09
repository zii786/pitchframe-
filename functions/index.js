const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdf = require('pdf-parse');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Cloud Function to analyze pitch with PDF text extraction
exports.analyzePitchProxy = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { fileUrl, userId, docId } = data;

        if (!fileUrl || !userId || !docId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }

        // Download file from Firebase Storage
        const bucket = admin.storage().bucket();
        const fileName = fileUrl.split('/').pop().split('?')[0]; // Remove query params
        const file = bucket.file(`pitches/${userId}/${fileName}`);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new functions.https.HttpsError('not-found', 'File not found');
        }

        // Download file to memory
        const [fileBuffer] = await file.download();

        // Extract text from PDF
        let extractedText;
        try {
            const pdfData = await pdf(fileBuffer);
            extractedText = pdfData.text;
        } catch (error) {
            console.error('PDF parsing error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to extract text from PDF');
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new functions.https.HttpsError('internal', 'No text content found in PDF');
        }

        // Perform AI analysis (mock for now - replace with actual AI service)
        const analysis = {
            clarityScore: Math.floor(Math.random() * 5) + 5,
            engagementScore: Math.floor(Math.random() * 5) + 5,
            marketFitScore: Math.floor(Math.random() * 5) + 5,
            uniquenessScore: Math.floor(Math.random() * 5) + 5,
            financialViabilityScore: Math.floor(Math.random() * 5) + 5,
            teamStrengthScore: Math.floor(Math.random() * 5) + 5,
            overallScore: 0,
            clarityFeedback: "AI analysis would be performed here with actual service",
            engagementFeedback: "AI analysis would be performed here with actual service",
            marketFitFeedback: "AI analysis would be performed here with actual service",
            uniquenessFeedback: "AI analysis would be performed here with actual service",
            financialViabilityFeedback: "AI analysis would be performed here with actual service",
            teamStrengthFeedback: "AI analysis would be performed here with actual service",
            overallFeedback: "AI analysis would be performed here with actual service",
            strengths: ["Sample strength 1", "Sample strength 2"],
            weaknesses: ["Sample weakness 1", "Sample weakness 2"],
            recommendations: ["Sample recommendation 1", "Sample recommendation 2"],
            marketAnalysis: "Market analysis would be provided by AI service",
            competitiveAdvantage: "Competitive advantage analysis would be provided by AI service",
            riskAssessment: "Risk assessment would be provided by AI service",
            timestamp: new Date().toISOString(),
            aiService: 'cloud-function',
            extractedContent: extractedText.substring(0, 1000) // Store first 1000 chars
        };

        // Calculate overall score
        analysis.overallScore = Math.round(
            (analysis.clarityScore + analysis.engagementScore + 
             analysis.marketFitScore + analysis.uniquenessScore + 
             analysis.financialViabilityScore + analysis.teamStrengthScore) / 6
        );

        // Update Firestore document
        await admin.firestore().collection('pitches').doc(docId).update({
            status: 'completed',
            analysis: analysis,
            analysisDate: admin.firestore.FieldValue.serverTimestamp(),
            extractedContent: extractedText.substring(0, 1000)
        });

        return {
            success: true,
            analysis: analysis,
            extractedTextLength: extractedText.length
        };

    } catch (error) {
        console.error('Cloud function error:', error);
        
        // Update Firestore with error status
        if (data.docId) {
            await admin.firestore().collection('pitches').doc(data.docId).update({
                status: 'error',
                errorMessage: error.message,
                analysisDate: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        throw error;
    }
});

// Cloud Function to get file download URL securely
exports.getSecureFileUrl = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { filePath } = data;
        const userId = context.auth.uid;

        // Verify user owns the file
        if (!filePath.includes(userId)) {
            throw new functions.https.HttpsError('permission-denied', 'Access denied');
        }

        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        // Generate signed URL valid for 1 hour
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        return {
            success: true,
            signedUrl: signedUrl
        };

    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
});
