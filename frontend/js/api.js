class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api'; // Will be updated for production
    }

    async fetchTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${this.baseUrl}/transactions?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    async fetchTransactionStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching transaction stats:', error);
            return {
                totalTransactions: 0,
                totalVolume: 0,
                averageTransaction: 0
            };
        }
    }

    async fetchMonthlyTrends() {
        try {
            const response = await fetch(`${this.baseUrl}/trends/monthly`);
            if (!response.ok) throw new Error('Failed to fetch monthly trends');
            return await response.json();
        } catch (error) {
            console.error('Error fetching monthly trends:', error);
            return [];
        }
    }
}

const api = new ApiService();
export default api; 