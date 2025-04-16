import * as THREE from 'three';

export class Server {
  constructor(game, unitSize = 1, name = null) {
    this.game = game;
    this.container = new THREE.Group();
    this.id = Math.random().toString(36).substr(2, 9); // Unique ID
    this.name = name || `Server-${this.id.substring(0, 4)}`; // Default name if none provided
    this.unitSize = unitSize; // Height in rack units (1U, 2U, etc)
    this.position = 0; // Position in the rack (0-indexed)
    this.specs = {
      cpu: {
        cores: 4,
        speed: 2.5 // GHz
      },
      ram: 16, // GB
      storage: [
        { type: 'ssd', size: 256 }, // GB
      ],
      networkCards: [
        { speed: 1 } // Gbps
      ]
    };
    this.powerConsumption = 150; // Watts
    this.temperature = 35; // Celsius
    this.utilization = 0; // 0-100%
    this.status = 'idle'; // idle, running, error
    this.revenue = 10; // $ per hour
    this.powered = true; // Power status
    
    // Network connectivity properties
    this.ipAddress = null;
    this.connected = false;
    this.gateway = null;
    this.connected = false;
    this.connections = []; // Stores connection details to network equipment
    
    // Hosting properties
    this.hostedWebsites = []; // Array of customer agreements hosted on this server
    this.cpuUsage = 0; // Percentage of CPU used by hosted websites
    this.ramUsage = 0; // Percentage of RAM used by hosted websites
    this.storageUsage = 0; // Percentage of storage used by hosted websites
    this.bandwidthUsage = 0; // Mbps of bandwidth used by hosted websites
  }

  init() {
    this.createServerHardware();
    
    // Create activity LEDs that will be used to show website hosting status
    this.activityLed = this.addLED(0.5, 0, -1.42, 0xFFFF00); // Yellow activity LED
    
    // Schedule LED update to show hosting status
    this.updateVisualStatus();
  }

