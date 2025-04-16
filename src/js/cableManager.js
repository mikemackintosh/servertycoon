import * as THREE from 'three';
import { CABLE_TYPES } from './networkEquipment.js';

export class CableManager {
  constructor(game) {
    this.game = game;
    this.cables = [];
    this.container = new THREE.Group();
    
    // UI state
    this.isDragging = false;
    this.sourceEquipment = null;
    this.sourcePort = null;
    this.tempCable = null;
    
    // Cable visual properties
    this.cableRadius = 0.02;
    this.cableSegments = 16;
    this.cableTension = 0.5;
  }
  
  init() {
    // Add cable container to scene
    this.game.scene.add(this.container);
  }
  
  // Start drawing a cable from a port
  startCable(equipment, portId) {
    this.sourceEquipment = equipment;
    this.sourcePort = equipment.ports[portId - 1];
    this.isDragging = true;
    
    // Create a temporary cable for visual feedback
    const cableGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0.1)
      ]),
      20,
      this.cableRadius,
      this.cableSegments,
      false
    );
    
    // Get color from default cable type
    const cableColor = CABLE_TYPES.COPPER.color;
    
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: cableColor,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.tempCable = new THREE.Mesh(cableGeometry, cableMaterial);
    this.container.add(this.tempCable);
    
    return true;
  }
  
  // Update the temporary cable endpoint during dragging
  updateDraggedCable(x, y, z) {
    if (!this.isDragging || !this.tempCable) return;
    
    // Get source port position in world space
    const sourcePortMesh = this.sourceEquipment.meshes.ports[this.sourcePort.id - 1];
    const sourcePosition = new THREE.Vector3();
    sourcePortMesh.getWorldPosition(sourcePosition);
    
    // Create a curve from source to current mouse position
    const path = new THREE.CatmullRomCurve3([
      sourcePosition,
      new THREE.Vector3(
        (sourcePosition.x + x) / 2,
        sourcePosition.y + 0.3, // Add some height for a nice arc
        (sourcePosition.z + z) / 2
      ),
      new THREE.Vector3(x, y, z)
    ]);
    
    // Update the cable geometry
    const geometry = new THREE.TubeGeometry(
      path,
      20,
      this.cableRadius,
      this.cableSegments,
      false
    );
    
    this.tempCable.geometry.dispose();
    this.tempCable.geometry = geometry;
  }
  
  // Complete cable connection to target port
  completeCable(targetEquipment, targetPortId) {
    if (!this.isDragging || !this.sourceEquipment || !this.sourcePort) {
      console.error('No active cable drag operation');
      return false;
    }
    
    // Check if we can connect these ports
    const canConnect = this.sourceEquipment.connectCable(
      this.sourcePort.id,
      targetEquipment,
      targetPortId,
      'COPPER' // Default to copper
    );
    
    if (!canConnect) {
      this.cancelCable();
      return false;
    }
    
    // Remove temporary cable
    if (this.tempCable) {
      this.container.remove(this.tempCable);
      this.tempCable.geometry.dispose();
      this.tempCable.material.dispose();
      this.tempCable = null;
    }
    
    // Create a permanent cable
    this.createCableVisual(
      this.sourceEquipment,
      this.sourcePort.id,
      targetEquipment,
      targetPortId,
      'COPPER'
    );
    
    // Reset state
    this.isDragging = false;
    this.sourceEquipment = null;
    this.sourcePort = null;
    
    return true;
  }
  
  // Cancel cable drawing operation
  cancelCable() {
    if (this.tempCable) {
      this.container.remove(this.tempCable);
      this.tempCable.geometry.dispose();
      this.tempCable.material.dispose();
      this.tempCable = null;
    }
    
    this.isDragging = false;
    this.sourceEquipment = null;
    this.sourcePort = null;
  }
  
  // Create a visual representation of a cable
  createCableVisual(sourceEquipment, sourcePortId, targetEquipment, targetPortId, cableType = 'COPPER') {
    // Get source port position in world space
    const sourcePortMesh = sourceEquipment.meshes.ports[sourcePortId - 1];
    const sourcePosition = new THREE.Vector3();
    sourcePortMesh.getWorldPosition(sourcePosition);
    
    // Get target port position in world space
    const targetPortMesh = targetEquipment.meshes.ports[targetPortId - 1];
    const targetPosition = new THREE.Vector3();
    targetPortMesh.getWorldPosition(targetPosition);
    
    // Create middle control point for curved cable
    const midPoint = new THREE.Vector3(
      (sourcePosition.x + targetPosition.x) / 2,
      Math.max(sourcePosition.y, targetPosition.y) + 0.2, // Add some height for a nice arc
      (sourcePosition.z + targetPosition.z) / 2
    );
    
    // Create a curve from source to target
    const path = new THREE.CatmullRomCurve3([
      sourcePosition,
      midPoint,
      targetPosition
    ]);
    
    // Create cable geometry
    const geometry = new THREE.TubeGeometry(
      path,
      20,
      this.cableRadius,
      this.cableSegments,
      false
    );
    
    // Get color from cable type
    const cableColor = CABLE_TYPES[cableType].color;
    
    const material = new THREE.MeshStandardMaterial({
      color: cableColor,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const cable = new THREE.Mesh(geometry, material);
    cable.userData = {
      type: 'cable',
      sourceEquipmentId: sourceEquipment.id,
      sourcePortId: sourcePortId,
      targetEquipmentId: targetEquipment.id,
      targetPortId: targetPortId,
      cableType: cableType
    };
    
    this.cables.push({
      id: Math.random().toString(36).substr(2, 9),
      sourceEquipmentId: sourceEquipment.id,
      sourcePortId: sourcePortId,
      targetEquipmentId: targetEquipment.id,
      targetPortId: targetPortId,
      cableType: cableType,
      mesh: cable
    });
    
    this.container.add(cable);
    return cable;
  }
  
  // Remove a cable by equipment and port ID
  removeCable(equipmentId, portId) {
    const cableIndex = this.cables.findIndex(cable => 
      (cable.sourceEquipmentId === equipmentId && cable.sourcePortId === portId) ||
      (cable.targetEquipmentId === equipmentId && cable.targetPortId === portId)
    );
    
    if (cableIndex === -1) {
      console.error('Cable not found');
      return false;
    }
    
    const cable = this.cables[cableIndex];
    
    // Find the equipment objects
    const sourceEquipment = this.game.findEquipmentById(cable.sourceEquipmentId);
    if (sourceEquipment) {
      sourceEquipment.disconnectCable(cable.sourcePortId);
    }
    
    // Remove the cable mesh
    this.container.remove(cable.mesh);
    cable.mesh.geometry.dispose();
    cable.mesh.material.dispose();
    
    // Remove from cables array
    this.cables.splice(cableIndex, 1);
    
    return true;
  }
  
  // Update all cables to match equipment positions (e.g. after moving equipment)
  updateAllCables() {
    this.cables.forEach(cable => {
      // Find the equipment objects
      const sourceEquipment = this.game.findEquipmentById(cable.sourceEquipmentId);
      const targetEquipment = this.game.findEquipmentById(cable.targetEquipmentId);
      
      if (!sourceEquipment || !targetEquipment) {
        return;
      }
      
      // Get port positions
      const sourcePortMesh = sourceEquipment.meshes.ports[cable.sourcePortId - 1];
      const targetPortMesh = targetEquipment.meshes.ports[cable.targetPortId - 1];
      
      const sourcePosition = new THREE.Vector3();
      const targetPosition = new THREE.Vector3();
      
      sourcePortMesh.getWorldPosition(sourcePosition);
      targetPortMesh.getWorldPosition(targetPosition);
      
      // Create middle control point for curved cable
      const midPoint = new THREE.Vector3(
        (sourcePosition.x + targetPosition.x) / 2,
        Math.max(sourcePosition.y, targetPosition.y) + 0.2,
        (sourcePosition.z + targetPosition.z) / 2
      );
      
      // Update cable path
      const path = new THREE.CatmullRomCurve3([
        sourcePosition,
        midPoint,
        targetPosition
      ]);
      
      // Update geometry
      const newGeometry = new THREE.TubeGeometry(
        path,
        20,
        this.cableRadius,
        this.cableSegments,
        false
      );
      
      cable.mesh.geometry.dispose();
      cable.mesh.geometry = newGeometry;
    });
  }
}