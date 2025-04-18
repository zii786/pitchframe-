// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize performance chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    const performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Views',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Feedback',
                data: [28, 48, 40, 19, 86, 27],
                borderColor: '#f72585',
                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Initialize feedback distribution chart
    const feedbackCtx = document.getElementById('feedbackChart').getContext('2d');
    const feedbackChart = new Chart(feedbackCtx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Constructive', 'Critical'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: [
                    '#4CAF50',
                    '#FFC107',
                    '#2196F3',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Time period filter buttons
    const timeFilterButtons = document.querySelectorAll('.btn-group .btn');
    timeFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            timeFilterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // In a real application, this would fetch new data based on the selected time period
            // For now, we'll just update the chart data with random values
            const newData = Array.from({length: 6}, () => Math.floor(Math.random() * 100));
            performanceChart.data.datasets[0].data = newData;
            performanceChart.update();
        });
    });

    // Add animation to metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    
    const animateMetricCards = function() {
        metricCards.forEach(card => {
            const cardPosition = card.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (cardPosition < screenPosition) {
                card.classList.add('fade-in');
            }
        });
    };

    // Run animation check on scroll
    window.addEventListener('scroll', animateMetricCards);
    
    // Run once on load
    animateMetricCards();
}); 