// Finance UI management for Server Tycoon
// This file contains UI components for the finance system

export class FinanceUI {
  constructor(ui, game) {
    this.ui = ui;
    this.game = game;
  }
  
  // Show finances dialog with tabs
  showFinancesDialog() {
    this.ui.closeAllMenus();
    
    // Get financial data
    const finance = this.game.datacenter.finance;
    if (!finance) {
      this.ui.showStatusMessage("Finance system not initialized", 3000);
      return;
    }
    
    const financialSummary = finance.getFinancialSummary();
    
    // Create modal content
    const content = document.createElement('div');
    content.style.width = '800px';
    content.style.height = '600px';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Title Bar -->
        <div style="background-color: #0000a5; color: white; padding: 5px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>Financial Management</span>
          <button id="finance-close-btn" style="background: #d4d0c8; border: 2px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; color: black; font-size: 11px;">×</button>
        </div>
        
        <!-- Tabs -->
        <div style="display: flex; background-color: #d4d0c8; border-bottom: 1px solid #808080;">
          <div id="finance-tab-summary" class="finance-tab active-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #FFFFFF #808080 #d4d0c8 #FFFFFF; background-color: #d4d0c8; margin-right: 2px; margin-top: 3px; border-bottom: none;">Summary</div>
          <div id="finance-tab-agreements" class="finance-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #808080 #808080 #808080 #808080; background-color: #bbb; margin-right: 2px; margin-top: 3px;">Customer Agreements</div>
          <div id="finance-tab-requests" class="finance-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #808080 #808080 #808080 #808080; background-color: #bbb; margin-right: 2px; margin-top: 3px;">Sales & Marketing</div>
        </div>
        
        <!-- Tab Content Container -->
        <div id="finance-tab-content" style="flex-grow: 1; background-color: #d4d0c8; padding: 10px; overflow: auto;">
          <!-- Will be filled by tab selection -->
        </div>
      </div>
    `;
    
    // Show modal
    this.ui.openModal(content);
    
    // Get tab content container
    const tabContent = document.getElementById('finance-tab-content');
    
    // Helper functions to switch tabs
    const switchToTab = (tabId) => {
      // Update tab styling
      document.querySelectorAll('.finance-tab').forEach(tab => {
        const isActive = tab.id === `finance-tab-${tabId}`;
        tab.style.backgroundColor = isActive ? '#d4d0c8' : '#bbb';
        tab.style.borderColor = isActive ? 
          '#FFFFFF #808080 #d4d0c8 #FFFFFF' : 
          '#808080 #808080 #808080 #808080';
      });
      
      // Update content
      if (tabId === 'summary') {
        this.showSummaryTab(tabContent, financialSummary);
      } else if (tabId === 'agreements') {
        this.showAgreementsTab(tabContent, finance, financialSummary);
      } else if (tabId === 'requests') {
        this.showRequestsTab(tabContent, finance, financialSummary);
      }
    };
    
    // Show the summary tab by default
    this.showSummaryTab(tabContent, financialSummary);
    
    // Add tab switching handlers
    document.getElementById('finance-tab-summary').addEventListener('click', () => switchToTab('summary'));
    document.getElementById('finance-tab-agreements').addEventListener('click', () => switchToTab('agreements'));
    document.getElementById('finance-tab-requests').addEventListener('click', () => switchToTab('requests'));
    
    // Close button handler
    document.getElementById('finance-close-btn').addEventListener('click', () => {
      this.ui.closeModal();
    });
  }
  
  // Show financial summary tab
  showSummaryTab(tabContent, financialSummary) {
    // Format currency
    const formatCurrency = (amount) => {
      return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    const breakdown = financialSummary.breakdownByCategory;
    
    tabContent.innerHTML = `
      <div style="padding: 10px 20px;">
        <h2 style="margin-top: 0; color: #000080;">Financial Summary</h2>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Current Balance</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">${formatCurrency(financialSummary.funds)}</p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Revenue</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0; color: green;">${formatCurrency(financialSummary.monthlyRevenue)}</p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Expenses</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0; color: red;">${formatCurrency(financialSummary.monthlyExpenses)}</p>
          </div>
        </div>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #000080;">Profit Projection</h3>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 150px;">Monthly Profit:</div>
            <div style="font-weight: bold; color: ${financialSummary.monthlyProfit >= 0 ? 'green' : 'red'};">
              ${formatCurrency(financialSummary.monthlyProfit)}
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 150px;">Annual Projection:</div>
            <div style="font-weight: bold; color: ${financialSummary.annualProfit >= 0 ? 'green' : 'red'};">
              ${formatCurrency(financialSummary.annualProfit)}
            </div>
          </div>
        </div>
        
        <h3 style="color: #000080;">Monthly Expense Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #0078D7; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #999;">Category</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Percentage</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #999;">Circuit Costs</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.circuitCosts)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.circuitCosts / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #999;">Server Maintenance</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.serverMaintenance)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.serverMaintenance / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #999;">Network Maintenance</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.networkMaintenance)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.networkMaintenance / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 8px; border: 1px solid #999;">Power Costs</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.powerCosts)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.powerCosts / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
          </tr>
          <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td style="padding: 8px; border: 1px solid #999;">Total</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(financialSummary.monthlyExpenses)}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #999;">100.0%</td>
          </tr>
        </table>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #000080;">Customer & Bandwidth Summary</h3>
          <div style="display: flex; justify-content: space-between;">
            <div style="flex: 1;">
              <div style="margin-bottom: 8px;"><strong>Active Customers:</strong> ${financialSummary.activeCustomers}</div>
              <div><strong>Pending Requests:</strong> ${financialSummary.pendingRequests}</div>
            </div>
            <div style="flex: 1;">
              <div style="margin-bottom: 8px;"><strong>Bandwidth Utilization:</strong> ${financialSummary.totalBandwidthUtilization} Mbps</div>
              <div><strong>Circuit Capacity:</strong> ${this.game.datacenter.egressRouter?.getTotalBandwidth() || 0} Mbps</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Show customer agreements tab
  showAgreementsTab(tabContent, finance, financialSummary) {
    const agreements = finance.customerAgreements;
    
    let agreementsHtml = '';
    if (agreements.length === 0) {
      agreementsHtml = `<div style="text-align: center; padding: 30px; background-color: #f5f5f5; border: 1px solid #ddd; margin-top: 20px;">No active customer agreements</div>`;
    } else {
      agreementsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #0078D7; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #999;">Customer</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #999;">Type</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #999;">Specs</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Bandwidth</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #999;">Status</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Monthly Revenue</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #999;">Actions</th>
          </tr>
          ${agreements.map((agreement, index) => {
            // Determine hosting status
            const isHosted = agreement.assignedServers && agreement.assignedServers.length > 0;
            const statusText = isHosted ? 'Hosted' : 'Unassigned';
            const statusColor = isHosted ? '#4CAF50' : '#F57C00';
            
            return `
            <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
              <td style="padding: 8px; border: 1px solid #999;">${agreement.customerName}</td>
              <td style="padding: 8px; border: 1px solid #999;">${agreement.type}</td>
              <td style="padding: 8px; border: 1px solid #999; font-size: 11px;">
                CPU: ${agreement.specifications.cpuCores} cores<br>
                RAM: ${agreement.specifications.ramGB} GB<br>
                Storage: ${agreement.specifications.storageGB} GB
              </td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${agreement.bandwidthUtilization} Mbps</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #999;">
                <span style="background-color: ${statusColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${statusText}</span>
                ${isHosted ? `<br><span style="font-size: 10px;">Servers: ${agreement.assignedServers.length}</span>` : ''}
              </td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">$${agreement.monthlyRevenue.toFixed(2)}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #999;">
                <button class="view-agreement-btn" data-id="${agreement.id}" style="font-size: 11px; padding: 2px 5px;">View</button>
                ${!isHosted ? `<button class="assign-server-btn" data-id="${agreement.id}" style="font-size: 11px; padding: 2px 5px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32; margin-left: 3px;">Assign</button>` : ''}
              </td>
            </tr>
          `;
          }).join('')}
        </table>
      `;
    }
    
    tabContent.innerHTML = `
      <div style="padding: 10px 20px;">
        <h2 style="margin-top: 0; color: #000080;">Customer Agreements</h2>
        <p>Active customer contracts and their resource allocations.</p>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Total Agreements</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">${agreements.length}</p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Bandwidth Used</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">
              ${financialSummary.totalBandwidthUtilization} / ${this.game.datacenter.egressRouter?.getTotalBandwidth() || 0} Mbps
            </p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Revenue</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0; color: green;">$${financialSummary.monthlyRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        ${agreementsHtml}
      </div>
    `;
    
    // Add view agreement button handlers
    document.querySelectorAll('.view-agreement-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const agreementId = btn.dataset.id;
        const agreement = agreements.find(a => a.id === agreementId);
        if (agreement) {
          this.showCustomerAgreementDetails(agreement);
        }
      });
    });
    
    // Add assign server button handlers
    document.querySelectorAll('.assign-server-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const agreementId = btn.dataset.id;
        const agreement = agreements.find(a => a.id === agreementId);
        if (agreement) {
          this.showServerAssignmentDialog(agreement);
        }
      });
    });
  }
  
  // Show sales and marketing tab
  showRequestsTab(tabContent, finance, financialSummary) {
    const requests = finance.pendingRequests;
    
    let requestsHtml = '';
    if (requests.length === 0) {
      requestsHtml = `<div style="text-align: center; padding: 30px; background-color: #f5f5f5; border: 1px solid #ddd; margin-top: 20px;">No pending customer requests</div>`;
    } else {
      requestsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #0078D7; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #999;">Customer</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #999;">Request Type</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #999;">Size & Traffic</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Resource Needs</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #999;">Monthly Revenue</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #999;">Actions</th>
          </tr>
          ${requests.map((request, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
              <td style="padding: 8px; border: 1px solid #999;">${request.customerName}</td>
              <td style="padding: 8px; border: 1px solid #999;">${request.type}</td>
              <td style="padding: 8px; border: 1px solid #999; text-align: center;">
                ${request.size}<br>
                ${request.trafficPattern} Traffic
              </td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999; font-size: 11px;">
                CPU: ${request.specifications.cpuCores} cores<br>
                RAM: ${request.specifications.ramGB} GB<br>
                Storage: ${request.specifications.storageGB} GB<br>
                Bandwidth: ${request.specifications.bandwidthMbps} Mbps
              </td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">$${request.monthlyRevenue.toFixed(2)}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #999;">
                <button class="accept-request-btn" data-id="${request.id}" style="font-size: 11px; padding: 2px 5px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32; margin-right: 5px;">Accept</button>
                <button class="decline-request-btn" data-id="${request.id}" style="font-size: 11px; padding: 2px 5px; background-color: #F44336; color: white; border: 1px solid #C62828;">Decline</button>
              </td>
            </tr>
          `).join('')}
        </table>
      `;
    }
    
    tabContent.innerHTML = `
      <div style="padding: 10px 20px;">
        <h2 style="margin-top: 0; color: #000080;">Sales & Marketing</h2>
        <p>Manage customer requests and new business opportunities.</p>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Pending Requests</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">${requests.length}</p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Available Bandwidth</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">
              ${Math.max(0, (this.game.datacenter.egressRouter?.getTotalBandwidth() || 0) - financialSummary.totalBandwidthUtilization)} Mbps
            </p>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
            <h3 style="margin-top: 0; text-align: center; color: #000080;">Active Customers</h3>
            <p style="font-size: 24px; text-align: center; margin: 10px 0;">${financialSummary.activeCustomers}</p>
          </div>
        </div>
        
