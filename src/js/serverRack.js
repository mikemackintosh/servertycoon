import * as THREE from 'three';
import { Server } from './server.js';

export class ServerRack {
  constructor(game) {
    this.game = game;
    this.container = new THREE.Group();
    this.rackHeight = 42; // 42U rack
    this.servers = [];
    this.rackWidth = 2;
    this.rackDepth = 3;
    this.rackHeightUnits = 42; // 42U standard rack
  }

  init() {
    this.createRackStructure();
    
    // Add a couple of sample servers
    this.addServer(2, 2); // 2U server at position 2
    this.addServer(10, 1); // 1U server at position 10
    this.addServer(20, 4); // 4U server at position 20
  }

  createRackStructure() {
    // Create rack body
    const rackGeometry = new THREE.BoxGeometry(this.rackWidth, this.rackHeight * 0.25, this.rackDepth);
    const rackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333, // Dark gray
      roughness: 0.7,
      metalness: 0.5
    });
    
    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.y = this.rackHeight * 0.125; // Half height
    rack.castShadow = true;
    rack.receiveShadow = true;
    rack.userData = { type: 'rack' };
    
    this.container.add(rack);
    
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
  
  addServer(position, unitSize) {
    // Check if position is valid and not already occupied
    if (position < 0 || position + unitSize > this.rackHeightUnits) {
      console.error("Invalid server position or size");
      return null;
    }
    
    // Check for conflicts with existing servers
    const conflict = this.servers.some(server => {
      const serverPos = server.position;
      const serverSize = server.unitSize;
      return (
        (position >= serverPos && position < serverPos + serverSize) ||
        (position + unitSize > serverPos && position + unitSize <= serverPos + serverSize) ||
        (position <= serverPos && position + unitSize >= serverPos + serverSize)
      );
    });
    
    if (conflict) {
      console.error("Server position conflicts with an existing server");
      return null;
    }
    
    // Create and add the server
    const server = new Server(this.game, unitSize);
    server.position = position;
    server.init();
    
    // Position server within rack
    const yPos = (position / this.rackHeightUnits) * this.rackHeight * 0.25;
    server.container.position.set(0, yPos, 0);
    
    this.servers.push(server);
    this.container.add(server.container);
    
    return server;
  }
  
  removeServer(serverId) {
    const serverIndex = this.servers.findIndex(server => server.id === serverId);
    
    if (serverIndex !== -1) {
      const server = this.servers[serverIndex];
      this.container.remove(server.container);
      this.servers.splice(serverIndex, 1);
    }
  }
  
  showRackDetails() {
    // Method to display detailed rack view UI
    console.log("Rack details:", {
      totalServers: this.servers.length,
      usedUnits: this.servers.reduce((total, server) => total + server.unitSize, 0),
      availableUnits: this.rackHeightUnits - this.servers.reduce((total, server) => total + server.unitSize, 0)
    });
  }
}