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
    this.status = 'active';
    this.uptime = 100; // Percentage
    this.utilization = 0; // Percentage
    this.connections = [];
    this.ipRange = this.generateIpRange();
    this.mesh = null;
  }
  
  generateIpRange() {
    // Generate a random private IP range
    const firstOctet = 10;
    const secondOctet = Math.floor(Math.random() * 255);
    const thirdOctet = Math.floor(Math.random() * 255);
    
    return {
      network: `${firstOctet}.${secondOctet}.${thirdOctet}.0/24`,
      gateway: `${firstOctet}.${secondOctet}.${thirdOctet}.1`,
      usable: `${firstOctet}.${secondOctet}.${thirdOctet}.2 - ${firstOctet}.${secondOctet}.${thirdOctet}.254`,
      broadcast: `${firstOctet}.${secondOctet}.${thirdOctet}.255`,
      allocatedIps: {}
    };
  }
  
  allocateIp(deviceId, deviceName) {
    // Find the next available IP
    for (let i = 2; i <= 254; i++) {
      const ipAddress = `${this.ipRange.network.split('.')[0]}.${this.ipRange.network.split('.')[1]}.${this.ipRange.network.split('.')[2]}.${i}`;
      
      if (!Object.values(this.ipRange.allocatedIps).includes(ipAddress)) {
        this.ipRange.allocatedIps[deviceId] = {
          ip: ipAddress,
          name: deviceName,
          allocated: new Date().toISOString()
        };
        return ipAddress;
      }
    }
    
    // No IPs available
    return null;
  }
  
  releaseIp(deviceId) {
    if (this.ipRange.allocatedIps[deviceId]) {
      delete this.ipRange.allocatedIps[deviceId];
      return true;
    }
    return false;
  }
  
  addConnection(equipmentId, portId) {
    if (this.connections.length >= this.specs.maxConnections) {
      console.error('Circuit reached maximum connections');
      return false;
    }
    
    this.connections.push({
      equipmentId: equipmentId,
      portId: portId,
      status: 'up',
      ipAddress: null // Will be set when connected to a device
    });
    
    return true;
  }
  
  removeConnection(equipmentId, portId) {
    const index = this.connections.findIndex(
      conn => conn.equipmentId === equipmentId && conn.portId === portId
    );
    
    if (index !== -1) {
      this.connections.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  update(deltaTime) {
    // Simulate random utilization changes based on number of connections
    const baseUtilization = (this.connections.length / this.specs.maxConnections) * 70;
    this.utilization = Math.min(100, Math.max(0, baseUtilization + (Math.random() - 0.5) * 10));
    
    // Very small chance of circuit going down temporarily
    if (Math.random() < 0.0001) {
      this.status = 'down';
      setTimeout(() => {
        this.status = 'active';
      }, Math.random() * 10000 + 5000); // 5-15 seconds downtime
    }
    
    return {
      cost: this.cost * (deltaTime / (30 * 24 * 60 * 60)) // Pro-rated monthly cost for time period
    };
  }
}

export class EgressRouter {
  constructor(game, position = { x: 0, y: 0, z: 0 }) {
    this.game = game;
    this.id = 'egress-router-' + Math.random().toString(36).substr(2, 9);
    this.position = position;
    this.name = 'Datacenter Egress Router';
    this.circuits = [];
    this.equipment = null;
    this.container = new THREE.Group();
    this.cabinet = null;
    this.movable = false; // Egress router cabinet cannot be moved
  }
  
  init() {
    // Create a cabinet for the egress router
    this.createCabinet();
    
    // Create the router equipment
    this.equipment = new NetworkEquipment(this.game, 'ROUTER', {
      name: 'Core Router',
      numPorts: 24,
      portType: 'sfp+',
      portSpeed: 10
    });
    this.equipment.position = 20; // Position in the cabinet
    this.equipment.init();
    
    // Add equipment to cabinet
    this.container.add(this.equipment.container);
    this.equipment.container.position.set(0, this.equipment.position * 0.25 * (1/42), 0);
    
    // No longer add a default circuit - player must purchase it
    // Circuit slots are still available in the egress router
    
    // Position the cabinet at the specified location
    this.container.position.copy(this.position);
  }
  
  createCabinet() {
    // Create cabinet mesh similar to a rack but with different style
    const cabinetGeometry = new THREE.BoxGeometry(2.5, 12, 3.5);
    const cabinetMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    this.cabinet.position.y = 6.25; // Half height off ground + raised floor height
    this.cabinet.castShadow = true;
    this.cabinet.receiveShadow = true;
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
    
    // In a real implementation, you would use TextGeometry or CSS2DRenderer
    // to add text labels. This is just a placeholder.
    
    this.container.add(this.cabinet);
    this.container.add(label);
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
    
    // Find the connection to remove
    const connectionIndex = circuit.connections.findIndex(
      conn => conn.equipmentId === rackEquipmentId && conn.portId === rackPortId
    );
    
    if (connectionIndex === -1) {
      console.error('Connection not found');
      return false;
    }
    
    // Find which port on the egress router is connected to this equipment
    let egressPortId = null;
    for (let i = 0; i < this.equipment.ports.length; i++) {
      const port = this.equipment.ports[i];
      if (port.connected && 
          port.connection && 
          port.connection.equipmentId === rackEquipmentId) {
        egressPortId = port.id;
        break;
      }
    }
    
    if (egressPortId) {
      // Disconnect the cable
      this.equipment.disconnectCable(egressPortId);
    }
    
    // Remove the connection from the circuit
    circuit.removeConnection(rackEquipmentId, rackPortId);
    
    // Release the IP address
    circuit.releaseIp(rackEquipmentId);
    equipment.ipAddress = null;
    equipment.gateway = null;
    equipment.connected = false;
    
    // Propagate disconnection to servers connected to this switch
    this.propagateDisconnectivity(rack, equipment);
    
    return true;
  }
  
  propagateConnectivity(rack, networkEquipment) {
    // Find all servers connected to this network equipment
    for (const server of rack.servers) {
      // Check if the server has a port connected to this network equipment
      let isConnected = false;
      
      if (server.connections) {
        for (const connection of server.connections) {
          if (connection.targetEquipmentId === networkEquipment.id) {
            isConnected = true;
            break;
          }
        }
      }
      
      if (isConnected) {
        // Find a circuit for IP allocation
        if (this.circuits.length > 0) {
          const circuit = this.circuits[0]; // Use the first circuit for now
          const ipAddress = circuit.allocateIp(server.id, `Server ${server.id}`);
          
          if (ipAddress) {
            server.ipAddress = ipAddress;
            server.gateway = circuit.ipRange.gateway;
            server.connected = true;
          }
        }
      }
    }
  }
  
  propagateDisconnectivity(rack, networkEquipment) {
    // Find all servers connected to this network equipment
    for (const server of rack.servers) {
      // Check if the server has a port connected to this network equipment
      let isConnected = false;
      
      if (server.connections) {
        for (const connection of server.connections) {
          if (connection.targetEquipmentId === networkEquipment.id) {
            isConnected = true;
            break;
          }
        }
      }
      
      if (isConnected) {
        // Release IP addresses from all circuits
        for (const circuit of this.circuits) {
          circuit.releaseIp(server.id);
        }
        
        server.ipAddress = null;
        server.gateway = null;
        server.connected = false;
      }
    }
  }
  
  update(deltaTime) {
    // Update circuits
    let totalCircuitCost = 0;
    
    for (const circuit of this.circuits) {
      const result = circuit.update(deltaTime);
      totalCircuitCost += result.cost;
    }
    
    return {
      circuitCost: totalCircuitCost
    };
  }
}