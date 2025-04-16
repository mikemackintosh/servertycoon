import * as THREE from 'three';

export class Server {
  constructor(game, unitSize = 1) {
    this.game = game;
    this.container = new THREE.Group();
    this.id = Math.random().toString(36).substr(2, 9); // Unique ID
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
    
    // Network connectivity properties
    this.ipAddress = null;
    this.gateway = null;
    this.connected = false;
    this.connections = []; // Stores connection details to network equipment
  }

  init() {
    this.createServerHardware();
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
    
    // Add LEDs
    this.addLED(0.7, 0, -1.42, 0x00FF00); // Green power LED
    this.addLED(0.5, 0, -1.42, 0xFFFF00); // Yellow activity LED
    
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
    const ledMaterial = new THREE.MeshBasicMaterial({ color: color });
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(x, y, z);
    this.container.add(led);
    return led;
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
    
    // Simulate random utilization changes
    this.utilization = Math.min(100, Math.max(0, this.utilization + (Math.random() - 0.5) * 10));
    
    // Update temperature based on utilization
    const targetTemp = 35 + (this.utilization / 100) * 30; // 35°C idle, up to 65°C at full load
    this.temperature += (targetTemp - this.temperature) * 0.1;
    
    // Update status based on temperature and utilization
    if (this.temperature > 80) {
      this.status = 'error';
    } else if (this.utilization > 5) {
      this.status = 'running';
    } else {
      this.status = 'idle';
    }
    
    // Return revenue based on utilization
    return (this.revenue * (this.utilization / 100)) * deltaTime;
  }
  
  showServerDetails() {
    // Method to display detailed server info in UI
    console.log("Server details:", {
      id: this.id,
      unitSize: this.unitSize,
      specs: this.specs,
      power: this.powerConsumption,
      temperature: this.temperature.toFixed(1),
      utilization: this.utilization.toFixed(1),
      status: this.status,
      revenue: this.revenue
    });
  }
}