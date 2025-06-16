class ChartManager {
    constructor() {
        this.monthlyChart = null;
        this.typeDistributionChart = null;
        this.initializeCharts();
    }

    formatAmount(amount) {
        // Format as RWF with thousands separator
        return new Intl.NumberFormat('en-RW', {
            style: 'decimal',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        }).format(amount) + ' RWF';
    }

    initializeCharts() {
        // Initialize Monthly Chart
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        this.monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Transaction Count',
                        data: [],
                        borderColor: '#007bff',
                        tension: 0.1,
                        yAxisID: 'count'
                    },
                    {
                        label: 'Total Amount (RWF)',
                        data: [],
                        borderColor: '#28a745',
                        tension: 0.1,
                        yAxisID: 'amount'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    count: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Transaction Count'
                        }
                    },
                    amount: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Total Amount (RWF)'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-RW', {
                                    style: 'decimal',
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 1) {
                                    label += new Intl.NumberFormat('en-RW', {
                                        style: 'decimal',
                                        maximumFractionDigits: 0
                                    }).format(context.raw) + ' RWF';
                                } else {
                                    label += context.raw;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // Initialize Type Distribution Chart
        const typeCtx = document.getElementById('typeDistributionChart').getContext('2d');
        this.typeDistributionChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#dc3545',
                        '#ffc107',
                        '#17a2b8',
                        '#6c757d',
                        '#fd7e14',
                        '#20c997',
                        '#e83e8c',
                        '#6610f2'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateMonthlyChart(data) {
        const months = data.map(item => item.month);
        const counts = data.map(item => item.transaction_count);
        const amounts = data.map(item => item.total_amount);

        this.monthlyChart.data.labels = months;
        this.monthlyChart.data.datasets[0].data = counts;
        this.monthlyChart.data.datasets[1].data = amounts;
        this.monthlyChart.update();
    }

    updateTypeDistribution(transactions) {
        const typeCount = {};
        transactions.forEach(transaction => {
            typeCount[transaction.type] = (typeCount[transaction.type] || 0) + 1;
        });

        const labels = Object.keys(typeCount);
        const data = Object.values(typeCount);

        this.typeDistributionChart.data.labels = labels;
        this.typeDistributionChart.data.datasets[0].data = data;
        this.typeDistributionChart.update();
    }
} 