import * as THREE from 'three';
import { ServerRack } from './serverRack.js';

export class Datacenter {
  constructor(game) {
    this.game = game;
    this.container = new THREE.Group();
    this.gridSize = { width: 10, height: 10 };
    this.cellSize = 5;
    this.racks = [];
    this.funds = 10000; // Starting money
  }

  init() {
    this.createGround();
    this.createBuilding();
    this.createGrid();
    
    // Add a couple of initial racks for demonstration
    this.addRack(2, 2);
    this.addRack(5, 3);
  }

  createGround() {
    // Create green grass base
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4CAF50, // Green grass
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.container.add(ground);
  }

  createBuilding() {
    // Create datacenter building floor
    const buildingWidth = this.gridSize.width * this.cellSize;
    const buildingHeight = this.gridSize.height * this.cellSize;
    
    const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.5, buildingHeight);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xCCCCCC, // Gray floor
      roughness: 0.7,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.container.add(floor);
    
    // Simple walls (optional)
    const wallHeight = 3;
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xF5F5F5,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    // North wall
    const northWallGeometry = new THREE.BoxGeometry(buildingWidth, wallHeight, 0.2);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight/2, -buildingHeight/2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.container.add(northWall);
    
    // East wall
    const eastWallGeometry = new THREE.BoxGeometry(0.2, wallHeight, buildingHeight);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(buildingWidth/2, wallHeight/2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.container.add(eastWall);
    
    // South wall
    const southWallGeometry = new THREE.BoxGeometry(buildingWidth, wallHeight, 0.2);
    const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight/2, buildingHeight/2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.container.add(southWall);
    
    // West wall
    const westWallGeometry = new THREE.BoxGeometry(0.2, wallHeight, buildingHeight);
    const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-buildingWidth/2, wallHeight/2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.container.add(westWall);
  }

  createGrid() {
    const grid = new THREE.Group();
    const lineColor = 0x000000;
    const lineOpacity = 0.2;
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      transparent: true, 
      opacity: lineOpacity 
    });
    
    // Create grid lines
    for (let i = 0; i <= this.gridSize.width; i++) {
      const x = (i * this.cellSize) - (this.gridSize.width * this.cellSize / 2);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.01, -this.gridSize.height * this.cellSize / 2),
        new THREE.Vector3(x, 0.01, this.gridSize.height * this.cellSize / 2)
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      grid.add(line);
    }
    
    for (let j = 0; j <= this.gridSize.height; j++) {
      const z = (j * this.cellSize) - (this.gridSize.height * this.cellSize / 2);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-this.gridSize.width * this.cellSize / 2, 0.01, z),
        new THREE.Vector3(this.gridSize.width * this.cellSize / 2, 0.01, z)
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      grid.add(line);
    }
    
    this.container.add(grid);
  }
  
  addRack(gridX, gridZ) {
    const posX = (gridX * this.cellSize) - (this.gridSize.width * this.cellSize / 2) + (this.cellSize / 2);
    const posZ = (gridZ * this.cellSize) - (this.gridSize.height * this.cellSize / 2) + (this.cellSize / 2);
    
    const rack = new ServerRack(this.game);
    rack.init();
    rack.container.position.set(posX, 0, posZ);
    
    // Store grid position in userData
    rack.container.userData = {
      type: 'rack',
      gridX: gridX,
      gridZ: gridZ
    };
    
    this.racks.push(rack);
    this.container.add(rack.container);
    
    return rack;
  }
  
  removeRack(gridX, gridZ) {
    const rackIndex = this.racks.findIndex(rack => 
      rack.container.userData.gridX === gridX && 
      rack.container.userData.gridZ === gridZ
    );
    
    if (rackIndex !== -1) {
      const rack = this.racks[rackIndex];
      this.container.remove(rack.container);
      this.racks.splice(rackIndex, 1);
    }
  }
  
  updateFunds(amount) {
    this.funds += amount;
    console.log(`Funds updated: $${this.funds}`);
    // Update UI with new fund amount
  }
}