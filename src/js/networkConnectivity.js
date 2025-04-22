import * as THREE from 'three';
import { EQUIPMENT_TYPES, PORT_TYPES, NetworkEquipment } from './networkEquipment.js';

// Circuit types and their characteristics
export const CIRCUIT_TYPES = {
  INTERNET_1G: {
    name: '1G Internet Circuit',
    speed: 1, // Gbps
    cost: 500, // $ per month
    color: 0x4CAF50, // Green
    maxConnections: 20
  },
  INTERNET_10G: {
    name: '10G Internet Circuit',
    speed: 10, // Gbps
    cost: 2000, // $ per month
    color: 0x2196F3, // Blue
    maxConnections: 100
  },
  INTERNET_100G: {
    name: '100G Internet Circuit',
    speed: 100, // Gbps
    cost: 15000, // $ per month
    color: 0xE91E63, // Pink
    maxConnections: 500
  },
  MPLS_10G: {
    name: '10G MPLS Circuit',
    speed: 10, // Gbps
    cost: 3000, // $ per month
    color: 0xFF9800, // Orange
    maxConnections: 150
  },
  DARK_FIBER_100G: {
    name: '100G Dark Fiber',
    speed: 100, // Gbps
    cost: 10000, // $ per month
    color: 0x9C27B0, // Purple
    maxConnections: 1000
  }
};

