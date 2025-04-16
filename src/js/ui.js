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
      { label: 'Details Panel', checked: this.detailsPanel && this.detailsPanel.style.display !== 'none', separator: true },
      { label: 'Cascade Windows', separator: false },
      { label: 'Tile Windows', separator: false }
    ];
    
    menuItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.style.padding = '4px 20px';
      itemElement.style.cursor = 'pointer';
      itemElement.style.display = 'flex';
      itemElement.style.alignItems = 'center';
      
      // Add checkmark for toggle items
      if (item.hasOwnProperty('checked')) {
        const checkBox = document.createElement('div');
        checkBox.style.width = '12px';
        checkBox.style.height = '12px';
        checkBox.style.border = '1px solid #808080';
        checkBox.style.marginRight = '8px';
        checkBox.style.backgroundColor = item.checked ? '#ffffff' : '#d4d0c8';
        checkBox.style.position = 'relative';
        
        if (item.checked) {
          // Create checkmark
          const checkmark = document.createElement('div');
          checkmark.innerHTML = '✓';
          checkmark.style.position = 'absolute';
          checkmark.style.top = '-2px';
          checkmark.style.left = '1px';
          checkmark.style.fontSize = '11px';
          checkmark.style.color = '#000000';
          checkBox.appendChild(checkmark);
        }
        
        itemElement.appendChild(checkBox);
      } else {
        // Add some padding where the checkbox would be
        itemElement.style.paddingLeft = '40px';
      }
      
      const label = document.createElement('span');
      label.textContent = item.label;
      itemElement.appendChild(label);
      
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
        if (item.label === 'Details Panel') {
          this.togglePanel(this.detailsPanel);
        } else if (item.label === 'Cascade Windows') {
          this.cascadeWindows();
        } else if (item.label === 'Tile Windows') {
          this.tileWindows();
        }
        
        this.closeAllMenus();
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
  
  // Update UI elements
  update() {
    // Update menu bar stats
    if (this.game.datacenter) {
      this.updateMenuStats();
    }
    
    // Update details panel if there's a selected object and panel exists
    if (this.game.selectedObject && this.detailsPanel) {
      const object = this.game.selectedObject;
      this.detailsPanel.style.display = 'block';
      
      // Make the panel draggable if it isn't already
      const titleBar = this.detailsPanel.querySelector('.win2k-titlebar');
      if (titleBar && !this.detailsPanel.dataset.draggable) {
        this.makePanelDraggable(this.detailsPanel, titleBar);
        this.detailsPanel.dataset.draggable = 'true';
      }
      
      if (object.userData.type === 'rack') {
        // Find the rack
        const rack = this.game.datacenter.racks.find(r => 
          r.container.uuid === object.parent.uuid
        );
        
        if (rack) {
          // Update details panel content for rack
          this.updateRackDetails(rack);
        }
      } else if (object.userData.type === 'server') {
        // Find the server
        let foundServer = null;
        for (const rack of this.game.datacenter.racks) {
          const server = rack.servers.find(s => s.id === object.userData.serverId);
          if (server) {
            foundServer = server;
            break;
          }
        }
        
        if (foundServer) {
          // Update details panel content for server
          this.updateServerDetails(foundServer);
        }
      }
    } else if (this.detailsPanel) {
      this.detailsPanel.style.display = 'none';
    }
    
    // Schedule next update
    requestAnimationFrame(this.update.bind(this));
  }
  
  // Update rack details panel
  updateRackDetails(rack) {
    // Add Windows 2000 style content to details panel
    const titleBar = document.createElement('div');
    titleBar.className = 'win2k-titlebar';
    titleBar.style.backgroundColor = '#0000a5'; // Windows 2000 blue
    titleBar.style.color = '#ffffff';
    titleBar.style.padding = '2px 5px';
    titleBar.style.margin = '-8px -8px 8px -8px'; // Extend to edges
    titleBar.style.fontWeight = 'bold';
    titleBar.style.fontSize = '12px';
    titleBar.textContent = 'Rack Details';
    
    // Clear panel first
    this.detailsPanel.innerHTML = '';
    this.detailsPanel.appendChild(titleBar);
    
    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 2px;">Position:</td>
          <td style="padding: 2px; text-align: right;">(${rack.container.userData.gridX}, ${rack.container.userData.gridZ})</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Servers:</td>
          <td style="padding: 2px; text-align: right;">${rack.servers.length}</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Used Space:</td>
          <td style="padding: 2px; text-align: right;">${rack.servers.reduce((total, server) => total + server.unitSize, 0)}U / ${rack.rackHeightUnits}U</td>
        </tr>
      </table>
    `;
    
    this.detailsPanel.appendChild(content);
    
    // Create Win2000 button for View Rack
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.textAlign = 'center';
    
    const viewRackBtn = this.createButton('View Rack', () => {
      this.showRackView(rack);
    });
    
    buttonContainer.appendChild(viewRackBtn);
    this.detailsPanel.appendChild(buttonContainer);
  }
  
  // Update server details panel
  updateServerDetails(server) {
    // Add Windows 2000 style content to details panel
    const titleBar = document.createElement('div');
    titleBar.className = 'win2k-titlebar';
    titleBar.style.backgroundColor = '#0000a5'; // Windows 2000 blue
    titleBar.style.color = '#ffffff';
    titleBar.style.padding = '2px 5px';
    titleBar.style.margin = '-8px -8px 8px -8px'; // Extend to edges
    titleBar.style.fontWeight = 'bold';
    titleBar.style.fontSize = '12px';
    titleBar.textContent = 'Server Details';
    
    // Clear panel first
    this.detailsPanel.innerHTML = '';
    this.detailsPanel.appendChild(titleBar);
    
    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 2px;">ID:</td>
          <td style="padding: 2px; text-align: right;">${server.id}</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Size:</td>
          <td style="padding: 2px; text-align: right;">${server.unitSize}U</td>
        </tr>
        <tr>
          <td style="padding: 2px;">CPU:</td>
          <td style="padding: 2px; text-align: right;">${server.specs.cpu.cores} cores @ ${server.specs.cpu.speed} GHz</td>
        </tr>
        <tr>
          <td style="padding: 2px;">RAM:</td>
          <td style="padding: 2px; text-align: right;">${server.specs.ram} GB</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Storage:</td>
          <td style="padding: 2px; text-align: right;">${server.specs.storage.map(s => `${s.size} GB ${s.type}`).join(', ')}</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Network:</td>
          <td style="padding: 2px; text-align: right;">${server.specs.networkCards.map(n => `${n.speed} Gbps`).join(', ')}</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Power:</td>
          <td style="padding: 2px; text-align: right;">${server.powerConsumption} W</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Temperature:</td>
          <td style="padding: 2px; text-align: right;">${server.temperature.toFixed(1)}°C</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Utilization:</td>
          <td style="padding: 2px; text-align: right;">${server.utilization.toFixed(1)}%</td>
        </tr>
        <tr>
          <td style="padding: 2px;">Revenue:</td>
          <td style="padding: 2px; text-align: right;">$${server.revenue}/hour</td>
        </tr>
      </table>
    `;
    
    this.detailsPanel.appendChild(content);
    
    // Create Win2000 button for Upgrade
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.textAlign = 'center';
    
    const upgradeBtn = this.createButton('Upgrade', () => {
      console.log('Upgrade server');
      // Show upgrade options
    });
    
    buttonContainer.appendChild(upgradeBtn);
    this.detailsPanel.appendChild(buttonContainer);
  }

  // Make a panel draggable and closable
  makePanelDraggable(panel, titleBar) {
    // Track dragging state
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Add position tracking if not already present
    if (!panel.dataset.posX) {
      panel.dataset.posX = panel.style.left || '20px';
      panel.dataset.posY = panel.style.top || '20px';
    }
    
    // Create close button if not exists
    if (!titleBar.querySelector('.win2k-close-btn')) {
      const closeBtn = document.createElement('div');
      closeBtn.className = 'win2k-close-btn';
      closeBtn.innerHTML = 'X';
      closeBtn.style.width = '16px';
      closeBtn.style.height = '16px';
      closeBtn.style.padding = '0';
      closeBtn.style.margin = '0';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.backgroundColor = '#c0c0c0';
      closeBtn.style.color = '#000000';
      closeBtn.style.border = '2px solid';
      closeBtn.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      closeBtn.style.fontSize = '10px';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.marginLeft = 'auto';
      
      closeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent dragging when clicking close button
      });
      
      closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
      });
      
      titleBar.style.display = 'flex';
      titleBar.style.alignItems = 'center';
      titleBar.appendChild(closeBtn);
    }
    
    // Make cursor indicate draggable
    titleBar.style.cursor = 'move';
    
    // Add mouse down event for dragging
    titleBar.addEventListener('mousedown', (e) => {
      isDragging = true;
      
      // Calculate the offset between mouse position and panel top-left corner
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      // Bring panel to front (increase z-index)
      this.bringToFront(panel);
      
      // Prevent text selection during drag
      e.preventDefault();
    });
    
    // Add mouse move and up events to document
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      // Calculate new position
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      // Set new position
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      
      // Update stored position
      panel.dataset.posX = `${x}px`;
      panel.dataset.posY = `${y}px`;
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Add to our tracked panels
    if (!this.draggablePanels) {
      this.draggablePanels = [];
    }
    this.draggablePanels.push(panel);
    
    return panel;
  }
  
  // Toggle panel visibility
  togglePanel(panel) {
    if (panel.style.display === 'none') {
      panel.style.display = panel.dataset.defaultDisplay || 'block';
      
      // Restore saved position if available
      if (panel.dataset.posX) {
        panel.style.left = panel.dataset.posX;
        panel.style.top = panel.dataset.posY;
      }
      
      // Bring to front
      this.bringToFront(panel);
    } else {
      // Save the default display type before hiding
      panel.dataset.defaultDisplay = panel.style.display;
      panel.style.display = 'none';
    }
  }
  
  // Bring a panel to the front
  bringToFront(panel) {
    // Find the highest z-index
    let maxZ = 100; // Base z-index
    document.querySelectorAll('.win2k-panel').forEach(p => {
      const zIndex = parseInt(p.style.zIndex || '100');
      if (zIndex > maxZ) maxZ = zIndex;
    });
    
    // Set this panel's z-index higher
    panel.style.zIndex = (maxZ + 1).toString();
  }
  
  // Arrange windows in cascade
  cascadeWindows() {
    if (!this.draggablePanels || this.draggablePanels.length === 0) return;
    
    let offsetX = 20;
    let offsetY = 40; // Start below menu bar
    
    this.draggablePanels.forEach((panel, index) => {
      if (panel.style.display !== 'none') {
        panel.style.left = `${offsetX + index * 30}px`;
        panel.style.top = `${offsetY + index * 30}px`;
        
        // Update stored position
        panel.dataset.posX = panel.style.left;
        panel.dataset.posY = panel.style.top;
        
        // Set z-index based on order
        panel.style.zIndex = (100 + index).toString();
      }
    });
  }
  
  // Arrange windows in tiles
  tileWindows() {
    if (!this.draggablePanels || this.draggablePanels.length === 0) return;
    
    // Filter visible panels
    const visiblePanels = this.draggablePanels.filter(p => p.style.display !== 'none');
    if (visiblePanels.length === 0) return;
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate tile layout
    const cols = Math.ceil(Math.sqrt(visiblePanels.length));
    const rows = Math.ceil(visiblePanels.length / cols);
    
    // Calculate tile dimensions
    const tileWidth = windowWidth / cols;
    const tileHeight = (windowHeight - 40) / rows; // Account for menu bar
    
    // Position each panel
    visiblePanels.forEach((panel, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      panel.style.left = `${col * tileWidth}px`;
      panel.style.top = `${40 + row * tileHeight}px`; // 40px for menu bar
      panel.style.width = `${tileWidth - 20}px`; // Subtract padding
      panel.style.height = `${tileHeight - 20}px`; // Subtract padding
      
      // Update stored position
      panel.dataset.posX = panel.style.left;
      panel.dataset.posY = panel.style.top;
      
      // Set z-index based on order
      panel.style.zIndex = (100 + index).toString();
    });
  }
  
  // Show UI for purchasing a circuit
  showCircuitPurchaseUI() {
    // Create modal content container with Windows 2000 styling
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add Windows 2000 style title bar
    const titleBar = document.createElement('div');
    titleBar.style.backgroundColor = '#0000a5'; // Windows 2000 blue
    titleBar.style.color = '#ffffff';
    titleBar.style.padding = '3px 5px';
    titleBar.style.margin = '-2px -2px 5px -2px'; // Extend to edges
    titleBar.style.fontWeight = 'bold';
    titleBar.style.fontSize = '12px';
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.alignItems = 'center';
    
    // Add title text
    const titleText = document.createElement('span');
    titleText.textContent = 'Purchase Internet Circuit';
    titleBar.appendChild(titleText);
    
    // Add close button (Windows 2000 style X)
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X';
    closeButton.style.width = '16px';
    closeButton.style.height = '16px';
    closeButton.style.padding = '0';
    closeButton.style.margin = '0';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.backgroundColor = '#c0c0c0';
    closeButton.style.color = '#000000';
    closeButton.style.border = '2px solid';
    closeButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    closeButton.style.fontSize = '10px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => this.closeModal());
    titleBar.appendChild(closeButton);
    
    modalContent.appendChild(titleBar);
    
    // Add circuit options
    const content = document.createElement('div');
    content.style.padding = '10px';
    content.innerHTML = `
      <p style="margin-bottom: 15px;">Select a circuit to purchase for your datacenter:</p>
      <div id="circuit-options" style="display: flex; flex-direction: column; gap: 10px;"></div>
      <div style="margin-top: 20px; text-align: center;">
        <button id="purchase-circuit-btn" disabled>Purchase</button>
        <button id="cancel-purchase-btn">Cancel</button>
      </div>
    `;
    
    // Style the buttons in Windows 2000 fashion
    modalContent.appendChild(content);
    
    // Show the modal
    this.openModal(modalContent);
    
    // Style the buttons after they're in the DOM
    const purchaseBtn = document.getElementById('purchase-circuit-btn');
    const cancelBtn = document.getElementById('cancel-purchase-btn');
    
    [purchaseBtn, cancelBtn].forEach(btn => {
      btn.style.padding = '4px 8px';
      btn.style.backgroundColor = '#c0c0c0';
      btn.style.color = '#000000';
      btn.style.border = '2px solid';
      btn.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      btn.style.borderRadius = '0';
      btn.style.cursor = 'pointer';
      btn.style.fontFamily = 'Tahoma, Arial, sans-serif';
      btn.style.fontSize = '11px';
      btn.style.marginLeft = '5px';
      btn.style.marginRight = '5px';
    });
    
    // Disable the purchase button initially
    purchaseBtn.disabled = true;
    purchaseBtn.style.opacity = '0.5';
    
    // Populate circuit options
    const circuitOptionsContainer = document.getElementById('circuit-options');
    let selectedCircuitType = null;
    
    // Add each circuit type as a radio button option
    Object.entries(CIRCUIT_TYPES).forEach(([type, specs]) => {
      const optionContainer = document.createElement('div');
      optionContainer.style.display = 'flex';
      optionContainer.style.alignItems = 'center';
      optionContainer.style.gap = '10px';
      optionContainer.style.padding = '8px';
      optionContainer.style.border = '1px solid #808080';
      optionContainer.style.cursor = 'pointer';
      
      // Create radio button
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'circuit-type';
      radio.value = type;
      radio.id = `circuit-${type}`;
      radio.style.cursor = 'pointer';
      
      // Create label
      const label = document.createElement('label');
      label.htmlFor = `circuit-${type}`;
      label.style.cursor = 'pointer';
      label.style.flex = '1';
      
      // Add circuit info
      label.innerHTML = `
        <div><strong>${specs.name}</strong></div>
        <div>Speed: ${specs.speed} Gbps</div>
        <div>Cost: $${specs.cost}/month</div>
        <div>Max Connections: ${specs.maxConnections}</div>
      `;
      
      // Add colored indicator
      const colorIndicator = document.createElement('div');
      colorIndicator.style.width = '20px';
      colorIndicator.style.height = '20px';
      colorIndicator.style.backgroundColor = `#${specs.color.toString(16).padStart(6, '0')}`;
      colorIndicator.style.border = '1px solid #808080';
      
      // Add selection handler
      optionContainer.addEventListener('click', () => {
        // Select this option
        radio.checked = true;
        selectedCircuitType = type;
        
        // Update container styling to show selection
        document.querySelectorAll('#circuit-options > div').forEach(div => {
          div.style.backgroundColor = '';
        });
        optionContainer.style.backgroundColor = '#e0e0e0'; // Light gray background for selected option
        
        // Enable purchase button
        purchaseBtn.disabled = false;
        purchaseBtn.style.opacity = '1';
      });
      
      // Assemble option
      optionContainer.appendChild(radio);
      optionContainer.appendChild(label);
      optionContainer.appendChild(colorIndicator);
      circuitOptionsContainer.appendChild(optionContainer);
    });
    
    // Add purchase button handler
    purchaseBtn.addEventListener('click', () => {
      if (selectedCircuitType) {
        const circuitSpecs = CIRCUIT_TYPES[selectedCircuitType];
        const cost = circuitSpecs.cost;
        
        // Check if player has enough funds
        if (this.game.datacenter.funds >= cost) {
          // Deduct initial cost (one month's fee)
          this.game.datacenter.updateFunds(-cost);
          
          // Add circuit to egress router
          this.game.datacenter.egressRouter.addCircuit(selectedCircuitType);
          
          // Show success message
          alert(`Successfully purchased ${circuitSpecs.name} for $${cost}!`);
          
          // Close modal
          this.closeModal();
          
          // Update stats
          this.updateMenuStats();
        } else {
          alert(`Not enough funds! You need $${cost} to purchase this circuit.`);
        }
      }
    });
    
    // Add cancel button handler
    cancelBtn.addEventListener('click', () => {
      this.closeModal();
    });
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
    this.modalOverlay.show();
    
    // Force browser reflow
    void this.modalOverlay.offsetWidth;
    
    console.log('Modal displayed with content:', content);
  }
  
  closeModal() {
    console.log('CLOSING MODAL - DIRECT APPROACH');
    
    // Hide the modal directly
    this.modalOverlay.hide();
    
    // Reset state after a small delay
    setTimeout(() => {
      this.currentRack = null;
      this.selectedServer = null;
      this.dragData = null;
    }, 50);
  }
  
  // Add drag and drop event listeners to an element
  addDragEvents(element, item, itemType) {
    element.draggable = true;
    
    element.addEventListener('dragstart', (e) => {
      e.preventDefault(); // Prevent default drag behavior, we'll implement our own
    });
    
    // Custom mouse-based dragging (more control than HTML5 drag and drop)
    element.addEventListener('mousedown', (e) => {
      // Only allow drag from the element itself (not child elements like buttons)
      if (e.target !== element && !e.target.classList.contains('server-name') && 
          !e.target.classList.contains('server-led')) {
        return;
      }
      
      // Start the drag
      this.dragData.isDragging = true;
      this.dragData.draggedElement = element;
      this.dragData.draggedType = itemType;
      this.dragData.draggedItemId = item.id;
      this.dragData.sourcePosition = parseInt(element.dataset.position);
      this.dragData.unitSize = parseInt(element.dataset.unitSize);
      
      // Calculate the offset where the user clicked within the element
      const rect = element.getBoundingClientRect();
      this.dragData.dragOffset = e.clientY - rect.top;
      
      // Add dragging class for visual feedback
      element.classList.add('dragging');
      
      // Prevent text selection during drag
      e.preventDefault();
      
      // Add mouse move and mouse up listeners to the document
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    });
    
    // Store these handlers bound to the UI instance
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }
  
  // Handle mouse movement during drag
  handleMouseMove(e) {
    if (!this.dragData.isDragging) return;
    
    const draggedElement = this.dragData.draggedElement;
    const rackMain = draggedElement.parentElement;
    const rackRect = rackMain.getBoundingClientRect();
    
    // Calculate position relative to the rack
    const relativeY = e.clientY - rackRect.top - this.dragData.dragOffset;
    
    // Convert to a "bottom" position (since we're using bottom for positioning)
    const bottomPosition = rackRect.height - relativeY - draggedElement.offsetHeight;
    
    // Update the element position
    draggedElement.style.bottom = `${bottomPosition}px`;
    
    // Find the closest rack unit position
    const unitSize = this.dragData.unitSize;
    const rackUnitHeight = 20; // Height of one rack unit in pixels
    const closestUnit = Math.round(bottomPosition / rackUnitHeight);
    
    // Highlight potential drop targets
    const slots = rackMain.querySelectorAll('.server-slot');
    let canDrop = true;
    
    // Check if the target position is valid
    if (closestUnit < 0 || closestUnit + unitSize > this.currentRack.rackHeightUnits) {
      canDrop = false;
    } else {
      // Check for overlaps with other equipment
      for (let i = 0; i < unitSize; i++) {
        const position = closestUnit + i;
        if (!this.currentRack.isPositionAvailable(position, 1, this.dragData.draggedItemId)) {
          canDrop = false;
          break;
        }
      }
    }
    
    // Remove previous drop target highlights
    slots.forEach(slot => slot.classList.remove('drop-target'));
    
    // If it's a valid position, highlight the drop target slots
    if (canDrop) {
      this.dragData.dropTarget = closestUnit;
      
      for (let i = 0; i < unitSize; i++) {
        const position = closestUnit + i;
        const slot = slots[this.currentRack.rackHeightUnits - position - 1]; // Convert to array index (reversed)
        if (slot) {
          slot.classList.add('drop-target');
        }
      }
    } else {
      this.dragData.dropTarget = null;
    }
  }
  
  // Handle mouse up (drop) event
  handleMouseUp(e) {
    if (!this.dragData.isDragging) return;
    
    // Remove document-level event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    const draggedElement = this.dragData.draggedElement;
    draggedElement.classList.remove('dragging');
    
    // Get all slots and remove drop-target class
    const slots = draggedElement.parentElement.querySelectorAll('.server-slot');
    slots.forEach(slot => slot.classList.remove('drop-target'));
    
    // Check if we have a valid drop target
    if (this.dragData.dropTarget !== null) {
      const newPosition = this.dragData.dropTarget;
      const oldPosition = this.dragData.sourcePosition;
      
      // Only proceed if the position actually changed
      if (newPosition !== oldPosition) {
        // Update the position in the data model
        if (this.dragData.draggedType === 'server') {
          // Find the server
          const server = this.currentRack.servers.find(s => s.id === this.dragData.draggedItemId);
          if (server) {
            // Move the server in the data model
            this.moveRackItem(server, newPosition);
          }
        } else if (this.dragData.draggedType === 'network') {
          // Find the network equipment
          const equipment = this.currentRack.networkEquipment.find(eq => eq.id === this.dragData.draggedItemId);
          if (equipment) {
            // Move the equipment in the data model
            this.moveRackItem(equipment, newPosition);
          }
        }
        
        // Update the visual position
        draggedElement.style.bottom = `${newPosition * 20}px`;
        draggedElement.dataset.position = newPosition;
      } else {
        // If position didn't change, reset to original position
        draggedElement.style.bottom = `${oldPosition * 20}px`;
      }
    } else {
      // Invalid drop - reset to original position
      draggedElement.style.bottom = `${this.dragData.sourcePosition * 20}px`;
    }
    
    // Reset drag state
    this.dragData.isDragging = false;
    this.dragData.draggedElement = null;
    this.dragData.draggedType = null;
    this.dragData.draggedItemId = null;
    this.dragData.sourcePosition = null;
    this.dragData.dropTarget = null;
  }
  
  // Move an item (server or network equipment) to a new position in the rack
  moveRackItem(item, newPosition) {
    // Update the item's position
    item.position = newPosition;
    
    // If we need to update any connections or dependencies, do it here
    if (this.game.cableManager) {
      this.game.cableManager.updateAllCables();
    }
  }
  
  showRackView(rack) {
    console.log("SHOW RACK VIEW CALLED FOR RACK:", rack);
    
    // Debug DOM state
    console.log("DOM state at showRackView start:");
    console.log("- modalOverlay display:", this.modalOverlay.style.display);
    console.log("- body children count:", document.body.children.length);
    
    this.currentRack = rack;
    this.dragData = {
      isDragging: false,
      draggedElement: null,
      draggedType: null,
      draggedItemId: null,
      sourcePosition: null,
      dragOffset: 0,
      dropTarget: null
    };
    
    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add Windows 2000 style title bar with close button
    const titleBar = document.createElement('div');
    titleBar.style.backgroundColor = '#0000a5'; // Windows 2000 blue
    titleBar.style.color = '#ffffff';
    titleBar.style.padding = '3px 5px';
    titleBar.style.margin = '-2px -2px 5px -2px'; // Extend to edges
    titleBar.style.fontWeight = 'bold';
    titleBar.style.fontSize = '12px';
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.alignItems = 'center';
    
    // Add title text
    const titleText = document.createElement('span');
    titleText.textContent = `Rack ${rack.container.userData.gridX},${rack.container.userData.gridZ} - ${rack.rackHeightUnits}U`;
    titleBar.appendChild(titleText);
    
    // Add close button (Windows 2000 style X)
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X';
    closeButton.style.width = '16px';
    closeButton.style.height = '16px';
    closeButton.style.padding = '0';
    closeButton.style.margin = '0';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.backgroundColor = '#c0c0c0';
    closeButton.style.color = '#000000';
    closeButton.style.border = '2px solid';
    closeButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    closeButton.style.fontSize = '10px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => this.closeModal());
    
    titleBar.appendChild(closeButton);
    modalContent.appendChild(titleBar);
    
    // Create rack view container with Windows 2000 styling
    const rackView = document.createElement('div');
    rackView.className = 'rack-view';
    rackView.style.padding = '10px';
    rackView.style.fontFamily = 'Tahoma, Arial, sans-serif';
    rackView.style.fontSize = '11px';
    
    // Create rack container (with unit numbers and main rack area)
    const rackContainer = document.createElement('div');
    rackContainer.className = 'rack-container';
    
    // Add unit numbers column
    const rackUnits = document.createElement('div');
    rackUnits.className = 'rack-units';
    
    for (let i = 1; i <= rack.rackHeightUnits; i++) {
      const unitNumber = document.createElement('div');
      unitNumber.className = 'rack-unit-number';
      unitNumber.textContent = i;
      rackUnits.appendChild(unitNumber);
    }
    
    rackContainer.appendChild(rackUnits);
    
    // Add main rack area
    const rackMain = document.createElement('div');
    rackMain.className = 'rack-main';
    
    // Add empty server slots
    for (let i = 1; i <= rack.rackHeightUnits; i++) {
      const slot = document.createElement('div');
      slot.className = 'server-slot';
      slot.dataset.position = i;
      rackMain.appendChild(slot);
    }
    
    // Add servers to the rack view
    rack.servers.forEach(server => {
      const serverElement = document.createElement('div');
      serverElement.className = 'rack-server draggable';
      serverElement.dataset.type = 'server';
      serverElement.dataset.id = server.id;
      serverElement.dataset.position = server.position;
      serverElement.dataset.unitSize = server.unitSize;
      
      // Set height based on server unit size
      const height = server.unitSize * 20;
      
      // Set position (convert from 0-indexed to 1-indexed)
      const bottom = (server.position) * 20;
      
      serverElement.style.height = `${height}px`;
      serverElement.style.bottom = `${bottom}px`;
      
      // Add server color based on unit size
      let serverColor;
      switch(server.unitSize) {
        case 1: serverColor = '#4CAF50'; break; // Green for 1U
        case 2: serverColor = '#2196F3'; break; // Blue for 2U
        case 4: serverColor = '#FF9800'; break; // Orange for 4U
        default: serverColor = '#9C27B0'; break; // Purple for others
      }
      serverElement.style.borderLeft = `4px solid ${serverColor}`;
      
      // Add LEDs
      const powerLed = document.createElement('div');
      powerLed.className = 'server-led power';
      serverElement.appendChild(powerLed);
      
      const activityLed = document.createElement('div');
      activityLed.className = 'server-led activity';
      // Blink if server is active
      if (server.utilization > 5) {
        activityLed.style.animation = 'blink 1s infinite';
      }
      serverElement.appendChild(activityLed);
      
      // Add server name
      const serverName = document.createElement('div');
      serverName.className = 'server-name';
      serverName.textContent = `${server.unitSize}U Server - ${server.specs.cpu.cores} CPU, ${server.specs.ram}GB RAM`;
      serverElement.appendChild(serverName);
      
      // Add server element to rack main area
      rackMain.appendChild(serverElement);
      
      // Add drag & drop events
      this.addDragEvents(serverElement, server, 'server');
      
      // Add click event to show server details - only trigger on non-drag interactions
      let isDragging = false;
      serverElement.addEventListener('mousedown', () => {
        isDragging = false;
      });
      serverElement.addEventListener('mousemove', () => {
        if (this.dragData.isDragging) isDragging = true;
      });
      serverElement.addEventListener('mouseup', () => {
        if (!isDragging && !this.dragData.isDragging) {
          this.showServerDetails(server);
        }
      });
    });
    
    // Add network equipment to the rack view
    rack.networkEquipment.forEach(equipment => {
      const equipmentElement = document.createElement('div');
      equipmentElement.className = 'rack-server network-equipment draggable';
      equipmentElement.dataset.type = 'network';
      equipmentElement.dataset.id = equipment.id;
      equipmentElement.dataset.position = equipment.position;
      equipmentElement.dataset.unitSize = equipment.unitSize;
      
      // Set height based on equipment unit size
      const height = equipment.unitSize * 20;
      
      // Set position (convert from 0-indexed to 1-indexed)
      const bottom = (equipment.position) * 20;
      
      equipmentElement.style.height = `${height}px`;
      equipmentElement.style.bottom = `${bottom}px`;
      
      // Add equipment color based on type
      equipmentElement.style.borderLeft = `4px solid #${equipment.specs.color.toString(16).padStart(6, '0')}`;
      
      // Add LEDs
      const powerLed = document.createElement('div');
      powerLed.className = 'server-led power';
      equipmentElement.appendChild(powerLed);
      
      const activityLed = document.createElement('div');
      activityLed.className = 'server-led activity';
      // Blink if equipment is active
      if (equipment.utilization > 5) {
        activityLed.style.animation = 'blink 1s infinite';
      }
      equipmentElement.appendChild(activityLed);
      
      // Add equipment name
      const equipmentName = document.createElement('div');
      equipmentName.className = 'server-name';
      equipmentName.textContent = `${equipment.specs.name} - ${equipment.numPorts} ports`;
      equipmentElement.appendChild(equipmentName);
      
      // Add equipment element to rack main area
      rackMain.appendChild(equipmentElement);
      
      // Add drag & drop events
      this.addDragEvents(equipmentElement, equipment, 'network');
      
      // Add click event to show equipment details - only trigger on non-drag interactions
      let isDragging = false;
      equipmentElement.addEventListener('mousedown', () => {
        isDragging = false;
      });
      equipmentElement.addEventListener('mousemove', () => {
        if (this.dragData.isDragging) isDragging = true;
      });
      equipmentElement.addEventListener('mouseup', () => {
        if (!isDragging && !this.dragData.isDragging) {
          this.showNetworkEquipmentDetails(equipment);
        }
      });
    });
    
    rackContainer.appendChild(rackMain);
    rackView.appendChild(rackContainer);
    
    // Add Windows 98/2000 style toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'server-toolbar';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '6px';
    toolbar.style.marginTop = '10px';
    toolbar.style.padding = '6px';
    toolbar.style.backgroundColor = '#d4d0c8';
    toolbar.style.border = '2px solid';
    toolbar.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    
    // Create Windows 98/2000 style buttons
    const createWin98Button = (text, onClick) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.padding = '4px 8px';
      btn.style.backgroundColor = '#c0c0c0';
      btn.style.color = '#000000';
      btn.style.border = '2px solid';
      btn.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      btn.style.borderRadius = '0';
      btn.style.cursor = 'pointer';
      btn.style.fontFamily = 'Tahoma, Arial, sans-serif';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = 'normal';
      btn.style.textAlign = 'center';
      btn.style.boxShadow = '1px 1px 0px #000000';
      
      btn.addEventListener('mousedown', () => {
        btn.style.backgroundColor = '#a0a0a0';
        btn.style.borderColor = '#808080 #ffffff #ffffff #808080';
        btn.style.transform = 'translateY(1px)';
      });
      
      btn.addEventListener('mouseup', () => {
        btn.style.backgroundColor = '#c0c0c0';
        btn.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        btn.style.transform = 'translateY(0)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = '#c0c0c0';
        btn.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        btn.style.transform = 'translateY(0)';
      });
      
      btn.addEventListener('click', onClick);
      return btn;
    };
    
    const addServerBtn = createWin98Button('Add Server', () => {
      this.showAddServerUI(rack);
    });
    toolbar.appendChild(addServerBtn);
    
    const addNetworkBtn = createWin98Button('Add Network Equipment', () => {
      this.showAddNetworkEquipmentUI(rack);
    });
    toolbar.appendChild(addNetworkBtn);
    
    const manageBtn = createWin98Button('Manage Cables', () => {
      this.showCableManagementUI(rack);
    });
    toolbar.appendChild(manageBtn);
    
    rackView.appendChild(toolbar);
    
    // Add equipment details section
    const equipmentDetails = document.createElement('div');
    equipmentDetails.className = 'server-details';
    equipmentDetails.id = 'equipment-details';
    rackView.appendChild(equipmentDetails);
    
    modalContent.appendChild(rackView);
    
    // Open the modal
    this.openModal(modalContent);
  }
  
  // Display cable management interface
  showCableManagementUI(rack) {
    // Get the equipment details div
    const equipmentDetails = document.getElementById('equipment-details');
    equipmentDetails.classList.add('active');
    
    equipmentDetails.innerHTML = `
      <h3>Cable Management</h3>
      <p>Hold the 'C' key and click on a port to start connecting a cable.</p>
      <p>Click on another port to complete the connection.</p>
      <p>Press ESC to cancel the current cable connection.</p>
      
      <h4>Network Equipment</h4>
      <div id="network-equipment-list"></div>
      
      <h4>Active Connections</h4>
      <div id="connections-list"></div>
      
      <h4>VLAN Configuration</h4>
      <div id="vlan-configuration"></div>
    `;
    
    const networkList = document.getElementById('network-equipment-list');
    
    // Show all network equipment in the rack
    rack.networkEquipment.forEach(equipment => {
      const equipmentItem = document.createElement('div');
      equipmentItem.className = 'network-item';
      equipmentItem.innerHTML = `
        <div class="network-item-header">
          <div class="network-item-name">${equipment.name} (${equipment.specs.name})</div>
          <div class="network-item-ports">${equipment.ports.filter(p => p.status === 'up').length}/${equipment.ports.length} ports connected</div>
        </div>
      `;
      
      // Add click handler to show ports
      equipmentItem.addEventListener('click', () => {
        this.showNetworkEquipmentDetails(equipment);
      });
      
      networkList.appendChild(equipmentItem);
    });
    
    // Toggle cable mode when entering cable management
    this.game.toggleCableMode(true);
    
    // Add event listener to exit cable mode when closing dialog
    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
      const originalClick = closeButton.onclick;
      closeButton.onclick = () => {
        this.game.toggleCableMode(false);
        if (originalClick) originalClick();
      };
    }
  }
  
  // Show UI for adding a server to the rack
  showAddServerUI(rack) {
    // Get the equipment details div
    const equipmentDetails = document.getElementById('equipment-details');
    equipmentDetails.classList.add('active');
    
    // Calculate available positions in the rack
    const availablePositions = [];
    for (let i = 0; i < rack.rackHeightUnits; i++) {
      // Check different server sizes at this position
      const available1U = rack.isPositionAvailable(i, 1);
      const available2U = rack.isPositionAvailable(i, 2);
      const available4U = rack.isPositionAvailable(i, 4);
      
      if (available1U || available2U || available4U) {
        availablePositions.push({
          position: i,
          available1U,
          available2U,
          available4U
        });
      }
    }
    
    equipmentDetails.innerHTML = `
      <h3>Add Server</h3>
      <p>Select a server size and position to add it to the rack.</p>
      
      <div class="form-group">
        <label for="server-size">Server Size:</label>
        <select id="server-size">
          <option value="1">1U</option>
          <option value="2">2U</option>
          <option value="4">4U</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="server-position">Position:</label>
        <select id="server-position"></select>
      </div>
      
      <button id="add-server-btn">Add Server</button>
    `;
    
    // Populate the position dropdown based on selected size
    const sizeSelect = document.getElementById('server-size');
    const positionSelect = document.getElementById('server-position');
    
    const updatePositions = () => {
      const size = parseInt(sizeSelect.value);
      positionSelect.innerHTML = '';
      
      for (const pos of availablePositions) {
        if ((size === 1 && pos.available1U) || 
            (size === 2 && pos.available2U) || 
            (size === 4 && pos.available4U)) {
          const option = document.createElement('option');
          option.value = pos.position;
          option.textContent = `Position ${pos.position + 1}`;
          positionSelect.appendChild(option);
        }
      }
    };
    
    sizeSelect.addEventListener('change', updatePositions);
    updatePositions(); // Initial population
    
    // Add server button handler
    document.getElementById('add-server-btn').addEventListener('click', () => {
      const size = parseInt(sizeSelect.value);
      const position = parseInt(positionSelect.value);
      
      if (!isNaN(size) && !isNaN(position)) {
        const server = rack.addServer(position, size);
        if (server) {
          // Close and reopen rack view to refresh
          this.closeModal();
          this.showRackView(rack);
        }
      }
    });
  }
  
  // Show UI for adding network equipment
  showAddNetworkEquipmentUI(rack) {
    // Get the equipment details div
    const equipmentDetails = document.getElementById('equipment-details');
    equipmentDetails.classList.add('active');
    
    // Calculate available positions (assuming 1U for network equipment)
    const availablePositions = [];
    for (let i = 0; i < rack.rackHeightUnits; i++) {
      if (rack.isPositionAvailable(i, 1)) {
        availablePositions.push(i);
      }
    }
    
    equipmentDetails.innerHTML = `
      <h3>Add Network Equipment</h3>
      <p>Select the type of network equipment to add to the rack.</p>
      
      <div class="form-group">
        <label for="equipment-type">Equipment Type:</label>
        <select id="equipment-type">
          <option value="SWITCH">Switch</option>
          <option value="ROUTER">Router</option>
          <option value="FIREWALL">Firewall</option>
          <option value="PATCH_PANEL">Patch Panel</option>
          <option value="LOAD_BALANCER">Load Balancer</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="port-count">Number of Ports:</label>
        <select id="port-count">
          <option value="8">8 Ports</option>
          <option value="16">16 Ports</option>
          <option value="24" selected>24 Ports</option>
          <option value="48">48 Ports</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="port-type">Port Type:</label>
        <select id="port-type">
          <option value="ethernet">Ethernet (RJ45)</option>
          <option value="sfp">SFP (1G Fiber)</option>
          <option value="sfp+">SFP+ (10G Fiber)</option>
          <option value="qsfp">QSFP+ (40G Fiber)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="equipment-position">Position:</label>
        <select id="equipment-position"></select>
      </div>
      
      <button id="add-equipment-btn">Add Equipment</button>
    `;
    
    // Populate position dropdown
    const positionSelect = document.getElementById('equipment-position');
    for (const position of availablePositions) {
      const option = document.createElement('option');
      option.value = position;
      option.textContent = `Position ${position + 1}`;
      positionSelect.appendChild(option);
    }
    
    // Add equipment button handler
    document.getElementById('add-equipment-btn').addEventListener('click', () => {
      const type = document.getElementById('equipment-type').value;
      const portCount = parseInt(document.getElementById('port-count').value);
      const portType = document.getElementById('port-type').value;
      const position = parseInt(positionSelect.value);
      
      if (type && !isNaN(portCount) && portType && !isNaN(position)) {
        const options = {
          numPorts: portCount,
          portType: portType
        };
        
        const equipment = rack.addNetworkEquipment(type, position, options);
        if (equipment) {
          // Close and reopen rack view to refresh
          this.closeModal();
          this.showRackView(rack);
        }
      }
    });
  }
  
  // Show network equipment details
  showNetworkEquipmentDetails(equipment) {
    const equipmentDetails = document.getElementById('equipment-details');
    equipmentDetails.classList.add('active');
    
    let portsList = '';
    equipment.ports.forEach(port => {
      const statusClass = port.status === 'up' ? 'port-up' : 'port-down';
      const connectedText = port.connected ? 'Connected' : 'Not connected';
      portsList += `
        <div class="port-item ${statusClass}">
          <div class="port-id">Port ${port.id}</div>
          <div class="port-type">${port.type.toUpperCase()}</div>
          <div class="port-speed">${port.speed} Gbps</div>
          <div class="port-status">${connectedText}</div>
          ${port.vlan ? `<div class="port-vlan">VLAN: ${port.vlan}</div>` : ''}
        </div>
      `;
    });
    
    // Group ports into two columns for better display
    const halfwayPoint = Math.ceil(equipment.ports.length / 2);
    const firstColumnPorts = portsList.split('</div>').slice(0, halfwayPoint).join('</div>') + '</div>';
    const secondColumnPorts = portsList.split('</div>').slice(halfwayPoint).join('</div>');
    
    equipmentDetails.innerHTML = `
      <h3>${equipment.name}</h3>
      <p>${equipment.specs.description}</p>
      
      <h4>Specifications</h4>
      <p>Type: ${equipment.specs.name}</p>
      <p>Ports: ${equipment.ports.length} (${equipment.portType.toUpperCase()})</p>
      <p>Power: ${equipment.powerConsumption} W</p>
      <p>Status: ${equipment.status}</p>
      <p>Utilization: ${equipment.utilization.toFixed(1)}%</p>
      <p>Temperature: ${equipment.temperature.toFixed(1)}°C</p>
      <p>IP Address: ${equipment.ipAddress || 'Not connected'}</p>
      <p>Gateway: ${equipment.gateway || 'N/A'}</p>
      <p>Status: ${equipment.connected ? 'Connected' : 'No internet connectivity'}</p>
      
      <h4>Ports</h4>
      <div class="ports-container">
        <div class="ports-column">${firstColumnPorts}</div>
        <div class="ports-column">${secondColumnPorts}</div>
      </div>
      
      ${equipment.specs.capabilities.includes('vlan') ? `
        <h4>VLAN Configuration</h4>
        <div class="vlan-container">
          ${Object.keys(equipment.vlans).map(vlanId => `
            <div class="vlan-item">
              <div class="vlan-id">VLAN ${vlanId}</div>
              <div class="vlan-name">${equipment.vlans[vlanId].name}</div>
              <div class="vlan-ports">Ports: ${equipment.vlans[vlanId].ports.join(', ') || 'None'}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="form-group">
          <button id="add-vlan-btn">Add VLAN</button>
          <button id="manage-vlans-btn">Manage VLANs</button>
        </div>
      ` : ''}
      
      <div class="form-group">
        <button id="back-to-rack-btn">Back to Rack</button>
        <button id="manage-equipment-btn">Manage Equipment</button>
      </div>
    `;
    
    // Add event handlers for buttons
    document.getElementById('back-to-rack-btn').addEventListener('click', () => {
      equipmentDetails.classList.remove('active');
    });
    
    if (equipment.specs.capabilities.includes('vlan')) {
      const addVlanBtn = document.getElementById('add-vlan-btn');
      if (addVlanBtn) {
        addVlanBtn.addEventListener('click', () => {
          this.showAddVlanUI(equipment);
        });
      }
      
      const manageVlansBtn = document.getElementById('manage-vlans-btn');
      if (manageVlansBtn) {
        manageVlansBtn.addEventListener('click', () => {
          this.showManageVlansUI(equipment);
        });
      }
    }
  }
  
  // Show UI for adding a new VLAN
  showAddVlanUI(equipment) {
    const equipmentDetails = document.getElementById('equipment-details');
    
    equipmentDetails.innerHTML = `
      <h3>Add VLAN</h3>
      <p>Create a new VLAN for ${equipment.name}.</p>
      
      <div class="form-group">
        <label for="vlan-id">VLAN ID (1-4094):</label>
        <input type="number" id="vlan-id" min="1" max="4094" value="100">
      </div>
      
      <div class="form-group">
        <label for="vlan-name">VLAN Name:</label>
        <input type="text" id="vlan-name" placeholder="e.g. Data, Voice, Management">
      </div>
      
      <div class="form-group">
        <button id="create-vlan-btn">Create VLAN</button>
        <button id="cancel-vlan-btn">Cancel</button>
      </div>
    `;
    
    // Button handlers
    document.getElementById('create-vlan-btn').addEventListener('click', () => {
      const vlanId = parseInt(document.getElementById('vlan-id').value);
      const vlanName = document.getElementById('vlan-name').value;
      
      if (!isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094 && vlanName) {
        equipment.createVlan(vlanId, vlanName);
        this.showNetworkEquipmentDetails(equipment);
      }
    });
    
    document.getElementById('cancel-vlan-btn').addEventListener('click', () => {
      this.showNetworkEquipmentDetails(equipment);
    });
  }
  
  // Show UI for managing VLANs
  showManageVlansUI(equipment) {
    const equipmentDetails = document.getElementById('equipment-details');
    
    // Create VLAN options for dropdown
    const vlanOptions = Object.keys(equipment.vlans).map(vlanId => 
      `<option value="${vlanId}">${vlanId} - ${equipment.vlans[vlanId].name}</option>`
    ).join('');
    
    equipmentDetails.innerHTML = `
      <h3>Manage VLANs</h3>
      <p>Assign ports to VLANs for ${equipment.name}.</p>
      
      <div class="form-group">
        <label for="vlan-select">Select VLAN:</label>
        <select id="vlan-select">
          ${vlanOptions}
        </select>
      </div>
      
      <h4>Ports</h4>
      <div id="port-assignment-container"></div>
      
      <div class="form-group">
        <button id="save-vlan-config-btn">Save</button>
        <button id="back-to-equipment-btn">Back</button>
      </div>
    `;
    
    const portAssignmentContainer = document.getElementById('port-assignment-container');
    const vlanSelect = document.getElementById('vlan-select');
    
    // Function to update port display based on VLAN selection
    const updatePortDisplay = () => {
      const selectedVlanId = parseInt(vlanSelect.value);
      const selectedVlan = equipment.vlans[selectedVlanId];
      
      let portHtml = '';
      equipment.ports.forEach(port => {
        const isAssigned = selectedVlan.ports.includes(port.id);
        portHtml += `
          <div class="port-assignment-item">
            <label>
              <input type="checkbox" data-port-id="${port.id}" ${isAssigned ? 'checked' : ''}>
              Port ${port.id} (${port.type.toUpperCase()}, ${port.speed} Gbps)
            </label>
          </div>
        `;
      });
      
      portAssignmentContainer.innerHTML = portHtml;
    };
    
    vlanSelect.addEventListener('change', updatePortDisplay);
    updatePortDisplay(); // Initial display
    
    // Save button handler
    document.getElementById('save-vlan-config-btn').addEventListener('click', () => {
      const selectedVlanId = parseInt(vlanSelect.value);
      
      // Clear existing ports from this VLAN
      equipment.vlans[selectedVlanId].ports = [];
      
      // Get all checked port checkboxes
      const portCheckboxes = document.querySelectorAll('input[data-port-id]:checked');
      portCheckboxes.forEach(checkbox => {
        const portId = parseInt(checkbox.dataset.portId);
        equipment.addPortToVlan(portId, selectedVlanId);
      });
      
      this.showNetworkEquipmentDetails(equipment);
    });
    
    document.getElementById('back-to-equipment-btn').addEventListener('click', () => {
      this.showNetworkEquipmentDetails(equipment);
    });
  }
  
  showServerDetails(server) {
    this.selectedServer = server;
    
    const equipmentDetails = document.getElementById('equipment-details');
    equipmentDetails.classList.add('active');
    
    equipmentDetails.innerHTML = `
      <h3>Server Details</h3>
      <p>ID: ${server.id}</p>
      <p>Size: ${server.unitSize}U</p>
      <p>Position: ${server.position + 1}</p>
      <h4>Specifications</h4>
      <p>CPU: ${server.specs.cpu.cores} cores @ ${server.specs.cpu.speed} GHz</p>
      <p>RAM: ${server.specs.ram} GB</p>
      <p>Storage: ${server.specs.storage.map(s => `${s.size} GB ${s.type}`).join(', ')}</p>
      <p>Network: ${server.specs.networkCards.map(n => `${n.speed} Gbps`).join(', ')}</p>
      <h4>Performance</h4>
      <p>Power Consumption: ${server.powerConsumption} W</p>
      <p>Temperature: ${server.temperature.toFixed(1)}°C</p>
      <p>Utilization: ${server.utilization.toFixed(1)}%</p>
      <p>Revenue: $${server.revenue}/hour</p>
      <h4>Network</h4>
      <p>IP Address: ${server.ipAddress || 'Not connected'}</p>
      <p>Gateway: ${server.gateway || 'N/A'}</p>
      <p>Status: ${server.connected ? 'Connected to internet' : 'No internet connectivity'}</p>
      <div style="margin-top: 15px;">
        <button id="upgrade-cpu-btn">Upgrade CPU</button>
        <button id="upgrade-ram-btn">Upgrade RAM</button>
        <button id="upgrade-storage-btn">Add Storage</button>
        <button id="upgrade-network-btn">Upgrade Network</button>
      </div>
    `;
    
    // Add event listeners for upgrade buttons
    document.getElementById('upgrade-cpu-btn').addEventListener('click', () => {
      server.upgradeComponent('cpu', 1);
      this.showServerDetails(server); // Refresh view
    });
    
    document.getElementById('upgrade-ram-btn').addEventListener('click', () => {
      server.upgradeComponent('ram', 1);
      this.showServerDetails(server);
    });
    
    document.getElementById('upgrade-storage-btn').addEventListener('click', () => {
      server.upgradeComponent('storage', 1);
      this.showServerDetails(server);
    });
    
    document.getElementById('upgrade-network-btn').addEventListener('click', () => {
      server.upgradeComponent('network', 1);
      this.showServerDetails(server);
    });
  }
  
  // Old update method removed - was causing errors by referencing statsPanel which no longer exists
  
  // Show egress router details
  showEgressRouterView(egressRouter) {
    console.log('Showing egress router view with router:', egressRouter);
    console.log('Circuits:', egressRouter.circuits);
    
    // Create modal content container
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
    title.textContent = egressRouter.name;
    modalContent.appendChild(title);
    
    // Create container for router content
    const routerContainer = document.createElement('div');
    routerContainer.className = 'router-view';
    
    // Add circuits section
    const circuitsSection = document.createElement('div');
    circuitsSection.innerHTML = `
      <h3>Internet Circuits</h3>
      <p>These circuits provide internet connectivity to your datacenter.</p>
      <div id="circuits-container"></div>
      <button id="add-circuit-btn">Add New Circuit</button>
    `;
    routerContainer.appendChild(circuitsSection);
    
    // Add router equipment section
    const routerSection = document.createElement('div');
    routerSection.innerHTML = `
      <h3>Router Equipment</h3>
      <p>Core router for datacenter connectivity.</p>
      <div id="router-details"></div>
    `;
    routerContainer.appendChild(routerSection);
    
    modalContent.appendChild(routerContainer);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Populate circuits
    const circuitsContainer = document.getElementById('circuits-container');
    egressRouter.circuits.forEach(circuit => {
      const circuitItem = this.createCircuitItem(circuit);
      circuitsContainer.appendChild(circuitItem);
    });
    
    // Populate router details
    const routerDetails = document.getElementById('router-details');
    if (egressRouter.equipment) {
      routerDetails.innerHTML = `
        <p><strong>Name:</strong> ${egressRouter.equipment.name}</p>
        <p><strong>Ports:</strong> ${egressRouter.equipment.ports.length}</p>
        <p><strong>Connected Ports:</strong> ${egressRouter.equipment.ports.filter(p => p.status === 'up').length}</p>
        <button id="view-router-btn">View Router Details</button>
      `;
      
      document.getElementById('view-router-btn').addEventListener('click', () => {
        this.showNetworkEquipmentDetails(egressRouter.equipment);
      });
    }
    
    // Add circuit button handler
    document.getElementById('add-circuit-btn').addEventListener('click', () => {
      this.showAddCircuitUI(egressRouter);
    });
  }
  
  // Create a circuit item for the UI
  createCircuitItem(circuit) {
    const item = document.createElement('div');
    item.className = 'circuit-item';
    item.style.padding = '15px';
    item.style.margin = '10px 0';
    item.style.backgroundColor = '#444';
    item.style.borderRadius = '5px';
    item.style.borderLeft = `5px solid #${circuit.specs.color.toString(16).padStart(6, '0')}`;
    
    const connections = circuit.connections.length;
    const maxConnections = circuit.specs.maxConnections;
    const usagePercent = (connections / maxConnections) * 100;
    
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <h4>${circuit.name}</h4>
        <span>Cost: $${circuit.cost}/month</span>
      </div>
      <p><strong>Speed:</strong> ${circuit.speed} Gbps</p>
      <p><strong>Network:</strong> ${circuit.ipRange.network}</p>
      <p><strong>Utilization:</strong> ${circuit.utilization.toFixed(1)}%</p>
      <p><strong>Connections:</strong> ${connections}/${maxConnections} (${usagePercent.toFixed(1)}%)</p>
      <div style="margin-top: 10px;">
        <button class="view-circuit-btn" data-circuit-id="${circuit.id}">View Details</button>
        <button class="connect-circuit-btn" data-circuit-id="${circuit.id}">Connect Rack</button>
      </div>
    `;
    
    // Add event listeners after adding to DOM
    setTimeout(() => {
      const viewBtn = item.querySelector(`.view-circuit-btn[data-circuit-id="${circuit.id}"]`);
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          this.showCircuitView(circuit);
        });
      }
      
      const connectBtn = item.querySelector(`.connect-circuit-btn[data-circuit-id="${circuit.id}"]`);
      if (connectBtn) {
        connectBtn.addEventListener('click', () => {
          this.showConnectRackUI(circuit);
        });
      }
    }, 0);
    
    return item;
  }
  
  // Show UI to add a new circuit
  showAddCircuitUI(egressRouter) {
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
    title.textContent = 'Add New Circuit';
    modalContent.appendChild(title);
    
    // Circuit options
    const circuitOptions = Object.keys(CIRCUIT_TYPES).map(type => {
      const circuit = CIRCUIT_TYPES[type];
      return `
        <div class="circuit-option" data-type="${type}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4>${circuit.name}</h4>
            <span>$${circuit.cost}/month</span>
          </div>
          <p>Speed: ${circuit.speed} Gbps</p>
          <p>Max Connections: ${circuit.maxConnections}</p>
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
        <button id="add-selected-circuit-btn" disabled>Add Selected Circuit</button>
        <button id="cancel-add-circuit-btn">Cancel</button>
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
        
        // Enable the add button
        document.getElementById('add-selected-circuit-btn').disabled = false;
      });
    });
    
    document.getElementById('add-selected-circuit-btn').addEventListener('click', () => {
      if (selectedType) {
        const circuit = egressRouter.addCircuit(selectedType);
        this.showEgressRouterView(egressRouter);
      }
    });
    
    document.getElementById('cancel-add-circuit-btn').addEventListener('click', () => {
      this.showEgressRouterView(egressRouter);
    });
  }
  
  // Show circuit details
  showCircuitView(circuit) {
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
    title.textContent = circuit.name;
    modalContent.appendChild(title);
    
    // IP allocation table
    let ipTable = '';
    const ips = Object.entries(circuit.ipRange.allocatedIps);
    
    if (ips.length > 0) {
      ipTable = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #444;">Device</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #444;">IP Address</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #444;">Allocated</th>
          </tr>
          ${ips.map(([deviceId, info]) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #333;">${info.name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #333;">${info.ip}</td>
              <td style="padding: 8px; border-bottom: 1px solid #333;">${new Date(info.allocated).toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
      `;
    } else {
      ipTable = '<p>No IP addresses allocated yet.</p>';
    }
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <div>
          <p><strong>Type:</strong> ${circuit.specs.name}</p>
          <p><strong>Speed:</strong> ${circuit.speed} Gbps</p>
          <p><strong>Cost:</strong> $${circuit.cost}/month</p>
          <p><strong>Status:</strong> ${circuit.status === 'active' ? 'Active' : 'Down'}</p>
          <p><strong>Utilization:</strong> ${circuit.utilization.toFixed(1)}%</p>
        </div>
        <div>
          <p><strong>Uptime:</strong> ${circuit.uptime}%</p>
          <p><strong>Connections:</strong> ${circuit.connections.length}/${circuit.specs.maxConnections}</p>
        </div>
      </div>
      
      <h3 style="margin-top: 20px;">IP Allocation</h3>
      <p><strong>Network:</strong> ${circuit.ipRange.network}</p>
      <p><strong>Gateway:</strong> ${circuit.ipRange.gateway}</p>
      <p><strong>Usable Range:</strong> ${circuit.ipRange.usable}</p>
      
      <h4 style="margin-top: 15px;">Allocated IPs</h4>
      ${ipTable}
      
      <div style="margin-top: 20px;">
        <button id="connect-rack-btn">Connect Rack</button>
        <button id="remove-circuit-btn">Remove Circuit</button>
        <button id="back-to-router-btn">Back to Router</button>
      </div>
    `;
    modalContent.appendChild(content);
    
    // Open the modal
    this.openModal(modalContent);
    
    // Add event listeners
    document.getElementById('connect-rack-btn').addEventListener('click', () => {
      this.showConnectRackUI(circuit);
    });
    
    document.getElementById('remove-circuit-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this circuit? All connections will be lost.')) {
        this.game.datacenter.egressRouter.removeCircuit(circuit.id);
        this.showEgressRouterView(this.game.datacenter.egressRouter);
      }
    });
    
    document.getElementById('back-to-router-btn').addEventListener('click', () => {
      this.showEgressRouterView(this.game.datacenter.egressRouter);
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
}