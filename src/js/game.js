import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Datacenter } from './datacenter.js';
import { UI } from './ui.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.datacenter = null;
    this.ui = null;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.isMouseDown = false;
    this.selectedObject = null;
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initDatacenter();
    this.initUI();
    this.initEventListeners();
    this.animate();
  }
  
  initUI() {
    this.ui = new UI(this);
    this.ui.init();
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
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onMouseDown(event) {
    this.isMouseDown = true;
    this.handleSelection();
  }

  onMouseUp(event) {
    this.isMouseDown = false;
  }

  handleSelection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.datacenter.container.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.selectedObject = object;
      
      // Handle object selection logic here
      if (object.userData.type === 'rack') {
        console.log('Rack selected', object);
        // Open rack view UI
      } else if (object.userData.type === 'server') {
        console.log('Server selected', object);
        // Show server details
      }
    } else {
      this.selectedObject = null;
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    // Update controls
    this.controls.update();
    
    // Update datacenter simulation
    if (this.datacenter) {
      let revenue = 0;
      
      // Update each server in each rack
      for (const rack of this.datacenter.racks) {
        for (const server of rack.servers) {
          revenue += server.update(delta) || 0;
        }
      }
      
      // Add revenue (scaled to make gameplay more interesting)
      if (revenue > 0) {
        this.datacenter.updateFunds(revenue * delta * 100);
      }
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}