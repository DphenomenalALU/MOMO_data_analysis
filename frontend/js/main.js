import api from './api.js';
import chartService from './charts.js';

class DashboardManager {
    constructor() {
        this.currentFilters = {
            type: 'all',
            date: '',
            search: ''
        };
        this.initializeEventListeners();
        this.initializeDashboard();
    }

    initializeEventListeners() {
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.updateDashboard();
        });

        // Transaction type filter
        document.getElementById('transactionType').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.updateDashboard();
        });

        // Date filter
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.updateDashboard();
        });
    }

    async initializeDashboard() {
        chartService.initializeCharts();
        await this.updateDashboard();
    }

    async updateDashboard() {
        await Promise.all([
            this.updateTransactions(),
            this.updateStats(),
            this.updateCharts()
        ]);
    }

    async updateTransactions() {
        const transactions = await api.fetchTransactions(this.currentFilters);
        this.renderTransactionsTable(transactions);
    }

    async updateStats() {
        const stats = await api.fetchTransactionStats();
        this.updateStatsDisplay(stats);
    }

    async updateCharts() {
        const monthlyTrends = await api.fetchMonthlyTrends();
        this.updateChartsDisplay(monthlyTrends);
    }

    renderTransactionsTable(transactions) {
        const tbody = document.getElementById('transactionsBody');
        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${this.formatDate(transaction.date)}</td>
                <td>${transaction.type}</td>
                <td>${this.formatAmount(transaction.amount)}</td>
                <td>${transaction.details}</td>
                <td>
                    <button onclick="showTransactionDetails('${transaction.id}')" class="btn-details">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalTransactions').textContent = stats.totalTransactions.toLocaleString();
        document.getElementById('totalVolume').textContent = this.formatAmount(stats.totalVolume);
        document.getElementById('averageTransaction').textContent = this.formatAmount(stats.averageTransaction);
    }

    updateChartsDisplay(trends) {
        const pieChartData = {
            labels: trends.byType.map(item => item.type),
            values: trends.byType.map(item => item.count)
        };

        const barChartData = {
            labels: trends.monthly.map(item => item.month),
            values: trends.monthly.map(item => item.volume)
        };

        chartService.updateTransactionPieChart(pieChartData);
        chartService.updateMonthlyBarChart(barChartData);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatAmount(amount) {
        return amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' RWF';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
}); 