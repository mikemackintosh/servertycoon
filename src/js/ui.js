import { CIRCUIT_TYPES } from './networkConnectivity.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.detailsPanel = null;
    this.modalOverlay = null;
    this.currentRack = null;
    this.selectedServer = null;
    this.rackPlacementMode = false;
    this.statusMessage = null;
    this.statusTimeout = null;
  }
  
  init() {
    // Initialize draggable panels tracking array
    this.draggablePanels = [];
    
    this.createUIContainer();
    this.createMenuBar(); // Add Windows 2000 style menu bar
    this.createDetailsPanel();
    this.createModalOverlay();
    this.update();
  }
  
  // Create Windows 2000 style menu bar
  createMenuBar() {
    // Create menu bar container
    this.menuBar = document.createElement('div');
    this.menuBar.style.position = 'fixed';
    this.menuBar.style.top = '0';
    this.menuBar.style.left = '0';
    this.menuBar.style.width = '100%';
    this.menuBar.style.height = '24px';
    this.menuBar.style.backgroundColor = '#d4d0c8'; // Windows 2000 gray
    this.menuBar.style.borderBottom = '1px solid #808080';
    this.menuBar.style.display = 'flex';
    this.menuBar.style.justifyContent = 'space-between';
    this.menuBar.style.zIndex = '100';
    this.menuBar.style.fontFamily = 'Tahoma, Arial, sans-serif';
    this.menuBar.style.fontSize = '11px';
    document.body.appendChild(this.menuBar);
    
    // Create left side with menus
    const menuItems = document.createElement('div');
    menuItems.style.display = 'flex';
    menuItems.style.height = '100%';
    this.menuBar.appendChild(menuItems);
    
    // Add menu items
    const menus = ['File', 'Edit', 'View', 'Tools', 'Help'];
    menus.forEach(menuName => {
      const menuItem = document.createElement('div');
      menuItem.textContent = menuName;
      menuItem.style.padding = '4px 10px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.display = 'flex';
      menuItem.style.alignItems = 'center';
      
      // Add hover effect
      menuItem.addEventListener('mouseover', () => {
        menuItem.style.backgroundColor = '#0000a5'; // Windows blue when hovered
        menuItem.style.color = '#ffffff';
      });
      
      menuItem.addEventListener('mouseout', () => {
        menuItem.style.backgroundColor = '';
        menuItem.style.color = '#000000';
      });
      
      // Add click handlers for specific menus
      menuItem.addEventListener('click', () => {
        if (menuName === 'File') {
          this.showFileMenu(menuItem);
        } else if (menuName === 'View') {
          this.showViewMenu(menuItem);
        } else if (menuName === 'Tools') {
          this.showToolsMenu(menuItem);
        } else if (menuName === 'Help') {
          this.showHelpMenu(menuItem);
        }
      });
      
      menuItems.appendChild(menuItem);
    });
    
    // Create right side with stats
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.display = 'flex';
    this.statsContainer.style.alignItems = 'center';
    this.statsContainer.style.paddingRight = '10px';
    this.menuBar.appendChild(this.statsContainer);
    
    // Add stats items
    this.fundsStat = this.createStatItem('Funds: $1,000');
    this.powerStat = this.createStatItem('Power: 0W');
    this.tempStat = this.createStatItem('Temp: 22°C');
    this.circuitStat = this.createStatItem('Circuit: 0%');
    
    this.statsContainer.appendChild(this.fundsStat);
    this.statsContainer.appendChild(this.powerStat);
    this.statsContainer.appendChild(this.tempStat);
    this.statsContainer.appendChild(this.circuitStat);
  }
  
  // Create a stat display item
  createStatItem(text) {
    const item = document.createElement('div');
    item.textContent = text;
    item.style.marginLeft = '15px';
    item.style.padding = '2px 5px';
    item.style.border = '1px solid #808080';
    item.style.backgroundColor = '#ffffff';
    item.style.fontFamily = 'Tahoma, Arial, sans-serif';
    item.style.fontSize = '11px';
    return item;
  }
  
  // Update menu bar stats
  updateMenuStats() {
    if (this.game && this.game.datacenter) {
      const dc = this.game.datacenter;
      
      // Update funds display
      this.fundsStat.textContent = `Funds: $${dc.funds.toLocaleString()}`;
      
      // Update power usage
      this.powerStat.textContent = `Power: ${Math.round(dc.powerUsage)}W`;
      
      // Update temperature - turn red if too hot
      this.tempStat.textContent = `Temp: ${dc.temperature.toFixed(1)}°C`;
      if (dc.temperature > 30) {
        this.tempStat.style.color = '#ff0000';
      } else {
        this.tempStat.style.color = '#000000';
      }
      
      // Update circuit utilization
      this.circuitStat.textContent = `Circuit: ${Math.round(dc.circuitUtilization)}%`;
    }
  }
  
  // Show File menu
  showFileMenu(menuItem) {
    this.closeAllMenus();
    
    const menu = document.createElement('div');
    menu.className = 'win2k-dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.top = '24px';
    menu.style.left = menuItem.getBoundingClientRect().left + 'px';
    menu.style.backgroundColor = '#d4d0c8';
    menu.style.border = '1px solid #808080';
    menu.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.2)';
    menu.style.zIndex = '101';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const menuItems = [
      { label: 'New Game', separator: false },
      { label: 'Save Game', separator: false },
      { label: 'Load Game', separator: true },
      { label: 'Show All Windows', separator: false },
      { label: 'Hide All Windows', separator: true },
      { label: 'Exit', separator: false }
    ];
    
    menuItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.textContent = item.label;
      itemElement.style.padding = '4px 20px';
      itemElement.style.cursor = 'pointer';
      
      // Add hover effect
      itemElement.addEventListener('mouseover', () => {
        itemElement.style.backgroundColor = '#0000a5';
        itemElement.style.color = '#ffffff';
      });
      
      itemElement.addEventListener('mouseout', () => {
        itemElement.style.backgroundColor = '';
        itemElement.style.color = '#000000';
      });
      
      // Add click handlers
      itemElement.addEventListener('click', () => {
        if (item.label === 'Show All Windows') {
          this.showAllPanels();
        } else if (item.label === 'Hide All Windows') {
          this.hideAllPanels();
        } else if (item.label === 'Exit') {
          if (confirm('Are you sure you want to exit the game?')) {
            // For now just reload the page
            window.location.reload();
          }
        }
      });
      
      menu.appendChild(itemElement);
      
      // Add separator if needed
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = '#808080';
        separator.style.margin = '3px 2px';
        menu.appendChild(separator);
      }
    });
    
    document.body.appendChild(menu);
    this.activeMenu = menu;
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', this.closeAllMenus.bind(this), { once: true });
    }, 0);
  }
  
  // Show all panels
  showAllPanels() {
    if (!this.draggablePanels) return;
    
    this.draggablePanels.forEach(panel => {
      panel.style.display = panel.dataset.defaultDisplay || 'block';
    });
    
    // Arrange them nicely
    this.cascadeWindows();
  }
  
  // Hide all panels
  hideAllPanels() {
    if (!this.draggablePanels) return;
    
    this.draggablePanels.forEach(panel => {
      // Save the default display style before hiding
      if (panel.style.display !== 'none') {
        panel.dataset.defaultDisplay = panel.style.display;
      }
      panel.style.display = 'none';
    });
  }
  
  // Show Tools menu
  showToolsMenu(menuItem) {
    this.closeAllMenus();
    
    const menu = document.createElement('div');
    menu.className = 'win2k-dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.top = '24px';
    menu.style.left = menuItem.getBoundingClientRect().left + 'px';
    menu.style.backgroundColor = '#d4d0c8';
    menu.style.border = '1px solid #808080';
    menu.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.2)';
    menu.style.zIndex = '101';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const menuItems = [
      { label: 'Add Rack', separator: false },
      { label: 'Buy Circuit', separator: false },
      { label: 'Buy Server', separator: false },
      { label: 'Buy Network Equipment', separator: true },
      { label: 'Receiving Dock', separator: false },
      { label: 'Cable Management', separator: false }
    ];
    
    menuItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.textContent = item.label;
      itemElement.style.padding = '4px 20px';
      itemElement.style.cursor = 'pointer';
      
      // Add hover effect
      itemElement.addEventListener('mouseover', () => {
        itemElement.style.backgroundColor = '#0000a5';
        itemElement.style.color = '#ffffff';
      });
      
      itemElement.addEventListener('mouseout', () => {
        itemElement.style.backgroundColor = '';
        itemElement.style.color = '#000000';
      });
      
      // Add click handlers
      itemElement.addEventListener('click', () => {
        if (item.label === 'Add Rack') {
          this.toggleRackPlacementMode();
        } else if (item.label === 'Buy Circuit') {
          this.showCircuitPurchaseUI();
        } else if (item.label === 'Buy Server') {
          this.showServerPurchaseUI();
        } else if (item.label === 'Buy Network Equipment') {
          this.showNetworkEquipmentPurchaseUI();
        } else if (item.label === 'Receiving Dock') {
          this.showReceivingDockUI();
        } else if (item.label === 'Cable Management') {
          this.game.toggleCableMode(true);
        }
      });
      
      menu.appendChild(itemElement);
      
      // Add separator if needed
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = '#808080';
        separator.style.margin = '3px 2px';
        menu.appendChild(separator);
      }
    });
    
    document.body.appendChild(menu);
    this.activeMenu = menu;
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', this.closeAllMenus.bind(this), { once: true });
    }, 0);
  }
  
  // Show Help menu
  showHelpMenu(menuItem) {
    this.closeAllMenus();
    
    const menu = document.createElement('div');
    menu.className = 'win2k-dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.top = '24px';
    menu.style.left = menuItem.getBoundingClientRect().left + 'px';
    menu.style.backgroundColor = '#d4d0c8';
    menu.style.border = '1px solid #808080';
    menu.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.2)';
    menu.style.zIndex = '101';
    menu.style.minWidth = '150px';
    
    // Add menu items
    const menuItems = [
      { label: 'How to Play', separator: false },
      { label: 'Tips & Tricks', separator: true },
      { label: 'About Server Tycoon', separator: false }
    ];
    
    menuItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.textContent = item.label;
      itemElement.style.padding = '4px 20px';
      itemElement.style.cursor = 'pointer';
      
      // Add hover effect
      itemElement.addEventListener('mouseover', () => {
        itemElement.style.backgroundColor = '#0000a5';
        itemElement.style.color = '#ffffff';
      });
      
      itemElement.addEventListener('mouseout', () => {
        itemElement.style.backgroundColor = '';
        itemElement.style.color = '#000000';
      });
      
      menu.appendChild(itemElement);
      
      // Add separator if needed
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = '#808080';
        separator.style.margin = '3px 2px';
        menu.appendChild(separator);
      }
    });
    
    document.body.appendChild(menu);
    this.activeMenu = menu;
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', this.closeAllMenus.bind(this), { once: true });
    }, 0);
  }
  
  // Close all dropdown menus
  closeAllMenus() {
    const menus = document.querySelectorAll('.win2k-dropdown-menu');
    menus.forEach(menu => {
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }
    });
    this.activeMenu = null;
  }
  
  // Show View menu
  showViewMenu(menuItem) {
    this.closeAllMenus();
  }
  
  createModalOverlay() {
    // EXTREMELY BASIC implementation to ensure it works
    this.modalOverlay = document.createElement('div');
    
    // Apply styles directly to make sure they take effect
    this.modalOverlay.style.position = 'fixed';
    this.modalOverlay.style.top = '0';
    this.modalOverlay.style.left = '0';
    this.modalOverlay.style.width = '100%';
    this.modalOverlay.style.height = '100%';
    this.modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.modalOverlay.style.zIndex = '9999';
    this.modalOverlay.style.overflowY = 'auto';
    this.modalOverlay.style.display = 'none';
    this.modalOverlay.style.alignItems = 'center';
    this.modalOverlay.style.justifyContent = 'center';
    
    // Add to DOM
    document.body.appendChild(this.modalOverlay);
    
    // Close when clicking outside modal content
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });
    
    // Add a direct method to show the overlay (avoid CSS classes)
    this.modalOverlay.show = () => {
      console.log("DIRECT SHOW CALL");
      this.modalOverlay.style.display = 'flex';
    };
    
    // Add a direct method to hide the overlay (avoid CSS classes)
    this.modalOverlay.hide = () => {
      console.log("DIRECT HIDE CALL");
      this.modalOverlay.style.display = 'none';
    };
  }
  
  createUIContainer() {
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    document.getElementById('game-container').appendChild(this.container);
  }
  
  // Stats panel removed as it was causing errors
  
  createDetailsPanel() {
    this.detailsPanel = document.createElement('div');
    this.detailsPanel.id = 'details-panel';
    this.detailsPanel.className = 'win2k-panel';
    
    // Windows 2000 style panel
    this.detailsPanel.style.position = 'absolute';
    this.detailsPanel.style.bottom = '20px';
    this.detailsPanel.style.left = '20px';
    this.detailsPanel.style.width = '300px';
    this.detailsPanel.style.padding = '8px';
    this.detailsPanel.style.backgroundColor = '#d4d0c8'; // Classic Windows gray
    this.detailsPanel.style.color = '#000000';
    this.detailsPanel.style.borderRadius = '0';
    this.detailsPanel.style.fontFamily = 'Tahoma, Arial, sans-serif';
    this.detailsPanel.style.fontSize = '11px';
    this.detailsPanel.style.pointerEvents = 'auto';
    this.detailsPanel.style.border = '2px solid';
    this.detailsPanel.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    this.detailsPanel.style.boxShadow = '2px 2px 3px rgba(0, 0, 0, 0.3)';
    this.detailsPanel.style.display = 'none'; // Hidden by default
    this.detailsPanel.style.zIndex = '101';
    
    // Add a Windows 2000 title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'win2k-titlebar';
    titleBar.style.backgroundColor = '#0000a5'; // Windows 2000 blue
    titleBar.style.color = '#ffffff';
    titleBar.style.padding = '2px 5px';
    titleBar.style.margin = '-8px -8px 8px -8px'; // Extend to edges
    titleBar.style.fontWeight = 'bold';
    titleBar.style.fontSize = '12px';
    titleBar.textContent = 'Details';
    
    this.detailsPanel.appendChild(titleBar);
    this.container.appendChild(this.detailsPanel);
    
    // Make panel draggable and closable
    this.makePanelDraggable(this.detailsPanel, titleBar);
  }
  
  // Actions buttons panel removed as it was causing errors
  
  createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '4px 8px';
    button.style.backgroundColor = '#c0c0c0'; // Windows 2000 gray
    button.style.color = '#000000';
    button.style.border = '2px solid';
    button.style.borderColor = '#ffffff #808080 #808080 #ffffff'; // 3D effect borders
    button.style.borderRadius = '0'; // No rounded corners
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'Tahoma, Arial, sans-serif'; // Windows 2000 font
    button.style.fontSize = '11px';
    button.style.fontWeight = 'normal';
    button.style.textAlign = 'center';
    button.style.pointerEvents = 'auto';
    button.style.boxShadow = '1px 1px 0px #000000';
    
    // Add hover and active states
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#d0d0d0';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#c0c0c0';
    });
    
    button.addEventListener('mousedown', () => {
      button.style.backgroundColor = '#a0a0a0';
      button.style.borderColor = '#808080 #ffffff #ffffff #808080';
      button.style.transform = 'translateY(1px)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.backgroundColor = '#c0c0c0';
      button.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      button.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('click', onClick);
    return button;
  }
  
  // Toggle rack placement mode
  toggleRackPlacementMode() {
    this.rackPlacementMode = !this.rackPlacementMode;
    this.game.datacenter.togglePlacementMode(this.rackPlacementMode);
    
    // Show a status message
    if (this.rackPlacementMode) {
      this.showStatusMessage('Rack placement mode active. Click on the grid to place a rack.');
    } else {
      this.showStatusMessage('Rack placement mode canceled.');
    }
    
    // Close the menu
    this.closeAllMenus();
  }
  
  // Show a temporary status message
  showStatusMessage(message, duration = 3000) {
    // Create message if it doesn't exist
    if (!this.statusMessage) {
      this.statusMessage = document.createElement('div');
      this.statusMessage.style.position = 'fixed';
      this.statusMessage.style.bottom = '10px';
      this.statusMessage.style.left = '50%';
      this.statusMessage.style.transform = 'translateX(-50%)';
      this.statusMessage.style.padding = '8px 16px';
      this.statusMessage.style.backgroundColor = '#d4d0c8';
      this.statusMessage.style.border = '2px solid';
      this.statusMessage.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      this.statusMessage.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
      this.statusMessage.style.fontFamily = 'Tahoma, Arial, sans-serif';
      this.statusMessage.style.fontSize = '12px';
      this.statusMessage.style.color = '#000000';
      this.statusMessage.style.zIndex = '1000';
      document.body.appendChild(this.statusMessage);
    }
    
    // Set message
    this.statusMessage.textContent = message;
    this.statusMessage.style.display = 'block';
    
    // Clear any existing timeout
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }
    
    // Set timeout to hide message
    this.statusTimeout = setTimeout(() => {
      this.statusMessage.style.display = 'none';
    }, duration);
  }
  
  openModal(content) {
    console.log('OPENING MODAL - DIRECT APPROACH');
    
    // Apply Windows 2000 styling directly to content
    content.style.backgroundColor = '#d4d0c8';
    content.style.border = '3px solid';
    content.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    content.style.boxShadow = '3px 3px 10px rgba(0, 0, 0, 0.5)';
    content.style.fontFamily = 'Tahoma, Arial, sans-serif';
    content.style.fontSize = '11px';
    content.style.color = '#000000';
    content.style.padding = '2px';
    content.style.margin = '20px';
    content.style.maxWidth = '80%';
    content.style.maxHeight = '80%';
    content.style.overflowY = 'auto';
    
    // Clear and replace content
    this.modalOverlay.innerHTML = '';
    this.modalOverlay.appendChild(content);
    
    // Show modal directly
    this.modalOverlay.style.display = 'flex';
  }
  
  closeModal() {
    console.log('CLOSING MODAL - DIRECT APPROACH');
    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'none';
      // Clear content
      this.modalOverlay.innerHTML = '';
    }
  }
  
  update() {
    // Update stats display
    this.updateMenuStats();
  }
  
  makePanelDraggable(panel, dragHandle) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Add to tracking array
    if (!this.draggablePanels) {
      this.draggablePanels = [];
    }
    if (!this.draggablePanels.includes(panel)) {
      this.draggablePanels.push(panel);
    }
    
    // Style drag handle
    dragHandle.style.cursor = 'move';
    
    // Add titlebar icons
    const titlebarIcons = document.createElement('div');
    titlebarIcons.style.display = 'flex';
    titlebarIcons.style.marginLeft = 'auto';
    
    // Close button
    const closeButton = document.createElement('div');
    closeButton.style.width = '14px';
    closeButton.style.height = '14px';
    closeButton.style.marginLeft = '2px';
    closeButton.style.backgroundColor = '#c0c0c0';
    closeButton.style.border = '1px solid #808080';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.fontSize = '10px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', () => {
      panel.style.display = 'none';
    });
    
    titlebarIcons.appendChild(closeButton);
    dragHandle.appendChild(titlebarIcons);
    
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      
      const rect = panel.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      
      // Apply active window styling to bring it to front
      this.draggablePanels.forEach(p => {
        p.style.zIndex = '101';
        if (p.querySelector('.win2k-titlebar')) {
          p.querySelector('.win2k-titlebar').style.backgroundColor = '#7b7b7b';
        }
      });
      panel.style.zIndex = '102';
      dragHandle.style.backgroundColor = '#0000a5';
      
      // Prevent text selection during drag
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        panel.style.left = `${e.clientX - dragOffsetX}px`;
        panel.style.top = `${e.clientY - dragOffsetY}px`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  cascadeWindows() {
    if (!this.draggablePanels) return;
    
    let offsetX = 50;
    let offsetY = 50;
    
    this.draggablePanels.forEach(panel => {
      if (panel.style.display !== 'none') {
        panel.style.left = `${offsetX}px`;
        panel.style.top = `${offsetY}px`;
        offsetX += 20;
        offsetY += 20;
      }
    });
  }
  
  // Show UI to connect a rack to a circuit
  showConnectRackUI(circuit) {
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add title & close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    const title = document.createElement('h2');
    title.textContent = `Connect Rack to ${circuit.name}`;
    modalContent.appendChild(title);
    
    // Get available racks and switches
    const availableRacks = this.game.datacenter.racks.filter(rack => {
      // Find if the rack has any switches
      return rack.networkEquipment.some(eq => eq.type === 'SWITCH');
    });
    
    let rackOptions = '';
    if (availableRacks.length > 0) {
      rackOptions = availableRacks.map(rack => {
        const switches = rack.networkEquipment.filter(eq => eq.type === 'SWITCH');
        
        return `
          <div class="rack-option" data-rack-id="${rack.id}">
            <h4>Rack at Position (${rack.gridX}, ${rack.gridZ})</h4>
            <p>Available Switches: ${switches.length}</p>
            <select class="switch-select" data-rack-id="${rack.id}">
              ${switches.map(sw => `
                <option value="${sw.id}">${sw.name} (${sw.ports.filter(p => !p.connected).length} free ports)</option>
              `).join('')}
            </select>
          </div>
        `;
      }).join('');
    } else {
      rackOptions = '<p>No racks with switches available. Add a switch to a rack first.</p>';
    }
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select a rack and switch to connect to this circuit:</p>
      <div class="rack-options">
        ${rackOptions}
      </div>
      <div style="margin-top: 20px;">
        <button id="connect-rack-confirm-btn" ${availableRacks.length === 0 ? 'disabled' : ''}>Connect</button>
        <button id="cancel-connect-btn">Cancel</button>
      </div>
    `;
    modalContent.appendChild(content);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Add event listeners
    const rackOptionElements = document.querySelectorAll('.rack-option');
    let selectedRackId = null;
    let selectedSwitchId = null;
    
    if (rackOptionElements.length > 0) {
      // Default selection
      selectedRackId = rackOptionElements[0].dataset.rackId;
      const switchSelect = document.querySelector(`.switch-select[data-rack-id="${selectedRackId}"]`);
      if (switchSelect) {
        selectedSwitchId = switchSelect.value;
      }
      
      rackOptionElements[0].classList.add('selected');
    }
    
    rackOptionElements.forEach(option => {
      option.addEventListener('click', () => {
        // Deselect all
        rackOptionElements.forEach(o => o.classList.remove('selected'));
        
        // Select this one
        option.classList.add('selected');
        selectedRackId = option.dataset.rackId;
        
        // Get selected switch
        const switchSelect = option.querySelector('.switch-select');
        if (switchSelect) {
          selectedSwitchId = switchSelect.value;
        }
      });
      
      // Handle switch selection
      const switchSelect = option.querySelector('.switch-select');
      if (switchSelect) {
        switchSelect.addEventListener('change', () => {
          selectedSwitchId = switchSelect.value;
        });
      }
    });
    
    document.getElementById('connect-rack-confirm-btn').addEventListener('click', () => {
      if (selectedRackId && selectedSwitchId) {
        // Find the rack and switch
        const rack = this.game.datacenter.racks.find(r => r.id === selectedRackId);
        if (!rack) return;
        
        const switchEquipment = rack.networkEquipment.find(eq => eq.id === selectedSwitchId);
        if (!switchEquipment) return;
        
        // Find an available port on the switch
        let availablePort = null;
        for (let i = 0; i < switchEquipment.ports.length; i++) {
          if (!switchEquipment.ports[i].connected) {
            availablePort = switchEquipment.ports[i];
            break;
          }
        }
        
        if (availablePort) {
          // Connect the rack to the circuit
          this.game.datacenter.egressRouter.connectRackToCircuit(
            rack,
            circuit.id,
            switchEquipment.id,
            availablePort.id
          );
          
          this.showCircuitView(circuit);
        } else {
          alert('No available ports on the selected switch');
        }
      }
    });
    
    document.getElementById('cancel-connect-btn').addEventListener('click', () => {
      this.showCircuitView(circuit);
    });
  }
  
  // Show UI to purchase a new circuit directly to receiving dock
  showCircuitPurchaseUI() {
    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add title & close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    const title = document.createElement('h2');
    title.textContent = 'Purchase New Circuit';
    modalContent.appendChild(title);
    
    // Circuit options
    const circuitOptions = Object.keys(CIRCUIT_TYPES).map(type => {
      const circuit = CIRCUIT_TYPES[type];
      return `
        <div class="circuit-option" data-type="${type}" style="padding: 10px; margin: 5px 0; border: 1px solid #999; border-radius: 3px; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0;">${circuit.name}</h4>
            <span>$${circuit.cost}/month</span>
          </div>
          <p style="margin: 5px 0;">Speed: ${circuit.speed} Gbps</p>
          <p style="margin: 5px 0;">Max Connections: ${circuit.maxConnections}</p>
        </div>
      `;
    }).join('');
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select a circuit to add to your datacenter:</p>
      <div class="circuit-options">
        ${circuitOptions}
      </div>
      <div style="margin-top: 20px;">
        <button id="purchase-selected-circuit-btn" disabled>Purchase Selected Circuit</button>
        <button id="cancel-purchase-circuit-btn">Cancel</button>
      </div>
    `;
    modalContent.appendChild(content);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Add event listeners
    const circuitOptionElements = document.querySelectorAll('.circuit-option');
    let selectedType = null;
    
    circuitOptionElements.forEach(option => {
      option.addEventListener('click', () => {
        // Deselect all
        circuitOptionElements.forEach(o => o.classList.remove('selected'));
        
        // Select this one
        option.classList.add('selected');
        selectedType = option.dataset.type;
        
        // Enable the purchase button
        document.getElementById('purchase-selected-circuit-btn').disabled = false;
      });
    });
    
    document.getElementById('purchase-selected-circuit-btn').addEventListener('click', () => {
      if (selectedType) {
        // Add circuit directly to the router
        const circuit = this.game.datacenter.egressRouter.addCircuit(selectedType);
        
        if (circuit) {
          // Show success message
          alert(`Successfully purchased ${circuit.name} circuit for $${circuit.cost}/month`);
          
          // Return to dock UI
          this.showReceivingDockUI();
        } else {
          alert('Failed to purchase circuit. Check your funds.');
        }
      }
    });
    
    document.getElementById('cancel-purchase-circuit-btn').addEventListener('click', () => {
      this.showReceivingDockUI();
    });
  }
  
  // Show rack details view
  showRackView(rack) {
    console.log("Showing rack view for rack:", rack);
    
    // Create modal content for the rack view
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = `Rack at Position (${rack.gridX}, ${rack.gridZ})`;
    modalContent.appendChild(title);
    
    // Create tabs container for Windows 2000 style tabs
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    tabContainer.style.display = 'flex';
    tabContainer.style.borderBottom = '1px solid #999';
    tabContainer.style.marginBottom = '15px';
    
    // Overview tab
    const overviewTab = document.createElement('div');
    overviewTab.className = 'tab active';
    overviewTab.textContent = 'Overview';
    overviewTab.style.padding = '8px 15px';
    overviewTab.style.backgroundColor = '#d4d0c8';
    overviewTab.style.border = '1px solid #999';
    overviewTab.style.borderBottom = 'none';
    overviewTab.style.marginRight = '5px';
    overviewTab.style.cursor = 'pointer';
    overviewTab.style.borderTopLeftRadius = '4px';
    overviewTab.style.borderTopRightRadius = '4px';
    
    // Servers tab
    const serversTab = document.createElement('div');
    serversTab.className = 'tab';
    serversTab.textContent = 'Servers';
    serversTab.style.padding = '8px 15px';
    serversTab.style.backgroundColor = '#bbb';
    serversTab.style.border = '1px solid #999';
    serversTab.style.borderBottom = 'none';
    serversTab.style.marginRight = '5px';
    serversTab.style.cursor = 'pointer';
    serversTab.style.borderTopLeftRadius = '4px';
    serversTab.style.borderTopRightRadius = '4px';
    
    // Network tab
    const networkTab = document.createElement('div');
    networkTab.className = 'tab';
    networkTab.textContent = 'Network';
    networkTab.style.padding = '8px 15px';
    networkTab.style.backgroundColor = '#bbb';
    networkTab.style.border = '1px solid #999';
    networkTab.style.borderBottom = 'none';
    networkTab.style.cursor = 'pointer';
    networkTab.style.borderTopLeftRadius = '4px';
    networkTab.style.borderTopRightRadius = '4px';
    
    tabContainer.appendChild(overviewTab);
    tabContainer.appendChild(serversTab);
    tabContainer.appendChild(networkTab);
    modalContent.appendChild(tabContainer);
    
    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content-container';
    modalContent.appendChild(contentContainer);
    
    // Helper function to show rack overview
    const showRackOverview = () => {
      // Calculate rack stats
      const totalServers = rack.servers.length;
      const totalNetworkEquipment = rack.networkEquipment.length;
      const serverUnits = rack.servers.reduce((sum, server) => sum + (server.unitSize || 1), 0);
      const networkUnits = rack.networkEquipment.reduce((sum, eq) => sum + (eq.unitSize || 1), 0);
      const totalUsedUnits = serverUnits + networkUnits;
      const freeUnits = rack.rackHeightUnits - totalUsedUnits;
      
      contentContainer.innerHTML = `
        <h3>Rack Overview</h3>
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="min-width: 250px; margin-bottom: 20px;">
            <p><strong>Rack ID:</strong> ${rack.id}</p>
            <p><strong>Position:</strong> (${rack.gridX}, ${rack.gridZ})</p>
            <p><strong>Size:</strong> ${rack.rackHeightUnits}U</p>
            <p><strong>Used Space:</strong> ${totalUsedUnits}U (${Math.round(totalUsedUnits/rack.rackHeightUnits*100)}%)</p>
            <p><strong>Free Space:</strong> ${freeUnits}U</p>
          </div>
          <div style="min-width: 250px; margin-bottom: 20px;">
            <p><strong>Total Servers:</strong> ${totalServers}</p>
            <p><strong>Server Space:</strong> ${serverUnits}U</p>
            <p><strong>Total Network Equipment:</strong> ${totalNetworkEquipment}</p>
            <p><strong>Network Equipment Space:</strong> ${networkUnits}U</p>
          </div>
        </div>
        <div style="margin-top: 20px;">
          <button id="move-rack-btn">Move Rack</button>
          ${freeUnits > 0 ? `<button id="add-equipment-btn">Add Equipment</button>` : ''}
          <button id="remove-rack-btn">Remove Rack</button>
        </div>
      `;
      
      // Add event listeners
      document.getElementById('move-rack-btn')?.addEventListener('click', () => {
        alert('Not implemented yet: Rack movement. Use drag and drop in the main view.');
      });
      
      document.getElementById('add-equipment-btn')?.addEventListener('click', () => {
        this.showReceivingDockUI();
      });
      
      document.getElementById('remove-rack-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this rack? All equipment will be lost!')) {
          this.game.datacenter.removeRack(rack.gridX, rack.gridZ);
          this.closeModal();
        }
      });
    };
    
    // Helper function to show servers tab
    const showServersTab = () => {
      if (rack.servers.length === 0) {
        contentContainer.innerHTML = `
          <h3>Servers</h3>
          <p>No servers installed in this rack.</p>
          <button id="add-server-btn">Add Server</button>
        `;
        
        document.getElementById('add-server-btn')?.addEventListener('click', () => {
          this.showReceivingDockUI();
        });
        
        return;
      }
      
      // Create server list
      const serverList = rack.servers.map(server => `
        <div class="server-item" style="border: 1px solid #999; padding: 10px; margin-bottom: 10px; border-radius: 3px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0;">${server.specs?.name || `${server.unitSize}U Server`}</h4>
            <span>Position: ${server.position}</span>
          </div>
          <p>${server.specs?.cpu ? `CPU: ${server.specs.cpu.cores} cores @ ${server.specs.cpu.speed} GHz` : ''}</p>
          <p>${server.specs?.ram ? `RAM: ${server.specs.ram} GB` : ''}</p>
          <p>Power: ${server.powerConsumption || 'Unknown'} W</p>
          <p>Revenue: ${server.revenue ? `$${server.revenue}/hour` : 'Unknown'}</p>
          <p>Connection: ${server.connected ? 'Connected' : 'Not connected'}</p>
          ${server.ipAddress ? `<p>IP Address: ${server.ipAddress}</p>` : ''}
          <button class="remove-server-btn" data-server-id="${server.id}">Remove</button>
        </div>
      `).join('');
      
      contentContainer.innerHTML = `
        <h3>Servers (${rack.servers.length})</h3>
        <div class="server-list">
          ${serverList}
        </div>
        <button id="add-server-btn" style="margin-top: 20px;">Add Server</button>
      `;
      
      // Add event listeners
      document.querySelectorAll('.remove-server-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const serverId = btn.dataset.serverId;
          if (confirm('Are you sure you want to remove this server?')) {
            rack.removeServer(serverId);
            showServersTab(); // Refresh the tab
          }
        });
      });
      
      document.getElementById('add-server-btn')?.addEventListener('click', () => {
        this.showReceivingDockUI();
      });
    };
    
    // Helper function to show network tab
    const showNetworkTab = () => {
      if (rack.networkEquipment.length === 0) {
        contentContainer.innerHTML = `
          <h3>Network Equipment</h3>
          <p>No network equipment installed in this rack.</p>
          <button id="add-network-btn">Add Network Equipment</button>
        `;
        
        document.getElementById('add-network-btn')?.addEventListener('click', () => {
          this.showReceivingDockUI();
        });
        
        return;
      }
      
      // Create network equipment list
      const equipmentList = rack.networkEquipment.map(equipment => `
        <div class="equipment-item" style="border: 1px solid #999; padding: 10px; margin-bottom: 10px; border-radius: 3px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0;">${equipment.name || equipment.type}</h4>
            <span>Position: ${equipment.position}</span>
          </div>
          <p>Type: ${equipment.type}</p>
          <p>Ports: ${equipment.ports ? equipment.ports.length : 'Unknown'}</p>
          <p>Connected Ports: ${equipment.ports ? equipment.ports.filter(p => p.connected).length : '0'}</p>
          <p>Power: ${equipment.powerConsumption || 'Unknown'} W</p>
          ${equipment.ipAddress ? `<p>IP Address: ${equipment.ipAddress}</p>` : ''}
          <button class="remove-equipment-btn" data-equipment-id="${equipment.id}">Remove</button>
          ${equipment.type === 'SWITCH' ? `<button class="manage-cables-btn" data-equipment-id="${equipment.id}">Manage Cables</button>` : ''}
        </div>
      `).join('');
      
      contentContainer.innerHTML = `
        <h3>Network Equipment (${rack.networkEquipment.length})</h3>
        <div class="equipment-list">
          ${equipmentList}
        </div>
        <button id="add-network-btn" style="margin-top: 20px;">Add Network Equipment</button>
      `;
      
      // Add event listeners
      document.querySelectorAll('.remove-equipment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const equipmentId = btn.dataset.equipmentId;
          if (confirm('Are you sure you want to remove this equipment?')) {
            rack.removeNetworkEquipment(equipmentId);
            showNetworkTab(); // Refresh the tab
          }
        });
      });
      
      document.querySelectorAll('.manage-cables-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Enable cable management mode
          this.closeModal();
          this.game.toggleCableMode(true);
        });
      });
      
      document.getElementById('add-network-btn')?.addEventListener('click', () => {
        this.showReceivingDockUI();
      });
    };
    
    // Open the modal
    this.openModal(modalContent);
    
    // Show overview by default
    showRackOverview();
    
    // Tab click handlers
    overviewTab.addEventListener('click', () => {
      overviewTab.classList.add('active');
      overviewTab.style.backgroundColor = '#d4d0c8';
      serversTab.classList.remove('active');
      serversTab.style.backgroundColor = '#bbb';
      networkTab.classList.remove('active');
      networkTab.style.backgroundColor = '#bbb';
      showRackOverview();
    });
    
    serversTab.addEventListener('click', () => {
      serversTab.classList.add('active');
      serversTab.style.backgroundColor = '#d4d0c8';
      overviewTab.classList.remove('active');
      overviewTab.style.backgroundColor = '#bbb';
      networkTab.classList.remove('active');
      networkTab.style.backgroundColor = '#bbb';
      showServersTab();
    });
    
    networkTab.addEventListener('click', () => {
      networkTab.classList.add('active');
      networkTab.style.backgroundColor = '#d4d0c8';
      overviewTab.classList.remove('active');
      overviewTab.style.backgroundColor = '#bbb';
      serversTab.classList.remove('active');
      serversTab.style.backgroundColor = '#bbb';
      showNetworkTab();
    });
  }
  
  // Show egress router and circuit details
  showEgressRouterView(egressRouter) {
    console.log("Showing egress router view for:", egressRouter);
    
    // Create modal content for the egress router view
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Egress Router';
    modalContent.appendChild(title);
    
    // Create content container
    const contentContainer = document.createElement('div');
    modalContent.appendChild(contentContainer);
    
    // Show router details and circuits
    const routerInfo = `
      <div style="margin-bottom: 20px;">
        <h3>Router Details</h3>
        <p><strong>Name:</strong> ${egressRouter.name}</p>
        <p><strong>Position:</strong> (${egressRouter.position.x}, ${egressRouter.position.z})</p>
        <p><strong>Total Circuits:</strong> ${egressRouter.circuits.length}</p>
      </div>
    `;
    
    let circuitsList = '';
    if (egressRouter.circuits.length === 0) {
      circuitsList = `
        <div style="margin-bottom: 20px;">
          <h3>Circuits</h3>
          <p>No circuits installed. Add a circuit to provide internet connectivity.</p>
        </div>
      `;
    } else {
      circuitsList = `
        <div style="margin-bottom: 20px;">
          <h3>Circuits</h3>
          <div class="circuits-list">
            ${egressRouter.circuits.map(circuit => `
              <div class="circuit-item" style="border: 1px solid #999; padding: 10px; margin-bottom: 10px; border-radius: 3px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h4 style="margin: 0;">${circuit.name}</h4>
                  <span>${circuit.status.toUpperCase()}</span>
                </div>
                <p><strong>Type:</strong> ${circuit.type}</p>
                <p><strong>Speed:</strong> ${circuit.speed} Gbps</p>
                <p><strong>Cost:</strong> $${circuit.cost}/month</p>
                <p><strong>Utilization:</strong> ${Math.round(circuit.utilization)}%</p>
                <p><strong>Connections:</strong> ${circuit.connections.length} / ${circuit.specs.maxConnections}</p>
                <p><strong>IP Range:</strong> ${circuit.ipRange.network}</p>
                <div style="margin-top: 10px;">
                  <button class="connect-rack-btn" data-circuit-id="${circuit.id}">Connect Rack</button>
                  <button class="remove-circuit-btn" data-circuit-id="${circuit.id}">Remove Circuit</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    contentContainer.innerHTML = `
      ${routerInfo}
      ${circuitsList}
      <div style="margin-top: 20px;">
        <button id="add-circuit-btn">Add Circuit</button>
      </div>
    `;
    
    // Open the modal
    this.openModal(modalContent);
    
    // Add event listeners
    document.getElementById('add-circuit-btn')?.addEventListener('click', () => {
      this.showCircuitPurchaseUI();
    });
    
    document.querySelectorAll('.connect-rack-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const circuitId = btn.dataset.circuitId;
        const circuit = egressRouter.circuits.find(c => c.id === circuitId);
        if (circuit) {
          this.showConnectRackUI(circuit);
        }
      });
    });
    
    document.querySelectorAll('.remove-circuit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const circuitId = btn.dataset.circuitId;
        if (confirm('Are you sure you want to remove this circuit? All connections will be lost!')) {
          egressRouter.removeCircuit(circuitId);
          this.showEgressRouterView(egressRouter);
        }
      });
    });
  }
  
  // Show circuit details view
  showCircuitView(circuit) {
    console.log("Showing circuit view for:", circuit);
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = circuit.name;
    modalContent.appendChild(title);
    
    // Create circuit details
    const circuitDetails = `
      <div style="margin-bottom: 20px;">
        <h3>Circuit Details</h3>
        <p><strong>Type:</strong> ${circuit.type}</p>
        <p><strong>Speed:</strong> ${circuit.speed} Gbps</p>
        <p><strong>Cost:</strong> $${circuit.cost}/month</p>
        <p><strong>Status:</strong> ${circuit.status.toUpperCase()}</p>
        <p><strong>Utilization:</strong> ${Math.round(circuit.utilization)}%</p>
        <p><strong>IP Range:</strong> ${circuit.ipRange.network}</p>
      </div>
    `;
    
    let connectionsList = '';
    if (circuit.connections.length === 0) {
      connectionsList = `
        <div style="margin-bottom: 20px;">
          <h3>Connections</h3>
          <p>No devices connected to this circuit.</p>
        </div>
      `;
    } else {
      connectionsList = `
        <div style="margin-bottom: 20px;">
          <h3>Connections (${circuit.connections.length} / ${circuit.specs.maxConnections})</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">Device</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">Port</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">IP Address</th>
                <th style="text-align: center; padding: 8px; border-bottom: 1px solid #999;">Status</th>
                <th style="text-align: center; padding: 8px; border-bottom: 1px solid #999;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${circuit.connections.map(conn => {
                const equipment = this.game.findEquipmentById(conn.equipmentId);
                return `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${equipment ? equipment.name : 'Unknown Device'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">Port ${conn.portId}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${conn.ipAddress || 'None'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${conn.status}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                      <button class="disconnect-btn" data-equipment-id="${conn.equipmentId}" data-port-id="${conn.portId}">Disconnect</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    const ipAddressesList = `
      <div style="margin-bottom: 20px;">
        <h3>IP Addresses</h3>
        <p><strong>Network:</strong> ${circuit.ipRange.network}</p>
        <p><strong>Gateway:</strong> ${circuit.ipRange.gateway}</p>
        <p><strong>Usable Range:</strong> ${circuit.ipRange.usable}</p>
        <p><strong>Broadcast:</strong> ${circuit.ipRange.broadcast}</p>
        
        <h4>Allocated IP Addresses</h4>
        ${Object.keys(circuit.ipRange.allocatedIps).length === 0 
          ? '<p>No IP addresses allocated yet.</p>' 
          : `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">Device</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">IP Address</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">Allocated</th>
                </tr>
              </thead>
              <tbody>
                ${Object.keys(circuit.ipRange.allocatedIps).map(deviceId => {
                  const ip = circuit.ipRange.allocatedIps[deviceId];
                  return `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${ip.name || deviceId}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${ip.ip}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(ip.allocated).toLocaleString()}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `
        }
      </div>
    `;
    
    const content = document.createElement('div');
    content.innerHTML = `
      ${circuitDetails}
      ${connectionsList}
      ${ipAddressesList}
      <div style="margin-top: 20px;">
        <button id="connect-rack-btn">Connect Rack</button>
        <button id="remove-circuit-btn">Remove Circuit</button>
        <button id="back-to-router-btn">Back to Egress Router</button>
      </div>
    `;
    
    modalContent.appendChild(content);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Add event listeners
    document.getElementById('connect-rack-btn')?.addEventListener('click', () => {
      this.showConnectRackUI(circuit);
    });
    
    document.getElementById('remove-circuit-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this circuit? All connections will be lost!')) {
        this.game.datacenter.egressRouter.removeCircuit(circuit.id);
        this.showEgressRouterView(this.game.datacenter.egressRouter);
      }
    });
    
    document.getElementById('back-to-router-btn')?.addEventListener('click', () => {
      this.showEgressRouterView(this.game.datacenter.egressRouter);
    });
    
    document.querySelectorAll('.disconnect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const equipmentId = btn.dataset.equipmentId;
        const portId = btn.dataset.portId;
        
        // Find the rack containing this equipment
        let rack = null;
        for (const r of this.game.datacenter.racks) {
          const equipment = r.findEquipmentById(equipmentId);
          if (equipment) {
            rack = r;
            break;
          }
        }
        
        if (rack) {
          if (confirm('Are you sure you want to disconnect this connection?')) {
            this.game.datacenter.egressRouter.disconnectRackFromCircuit(
              rack,
              circuit.id,
              equipmentId,
              portId
            );
            this.showCircuitView(circuit);
          }
        } else {
          alert('Could not find the rack containing this equipment.');
        }
      });
    });
  }
  
  // Show receiving dock UI with inventory and purchase options
  showReceivingDockUI() {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Receiving Dock';
    modalContent.appendChild(title);
    
    // Create tabs container for Windows 2000 style tabs
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    tabContainer.style.display = 'flex';
    tabContainer.style.borderBottom = '1px solid #999';
    tabContainer.style.marginBottom = '15px';
    
    // Inventory tab
    const inventoryTab = document.createElement('div');
    inventoryTab.className = 'tab active';
    inventoryTab.textContent = 'Inventory';
    inventoryTab.style.padding = '8px 15px';
    inventoryTab.style.backgroundColor = '#d4d0c8';
    inventoryTab.style.border = '1px solid #999';
    inventoryTab.style.borderBottom = 'none';
    inventoryTab.style.marginRight = '5px';
    inventoryTab.style.cursor = 'pointer';
    inventoryTab.style.borderTopLeftRadius = '4px';
    inventoryTab.style.borderTopRightRadius = '4px';
    
    // Purchase tab
    const purchaseTab = document.createElement('div');
    purchaseTab.className = 'tab';
    purchaseTab.textContent = 'Purchase Equipment';
    purchaseTab.style.padding = '8px 15px';
    purchaseTab.style.backgroundColor = '#bbb';
    purchaseTab.style.border = '1px solid #999';
    purchaseTab.style.borderBottom = 'none';
    purchaseTab.style.cursor = 'pointer';
    purchaseTab.style.borderTopLeftRadius = '4px';
    purchaseTab.style.borderTopRightRadius = '4px';
    
    tabContainer.appendChild(inventoryTab);
    tabContainer.appendChild(purchaseTab);
    modalContent.appendChild(tabContainer);
    
    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content-container';
    modalContent.appendChild(contentContainer);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Show inventory by default
    this.showDockInventory(contentContainer);
    
    // Tab click handlers
    inventoryTab.addEventListener('click', () => {
      inventoryTab.classList.add('active');
      inventoryTab.style.backgroundColor = '#d4d0c8';
      purchaseTab.classList.remove('active');
      purchaseTab.style.backgroundColor = '#bbb';
      this.showDockInventory(contentContainer);
    });
    
    purchaseTab.addEventListener('click', () => {
      purchaseTab.classList.add('active');
      purchaseTab.style.backgroundColor = '#d4d0c8';
      inventoryTab.classList.remove('active');
      inventoryTab.style.backgroundColor = '#bbb';
      this.showDockPurchase(contentContainer);
    });
  }
  
  // Show the inventory of equipment in the receiving dock
  showDockInventory(container) {
    const inventory = this.game.datacenter.getReceivingDockInventory();
    
    container.innerHTML = '<h3>Equipment Inventory</h3>';
    
    if (inventory.length === 0) {
      container.innerHTML += '<p>No equipment in inventory. Switch to the Purchase tab to order equipment.</p>';
      return;
    }
    
    // Group inventory by type
    const groupedInventory = {};
    inventory.forEach(item => {
      if (!groupedInventory[item.type]) {
        groupedInventory[item.type] = [];
      }
      groupedInventory[item.type].push(item);
    });
    
    // Create inventory sections for each type
    Object.keys(groupedInventory).forEach(type => {
      const items = groupedInventory[type];
      const sectionTitle = document.createElement('h4');
      sectionTitle.textContent = this.formatEquipmentType(type);
      sectionTitle.style.marginBottom = '10px';
      sectionTitle.style.marginTop = '20px';
      container.appendChild(sectionTitle);
      
      const itemsTable = document.createElement('table');
      itemsTable.style.width = '100%';
      itemsTable.style.borderCollapse = 'collapse';
      
      // Create table header
      const tableHeader = document.createElement('thead');
      tableHeader.innerHTML = `
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #999;">Specifications</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #999;">Original Cost</th>
          <th style="text-align: right; padding: 8px; border-bottom: 1px solid #999;">Selling Value</th>
          <th style="text-align: center; padding: 8px; border-bottom: 1px solid #999;">Actions</th>
        </tr>
      `;
      itemsTable.appendChild(tableHeader);
      
      // Create table body
      const tableBody = document.createElement('tbody');
      items.forEach(item => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        // Specifications column
        const specsCell = document.createElement('td');
        specsCell.style.padding = '8px';
        specsCell.style.borderBottom = '1px solid #eee';
        specsCell.innerHTML = this.formatEquipmentSpecs(item);
        row.appendChild(specsCell);
        
        // Original cost column
        const costCell = document.createElement('td');
        costCell.style.padding = '8px';
        costCell.style.borderBottom = '1px solid #eee';
        costCell.style.textAlign = 'right';
        costCell.textContent = `$${item.originalCost}`;
        row.appendChild(costCell);
        
        // Selling value column
        const valueCell = document.createElement('td');
        valueCell.style.padding = '8px';
        valueCell.style.borderBottom = '1px solid #eee';
        valueCell.style.textAlign = 'right';
        valueCell.textContent = `$${item.sellingValue}`;
        row.appendChild(valueCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        actionsCell.style.padding = '8px';
        actionsCell.style.borderBottom = '1px solid #eee';
        actionsCell.style.textAlign = 'center';
        
        // Install button
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        installBtn.style.marginRight = '5px';
        installBtn.addEventListener('click', () => {
          this.showInstallEquipmentUI(item);
        });
        
        // Sell button
        const sellBtn = document.createElement('button');
        sellBtn.textContent = 'Sell';
        sellBtn.addEventListener('click', () => {
          this.sellDockEquipment(item);
        });
        
        actionsCell.appendChild(installBtn);
        actionsCell.appendChild(sellBtn);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
      });
      
      itemsTable.appendChild(tableBody);
      container.appendChild(itemsTable);
    });
  }
  
  // Show equipment purchase options
  showDockPurchase(container) {
    container.innerHTML = `
      <h3>Purchase Equipment</h3>
      <p>Select a category of equipment to purchase:</p>
      <div class="purchase-options" style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px;">
        <div class="purchase-option" style="border: 1px solid #999; border-radius: 5px; padding: 15px; min-width: 200px; cursor: pointer;">
          <h4>Servers</h4>
          <p>Purchase servers to add to your racks</p>
          <button id="purchase-server-btn">Browse Servers</button>
        </div>
        
        <div class="purchase-option" style="border: 1px solid #999; border-radius: 5px; padding: 15px; min-width: 200px; cursor: pointer;">
          <h4>Network Equipment</h4>
          <p>Purchase switches, routers, etc.</p>
          <button id="purchase-network-btn">Browse Network Equipment</button>
        </div>
        
        <div class="purchase-option" style="border: 1px solid #999; border-radius: 5px; padding: 15px; min-width: 200px; cursor: pointer;">
          <h4>Internet Circuits</h4>
          <p>Purchase internet connectivity</p>
          <button id="purchase-circuit-btn">Browse Circuits</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('purchase-server-btn').addEventListener('click', () => {
      this.showServerPurchaseUI();
    });
    
    document.getElementById('purchase-network-btn').addEventListener('click', () => {
      this.showNetworkEquipmentPurchaseUI();
    });
    
    document.getElementById('purchase-circuit-btn').addEventListener('click', () => {
      this.showCircuitPurchaseUI();
    });
  }
  
  // Format equipment type for display
  formatEquipmentType(type) {
    const typeMap = {
      'server': 'Servers',
      'switch': 'Network Switches',
      'router': 'Routers',
      'firewall': 'Firewalls',
      'patch_panel': 'Patch Panels'
    };
    
    return typeMap[type.toLowerCase()] || type;
  }
  
  // Format equipment specs for display
  formatEquipmentSpecs(item) {
    let specs = '';
    
    switch (item.type.toLowerCase()) {
      case 'server':
        specs = `
          <div>
            <strong>${item.specs.name || 'Server'}</strong><br>
            ${item.specs.cpu ? `CPU: ${item.specs.cpu.cores} cores @ ${item.specs.cpu.speed} GHz<br>` : ''}
            ${item.specs.ram ? `RAM: ${item.specs.ram} GB<br>` : ''}
            ${item.specs.storage ? `Storage: ${item.specs.storage.map(s => `${s.size} GB ${s.type}`).join(', ')}<br>` : ''}
            ${item.specs.unitSize ? `Size: ${item.specs.unitSize}U` : ''}
          </div>
        `;
        break;
        
      case 'switch':
        specs = `
          <div>
            <strong>${item.specs.name || 'Switch'}</strong><br>
            Ports: ${item.specs.numPorts} × ${item.specs.portSpeed} Gbps ${item.specs.portType}<br>
            ${item.specs.unitSize ? `Size: ${item.specs.unitSize}U` : ''}
          </div>
        `;
        break;
        
      case 'router':
        specs = `
          <div>
            <strong>${item.specs.name || 'Router'}</strong><br>
            Ports: ${item.specs.numPorts} × ${item.specs.portSpeed} Gbps<br>
            ${item.specs.unitSize ? `Size: ${item.specs.unitSize}U` : ''}
          </div>
        `;
        break;
        
      case 'firewall':
        specs = `
          <div>
            <strong>${item.specs.name || 'Firewall'}</strong><br>
            Throughput: ${item.specs.throughput} Gbps<br>
            ${item.specs.unitSize ? `Size: ${item.specs.unitSize}U` : ''}
          </div>
        `;
        break;
        
      default:
        specs = `<div><strong>${item.specs.name || item.type}</strong></div>`;
    }
    
    return specs;
  }
  
  // Sell equipment from the dock
  sellDockEquipment(item) {
    if (confirm(`Are you sure you want to sell this ${item.type} for $${item.sellingValue}?`)) {
      const success = this.game.datacenter.sellEquipmentFromDock(item.id);
      
      if (success) {
        alert(`Successfully sold ${item.type} for $${item.sellingValue}`);
        this.showReceivingDockUI(); // Refresh the dock UI
      } else {
        alert('Error selling equipment');
      }
    }
  }
  
  // Show UI for installing equipment to a rack
  showInstallEquipmentUI(item) {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = `Install ${item.type}`;
    modalContent.appendChild(title);
    
    // Get available racks
    const racks = this.game.datacenter.racks;
    
    if (racks.length === 0) {
      const content = document.createElement('div');
      content.innerHTML = '<p>No racks available. Please add a rack first.</p>';
      content.innerHTML += '<button id="back-to-inventory-btn">Back to Inventory</button>';
      modalContent.appendChild(content);
      
      this.openModal(modalContent);
      
      document.getElementById('back-to-inventory-btn').addEventListener('click', () => {
        this.showReceivingDockUI();
      });
      
      return;
    }
    
    // Create rack options
    let rackOptions = '';
    racks.forEach(rack => {
      rackOptions += `<option value="${rack.id}">Rack at (${rack.gridX}, ${rack.gridZ})</option>`;
    });
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select a rack and position to install this equipment:</p>
      
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="rack-select">Select Rack:</label>
        <select id="rack-select">
          ${rackOptions}
        </select>
      </div>
      
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="position-select">Select Position:</label>
        <select id="position-select"></select>
      </div>
      
      <div style="margin-top: 20px;">
        <button id="install-confirm-btn">Install</button>
        <button id="back-to-inventory-btn">Cancel</button>
      </div>
    `;
    
    modalContent.appendChild(content);
    this.openModal(modalContent);
    
    // Handle rack selection to update available positions
    const rackSelect = document.getElementById('rack-select');
    const positionSelect = document.getElementById('position-select');
    
    // Function to update available positions
    const updatePositions = () => {
      const selectedRackId = rackSelect.value;
      const rack = this.game.datacenter.racks.find(r => r.id === selectedRackId);
      
      if (!rack) {
        console.error('Selected rack not found:', selectedRackId);
        return;
      }
      
      console.log(`Updating positions for rack ${rack.id}. Equipment size: ${item.specs.unitSize}U`);
      console.log(`Rack properties: rackHeightUnits=${rack.rackHeightUnits}, servers=${rack.servers.length}, networkEquipment=${rack.networkEquipment.length}`);
      
      // Clear existing options
      positionSelect.innerHTML = '';
      
      // Get required rack units
      const requiredUnits = item.specs.unitSize || 1;
      
      // Find available positions
      const occupiedPositions = [];
      
      // Mark positions occupied by servers
      rack.servers.forEach(server => {
        for (let i = 0; i < server.unitSize; i++) {
          occupiedPositions.push(server.position + i);
        }
      });
      
      // Mark positions occupied by network equipment
      rack.networkEquipment.forEach(eq => {
        for (let i = 0; i < eq.unitSize; i++) {
          occupiedPositions.push(eq.position + i);
        }
      });
      
      // Generate options for available positions
      for (let i = 0; i <= rack.rackHeightUnits - requiredUnits; i++) {
        // Check if this position has enough consecutive space
        let hasSpace = true;
        for (let j = 0; j < requiredUnits; j++) {
          if (occupiedPositions.includes(i + j)) {
            hasSpace = false;
            break;
          }
        }
        
        if (hasSpace) {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = `Position ${i + 1} (${requiredUnits}U)`;
          positionSelect.appendChild(option);
        }
      }
      
      // If no positions available
      if (positionSelect.options.length === 0) {
        console.log(`No available positions found for equipment with size ${requiredUnits}U in rack ${rack.id}. Rack has ${rack.rackHeightUnits} units total.`);
        
        const option = document.createElement('option');
        option.textContent = 'No available positions';
        option.disabled = true;
        positionSelect.appendChild(option);
        document.getElementById('install-confirm-btn').disabled = true;
      } else {
        console.log(`Found ${positionSelect.options.length} available positions for equipment with size ${requiredUnits}U in rack ${rack.id}`);
        document.getElementById('install-confirm-btn').disabled = false;
      }
    };
    
    // Update positions when rack is selected
    rackSelect.addEventListener('change', updatePositions);
    
    // Initial update
    updatePositions();
    
    // Handle install button
    document.getElementById('install-confirm-btn').addEventListener('click', () => {
      const selectedRackId = rackSelect.value;
      const selectedPosition = parseInt(positionSelect.value);
      
      if (selectedRackId && !isNaN(selectedPosition)) {
        this.installEquipmentToRack(item, selectedRackId, selectedPosition);
      }
    });
    
    // Handle cancel button
    document.getElementById('back-to-inventory-btn').addEventListener('click', () => {
      this.showReceivingDockUI();
    });
  }
  
  // Install equipment from dock to rack
  installEquipmentToRack(item, rackId, position) {
    let success = false;
    
    if (item.type.toLowerCase() === 'server') {
      success = !!this.game.datacenter.installServerFromDock(item.id, rackId, position);
    } else {
      // Assume it's network equipment
      success = !!this.game.datacenter.installNetworkEquipmentFromDock(item.id, rackId, position);
    }
    
    if (success) {
      alert(`Successfully installed ${item.type} in rack`);
      
      // Show the rack view
      const rack = this.game.datacenter.racks.find(r => r.id === rackId);
      if (rack) {
        this.showRackView(rack);
      } else {
        this.showReceivingDockUI();
      }
    } else {
      alert(`Failed to install ${item.type}. Please try again.`);
      this.showReceivingDockUI();
    }
  }
  
  // Show UI for purchasing servers
  showServerPurchaseUI() {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Purchase Servers';
    modalContent.appendChild(title);
    
    // Define server options
    const serverOptions = [
      {
        name: 'Budget Server',
        cost: 500,
        specs: {
          name: 'Economy 1U Server',
          unitSize: 1,
          cpu: { cores: 4, speed: 2.2 },
          ram: 8,
          storage: [{ type: 'HDD', size: 500 }],
          networkCards: [{ speed: 1 }],
          powerConsumption: 300,
          revenue: 10
        }
      },
      {
        name: 'Standard Server',
        cost: 1200,
        specs: {
          name: 'Standard 1U Server',
          unitSize: 1,
          cpu: { cores: 8, speed: 2.8 },
          ram: 16,
          storage: [{ type: 'SSD', size: 256 }, { type: 'HDD', size: 1000 }],
          networkCards: [{ speed: 10 }],
          powerConsumption: 400,
          revenue: 25
        }
      },
      {
        name: 'Performance Server',
        cost: 2500,
        specs: {
          name: 'Performance 2U Server',
          unitSize: 2,
          cpu: { cores: 16, speed: 3.2 },
          ram: 64,
          storage: [{ type: 'SSD', size: 512 }, { type: 'HDD', size: 2000 }],
          networkCards: [{ speed: 10 }, { speed: 10 }],
          powerConsumption: 650,
          revenue: 60
        }
      },
      {
        name: 'High-End Server',
        cost: 5000,
        specs: {
          name: 'Enterprise 4U Server',
          unitSize: 4,
          cpu: { cores: 32, speed: 3.5 },
          ram: 128,
          storage: [{ type: 'SSD', size: 1000 }, { type: 'SSD', size: 1000 }, { type: 'HDD', size: 4000 }],
          networkCards: [{ speed: 25 }, { speed: 25 }],
          powerConsumption: 900,
          revenue: 120
        }
      }
    ];
    
    // Create server options HTML
    const serverOptionsHtml = serverOptions.map(server => `
      <div class="server-option" data-name="${server.name}" style="border: 1px solid #999; border-radius: 5px; padding: 15px; margin-bottom: 15px; cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0;">${server.name}</h4>
          <span style="font-weight: bold;">$${server.cost}</span>
        </div>
        <p><strong>Size:</strong> ${server.specs.unitSize}U</p>
        <p><strong>CPU:</strong> ${server.specs.cpu.cores} cores @ ${server.specs.cpu.speed} GHz</p>
        <p><strong>RAM:</strong> ${server.specs.ram} GB</p>
        <p><strong>Storage:</strong> ${server.specs.storage.map(s => `${s.size} GB ${s.type}`).join(', ')}</p>
        <p><strong>Network:</strong> ${server.specs.networkCards.map(n => `${n.speed} Gbps`).join(', ')}</p>
        <p><strong>Power:</strong> ${server.specs.powerConsumption} W</p>
        <p><strong>Revenue:</strong> $${server.specs.revenue}/hour</p>
        <button class="purchase-server-btn" data-server="${server.name}">Purchase</button>
      </div>
    `).join('');
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select a server to purchase:</p>
      <div class="server-options">
        ${serverOptionsHtml}
      </div>
      <button id="back-to-purchase-btn" style="margin-top: 20px;">Back to Purchase Menu</button>
    `;
    
    modalContent.appendChild(content);
    this.openModal(modalContent);
    
    // Add event listeners for purchase buttons
    const purchaseButtons = document.querySelectorAll('.purchase-server-btn');
    purchaseButtons.forEach(button => {
      button.addEventListener('click', () => {
        const serverName = button.dataset.server;
        const server = serverOptions.find(s => s.name === serverName);
        
        if (server) {
          if (this.game.datacenter.funds < server.cost) {
            alert('Not enough funds to purchase this server.');
            return;
          }
          
          // Add to receiving dock
          const item = this.game.datacenter.addEquipmentToReceivingDock('server', server.specs, server.cost);
          
          if (item) {
            alert(`Successfully purchased ${server.name} for $${server.cost}. It has been delivered to your receiving dock.`);
            this.showReceivingDockUI();
          } else {
            alert('Failed to purchase server.');
          }
        }
      });
    });
    
    // Back button
    document.getElementById('back-to-purchase-btn').addEventListener('click', () => {
      this.showReceivingDockUI();
    });
  }
  
  // Show UI for purchasing network equipment
  showNetworkEquipmentPurchaseUI() {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Purchase Network Equipment';
    modalContent.appendChild(title);
    
    // Define equipment options
    const equipmentOptions = [
      {
        name: 'Basic Switch',
        type: 'switch',
        cost: 300,
        specs: {
          name: 'Basic 8-Port Switch',
          unitSize: 1,
          numPorts: 8,
          portSpeed: 1,
          portType: 'ethernet',
          capabilities: ['vlan'],
          powerConsumption: 50
        }
      },
      {
        name: 'Standard Switch',
        type: 'switch',
        cost: 800,
        specs: {
          name: 'Standard 24-Port Switch',
          unitSize: 1,
          numPorts: 24,
          portSpeed: 1,
          portType: 'ethernet',
          capabilities: ['vlan', 'qos'],
          powerConsumption: 80
        }
      },
      {
        name: 'Enterprise Switch',
        type: 'switch',
        cost: 2200,
        specs: {
          name: 'Enterprise 48-Port Switch',
          unitSize: 1,
          numPorts: 48,
          portSpeed: 10,
          portType: 'ethernet',
          capabilities: ['vlan', 'qos', 'spanning-tree'],
          powerConsumption: 150
        }
      },
      {
        name: 'Basic Firewall',
        type: 'firewall',
        cost: 500,
        specs: {
          name: 'Basic Firewall',
          unitSize: 1,
          numPorts: 4,
          portSpeed: 1,
          throughput: 1,
          capabilities: ['stateful-inspection'],
          powerConsumption: 60
        }
      },
      {
        name: 'Advanced Firewall',
        type: 'firewall',
        cost: 1500,
        specs: {
          name: 'Advanced Firewall',
          unitSize: 1,
          numPorts: 8,
          portSpeed: 10,
          throughput: 10,
          capabilities: ['stateful-inspection', 'vpn', 'ids'],
          powerConsumption: 120
        }
      }
    ];
    
    // Create equipment options HTML
    const equipmentOptionsHtml = equipmentOptions.map(equipment => `
      <div class="equipment-option" data-name="${equipment.name}" style="border: 1px solid #999; border-radius: 5px; padding: 15px; margin-bottom: 15px; cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0;">${equipment.name}</h4>
          <span style="font-weight: bold;">$${equipment.cost}</span>
        </div>
        <p><strong>Type:</strong> ${equipment.type}</p>
        <p><strong>Size:</strong> ${equipment.specs.unitSize}U</p>
        ${equipment.specs.numPorts ? `<p><strong>Ports:</strong> ${equipment.specs.numPorts} × ${equipment.specs.portSpeed} Gbps</p>` : ''}
        ${equipment.specs.throughput ? `<p><strong>Throughput:</strong> ${equipment.specs.throughput} Gbps</p>` : ''}
        <p><strong>Power:</strong> ${equipment.specs.powerConsumption} W</p>
        <button class="purchase-equipment-btn" data-equipment="${equipment.name}">Purchase</button>
      </div>
    `).join('');
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select network equipment to purchase:</p>
      <div class="equipment-options">
        ${equipmentOptionsHtml}
      </div>
      <button id="back-to-purchase-btn" style="margin-top: 20px;">Back to Purchase Menu</button>
    `;
    
    modalContent.appendChild(content);
    this.openModal(modalContent);
    
    // Add event listeners for purchase buttons
    const purchaseButtons = document.querySelectorAll('.purchase-equipment-btn');
    purchaseButtons.forEach(button => {
      button.addEventListener('click', () => {
        const equipmentName = button.dataset.equipment;
        const equipment = equipmentOptions.find(e => e.name === equipmentName);
        
        if (equipment) {
          if (this.game.datacenter.funds < equipment.cost) {
            alert('Not enough funds to purchase this equipment.');
            return;
          }
          
          // Add to receiving dock
          const item = this.game.datacenter.addEquipmentToReceivingDock(equipment.type, equipment.specs, equipment.cost);
          
          if (item) {
            alert(`Successfully purchased ${equipment.name} for $${equipment.cost}. It has been delivered to your receiving dock.`);
            this.showReceivingDockUI();
          } else {
            alert('Failed to purchase equipment.');
          }
        }
      });
    });
    
    // Back button
    document.getElementById('back-to-purchase-btn').addEventListener('click', () => {
      this.showReceivingDockUI();
    });
  }
}