export class Circuit {
  constructor(type = 'INTERNET_10G') {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.specs = CIRCUIT_TYPES[type];
    this.name = this.specs.name;
    this.speed = this.specs.speed;
    this.cost = this.specs.cost;
    this.monthlyCost = this.specs.cost; // Set for easier access
    this.maxConnections = this.specs.maxConnections;
    this.connections = [];
    this.utilization = 0;
    this.mesh = null;
    
    // Setup IP range (for simulation)
    this.ipRange = {
      base: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      gateway: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`,
      assignedIps: {}
    };
  }
  
  addConnection(equipmentId, portId) {
    if (this.connections.length >= this.maxConnections) {
      console.error('Circuit has reached maximum connection limit');
      return false;
    }
    
    this.connections.push({
      equipmentId: equipmentId,
      portId: portId,
      connected: true,
      timestamp: new Date()
    });
    
    return true;
  }
  
  removeConnection(equipmentId, portId) {
    const connectionIndex = this.connections.findIndex(
      c => c.equipmentId === equipmentId && c.portId === portId
    );
    
    if (connectionIndex !== -1) {
      this.connections.splice(connectionIndex, 1);
      
      // Remove IP allocation
      if (this.ipRange.assignedIps[equipmentId]) {
        delete this.ipRange.assignedIps[equipmentId];
      }
      
      return true;
    }
    
    return false;
  }
  
  allocateIp(equipmentId, equipmentName) {
    // If already allocated, return that IP
    if (this.ipRange.assignedIps[equipmentId]) {
      return this.ipRange.assignedIps[equipmentId];
    }
    
    // Generate a new IP in the range (simple simulation)
    const ipIndex = Object.keys(this.ipRange.assignedIps).length + 2; // start at .2
    if (ipIndex > 254) {
      console.error('No more IPs available in range');
      return null;
    }
    
    const ipAddress = `${this.ipRange.base}.${ipIndex}`;
    this.ipRange.assignedIps[equipmentId] = ipAddress;
    
    console.log(`Allocated IP ${ipAddress} to ${equipmentName}`);
    return ipAddress;
  }
  
  update(delta) {
    // Simulate utilization changes
    if (delta) {
      // Add some random variance to utilization (+/- 0.5% per second)
      this.utilization = Math.max(0, Math.min(1, 
        this.utilization + (Math.random() * 0.01 - 0.005) * delta
      ));
    }
    
    return {
      utilization: this.utilization,
      cost: this.cost * delta / (30 * 24 * 60 * 60) // Pro-rate cost for the time period
    };
  }
}

export class EgressRouter {
  constructor(game, position) {
    this.game = game;
    this.container = new THREE.Group();
    this.position = position;
    this.circuits = [];
    this.id = Math.random().toString(36).substr(2, 9);
    this.equipment = null;
  }
  
  init() {
    // Create visual representation of egress router cabinet
    this.createCabinet();
    
    // Create the router equipment
    this.equipment = new NetworkEquipment(this.game, 'ROUTER', {
      name: 'Egress Router',
      portCount: 24,
      portType: 'FIBER_MULTIMODE'
    });
    this.equipment.init();
    
    // Add 2 default circuits
    this.addCircuit('INTERNET_1G');
    
    // Position at the specified location
    this.container.position.set(this.position.x, this.position.y, this.position.z);
    
    // Set the connectionTile position to be relative to our position
    if (this.connectionTile) {
      this.connectionTile.position.copy(this.container.position);
      console.log("Updated connection tile position:", this.connectionTile.position);
    }
  }
  
  createCabinet() {
    // Create a cabinet geometry
    const cabinetGeometry = new THREE.BoxGeometry(3, 10, 3.5);
    const cabinetMaterial = new THREE.MeshStandardMaterial({
      color: 0x212121, // Dark gray
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    this.cabinet.position.y = 5; // Half-height to place it on the ground
    this.cabinet.castShadow = true;
    this.cabinet.receiveShadow = true;
    
    // Add userData for interaction
    this.cabinet.userData = {
      type: 'egressCabinet',
      id: this.id,
      name: 'Egress Router Cabinet',
      movable: false,
      isEgressRouter: true, // Extra flag to make it more identifiable
      interactive: true // Mark as interactive for click handling
    };
    
    // Set userData on container as well for consistent detection
    this.container.userData = {
      type: 'egressCabinet',
      id: this.id,
      name: 'Egress Router Cabinet',
      movable: false,
      isEgressRouter: true,
      interactive: true
    };
    
    // Add label
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide
    });
    
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 11, 1.76); // Top front of cabinet
    label.rotation.x = Math.PI / 2;
    
    // Add blue tile on the ground as connection destination
    this.createConnectionTile();
    
    this.container.add(this.cabinet);
    this.container.add(label);
  }
  
  // Create a blue tile on the ground as connection destination
  createConnectionTile() {
    // Create a group for the connection tile
    this.connectionTile = new THREE.Group();
    
    // Create a blue glowing tile that sits on the grid - make it more visible
    const tileSize = 2; // Same size as a grid cell
    const tileGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize); // Increase height
    const tileMaterial = new THREE.MeshStandardMaterial({
      color: 0x00a0ff, // Brighter blue
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 1.0, // Full opacity
      emissive: 0x0078d7,
      emissiveIntensity: 0.8 // Stronger glow
    });
    
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    // Position the tile on the server room floor
    // Adjust x-position to be closer to the server room area
    tile.position.set(0, 0.15, 3.5); 
    tile.castShadow = false;
    tile.receiveShadow = true;
    
    // Add a clearer "CONNECT HERE" label on the tile
    const labelGeometry = new THREE.PlaneGeometry(1.8, 0.4);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White text
      transparent: false, // Solid
      side: THREE.DoubleSide
    });
    
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 0.06, 0); // Higher above the tile
    label.rotation.x = -Math.PI / 2; // Lay flat on top of tile
    tile.add(label);
    
    // Add a border around the tile for better visibility
    const borderSize = tileSize + 0.1;
    const borderGeometry = new THREE.BoxGeometry(borderSize, 0.05, borderSize);
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White border
      transparent: true,
      opacity: 0.8
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(0, -0.02, 0); // Slightly below the tile
    tile.add(border);
    
    // Add vertical beams of light for extra visibility
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.5, 5, 16);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00a0ff,
      transparent: true,
      opacity: 0.3
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 2.5, 0); // Position above the tile
    tile.add(beam);
    
    // Add circular pulse effect on the ground
    const pulseGeometry = new THREE.CircleGeometry(tileSize, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0x00a0ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.rotation.x = -Math.PI / 2; // Lay flat
    pulse.position.set(0, 0.01, 0); // Just above the ground
    tile.add(pulse);
    
    // Store references for animation
    tile.userData = {
      type: 'connectionTile',
      id: this.id + '-tile',
      isConnectionPoint: true,
      interactive: true,
      pulse: pulse,
      beam: beam
    };
    
    // Add pulse animation for the tile
    this.animateConnectionTile(tile);
    
    // Add to the container
    this.connectionTile.add(tile);
    
    // Add the connection tile directly to the scene to ensure it's visible
    // This bypasses any potential issues with parent container visibility
    if (this.game && this.game.scene) {
      this.game.scene.add(this.connectionTile);
    } else {
      this.container.add(this.connectionTile);
    }
    
    // Log that we created the tile
    console.log("Created connection tile:", this.connectionTile);
  }
  
  // Animate the connection tile with a more dramatic pulse effect
  animateConnectionTile(tile) {
    const animate = () => {
      if (!this.connectionTile) return;
      
      const time = Date.now() * 0.001; // Current time in seconds
      
      // Dramatic pulsing effect
      const pulseFactor = 0.5 + 0.5 * Math.sin(time * 1.5);
      const fastPulse = 0.5 + 0.5 * Math.sin(time * 3);
      
      // Update tile emissive intensity and opacity
      if (tile.material) {
        tile.material.emissiveIntensity = 0.5 + 0.5 * pulseFactor;
        tile.material.opacity = 0.8 + 0.2 * pulseFactor;
      }
      
      // Animate the pulse circle
      if (tile.userData.pulse && tile.userData.pulse.material) {
        // Scale the pulse circle in and out
        const scaleVal = 1.0 + 0.5 * pulseFactor;
        tile.userData.pulse.scale.set(scaleVal, scaleVal, 1);
        
        // Adjust opacity for fade in/out effect
        tile.userData.pulse.material.opacity = 0.7 - 0.5 * pulseFactor;
      }
      
      // Animate the light beam
      if (tile.userData.beam && tile.userData.beam.material) {
        // Make the beam flicker slightly
        tile.userData.beam.material.opacity = 0.2 + 0.2 * fastPulse;
        
        // Gently sway the beam
        const swayX = Math.sin(time * 0.5) * 0.05;
        const swayZ = Math.cos(time * 0.7) * 0.05;
        tile.userData.beam.position.x = swayX;
        tile.userData.beam.position.z = swayZ;
      }
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
  }
  
  addCircuit(circuitType) {
    const circuit = new Circuit(circuitType);
    console.log('Adding circuit:', circuit); // Debug log
    
    // Create a visual representation of the circuit
    const circuitGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const circuitMaterial = new THREE.MeshStandardMaterial({
      color: circuit.specs.color,
      roughness: 0.3,
      metalness: 0.7
    });
    
    circuit.mesh = new THREE.Mesh(circuitGeometry, circuitMaterial);
    circuit.mesh.rotation.x = Math.PI / 2;
    circuit.mesh.position.set(0, 10, 2); // Top of cabinet
    circuit.mesh.userData = {
      type: 'circuit',
      id: circuit.id,
      name: circuit.name,
      circuitId: circuit.id // Duplicate to ensure it's found
    };
    
    this.container.add(circuit.mesh);
    this.circuits.push(circuit);
    
    return circuit;
  }
  
  removeCircuit(circuitId) {
    const circuitIndex = this.circuits.findIndex(circuit => circuit.id === circuitId);
    
    if (circuitIndex !== -1) {
      const circuit = this.circuits[circuitIndex];
      
      // Remove the mesh from scene
      if (circuit.mesh) {
        this.container.remove(circuit.mesh);
        circuit.mesh.geometry.dispose();
        circuit.mesh.material.dispose();
      }
      
      // Remove from circuits array
      this.circuits.splice(circuitIndex, 1);
      return true;
    }
    
    return false;
  }
  
  // Calculate total bandwidth from all circuits in Mbps
  getTotalBandwidth() {
    return this.circuits.reduce((total, circuit) => {
      return total + (circuit.speed * 1000); // Convert Gbps to Mbps
    }, 0);
  }
  
  // Update method for simulation
  update(delta) {
    // Update circuit utilization and costs
    let totalCircuitCost = 0;
    
    for (const circuit of this.circuits) {
      const result = circuit.update(delta);
      totalCircuitCost += result.cost;
    }
    
    return {
      circuitCost: totalCircuitCost
    };
  }
  
  connectRackToCircuit(rack, circuitId, rackEquipmentId, rackPortId) {
    // Find the circuit
    const circuit = this.circuits.find(c => c.id === circuitId);
    if (!circuit) {
      console.error('Circuit not found');
      return false;
    }
    
    // Find equipment in the rack
    const equipment = rack.findEquipmentById(rackEquipmentId);
    if (!equipment || equipment.type !== 'SWITCH') {
      console.error('Valid network equipment not found in rack');
      return false;
    }
    
    // Find an available port on the egress router
    let egressPort = null;
    for (let i = 0; i < this.equipment.ports.length; i++) {
      const port = this.equipment.ports[i];
      if (!port.connected) {
        egressPort = port;
        break;
      }
    }
    
    if (!egressPort) {
      console.error('No available ports on egress router');
      return false;
    }
    
    // Connect port on egress router to rack equipment
    this.equipment.connectCable(egressPort.id, equipment, rackPortId, 'FIBER_MULTIMODE');
    
    // Associate the connection with the circuit
    circuit.addConnection(rackEquipmentId, rackPortId);
    
    // Allocate IP to the rack equipment
    const ipAddress = circuit.allocateIp(rackEquipmentId, equipment.name);
    if (ipAddress) {
      equipment.ipAddress = ipAddress;
      equipment.gateway = circuit.ipRange.gateway;
      equipment.connected = true;
      
      // Propagate connectivity to servers connected to this switch
      this.propagateConnectivity(rack, equipment);
    }
    
    return true;
  }
  
  disconnectRackFromCircuit(rack, circuitId, rackEquipmentId, rackPortId) {
    // Find the circuit
    const circuit = this.circuits.find(c => c.id === circuitId);
    if (!circuit) {
      console.error('Circuit not found');
      return false;
    }
    
    // Find equipment in the rack
    const equipment = rack.findEquipmentById(rackEquipmentId);
    if (!equipment) {
      console.error('Equipment not found in rack');
      return false;
    }
    
    // Find the cable connection
    let egressPortId = null;
    for (const port of this.equipment.ports) {
      if (port.connected && port.connectedTo && 
          port.connectedTo.equipmentId === rackEquipmentId &&
          port.connectedTo.portId === rackPortId) {
        egressPortId = port.id;
        break;
      }
    }
    
    if (!egressPortId) {
      console.error('No connection found between egress router and rack equipment');
      return false;
    }
    
    // Disconnect the cable
    this.equipment.disconnectCable(egressPortId);
    
    // Remove from circuit connections
    circuit.removeConnection(rackEquipmentId, rackPortId);
    
    // Mark equipment as disconnected
    equipment.ipAddress = null;
    equipment.gateway = null;
    equipment.connected = false;
    
    // Propagate disconnectivity to servers
    this.propagateDisconnectivity(rack, equipment);
    
    return true;
  }
  
  propagateConnectivity(rack, networkEquipment) {
    // Check all servers in the rack to see if they're connected to this network equipment
    rack.servers.forEach(server => {
      // Simple model: if any of server's cables connect to this network equipment,
      // the server gets connectivity
      if (server.cables && server.cables.some(cable => 
          cable.toEquipmentId === networkEquipment.id)) {
        server.connected = true;
        server.ipAddress = `${networkEquipment.ipAddress.split('.').slice(0, 3).join('.')}.${100 + Math.floor(Math.random() * 100)}`;
      }
    });
  }
  
  propagateDisconnectivity(rack, networkEquipment) {
    // Mark all servers connected to this equipment as disconnected
    rack.servers.forEach(server => {
      if (server.cables && server.cables.some(cable => 
          cable.toEquipmentId === networkEquipment.id)) {
        server.connected = false;
        server.ipAddress = null;
      }
    });
  }
}