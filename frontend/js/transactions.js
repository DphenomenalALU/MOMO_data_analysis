class TransactionManager {
    constructor() {
        this.transactionsList = document.getElementById('transactionsList');
        this.modal = document.getElementById('transactionModal');
        this.modalContent = document.getElementById('transactionDetails');
        this.closeBtn = document.querySelector('.close');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal when clicking the close button
        this.closeBtn.addEventListener('click', () => {
            this.modal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.modal.style.display = 'none';
            }
        });
    }

    formatAmount(amount) {
        // Format as RWF with thousands separator
        return new Intl.NumberFormat('en-RW', {
            style: 'decimal',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        }).format(amount) + ' RWF';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-RW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderTransactionsList(transactions) {
        this.transactionsList.innerHTML = '';
        console.log('Rendering transactions:', transactions); // Debug log
        
        if (!transactions || transactions.length === 0) {
            this.transactionsList.innerHTML = '<div class="no-data">No transactions found</div>';
            return;
        }

        // Add header row
        const headerElement = document.createElement('div');
        headerElement.className = 'transaction-item header';
        headerElement.innerHTML = `
            <div>Date</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Receiver</div>
        `;
        this.transactionsList.appendChild(headerElement);

        transactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            transactionElement.innerHTML = `
                <div>${this.formatDate(transaction.date)}</div>
                <div>${transaction.type}</div>
                <div>${this.formatAmount(transaction.amount)}</div>
                <div>${transaction.counterparty_name || 'N/A'}</div>
            `;

            transactionElement.addEventListener('click', () => {
                this.showTransactionDetails(transaction.id);
            });

            this.transactionsList.appendChild(transactionElement);
        });
    }

    async showTransactionDetails(transactionId) {
        try {
            const transaction = await api.getTransactionDetails(transactionId);
            
            this.modalContent.innerHTML = `
                <div class="transaction-detail">
                    <h3>Transaction Details</h3>
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${this.formatDate(transaction.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Type:</span>
                        <span class="value">${transaction.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value">${this.formatAmount(transaction.amount)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Receiver:</span>
                        <span class="value">${transaction.counterparty_name || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Message:</span>
                        <span class="value">${transaction.body || 'N/A'}</span>
                    </div>
                </div>
            `;

            this.modal.style.display = 'block';
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            alert('Failed to load transaction details');
        }
    }

    updateSummaryStats(stats) {
        const summaryStats = document.getElementById('summaryStats');
        if (!stats) {
            console.error('No stats data received');
            return;
        }
        console.log('Updating summary stats:', stats); // Debug log

        summaryStats.innerHTML = `
            <div class="stat-card">
                <h3>Total Transactions</h3>
                <p>${parseInt(stats.total_transactions).toLocaleString()}</p>
            </div>
            <div class="stat-card">
                <h3>Total Volume</h3>
                <p>${this.formatAmount(stats.total_volume)}</p>
            </div>
            <div class="stat-card">
                <h3>Average Amount</h3>
                <p>${this.formatAmount(stats.avg_amount)}</p>
            </div>
            <div class="stat-card">
                <h3>Range</h3>
                <p>${this.formatAmount(stats.min_amount)} - ${this.formatAmount(stats.max_amount)}</p>
            </div>
        `;
    }
} 