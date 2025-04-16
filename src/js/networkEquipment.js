import * as THREE from 'three';

// Network equipment types and their characteristics
export const EQUIPMENT_TYPES = {
  SWITCH: {
    name: 'Switch',
    description: 'Connects devices in a local network',
    defaultPorts: 24,
    maxPorts: 48,
    unitSize: 1, // 1U rack unit
    defaultSpeed: 1, // 1 Gbps
    portTypes: ['ethernet', 'sfp', 'sfp+', 'qsfp'],
    capabilities: ['vlan', 'lacp', 'spanning-tree'],
    color: 0x1976D2 // Blue
  },
  ROUTER: {
    name: 'Router',
    description: 'Connects different networks together',
    defaultPorts: 8,
    maxPorts: 24,
    unitSize: 1, // 1U rack unit
    defaultSpeed: 1, // 1 Gbps
    portTypes: ['ethernet', 'sfp', 'console'],
    capabilities: ['routing', 'nat', 'firewall'],
    color: 0xE53935 // Red
  },
  FIREWALL: {
    name: 'Firewall',
    description: 'Monitors and filters network traffic',
    defaultPorts: 8,
    maxPorts: 16,
    unitSize: 1, // 1U rack unit
    defaultSpeed: 10, // 10 Gbps
    portTypes: ['ethernet', 'sfp+', 'console'],
    capabilities: ['stateful-inspection', 'ids', 'vpn'],
    color: 0xFF9800 // Orange
  },
  PATCH_PANEL: {
    name: 'Patch Panel',
    description: 'Organizes network cables',
    defaultPorts: 24,
    maxPorts: 48,
    unitSize: 1, // 1U rack unit
    defaultSpeed: 0, // Passive
    portTypes: ['ethernet', 'fiber'],
    capabilities: [],
    color: 0x212121 // Dark gray
  },
  LOAD_BALANCER: {
    name: 'Load Balancer',
    description: 'Distributes network traffic across servers',
    defaultPorts: 8,
    maxPorts: 16,
    unitSize: 1, // 1U rack unit
    defaultSpeed: 10, // 10 Gbps
    portTypes: ['ethernet', 'sfp+'],
    capabilities: ['http', 'tcp', 'ssl-termination'],
    color: 0x7B1FA2 // Purple
  }
};

// Port types and their characteristics
export const PORT_TYPES = {
  ethernet: {
    name: 'Ethernet',
    speeds: [0.1, 1, 2.5, 5, 10], // Gbps
    connector: 'RJ45',
    color: 0x4CAF50 // Green
  },
  sfp: {
    name: 'SFP',
    speeds: [1], // Gbps
    connector: 'LC',
    color: 0xFFC107 // Yellow
  },
  'sfp+': {
    name: 'SFP+',
    speeds: [10], // Gbps
    connector: 'LC',
    color: 0x03A9F4 // Light blue
  },
  qsfp: {
    name: 'QSFP+',
    speeds: [40], // Gbps
    connector: 'MPO',
    color: 0x9C27B0 // Purple
  },
  fiber: {
    name: 'Fiber',
    speeds: [1, 10, 40, 100], // Gbps
    connector: 'LC/SC',
    color: 0xF44336 // Red
  },
  console: {
    name: 'Console',
    speeds: [0.01], // Serial
    connector: 'RJ45/DB9',
    color: 0x607D8B // Blue gray
  },
  FIBER_MULTIMODE: {
    name: 'Multimode Fiber',
    speeds: [1, 10, 40, 100], // Gbps
    connector: 'LC',
    color: 0xF44336 // Red
  }
};

// VLAN settings
export const VLAN_TYPES = {
  DATA: {
    name: 'Data',
    defaultId: 10,
    color: 0x2196F3 // Blue
  },
  VOICE: {
    name: 'Voice',
    defaultId: 20,
    color: 0x4CAF50 // Green
  },
  MANAGEMENT: {
    name: 'Management',
    defaultId: 30,
    color: 0xFF9800 // Orange
  },
  STORAGE: {
    name: 'Storage',
    defaultId: 40,
    color: 0x673AB7 // Deep purple
  },
  GUEST: {
    name: 'Guest',
    defaultId: 50,
    color: 0x9E9E9E // Gray
  }
};

// Cable types
export const CABLE_TYPES = {
  COPPER: {
    name: 'Copper',
    maxLength: 100, // meters
    speeds: [0.01, 0.1, 1, 2.5, 5, 10], // Gbps
    color: 0xE0A30B // Yellow-orange
  },
  FIBER_MULTIMODE: {
    name: 'Multimode Fiber',
    maxLength: 500, // meters
    speeds: [1, 10, 40, 100], // Gbps
    color: 0xF44336 // Red
  },
  FIBER_SINGLEMODE: {
    name: 'Singlemode Fiber',
    maxLength: 10000, // meters
    speeds: [1, 10, 40, 100], // Gbps
    color: 0xFFEB3B // Yellow
  },
  CONSOLE: {
    name: 'Console',
    maxLength: 15, // meters
    speeds: [0.01], // Serial
    color: 0x795548 // Brown
  }
};

