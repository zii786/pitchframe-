// Advanced AI Analysis Service Implementation
// Note: This service now expects 'window.db' to be available.

// Constants for analysis
const ANALYSIS_TYPES = {
    CLARITY: 'clarity',
    ENGAGEMENT: 'engagement',
    MARKET_FIT: 'market_fit',
    UNIQUENESS: 'uniqueness',
    FINANCIAL_VIABILITY: 'financial_viability',
    TEAM_STRENGTH: 'team_strength'
};

// Import AI configuration
import { AI_CONFIG } from './ai-config.js';

// PDF.js for text extraction
let pdfjsLib = null;

// Initialize PDF.js
async function initializePDFJS() {
    if (!pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = () => {
                pdfjsLib = window.pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
        });
    }
}

// Enhanced text extraction from PDF using Cloud Function
async function extractTextFromPDF(fileUrl, userId, docId) {
    try {
        console.log('Attempting PDF text extraction via Cloud Function...');
        
        // Import Firebase Functions
        const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
        const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        
        const functions = getFunctions(getApp());
        const analyzePitchProxy = httpsCallable(functions, 'analyzePitchProxy');
        
        // Call Cloud Function to extract text and analyze
        const result = await analyzePitchProxy({
            fileUrl: fileUrl,
            userId: userId,
            docId: docId
        });
        
        if (result.data.success) {
            console.log('PDF text extraction successful via Cloud Function');
            return result.data.extractedTextLength > 0 ? 'Text extracted successfully' : 'No text content found';
        } else {
            throw new Error('Cloud function failed to extract text');
        }
    } catch (error) {
        console.error('Error extracting PDF text via Cloud Function:', error);
        
        // Provide user-friendly error messages
        if (error.code === 'functions/unavailable') {
            throw new Error('Analysis service is temporarily unavailable. Please try again later.');
        } else if (error.code === 'functions/deadline-exceeded') {
            throw new Error('Analysis is taking longer than expected. Please try again.');
        } else if (error.code === 'functions/resource-exhausted') {
            throw new Error('Analysis service is currently overloaded. Please try again in a few minutes.');
        }
        
        // Fallback to client-side extraction if Cloud Function fails
        console.log('Falling back to client-side PDF extraction...');
        return await extractTextFromPDFFallback(fileUrl);
    }
}

// Fallback PDF extraction using PDF.js
async function extractTextFromPDFFallback(fileUrl) {
    try {
        console.log('Starting client-side PDF extraction...');
        await initializePDFJS();
        
        // Create a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(fileUrl, { 
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer.byteLength === 0) {
            throw new Error('PDF file is empty or corrupted');
        }
        
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0 // Reduce console output
        }).promise;
        
        if (pdf.numPages === 0) {
            throw new Error('PDF contains no pages');
        }
        
        let fullText = '';
        let extractedPages = 0;
        
        // Limit to first 10 pages to avoid timeout
        const maxPages = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= maxPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                
                if (pageText.trim().length > 0) {
                    fullText += `Page ${i}: ${pageText}\n\n`;
                    extractedPages++;
                }
            } catch (pageError) {
                console.warn(`Error extracting page ${i}:`, pageError);
                // Continue with other pages
            }
        }
        
        if (extractedPages === 0) {
            throw new Error('No text content could be extracted from the PDF');
        }
        
        console.log(`Successfully extracted text from ${extractedPages} pages`);
        return fullText;
        
    } catch (error) {
        console.error('Error extracting PDF text (fallback):', error);
        
        if (error.name === 'AbortError') {
            throw new Error('PDF extraction timed out. Please try with a smaller file.');
        } else if (error.message.includes('HTTP error')) {
            throw new Error('Unable to access the PDF file. Please check your internet connection.');
        } else if (error.message.includes('empty or corrupted')) {
            throw new Error('The PDF file appears to be empty or corrupted. Please upload a valid PDF.');
        } else if (error.message.includes('No text content')) {
            throw new Error('The PDF does not contain extractable text. Please ensure the PDF has selectable text.');
        } else {
            throw new Error('Failed to extract text from PDF. Please try uploading a different file.');
        }
    }
}

