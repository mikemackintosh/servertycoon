// Finance management system for Server Tycoon
// Handles customer agreements, financial tracking, and contract management

export class Finance {
  constructor(datacenter) {
    this.datacenter = datacenter;
    this.customerAgreements = [];
    this.pendingRequests = [];
    this.monthlyRecurringRevenue = 0;
    this.monthlyExpenses = 0;
    this.monthlyProfit = 0;
    
    // Financial history storage
    this.financialHistory = {
      monthlyStatements: [],
      revenueByMonth: [],
      expensesByMonth: [],
      profitByMonth: []
    };
    
    // Initialize with some pending customer requests
    this.generateInitialCustomerRequests(3);
    
    // Set up timer for generating new customer requests
    this.requestGenerationInterval = 60; // Generate new requests every 60 seconds
    this.timeSinceLastRequest = 0;
  }
  
  // Initialize the finance system
  init() {
    // Calculate initial expenses from existing infrastructure
    this.updateFinancials();
  }
  
  // Update financial metrics
  updateFinancials() {
    // Calculate monthly recurring revenue from customer agreements
    this.monthlyRecurringRevenue = this.customerAgreements.reduce(
      (total, agreement) => total + agreement.monthlyRevenue, 0
    );
    
    // Calculate monthly expenses
    let circuitExpenses = 0;
    if (this.datacenter.egressRouter && this.datacenter.egressRouter.circuits) {
      circuitExpenses = this.datacenter.egressRouter.circuits.reduce(
        (total, circuit) => total + circuit.monthlyCost, 0
      );
    }
    
    // Add maintenance costs for servers and network equipment
    let maintenanceCosts = 0;
    for (const rack of this.datacenter.racks) {
      // Server maintenance cost (approximately 2% of server value per month)
      for (const server of rack.servers) {
        maintenanceCosts += (server.originalValue || 500) * 0.02;
      }
      
      // Network equipment maintenance cost (approximately 1% of equipment value per month)
      for (const equipment of rack.networkEquipment) {
        maintenanceCosts += (equipment.originalValue || 300) * 0.01;
      }
    }
    
    // Calculate power costs (estimated at $0.12 per kWh)
    const powerCostPerMonth = this.datacenter.powerUsage * 24 * 30 * 0.00012;
    
    this.monthlyExpenses = circuitExpenses + maintenanceCosts + powerCostPerMonth;
    this.monthlyProfit = this.monthlyRecurringRevenue - this.monthlyExpenses;
    
    // Project annual profit
    this.annualProfit = this.monthlyProfit * 12;
    
    return {
      monthlyRevenue: this.monthlyRecurringRevenue,
      monthlyExpenses: this.monthlyExpenses,
      monthlyProfit: this.monthlyProfit,
      annualProfit: this.annualProfit
    };
  }
  
  // Generate new customer requests
  update(deltaTime) {
    this.timeSinceLastRequest += deltaTime;
    
    if (this.timeSinceLastRequest >= this.requestGenerationInterval) {
      this.generateCustomerRequest();
      this.timeSinceLastRequest = 0;
    }
  }
  
