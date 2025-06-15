class App {
    constructor() {
        this.chartManager = new ChartManager();
        this.transactionManager = new TransactionManager();
        this.filters = {};
        
        // Define data range constants
        this.MIN_DATE = '2024-05-10';
        this.MAX_DATE = '2025-01-16';
        
        this.initializeApp();
    }

    async initializeApp() {
        await this.setupFilters();
        await this.loadInitialData();
        this.setupEventListeners();
    }

    async setupFilters() {
        try {
            // Set up date range limits
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            
            // Set min and max dates for both inputs
            dateFromInput.min = this.MIN_DATE;
            dateFromInput.max = this.MAX_DATE;
            dateToInput.min = this.MIN_DATE;
            dateToInput.max = this.MAX_DATE;
            
            // Load transaction types for filter dropdown
            const types = await api.getTransactionTypes();
            const typeSelect = document.getElementById('transactionType');
            
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading transaction types:', error);
            alert('Failed to load transaction types');
        }
    }

    async loadInitialData() {
        try {
            // Load summary statistics
            const stats = await api.getSummaryStats();
            this.transactionManager.updateSummaryStats(stats);

            // Load monthly statistics
            const monthlyStats = await api.getMonthlyStats();
            this.chartManager.updateMonthlyChart(monthlyStats);

            // Load initial transactions
            const transactions = await api.getTransactions();
            this.transactionManager.renderTransactionsList(transactions);
            this.chartManager.updateTypeDistribution(transactions);
        } catch (error) {
            console.error('Error loading initial data:', error);
            alert('Failed to load initial data');
        }
    }

    setupEventListeners() {
        const applyFiltersBtn = document.getElementById('applyFilters');
        applyFiltersBtn.addEventListener('click', () => this.applyFilters());

        // Add input event listeners for filter fields
        const filterFields = ['transactionType', 'dateFrom', 'dateTo', 'minAmount', 'maxAmount'];
        filterFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            element.addEventListener('change', () => {
                this.updateFilters();
            });
        });

        // Add date validation
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');

        dateFromInput.addEventListener('change', () => {
            // Ensure 'to' date is not before 'from' date
            if (dateFromInput.value && dateToInput.value && dateFromInput.value > dateToInput.value) {
                dateToInput.value = dateFromInput.value;
            }
        });

        dateToInput.addEventListener('change', () => {
            // Ensure 'from' date is not after 'to' date
            if (dateFromInput.value && dateToInput.value && dateToInput.value < dateFromInput.value) {
                dateFromInput.value = dateToInput.value;
            }
        });
    }

    updateFilters() {
        this.filters = {
            type: document.getElementById('transactionType').value,
            date_from: document.getElementById('dateFrom').value,
            date_to: document.getElementById('dateTo').value,
            min_amount: document.getElementById('minAmount').value,
            max_amount: document.getElementById('maxAmount').value
        };
    }

    async applyFilters() {
        try {
            this.updateFilters();
            const transactions = await api.getTransactions(this.filters);
            this.transactionManager.renderTransactionsList(transactions);
            this.chartManager.updateTypeDistribution(transactions);
        } catch (error) {
            console.error('Error applying filters:', error);
            alert('Failed to apply filters');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 