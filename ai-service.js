// AI Analysis Service Implementation
// Analyzes text input only - no file processing

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

// Main analysis function - text input only (no file processing)
export async function performAnalysis(db, doc, updateDoc, pitchText, userId, docId) {
    try {
        console.log('Starting AI analysis for text input...');
        console.log('Text content length:', pitchText ? pitchText.length : 0);
        
        if (!pitchText || pitchText.trim().length === 0) {
            throw new Error('No text provided for analysis');
        }

        // Update status to analyzing
        await updateDoc(doc(db, 'pitches', docId), {
            status: 'analyzing',
            analysisDate: new Date()
        });

        // Perform AI analysis on the text content only
        const analysis = await analyzePitchContent(pitchText);
        console.log('AI analysis completed:', analysis);

        // Update Firestore with analysis results
        await updateDoc(doc(db, 'pitches', docId), {
            status: 'completed',
            analysis: analysis,
            analysisDate: new Date()
        });
        
        return analysis;
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

// Analyze pitch content using AI
async function analyzePitchContent(content) {
    try {
        console.log('Analyzing pitch content...');
        
        // Prepare the analysis prompt
        const prompt = `Analyze this pitch text and provide a comprehensive evaluation:

Pitch Text:
${content}

Please provide analysis in the following JSON format:
{
    "overall_score": 85,
    "scores": {
        "clarity": 80,
        "engagement": 90,
        "market_fit": 75,
        "uniqueness": 85,
        "financial_viability": 70,
        "team_strength": 80
    },
    "strengths": ["Clear value proposition", "Strong market opportunity"],
    "weaknesses": ["Limited financial projections", "Unclear revenue model"],
    "recommendations": ["Add more financial details", "Clarify competitive advantage"],
    "summary": "Overall strong pitch with room for improvement in financial planning"
}`;

        // Call AI service
        const response = await callAIService(prompt);
        
        // Parse and validate response
        const analysis = JSON.parse(response);
        
        // Add visual elements for better presentation
        analysis.visualData = generateVisualData(analysis);
        
        return analysis;
    } catch (error) {
        console.error('Error analyzing pitch content:', error);
        
        // Return fallback analysis if AI fails
        return generateFallbackAnalysis(content);
    }
}

// Call AI service (OpenAI, Anthropic, etc.) - Currently using fallback
async function callAIService(prompt) {
    try {
        // For now, we'll use the fallback analysis since we don't have a real AI service configured
        console.log('Using fallback analysis (no real AI service configured)');
        throw new Error('AI service not configured - using fallback analysis');
    } catch (error) {
        console.error('AI service call failed:', error);
        throw error;
    }
}

// Generate visual data for charts and graphs
function generateVisualData(analysis) {
    const scores = analysis.scores;
    const categories = Object.keys(scores);
    const values = Object.values(scores);
    
    return {
        chartData: {
            labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')),
            datasets: [{
                label: 'Score',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        overallScore: analysis.overall_score,
        scoreColor: getScoreColor(analysis.overall_score)
    };
}

// Get color based on score
function getScoreColor(score) {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
}

// Generate sophisticated fallback analysis if AI fails
function generateFallbackAnalysis(content) {
    const wordCount = content.split(' ').length;
    const sentenceCount = content.split('.').length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    const contentLower = content.toLowerCase();
    
    // Initialize base scores
    let clarity = 60;
    let engagement = 60;
    let marketFit = 60;
    let uniqueness = 60;
    let financialViability = 60;
    let teamStrength = 60;
    
    // Analyze content for clarity
    if (avgWordsPerSentence < 25) clarity += 15; // Shorter sentences = clearer
    if (avgWordsPerSentence > 40) clarity -= 10; // Very long sentences = unclear
    if (contentLower.includes('clearly') || contentLower.includes('simple')) clarity += 10;
    if (contentLower.includes('complex') || contentLower.includes('complicated')) clarity -= 5;
    
    // Analyze content for engagement
    if (contentLower.includes('exciting') || contentLower.includes('innovative')) engagement += 15;
    if (contentLower.includes('revolutionary') || contentLower.includes('breakthrough')) engagement += 20;
    if (contentLower.includes('passion') || contentLower.includes('vision')) engagement += 10;
    if (wordCount > 200) engagement += 5; // More content shows engagement
    
    // Analyze content for market fit
    if (contentLower.includes('market') || contentLower.includes('customer')) marketFit += 15;
    if (contentLower.includes('target audience') || contentLower.includes('demand')) marketFit += 10;
    if (contentLower.includes('problem') && contentLower.includes('solution')) marketFit += 15;
    if (contentLower.includes('market size') || contentLower.includes('opportunity')) marketFit += 10;
    
    // Analyze content for uniqueness
    if (contentLower.includes('unique') || contentLower.includes('innovative')) uniqueness += 15;
    if (contentLower.includes('patent') || contentLower.includes('proprietary')) uniqueness += 20;
    if (contentLower.includes('first') || contentLower.includes('only')) uniqueness += 10;
    if (contentLower.includes('competitive advantage')) uniqueness += 15;
    
    // Analyze content for financial viability
    if (contentLower.includes('revenue') || contentLower.includes('profit')) financialViability += 15;
    if (contentLower.includes('funding') || contentLower.includes('investment')) financialViability += 10;
    if (contentLower.includes('business model') || contentLower.includes('monetization')) financialViability += 15;
    if (contentLower.includes('roi') || contentLower.includes('return')) financialViability += 10;
    if (contentLower.includes('$') || contentLower.includes('million') || contentLower.includes('billion')) financialViability += 10;
    
    // Analyze content for team strength
    if (contentLower.includes('team') || contentLower.includes('founder')) teamStrength += 10;
    if (contentLower.includes('experience') || contentLower.includes('expertise')) teamStrength += 15;
    if (contentLower.includes('background') || contentLower.includes('qualification')) teamStrength += 10;
    if (contentLower.includes('advisor') || contentLower.includes('mentor')) teamStrength += 5;
    
    // Ensure scores are within bounds
    const scores = {
        clarity: Math.min(100, Math.max(30, clarity)),
        engagement: Math.min(100, Math.max(30, engagement)),
        market_fit: Math.min(100, Math.max(30, marketFit)),
        uniqueness: Math.min(100, Math.max(30, uniqueness)),
        financial_viability: Math.min(100, Math.max(30, financialViability)),
        team_strength: Math.min(100, Math.max(30, teamStrength))
    };
    
    const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6);
    
    // Generate dynamic strengths and weaknesses based on content
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];
    
    if (scores.clarity >= 75) strengths.push("Clear and well-structured presentation");
    if (scores.engagement >= 75) strengths.push("Engaging and compelling narrative");
    if (scores.market_fit >= 75) strengths.push("Strong market understanding and customer focus");
    if (scores.uniqueness >= 75) strengths.push("Clear differentiation and unique value proposition");
    if (scores.financial_viability >= 75) strengths.push("Solid financial planning and business model");
    if (scores.team_strength >= 75) strengths.push("Strong team and relevant experience");
    
    if (scores.clarity < 60) {
        weaknesses.push("Could improve clarity and simplicity of messaging");
        recommendations.push("Simplify language and use shorter sentences");
    }
    if (scores.engagement < 60) {
        weaknesses.push("Needs more compelling and engaging content");
        recommendations.push("Add more exciting and innovative language");
    }
    if (scores.market_fit < 60) {
        weaknesses.push("Limited market research and customer validation");
        recommendations.push("Include more market data and customer insights");
    }
    if (scores.uniqueness < 60) {
        weaknesses.push("Unclear competitive advantage and differentiation");
        recommendations.push("Clearly define what makes your solution unique");
    }
    if (scores.financial_viability < 60) {
        weaknesses.push("Insufficient financial planning and projections");
        recommendations.push("Add detailed financial models and revenue projections");
    }
    if (scores.team_strength < 60) {
        weaknesses.push("Limited team information and experience details");
        recommendations.push("Highlight team expertise and relevant background");
    }
    
    // Default strengths if none identified
    if (strengths.length === 0) {
        strengths.push("Good overall structure and business terminology");
        strengths.push("Comprehensive coverage of key pitch elements");
    }
    
    // Default weaknesses if none identified
    if (weaknesses.length === 0) {
        weaknesses.push("Could benefit from more specific metrics and data");
        weaknesses.push("Consider adding more detailed market research");
    }
    
    // Default recommendations if none identified
    if (recommendations.length === 0) {
        recommendations.push("Add more data-driven insights and metrics");
        recommendations.push("Include competitive analysis and market positioning");
        recommendations.push("Provide more detailed financial projections");
    }
    
    const summary = `This pitch shows ${overallScore >= 70 ? 'strong' : overallScore >= 50 ? 'moderate' : 'potential for improvement in'} potential with an overall score of ${overallScore}/100. ${overallScore >= 70 ? 'The content demonstrates good understanding of key business concepts.' : 'Consider focusing on the areas identified for improvement to strengthen your pitch.'}`;
    
    return {
        overall_score: overallScore,
        scores: scores,
        strengths: strengths,
        weaknesses: weaknesses,
        recommendations: recommendations,
        summary: summary,
        visualData: generateVisualData({
            overall_score: overallScore,
            scores: scores
        })
    };
}

// Generate analysis report with visual elements
export async function generateAnalysisReport(analysis) {
    try {
        const report = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PitchFrame AI Analysis Report</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                        padding: 40px;
                    }
                    .score-overview {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    .score-card {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        border-left: 4px solid #667eea;
                    }
                    .score-value {
                        font-size: 2.5em;
                        font-weight: bold;
                        color: #667eea;
                        margin: 10px 0;
                    }
                    .chart-container {
                        margin: 40px 0;
                        height: 400px;
                    }
                    .section {
                        margin: 40px 0;
                    }
                    .section h2 {
                        color: #667eea;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 10px;
                    }
                    .strengths, .weaknesses, .recommendations {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                    }
                    .strengths {
                        border-left: 4px solid #4CAF50;
                    }
                    .weaknesses {
                        border-left: 4px solid #F44336;
                    }
                    .recommendations {
                        border-left: 4px solid #FF9800;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                    }
                    li {
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    li:before {
                        content: "✓";
                        color: #4CAF50;
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    .weaknesses li:before {
                        content: "⚠";
                        color: #F44336;
                    }
                    .recommendations li:before {
                        content: "💡";
                        margin-right: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>PitchFrame AI Analysis</h1>
                        <p>Comprehensive Pitch Evaluation Report</p>
                    </div>
                    <div class="content">
                        <div class="score-overview">
                            <div class="score-card">
                                <h3>Overall Score</h3>
                                <div class="score-value" style="color: ${analysis.visualData.scoreColor}">${analysis.overall_score}/100</div>
                        </div>
                            <div class="score-card">
                                <h3>Clarity</h3>
                                <div class="score-value">${analysis.scores.clarity}/100</div>
                            </div>
                            <div class="score-card">
                                <h3>Engagement</h3>
                                <div class="score-value">${analysis.scores.engagement}/100</div>
                            </div>
                            <div class="score-card">
                                <h3>Market Fit</h3>
                                <div class="score-value">${analysis.scores.market_fit}/100</div>
                            </div>
                            <div class="score-card">
                                <h3>Uniqueness</h3>
                                <div class="score-value">${analysis.scores.uniqueness}/100</div>
                            </div>
                            <div class="score-card">
                                <h3>Financial Viability</h3>
                                <div class="score-value">${analysis.scores.financial_viability}/100</div>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <canvas id="analysisChart"></canvas>
                        </div>
                        
                        <div class="section">
                            <h2>Summary</h2>
                            <p>${analysis.summary}</p>
                        </div>
                        
                        <div class="section">
                            <h2>Strengths</h2>
                            <div class="strengths">
                                <ul>
                                    ${analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2>Areas for Improvement</h2>
                            <div class="weaknesses">
                                <ul>
                                    ${analysis.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2>Recommendations</h2>
                            <div class="recommendations">
                                <ul>
                                    ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                            </div>
                        </div>
                
                <script>
                    // Create the chart
                    const ctx = document.getElementById('analysisChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'radar',
                        data: ${JSON.stringify(analysis.visualData.chartData)},
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                r: {
                                    beginAtZero: true,
                                    max: 100,
                                    ticks: {
                                        stepSize: 20
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `;
        
        return report;
    } catch (error) {
        console.error('Error generating analysis report:', error);
        throw error;
    }
} 