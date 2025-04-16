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
    
    // Fund update timer variables
    this.fundsUpdateInterval = 30; // Update funds every 30 seconds
    this.accumulatedTime = 0; // Track accumulated time between updates
    this.accumulatedRevenue = 0; // Track accumulated revenue between updates
    this.accumulatedExpenses = 0; // Track accumulated expenses between updates
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
    this.animate();
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
    if (!active && this.cableDragging) {
      // Cancel any active cable dragging when exiting cable mode
      this.cableManager.cancelCable();
      this.cableDragging = false;
      this.draggedCable = null;
    }
    
    // Disable controls when in cable mode
    if (active) {
      this.controls.enabled = false;
    } else {
      this.controls.enabled = true;
    }
    
    console.log(`Cable management mode ${active ? 'enabled' : 'disabled'}`);
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
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
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

  onMouseMove(event) {
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
    // Toggle cable mode with 'C' key
    if (event.key === 'c' || event.key === 'C') {
      this.toggleCableMode(true);
    }
    
    // Cancel cable drag with Escape key
    if (event.key === 'Escape' && this.cableMode && this.cableDragging) {
      this.cableManager.cancelCable();
      this.cableDragging = false;
    }
  }
  
  onKeyUp(event) {
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
        
        // Find the rack
        const rack = this.findRackByObject(currentObj);
        
        if (rack) {
          console.log('Found rack object:', rack.id);
        } else {
          console.log('Could not find rack from object');
        }
        
        // Check if it's a movable rack (long click for drag, short click for view)
        if (userData.movable) {
          // Create a timer to check if this is a click or a drag
          this.clickStartTime = new Date().getTime();
          this.clickStartPosition = { ...this.mouse };
          this.clickTarget = currentObj;
          this.clickPoint = intersects[0].point;
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
    
    const rack = this.datacenter.racks.find(r => 
      r.container === rackContainer || 
      (r.gridX === rackContainer.userData.gridX && r.gridZ === rackContainer.userData.gridZ)
    );
    
    if (!rack) {
      console.error('Could not find rack data for dragging');
      return;
    }
    
    console.log('Starting rack drag for rack', rack);
    this.rackDragMode = true;
    this.draggedRack = rack;
    
    // Disable orbit controls while dragging
    this.controls.enabled = false;
    
    // Store the start position of the dragged rack
    this.dragStartPosition.copy(rack.container.position);
    
    // Calculate the drag offset
    this.dragOffset.set(
      intersectionPoint.x - rack.container.position.x,
      0, // Y offset is always 0 since we're dragging on the ground
      intersectionPoint.z - rack.container.position.z
    );
    
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
    } else {
      // Invalid position, return to the original position
      this.draggedRack.container.position.copy(this.dragStartPosition);
    }
    
    // Clean up
    this.rackDragMode = false;
    this.draggedRack = null;
    this.targetGridPosition = null;
    this.controls.enabled = true;
    
    // Remove grid highlights
    this.removeGridHighlights();
    
    // Update any connections
    if (this.cableManager) {
      this.cableManager.updateAllCables();
    }
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

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    // Update controls
    this.controls.update();
    
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
      
      // Accumulate revenue and expenses
      this.accumulatedRevenue += revenue * delta * 100;
      this.accumulatedExpenses += expenses;
      this.accumulatedTime += delta;
      
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
}