  // Generate a random customer request
  generateCustomerRequest() {
    const types = ['Website', 'E-commerce', 'Email Server', 'Database', 'Video Game Server', 'File Storage'];
    const sizes = ['Small', 'Medium', 'Large', 'Enterprise'];
    const trafficPatterns = ['Low', 'Moderate', 'High', 'Bursty', '24/7'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const traffic = trafficPatterns[Math.floor(Math.random() * trafficPatterns.length)];
    
    // Calculate resource requirements based on size and type
    let cpuCores, ramGB, storageGB, bandwidthMbps;
    
    // Base values that will be modified by size and type
    let baseValues = {
      'Website': { cpu: 2, ram: 4, storage: 20, bandwidth: 10 },
      'E-commerce': { cpu: 4, ram: 8, storage: 50, bandwidth: 20 },
      'Email Server': { cpu: 2, ram: 8, storage: 100, bandwidth: 15 },
      'Database': { cpu: 4, ram: 16, storage: 200, bandwidth: 10 },
      'Video Game Server': { cpu: 8, ram: 32, storage: 100, bandwidth: 50 },
      'File Storage': { cpu: 2, ram: 4, storage: 500, bandwidth: 25 }
    };
    
    // Size multipliers
    let sizeMultipliers = {
      'Small': 0.5,
      'Medium': 1,
      'Large': 2,
      'Enterprise': 4
    };
    
    // Traffic multipliers for bandwidth
    let trafficMultipliers = {
      'Low': 0.5,
      'Moderate': 1,
      'High': 2,
      'Bursty': 1.5,
      '24/7': 3
    };
    
    const baseSpec = baseValues[type] || baseValues['Website'];
    const sizeMultiplier = sizeMultipliers[size] || 1;
    const trafficMultiplier = trafficMultipliers[traffic] || 1;
    
    cpuCores = Math.max(1, Math.round(baseSpec.cpu * sizeMultiplier));
    ramGB = Math.max(1, Math.round(baseSpec.ram * sizeMultiplier));
    storageGB = Math.max(10, Math.round(baseSpec.storage * sizeMultiplier));
    bandwidthMbps = Math.max(1, Math.round(baseSpec.bandwidth * sizeMultiplier * trafficMultiplier));
    
    // Calculate monthly revenue based on resources
    const cpuPrice = 10; // $10 per CPU core
    const ramPrice = 5;  // $5 per GB of RAM
    const storagePrice = 0.1; // $0.10 per GB of storage
    const bandwidthPrice = 1; // $1 per Mbps
    
    const monthlyRevenue = (cpuCores * cpuPrice) + 
                          (ramGB * ramPrice) + 
                          (storageGB * storagePrice) + 
                          (bandwidthMbps * bandwidthPrice);
    
    // Calculate servers required
    const serversRequired = Math.ceil(Math.max(
      cpuCores / 8,    // Assume max 8 cores per server
      ramGB / 32,      // Assume max 32GB RAM per server
      storageGB / 1000 // Assume max 1TB storage per server
    ));
    
    // Generate customer name
    const companyPrefixes = ['Tech', 'Digi', 'Cyber', 'Net', 'Web', 'Cloud', 'Data', 'Byte', 'Info'];
    const companySuffixes = ['Corp', 'Systems', 'Solutions', 'Tech', 'Networks', 'Media', 'Group', 'Labs', 'Soft'];
    
    const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    const customerName = `${prefix}${suffix}`;
    
    // Create the request object
    const request = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      customerName: customerName,
      type: type,
      size: size,
      trafficPattern: traffic,
      specifications: {
        cpuCores: cpuCores,
        ramGB: ramGB,
        storageGB: storageGB,
        bandwidthMbps: bandwidthMbps,
        serversRequired: serversRequired
      },
      monthlyRevenue: monthlyRevenue,
      daysUntilExpiration: 7, // Request expires in 7 days if not accepted
      createdAt: Date.now(),
      statusMessage: `${customerName} is looking for hosting for their ${size.toLowerCase()} ${type.toLowerCase()} with ${traffic.toLowerCase()} traffic`
    };
    
    this.pendingRequests.push(request);
    console.log(`New customer request from ${customerName} for ${size} ${type}`);
    
    return request;
  }
  
  // Generate initial customer requests
  generateInitialCustomerRequests(count) {
    for (let i = 0; i < count; i++) {
      this.pendingRequests.push(this.generateCustomerRequest());
    }
  }
  
  // Accept a customer request
  acceptCustomerRequest(requestId, assignedServers = []) {
    const requestIndex = this.pendingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      console.error(`Customer request with ID ${requestId} not found`);
      return false;
    }
    
    const request = this.pendingRequests[requestIndex];
    
    // Create a new customer agreement
    const agreement = {
      id: 'agr-' + Math.random().toString(36).substr(2, 9),
      customerName: request.customerName,
      type: request.type,
      specifications: request.specifications,
      monthlyRevenue: request.monthlyRevenue,
      assignedServers: assignedServers,
      serverDetails: [], // Will store details about the server assignment
      startDate: Date.now(),
      status: 'Active',
      bandwidthUtilization: request.specifications.bandwidthMbps
    };
    
    // Add to active agreements
    this.customerAgreements.push(agreement);
    
