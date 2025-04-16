import * as THREE from 'three';
import { Server } from './server.js';
import { NetworkEquipment } from './networkEquipment.js';

export class ServerRack {
  constructor(game, name = null) {
    this.game = game;
    this.id = 'rack-' + Math.random().toString(36).substr(2, 9);
    this.name = name || `Rack-${this.id.substring(5, 9)}`; // Default name if none provided
    this.container = new THREE.Group();
    this.rackHeight = 42; // 42U rack
    this.servers = [];
    this.networkEquipment = [];
    this.rackWidth = 1.9; // 24 inches (2 feet) - slightly less than cell for margin
    this.rackDepth = 3.9; // 48 inches (4 feet) - takes up 2 grid cells in depth
    this.rackHeightUnits = 42; // 42U standard rack
    
    // Movement properties
    this.movable = true;
    this.gridX = 0;
    this.gridZ = 0;
    
    // Network connectivity
    this.connected = false;
    this.circuitConnection = null;
    
    // Power and temperature
    this.hasPower = true;
    this.powerCapacity = 2000; // 2 kilowatt capacity
    this.powerAvailable = 2000; // Available power 
    this.temperature = 22; // Temperature in Celsius
  }

  init(isEmpty = false) {
    this.createRackStructure();
    
    // Only add sample equipment if this is not an empty rack
    if (!isEmpty) {
      // Add a couple of sample servers
      this.addServer(2, 2); // 2U server at position 2
      this.addServer(10, 1); // 1U server at position 10
      this.addServer(20, 4); // 4U server at position 20
      
      // Add some sample network equipment
      this.addNetworkEquipment('SWITCH', 25);
      this.addNetworkEquipment('PATCH_PANEL', 30);
    }
  }

