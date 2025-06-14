import api from './api.js';
import chartService from './charts.js';

class DashboardManager {
    constructor() {
        this.currentFilters = {
            type: 'all',
            startDate: '',
            endDate: '',
            search: '',
            page: 1,
            limit: 10,
            sortBy: 'date',
            sortOrder: 'desc'
        };
        this.initializeEventListeners();
        this.initializeDashboard();
    }

    initializeEventListeners() {
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.debounceUpdate();
        });

        // Transaction type filter
        document.getElementById('transactionType').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.currentFilters.page = 1; // Reset to first page
            this.updateDashboard();
        });

        // Date filter
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            const date = e.target.value;
            if (date) {
                this.currentFilters.startDate = `${date} 00:00:00`;
                this.currentFilters.endDate = `${date} 23:59:59`;
            } else {
                this.currentFilters.startDate = '';
                this.currentFilters.endDate = '';
            }
            this.currentFilters.page = 1; // Reset to first page
            this.updateDashboard();
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Pagination
        document.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'prev' && this.currentFilters.page > 1) {
                    this.currentFilters.page--;
                } else if (action === 'next') {
                    this.currentFilters.page++;
                }
                this.updateDashboard();
            });
        });
    }

    debounceUpdate() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.currentFilters.page = 1; // Reset to first page
            this.updateDashboard();
        }, 300);
    }

    async initializeDashboard() {
        try {
            chartService.initializeCharts();
            await this.updateDashboard();
        } catch (error) {
            this.showError('Failed to initialize dashboard');
        }
    }

    async updateDashboard() {
        try {
            this.setLoading(true);
            await Promise.all([
                this.updateTransactions(),
                this.updateStats(),
                this.updateCharts()
            ]);
        } catch (error) {
            this.showError('Failed to update dashboard');
        } finally {
            this.setLoading(false);
        }
    }

    async updateTransactions() {
        try {
            const transactions = await api.fetchTransactions(this.currentFilters);
            this.renderTransactionsTable(transactions.data);
            this.updatePagination(transactions.pagination);
        } catch (error) {
            this.showError('Failed to fetch transactions');
            this.renderTransactionsTable([]);
        }
    }

    async updateStats() {
        try {
            const stats = await api.fetchTransactionStats(this.currentFilters);
            this.updateStatsDisplay(stats);
        } catch (error) {
            this.showError('Failed to fetch statistics');
            this.updateStatsDisplay({
                totalTransactions: 0,
                totalVolume: 0,
                averageTransaction: 0
            });
        }
    }

    async updateCharts() {
        try {
            const monthlyTrends = await api.fetchMonthlyTrends({
                year: new Date().getFullYear(),
                transactionType: this.currentFilters.type !== 'all' ? this.currentFilters.type : undefined
            });
            this.updateChartsDisplay(monthlyTrends);
        } catch (error) {
            this.showError('Failed to fetch trends');
            this.updateChartsDisplay({
                byType: [],
                monthly: []
            });
        }
    }

    async handleExport() {
        try {
            this.setExporting(true);
            const blob = await api.exportTransactions(this.currentFilters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            this.showError('Failed to export transactions');
        } finally {
            this.setExporting(false);
        }
    }

    renderTransactionsTable(transactions) {
        const tbody = document.getElementById('transactionsBody');
        if (!transactions.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No transactions found</td></tr>';
            return;
        }

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

    updatePagination(pagination) {
        const { currentPage, totalPages } = pagination;
        const prevBtn = document.querySelector('[data-action="prev"]');
        const nextBtn = document.querySelector('[data-action="next"]');
        const pageInfo = document.querySelector('.pagination-info');

        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
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

    setLoading(isLoading) {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        }
    }

    setExporting(isExporting) {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.disabled = isExporting;
            exportBtn.textContent = isExporting ? 'Exporting...' : 'Export';
        }
    }

    showError(message) {
        const errorContainer = document.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
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