// Extract text from PowerPoint files (basic implementation)
async function extractTextFromPPT(fileUrl) {
    try {
        // For PowerPoint files, we'll use a simplified approach
        // In production, you might want to use a service like Aspose or convert to PDF first
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        
        // This is a placeholder - real PPT text extraction would require specialized libraries
        return "PowerPoint content extraction would be implemented here. For now, returning placeholder text for analysis.";
    } catch (error) {
        console.error('Error extracting PPT text:', error);
        throw new Error('Failed to extract text from PowerPoint file');
    }
}

// Main text extraction function
async function extractTextFromFile(fileUrl, fileType, userId = null, docId = null) {
    try {
        if (fileType === 'application/pdf') {
            if (userId && docId) {
                return await extractTextFromPDF(fileUrl, userId, docId);
            } else {
                return await extractTextFromPDFFallback(fileUrl);
            }
        } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
            return await extractTextFromPPT(fileUrl);
        } else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file');
    }
}

// Real AI Analysis using OpenAI API
async function analyzeWithOpenAI(content) {
    try {
        const prompt = `Analyze this startup pitch deck content and provide detailed feedback. Rate each aspect from 1-10 and provide specific recommendations.

Content: ${content.substring(0, 4000)} // Limit content to avoid token limits

Please provide analysis in this JSON format:
{
    "clarityScore": number (1-10),
    "engagementScore": number (1-10),
    "marketFitScore": number (1-10),
    "uniquenessScore": number (1-10),
    "financialViabilityScore": number (1-10),
    "teamStrengthScore": number (1-10),
    "clarityFeedback": "detailed feedback on clarity",
    "engagementFeedback": "detailed feedback on engagement",
    "marketFitFeedback": "detailed feedback on market fit",
    "uniquenessFeedback": "detailed feedback on uniqueness",
    "financialViabilityFeedback": "detailed feedback on financial viability",
    "teamStrengthFeedback": "detailed feedback on team strength",
    "overallScore": number (1-10),
    "overallFeedback": "comprehensive overall feedback",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "marketAnalysis": "analysis of market opportunity",
    "competitiveAdvantage": "analysis of competitive advantage",
    "riskAssessment": "assessment of key risks"
}`;

        const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert startup pitch analyst with 10+ years of experience in venture capital and entrepreneurship. Provide detailed, actionable feedback.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.choices[0].message.content;
        
        // Parse JSON response
        const analysis = JSON.parse(analysisText);
        analysis.timestamp = new Date().toISOString();
        analysis.aiService = 'openai';
        
        return analysis;
    } catch (error) {
        console.error('OpenAI analysis error:', error);
        throw error;
    }
}

