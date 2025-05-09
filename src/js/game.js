import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Datacenter } from './datacenter.js';
import { UI } from './ui.js';
import { CableManager } from './cableManager.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.datacenter = null;
    this.ui = null;
    this.cableManager = null;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.isMouseDown = false;
    this.selectedObject = null;
    
    // Cable management mode
    this.cableMode = false;
    this.cableDragging = false;
    this.draggedCable = null;
    
    // Rack movement mode
    this.rackDragMode = false;
    this.draggedRack = null;
    this.dragStartPosition = new THREE.Vector3();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0)); // XZ plane
    this.dragOffset = new THREE.Vector3();
    this.gridHighlights = [];
    
    // Game time management
    this.gameTime = {
      startDate: new Date(2025, 0, 1), // Game starts on January 1, 2025
      currentDate: new Date(2025, 0, 1),
      timeScale: 720, // Default: 720 minutes per real second (1 real second = 12 game hours)
      dayLength: 60, // 60 real seconds = 1 game day at normal speed
      isPaused: false
    };
    
    // Fund update timer variables
    this.fundsUpdateInterval = 30; // Update funds every 30 seconds
    this.accumulatedTime = 0; // Track accumulated time between updates
    this.accumulatedRevenue = 0; // Track accumulated revenue between updates
    this.accumulatedExpenses = 0; // Track accumulated expenses between updates
    
    // Camera movement variables
    this.keyStates = {}; // Track key states for camera movement
    this.moveSpeed = 20; // Camera movement speed
    this.cameraMinHeight = 5; // Minimum height above ground
    this.cameraMaxHeight = 50; // Maximum height above ground
    this.datacenterBounds = { 
      minX: -50, 
      maxX: 50, 
      minZ: -50, 
      maxZ: 50 
    }; // Boundaries of the datacenter
    
    // Game save/load functionality
    this.autoSaveInterval = 5 * 60; // Auto-save every 5 minutes
    this.timeSinceLastSave = 0;
    this.saveSlots = 3; // Number of available save slots
    this.currentSaveSlot = 1; // Default save slot
    this.saveName = "ServerTycoon"; // Base name for save files
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initDatacenter();
    this.initCableManager();
    this.initUI();
    this.initEventListeners();
    this.initSaveSystem();
    
    // Initialize the game time display
    if (this.ui) {
      this.ui.updateDateDisplay(this.gameTime.currentDate);
      this.gameTime.lastUIUpdate = new Date(this.gameTime.currentDate);
    }
    
    this.animate();
  }
  
  // Initialize the save/load system
  initSaveSystem() {
    console.log("Initializing save system...");
    
    // Check if we have a previously saved game to load
    this.checkForSavedGames();
    
    // Set up auto-save interval
    this.autoSaveIntervalId = setInterval(() => {
      this.autoSave();
    }, this.autoSaveInterval * 1000);
  }
  
  initUI() {
    this.ui = new UI(this);
    this.ui.init();
  }
  
  initCableManager() {
    this.cableManager = new CableManager(this);
    this.cableManager.init();
  }
  
  // Method to toggle cable management mode
  toggleCableMode(active) {
    this.cableMode = active;
    
    // Save the current camera position before entering cable mode
    if (active && !this.savedCameraState) {
      this.savedCameraState = {
        position: this.camera.position.clone(),
        rotation: this.camera.rotation.clone(),
        zoom: this.camera.zoom
      };
      
      // Move to top-down view for cable management
      const cameraHeight = 50;
      // Transition the camera position smoothly
      this.moveToTopDownView(cameraHeight);
      
      // Dim all servers and equipment for better cable visibility
      this.dimServersAndEquipment(true);
      
      // Disable orbit controls and enable limited top-down movement
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.maxPolarAngle = Math.PI / 6; // Limit angle to near-top-down
      this.controls.minPolarAngle = 0;
      this.controls.maxAzimuthAngle = Math.PI / 4;
      this.controls.minAzimuthAngle = -Math.PI / 4;
      this.controls.enabled = true;
      
      // Show cable menu
      this.ui.showCableManagementPanel();
    } else if (!active) {
      // Restore camera position when exiting cable mode
      if (this.savedCameraState) {
        // Smoothly return to the previous view
        this.returnToPreviousView();
        
        // Un-dim the servers and equipment
        this.dimServersAndEquipment(false);
        
        // Reset controls
        this.controls.enableRotate = true;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minPolarAngle = 0;
        this.controls.maxAzimuthAngle = Infinity;
        this.controls.minAzimuthAngle = -Infinity;
        
        // Clear saved camera state
        this.savedCameraState = null;
        
        // Hide cable menu
        this.ui.hideCableManagementPanel();
      }
      
      // Cancel any active cable dragging
      if (this.cableDragging) {
        this.cableManager.cancelCable();
        this.cableDragging = false;
        this.draggedCable = null;
      }
    }
    
    console.log(`Cable management mode ${active ? 'enabled' : 'disabled'}`);
  }
  
  // Smoothly move camera to top-down view
  moveToTopDownView(height) {
    // Calculate center of datacenter
    const center = new THREE.Vector3(0, 0, 0);
    
    // Set up animation
    const startPosition = this.camera.position.clone();
    const targetPosition = new THREE.Vector3(0, height, 0);
    
    // Store animation data
    this.cameraTransition = {
      startPosition: startPosition,
      targetPosition: targetPosition,
      startTime: Date.now(),
      duration: 1000, // 1 second transition
      center: center,
      active: true
    };
  }
  
  // Return to the previous camera view
  returnToPreviousView() {
    // Set up animation to return to saved position
    const startPosition = this.camera.position.clone();
    const targetPosition = this.savedCameraState.position.clone();
    
    // Store animation data
    this.cameraTransition = {
      startPosition: startPosition,
      targetPosition: targetPosition,
      startRotation: this.camera.rotation.clone(),
      targetRotation: this.savedCameraState.rotation.clone(),
      startTime: Date.now(),
      duration: 1000, // 1 second transition
      active: true
    };
  }
  
  // Check if connection tile for edge router exists, create it if not
  checkAndCreateConnectionTile() {
    if (this.datacenter && this.datacenter.egressRouter) {
      if (!this.datacenter.egressRouter.connectionTile) {
        console.log("Connection tile not found, creating it now");
        // Create the tile if it doesn't exist yet
        this.datacenter.egressRouter.createConnectionTile();
        
        // Force an update of position
        const pos = this.datacenter.egressRouter.container.position;
        if (this.datacenter.egressRouter.connectionTile) {
          this.datacenter.egressRouter.connectionTile.position.copy(pos);
          this.datacenter.egressRouter.connectionTile.visible = true;
          console.log("Created and positioned connection tile at:", pos);
        }
      } else {
        // Make sure it's visible
        this.datacenter.egressRouter.connectionTile.visible = true;
      }
    }
  }
  
  // Dim servers and equipment for better cable visibility
  dimServersAndEquipment(dim) {
    // Make sure the connection tile exists and is visible
    this.checkAndCreateConnectionTile();
    // Go through all racks
    for (const rack of this.datacenter.racks) {
      // Dim servers
      for (const server of rack.servers) {
        // Access server meshes and adjust material opacity/emissive
        if (server.container && server.container.children) {
          this.setObjectDimming(server.container, dim);
        }
      }
      
      // Dim network equipment
      for (const equipment of rack.networkEquipment) {
        if (equipment.container && equipment.container.children) {
          // Except don't dim the ports, since we need to see them for cable management
          this.setObjectDimming(equipment.container, dim, 'port');
        }
      }
      
      // Dim the rack itself slightly
      this.setObjectDimming(rack.container, dim, 'port');
    }
    
    // Handle egress router cabinet - dim cabinet but highlight connection tile
    if (this.datacenter.egressRouter) {
      // Dim the cabinet
      this.setObjectDimming(this.datacenter.egressRouter.cabinet, dim);
      
      // Enhance the connection tile in cable mode
      if (this.datacenter.egressRouter.connectionTile) {
        // Always keep it visible, but enhance it in cable mode
        if (dim) {
          // Make connection tile more prominent in cable management mode
          this.datacenter.egressRouter.connectionTile.traverse(child => {
            if (child.isMesh && child.material) {
              // Store original values if not already stored
              if (!child.userData.originalEmissiveIntensity && child.material.emissive) {
                child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
              }
              if (!child.userData.originalOpacity) {
                child.userData.originalOpacity = child.material.opacity || 1.0;
              }
              
              // Enhance visual appearance
              if (child.material.emissive) {
                child.material.emissiveIntensity = 1.0; // Max glow
              }
              // Make label fully opaque
              child.material.opacity = 1.0;
              
              // Scale up slightly for emphasis
              if (!child.userData.originalScale) {
                child.userData.originalScale = child.scale.clone();
                child.scale.set(1.1, 1.1, 1.1);
              }
            }
          });
        } else {
          // Return to normal appearance
          this.datacenter.egressRouter.connectionTile.traverse(child => {
            if (child.isMesh && child.material) {
              // Restore original values
              if (child.userData.originalEmissiveIntensity !== undefined && child.material.emissive) {
                child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
              }
              if (child.userData.originalOpacity !== undefined) {
                child.material.opacity = child.userData.originalOpacity;
              }
              if (child.userData.originalScale) {
                child.scale.copy(child.userData.originalScale);
                delete child.userData.originalScale;
              }
            }
          });
        }
      }
    }
  }
  
  // Helper function to dim/un-dim an object
  setObjectDimming(object, dim, excludeType = null) {
    object.traverse(child => {
      if (child.isMesh && 
          (!excludeType || 
           !child.userData || 
           child.userData.type !== excludeType)) {
        
        if (!child.userData.originalMaterial) {
          // Store original material properties
          child.userData.originalMaterial = {
            opacity: child.material.opacity,
            transparent: child.material.transparent,
            emissiveIntensity: child.material.emissiveIntensity || 0
          };
        }
        
        if (dim) {
          // Dim the object
          child.material.transparent = true;
          child.material.opacity = 0.5;
          if (child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.1;
          }
        } else {
          // Restore original settings
          child.material.transparent = child.userData.originalMaterial.transparent;
          child.material.opacity = child.userData.originalMaterial.opacity;
          if (child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = child.userData.originalMaterial.emissiveIntensity;
          }
        }
      }
    });
  }
  
  // Find equipment across all racks
  findEquipmentById(id) {
    for (const rack of this.datacenter.racks) {
      const equipment = rack.findEquipmentById(id);
      if (equipment) {
        return equipment;
      }
    }
    return null;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
  }

  initCamera() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this.camera.position.set(30, 30, 30);
    this.camera.lookAt(0, 0, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.enableKeys = false; // Disable default OrbitControls keyboard handling
    this.controls.enablePan = true; // Enable panning with middle mouse button
    this.controls.panSpeed = 1.0; // Adjust panning speed
  }

  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  initDatacenter() {
    this.datacenter = new Datacenter(this);
    this.datacenter.init();
    this.scene.add(this.datacenter.container);
  }

  initEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mousemove', this.handleExtendedMouseMove.bind(this));
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Add a special handler for when window loses focus to clear key states
    window.addEventListener('blur', () => {
      console.log("Window lost focus, clearing key states");
      this.keyStates = {};
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update cable dragging if in cable mode
    if (this.cableMode && this.cableDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.cableManager.updateDraggedCable(point.x, point.y, point.z);
      }
    }
    
    // Update rack dragging
    if (this.rackDragMode) {
      this.updateRackDrag();
    }
  }

  onMouseDown(event) {
    this.isMouseDown = true;
    
    if (this.cableMode) {
      this.handleCableInteraction();
    } else if (!this.rackDragMode) { // Only handle selection if not already dragging a rack
      this.handleSelection();
    }
  }
  
  // Additional onMouseMove handler (extended functionality compared to the one above)
  handleExtendedMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Check if we should start rack dragging (after a mousedown but before a mouseup)
    if (this.isMouseDown && this.clickTarget && !this.rackDragMode && !this.cableMode) {
      // Check if we've moved enough to consider this a drag operation
      const dx = this.mouse.x - this.clickStartPosition.x;
      const dy = this.mouse.y - this.clickStartPosition.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance > 0.01) { // Arbitrary threshold for drag detection
        this.startRackDrag(this.clickTarget, this.clickPoint);
        this.clickTarget = null; // Clear to prevent multiple starts
      }
    }
    
    // Update cable dragging if in cable mode
    if (this.cableMode && this.cableDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.cableManager.updateDraggedCable(point.x, point.y, point.z);
      }
    }
    
    // Update rack dragging
    if (this.rackDragMode) {
      this.updateRackDrag();
    }
  }

  onMouseUp(event) {
    this.isMouseDown = false;
    
    // Handle click event on rack (if it was a click, not a drag)
    if (this.clickTarget && !this.rackDragMode && !this.cableMode) {
      const now = new Date().getTime();
      const clickDuration = now - this.clickStartTime;
      
      console.log("Mouse up with clickTarget, duration:", clickDuration);
      
      if (clickDuration < 300) { // Short click = view rack
        console.log("Short click detected, looking for rack");
        
        // Check userData for rack type
        if (this.clickTarget.userData && this.clickTarget.userData.type === 'rack') {
          console.log("Click target is a rack");
          
          // Find rack by both methods to ensure we find it
          let rack = this.findRackByObject(this.clickTarget);
          
          if (!rack && this.clickTarget.userData.rackId) {
            console.log("Finding rack by explicit ID:", this.clickTarget.userData.rackId);
            rack = this.datacenter.racks.find(r => r.id === this.clickTarget.userData.rackId);
          }
          
          if (rack) {
            console.log("Mouse up - opening rack view for rack:", rack.id);
            this.ui.showRackView(rack);
          } else {
            console.log("Failed to find rack for clicked object");
          }
        } else if (this.clickTarget.userData && this.clickTarget.userData.type === 'egressCabinet') {
          console.log("Click target is egress cabinet");
          this.ui.showEgressRouterView(this.datacenter.egressRouter);
        }
      }
      
      this.clickTarget = null;
    }
    
    // Handle cable connection completion
    if (this.cableMode && this.cableDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Check if we clicked on a port
        if (object.userData && object.userData.type === 'port') {
          const targetEquipment = this.findEquipmentById(object.userData.equipmentId);
          if (targetEquipment) {
            this.cableManager.completeCable(targetEquipment, object.userData.portId);
          }
        } else {
          // Cancel if not clicking on a port
          this.cableManager.cancelCable();
        }
      } else {
        // Cancel if not clicking on anything
        this.cableManager.cancelCable();
      }
      
      this.cableDragging = false;
    }
    
    // Handle rack drag completion
    if (this.rackDragMode) {
      this.dropRack();
    }
  }
  
  onKeyDown(event) {
    // Skip if typing in an input field
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }
    
    // Movement keys list
    const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    
    // Track key state
    this.keyStates[event.key] = true;
    
    // Log key presses for debugging
    console.log(`Key pressed: ${event.key}`);
    
    // Toggle cable mode with 'C' key
    if (event.key === 'c' || event.key === 'C') {
      this.toggleCableMode(true);
    }
    
    // Cancel cable drag with Escape key
    if (event.key === 'Escape' && this.cableMode && this.cableDragging) {
      this.cableManager.cancelCable();
      this.cableDragging = false;
    }
    
    // Prevent default behavior for movement keys to avoid page scrolling
    if (movementKeys.includes(event.key)) {
      event.preventDefault();
    }
  }
  
  onKeyUp(event) {
    // Skip if typing in an input field
    if (document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }
    
    // Clear key state
    this.keyStates[event.key] = false;
    console.log(`Key released: ${event.key}`);
    
    // Exit cable mode when releasing 'C' key
    if (event.key === 'c' || event.key === 'C') {
      this.toggleCableMode(false);
    }
  }
  
  handleCableInteraction() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      // Check if we clicked on a port
      if (object.userData.type === 'port') {
        // Find the equipment this port belongs to
        const equipment = this.findEquipmentById(object.userData.equipmentId);
        if (equipment) {
          console.log('Port selected', object.userData.portId);
          
          // Start cable dragging from this port
          this.cableDragging = true;
          this.cableManager.startCable(equipment, object.userData.portId);
        }
      }
    }
  }

  handleSelection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check if we're in rack placement mode
    if (this.datacenter.placementMode) {
      // In placement mode, we need to check for intersections with grid highlights
      const allObjects = [...this.gridHighlights, ...this.datacenter.container.children];
      const intersects = this.raycaster.intersectObjects(allObjects, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // If we clicked on a placement highlight, add a rack there
        if (object.userData && object.userData.type === 'placementHighlight') {
          const gridX = object.userData.gridX;
          const gridZ = object.userData.gridZ;
          console.log(`Adding empty rack at position (${gridX}, ${gridZ})`);
          this.addEmptyRack(gridX, gridZ);
          
          // Update grid highlights
          this.showGridHighlightsForPlacement();
          return;
        }
      }
    }
    
    // Standard object selection for non-placement mode
    const intersects = this.raycaster.intersectObjects(this.datacenter.container.children, true);
    
    console.log("Clicked - found intersections:", intersects.length);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.selectedObject = object;
      
      // Debug: Log the object and its parent hierarchy to identify issues
      console.log("Initial clicked object:", object);
      if (object.userData) {
        console.log("Object userData:", object.userData);
      }
      
      // Find the top-level object with userData if it exists
      let currentObj = object;
      let objPath = [];
      
      while (currentObj && (!currentObj.userData || !currentObj.userData.type)) {
        objPath.push(currentObj);
        currentObj = currentObj.parent;
      }
      
      console.log("Traversed objects to find userData:", objPath.length);
      
      if (!currentObj || !currentObj.userData) {
        console.log("No object with userData found in the hierarchy");
        return; // No valid object found
      }
      
      // Working with the object that has userData
      const userData = currentObj.userData;
      console.log('Selected object with userData:', currentObj);
      console.log('Selected object type:', userData.type);
      
      // Check if the object is interactive
      if (userData.interactive === false) {
        console.log('Object is not interactive, ignoring click');
        return;
      }
      
      // Handle object selection logic here
      if (userData.type === 'rack') {
        console.log('Rack selected', currentObj);
        console.log('Rack userData:', userData);
        
        // Find the rack by ID first if available
        let rack = null;
        if (userData.rackId) {
          rack = this.datacenter.racks.find(r => r.id === userData.rackId);
          if (rack) {
            console.log('Found rack by ID:', rack.id);
          }
        }
        
        // Fallback to finding by object if needed
        if (!rack) {
          rack = this.findRackByObject(currentObj);
          if (rack) {
            console.log('Found rack by object traversal:', rack.id);
          }
        }
        
        if (!rack) {
          console.log('Could not find rack from object');
        }
        
        // Check if it's a movable rack (long click for drag, short click for view)
        if (userData.movable) {
          // Create a timer to check if this is a click or a drag
          this.clickStartTime = new Date().getTime();
          this.clickStartPosition = { ...this.mouse };
          this.clickTarget = currentObj;
          this.clickPoint = intersects[0].point;
          console.log('Click target set for potential drag:', userData.rackId || userData.id);
        } else {
          // Find and show the rack (simpler approach)
          if (rack) {
            console.log('Opening rack view from direct click');
            this.ui.showRackView(rack);
          } else {
            console.error('Could not find rack to display');
          }
        }
      } else if (userData.type === 'egressCabinet') {
        console.log('Egress router cabinet selected', currentObj);
        console.log('Egress router:', this.datacenter.egressRouter);
        if (this.datacenter.egressRouter) {
          this.ui.showEgressRouterView(this.datacenter.egressRouter);
        } else {
          console.error('Egress router not found');
        }
      } else if (userData.type === 'circuit') {
        console.log('Circuit selected', currentObj);
        const circuitId = userData.id || userData.circuitId;
        const circuit = this.datacenter.egressRouter.circuits.find(c => c.id === circuitId);
        if (circuit) {
          this.ui.showCircuitView(circuit);
        } else {
          console.error('Circuit not found with ID:', circuitId);
          console.log('Available circuits:', this.datacenter.egressRouter.circuits.map(c => c.id));
        }
      } else if (userData.type === 'server') {
        console.log('Server selected', currentObj);
        // Show server details
      } else if (userData.type === 'network') {
        console.log('Network equipment selected', currentObj);
        // Show network equipment details
      } else if (userData.type === 'port') {
        console.log('Port selected', currentObj);
        // Show port details
      } else if (userData.type === 'cable') {
        console.log('Cable selected', currentObj);
        // Show cable details or option to remove
      } else if (userData.type === 'receivingDock') {
        console.log('Receiving dock selected', currentObj);
        this.ui.showReceivingDockUI();
      } else {
        console.log('Unknown object type selected:', userData.type);
      }
    } else {
      this.selectedObject = null;
      console.log('No object intersected');
    }
  }
  
  // Add an empty rack at a specific grid position
  addEmptyRack(gridX, gridZ) {
    // Call addRack with the isEmpty parameter set to true
    const rack = this.datacenter.addRack(gridX, gridZ, true);
    
    if (rack) {
      console.log(`Added empty rack at position (${gridX}, ${gridZ})`);
      
      // If we're in placement mode, exit it when rack is placed
      if (this.datacenter.placementMode && this.ui) {
        this.ui.toggleRackPlacementMode();
      }
      
      return rack;
    }
    
    return null;
  }
  
  // Method called by Datacenter to show grid highlights for rack placement
  showGridHighlightsForPlacement() {
    if (!this.datacenter.placementMode) {
      this.removeGridHighlights();
      return;
    }
    
    console.log("Showing grid highlights for rack placement");
    // Remove existing highlights and add placement highlights
    this.removeGridHighlights();
    
    // Create highlights for each available grid cell
    const gridSize = this.datacenter.gridSize;
    const cellSize = this.datacenter.cellSize;
    
    for (let x = 0; x < gridSize.width; x++) {
      for (let z = 0; z < gridSize.height; z++) {
        // Only create a highlight if the position is available
        if (this.datacenter.isGridPositionAvailable(x, z)) {
          const highlight = new THREE.Mesh(
            new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9),
            new THREE.MeshBasicMaterial({
              color: 0x4CAF50, // Green
              transparent: true,
              opacity: 0.5, // More visible for placement mode
              side: THREE.DoubleSide
            })
          );
          
          // Position the highlight
          const posX = (x * cellSize) - (gridSize.width * cellSize / 2) + (cellSize / 2);
          const posZ = (z * cellSize) - (gridSize.height * cellSize / 2) + (cellSize / 2);
          highlight.position.set(posX, 0.1, posZ); // Slightly above ground
          highlight.rotation.x = -Math.PI / 2; // Flat on the ground
          
          // Store the grid position in userData and mark as clickable for placement
          highlight.userData = { 
            gridX: x, 
            gridZ: z, 
            type: 'placementHighlight',
            clickable: true 
          };
          
          this.gridHighlights.push(highlight);
          this.scene.add(highlight);
        }
      }
    }
  }
  
  // Find the rack instance that contains a selected object
  findRackByObject(object) {
    // Find the rack container
    let current = object;
    
    // First try to find by traversing up to a 'rack' type object
    while (current && (!current.userData || current.userData.type !== 'rack')) {
      current = current.parent;
    }
    
    if (!current) return null;
    
    console.log("Found rack object:", current.userData);
    
    // Try to find by rack ID first (most reliable)
    if (current.userData.rackId) {
      const rackById = this.datacenter.racks.find(rack => rack.id === current.userData.rackId);
      if (rackById) {
        console.log("Found rack by ID:", rackById.id);
        return rackById;
      }
    }
    
    // Fallback: find by grid position
    if (current.userData.gridX !== undefined && current.userData.gridZ !== undefined) {
      const rackByGrid = this.datacenter.racks.find(rack => 
        rack.container.userData.gridX === current.userData.gridX && 
        rack.container.userData.gridZ === current.userData.gridZ
      );
      
      if (rackByGrid) {
        console.log("Found rack by grid position:", rackByGrid.id);
        return rackByGrid;
      }
    }
    
    console.log("Could not find rack for object:", current);
    return null;
  }
  
  // Start dragging a rack
  startRackDrag(rackObject, intersectionPoint) {
    if (this.cableMode) return; // Don't allow rack dragging in cable mode
    
    // Find the rack by traversing up to find the rack container
    let current = rackObject;
    let rackContainer = null;
    
    // First, try to find the direct rack mesh
    if (current.userData && current.userData.type === 'rack') {
      // This is likely a rack mesh
      while (current && (!current.userData || current.userData.type !== 'rack' || !current.userData.gridX)) {
        current = current.parent;
      }
      
      if (current && current.userData && current.userData.type === 'rack') {
        rackContainer = current;
      }
    }
    
    // If not found, try to find a rack with the object's position
    if (!rackContainer) {
      const position = new THREE.Vector3();
      rackObject.getWorldPosition(position);
      
      // Find the closest rack to this position
      let closestDistance = Infinity;
      let closestRack = null;
      
      for (const rack of this.datacenter.racks) {
        const distance = position.distanceTo(rack.container.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRack = rack;
        }
      }
      
      if (closestRack && closestDistance < 5) { // 5 is an arbitrary threshold
        rackContainer = closestRack.container;
      }
    }
    
    if (!rackContainer) {
      console.error('Could not find rack to drag');
      return;
    }
    
    // Try to find rack by rackId first (most reliable)
    let rack = null;
    if (rackContainer.userData && rackContainer.userData.rackId) {
      rack = this.datacenter.racks.find(r => r.id === rackContainer.userData.rackId);
    }
    
    // Fallback to finding by container reference or grid position
    if (!rack) {
      rack = this.datacenter.racks.find(r => 
        r.container === rackContainer || 
        (r.gridX === rackContainer.userData.gridX && r.gridZ === rackContainer.userData.gridZ)
      );
    }
    
    if (!rack) {
      console.error('Could not find rack data for dragging');
      return;
    }
    
    console.log('Starting rack drag for rack', rack);
    this.rackDragMode = true;
    this.draggedRack = rack;
    
    // Disable all controls while dragging
    this.controls.enabled = false;
    
    // Also clear any keyboard movement that might be in progress
    // by clearing the key states for movement keys
    const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    movementKeys.forEach(key => {
      this.keyStates[key] = false;
    });
    
    // Store the start position of the dragged rack
    this.dragStartPosition.copy(rack.container.position);
    
    // Calculate the drag offset
    this.dragOffset.set(
      intersectionPoint.x - rack.container.position.x,
      0, // Y offset is always 0 since we're dragging on the ground
      intersectionPoint.z - rack.container.position.z
    );
    
    // Save original controls state to restore later
    this.originalControlsState = {
      enabled: this.controls.enabled,
      enablePan: this.controls.enablePan,
      enableZoom: this.controls.enableZoom,
      enableRotate: this.controls.enableRotate
    };
    
    // Disable ALL controls functionalities during drag
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableRotate = false;
    
    // Create grid highlights
    this.createGridHighlights();
  }
  
  // Update rack position during drag
  updateRackDrag() {
    if (!this.rackDragMode || !this.draggedRack) return;
    
    // Create a ray from the camera through the mouse
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find intersection with the ground plane
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
    
    if (intersectionPoint) {
      // Apply the offset to the intersection point
      intersectionPoint.sub(this.dragOffset);
      
      // Keep Y position constant
      intersectionPoint.y = this.dragStartPosition.y;
      
      // Move the rack to the new position
      this.draggedRack.container.position.copy(intersectionPoint);
      
      // Calculate the grid cell
      const cellSize = this.datacenter.cellSize;
      const halfWidth = this.datacenter.gridSize.width * cellSize / 2;
      const halfHeight = this.datacenter.gridSize.height * cellSize / 2;
      
      const gridX = Math.round((intersectionPoint.x + halfWidth - cellSize/2) / cellSize);
      const gridZ = Math.round((intersectionPoint.z + halfHeight - cellSize/2) / cellSize);
      
      // Check if the position is valid
      const isValid = this.datacenter.isGridPositionAvailable(gridX, gridZ, this.draggedRack.container.userData.id);
      
      // Update the grid highlights
      this.updateGridHighlights(gridX, gridZ, isValid);
      
      // Store the target grid position for drop
      this.targetGridPosition = { x: gridX, z: gridZ, valid: isValid };
    }
  }
  
  // Drop the rack at its current position
  dropRack() {
    if (!this.rackDragMode || !this.draggedRack) return;
    
    // Get the target grid position
    const target = this.targetGridPosition;
    
    if (target && target.valid) {
      // Update the rack position in the datacenter
      this.datacenter.moveRack(this.draggedRack, target.x, target.z);
      console.log('Rack moved successfully to new position');
    } else {
      // Invalid position, return to the original position
      this.draggedRack.container.position.copy(this.dragStartPosition);
      console.log('Invalid position, returning rack to original position');
    }
    
    // Clean up
    this.rackDragMode = false;
    
    // Keep a reference to the rack we just dropped for debugging
    const droppedRack = this.draggedRack;
    this.draggedRack = null;
    this.targetGridPosition = null;
    
    // Check rack userData after drop to ensure it's properly maintained
    console.log('Dropped rack userData:', droppedRack.container.userData);
    
    // Restore original control states
    if (this.originalControlsState) {
      this.controls.enabled = this.originalControlsState.enabled;
      this.controls.enablePan = this.originalControlsState.enablePan;
      this.controls.enableZoom = this.originalControlsState.enableZoom;
      this.controls.enableRotate = this.originalControlsState.enableRotate;
      this.originalControlsState = null;
    } else {
      // Fallback if original state wasn't saved
      this.controls.enabled = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.enableRotate = true;
    }
    
    // Remove grid highlights
    this.removeGridHighlights();
    
    // Update any connections
    if (this.cableManager) {
      this.cableManager.updateAllCables();
    }
    
    // Delay for a small amount of time to ensure all state is updated before user can interact again
    setTimeout(() => {
      console.log('Rack drag/drop operation fully complete');
    }, 50);
  }
  
  // Create visual grid highlights for rack placement
  // Create grid highlights for rack dragging
  createGridHighlights() {
    // Remove any existing highlights
    this.removeGridHighlights();
    
    // Create a highlight for each grid cell
    const gridSize = this.datacenter.gridSize;
    const cellSize = this.datacenter.cellSize;
    
    for (let x = 0; x < gridSize.width; x++) {
      for (let z = 0; z < gridSize.height; z++) {
        // Only create a highlight if the position is available
        if (this.datacenter.isGridPositionAvailable(x, z, this.draggedRack?.container.userData.id)) {
          const highlight = new THREE.Mesh(
            new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9),
            new THREE.MeshBasicMaterial({
              color: 0x4CAF50, // Green
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide
            })
          );
          
          // Position the highlight
          const posX = (x * cellSize) - (gridSize.width * cellSize / 2) + (cellSize / 2);
          const posZ = (z * cellSize) - (gridSize.height * cellSize / 2) + (cellSize / 2);
          highlight.position.set(posX, 0.1, posZ); // Slightly above ground
          highlight.rotation.x = -Math.PI / 2; // Flat on the ground
          
          // Store the grid position in userData
          highlight.userData = { gridX: x, gridZ: z, type: 'highlight' };
          
          this.gridHighlights.push(highlight);
          this.scene.add(highlight);
        }
      }
    }
  }
  
  // Create grid highlights for rack placement mode
  showGridHighlightsForPlacement() {
    // Remove any existing highlights
    this.removeGridHighlights();
    
    // Create a highlight for each available grid cell
    const gridSize = this.datacenter.gridSize;
    const cellSize = this.datacenter.cellSize;
    
    for (let x = 0; x < gridSize.width; x++) {
      for (let z = 0; z < gridSize.height; z++) {
        // Only create a highlight if the position is available
        if (this.datacenter.isGridPositionAvailable(x, z)) {
          const highlight = new THREE.Mesh(
            new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9),
            new THREE.MeshBasicMaterial({
              color: 0x4CAF50, // Green
              transparent: true,
              opacity: 0.5, // More visible for placement mode
              side: THREE.DoubleSide
            })
          );
          
          // Position the highlight
          const posX = (x * cellSize) - (gridSize.width * cellSize / 2) + (cellSize / 2);
          const posZ = (z * cellSize) - (gridSize.height * cellSize / 2) + (cellSize / 2);
          highlight.position.set(posX, 0.1, posZ); // Slightly above ground
          highlight.rotation.x = -Math.PI / 2; // Flat on the ground
          
          // Store the grid position in userData and mark as clickable
          highlight.userData = { 
            gridX: x, 
            gridZ: z, 
            type: 'placementHighlight',
            clickable: true 
          };
          
          this.gridHighlights.push(highlight);
          this.scene.add(highlight);
        }
      }
    }
  }
  
  // Update grid highlights during drag
  updateGridHighlights(gridX, gridZ, isValid) {
    // Update highlight colors based on the current position
    this.gridHighlights.forEach(highlight => {
      const isTarget = highlight.userData.gridX === gridX && highlight.userData.gridZ === gridZ;
      
      if (isTarget) {
        // Target cell gets a different color based on validity
        highlight.material.color.set(isValid ? 0x4CAF50 : 0xFF5252); // Green if valid, red if invalid
        highlight.material.opacity = 0.5; // More opaque
      } else {
        // Non-target cells
        highlight.material.color.set(0x4CAF50); // Green
        highlight.material.opacity = 0.3; // Less opaque
      }
    });
  }
  
  // Remove grid highlights
  removeGridHighlights() {
    this.gridHighlights.forEach(highlight => {
      this.scene.remove(highlight);
      highlight.geometry.dispose();
      highlight.material.dispose();
    });
    
    this.gridHighlights = [];
  }

  // Helper function for smooth animation easing
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Make sure the connection tile is created and visible
    if (!this.connectionTileChecked) {
      this.checkAndCreateConnectionTile();
      this.connectionTileChecked = true;
    }
    
    const delta = this.clock.getDelta();
    
    // Update game time
    this.updateGameTime();
    
    // Handle camera transition animation for cable mode
    if (this.cameraTransition && this.cameraTransition.active) {
      const elapsed = Date.now() - this.cameraTransition.startTime;
      const progress = Math.min(elapsed / this.cameraTransition.duration, 1.0);
      
      // Use easing function for smoother transition
      const easedProgress = this.easeInOutQuad(progress);
      
      // Interpolate position
      this.camera.position.lerpVectors(
        this.cameraTransition.startPosition,
        this.cameraTransition.targetPosition,
        easedProgress
      );
      
      // Interpolate rotation if we have rotation values
      if (this.cameraTransition.startRotation && this.cameraTransition.targetRotation) {
        this.camera.quaternion.slerpQuaternions(
          new THREE.Quaternion().setFromEuler(this.cameraTransition.startRotation),
          new THREE.Quaternion().setFromEuler(this.cameraTransition.targetRotation),
          easedProgress
        );
      }
      
      // Look at center of scene for top-down view
      if (this.cameraTransition.center) {
        this.camera.lookAt(this.cameraTransition.center);
      }
      
      // Check if transition is complete
      if (progress >= 1.0) {
        this.cameraTransition.active = false;
      }
      
      // Force controls update to sync with our manual changes
      this.controls.update();
    }
    
    // Special handling for rack dragging - completely freeze camera controls
    else if (this.rackDragMode) {
      // Do not update camera controls during rack dragging
      // This prevents any camera movement or rotation
    } 
    // Handle keyboard camera movement
    else if (this.isKeyboardNavigationActive()) {
      // If keyboard is being used, take full control of the camera
      this.controls.enabled = false;
      this.updateCameraPosition(delta);
    } 
    // Normal orbit controls mode
    else {
      // Otherwise, let OrbitControls handle camera
      this.controls.enabled = true;
      this.controls.update();
    }
    
    // Update datacenter simulation
    if (this.datacenter) {
      let revenue = 0;
      let expenses = 0;
      
      // Update each server in each rack
      for (const rack of this.datacenter.racks) {
        for (const server of rack.servers) {
          // Only count revenue for connected servers with proper connectivity
          if (server.connected) {
            // Check if the server is properly connected to a circuit via a switch
            const isProperlyConnected = this.isServerProperlyConnected(server);
            
            if (isProperlyConnected) {
              revenue += server.update(delta) || 0;
            } else {
              // Servers that are "connected" but don't have proper internet connectivity
              // generate minimal revenue
              revenue += (server.update(delta) * 0.1) || 0;
            }
          } else {
            // Servers without any connectivity generate no revenue
            server.update(delta); // Still update the server for simulation
          }
        }
      }
      
      // Update the egress router and circuits
      if (this.datacenter.egressRouter) {
        const result = this.datacenter.egressRouter.update(delta);
        expenses += result.circuitCost || 0;
      }
      
      // Update finance model to generate new customer requests
      if (this.datacenter.finance) {
        this.datacenter.finance.update(delta);
      }
      
      // Accumulate revenue and expenses
      this.accumulatedRevenue += revenue * delta * 100;
      this.accumulatedExpenses += expenses;
      this.accumulatedTime += delta;
      
      // Update time since last save for auto-save feature
      this.timeSinceLastSave += delta;
      
      // Check if it's time to update funds (every 30 seconds)
      if (this.accumulatedTime >= this.fundsUpdateInterval) {
        // Calculate net income from accumulated values
        const netIncome = this.accumulatedRevenue - this.accumulatedExpenses;
        
        // Update funds only once every 30 seconds
        this.datacenter.updateFunds(netIncome);
        
        // Reset accumulators
        this.accumulatedRevenue = 0;
        this.accumulatedExpenses = 0;
        this.accumulatedTime = 0;
        
        console.log(`Funds updated after ${this.fundsUpdateInterval} seconds: $${netIncome.toFixed(2)}`);
      }
      
      // Always update datacenter stats (power, temperature, utilization)
      this.datacenter.updateStats();
      
      // Always update UI stats
      if (this.ui) {
        this.ui.updateMenuStats();
      }
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Auto-save the game periodically
  autoSave() {
    if (this.timeSinceLastSave >= this.autoSaveInterval) {
      console.log("Auto-saving game...");
      this.saveGame(0); // Use slot 0 for auto-saves
      this.timeSinceLastSave = 0;
      
      // Show a notification to the user
      if (this.ui) {
        this.ui.showStatusMessage("Game auto-saved", 3000);
      }
    }
  }
  
  // Check for existing saved games
  checkForSavedGames() {
    // Check for autosave
    const autoSaveKey = `${this.saveName}_autosave`;
    const autoSaveData = localStorage.getItem(autoSaveKey);
    
    if (autoSaveData) {
      console.log("Found auto-save data");
    }
    
    // Check all save slots
    const saveData = [];
    for (let i = 1; i <= this.saveSlots; i++) {
      const key = `${this.saveName}_slot${i}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          saveData.push({
            slot: i,
            timestamp: parsed.timestamp,
            funds: parsed.datacenter.funds,
            racks: parsed.datacenter.racks.length
          });
          console.log(`Found save data in slot ${i} from ${new Date(parsed.timestamp).toLocaleString()}`);
        } catch (e) {
          console.error(`Error parsing save data in slot ${i}:`, e);
        }
      }
    }
    
    // Store available save data for UI to display
    this.availableSaves = saveData;
    return saveData.length > 0;
  }
  
  // Save game data to localStorage
  saveGame(slot = this.currentSaveSlot) {
    try {
      // Create a key for this save slot
      const key = slot === 0 ? `${this.saveName}_autosave` : `${this.saveName}_slot${slot}`;
      
      // Collect game state
      const gameState = this.collectGameState();
      
      // Store in localStorage
      localStorage.setItem(key, JSON.stringify(gameState));
      
      // Update metadata for the save
      const metaKey = `${this.saveName}_meta`;
      const metadata = JSON.parse(localStorage.getItem(metaKey) || '{}');
      metadata[slot] = {
        timestamp: gameState.timestamp,
        funds: gameState.datacenter.funds,
        racks: gameState.datacenter.racks.length
      };
      localStorage.setItem(metaKey, JSON.stringify(metadata));
      
      console.log(`Game saved to slot ${slot}`);
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      return false;
    }
  }
  
  // Load game data from localStorage
  loadGame(slot = this.currentSaveSlot) {
    try {
      // Create a key for this save slot
      const key = slot === 0 ? `${this.saveName}_autosave` : `${this.saveName}_slot${slot}`;
      
      // Get saved data
      const saveData = localStorage.getItem(key);
      if (!saveData) {
        console.error(`No save data found in slot ${slot}`);
        return false;
      }
      
      // Parse saved data
      const gameState = JSON.parse(saveData);
      
      // Apply game state
      this.applyGameState(gameState);
      
      console.log(`Game loaded from slot ${slot}`);
      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      return false;
    }
  }
  
  // Delete saved game
  deleteSave(slot = this.currentSaveSlot) {
    try {
      // Create a key for this save slot
      const key = slot === 0 ? `${this.saveName}_autosave` : `${this.saveName}_slot${slot}`;
      
      // Remove from localStorage
      localStorage.removeItem(key);
      
      // Update metadata
      const metaKey = `${this.saveName}_meta`;
      const metadata = JSON.parse(localStorage.getItem(metaKey) || '{}');
      delete metadata[slot];
      localStorage.setItem(metaKey, JSON.stringify(metadata));
      
      console.log(`Deleted save in slot ${slot}`);
      return true;
    } catch (error) {
      console.error("Error deleting save:", error);
      return false;
    }
  }
  
  // Collect current game state for saving
  collectGameState() {
    const gameState = {
      version: "1.0",
      timestamp: Date.now(),
      datacenter: {
        funds: this.datacenter.funds,
        powerUsage: this.datacenter.powerUsage,
        temperature: this.datacenter.temperature,
        circuitUtilization: this.datacenter.circuitUtilization,
        racks: this.datacenter.racks.map(rack => this.serializeRack(rack)),
        egressRouter: this.datacenter.egressRouter ? this.serializeEgressRouter(this.datacenter.egressRouter) : null
      },
      camera: {
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        },
        rotation: {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
          z: this.camera.rotation.z
        }
      }
    };
    
    return gameState;
  }
  
  // Helper methods to serialize objects for saving
  serializeRack(rack) {
    return {
      id: rack.id,
      name: rack.name,
      gridX: rack.gridX,
      gridZ: rack.gridZ,
      powerCapacity: rack.powerCapacity,
      powerAvailable: rack.powerAvailable,
      temperature: rack.temperature,
      servers: rack.servers.map(server => this.serializeServer(server)),
      networkEquipment: rack.networkEquipment.map(equipment => this.serializeNetworkEquipment(equipment))
    };
  }
  
  serializeServer(server) {
    return {
      id: server.id,
      name: server.name,
      position: server.position,
      unitSize: server.unitSize,
      powerConsumption: server.powerConsumption,
      temperature: server.temperature,
      connected: server.connected,
      ipAddress: server.ipAddress,
      revenue: server.revenue,
      specs: server.specs || {}
    };
  }
  
  serializeNetworkEquipment(equipment) {
    return {
      id: equipment.id,
      type: equipment.type,
      name: equipment.name,
      position: equipment.position,
      unitSize: equipment.unitSize,
      powerConsumption: equipment.powerConsumption,
      temperature: equipment.temperature,
      ports: equipment.ports.map(port => ({
        id: port.id,
        type: port.type,
        connected: port.connected,
        connectedTo: port.connectedTo
      })),
      specs: equipment.specs || {}
    };
  }
  
  serializeEgressRouter(router) {
    return {
      id: router.id,
      name: router.name || "Egress Router",
      circuits: router.circuits.map(circuit => ({
        id: circuit.id,
        type: circuit.type,
        bandwidth: circuit.bandwidth,
        cost: circuit.cost,
        utilization: circuit.utilization
      }))
    };
  }
  
  // Apply loaded game state
  applyGameState(gameState) {
    // Check version compatibility
    if (gameState.version !== "1.0") {
      console.warn(`Save version ${gameState.version} may not be fully compatible with current game version`);
    }
    
    // Clear current datacenter
    this.scene.remove(this.datacenter.container);
    
    // Recreate datacenter
    this.initDatacenter();
    
    // Apply datacenter properties
    this.datacenter.funds = gameState.datacenter.funds;
    this.datacenter.powerUsage = gameState.datacenter.powerUsage;
    this.datacenter.temperature = gameState.datacenter.temperature;
    this.datacenter.circuitUtilization = gameState.datacenter.circuitUtilization;
    
    // Clear initial racks
    for (const rack of [...this.datacenter.racks]) {
      this.datacenter.container.remove(rack.container);
    }
    this.datacenter.racks = [];
    
    // Recreate racks with equipment
    for (const rackData of gameState.datacenter.racks) {
      this.recreateRack(rackData);
    }
    
    // Restore egress router if present
    if (gameState.datacenter.egressRouter) {
      this.recreateEgressRouter(gameState.datacenter.egressRouter);
    }
    
    // Restore camera position
    if (gameState.camera) {
      this.camera.position.set(
        gameState.camera.position.x,
        gameState.camera.position.y,
        gameState.camera.position.z
      );
      this.camera.rotation.set(
        gameState.camera.rotation.x,
        gameState.camera.rotation.y,
        gameState.camera.rotation.z
      );
      this.controls.update();
    }
    
    // Update UI
    if (this.ui) {
      this.ui.updateMenuStats();
    }
    
    // Show notification
    if (this.ui) {
      this.ui.showStatusMessage("Game loaded successfully", 3000);
    }
  }
  
  // Helper methods to recreate objects from save data
  recreateRack(rackData) {
    // Add a new empty rack at the saved position
    const rack = this.datacenter.addRack(rackData.gridX, rackData.gridZ, true);
    
    if (!rack) {
      console.error(`Failed to create rack at position (${rackData.gridX}, ${rackData.gridZ})`);
      return null;
    }
    
    // Update rack properties
    rack.id = rackData.id; // Restore the original ID
    rack.name = rackData.name;
    rack.powerCapacity = rackData.powerCapacity;
    rack.powerAvailable = rackData.powerAvailable;
    rack.temperature = rackData.temperature;
    
    // Update rack name label
    rack.updateRackName(rackData.name);
    
    // Recreate servers
    for (const serverData of rackData.servers) {
      this.recreateServer(rack, serverData);
    }
    
    // Recreate network equipment
    for (const equipmentData of rackData.networkEquipment) {
      this.recreateNetworkEquipment(rack, equipmentData);
    }
    
    return rack;
  }
  
  recreateServer(rack, serverData) {
    // Add server to rack
    const server = rack.addServer(serverData.position, serverData.unitSize, serverData.name);
    
    if (!server) {
      console.error(`Failed to add server to rack at position ${serverData.position}`);
      return null;
    }
    
    // Restore server properties
    server.id = serverData.id; // Restore original ID
    server.powerConsumption = serverData.powerConsumption;
    server.temperature = serverData.temperature;
    server.connected = serverData.connected;
    server.ipAddress = serverData.ipAddress;
    server.revenue = serverData.revenue;
    server.specs = serverData.specs || {};
    
    return server;
  }
  
  recreateNetworkEquipment(rack, equipmentData) {
    // Add network equipment to rack
    const equipment = rack.addNetworkEquipment(
      equipmentData.type, 
      equipmentData.position, 
      equipmentData.specs || {}
    );
    
    if (!equipment) {
      console.error(`Failed to add ${equipmentData.type} to rack at position ${equipmentData.position}`);
      return null;
    }
    
    // Restore equipment properties
    equipment.id = equipmentData.id; // Restore original ID
    equipment.name = equipmentData.name;
    equipment.powerConsumption = equipmentData.powerConsumption;
    equipment.temperature = equipmentData.temperature;
    
    // Restore port connections (references will need to be fixed in a second pass)
    equipment.ports.forEach((port, index) => {
      if (index < equipmentData.ports.length) {
        port.connected = equipmentData.ports[index].connected;
        port.connectedTo = equipmentData.ports[index].connectedTo;
      }
    });
    
    return equipment;
  }
  
  recreateEgressRouter(routerData) {
    // Assuming egress router already exists in datacenter initialization
    if (!this.datacenter.egressRouter) {
      console.error("No egress router found in datacenter");
      return null;
    }
    
    // Update properties
    this.datacenter.egressRouter.id = routerData.id;
    
    // Clear existing circuits
    this.datacenter.egressRouter.circuits = [];
    
    // Recreate circuits
    for (const circuitData of routerData.circuits) {
      const circuit = this.datacenter.egressRouter.addCircuit(
        circuitData.type,
        circuitData.bandwidth
      );
      
      if (circuit) {
        circuit.id = circuitData.id;
        circuit.cost = circuitData.cost;
        circuit.utilization = circuitData.utilization;
      }
    }
    
    return this.datacenter.egressRouter;
  }
  
  // Check if keyboard navigation is currently active
  isKeyboardNavigationActive() {
    // Don't use keyboard navigation in these situations:
    // 1. In cable mode
    // 2. If a modal is open
    // 3. If the user is dragging a rack
    if (this.cableMode || 
        this.ui?.modalOverlay?.style.display === 'flex' ||
        this.rackDragMode || 
        this.isMouseDown) {
      return false;
    }
    
    // Check if any movement keys are pressed
    const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    return movementKeys.some(key => this.keyStates[key]);
  }
  
  // Update camera position based on keyboard input
  updateCameraPosition(delta) {
    // Calculate a simpler movement based on camera's current orientation
    const moveSpeed = this.moveSpeed * delta;
    
    // Get forward and right directions
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    
    // Remove Y component to keep movement horizontal
    forward.y = 0;
    forward.normalize();
    right.y = 0;
    right.normalize();
    
    // Apply movement based on keys pressed
    if (this.keyStates['w'] || this.keyStates['W'] || this.keyStates['ArrowUp']) {
      this.camera.position.addScaledVector(forward, moveSpeed);
      console.log("Moving forward");
    }
    
    if (this.keyStates['s'] || this.keyStates['S'] || this.keyStates['ArrowDown']) {
      this.camera.position.addScaledVector(forward, -moveSpeed);
      console.log("Moving backward");
    }
    
    if (this.keyStates['a'] || this.keyStates['A'] || this.keyStates['ArrowLeft']) {
      this.camera.position.addScaledVector(right, -moveSpeed);
      console.log("Moving left");
    }
    
    if (this.keyStates['d'] || this.keyStates['D'] || this.keyStates['ArrowRight']) {
      this.camera.position.addScaledVector(right, moveSpeed);
      console.log("Moving right");
    }
    
    // Apply height limits
    this.camera.position.y = Math.max(this.cameraMinHeight, 
                                    Math.min(this.cameraMaxHeight, 
                                           this.camera.position.y));
    
    // Apply horizontal boundaries
    this.camera.position.x = Math.max(this.datacenterBounds.minX, 
                                    Math.min(this.datacenterBounds.maxX, 
                                           this.camera.position.x));
    
    this.camera.position.z = Math.max(this.datacenterBounds.minZ, 
                                    Math.min(this.datacenterBounds.maxZ, 
                                           this.camera.position.z));
                                           
    // Set the look target 10 units in front of the camera
    const lookTarget = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .multiplyScalar(10)
      .add(this.camera.position);
    
    // Keep the camera looking slightly downward
    lookTarget.y = Math.max(0, this.camera.position.y - 5);
    
    // Update the orbit controls target
    this.controls.target.copy(lookTarget);
  }
  
  // Check if a server is properly connected to internet
  isServerProperlyConnected(server) {
    // Server needs to be connected to a switch
    // Switch needs to be connected to the egress router
    // Egress router needs to have at least one active circuit
    
    // First check if the egress router has any circuits
    if (!this.datacenter.egressRouter || this.datacenter.egressRouter.circuits.length === 0) {
      return false;
    }
    
    // This is a placeholder - in reality, we would need to trace the connection path
    // from server -> switch -> router -> circuit
    // For now, just assume if the server has an IP address, it's properly connected
    return server.ipAddress !== null && server.ipAddress !== undefined;
  }
  
  // Update the game time based on real time and time scale
  updateGameTime() {
    if (this.gameTime.isPaused) return;
    
    const delta = this.clock.getDelta();
    const gameMinutesElapsed = delta * this.gameTime.timeScale;
    
    // Update the current date
    const newDate = new Date(this.gameTime.currentDate);
    newDate.setMinutes(newDate.getMinutes() + gameMinutesElapsed);
    this.gameTime.currentDate = newDate;
    
    // Update UI if date has changed
    if (this.ui && (newDate.getDate() !== this.gameTime.lastUIUpdate?.getDate() ||
        newDate.getMonth() !== this.gameTime.lastUIUpdate?.getMonth() ||
        newDate.getFullYear() !== this.gameTime.lastUIUpdate?.getFullYear() ||
        !this.gameTime.lastUIUpdate)) {
      this.ui.updateDateDisplay(this.gameTime.currentDate);
      this.gameTime.lastUIUpdate = new Date(newDate);
      
      // If month changed, generate monthly financial statement
      if (!this.gameTime.lastMonthProcessed || 
          newDate.getMonth() !== this.gameTime.lastMonthProcessed.getMonth() ||
          newDate.getFullYear() !== this.gameTime.lastMonthProcessed.getFullYear()) {
        this.processMonthEnd();
        this.gameTime.lastMonthProcessed = new Date(newDate);
      }
    }
  }
  
  // Process month-end financial settlement
  processMonthEnd() {
    if (!this.datacenter || !this.datacenter.finance) return;
    
    const previousMonth = new Date(this.gameTime.currentDate);
    previousMonth.setDate(0); // Go to the last day of the previous month
    
    const monthName = previousMonth.toLocaleString('default', { month: 'long' });
    const year = previousMonth.getFullYear();
    
    console.log(`Processing month-end for ${monthName} ${year}`);
    
    // Generate a monthly financial statement
    const finance = this.datacenter.finance;
    const statement = finance.generateMonthlyStatement(previousMonth);
    
    // Apply financial effects
    // 1. Charge for monthly expenses
    this.datacenter.updateFunds(-statement.expenses);
    
    // 2. Add monthly revenue
    this.datacenter.updateFunds(statement.revenue);
    
    // 3. Auto-save the game state after month-end processing
    this.saveGame(0); // Use slot 0 for auto-saves
    
    // Show a notification
    if (this.ui) {
      this.ui.showStatusMessage(`Financial statement for ${monthName} ${year} generated (Profit: $${statement.profit.toFixed(2)})`, 5000);
    }
    
    return statement;
  }
  
  // Set the game time scale
  setTimeScale(scale) {
    this.gameTime.timeScale = scale;
    console.log(`Game time scale set to ${scale}x`);
    return this.gameTime.timeScale;
  }
  
  // Pause/unpause the game time
  togglePauseTime() {
    this.gameTime.isPaused = !this.gameTime.isPaused;
    console.log(`Game time ${this.gameTime.isPaused ? 'paused' : 'resumed'}`);
    return this.gameTime.isPaused;
  }
}