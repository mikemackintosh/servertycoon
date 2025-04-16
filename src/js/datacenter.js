import * as THREE from 'three';
import { ServerRack } from './serverRack.js';
import { EgressRouter } from './networkConnectivity.js';

export class Datacenter {
  constructor(game) {
    this.game = game;
    this.container = new THREE.Group();
    this.gridSize = { width: 20, height: 20 }; // Larger grid to accommodate more racks
    this.cellSize = 2; // 24 inches (2 feet) standard
    this.racks = [];
    this.funds = 1000; // Starting money (reduced to $1000)
    
    // Stats tracking
    this.powerUsage = 0; // in watts
    this.temperature = 22; // in celsius (starting at room temperature)
    this.circuitUtilization = 0; // percentage
    
    // Network components
    this.egressRouter = null;
    this.egressRouterPosition = new THREE.Vector3(
      -this.gridSize.width * this.cellSize / 2 - 5, // Left side of the room
      0,
      0 // Center Z
    );
    
    // Rack placement mode
    this.placementMode = false;
    
    // Tracking for movable racks
    this.isDraggingRack = false;
    this.draggedRack = null;
    this.dragOffset = new THREE.Vector2();
    this.validDropPosition = true;
    
    // Receiving dock for equipment
    this.receivingDock = {
      position: new THREE.Vector3(
        this.gridSize.width * this.cellSize / 2 + 5, // Right side of the datacenter
        0,
        0 // Center Z
      ),
      inventory: [] // Will store equipment awaiting placement
    };
  }

  init() {
    this.createGround();
    this.createBuilding();
    this.createGrid();
    this.createEgressRouter(); // Still create the egress router, but with no circuits
    this.createReceivingDock(); // Create the shipping/receiving dock
    
    // Add just one empty rack to start with
    this.addRack(5, 5, true); // Position in center, true = empty rack
  }
  
  // Calculate and update stats
  updateStats() {
    // Calculate power usage from all racks
    this.powerUsage = 0;
    
    for (const rack of this.racks) {
      // Add power from servers
      for (const server of rack.servers) {
        this.powerUsage += server.powerConsumption || 0;
      }
      
      // Add power from network equipment
      for (const equipment of rack.networkEquipment) {
        this.powerUsage += equipment.powerConsumption || 0;
      }
    }
    
    // Add power from egress router if it exists
    if (this.egressRouter && this.egressRouter.equipment) {
      this.powerUsage += this.egressRouter.equipment.powerConsumption || 0;
    }
    
    // Calculate temperature (base temp + some increase based on power usage)
    this.temperature = 22 + (this.powerUsage / 1000) * 2; // 2°C increase per 1000W
    
    // Calculate circuit utilization
    this.circuitUtilization = 0;
    if (this.egressRouter && this.egressRouter.circuits.length > 0) {
      // Average utilization across all circuits
      let totalUtilization = 0;
      for (const circuit of this.egressRouter.circuits) {
        totalUtilization += circuit.utilization || 0;
      }
      this.circuitUtilization = totalUtilization / this.egressRouter.circuits.length;
    }
  }
  
  // Toggle rack placement mode
  togglePlacementMode(active) {
    this.placementMode = active;
    
    // Update UI and highlight available grid cells
    if (active) {
      this.game.showGridHighlightsForPlacement();
    } else {
      this.game.removeGridHighlights();
    }
    
    console.log(`Rack placement mode ${active ? 'enabled' : 'disabled'}`);
  }
  
  createEgressRouter() {
    this.egressRouter = new EgressRouter(this.game, this.egressRouterPosition);
    this.egressRouter.init();
    this.container.add(this.egressRouter.container);
  }
  