  createServerHardware() {
    // Calculate height based on U size
    const height = this.unitSize * 0.25 * (1/42); // Scale based on rack height
    
    // Create server chassis
    const serverGeometry = new THREE.BoxGeometry(1.8, height, 2.8);
    const serverMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888, // Light gray for server
      roughness: 0.4,
      metalness: 0.6
    });
    
    const serverChassis = new THREE.Mesh(serverGeometry, serverMaterial);
    serverChassis.castShadow = true;
    serverChassis.receiveShadow = true;
    serverChassis.userData = { 
      type: 'server',
      id: this.id,
      serverId: this.id
    };
    
    this.container.add(serverChassis);
    
    // Add server front details (simplified)
    const frontDetailGeometry = new THREE.PlaneGeometry(1.7, height * 0.9);
    
    // Use a different color based on server size
    let frontColor;
    switch(this.unitSize) {
      case 1: frontColor = 0x4CAF50; break; // Green for 1U
      case 2: frontColor = 0x2196F3; break; // Blue for 2U
      case 4: frontColor = 0xFF9800; break; // Orange for 4U
      default: frontColor = 0x9C27B0; break; // Purple for others
    }
    
    const frontDetailMaterial = new THREE.MeshStandardMaterial({
      color: frontColor,
      roughness: 0.5,
      metalness: 0.2
    });
    
    const frontDetail = new THREE.Mesh(frontDetailGeometry, frontDetailMaterial);
    frontDetail.position.z = -1.41; // Just in front of the chassis
    frontDetail.position.y = 0;
    frontDetail.userData = { type: 'server', id: this.id };
    
    this.container.add(frontDetail);
    
    // Add LEDs - power LED is green, activity LED will be updated based on hosting status
    this.powerLed = this.addLED(0.7, 0, -1.42, 0x00FF00); // Green power LED
    // Activity LED is created in init() for easier reference
    
    // Add small details to make it look more like a server
    for (let i = 0; i < 4; i++) {
      const detailGeometry = new THREE.BoxGeometry(0.3, height * 0.1, 0.05);
      const detailMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const detail = new THREE.Mesh(detailGeometry, detailMaterial);
      detail.position.set(-0.6 + (i * 0.4), 0, -1.43);
      this.container.add(detail);
    }
  }
  
  addLED(x, y, z, color) {
    const ledGeometry = new THREE.CircleGeometry(0.05, 16);
    const ledMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(x, y, z);
    this.container.add(led);
    return led;
  }
  
  // Update server visual appearance based on hosting status
  updateVisualStatus() {
    if (!this.activityLed) return;
    
    if (this.hostedWebsites.length > 0) {
      // Server is hosting websites - make activity LED blink
      
      // The blink rate is based on utilization - higher utilization = faster blinking
      const blinkRate = this.utilization / 100; // 0 to 1 scale
      
      // Calculate the intensity based on time
      const time = Date.now() * 0.001; // Convert to seconds
      const intensity = Math.sin(time * 5 * (0.5 + blinkRate)) * 0.5 + 0.5; // 0 to 1 oscillation
      
      // Alternate between yellow and red based on load
      let color;
      if (this.utilization > 80) {
        // High load - red color
        color = new THREE.Color(1, intensity * 0.3, 0); // Red with pulsing intensity
      } else if (this.utilization > 50) {
        // Medium load - orange color
        color = new THREE.Color(1, intensity * 0.7, 0); // Orange with pulsing intensity
      } else {
        // Low load - yellow color
        color = new THREE.Color(1, 1, intensity * 0.3); // Yellow with pulsing intensity
      }
      
      this.activityLed.material.color = color;
      this.activityLed.material.opacity = 0.5 + intensity * 0.5; // Pulsing opacity
      
      // Schedule next update
      requestAnimationFrame(() => this.updateVisualStatus());
    } else {
      // Server is idle - dim yellow LED
      this.activityLed.material.color.set(0xFFFF00);
      this.activityLed.material.opacity = 0.3;
    }
  }
  
  upgradeComponent(component, level) {
    switch(component) {
      case 'cpu':
        this.specs.cpu.cores = Math.min(64, this.specs.cpu.cores * 2);
        this.specs.cpu.speed += 0.5;
        this.powerConsumption += 50;
        this.revenue += 5;
        break;
      case 'ram':
        this.specs.ram = Math.min(1024, this.specs.ram * 2);
        this.powerConsumption += 20;
        this.revenue += 3;
        break;
      case 'storage':
        this.specs.storage.push({ type: 'ssd', size: 512 });
        this.powerConsumption += 10;
        this.revenue += 2;
        break;
      case 'network':
        this.specs.networkCards[0].speed *= 2;
        this.powerConsumption += 5;
        this.revenue += 4;
        break;
    }
    
    console.log(`Upgraded ${component} to level ${level}`);
    console.log('New specs:', this.specs);
    return this.specs;
  }
  
  update(deltaTime) {
    // Update server status, temperature, utilization
    // This would be called from the game loop
    
    // Base utilization (hardware monitoring, background tasks, etc.)
    let baseUtilization = 5; // 5% base utilization 
    
    // Add utilization from hosted websites with small random fluctuations
    if (this.hostedWebsites.length > 0) {
      // Set utilization based on website activity with some randomness
      this.utilization = Math.min(100, baseUtilization + this.cpuUsage + (Math.random() - 0.5) * 5);
      this.status = 'running';
    } else {
      // If no websites, have small random fluctuations in idle state
      this.utilization = Math.min(100, Math.max(0, baseUtilization + (Math.random() - 0.5) * 3));
      
      if (this.utilization < 5) {
        this.status = 'idle';
      }
    }
    
    // Get the rack this server is in
    const rack = this.getRack();
    let baseTemp = 35; // Default base temp
    let coolingFactor = 1.0; // Default cooling factor
    
    // Check if there's airflow space around the server
    if (rack) {
      // Check for 2U spacing above and below for better airflow
      const hasAirflow = this.checkAirflow(rack);
      coolingFactor = hasAirflow ? 0.7 : 1.0; // 30% more efficient cooling with airflow
      baseTemp = rack.temperature; // Use rack temperature as the base
    }
    
    // Update temperature based on utilization and cooling
    const utilizationHeat = (this.utilization / 100) * 30; // Heat from utilization
    const targetTemp = baseTemp + utilizationHeat * coolingFactor;
    this.temperature += (targetTemp - this.temperature) * 0.1;
    
    // Update status based on temperature
    if (this.temperature > 80) {
      this.status = 'error';
    }
    
    // Calculate revenue
    let websiteRevenue = 0;
    
    // Revenue from hosted websites (more stable income)
    if (this.hostedWebsites.length > 0) {
      // Calculate revenue from all hosted websites
      websiteRevenue = this.hostedWebsites.reduce((sum, website) => {
        // Calculate revenue based on resource usage
        const resourceUsage = (website.cpuUsage / 100) * (website.specifications.cpuCores / 8) + 
                              (website.ramUsage / 100) * (website.specifications.ramGB / 16) + 
                              (website.bandwidthUsage / 1000); // Scale bandwidth to reasonable value
        
        return sum + (resourceUsage * 5); // $5 per resource unit
      }, 0);
    }
    
    // Base revenue from server utilization (less important with websites)
    const baseRevenue = (this.revenue * (this.utilization / 100)) * 0.5; // Reduced weight for non-website utilization
    
    // Return total revenue
    return (baseRevenue + websiteRevenue) * deltaTime;
  }
  
  showServerDetails() {
    // Method to display detailed server info in UI
    console.log("Server details:", {
      id: this.id,
      name: this.name,
      unitSize: this.unitSize,
      specs: this.specs,
      power: this.powerConsumption,
      temperature: this.temperature.toFixed(1),
      utilization: this.utilization.toFixed(1),
      status: this.status,
      revenue: this.revenue,
      hostedWebsites: this.hostedWebsites.length,
      cpuUsage: this.cpuUsage.toFixed(1),
      ramUsage: this.ramUsage.toFixed(1),
      storageUsage: this.storageUsage.toFixed(1),
      bandwidthUsage: this.bandwidthUsage.toFixed(1)
    });
  }
  
  // Add a website to this server
  assignWebsite(customerAgreement) {
    // Check if this website is already assigned
    if (this.hostedWebsites.some(site => site.id === customerAgreement.id)) {
      console.log(`Website ${customerAgreement.customerName} already assigned to this server`);
      return false;
    }
    
    // Calculate resource usage
    const specs = customerAgreement.specifications;
    const totalCpuCores = this.specs.cpu.cores;
    const totalRam = this.specs.ram;
    const totalStorage = this.specs.storage.reduce((sum, drive) => sum + drive.size, 0);
    const totalBandwidth = this.specs.networkCards.reduce((sum, card) => sum + card.speed, 0) * 1000; // Convert to Mbps
    
    // Calculate usage percentages
    const newCpuUsage = (specs.cpuCores / totalCpuCores) * 100;
    const newRamUsage = (specs.ramGB / totalRam) * 100;
    const newStorageUsage = (specs.storageGB / totalStorage) * 100;
    const newBandwidthUsage = specs.bandwidthMbps;
    
    // Check if we have enough resources
    if (this.cpuUsage + newCpuUsage > 100) {
      console.log(`Not enough CPU capacity on server ${this.name}`);
      return false;
    }
    
    if (this.ramUsage + newRamUsage > 100) {
      console.log(`Not enough RAM capacity on server ${this.name}`);
      return false;
    }
    
    if (this.storageUsage + newStorageUsage > 100) {
      console.log(`Not enough storage capacity on server ${this.name}`);
      return false;
    }
    
    if (this.bandwidthUsage + newBandwidthUsage > totalBandwidth) {
      console.log(`Not enough bandwidth capacity on server ${this.name}`);
      return false;
    }
    
    // Add the website to this server
    this.hostedWebsites.push({
      id: customerAgreement.id,
      customerName: customerAgreement.customerName,
      type: customerAgreement.type,
      specifications: customerAgreement.specifications,
      bandwidthUsage: newBandwidthUsage,
      cpuUsage: newCpuUsage,
      ramUsage: newRamUsage,
      storageUsage: newStorageUsage,
      assignedAt: Date.now()
    });
    
    // Update resource usage
    this.cpuUsage += newCpuUsage;
    this.ramUsage += newRamUsage;
    this.storageUsage += newStorageUsage;
    this.bandwidthUsage += newBandwidthUsage;
    
    // Update the status and utilization based on new load
    this.utilization = Math.max(this.utilization, this.cpuUsage);
    if (this.utilization > 5) {
      this.status = 'running';
    }
    
    console.log(`Assigned ${customerAgreement.type} for ${customerAgreement.customerName} to server ${this.name}`);
    
    // Update visual status to show hosting activity
    this.updateVisualStatus();
    
    return true;
  }
  
  // Remove a website from this server
  removeWebsite(agreementId) {
    const websiteIndex = this.hostedWebsites.findIndex(site => site.id === agreementId);
    
    if (websiteIndex === -1) {
      console.log(`Website with ID ${agreementId} not found on this server`);
      return false;
    }
    
    const website = this.hostedWebsites[websiteIndex];
    
    // Remove the website from the server
    this.hostedWebsites.splice(websiteIndex, 1);
    
    // Update resource usage
    this.cpuUsage -= website.cpuUsage;
    this.ramUsage -= website.ramUsage;
    this.storageUsage -= website.storageUsage;
    this.bandwidthUsage -= website.bandwidthUsage;
    
    // Ensure values don't go below 0 due to rounding errors
    this.cpuUsage = Math.max(0, this.cpuUsage);
    this.ramUsage = Math.max(0, this.ramUsage);
    this.storageUsage = Math.max(0, this.storageUsage);
    this.bandwidthUsage = Math.max(0, this.bandwidthUsage);
    
    // Update server status if no websites are hosted
    if (this.hostedWebsites.length === 0 && this.utilization < 5) {
      this.status = 'idle';
    }
    
    console.log(`Removed website ${website.customerName} from server ${this.name}`);
    
    // Update visual status when website is removed
    this.updateVisualStatus();
    
    return true;
  }
  
  // Get available resource capacity
  getAvailableCapacity() {
    const totalStorage = this.specs.storage.reduce((sum, drive) => sum + drive.size, 0);
    const totalBandwidth = this.specs.networkCards.reduce((sum, card) => sum + card.speed, 0) * 1000; // Convert to Mbps
    
    return {
      cpu: {
        total: this.specs.cpu.cores,
        used: this.specs.cpu.cores * (this.cpuUsage / 100),
        available: this.specs.cpu.cores * (1 - this.cpuUsage / 100)
      },
      ram: {
        total: this.specs.ram,
        used: this.specs.ram * (this.ramUsage / 100),
        available: this.specs.ram * (1 - this.ramUsage / 100)
      },
      storage: {
        total: totalStorage,
        used: totalStorage * (this.storageUsage / 100),
        available: totalStorage * (1 - this.storageUsage / 100)
      },
      bandwidth: {
        total: totalBandwidth,
        used: this.bandwidthUsage,
        available: totalBandwidth - this.bandwidthUsage
      },
      percentages: {
        cpu: 100 - this.cpuUsage,
        ram: 100 - this.ramUsage,
        storage: 100 - this.storageUsage,
        bandwidth: 100 - (this.bandwidthUsage / totalBandwidth * 100)
      }
    };
  }
  
  // Find which rack this server is in
  getRack() {
    if (!this.game || !this.game.datacenter) return null;
    
    for (const rack of this.game.datacenter.racks) {
      if (rack.servers.includes(this)) {
        return rack;
      }
    }
    return null;
  }
  
  // Check if this server has good airflow (2U space above and below)
  checkAirflow(rack) {
    if (!rack) return false;
    
    const position = this.position;
    const size = this.unitSize;
    
    // Check for 2U space above and below
    let spaceAbove = true;
    let spaceBelow = true;
    
    // Check space below
    if (position < 2) {
      spaceBelow = false; // Not enough space at the bottom
    } else {
      // Check for equipment in the space below
      for (let i = position - 2; i < position; i++) {
        if (!rack.isPositionAvailable(i, 1, this.id)) {
          spaceBelow = false;
          break;
        }
      }
    }
    
    // Check space above
    if (position + size + 2 > rack.rackHeightUnits) {
      spaceAbove = false; // Not enough space at the top
    } else {
      // Check for equipment in the space above
      for (let i = position + size; i < position + size + 2; i++) {
        if (!rack.isPositionAvailable(i, 1, this.id)) {
          spaceAbove = false;
          break;
        }
      }
    }
    
    return spaceAbove && spaceBelow;
  }
}