    // Remove from pending requests
    this.pendingRequests.splice(requestIndex, 1);
    
    // Update financial projections
    this.updateFinancials();
    
    console.log(`Accepted customer request from ${request.customerName}, adding ${request.monthlyRevenue.toFixed(2)} to monthly revenue`);
    
    return agreement;
  }
  
  // Assign a customer agreement to a specific server
  assignAgreementToServer(agreementId, server) {
    const agreement = this.customerAgreements.find(agr => agr.id === agreementId);
    
    if (!agreement) {
      console.error(`Customer agreement with ID ${agreementId} not found`);
      return false;
    }
    
    // Attempt to assign the website to the server
    const result = server.assignWebsite(agreement);
    
    if (result) {
      // Add server to the agreement's server list
      agreement.assignedServers.push(server.id);
      
      // Add detailed server information
      agreement.serverDetails.push({
        serverId: server.id,
        serverName: server.name,
        rackId: server.getRack()?.id || null,
        assignedAt: Date.now(),
        cpuAllocation: agreement.specifications.cpuCores,
        ramAllocation: agreement.specifications.ramGB,
        storageAllocation: agreement.specifications.storageGB
      });
      
      // Update the agreement status
      agreement.status = 'Hosted';
      
      console.log(`Assigned agreement ${agreement.id} for ${agreement.customerName} to server ${server.name}`);
      return true;
    }
    
    return false;
  }
  
  // Remove a customer agreement from a server
  removeAgreementFromServer(agreementId, serverId) {
    const agreement = this.customerAgreements.find(agr => agr.id === agreementId);
    
    if (!agreement) {
      console.error(`Customer agreement with ID ${agreementId} not found`);
      return false;
    }
    
    // Find the server in the datacenter
    let server = null;
    for (const rack of this.datacenter.racks) {
      const foundServer = rack.servers.find(s => s.id === serverId);
      if (foundServer) {
        server = foundServer;
        break;
      }
    }
    
    if (!server) {
      console.error(`Server with ID ${serverId} not found`);
      return false;
    }
    
    // Remove the website from the server
    const result = server.removeWebsite(agreementId);
    
    if (result) {
      // Remove server from the agreement's assigned servers list
      agreement.assignedServers = agreement.assignedServers.filter(id => id !== serverId);
      
      // Remove the server details
      agreement.serverDetails = agreement.serverDetails.filter(detail => detail.serverId !== serverId);
      
      // Update agreement status if no servers assigned
      if (agreement.assignedServers.length === 0) {
        agreement.status = 'Pending Hosting';
      }
      
      console.log(`Removed agreement ${agreement.id} for ${agreement.customerName} from server ${server.name}`);
      return true;
    }
    
    return false;
  }
  
  // Get all available servers that can host a given agreement
  getEligibleServersForAgreement(agreementId) {
    const agreement = this.customerAgreements.find(agr => agr.id === agreementId);
    
    if (!agreement) {
      console.error(`Customer agreement with ID ${agreementId} not found`);
      return [];
    }
    
    const eligibleServers = [];
    
    // Check all servers in all racks
    for (const rack of this.datacenter.racks) {
      for (const server of rack.servers) {
        // Skip servers that already host this agreement
        if (agreement.assignedServers.includes(server.id)) {
          continue;
        }
        
        // Get server capacity
        const capacity = server.getAvailableCapacity();
        
        // Check if server has enough resources
        if (capacity.cpu.available >= agreement.specifications.cpuCores && 
            capacity.ram.available >= agreement.specifications.ramGB && 
            capacity.storage.available >= agreement.specifications.storageGB &&
            capacity.bandwidth.available >= agreement.specifications.bandwidthMbps) {
          
          // Add to eligible servers with capacity info
          eligibleServers.push({
            id: server.id,
            name: server.name,
            rack: server.getRack()?.id || 'Unknown Rack',
            capacity: capacity.percentages,
            available: {
              cpu: capacity.cpu.available,
              ram: capacity.ram.available,
              storage: capacity.storage.available,
              bandwidth: capacity.bandwidth.available
            }
          });
        }
      }
    }
    
    return eligibleServers;
  }
  
  // Decline a customer request
  declineCustomerRequest(requestId) {
    const requestIndex = this.pendingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      console.error(`Customer request with ID ${requestId} not found`);
      return false;
    }
    
    // Remove from pending requests
    this.pendingRequests.splice(requestIndex, 1);
    
    return true;
  }
  
  // Calculate total bandwidth utilization from all customer agreements
  calculateTotalBandwidthUtilization() {
    return this.customerAgreements.reduce(
      (total, agreement) => total + agreement.bandwidthUtilization, 0
    );
  }
  
  // Get a summary of the financial situation
  getFinancialSummary() {
    const financials = this.updateFinancials();
    
    return {
      funds: this.datacenter.funds,
      monthlyRevenue: financials.monthlyRevenue,
      monthlyExpenses: financials.monthlyExpenses,
      monthlyProfit: financials.monthlyProfit,
      annualProfit: financials.annualProfit,
      activeCustomers: this.customerAgreements.length,
      pendingRequests: this.pendingRequests.length,
      totalBandwidthUtilization: this.calculateTotalBandwidthUtilization(),
      breakdownByCategory: {
        serverMaintenance: this.datacenter.racks.reduce(
          (total, rack) => total + rack.servers.reduce(
            (rackTotal, server) => rackTotal + ((server.originalValue || 500) * 0.02), 0
          ), 0
        ),
        networkMaintenance: this.datacenter.racks.reduce(
          (total, rack) => total + rack.networkEquipment.reduce(
            (rackTotal, equipment) => rackTotal + ((equipment.originalValue || 300) * 0.01), 0
          ), 0
        ),
        circuitCosts: this.datacenter.egressRouter ? 
          this.datacenter.egressRouter.circuits.reduce(
            (total, circuit) => total + circuit.monthlyCost, 0
          ) : 0,
        powerCosts: this.datacenter.powerUsage * 24 * 30 * 0.00012 // $0.12 per kWh
      },
      financialHistory: this.financialHistory
    };
  }
  
  // Generate a monthly financial statement
  generateMonthlyStatement(date) {
    const financials = this.updateFinancials();
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Create the statement object
    const statement = {
      date: new Date(date),
      monthYear: monthYear,
      revenue: financials.monthlyRevenue,
      expenses: financials.monthlyExpenses,
      profit: financials.monthlyProfit,
      customerCount: this.customerAgreements.length,
      bandwidthUtilization: this.calculateTotalBandwidthUtilization(),
      breakdown: {
        serverMaintenance: this.datacenter.racks.reduce(
          (total, rack) => total + rack.servers.reduce(
            (rackTotal, server) => rackTotal + ((server.originalValue || 500) * 0.02), 0
          ), 0
        ),
        networkMaintenance: this.datacenter.racks.reduce(
          (total, rack) => total + rack.networkEquipment.reduce(
            (rackTotal, equipment) => rackTotal + ((equipment.originalValue || 300) * 0.01), 0
          ), 0
        ),
        circuitCosts: this.datacenter.egressRouter ? 
          this.datacenter.egressRouter.circuits.reduce(
            (total, circuit) => total + circuit.monthlyCost, 0
          ) : 0,
        powerCosts: this.datacenter.powerUsage * 24 * 30 * 0.00012 // $0.12 per kWh
      }
    };
    
    // Store in history
    this.financialHistory.monthlyStatements.push(statement);
    
    // Update trend data
    this.financialHistory.revenueByMonth.push({
      date: new Date(date),
      value: financials.monthlyRevenue
    });
    
    this.financialHistory.expensesByMonth.push({
      date: new Date(date),
      value: financials.monthlyExpenses
    });
    
    this.financialHistory.profitByMonth.push({
      date: new Date(date),
      value: financials.monthlyProfit
    });
    
    // Keep only the last 24 months of data
    if (this.financialHistory.monthlyStatements.length > 24) {
      this.financialHistory.monthlyStatements.shift();
      this.financialHistory.revenueByMonth.shift();
      this.financialHistory.expensesByMonth.shift();
      this.financialHistory.profitByMonth.shift();
    }
    
    console.log(`Generated monthly statement for ${monthYear}`);
    return statement;
  }
}