        ${requestsHtml}
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #2E7D32;">Generate New Business</h3>
          <p>Invest in marketing to generate additional customer leads.</p>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <button id="generate-lead-btn" style="padding: 5px 15px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32;">Generate Lead ($500)</button>
            <button id="marketing-campaign-btn" style="padding: 5px 15px; background-color: #2196F3; color: white; border: 1px solid #1565C0;">Run Marketing Campaign ($2,000)</button>
          </div>
        </div>
      </div>
    `;
    
    // Add accept/decline request button handlers
    document.querySelectorAll('.accept-request-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const requestId = btn.dataset.id;
        this.acceptCustomerRequest(requestId, finance);
      });
    });
    
    document.querySelectorAll('.decline-request-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const requestId = btn.dataset.id;
        if (confirm("Are you sure you want to decline this request? The customer will look elsewhere.")) {
          finance.declineCustomerRequest(requestId);
          this.showFinancesDialog(); // Refresh the dialog
        }
      });
    });
    
    // Add marketing button handlers
    document.getElementById('generate-lead-btn')?.addEventListener('click', () => {
      if (this.game.datacenter.funds < 500) {
        this.ui.showStatusMessage("Not enough funds for lead generation", 3000);
        return;
      }
      
      this.game.datacenter.updateFunds(-500);
      finance.generateCustomerRequest();
      this.ui.showStatusMessage("New lead generated", 3000);
      this.showFinancesDialog(); // Refresh the dialog
    });
    
    document.getElementById('marketing-campaign-btn')?.addEventListener('click', () => {
      if (this.game.datacenter.funds < 2000) {
        this.ui.showStatusMessage("Not enough funds for marketing campaign", 3000);
        return;
      }
      
      this.game.datacenter.updateFunds(-2000);
      
      // Generate multiple leads for a marketing campaign
      for (let i = 0; i < 5; i++) {
        finance.generateCustomerRequest();
      }
      
      this.ui.showStatusMessage("Marketing campaign launched with 5 new leads", 3000);
      this.showFinancesDialog(); // Refresh the dialog
    });
  }
  
  // Accept a customer request and assign resources
  acceptCustomerRequest(requestId, finance) {
    const request = finance.pendingRequests.find(req => req.id === requestId);
    
    if (!request) {
      this.ui.showStatusMessage("Customer request not found", 3000);
      return;
    }
    
    // Check if we have enough bandwidth
    const currentUtilization = finance.calculateTotalBandwidthUtilization();
    const totalAvailableBandwidth = this.game.datacenter.egressRouter?.getTotalBandwidth() || 0;
    
    if (currentUtilization + request.specifications.bandwidthMbps > totalAvailableBandwidth) {
      this.ui.showStatusMessage("Not enough bandwidth capacity. Upgrade circuits first.", 3000);
      return;
    }
    
    // Create content for server assignment modal
    const content = document.createElement('div');
    content.style.width = '600px';
    content.innerHTML = `
      <div style="padding: 15px;">
        <h2 style="margin-top: 0; color: #000080;">Accept Customer Request</h2>
        <p>Assign servers to fulfill <strong>${request.customerName}'s</strong> request for a <strong>${request.size} ${request.type}</strong>.</p>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 10px; margin-bottom: 15px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #000080;">Resource Requirements</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>CPU:</strong> ${request.specifications.cpuCores} cores
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>RAM:</strong> ${request.specifications.ramGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Storage:</strong> ${request.specifications.storageGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Bandwidth:</strong> ${request.specifications.bandwidthMbps} Mbps
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Monthly Revenue:</strong> $${request.monthlyRevenue.toFixed(2)}
            </div>
          </div>
        </div>
        
        <p>An estimated <strong>${request.specifications.serversRequired} server(s)</strong> will be needed for this request.</p>
        
        <p>By accepting this request, we'll automatically allocate the necessary resources from our available servers.</p>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button id="cancel-request-btn" style="margin-right: 10px; padding: 5px 15px;">Cancel</button>
          <button id="confirm-accept-btn" style="padding: 5px 15px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32;">Accept Request</button>
        </div>
      </div>
    `;
    
    // Show the modal
    this.ui.openModal(content);
    
    // Add button handlers
    document.getElementById('cancel-request-btn').addEventListener('click', () => {
      this.ui.closeModal();
    });
    
    document.getElementById('confirm-accept-btn').addEventListener('click', () => {
      // Accept the request and add to customer agreements
      const agreement = finance.acceptCustomerRequest(requestId);
      
      if (agreement) {
        this.ui.showStatusMessage(`Accepted request from ${request.customerName}`, 3000);
      } else {
        this.ui.showStatusMessage("Failed to accept request", 3000);
      }
      
      this.ui.closeModal();
      this.showFinancesDialog(); // Refresh finances display
    });
  }
  
  // Show customer agreement details
  showCustomerAgreementDetails(agreement) {
    // Check if this agreement has any server assignments
    const hasServerAssignments = agreement.assignedServers && agreement.assignedServers.length > 0;
    const statusColor = agreement.status === 'Hosted' ? '#4CAF50' : 
                        agreement.status === 'Pending Hosting' ? '#F57C00' : '#2196F3';
    
    // Prepare server assignment HTML
    let serverAssignmentHtml = '';
    
    if (hasServerAssignments) {
      const serverListItems = agreement.serverDetails.map(detail => `
        <div style="display: flex; justify-content: space-between; background-color: #f1f1f1; padding: 8px; border: 1px solid #ddd; margin-bottom: 5px;">
          <div>
            <strong>${detail.serverName}</strong><br>
            <span style="font-size: 11px;">CPU: ${detail.cpuAllocation} cores, RAM: ${detail.ramAllocation} GB, Storage: ${detail.storageAllocation} GB</span>
          </div>
          <button class="remove-server-assignment-btn" data-server-id="${detail.serverId}" data-agreement-id="${agreement.id}" style="padding: 3px 8px; background-color: #F44336; color: white; border: 1px solid #C62828; align-self: center;">Remove</button>
        </div>
      `).join('');
      
      serverAssignmentHtml = `
        <h3 style="color: #000080;">Assigned Servers</h3>
        <div style="margin-bottom: 15px;">
          ${serverListItems}
        </div>
      `;
    } else {
      serverAssignmentHtml = `
        <div style="background-color: #FFF3E0; border: 1px solid #FFE0B2; padding: 10px; margin-bottom: 15px; text-align: center;">
          <p><strong>No servers assigned</strong></p>
          <p>This website has not been assigned to any servers yet.</p>
        </div>
      `;
    }
    
    const content = document.createElement('div');
    content.style.width = '700px';
    content.innerHTML = `
      <div style="padding: 15px;">
        <h2 style="margin-top: 0; color: #000080;">Customer Agreement Details</h2>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #000080;">${agreement.customerName}</h3>
            <span style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 3px;">${agreement.status}</span>
          </div>
          <p style="margin-bottom: 5px;"><strong>Service Type:</strong> ${agreement.type}</p>
          <p style="margin-bottom: 5px;"><strong>Monthly Revenue:</strong> $${agreement.monthlyRevenue.toFixed(2)}</p>
          <p style="margin-bottom: 5px;"><strong>Start Date:</strong> ${new Date(agreement.startDate).toLocaleDateString()}</p>
        </div>
        
        <h3 style="color: #000080;">Resource Requirements</h3>
        <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px;">
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>CPU Cores:</strong> ${agreement.specifications.cpuCores}
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>RAM:</strong> ${agreement.specifications.ramGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>Storage:</strong> ${agreement.specifications.storageGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>Bandwidth:</strong> ${agreement.bandwidthUtilization} Mbps
            </div>
          </div>
        </div>
        
        ${serverAssignmentHtml}
        
        <button id="add-server-assignment-btn" style="background-color: #4CAF50; color: white; border: 1px solid #2E7D32; padding: 8px 15px; margin-bottom: 20px; width: 100%;">Assign to Server</button>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button id="close-agreement-details-btn" style="padding: 5px 15px;">Close</button>
        </div>
      </div>
    `;
    
    // Show the modal
    this.ui.openModal(content);
    
    // Add close button handler
    document.getElementById('close-agreement-details-btn').addEventListener('click', () => {
      this.ui.closeModal();
    });
    
    // Add server assignment button handler
    document.getElementById('add-server-assignment-btn').addEventListener('click', () => {
      this.showServerAssignmentDialog(agreement);
    });
    
    // Add remove server assignment button handlers
    document.querySelectorAll('.remove-server-assignment-btn').forEach(btn => {
      btn.addEventListener('click', (event) => {
        const serverId = event.target.dataset.serverId;
        const agreementId = event.target.dataset.agreementId;
        
        if (confirm('Are you sure you want to remove this server assignment?')) {
          const finance = this.game.datacenter.finance;
          finance.removeAgreementFromServer(agreementId, serverId);
          
          // Refresh the dialog
          this.ui.closeModal();
          this.showCustomerAgreementDetails(agreement);
        }
      });
    });
  }
  
  // Show server assignment dialog
  showServerAssignmentDialog(agreement) {
    const finance = this.game.datacenter.finance;
    
    // Get eligible servers for this agreement
    const eligibleServers = finance.getEligibleServersForAgreement(agreement.id);
    
    let serverOptionsHtml = '';
    
    if (eligibleServers.length === 0) {
      serverOptionsHtml = `
        <div style="background-color: #FFEBEE; border: 1px solid #FFCDD2; padding: 15px; margin-bottom: 15px; text-align: center;">
          <p><strong>No eligible servers found</strong></p>
          <p>There are no servers with enough resources to host this website.</p>
          <p>You need to add more servers or upgrade existing ones.</p>
        </div>
      `;
    } else {
      // Create HTML for server options
      serverOptionsHtml = eligibleServers.map(server => `
        <div class="server-option" data-server-id="${server.id}" style="display: flex; justify-content: space-between; background-color: #f5f5f5; border: 1px solid #ddd; margin-bottom: 8px; padding: 10px; cursor: pointer;">
          <div>
            <strong>${server.name}</strong><br>
            <span style="font-size: 11px;">Rack: ${server.rack}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; margin-bottom: 3px;">
              CPU: ${server.available.cpu.toFixed(1)} cores (${server.capacity.cpu.toFixed(0)}% free)
            </div>
            <div style="font-size: 11px; margin-bottom: 3px;">
              RAM: ${server.available.ram.toFixed(1)} GB (${server.capacity.ram.toFixed(0)}% free)
            </div>
            <div style="font-size: 11px; margin-bottom: 3px;">
              Storage: ${server.available.storage.toFixed(1)} GB (${server.capacity.storage.toFixed(0)}% free)
            </div>
            <div style="font-size: 11px;">
              Bandwidth: ${server.available.bandwidth.toFixed(1)} Mbps (${server.capacity.bandwidth.toFixed(0)}% free)
            </div>
          </div>
        </div>
      `).join('');
    }
    
    const content = document.createElement('div');
    content.style.width = '700px';
    content.style.maxHeight = '600px';
    content.style.overflowY = 'auto';
    content.innerHTML = `
      <div style="padding: 15px;">
        <h2 style="margin-top: 0; color: #000080;">Assign to Server</h2>
        <p>Select a server to host <strong>${agreement.customerName}'s ${agreement.type}</strong></p>
        
        <div style="background-color: #E8F5E9; border: 1px solid #C8E6C9; padding: 10px; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #2E7D32;">Resource Requirements</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px;">
              <strong>CPU Cores:</strong> ${agreement.specifications.cpuCores}
            </div>
            <div style="flex: 1; min-width: 120px;">
              <strong>RAM:</strong> ${agreement.specifications.ramGB} GB
            </div>
            <div style="flex: 1; min-width: 120px;">
              <strong>Storage:</strong> ${agreement.specifications.storageGB} GB
            </div>
            <div style="flex: 1; min-width: 120px;">
              <strong>Bandwidth:</strong> ${agreement.bandwidthUtilization} Mbps
            </div>
          </div>
        </div>
        
        <h3 style="color: #000080;">Available Servers</h3>
        <div id="server-options-container">
          ${serverOptionsHtml}
        </div>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button id="cancel-server-assignment-btn" style="padding: 5px 15px; margin-right: 10px;">Cancel</button>
        </div>
      </div>
    `;
    
    // Show the modal
    this.ui.openModal(content);
    
    // Add cancel button handler
    document.getElementById('cancel-server-assignment-btn').addEventListener('click', () => {
      this.ui.closeModal();
      // Re-open the agreement details
      this.showCustomerAgreementDetails(agreement);
    });
    
    // Add click handlers for server options
    if (eligibleServers.length > 0) {
      document.querySelectorAll('.server-option').forEach(option => {
        option.addEventListener('click', () => {
          const serverId = option.dataset.serverId;
          
          // Find the server object
          let selectedServer = null;
          for (const rack of this.game.datacenter.racks) {
            const server = rack.servers.find(s => s.id === serverId);
            if (server) {
              selectedServer = server;
              break;
            }
          }
          
          if (selectedServer) {
            // Assign the agreement to the server
            const result = finance.assignAgreementToServer(agreement.id, selectedServer);
            
            if (result) {
              this.ui.showStatusMessage(`Website assigned to server ${selectedServer.name}`, 3000);
              
              // Close and reopen agreement details
              this.ui.closeModal();
              
              // Get the updated agreement
              const updatedAgreement = finance.customerAgreements.find(a => a.id === agreement.id);
              this.showCustomerAgreementDetails(updatedAgreement);
            } else {
              this.ui.showStatusMessage("Failed to assign website to server", 3000);
            }
          }
        });
      });
    }
  }
}