// AI Analysis Service Implementation
import { auth, db, storage } from './firebase-config.js';

// Constants for analysis
const ANALYSIS_TYPES = {
    CLARITY: 'clarity',
    ENGAGEMENT: 'engagement',
    MARKET_FIT: 'market_fit',
    UNIQUENESS: 'uniqueness'
};

// Helper function to extract text from PDF/PPT
async function extractTextFromFile(fileUrl) {
    try {
        // In a real implementation, this would use a PDF/PPT parsing library
        // For now, we'll simulate text extraction
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        return "Sample pitch deck content for analysis. This would be the actual content extracted from the file.";
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file');
    }
}

// Main analysis function
async function analyzePitchContent(content, options = {}) {
    // Simulate AI analysis with realistic scoring
    const clarityScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const engagementScore = Math.floor(Math.random() * 5) + 5; // 5-10
    
    // Generate feedback based on scores
    const clarityFeedback = generateClarityFeedback(clarityScore);
    const engagementFeedback = generateEngagementFeedback(engagementScore);
    
    // Generate recommendations
    const recommendations = generateRecommendations(clarityScore, engagementScore);
    
    return {
        clarityScore,
        engagementScore,
        clarityFeedback,
        engagementFeedback,
        recommendations,
        timestamp: new Date().toISOString()
    };
}

// Helper functions for generating feedback
function generateClarityFeedback(score) {
    const feedbacks = {
        10: "Excellent clarity! Your pitch is well-structured and easy to understand.",
        9: "Very clear presentation with strong logical flow.",
        8: "Good clarity overall, with minor areas for improvement.",
        7: "Generally clear, but some sections could be more concise.",
        6: "Some clarity issues present, consider simplifying complex concepts.",
        5: "Needs improvement in clarity and structure."
    };
    return feedbacks[score] || "Clarity needs significant improvement.";
}

function generateEngagementFeedback(score) {
    const feedbacks = {
        10: "Highly engaging pitch! Captures attention throughout.",
        9: "Very engaging with strong storytelling elements.",
        8: "Good engagement level, maintains interest well.",
        7: "Moderate engagement, could use more compelling elements.",
        6: "Some engagement issues, consider adding more dynamic elements.",
        5: "Needs improvement in engagement and audience connection."
    };
    return feedbacks[score] || "Significant improvement needed in engagement.";
}

function generateRecommendations(clarityScore, engagementScore) {
    const recommendations = [];
    
    if (clarityScore < 8) {
        recommendations.push("Simplify complex concepts and use more visual aids");
        recommendations.push("Ensure consistent terminology throughout the pitch");
    }
    
    if (engagementScore < 8) {
        recommendations.push("Add more storytelling elements to make the pitch more compelling");
        recommendations.push("Include real-world examples and case studies");
    }
    
    if (clarityScore >= 8 && engagementScore >= 8) {
        recommendations.push("Consider adding more detailed market analysis");
        recommendations.push("Include more specific metrics and KPIs");
    }
    
    return recommendations;
}

// Export the main analysis function
export async function performAnalysis(fileUrl, userId, docId) {
    try {
        // Extract text from the uploaded file
        const content = await extractTextFromFile(fileUrl);
        
        // Perform AI analysis
        const analysis = await analyzePitchContent(content);
        
        // Update Firestore with analysis results
        await db.collection('pitch_decks').doc(docId).update({
            status: 'completed',
            analysis: analysis,
            analysisDate: new Date()
        });
        
        return analysis;
    } catch (error) {
        console.error('Analysis error:', error);
        throw error;
    }
}

// Export the report generation function
export async function generateAnalysisReport(analysis) {
    try {
        // In a real implementation, this would generate a PDF report
        // For now, we'll return a formatted HTML string
        const report = `
            <html>
                <head>
                    <title>Pitch Analysis Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .score { font-size: 24px; font-weight: bold; }
                        .feedback { margin: 10px 0; }
                        .recommendations { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Pitch Analysis Report</h1>
                    <div class="scores">
                        <h2>Clarity Score: ${analysis.clarityScore}/10</h2>
                        <p class="feedback">${analysis.clarityFeedback}</p>
                        <h2>Engagement Score: ${analysis.engagementScore}/10</h2>
                        <p class="feedback">${analysis.engagementFeedback}</p>
                    </div>
                    <div class="recommendations">
                        <h2>Key Recommendations</h2>
                        <ul>
                            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </body>
            </html>
        `;
        
        return report;
    } catch (error) {
        console.error('Report generation error:', error);
        throw error;
    }
} 