export class NetworkEquipment {
  constructor(game, type, options = {}) {
    this.game = game;
    this.id = Math.random().toString(36).substr(2, 9);
    this.container = new THREE.Group();
    
    this.type = type;
    this.specs = EQUIPMENT_TYPES[type];
    
    // Equipment properties
    this.unitSize = options.unitSize || this.specs.unitSize;
    this.position = 0; // Position in rack (set when added to rack)
    this.name = options.name || `${this.specs.name} ${this.id.substring(0, 4)}`;
    this.powered = true; // Power status
    this.connected = false; // Network status
    
    // Port configuration
    this.numPorts = options.numPorts || this.specs.defaultPorts;
    this.portType = options.portType || this.specs.portTypes[0];
    this.portSpeed = options.portSpeed || this.specs.defaultSpeed;
    
    // Create ports array with metadata
    this.ports = [];
    for (let i = 0; i < this.numPorts; i++) {
      this.ports.push({
        id: i + 1,
        type: this.portType,
        speed: this.portSpeed,
        connected: false,
        connection: null,
        vlan: null,
        status: 'down',
        label: `${i + 1}`
      });
    }
    
    // VLAN configuration (if supported)
    this.vlans = {};
    if (this.specs.capabilities.includes('vlan')) {
      // Create default VLANs
      this.vlans[VLAN_TYPES.DATA.defaultId] = {
        name: VLAN_TYPES.DATA.name,
        ports: []
      };
    }
    
    // Equipment status
    this.powerConsumption = options.powerConsumption || 50; // Watts
    this.temperature = 30; // Celsius
    this.utilization = 0; // 0-100%
    this.status = 'off'; // off, on, error
    
    // Visual properties for 3D rendering
    this.meshes = {
      body: null,
      ports: []
    };
  }
  
  init() {
    this.createEquipmentHardware();
  }
  
  createEquipmentHardware() {
    // Calculate height based on U size
    const height = this.unitSize * 0.25 * (1/42); // Scale based on rack height
    
    // Create equipment chassis
    const equipmentGeometry = new THREE.BoxGeometry(1.8, height, 2.8);
    const equipmentMaterial = new THREE.MeshStandardMaterial({ 
      color: this.specs.color,
      roughness: 0.6,
      metalness: 0.7
    });
    
    const equipmentBody = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
    equipmentBody.castShadow = true;
    equipmentBody.receiveShadow = true;
    equipmentBody.userData = { 
      type: 'network',
      equipmentType: this.type,
      id: this.id
    };
    
    this.meshes.body = equipmentBody;
    this.container.add(equipmentBody);
    
    // Add equipment front details (ports)
    const portSize = Math.min(0.07, 1.7 / this.numPorts); // Calculate port size based on number of ports
    const portSpacing = 1.7 / this.numPorts;
    const portY = 0;
    const portZ = -1.41; // Front of the device
    
    const portGeometry = new THREE.BoxGeometry(portSize, portSize, 0.05);
    
    for (let i = 0; i < this.numPorts; i++) {
      const port = this.ports[i];
      const portType = PORT_TYPES[port.type];
      
      const portMaterial = new THREE.MeshStandardMaterial({
        color: portType.color,
        roughness: 0.5,
        metalness: 0.3
      });
      
      const portMesh = new THREE.Mesh(portGeometry, portMaterial);
      
      // Position port along the front
      const portX = -0.85 + (i * portSpacing);
      portMesh.position.set(portX, portY, portZ);
      
      portMesh.userData = {
        type: 'port',
        portId: port.id,
        equipmentId: this.id
      };
      
      this.meshes.ports.push(portMesh);
      this.container.add(portMesh);
    }
    
    // Add status LED
    this.addLED(0.8, 0, -1.42, 0x00FF00);
    
    // Add small label with the equipment name
    const nameLabel = document.createElement('div');
    nameLabel.className = 'equipment-label';
    nameLabel.textContent = this.name;
    nameLabel.style.position = 'absolute';
    nameLabel.style.color = 'white';
    nameLabel.style.fontSize = '12px';
    
    // Note: In a real implementation, you would need to use CSS2DRenderer
    // from Three.js to properly display HTML elements in 3D space
  }
  
  addLED(x, y, z, color) {
    const ledGeometry = new THREE.CircleGeometry(0.05, 16);
    const ledMaterial = new THREE.MeshBasicMaterial({ color: color });
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(x, y, z);
    this.container.add(led);
    return led;
  }
  
  // Method to connect a cable between ports
  connectCable(portId, targetEquipment, targetPortId, cableType = 'COPPER') {
    if (portId < 1 || portId > this.ports.length) {
      console.error('Invalid port ID');
      return false;
    }
    
    const port = this.ports[portId - 1];
    if (port.connected) {
      console.error('Port already connected');
      return false;
    }
    
    const targetPort = targetEquipment.ports[targetPortId - 1];
    if (targetPort.connected) {
      console.error('Target port already connected');
      return false;
    }
    
    // Check compatibility
    if (!this.arePortsCompatible(port, targetPort)) {
      console.error('Ports are not compatible');
      return false;
    }
    
    // Create the connection on both ends
    const cable = {
      type: cableType,
      specs: CABLE_TYPES[cableType],
      sourceEquipment: this.id,
      sourcePort: portId,
      targetEquipment: targetEquipment.id,
      targetPort: targetPortId
    };
    
    // Update port status
    port.connected = true;
    port.connection = {
      equipmentId: targetEquipment.id,
      portId: targetPortId,
      cable: cable
    };
    port.status = 'up';
    
    targetPort.connected = true;
    targetPort.connection = {
      equipmentId: this.id,
      portId: portId,
      cable: cable
    };
    targetPort.status = 'up';
    
    return true;
  }
  
