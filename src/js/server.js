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
    this.connections = []; // Stores connection details to network equipment
    
    // Hosting properties
    this.hostedWebsites = []; // Array of customer agreements hosted on this server
    this.cpuUsage = 0; // Percentage of CPU used by hosted websites
    this.ramUsage = 0; // Percentage of RAM used by hosted websites
    this.storageUsage = 0; // Percentage of storage used by hosted websites
    this.bandwidthUsage = 0; // Mbps of bandwidth used by hosted websites
  }
  
  // Update method that will be called in the game loop
  update(delta) {
    if (!this.powered) return 0;
    
    // If server is running websites, update utilization with some minor variance
    if (this.hostedWebsites.length > 0) {
      // Add some small random fluctuation to utilization (max +/- 10%)
      const fluctuation = (Math.random() * 10 - 5) * delta;
      this.utilization = Math.min(100, Math.max(this.cpuUsage, this.utilization + fluctuation));
      
      // Update bandwidth usage based on hosted websites with some fluctuation
      // This simulates real-world traffic patterns
      let simulatedBandwidthUsage = 0;
      
      for (const website of this.hostedWebsites) {
        const baseBandwidth = website.specifications.bandwidthMbps;
        // Add some traffic variation - more variation for 'bursty' websites
        const trafficPattern = website.specifications.trafficPattern || '';
        
        let variationFactor = 0.2; // Default 20% variation
        if (trafficPattern.toLowerCase().includes('bursty')) {
          variationFactor = 0.5; // 50% variation for bursty traffic
        } else if (trafficPattern.toLowerCase().includes('high')) {
          variationFactor = 0.3; // 30% variation for high traffic
        }
        
        // Calculate bandwidth with variation and time-based patterns
        const variation = baseBandwidth * variationFactor;
        const time = Date.now() * 0.001; // Current time in seconds
        const timeBasedPattern = Math.sin(time * 0.1) * 0.5 + 0.5; // 0-1 value that changes over time
        
        const currentBandwidth = baseBandwidth + (variation * timeBasedPattern);
        simulatedBandwidthUsage += currentBandwidth;
        
        // Update the website's current bandwidth usage
        website.bandwidthUsage = currentBandwidth;
      }
      
      // Update server's total bandwidth usage
      this.bandwidthUsage = simulatedBandwidthUsage;
      
      // Calculate revenue based on uptime and utilization
      const hourlyRevenue = (this.connected) ? this.revenue : this.revenue * 0.1;
      return hourlyRevenue * delta / (60 * 60); // Convert hourly revenue to per-second rate
    } else {
      // No websites hosted, so no bandwidth usage
      this.bandwidthUsage = 0;
    }
    
    return 0; // No revenue if no websites hosted
  }

  init() {
    this.createServerHardware();
    
    // Create activity LEDs that will be used to show website hosting status
    this.activityLed = this.addLED(0.5, 0, -1.42, 0xFFFF00); // Yellow activity LED
    
    // Add multiple status LEDs for that classic 80s/90s server look
    this.addServerStatusLEDs();
    
    // Add drive bay LEDs along the front edge
    this.addDriveBayLEDs();
    
    // Add top chassis LEDs - very vintage server room aesthetic
    this.addTopChassisBlinkers();
    
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
  
  addLED(x, y, z, color, emissive = false, size = 0.05) {
    const ledGeometry = new THREE.CircleGeometry(size, 16);
    
    let ledMaterial;
    if (emissive) {
      ledMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.8
      });
    } else {
      ledMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
      });
    }
    
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(x, y, z);
    
    // Add a small glow effect around the LED (very 80s/90s computer aesthetic)
    if (size >= 0.04) {
      const glowGeometry = new THREE.CircleGeometry(size * 1.8, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = -0.001; // Slightly behind the LED
      led.add(glow);
    }
    
    this.container.add(led);
    return led;
  }
  
  // Update server visual appearance based on hosting status with 80s/90s aesthetic
  updateVisualStatus() {
    if (!this.activityLed) return;
    
    // Get current time for all animations
    const time = Date.now() * 0.001; // Convert to seconds
    
    if (this.hostedWebsites.length > 0) {
      // Server is hosting websites - make activity LED blink rapidly
      
      // The blink rate is based on utilization - higher utilization = faster blinking
      const blinkRate = this.utilization / 100; // 0 to 1 scale
      
      // Calculate the intensity based on time - use faster blink patterns for retro feel
      const intensity = Math.sin(time * 8 * (0.8 + blinkRate)) * 0.5 + 0.5; // 0 to 1 oscillation
      
      // Alternate between yellow and red based on load - more saturated colors for 80s look
      let color;
      if (this.utilization > 80) {
        // High load - bright red color
        color = new THREE.Color(1, intensity * 0.2, 0); // Pure red with slight pulsing
      } else if (this.utilization > 50) {
        // Medium load - orange color
        color = new THREE.Color(1, intensity * 0.6, 0); // Orange with pulsing intensity
      } else {
        // Low load - yellow color
        color = new THREE.Color(1, 1, intensity * 0.2); // Yellow with pulsing intensity
      }
      
      // Apply brightness based on utilization - brighter = more activity
      this.activityLed.material.color.copy(color);
      this.activityLed.material.opacity = 0.7 + intensity * 0.3; // Pulsing opacity
    } else {
      // Server is idle - dim yellow LED with occasional random flicker
      this.activityLed.material.color.set(0xFFFF00);
      
      // Random flickering effect - simulates old electronics
      const flicker = Math.random() > 0.95 ? Math.random() * 0.5 : 0;
      this.activityLed.material.opacity = 0.3 + flicker;
    }
    
    // Update status LEDs
    if (this.statusLEDs && this.statusLEDs.length > 0) {
      this.statusLEDs.forEach(led => {
        if (!led || !led.material) return;
        
        // Get LED parameters
        const blinkRate = led.userData.blinkRate || 1.0;
        const blinkPhase = led.userData.blinkPhase || 0;
        
        // Calculate LED intensity based on sine wave - classic computer blinking
        const intensity = 0.5 + 0.5 * Math.sin(time * blinkRate + blinkPhase);
        led.material.opacity = intensity;
        
        // Occasional random flicker for that classic 80s computer look
        if (Math.random() > 0.98) {
          led.material.opacity = Math.random() > 0.5 ? 1.0 : 0.2;
        }
      });
    }
    
    // Update top chassis LEDs
    if (this.topLEDs && this.topLEDs.length > 0) {
      this.topLEDs.forEach((led, index) => {
        if (!led || !led.material) return;
        
        // Get LED parameters
        const blinkRate = led.userData.blinkRate || 1.0;
        const blinkPhase = led.userData.blinkPhase || 0;
        
        // Staggered digital-looking blinking pattern based on position
        const pattern = (Math.sin(time * blinkRate + blinkPhase + index * 0.5) > 0) ? 0.9 : 0.1;
        led.material.opacity = pattern;
        
        // Random color cycling - very 80s rainbow effect
        if (Math.random() > 0.99) { // 1% chance per frame
          const hue = Math.random();
          led.material.color.setHSL(hue, 1.0, 0.5);
        }
      });
    }
    
    // Update drive bay LEDs
    if (this.driveLEDs && this.driveLEDs.length > 0) {
      this.driveLEDs.forEach(driveLed => {
        if (!driveLed || !driveLed.material || !driveLed.userData.blink) return;
        
        const blinkData = driveLed.userData.blink;
        
        // Update time counter
        blinkData.time += 0.1 * blinkData.speed;
        
        // Different pattern for drive LEDs - more staccato, less smooth
        // This creates a "disk activity" look
        let intensity;
        
        if (this.hostedWebsites.length > 0) {
          // More digital-looking pattern - either on or mostly off for server activity
          const randomActive = Math.random() > 0.7;
          intensity = randomActive ? 0.8 + Math.random() * 0.2 : 0.1;
        } else {
          // Gentler pulsing when idle
          intensity = (Math.sin(blinkData.time) + 1) * 0.3;
        }
        
        // Apply intensity to the LED
        driveLed.material.opacity = intensity;
        
        // Color can shift subtly
        const hue = (Math.sin(blinkData.time * 0.2) + 1) * 0.05;
        driveLed.material.color.setHSL(hue, 1, 0.5);
      });
    }
    
    // Schedule next update - slightly faster for retro-style rapid blinking
    requestAnimationFrame(() => this.updateVisualStatus());
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
  
  // Add multiple status LEDs across the server for retro look
  addServerStatusLEDs() {
    // Get server width to properly position LEDs within the chassis
    const serverWidth = 1.8; // From server geometry in createServerHardware
    const ledWidth = 0.04; // Small enough LEDs to fit within chassis
    const ledSpacing = serverWidth * 0.8 / 5; // Distribute 5 LEDs across 80% of width
    const startX = -serverWidth * 0.8 / 2 + ledWidth;
    
    // Define LED colors (1980s style with bright primary colors)
    const ledColors = [
      0xff0000, // Red
      0x00ff00, // Green
      0xffff00, // Yellow
      0x00ffff, // Cyan
      0xff00ff  // Magenta
    ];
    
    this.statusLEDs = [];
    
    // Create each status LED with proper spacing
    for (let i = 0; i < 5; i++) {
      const xPos = startX + (i * ledSpacing);
      const led = this.addLED(xPos, 0, -1.41, ledColors[i], false, 0.04); // Smaller size
      led.userData = {
        type: 'statusLED',
        blinkRate: 0.3 + (i * 0.2), // Increasing blink rates
        blinkPhase: Math.random() * Math.PI * 2 // Random starting phase
      };
      this.statusLEDs.push(led);
    }
  }
  
  // Add drive bay LEDs for that classic server look
  addDriveBayLEDs() {
    // Get server dimensions to make sure drive bays fit within chassis
    const serverWidth = 1.8; // From server geometry
    const maxWidth = serverWidth * 0.9; // Keep within 90% of server width
    
    // Calculate drive bay dimensions to fit properly
    const bayWidth = 0.12; // Smaller bay width
    const bayCount = Math.min(6, Math.ceil(this.unitSize * 2)); // Limit bay count based on server size
    
    // Make sure all bays fit within the chassis width
    const spacing = 0.04; // Space between bays
    const totalNeededWidth = (bayCount * bayWidth) + ((bayCount - 1) * spacing);
    
    // If bays won't fit, reduce their size
    let actualBayWidth = bayWidth;
    if (totalNeededWidth > maxWidth) {
      actualBayWidth = (maxWidth - ((bayCount - 1) * spacing)) / bayCount;
    }
    
    // Calculate start position to center the bays
    const totalWidth = (bayCount * actualBayWidth) + ((bayCount - 1) * spacing);
    const startX = -totalWidth / 2 + (actualBayWidth / 2);
    
    this.driveLEDs = [];
    
    // Create each drive bay LED
    for (let i = 0; i < bayCount; i++) {
      const xPos = startX + i * (actualBayWidth + spacing);
      
      // Add small rectangular drive bay cover first (so LED appears on top)
      const bayGeometry = new THREE.BoxGeometry(actualBayWidth, actualBayWidth * 1.1, 0.01);
      const bayMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.4
      });
      
      const bayMesh = new THREE.Mesh(bayGeometry, bayMaterial);
      bayMesh.position.set(xPos, 0, -1.405);
      this.container.add(bayMesh);
      
      // Add tiny drive LED - blinking light for disk activity
      const driveLed = this.addLED(xPos, 0, -1.4, 0x00ff00, false, 0.02); // Very small LEDs
      driveLed.userData = { 
        blink: {
          time: Math.random() * Math.PI * 2, 
          speed: 0.5 + Math.random() * 1.5
        },
        type: 'driveLED'
      };
      this.driveLEDs.push(driveLed);
    }
  }
  
  // Add top chassis LEDs - row of blinking lights on server top
  addTopChassisBlinkers() {
    // Get server dimensions
    const serverWidth = 1.8; // From server geometry
    const height = this.unitSize * 0.25 * (1/42); // Height based on U size
    
    // Scale number of LEDs based on server size, but keep within chassis width
    const ledCount = Math.max(3, Math.min(5, this.unitSize * 1.5)); // 3-5 LEDs based on server size
    const colors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff]; // Rainbow!
    
    this.topLEDs = [];
    
    // Calculate spacing to keep LEDs within the chassis
    const ledSize = 0.03; // Smaller LEDs
    const maxWidth = serverWidth * 0.8; // Keep within 80% of server width
    
    // Make sure LEDs fit within server width
    const spacing = Math.min((maxWidth - (ledCount * 2 * ledSize)) / (ledCount - 1), 0.2);
    const totalWidth = (ledCount * 2 * ledSize) + ((ledCount - 1) * spacing);
    const startX = -totalWidth / 2 + ledSize;
    
    for (let i = 0; i < ledCount; i++) {
      const xPos = startX + i * (2 * ledSize + spacing);
      const yPos = height/2 + 0.005; // Just above the top of the server (smaller offset)
      
      // Distribute LEDs evenly from front to back, staying within server depth
      const zPos = -1.0 + (i % 2) * 2.0; // Alternate between front and back
      
      // Create the top LED - smaller size
      const led = new THREE.Mesh(
        new THREE.CircleGeometry(ledSize, 16),
        new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
      );
      
      led.rotation.x = -Math.PI/2; // Make it face up
      led.position.set(xPos, yPos, zPos);
      
      // Add blink data
      led.userData = {
        blinkRate: 0.2 + Math.random() * 1.5,
        blinkPhase: Math.random() * Math.PI * 2,
        type: 'topLED'
      };
      
      this.container.add(led);
      this.topLEDs.push(led);
    }
  }
}