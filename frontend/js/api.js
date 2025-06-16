// Determine the API base URL based on the environment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : '/api';

const api = {
    // Get filtered transactions
    async getTransactions(filters = {}) {
        const queryParams = new URLSearchParams();
        
        // Only add type filter if a specific type is selected
        if (filters.type && filters.type !== '') {
            queryParams.append('type', filters.type);
        }
        
        if (filters.date_from) queryParams.append('date_from', filters.date_from);
        if (filters.date_to) queryParams.append('date_to', filters.date_to);
        if (filters.min_amount) queryParams.append('min_amount', filters.min_amount);
        if (filters.max_amount) queryParams.append('max_amount', filters.max_amount);

        const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    // Get single transaction details
    async getTransactionDetails(id) {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch transaction details');
        return response.json();
    },

    // Get summary statistics
    async getSummaryStats() {
        const response = await fetch(`${API_BASE_URL}/stats/summary`);
        if (!response.ok) throw new Error('Failed to fetch summary statistics');
        return response.json();
    },

    // Get monthly statistics
    async getMonthlyStats() {
        const response = await fetch(`${API_BASE_URL}/stats/monthly`);
        if (!response.ok) throw new Error('Failed to fetch monthly statistics');
        return response.json();
    },

    // Get transaction types
    async getTransactionTypes() {
        const response = await fetch(`${API_BASE_URL}/transactions/types`);
        if (!response.ok) throw new Error('Failed to fetch transaction types');
        return response.json();
    }
}; 