  // Method to disconnect a cable
  disconnectCable(portId) {
    if (portId < 1 || portId > this.ports.length) {
      console.error('Invalid port ID');
      return false;
    }
    
    const port = this.ports[portId - 1];
    if (!port.connected || !port.connection) {
      console.error('Port not connected');
      return false;
    }
    
    // Find the connected equipment and port
    const connectedEquipment = this.game.findEquipmentById(port.connection.equipmentId);
    if (connectedEquipment) {
      const connectedPort = connectedEquipment.ports[port.connection.portId - 1];
      connectedPort.connected = false;
      connectedPort.connection = null;
      connectedPort.status = 'down';
    }
    
    // Update this port
    port.connected = false;
    port.connection = null;
    port.status = 'down';
    
    return true;
  }
  
  // Check if two ports are compatible for connection
  arePortsCompatible(port1, port2) {
    // Check port types
    const type1 = PORT_TYPES[port1.type];
    const type2 = PORT_TYPES[port2.type];
    
    // Some basic compatibility rules
    if (port1.type === 'ethernet' && port2.type === 'ethernet') {
      return true; // Ethernet to Ethernet is always compatible
    }
    
    if ((port1.type === 'sfp' || port1.type === 'sfp+') && 
        (port2.type === 'sfp' || port2.type === 'sfp+')) {
      return true; // SFP/SFP+ compatibilities
    }
    
    if (port1.type === 'fiber' && port2.type === 'fiber') {
      return true; // Fiber to Fiber
    }
    
    if (port1.type === 'console' && port2.type === 'console') {
      return true; // Console to Console
    }
    
    return false; // Not compatible
  }
  
  // VLAN management
  createVlan(vlanId, name) {
    if (!this.specs.capabilities.includes('vlan')) {
      console.error('This equipment does not support VLANs');
      return false;
    }
    
    if (this.vlans[vlanId]) {
      console.error('VLAN ID already exists');
      return false;
    }
    
    this.vlans[vlanId] = {
      name: name,
      ports: []
    };
    
    return true;
  }
  
  addPortToVlan(portId, vlanId) {
    if (!this.specs.capabilities.includes('vlan')) {
      console.error('This equipment does not support VLANs');
      return false;
    }
    
    if (!this.vlans[vlanId]) {
      console.error('VLAN ID does not exist');
      return false;
    }
    
    if (portId < 1 || portId > this.ports.length) {
      console.error('Invalid port ID');
      return false;
    }
    
    const port = this.ports[portId - 1];
    
    // Remove from any existing VLAN
    this.removePortFromAllVlans(portId);
    
    // Add to new VLAN
    this.vlans[vlanId].ports.push(portId);
    port.vlan = vlanId;
    
    return true;
  }
  
  removePortFromAllVlans(portId) {
    for (const vlanId in this.vlans) {
      const vlan = this.vlans[vlanId];
      const index = vlan.ports.indexOf(portId);
      if (index !== -1) {
        vlan.ports.splice(index, 1);
      }
    }
    
    const port = this.ports[portId - 1];
    if (port) {
      port.vlan = null;
    }
  }
  
  // Update equipment status
  update(deltaTime) {
    // Calculate utilization based on port usage
    let activeConnections = 0;
    this.ports.forEach(port => {
      if (port.status === 'up') {
        activeConnections++;
      }
    });
    
    const baseUtilization = Math.min(100, (activeConnections / this.ports.length) * 100);
    // Add some randomness to make it more realistic
    this.utilization = Math.min(100, Math.max(0, baseUtilization + (Math.random() - 0.5) * 10));
    
    // Update temperature based on utilization
    const targetTemp = 30 + (this.utilization / 100) * 20; // 30°C idle, up to 50°C at full load
    this.temperature += (targetTemp - this.temperature) * 0.1;
    
    // Update status based on temperature and utilization
    if (this.temperature > 70) {
      this.status = 'error';
    } else if (this.utilization > 0) {
      this.status = 'on';
    } else {
      this.status = 'on'; // Always on once added to rack
    }
  }
  
  // Get equipment details for UI
  getDetails() {
    return {
      id: this.id,
      name: this.name,
      type: this.specs.name,
      unitSize: this.unitSize,
      ports: this.ports.length,
      activeConnections: this.ports.filter(p => p.status === 'up').length,
      vlans: Object.keys(this.vlans).length,
      temperature: this.temperature.toFixed(1),
      utilization: this.utilization.toFixed(1),
      status: this.status,
      powerConsumption: this.powerConsumption
    };
  }
}