  createRackStructure() {
    // Create rack body - 80s/90s style with visible frame
    // Size as a 2x1 rectangle (24"x48") with a small margin
    const rackGeometry = new THREE.BoxGeometry(this.rackWidth * 0.95, this.rackHeight * 0.25, this.rackDepth * 0.95);
    
    // Create material with retro 80s/90s look - dark metallic with visible texture
    const rackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x252525, // Dark gray with slight blue tint
      roughness: 0.6,
      metalness: 0.7,
      emissive: 0x000066, // Subtle blue glow
      emissiveIntensity: 0.2
    });
    
    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.y = this.rackHeight * 0.125; // Half height
    rack.castShadow = true;
    rack.receiveShadow = true;
    rack.userData = { 
      type: 'rack', 
      empty: this.servers.length === 0 && this.networkEquipment.length === 0,
      rackId: this.id,
      id: this.id,
      gridX: this.gridX,
      gridZ: this.gridZ,
      movable: true,
      interactive: true
    };
    
    // Add neon edge highlights - very 80s
    const edgeGeometry = new THREE.EdgesGeometry(rackGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff00ff, // Bright magenta
      transparent: true,
      opacity: 0.8
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    rack.add(edges);
    
    // Add LED strips along the edges - classic 80s tech look
    this.addRackLEDs(rack);
    
    // Add a glow effect at the base
    const glowGeometry = new THREE.PlaneGeometry(this.rackWidth * 0.95, this.rackDepth * 0.95);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff, // Cyan glow
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -this.rackHeight * 0.124; // Just at the bottom of the rack
    rack.add(glow);
    
    // Add blinking status lights to top of rack
    this.addRackStatusLights(rack);
    
    // Set userData on container as well for consistent detection
    this.container.userData = { 
      type: 'rack', 
      empty: this.servers.length === 0 && this.networkEquipment.length === 0,
      rackId: this.id,
      id: this.id,
      gridX: this.gridX,
      gridZ: this.gridZ,
      movable: true,
      interactive: true
    };
    
    this.container.add(rack);
    
    // Add LED strips along rack edges for that 80s aesthetic
    this.addRackLEDs(rack);
    
    // Add blinking status lights to top of rack
    this.addRackStatusLights(rack);
    
    // Add floating rack name label above the rack
    this.addRackNameLabel();
    
    // Add rack rails (vertical supports)
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.6,
      metalness: 0.7
    });
    
    // Front left rail
    const railGeometry = new THREE.BoxGeometry(0.1, this.rackHeight * 0.25, 0.1);
    const frontLeftRail = new THREE.Mesh(railGeometry, railMaterial);
    frontLeftRail.position.set(-this.rackWidth/2 + 0.15, this.rackHeight * 0.125, -this.rackDepth/2 + 0.15);
    this.container.add(frontLeftRail);
    
    // Front right rail
    const frontRightRail = new THREE.Mesh(railGeometry, railMaterial);
    frontRightRail.position.set(this.rackWidth/2 - 0.15, this.rackHeight * 0.125, -this.rackDepth/2 + 0.15);
    this.container.add(frontRightRail);
    
    // Back left rail
    const backLeftRail = new THREE.Mesh(railGeometry, railMaterial);
    backLeftRail.position.set(-this.rackWidth/2 + 0.15, this.rackHeight * 0.125, this.rackDepth/2 - 0.15);
    this.container.add(backLeftRail);
    
    // Back right rail
    const backRightRail = new THREE.Mesh(railGeometry, railMaterial);
    backRightRail.position.set(this.rackWidth/2 - 0.15, this.rackHeight * 0.125, this.rackDepth/2 - 0.15);
    this.container.add(backRightRail);
    
    // Add unit markings (simple visual indicators)
    for (let i = 0; i < this.rackHeightUnits; i += 5) { // Add marker every 5U
      const markerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.3);
      const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      // Position marker on front of rack
      const yPos = (i / this.rackHeightUnits) * this.rackHeight * 0.25;
      marker.position.set(-this.rackWidth/2 + 0.03, yPos, -this.rackDepth/2);
      
      this.container.add(marker);
    }
  }
  
  // Check if a rack position is available
  // excludeItemId: optional ID of item to exclude from conflict check (useful for drag & drop)
  isPositionAvailable(position, unitSize, excludeItemId = null) {
    if (position < 0 || position + unitSize > this.rackHeightUnits) {
      return false;
    }
    
    // Check conflicts with servers
    const serverConflict = this.servers.some(server => {
      // Skip this server if it's the one being moved
      if (excludeItemId && server.id === excludeItemId) {
        return false;
      }
      
      const itemPos = server.position;
      const itemSize = server.unitSize;
      return (
        (position >= itemPos && position < itemPos + itemSize) ||
        (position + unitSize > itemPos && position + unitSize <= itemPos + itemSize) ||
        (position <= itemPos && position + unitSize >= itemPos + itemSize)
      );
    });
    
    if (serverConflict) {
      return false;
    }
    
    // Check conflicts with network equipment
    const networkConflict = this.networkEquipment.some(equipment => {
      // Skip this equipment if it's the one being moved
      if (excludeItemId && equipment.id === excludeItemId) {
        return false;
      }
      
      const itemPos = equipment.position;
      const itemSize = equipment.unitSize;
      return (
        (position >= itemPos && position < itemPos + itemSize) ||
        (position + unitSize > itemPos && position + unitSize <= itemPos + itemSize) ||
        (position <= itemPos && position + unitSize >= itemPos + itemSize)
      );
    });
    
    return !networkConflict;
  }
  
  addServer(position, unitSize, name = null) {
    // Check if position is valid and not already occupied
    if (!this.isPositionAvailable(position, unitSize)) {
      console.error("Invalid server position or size, or position is occupied");
      return null;
    }
    
    // Check if there's enough power available
    const serverPower = 150; // Estimated initial power draw
    if (serverPower > this.powerAvailable) {
      console.error("Not enough power available in rack");
      return null;
    }
    
    // Create and add the server
    const server = new Server(this.game, unitSize, name);
    server.position = position;
    server.init();
    
    // Position server within rack
    const yPos = (position / this.rackHeightUnits) * this.rackHeight * 0.25;
    server.container.position.set(0, yPos, 0);
    
    // Update available power
    this.powerAvailable -= server.powerConsumption;
    
    this.servers.push(server);
    this.container.add(server.container);
    
    return server;
  }
  
  addNetworkEquipment(type, position, options = {}) {
    const equipment = new NetworkEquipment(this.game, type, options);
    
    // Check if position is valid and not already occupied
    if (!this.isPositionAvailable(position, equipment.unitSize)) {
      console.error("Invalid position or position is occupied");
      return null;
    }
    
    // Check if there's enough power available
    if (equipment.powerConsumption > this.powerAvailable) {
      console.error("Not enough power available in rack");
      return null;
    }
    
    equipment.position = position;
    equipment.init();
    
    // Position equipment within rack
    const yPos = (position / this.rackHeightUnits) * this.rackHeight * 0.25;
    equipment.container.position.set(0, yPos, 0);
    
    // Update available power
    this.powerAvailable -= equipment.powerConsumption;
    
    this.networkEquipment.push(equipment);
    this.container.add(equipment.container);
    
    return equipment;
  }
  
  removeServer(serverId) {
    const serverIndex = this.servers.findIndex(server => server.id === serverId);
    
    if (serverIndex !== -1) {
      const server = this.servers[serverIndex];
      
      // Return power to the rack
      this.powerAvailable += server.powerConsumption;
      
      this.container.remove(server.container);
      this.servers.splice(serverIndex, 1);
    }
  }
  
  removeNetworkEquipment(equipmentId) {
    const equipmentIndex = this.networkEquipment.findIndex(eq => eq.id === equipmentId);
    
    if (equipmentIndex !== -1) {
      const equipment = this.networkEquipment[equipmentIndex];
      
      // Return power to the rack
      this.powerAvailable += equipment.powerConsumption;
      
      this.container.remove(equipment.container);
      this.networkEquipment.splice(equipmentIndex, 1);
    }
  }
  
  showRackDetails() {
    // Method to display detailed rack view UI
    const serverUnits = this.servers.reduce((total, server) => total + server.unitSize, 0);
    const networkUnits = this.networkEquipment.reduce((total, eq) => total + eq.unitSize, 0);
    const totalUsedUnits = serverUnits + networkUnits;
    
    const totalPowerUsage = this.calculateTotalPowerUsage();
    
    console.log("Rack details:", {
      id: this.id,
      name: this.name,
      totalServers: this.servers.length,
      totalNetworkEquipment: this.networkEquipment.length,
      serverUnits: serverUnits,
      networkUnits: networkUnits,
      totalUsedUnits: totalUsedUnits,
      availableUnits: this.rackHeightUnits - totalUsedUnits,
      temperature: this.temperature.toFixed(1),
      powerCapacity: this.powerCapacity,
      powerUsage: totalPowerUsage,
      powerAvailable: this.powerAvailable
    });
  }
  
  // Find an equipment item (server or network) by ID
  findEquipmentById(id) {
    // Check servers first
    const server = this.servers.find(s => s.id === id);
    if (server) return server;
    
    // Then check network equipment
    return this.networkEquipment.find(eq => eq.id === id);
  }
  
  // Calculate total power usage of all equipment in the rack
  calculateTotalPowerUsage() {
    let totalPower = 0;
    
    // Sum server power usage
    this.servers.forEach(server => {
      totalPower += server.powerConsumption;
    });
    
    // Sum network equipment power usage
    this.networkEquipment.forEach(equipment => {
      totalPower += equipment.powerConsumption;
    });
    
    return totalPower;
  }
  
  // Update rack temperature based on equipment
  updateTemperature() {
    // Base temperature starts at room temperature (22°C)
    let baseTemp = 22;
    
    // Calculate average equipment temperature
    let totalEquipment = this.servers.length + this.networkEquipment.length;
    if (totalEquipment > 0) {
      let totalTemp = 0;
      
      // Add server temperatures
      this.servers.forEach(server => {
        totalTemp += server.temperature;
      });
      
      // Add network equipment temperatures
      this.networkEquipment.forEach(equipment => {
        totalTemp += equipment.temperature;
      });
      
      // Calculate influence of equipment on rack temperature
      const equipmentInfluence = (totalTemp / totalEquipment) * 0.2; // Equipment affects 20% of rack temp
      this.temperature = baseTemp + equipmentInfluence;
      
      // Update game datacenter temperature if this is too hot
      if (this.game && this.game.datacenter && this.temperature > 35) {
        this.game.datacenter.addHeat(this.temperature - 35);
      }
    } else {
      // Empty rack gradually returns to room temperature
      this.temperature = baseTemp + (this.temperature - baseTemp) * 0.9;
    }
    
    return this.temperature;
  }
  
  // Create and add a 3D text label for the rack name
  addRackNameLabel() {
    // Check if label already exists, remove it if so
    if (this.nameLabel) {
      this.container.remove(this.nameLabel);
    }
    
    // Create a canvas to render the text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const textWidth = 256;
    const textHeight = 64;
    canvas.width = textWidth;
    canvas.height = textHeight;
    
    // Fill background with semi-transparent black
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, textWidth, textHeight);
    
    // Draw white text
    context.font = 'bold 24px monospace';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.name, textWidth / 2, textHeight / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create plane geometry for the label
    const geometry = new THREE.PlaneGeometry(3, 0.75);
    
    // Create mesh and position it above the rack
    this.nameLabel = new THREE.Mesh(geometry, material);
    this.nameLabel.position.set(0, this.rackHeight * 0.25 + 0.5, 0); // Position above rack
    this.nameLabel.rotation.x = -Math.PI / 4; // Tilt slightly for better visibility
    
    // Add to rack container
    this.container.add(this.nameLabel);
  }
  
  // Update the name label when the rack name changes
  updateRackName(newName) {
    this.name = newName;
    this.addRackNameLabel(); // Recreate the label with the new name
  }
  
  // Add LED strips along rack edges for that 80s aesthetic
  addRackLEDs(rackMesh) {
    // LED colors with 80s palette
    const ledColors = [
      0xff00ff, // Magenta
      0x00ffff, // Cyan
      0xffff00, // Yellow
      0xff0000  // Red
    ];
    
    // Make LED strips thinner and fully contained within rack edges
    // Horizontal LED strips for top edges
    const ledThickness = 0.03; // Thinner LEDs
    const ledGeometry = new THREE.BoxGeometry(ledThickness, ledThickness, this.rackDepth * 0.93);
    
    // Top front edge - slightly inset from the edge
    const ledMaterial1 = new THREE.MeshBasicMaterial({ 
      color: ledColors[0],
      transparent: true,
      opacity: 0.9
    });
    const ledStrip1 = new THREE.Mesh(ledGeometry, ledMaterial1);
    ledStrip1.position.set(-this.rackWidth * 0.47 + 0.01, this.rackHeight * 0.25 * 0.5 - 0.01, -this.rackDepth * 0.46);
    ledStrip1.userData = { 
      type: 'led',
      blinkRate: 0.5 + Math.random() * 2,
      colorIndex: 0
    };
    rackMesh.add(ledStrip1);
    
    // Top back edge - slightly inset from the edge
    const ledMaterial2 = new THREE.MeshBasicMaterial({ 
      color: ledColors[1],
      transparent: true,
      opacity: 0.9
    });
    const ledStrip2 = new THREE.Mesh(ledGeometry, ledMaterial2);
    ledStrip2.position.set(this.rackWidth * 0.47 - 0.01, this.rackHeight * 0.25 * 0.5 - 0.01, -this.rackDepth * 0.46);
    ledStrip2.userData = { 
      type: 'led',
      blinkRate: 0.5 + Math.random() * 2,
      colorIndex: 1
    };
    rackMesh.add(ledStrip2);
    
    // Add vertical LED strips on front corners - slightly shorter than rack height
    const verticalLedGeometry = new THREE.BoxGeometry(ledThickness, this.rackHeight * 0.24, ledThickness);
    
    // Front left corner - slightly inset from corner
    const ledMaterial3 = new THREE.MeshBasicMaterial({ 
      color: ledColors[2],
      transparent: true, 
      opacity: 0.9
    });
    const ledStrip3 = new THREE.Mesh(verticalLedGeometry, ledMaterial3);
    ledStrip3.position.set(-this.rackWidth * 0.47 + 0.01, 0, -this.rackDepth * 0.47 + 0.01);
    ledStrip3.userData = { 
      type: 'led',
      blinkRate: 0.5 + Math.random() * 2,
      colorIndex: 2
    };
    rackMesh.add(ledStrip3);
    
    // Front right corner - slightly inset from corner
    const ledMaterial4 = new THREE.MeshBasicMaterial({ 
      color: ledColors[3],
      transparent: true,
      opacity: 0.9
    });
    const ledStrip4 = new THREE.Mesh(verticalLedGeometry, ledMaterial4);
    ledStrip4.position.set(this.rackWidth * 0.47 - 0.01, 0, -this.rackDepth * 0.47 + 0.01);
    ledStrip4.userData = { 
      type: 'led',
      blinkRate: 0.5 + Math.random() * 2,
      colorIndex: 3
    };
    rackMesh.add(ledStrip4);
    
    // Store reference to LEDs for animation
    this.ledStrips = [ledStrip1, ledStrip2, ledStrip3, ledStrip4];
    this.ledColors = ledColors;
    
    // Start animation
    this.animateLEDs();
  }
  
  // Add blinking status lights to top of rack
  addRackStatusLights(rackMesh) {
    // Create a row of blinking lights on top of the rack - very 80s computer look
    const numLights = 5;
    const statusLights = [];
    const lightColors = [0xff0000, 0x00ff00, 0xffff00, 0x00ffff, 0xff00ff]; // Red, green, yellow, cyan, magenta
    
    // Make lights smaller to keep them within rack boundaries
    const lightSize = 0.04; // Smaller size
    const spacing = this.rackWidth * 0.7 / numLights;
    const startX = -this.rackWidth * 0.35 + (spacing / 2);
    
    for (let i = 0; i < numLights; i++) {
      const lightGeometry = new THREE.CircleGeometry(lightSize, 16);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[i],
        transparent: true,
        opacity: 0.9
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      
      // Position lights in a row on top of the rack - ensure they're contained within boundaries
      const xPos = startX + (i * spacing);
      // Position slightly below the top edge to prevent clipping
      light.position.set(xPos, this.rackHeight * 0.25 * 0.5 - 0.01, -this.rackDepth * 0.3);
      light.rotation.x = -Math.PI / 2; // Face upward
      
      // Add blink data
      light.userData = {
        blinkRate: 0.2 + Math.random() * 2.0, // Random blink rate
        blinkPhase: Math.random() * Math.PI * 2, // Random phase
        colorIndex: i
      };
      
      rackMesh.add(light);
      statusLights.push(light);
      
      // Add small glow effect beneath each light
      const glowGeometry = new THREE.CircleGeometry(lightSize * 2, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[i],
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = -0.001; // Slightly below the LED
      light.add(glow);
    }
    
    this.statusLights = statusLights;
    
    // Start animation for the status lights
    this.animateStatusLights();
  }
  
  // Animate the LED strips
  animateLEDs() {
    if (!this.ledStrips || this.ledStrips.length === 0) return;
    
    const animateLed = () => {
      if (!this.ledStrips) return; // Safety check
      
      const time = Date.now() * 0.001; // Current time in seconds
      
      // Update each LED strip
      this.ledStrips.forEach((led, index) => {
        // Skip if led has been removed
        if (!led || !led.material) return;
        
        // Create blinking effect with unique rate
        const blinkRate = led.userData.blinkRate;
        const intensity = 0.7 + 0.3 * Math.sin(time * blinkRate);
        
        // Update opacity for blink effect
        led.material.opacity = intensity;
        
        // Occasionally change color for visual interest
        if (Math.random() < 0.005) { // 0.5% chance to change color each frame
          const newColorIndex = (led.userData.colorIndex + 1) % this.ledColors.length;
          led.material.color.setHex(this.ledColors[newColorIndex]);
          led.userData.colorIndex = newColorIndex;
        }
      });
      
      // Request next animation frame
      requestAnimationFrame(animateLed);
    };
    
    // Start the animation
    animateLed();
  }
  
  // Animate the status lights
  animateStatusLights() {
    if (!this.statusLights || this.statusLights.length === 0) return;
    
    const animateLight = () => {
      if (!this.statusLights) return; // Safety check
      
      const time = Date.now() * 0.001; // Current time in seconds
      
      // Update each status light
      this.statusLights.forEach(light => {
        // Skip if light has been removed
        if (!light || !light.material) return;
        
        // Get light parameters
        const blinkRate = light.userData.blinkRate;
        const blinkPhase = light.userData.blinkPhase;
        
        // Different patterns for different lights
        let intensity;
        
        if (Math.random() < 0.03) { // 3% chance for a random flash
          intensity = Math.random() > 0.5 ? 1.0 : 0.3;
        } else {
          // Normal pattern - digital-looking on/off pattern
          intensity = Math.sin(time * blinkRate + blinkPhase) > 0 ? 0.9 : 0.2;
        }
        
        // Update opacity for blink effect
        light.material.opacity = intensity;
      });
      
      // Request next animation frame
      requestAnimationFrame(animateLight);
    };
    
    // Start the animation
    animateLight();
  }
}