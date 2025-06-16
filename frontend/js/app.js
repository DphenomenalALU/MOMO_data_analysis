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

    showLoading(message = 'Loading...') {
        const existingOverlay = document.querySelector('.loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    async initializeApp() {
        this.showLoading('Loading application...');
        try {
            await this.setupFilters();
            await this.loadInitialData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing app:', error);
            // Don't show error alert here, individual functions will handle their errors
        } finally {
            this.hideLoading();
        }
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
            
            // Prepare transaction type dropdown
            const typeSelect = document.getElementById('transactionType');
            typeSelect.disabled = true;
            typeSelect.classList.add('loading');

            // Load transaction types with retry mechanism
            let retries = 3;
            let types = null;

            while (retries > 0 && !types) {
                try {
                    types = await api.getTransactionTypes();
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) {
                        throw error;
                    }
                    // Wait for 1 second before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Clear existing options except the "All Types" option
            typeSelect.innerHTML = '<option value="">All Types</option>';
            
            // Add transaction types to dropdown
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });

            typeSelect.disabled = false;
            typeSelect.classList.remove('loading');
        } catch (error) {
            console.error('Error loading transaction types:', error);
            // Don't show alert, just log the error and let the app continue
        }
    }

    async loadInitialData() {
        this.showLoading('Fetching transaction data...');
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
            // Show a more user-friendly error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h3>Unable to load data</h3>
                <p>Please check your connection and try refreshing the page.</p>
            `;
            document.querySelector('.container').prepend(errorMessage);
        }
    }

    setupEventListeners() {
        const applyFiltersBtn = document.getElementById('applyFilters');
        applyFiltersBtn.addEventListener('click', () => this.applyFilters());

        const exportPDFBtn = document.getElementById('exportPDF');
        exportPDFBtn.addEventListener('click', () => this.exportToPDF());

        // Add sidebar navigation
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                sidebarItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');

                // Update transaction type filter if data-type exists
                const type = item.getAttribute('data-type');
                if (type) {
                    document.getElementById('transactionType').value = type;
                    this.applyFilters();
                } else {
                    // If clicking dashboard, show all transactions
                    document.getElementById('transactionType').value = '';
                    this.applyFilters();
                }
            });
        });

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

    async exportToPDF() {
        try {
            // Create export header
            const exportHeader = document.createElement('div');
            exportHeader.className = 'export-header';
            
            // Get current filters
            const typeFilter = document.getElementById('transactionType');
            const selectedType = typeFilter.options[typeFilter.selectedIndex].text;
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            const minAmount = document.getElementById('minAmount').value;
            const maxAmount = document.getElementById('maxAmount').value;

            // Format the header content
            exportHeader.innerHTML = `
                <h1>MTN MoMo Transaction Report</h1>
                <div class="export-meta">
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                <div class="export-filters">
                    <strong>Applied Filters:</strong><br>
                    Transaction Type: ${selectedType}<br>
                    Date Range: ${dateFrom || 'Any'} to ${dateTo || 'Any'}<br>
                    Amount Range: ${minAmount ? `RWF ${parseInt(minAmount).toLocaleString()}` : 'Any'} to ${maxAmount ? `RWF ${parseInt(maxAmount).toLocaleString()}` : 'Any'}
                </div>
            `;

            // Create footer
            const exportFooter = document.createElement('div');
            exportFooter.className = 'export-footer';
            exportFooter.innerHTML = `
                <p>MTN MoMo Transaction Report - Page <span class="pageNumber"></span></p>
                <p>Generated by MOMO Data Analysis Tool</p>
            `;

            // Store original body content
            const originalContent = document.body.innerHTML;

            // Create temporary container for print content
            const printContainer = document.createElement('div');
            printContainer.className = 'print-container';
            printContainer.appendChild(exportHeader.cloneNode(true));
            
            // Add charts container
            const chartsContainer = document.querySelector('.charts-container').cloneNode(true);
            printContainer.appendChild(chartsContainer);

            // Add transactions
            const transactions = document.querySelector('.transactions').cloneNode(true);
            // Remove any action buttons or unnecessary elements from transactions
            const unnecessaryElements = transactions.querySelectorAll('button, .actions, .modal');
            unnecessaryElements.forEach(elem => elem.remove());
            printContainer.appendChild(transactions);

            // Add footer
            printContainer.appendChild(exportFooter.cloneNode(true));

            // Replace body content with print content
            document.body.innerHTML = '';
            document.body.appendChild(printContainer);

            // Print the page
            window.print();

            // Restore original content
            document.body.innerHTML = originalContent;

            // Reinitialize the app since we replaced the content
            this.initializeApp();
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Failed to export to PDF');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 