class ApiService {
    constructor() {
        // Use environment variable or fallback to localhost
        this.baseUrl = process.env.API_URL || 'http://localhost:3000/api';
    }

    async fetchTransactions(filters = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                transactionType,
                sortBy,
                sortOrder
            } = filters;

            const queryParams = new URLSearchParams({
                page,
                limit,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(transactionType && { transactionType }),
                ...(sortBy && { sortBy }),
                ...(sortOrder && { sortOrder })
            }).toString();

            const response = await fetch(`${this.baseUrl}/transactions?${queryParams}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch transactions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    async fetchTransactionStats(filters = {}) {
        try {
            const { startDate, endDate, transactionType } = filters;
            const queryParams = new URLSearchParams({
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(transactionType && { transactionType })
            }).toString();

            const response = await fetch(`${this.baseUrl}/stats?${queryParams}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch stats');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching transaction stats:', error);
            throw error;
        }
    }

    async fetchMonthlyTrends(filters = {}) {
        try {
            const { year, transactionType } = filters;
            const queryParams = new URLSearchParams({
                ...(year && { year }),
                ...(transactionType && { transactionType })
            }).toString();

            const response = await fetch(`${this.baseUrl}/trends/monthly?${queryParams}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch monthly trends');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching monthly trends:', error);
            throw error;
        }
    }

    async exportTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${this.baseUrl}/transactions/export?${queryParams}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export transactions');
            }
            return await response.blob();
        } catch (error) {
            console.error('Error exporting transactions:', error);
            throw error;
        }
    }
}

const api = new ApiService();
export default api; 