  createReceivingDock() {
    // Create a receiving dock platform
    const dockWidth = 8;
    const dockDepth = 12;
    const dockGeometry = new THREE.BoxGeometry(dockWidth, 0.5, dockDepth);
    const dockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xA5A5A5, // Concrete-like color
      roughness: 0.9,
      metalness: 0.1
    });
    
    const dockPlatform = new THREE.Mesh(dockGeometry, dockMaterial);
    dockPlatform.position.copy(this.receivingDock.position);
    dockPlatform.position.y = 0.25; // Same level as raised floor
    dockPlatform.receiveShadow = true;
    
    // Store reference in userData
    dockPlatform.userData = {
      type: 'receivingDock',
      id: 'receiving-dock',
      interactive: true
    };
    
    // Add dock ramp
    const rampGeometry = new THREE.BoxGeometry(dockWidth, 0.2, 2);
    const rampMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x777777, // Darker than the dock
      roughness: 0.8,
      metalness: 0.2
    });
    
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.copy(this.receivingDock.position);
    ramp.position.z += (dockDepth / 2) + 1; // Place at front of dock
    ramp.position.y = -0.15; // Slightly below dock level to create a ramp
    ramp.receiveShadow = true;
    
    // Store reference in userData
    ramp.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-ramp',
      interactive: true
    };
    
    // Create a small building structure
    const buildingGeometry = new THREE.BoxGeometry(dockWidth - 1, 3, dockDepth / 2);
    const buildingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x607D8B, // Blueish gray
      roughness: 0.7,
      metalness: 0.3
    });
    
    const dockBuilding = new THREE.Mesh(buildingGeometry, buildingMaterial);
    dockBuilding.position.copy(this.receivingDock.position);
    dockBuilding.position.z -= dockDepth / 4; // Place toward back of dock
    dockBuilding.position.y = 1.5; // Half of building height
    dockBuilding.castShadow = true;
    dockBuilding.receiveShadow = true;
    
    // Store reference in userData
    dockBuilding.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-building',
      interactive: true
    };
    
    // Create a sign
    const signGeometry = new THREE.PlaneGeometry(6, 1);
    const signMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0A3E61, // Dark blue
      side: THREE.DoubleSide
    });
    
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.copy(this.receivingDock.position);
    sign.position.z -= (dockDepth / 4); // Aligned with building
    sign.position.y = 3.5; // Above the building
    sign.rotation.x = Math.PI / 12; // Slight angle
    
    // Store reference in userData
    sign.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-sign',
      interactive: true
    };
    
    // Create a wooden pallet on the dock
    const palletGeometry = new THREE.BoxGeometry(2, 0.2, 2);
    const palletMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // Brown wooden color
      roughness: 0.9,
      metalness: 0.1
    });
    
    const pallet = new THREE.Mesh(palletGeometry, palletMaterial);
    pallet.position.copy(this.receivingDock.position);
    pallet.position.y = 0.25; // Just above the dock platform
    pallet.position.x += 1; // Offset to the side
    pallet.position.z += 2; // Forward on the dock
    pallet.receiveShadow = true;
    pallet.castShadow = true;
    
    // Store reference in userData
    pallet.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-pallet',
      interactive: true
    };
    
    // Create a small box on the pallet for visual interest
    const boxGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const boxMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4D4D4D, // Dark gray
      roughness: 0.7,
      metalness: 0.3
    });
    
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.copy(pallet.position);
    box.position.y = 0.7; // On top of the pallet
    box.receiveShadow = true;
    box.castShadow = true;
    
    // Store reference in userData
    box.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-box',
      interactive: true
    };
    
    // Create a container for all dock elements
    this.receivingDock.container = new THREE.Group();
    this.receivingDock.container.add(dockPlatform);
    this.receivingDock.container.add(ramp);
    this.receivingDock.container.add(dockBuilding);
    this.receivingDock.container.add(sign);
    this.receivingDock.container.add(pallet);
    this.receivingDock.container.add(box);
    
    // Set userData for the container
    this.receivingDock.container.userData = {
      type: 'receivingDock',
      id: 'receiving-dock-container',
      interactive: true
    };
    
    // Add to main container
    this.container.add(this.receivingDock.container);
    
    console.log('Receiving dock created at position:', this.receivingDock.position);
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
    const buildingWidth = this.gridSize.width * this.cellSize + 8; // Add some margin
    const buildingHeight = this.gridSize.height * this.cellSize + 8; // Add some margin
    
    // Create a concrete-like main floor that will sit beneath the raised floor grid
    const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.5, buildingHeight);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666, // Darker concrete gray floor 
      roughness: 0.9,
      metalness: 0.1,
      map: this.createConcreteTexture() // Add concrete-like texture
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.05; // Slightly lowered to make raised floor stand out
    floor.receiveShadow = true;
    this.container.add(floor);
    
    // Create the walls
    this.createWalls();
  }
  
  // Helper method to create a simple concrete-like pattern
  createConcreteTexture() {
    // Create a canvas for the texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with base color
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add some noise for concrete texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 2 + 1;
      const brightness = Math.random() * 30 - 15;
      
      const color = brightness > 0 ? 
        `rgba(255, 255, 255, ${brightness / 100})` : 
        `rgba(0, 0, 0, ${-brightness / 100})`;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some larger spots
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 6 + 2;
      const brightness = Math.random() * 40 - 20;
      
      const color = brightness > 0 ? 
        `rgba(255, 255, 255, ${brightness / 100})` : 
        `rgba(0, 0, 0, ${-brightness / 100})`;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tile the texture
    
    return texture;
  }
  
  // Add walls to the datacenter
  createWalls() {
    const buildingWidth = this.gridSize.width * this.cellSize;
    const buildingHeight = this.gridSize.height * this.cellSize;
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
    
    // Create a raised floor grid system that's more visible and elevated
    // This will create actual cell rectangles rather than just lines
    
    // Grid Cell Colors - alternating pattern for better visibility
    const cellColor1 = 0xBBBBBB; // Light gray
    const cellColor2 = 0xD8D8D8; // Slightly lighter gray
    const borderColor = 0x333333; // Dark gray for borders
    
    // Create a raised floor base that's slightly higher than the main floor
    const floorBaseGeometry = new THREE.BoxGeometry(
      this.gridSize.width * this.cellSize,
      0.05, // Height of raised floor
      this.gridSize.height * this.cellSize
    );
    const floorBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999, // Medium gray for base
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floorBase = new THREE.Mesh(floorBaseGeometry, floorBaseMaterial);
    floorBase.position.y = 0.2; // Raised above regular floor
    floorBase.receiveShadow = true;
    grid.add(floorBase);
    
    // Create individual grid cells as raised tiles
    for (let i = 0; i < this.gridSize.width; i++) {
      for (let j = 0; j < this.gridSize.height; j++) {
        // Determine position
        const x = (i * this.cellSize) - (this.gridSize.width * this.cellSize / 2) + (this.cellSize / 2);
        const z = (j * this.cellSize) - (this.gridSize.height * this.cellSize / 2) + (this.cellSize / 2);
        
        // Create tile with checkerboard pattern for better visibility
        const isAlternate = (i + j) % 2 === 0;
        const tileColor = isAlternate ? cellColor1 : cellColor2;
        
        // Create tile geometry slightly smaller than cell size to show borders
        const tileGeometry = new THREE.BoxGeometry(
          this.cellSize * 0.96, // Slightly smaller than cell for visible grid lines
          0.02, // Height of the tile above the base
          this.cellSize * 0.96  // Slightly smaller than cell for visible grid lines
        );
        
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: tileColor,
          roughness: 0.6,
          metalness: 0.3
        });
        
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x, 0.235, z); // Position on top of base
        tile.receiveShadow = true;
        
        // Store grid coordinates in userData for potential future use
        tile.userData = {
          gridX: i,
          gridZ: j,
          type: 'gridTile'
        };
        
        grid.add(tile);
        
        // Add corner dots to the tile for visual interest
        const dotSize = 0.08;
        const dotGeometry = new THREE.CylinderGeometry(dotSize, dotSize, 0.01, 8);
        const dotMaterial = new THREE.MeshStandardMaterial({
          color: borderColor,
          roughness: 0.5,
          metalness: 0.5
        });
        
        // Add dots at each corner
        const cornerOffsetX = this.cellSize * 0.4;
        const cornerOffsetZ = this.cellSize * 0.4;
        
        // Top-left corner
        const dot1 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot1.position.set(x - cornerOffsetX, 0.245, z - cornerOffsetZ);
        dot1.rotation.x = Math.PI / 2;
        
        // Top-right corner
        const dot2 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot2.position.set(x + cornerOffsetX, 0.245, z - cornerOffsetZ);
        dot2.rotation.x = Math.PI / 2;
        
        // Bottom-left corner
        const dot3 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot3.position.set(x - cornerOffsetX, 0.245, z + cornerOffsetZ);
        dot3.rotation.x = Math.PI / 2;
        
        // Bottom-right corner
        const dot4 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot4.position.set(x + cornerOffsetX, 0.245, z + cornerOffsetZ);
        dot4.rotation.x = Math.PI / 2;
        
        grid.add(dot1);
        grid.add(dot2);
        grid.add(dot3);
        grid.add(dot4);
        
        // For every 5th row/column, add a special marking
        if (i % 5 === 0 || j % 5 === 0) {
          const stripeSize = 0.05;
          let stripeGeometry, stripe;
          
          if (i % 5 === 0) {
            // Add vertical stripe
            stripeGeometry = new THREE.BoxGeometry(stripeSize, 0.021, this.cellSize * 0.8);
            stripe = new THREE.Mesh(stripeGeometry, new THREE.MeshStandardMaterial({
              color: 0x333333, // Dark color for major grid indicators
              roughness: 0.4,
              metalness: 0.6
            }));
            stripe.position.set(x - this.cellSize * 0.45, 0.246, z);
          }
          
          if (j % 5 === 0) {
            // Add horizontal stripe
            stripeGeometry = new THREE.BoxGeometry(this.cellSize * 0.8, 0.021, stripeSize);
            stripe = new THREE.Mesh(stripeGeometry, new THREE.MeshStandardMaterial({
              color: 0x333333, // Dark color for major grid indicators
              roughness: 0.4,
              metalness: 0.6
            }));
            stripe.position.set(x, 0.246, z - this.cellSize * 0.45);
          }
          
          if (stripe) {
            grid.add(stripe);
          }
        }
      }
    }
    
    this.container.add(grid);
  }
  
  addRack(gridX, gridZ, isEmpty = false) {
    // Before adding, check if position is available
    if (!this.isGridPositionAvailable(gridX, gridZ)) {
      console.error("Cannot add rack - position occupied");
      return null;
    }
    
    const posX = (gridX * this.cellSize) - (this.gridSize.width * this.cellSize / 2) + (this.cellSize / 2);
    const posZ = (gridZ * this.cellSize) - (this.gridSize.height * this.cellSize / 2) + (this.cellSize / 2);
    
    const rack = new ServerRack(this.game);
    rack.gridX = gridX;
    rack.gridZ = gridZ;
    rack.init(isEmpty); // Pass isEmpty flag to init
    rack.container.position.set(posX, 0.25, posZ); // Positioned on top of the raised floor
    
    // Store grid position and make draggable in userData
    rack.container.userData = {
      type: 'rack',
      gridX: gridX,
      gridZ: gridZ,
      movable: true,
      id: rack.id,
      rackId: rack.id, // Add this to match what might be expected in click handler
      width: rack.rackWidth,
      depth: rack.rackDepth,
      empty: isEmpty,
      interactive: true // Mark as interactive for click handling
    };
    
    // Ensure all children have consistent userData
    rack.container.traverse(child => {
      if (child.userData && child.userData.type === 'rack') {
        child.userData.gridX = gridX;
        child.userData.gridZ = gridZ;
        child.userData.rackId = rack.id;
        child.userData.id = rack.id;
        child.userData.movable = true;
        child.userData.interactive = true;
      }
    });
    
    this.racks.push(rack);
    this.container.add(rack.container);
    
    // Add event listeners for rack movement
    this.makeRackDraggable(rack);
    
    console.log(`Added rack ${rack.id} at grid position (${gridX}, ${gridZ})`);
    return rack;
  }
  
  makeRackDraggable(rack) {
    const rackMesh = rack.container.children.find(child => child.userData && child.userData.type === 'rack');
    
    if (rackMesh) {
      // Make rack look interactive
      rackMesh.userData.movable = true;
      
      // The actual event handling for dragging is in the Game class
      // since we need access to the mouse and raycaster
    }
  }
  
  // Check if a grid position is available for rack placement
  isGridPositionAvailable(gridX, gridZ, excludeRackId = null) {
    // Check if position is within grid boundaries
    if (gridX < 0 || gridX >= this.gridSize.width || gridZ < 0 || gridZ >= this.gridSize.height) {
      return false;
    }
    
    // Simply check if this exact grid cell is occupied by another rack
    // This allows racks to be placed immediately adjacent to each other
    return !this.racks.some(rack => {
      if (excludeRackId && rack.container.userData.id === excludeRackId) {
        return false; // Skip the rack we're moving
      }
      
      // Exact position match check - each grid cell is 24" x 24"
      // which exactly matches our rack dimensions
      return rack.gridX === gridX && rack.gridZ === gridZ;
    });
  }
  
  // Move a rack to a new grid position
  moveRack(rack, newGridX, newGridZ) {
    // Get the rack ID to exclude in position check
    const rackId = rack.id || (rack.container && rack.container.userData && rack.container.userData.id);
    
    if (!this.isGridPositionAvailable(newGridX, newGridZ, rackId)) {
      console.error('Cannot move rack - position occupied');
      return false;
    }
    
    // Update rack position in grid
    rack.gridX = newGridX;
    rack.gridZ = newGridZ;
    
    // Ensure userData is updated on the container
    if (rack.container && rack.container.userData) {
      rack.container.userData.gridX = newGridX;
      rack.container.userData.gridZ = newGridZ;
      rack.container.userData.rackId = rack.id;
      
      // Ensure all children also have the rack ID for consistent picking
      rack.container.traverse(child => {
        if (child.userData && child.userData.type === 'rack') {
          child.userData.rackId = rack.id;
          child.userData.gridX = newGridX;
          child.userData.gridZ = newGridZ;
        }
      });
    }
    
    // Calculate world position
    const posX = (newGridX * this.cellSize) - (this.gridSize.width * this.cellSize / 2) + (this.cellSize / 2);
    const posZ = (newGridZ * this.cellSize) - (this.gridSize.height * this.cellSize / 2) + (this.cellSize / 2);
    
    // Move rack to new position
    rack.container.position.set(posX, 0.25, posZ);
    
    // Update any connections (cables, circuits)
    if (this.game.cableManager) {
      this.game.cableManager.updateAllCables();
    }
    
    console.log(`Rack moved to grid position (${newGridX}, ${newGridZ}) with ID ${rack.id}`);
    return true;
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
    // Round the amount to 2 decimal places for display
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Only update if the amount is non-zero
    if (roundedAmount !== 0) {
      this.funds += roundedAmount;
      console.log(`Funds updated: ${roundedAmount >= 0 ? '+$' : '-$'}${Math.abs(roundedAmount).toFixed(2)} = $${this.funds.toFixed(2)}`);
      
      // Update UI with new fund amount if the game and UI are available
      if (this.game && this.game.ui) {
        this.game.ui.updateMenuStats();
        
        // Show a notification for the funds update
        const message = roundedAmount > 0 
          ? `Income received: +$${roundedAmount.toFixed(2)}` 
          : `Expenses paid: -$${Math.abs(roundedAmount).toFixed(2)}`;
        
        this.game.ui.showStatusMessage(message, 5000); // Show for 5 seconds
      }
    }
    
    return this.funds;
  }
  
  // Add equipment to the receiving dock inventory
  addEquipmentToReceivingDock(equipmentType, specifications, cost) {
    // Deduct cost from funds
    if (cost > 0) {
      if (this.funds < cost) {
        console.error("Not enough funds to purchase equipment");
        return null;
      }
      this.updateFunds(-cost);
    }
    
    // Create inventory record with original cost and 75% selling value
    const item = {
      id: Math.random().toString(36).substr(2, 9),
      type: equipmentType, // 'server', 'switch', 'router', etc.
      specs: specifications,
      originalCost: cost,
      sellingValue: Math.floor(cost * 0.75), // 75% of original cost
      dateReceived: new Date(),
      status: 'available' // 'available', 'installing', 'sold'
    };
    
    // Add to dock inventory
    this.receivingDock.inventory.push(item);
    console.log(`Added ${equipmentType} to receiving dock inventory:`, item);
    
    return item;
  }
  
  // Get inventory listing
  getReceivingDockInventory() {
    return this.receivingDock.inventory.filter(item => item.status === 'available');
  }
  
  // Sell equipment from the dock inventory
  sellEquipmentFromDock(itemId) {
    const itemIndex = this.receivingDock.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      console.error("Equipment not found in receiving dock inventory");
      return false;
    }
    
    const item = this.receivingDock.inventory[itemIndex];
    
    if (item.status !== 'available') {
      console.error("Equipment is not available for sale");
      return false;
    }
    
    // Add selling value to funds
    this.updateFunds(item.sellingValue);
    
    // Mark as sold and remove from active inventory
    item.status = 'sold';
    item.dateSold = new Date();
    
    console.log(`Sold ${item.type} from receiving dock for $${item.sellingValue}`);
    return true;
  }
  
  // Install server from dock into a rack
  installServerFromDock(itemId, rackId, position) {
    const itemIndex = this.receivingDock.inventory.findIndex(item => 
      item.id === itemId && item.status === 'available' && item.type === 'server'
    );
    
    if (itemIndex === -1) {
      console.error("Server not found in receiving dock inventory or not available");
      return null;
    }
    
    const rack = this.racks.find(r => r.id === rackId);
    if (!rack) {
      console.error("Rack not found");
      return null;
    }
    
    const item = this.receivingDock.inventory[itemIndex];
    
    // Create and add server to the rack
    const server = rack.addServer(position, item.specs.unitSize);
    if (!server) {
      console.error("Could not add server to rack at position", position);
      return null;
    }
    
    // Update server specs from the inventory item
    server.specs = {...item.specs};
    if (item.specs.powerConsumption) server.powerConsumption = item.specs.powerConsumption;
    if (item.specs.revenue) server.revenue = item.specs.revenue;
    
    // Mark as installed
    item.status = 'installed';
    item.installDate = new Date();
    item.installedLocation = {
      rackId: rackId,
      position: position
    };
    
    console.log(`Installed server from receiving dock to rack ${rackId} at position ${position}`);
    return server;
  }
  
  // Install network equipment from dock into a rack
  installNetworkEquipmentFromDock(itemId, rackId, position) {
    const itemIndex = this.receivingDock.inventory.findIndex(item => 
      item.id === itemId && item.status === 'available' && 
      ['switch', 'router', 'firewall', 'patch_panel'].includes(item.type.toLowerCase())
    );
    
    if (itemIndex === -1) {
      console.error("Network equipment not found in receiving dock inventory or not available");
      return null;
    }
    
    const rack = this.racks.find(r => r.id === rackId);
    if (!rack) {
      console.error("Rack not found");
      return null;
    }
    
    const item = this.receivingDock.inventory[itemIndex];
    
    // Create and add network equipment to the rack
    // The type needs to be uppercase for the equipment types constant
    const equipmentType = item.type.toUpperCase();
    const equipment = rack.addNetworkEquipment(equipmentType, position, item.specs);
    
    if (!equipment) {
      console.error("Could not add network equipment to rack at position", position);
      return null;
    }
    
    // Mark as installed
    item.status = 'installed';
    item.installDate = new Date();
    item.installedLocation = {
      rackId: rackId,
      position: position
    };
    
    console.log(`Installed ${item.type} from receiving dock to rack ${rackId} at position ${position}`);
    return equipment;
  }
}