// Real AI Analysis using Anthropic Claude API
async function analyzeWithAnthropic(content) {
    try {
        const prompt = `Analyze this startup pitch deck content and provide detailed feedback. Rate each aspect from 1-10 and provide specific recommendations.

Content: ${content.substring(0, 4000)}

Please provide analysis in this JSON format:
{
    "clarityScore": number (1-10),
    "engagementScore": number (1-10),
    "marketFitScore": number (1-10),
    "uniquenessScore": number (1-10),
    "financialViabilityScore": number (1-10),
    "teamStrengthScore": number (1-10),
    "clarityFeedback": "detailed feedback on clarity",
    "engagementFeedback": "detailed feedback on engagement",
    "marketFitFeedback": "detailed feedback on market fit",
    "uniquenessFeedback": "detailed feedback on uniqueness",
    "financialViabilityFeedback": "detailed feedback on financial viability",
    "teamStrengthFeedback": "detailed feedback on team strength",
    "overallScore": number (1-10),
    "overallFeedback": "comprehensive overall feedback",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "marketAnalysis": "analysis of market opportunity",
    "competitiveAdvantage": "analysis of competitive advantage",
    "riskAssessment": "assessment of key risks"
}`;

        const response = await fetch(AI_CONFIG.ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_CONFIG.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.content[0].text;
        
        // Parse JSON response
        const analysis = JSON.parse(analysisText);
        analysis.timestamp = new Date().toISOString();
        analysis.aiService = 'anthropic';
        
        return analysis;
    } catch (error) {
        console.error('Anthropic analysis error:', error);
        throw error;
    }
}

// Mock analysis for testing (when no AI service is configured)
async function analyzeWithMock(content) {
    // Simulate AI analysis with realistic scoring
    const clarityScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const engagementScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const marketFitScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const uniquenessScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const financialViabilityScore = Math.floor(Math.random() * 5) + 5; // 5-10
    const teamStrengthScore = Math.floor(Math.random() * 5) + 5; // 5-10
    
    const overallScore = Math.round((clarityScore + engagementScore + marketFitScore + uniquenessScore + financialViabilityScore + teamStrengthScore) / 6);
    
    return {
        clarityScore,
        engagementScore,
        marketFitScore,
        uniquenessScore,
        financialViabilityScore,
        teamStrengthScore,
        overallScore,
        clarityFeedback: generateClarityFeedback(clarityScore),
        engagementFeedback: generateEngagementFeedback(engagementScore),
        marketFitFeedback: generateMarketFitFeedback(marketFitScore),
        uniquenessFeedback: generateUniquenessFeedback(uniquenessScore),
        financialViabilityFeedback: generateFinancialViabilityFeedback(financialViabilityScore),
        teamStrengthFeedback: generateTeamStrengthFeedback(teamStrengthScore),
        overallFeedback: generateOverallFeedback(overallScore),
        strengths: generateStrengths(),
        weaknesses: generateWeaknesses(),
        recommendations: generateRecommendations(clarityScore, engagementScore),
        marketAnalysis: "Market analysis would be provided by AI service",
        competitiveAdvantage: "Competitive advantage analysis would be provided by AI service",
        riskAssessment: "Risk assessment would be provided by AI service",
        timestamp: new Date().toISOString(),
        aiService: 'mock'
    };
}

// Main analysis function
async function analyzePitchContent(content, options = {}) {
    try {
        switch (AI_CONFIG.USE_AI_SERVICE) {
            case 'openai':
                if (AI_CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
                    console.warn('OpenAI API key not configured, using mock analysis');
                    return await analyzeWithMock(content);
                }
                return await analyzeWithOpenAI(content);
            case 'anthropic':
                if (AI_CONFIG.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
                    console.warn('Anthropic API key not configured, using mock analysis');
                    return await analyzeWithMock(content);
                }
                return await analyzeWithAnthropic(content);
            case 'mock':
            default:
                return await analyzeWithMock(content);
        }
    } catch (error) {
        console.error('AI analysis error:', error);
        // Fallback to mock analysis if AI service fails
        console.warn('AI service failed, using mock analysis');
        return await analyzeWithMock(content);
    }
}

// Enhanced feedback generation functions
function generateClarityFeedback(score) {
    const feedbacks = {
        10: "Exceptional clarity! Your pitch is perfectly structured with clear, logical flow and easy-to-understand concepts.",
        9: "Excellent clarity with strong logical progression and well-defined concepts.",
        8: "Very clear presentation with minor areas that could be more concise.",
        7: "Good clarity overall, but some sections need simplification for better understanding.",
        6: "Moderate clarity issues present - consider restructuring complex sections.",
        5: "Significant clarity problems - needs major restructuring and simplification."
    };
    return feedbacks[score] || "Clarity needs substantial improvement.";
}

function generateEngagementFeedback(score) {
    const feedbacks = {
        10: "Outstanding engagement! Your pitch captivates from start to finish with compelling storytelling.",
        9: "Highly engaging with excellent storytelling and strong emotional connection.",
        8: "Good engagement level with effective use of storytelling elements.",
        7: "Moderate engagement - could benefit from more compelling narrative elements.",
        6: "Some engagement issues - consider adding more dynamic and interactive elements.",
        5: "Low engagement - needs significant improvement in storytelling and audience connection."
    };
    return feedbacks[score] || "Significant improvement needed in engagement.";
}

function generateMarketFitFeedback(score) {
    const feedbacks = {
        10: "Perfect market fit! Clear evidence of strong demand and excellent positioning.",
        9: "Excellent market fit with compelling evidence of market need and opportunity.",
        8: "Good market fit with solid evidence of market demand.",
        7: "Moderate market fit - could strengthen evidence of market need.",
        6: "Some market fit concerns - need stronger evidence of market demand.",
        5: "Weak market fit - requires significant market research and validation."
    };
    return feedbacks[score] || "Market fit needs substantial improvement.";
}

function generateUniquenessFeedback(score) {
    const feedbacks = {
        10: "Highly unique solution with clear differentiation and competitive advantages.",
        9: "Very unique approach with strong differentiation from competitors.",
        8: "Good uniqueness with clear competitive advantages.",
        7: "Moderate uniqueness - could strengthen differentiation.",
        6: "Some uniqueness concerns - need stronger competitive advantages.",
        5: "Weak uniqueness - requires significant differentiation strategy."
    };
    return feedbacks[score] || "Uniqueness needs substantial improvement.";
}

function generateFinancialViabilityFeedback(score) {
    const feedbacks = {
        10: "Excellent financial model with realistic projections and strong unit economics.",
        9: "Very strong financial viability with solid business model.",
        8: "Good financial foundation with reasonable projections.",
        7: "Moderate financial viability - could strengthen business model.",
        6: "Some financial concerns - need stronger unit economics.",
        5: "Weak financial viability - requires significant business model improvements."
    };
    return feedbacks[score] || "Financial viability needs substantial improvement.";
}

function generateTeamStrengthFeedback(score) {
    const feedbacks = {
        10: "Outstanding team with exceptional expertise and relevant experience.",
        9: "Excellent team with strong relevant experience and skills.",
        8: "Good team composition with solid expertise.",
        7: "Moderate team strength - could benefit from additional expertise.",
        6: "Some team gaps - need stronger relevant experience.",
        5: "Weak team composition - requires significant team building."
    };
    return feedbacks[score] || "Team strength needs substantial improvement.";
}

function generateOverallFeedback(score) {
    const feedbacks = {
        10: "Outstanding pitch! This is investment-ready with exceptional potential.",
        9: "Excellent pitch with strong investment potential and clear value proposition.",
        8: "Very good pitch with solid foundation and good potential.",
        7: "Good pitch with some areas for improvement before seeking investment.",
        6: "Moderate pitch quality - needs significant improvements before investment.",
        5: "Weak pitch - requires major improvements across all areas."
    };
    return feedbacks[score] || "Overall pitch quality needs substantial improvement.";
}

function generateStrengths() {
    const strengths = [
        "Clear problem identification and solution",
        "Strong market opportunity",
        "Experienced founding team",
        "Solid business model",
        "Competitive advantages",
        "Realistic financial projections",
        "Strong customer validation",
        "Scalable technology platform"
    ];
    return strengths.slice(0, Math.floor(Math.random() * 3) + 3);
}

function generateWeaknesses() {
    const weaknesses = [
        "Limited market validation",
        "Unclear revenue model",
        "Weak competitive differentiation",
        "Insufficient team expertise",
        "Unrealistic financial projections",
        "Limited customer traction",
        "Technology scalability concerns",
        "Market size overestimation"
    ];
    return weaknesses.slice(0, Math.floor(Math.random() * 3) + 2);
}

function generateRecommendations(clarityScore, engagementScore) {
    const recommendations = [];
    
    if (clarityScore < 8) {
        recommendations.push("Simplify complex concepts and use more visual aids");
        recommendations.push("Ensure consistent terminology throughout the pitch");
        recommendations.push("Add executive summary with key points");
    }
    
    if (engagementScore < 8) {
        recommendations.push("Add more storytelling elements to make the pitch more compelling");
        recommendations.push("Include real-world examples and case studies");
        recommendations.push("Use more dynamic visuals and interactive elements");
    }
    
    recommendations.push("Conduct more customer interviews for validation");
    recommendations.push("Develop detailed financial projections with assumptions");
    recommendations.push("Create competitive analysis with clear differentiation");
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
}

// Export the main analysis function
export async function performAnalysis(db, doc, updateDoc, fileUrl, userId, docId, fileType = 'application/pdf') {
    try {
        console.log('Starting AI analysis...');
        
        // For PDF files, use Cloud Function approach
        if (fileType === 'application/pdf') {
            try {
                // Import Firebase Functions
                const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
                const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
                
                const functions = getFunctions(getApp());
                const analyzePitchProxy = httpsCallable(functions, 'analyzePitchProxy');
                
                // Call Cloud Function to extract text and analyze
                const result = await analyzePitchProxy({
                    fileUrl: fileUrl,
                    userId: userId,
                    docId: docId
                });
                
                if (result.data.success) {
                    console.log('AI analysis completed via Cloud Function:', result.data.analysis);
                    return result.data.analysis;
                } else {
                    throw new Error('Cloud function analysis failed');
                }
            } catch (error) {
                console.error('Cloud Function analysis failed, falling back to client-side:', error);
                // Fallback to client-side analysis
                return await performClientSideAnalysis(fileUrl, fileType, userId, docId);
            }
        } else {
            // For non-PDF files, use client-side analysis
            return await performClientSideAnalysis(fileUrl, fileType, userId, docId);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        
        // Update Firestore with error status
        try {
            await updateDoc(doc(db, 'pitches', docId), {
                status: 'error',
                errorMessage: error.message,
                analysisDate: new Date()
            });
        } catch (updateError) {
            console.error('Error updating document with error status:', updateError);
        }
        
        throw error;
    }
}

// Client-side analysis fallback
async function performClientSideAnalysis(fileUrl, fileType, userId, docId) {
    try {
        // Extract text from the uploaded file
        const content = await extractTextFromFile(fileUrl, fileType);
        console.log('Text extracted from file:', content.substring(0, 200) + '...');
        
        // Perform AI analysis
        const analysis = await analyzePitchContent(content);
        console.log('AI analysis completed:', analysis);
        
        return analysis;
    } catch (error) {
        console.error('Client-side analysis error:', error);
        throw error;
    }
}

// Enhanced report generation function
export async function generateAnalysisReport(analysis) {
    try {
        const report = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PitchFrame AI Analysis Report</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        background-color: #f8f9fa;
                        color: #333;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 2.5em;
                        font-weight: 300;
                    }
                    .header p {
                        margin: 10px 0 0 0;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 30px;
                    }
                    .overall-score {
                        text-align: center;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 10px;
                    }
                    .overall-score .score {
                        font-size: 4em;
                        font-weight: bold;
                        color: #28a745;
                        margin: 0;
                    }
                    .overall-score .label {
                        font-size: 1.2em;
                        color: #666;
                        margin: 10px 0;
                    }
                    .scores-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin: 30px 0;
                    }
                    .score-card {
                        border: 1px solid #e9ecef;
                        border-radius: 10px;
                        padding: 20px;
                        background: white;
                    }
                    .score-card h3 {
                        margin: 0 0 15px 0;
                        color: #495057;
                        font-size: 1.1em;
                    }
                    .score-value {
                        font-size: 2em;
                        font-weight: bold;
                        color: #007bff;
                        margin: 10px 0;
                    }
                    .feedback {
                        color: #666;
                        line-height: 1.6;
                        margin: 10px 0;
                    }
                    .section {
                        margin: 30px 0;
                    }
                    .section h2 {
                        color: #495057;
                        border-bottom: 2px solid #e9ecef;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .strengths, .weaknesses, .recommendations {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 15px 0;
                    }
                    .strengths {
                        border-left: 4px solid #28a745;
                    }
                    .weaknesses {
                        border-left: 4px solid #dc3545;
                    }
                    .recommendations {
                        border-left: 4px solid #ffc107;
                    }
                    .strengths h3, .weaknesses h3, .recommendations h3 {
                        margin: 0 0 15px 0;
                        color: #495057;
                    }
                    .strengths h3 { color: #28a745; }
                    .weaknesses h3 { color: #dc3545; }
                    .recommendations h3 { color: #ffc107; }
                    ul {
                        margin: 0;
                        padding-left: 20px;
                    }
                    li {
                        margin: 8px 0;
                        line-height: 1.5;
                    }
                    .analysis-details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                    }
                    .analysis-details h3 {
                        margin: 0 0 15px 0;
                        color: #495057;
                    }
                    .footer {
                        background: #495057;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        margin-top: 30px;
                    }
                    .timestamp {
                        color: #999;
                        font-size: 0.9em;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>PitchFrame AI Analysis Report</h1>
                        <p>Comprehensive Pitch Deck Analysis</p>
                    </div>
                    
                    <div class="content">
                        <div class="overall-score">
                            <div class="score">${analysis.overallScore || analysis.clarityScore}/10</div>
                            <div class="label">Overall Score</div>
                            <p class="feedback">${analysis.overallFeedback || analysis.clarityFeedback}</p>
                        </div>
                        
                        <div class="scores-grid">
                            <div class="score-card">
                                <h3>Clarity</h3>
                                <div class="score-value">${analysis.clarityScore}/10</div>
                                <div class="feedback">${analysis.clarityFeedback}</div>
                            </div>
                            <div class="score-card">
                                <h3>Engagement</h3>
                                <div class="score-value">${analysis.engagementScore}/10</div>
                                <div class="feedback">${analysis.engagementFeedback}</div>
                            </div>
                            <div class="score-card">
                                <h3>Market Fit</h3>
                                <div class="score-value">${analysis.marketFitScore || 'N/A'}/10</div>
                                <div class="feedback">${analysis.marketFitFeedback || 'Market fit analysis not available'}</div>
                            </div>
                            <div class="score-card">
                                <h3>Uniqueness</h3>
                                <div class="score-value">${analysis.uniquenessScore || 'N/A'}/10</div>
                                <div class="feedback">${analysis.uniquenessFeedback || 'Uniqueness analysis not available'}</div>
                            </div>
                            <div class="score-card">
                                <h3>Financial Viability</h3>
                                <div class="score-value">${analysis.financialViabilityScore || 'N/A'}/10</div>
                                <div class="feedback">${analysis.financialViabilityFeedback || 'Financial viability analysis not available'}</div>
                            </div>
                            <div class="score-card">
                                <h3>Team Strength</h3>
                                <div class="score-value">${analysis.teamStrengthScore || 'N/A'}/10</div>
                                <div class="feedback">${analysis.teamStrengthFeedback || 'Team strength analysis not available'}</div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2>Strengths</h2>
                            <div class="strengths">
                                <h3>What's Working Well</h3>
                                <ul>
                                    ${(analysis.strengths || []).map(strength => `<li>${strength}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2>Areas for Improvement</h2>
                            <div class="weaknesses">
                                <h3>Key Weaknesses</h3>
                                <ul>
                                    ${(analysis.weaknesses || []).map(weakness => `<li>${weakness}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2>Recommendations</h2>
                            <div class="recommendations">
                                <h3>Action Items</h3>
                                <ul>
                                    ${(analysis.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        ${analysis.marketAnalysis ? `
                        <div class="section">
                            <h2>Market Analysis</h2>
                            <div class="analysis-details">
                                <p>${analysis.marketAnalysis}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${analysis.competitiveAdvantage ? `
                        <div class="section">
                            <h2>Competitive Advantage</h2>
                            <div class="analysis-details">
                                <p>${analysis.competitiveAdvantage}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${analysis.riskAssessment ? `
                        <div class="section">
                            <h2>Risk Assessment</h2>
                            <div class="analysis-details">
                                <p>${analysis.riskAssessment}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="footer">
                        <p>Generated by PitchFrame AI Analysis System</p>
                        <div class="timestamp">
                            Analysis completed: ${new Date(analysis.timestamp).toLocaleString()}
                            ${analysis.aiService ? ` | Powered by ${analysis.aiService.toUpperCase()}` : ''}
                        </div>
                    </div>
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