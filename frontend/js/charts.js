class ChartService {
    constructor() {
        this.charts = {};
        this.colors = [
            '#ffbe0b',
            '#fb5607',
            '#ff006e',
            '#8338ec',
            '#3a86ff',
            '#38b000',
            '#ff595e',
            '#1982c4',
            '#6a4c93',
            '#ffca3a'
        ];
    }

    initializeCharts() {
        this.initializeTransactionPieChart();
        this.initializeMonthlyBarChart();
    }

    initializeTransactionPieChart() {
        const ctx = document.getElementById('transactionPieChart').getContext('2d');
        this.charts.transactionPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: this.colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Transaction Distribution by Type'
                    }
                }
            }
        });
    }

    initializeMonthlyBarChart() {
        const ctx = document.getElementById('monthlyBarChart').getContext('2d');
        this.charts.monthlyBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Transaction Volume',
                    data: [],
                    backgroundColor: this.colors[0],
                    borderColor: this.colors[0],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Volume (RWF)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Transaction Volume'
                    }
                }
            }
        });
    }

    updateTransactionPieChart(data) {
        const chart = this.charts.transactionPie;
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update();
    }

    updateMonthlyBarChart(data) {
        const chart = this.charts.monthlyBar;
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update();
    }
}

const chartService = new ChartService();
export default chartService; 