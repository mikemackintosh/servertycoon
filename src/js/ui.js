import { CIRCUIT_TYPES } from './networkConnectivity.js';
import { FinanceUI } from './financeUI.js';

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
    
    // Initialize finance UI
    this.financeUI = new FinanceUI(this, this.game);
    
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
    
    // Add clickable functionality to funds stat to open finances
    this.fundsStat.style.cursor = 'pointer';
    this.fundsStat.addEventListener('click', () => {
      this.financeUI.showFinancesDialog();
    });
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
        if (item.label === 'New Game') {
          if (confirm('Start a new game? Any unsaved progress will be lost.')) {
            window.location.reload();
          }
        } else if (item.label === 'Save Game') {
          this.showSaveGameDialog();
        } else if (item.label === 'Load Game') {
          this.showLoadGameDialog();
        } else if (item.label === 'Show All Windows') {
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
      { label: 'Buy Circuit', separator: false },
      { label: 'Buy Server', separator: false },
      { label: 'Buy Network Equipment', separator: true },
      { label: 'Finances', separator: false },
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
        if (item.label === 'Buy Circuit') {
          this.showCircuitPurchaseUI();
        } else if (item.label === 'Buy Server') {
          this.showServerPurchaseUI();
        } else if (item.label === 'Buy Network Equipment') {
          this.showNetworkEquipmentPurchaseUI();
        } else if (item.label === 'Finances') {
          this.financeUI.showFinancesDialog();
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
  
  // Show finances dialog
  showFinances() {
    this.closeAllMenus();
    
    // Get financial data
    const finance = this.game.datacenter.finance;
    if (!finance) {
      this.showStatusMessage("Finance system not initialized", 3000);
      return;
    }
    
    const financialSummary = finance.getFinancialSummary();
    
    // Create modal content
    const content = document.createElement('div');
    content.style.width = '800px';
    content.style.height = '600px';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Title Bar -->
        <div style="background-color: #0000a5; color: white; padding: 5px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>Financial Management</span>
          <button id="finance-close-btn" style="background: #d4d0c8; border: 2px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; color: black; font-size: 11px;">×</button>
        </div>
        
        <!-- Tabs -->
        <div style="display: flex; background-color: #d4d0c8; border-bottom: 1px solid #808080;">
          <div id="finance-tab-summary" class="finance-tab active-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #FFFFFF #808080 #d4d0c8 #FFFFFF; background-color: #d4d0c8; margin-right: 2px; margin-top: 3px; border-bottom: none;">Summary</div>
          <div id="finance-tab-agreements" class="finance-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #808080 #808080 #808080 #808080; background-color: #bbb; margin-right: 2px; margin-top: 3px;">Customer Agreements</div>
          <div id="finance-tab-requests" class="finance-tab" style="padding: 5px 15px; cursor: pointer; border: 1px solid; border-color: #808080 #808080 #808080 #808080; background-color: #bbb; margin-right: 2px; margin-top: 3px;">Sales & Marketing</div>
        </div>
        
        <!-- Tab Content Container -->
        <div id="finance-tab-content" style="flex-grow: 1; background-color: #d4d0c8; padding: 10px; overflow: auto;">
          <!-- Will be filled by tab selection -->
        </div>
      </div>
    `;
    
    // Show modal
    this.openModal(content);
    
    // Get tab content container
    const tabContent = document.getElementById('finance-tab-content');
    
    // Helper functions to switch tabs
    const switchToTab = (tabId) => {
      // Update tab styling
      document.querySelectorAll('.finance-tab').forEach(tab => {
        const isActive = tab.id === `finance-tab-${tabId}`;
        tab.style.backgroundColor = isActive ? '#d4d0c8' : '#bbb';
        tab.style.borderColor = isActive ? 
          '#FFFFFF #808080 #d4d0c8 #FFFFFF' : 
          '#808080 #808080 #808080 #808080';
      });
      
      // Update content
      if (tabId === 'summary') {
        showSummaryTab();
      } else if (tabId === 'agreements') {
        showAgreementsTab();
      } else if (tabId === 'requests') {
        showRequestsTab();
      }
    };
    
    // Show summary tab
    const showSummaryTab = () => {
      // Format currency
      const formatCurrency = (amount) => {
        return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };
      
      const breakdown = financialSummary.breakdownByCategory;
      
      tabContent.innerHTML = `
        <div style="padding: 10px 20px;">
          <h2 style="margin-top: 0; color: #000080;">Financial Summary</h2>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Current Balance</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">${formatCurrency(financialSummary.funds)}</p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Revenue</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0; color: green;">${formatCurrency(financialSummary.monthlyRevenue)}</p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Expenses</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0; color: red;">${formatCurrency(financialSummary.monthlyExpenses)}</p>
            </div>
          </div>
          
          <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #000080;">Profit Projection</h3>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 150px;">Monthly Profit:</div>
              <div style="font-weight: bold; color: ${financialSummary.monthlyProfit >= 0 ? 'green' : 'red'};">
                ${formatCurrency(financialSummary.monthlyProfit)}
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 150px;">Annual Projection:</div>
              <div style="font-weight: bold; color: ${financialSummary.annualProfit >= 0 ? 'green' : 'red'};">
                ${formatCurrency(financialSummary.annualProfit)}
              </div>
            </div>
          </div>
          
          <h3 style="color: #000080;">Monthly Expense Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #0078D7; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #999;">Category</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Amount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Percentage</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #999;">Circuit Costs</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.circuitCosts)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.circuitCosts / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 8px; border: 1px solid #999;">Server Maintenance</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.serverMaintenance)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.serverMaintenance / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #999;">Network Maintenance</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.networkMaintenance)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.networkMaintenance / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 8px; border: 1px solid #999;">Power Costs</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(breakdown.powerCosts)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${(breakdown.powerCosts / financialSummary.monthlyExpenses * 100).toFixed(1)}%</td>
            </tr>
            <tr style="font-weight: bold; background-color: #e0e0e0;">
              <td style="padding: 8px; border: 1px solid #999;">Total</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">${formatCurrency(financialSummary.monthlyExpenses)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #999;">100.0%</td>
            </tr>
          </table>
          
          <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #000080;">Customer & Bandwidth Summary</h3>
            <div style="display: flex; justify-content: space-between;">
              <div style="flex: 1;">
                <div style="margin-bottom: 8px;"><strong>Active Customers:</strong> ${financialSummary.activeCustomers}</div>
                <div><strong>Pending Requests:</strong> ${financialSummary.pendingRequests}</div>
              </div>
              <div style="flex: 1;">
                <div style="margin-bottom: 8px;"><strong>Bandwidth Utilization:</strong> ${financialSummary.totalBandwidthUtilization} Mbps</div>
                <div><strong>Circuit Capacity:</strong> ${this.game.datacenter.egressRouter?.getTotalBandwidth() || 0} Mbps</div>
              </div>
            </div>
          </div>
        </div>
      `;
    };
    
    // Show agreements tab
    const showAgreementsTab = () => {
      const agreements = finance.customerAgreements;
      
      let agreementsHtml = '';
      if (agreements.length === 0) {
        agreementsHtml = `<div style="text-align: center; padding: 30px; background-color: #f5f5f5; border: 1px solid #ddd; margin-top: 20px;">No active customer agreements</div>`;
      } else {
        agreementsHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #0078D7; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #999;">Customer</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #999;">Type</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #999;">Specs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Bandwidth</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Monthly Revenue</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #999;">Actions</th>
            </tr>
            ${agreements.map((agreement, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
                <td style="padding: 8px; border: 1px solid #999;">${agreement.customerName}</td>
                <td style="padding: 8px; border: 1px solid #999;">${agreement.type}</td>
                <td style="padding: 8px; border: 1px solid #999; font-size: 11px;">
                  CPU: ${agreement.specifications.cpuCores} cores<br>
                  RAM: ${agreement.specifications.ramGB} GB<br>
                  Storage: ${agreement.specifications.storageGB} GB
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #999;">${agreement.bandwidthUtilization} Mbps</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #999;">$${agreement.monthlyRevenue.toFixed(2)}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #999;">
                  <button class="view-agreement-btn" data-id="${agreement.id}" style="font-size: 11px; padding: 2px 5px;">View</button>
                </td>
              </tr>
            `).join('')}
          </table>
        `;
      }
      
      tabContent.innerHTML = `
        <div style="padding: 10px 20px;">
          <h2 style="margin-top: 0; color: #000080;">Customer Agreements</h2>
          <p>Active customer contracts and their resource allocations.</p>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Total Agreements</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">${agreements.length}</p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Bandwidth Used</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">
                ${financialSummary.totalBandwidthUtilization} / ${this.game.datacenter.egressRouter?.getTotalBandwidth() || 0} Mbps
              </p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Monthly Revenue</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0; color: green;">$${financialSummary.monthlyRevenue.toFixed(2)}</p>
            </div>
          </div>
          
          ${agreementsHtml}
        </div>
      `;
      
      // Add view agreement button handlers
      document.querySelectorAll('.view-agreement-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const agreementId = btn.dataset.id;
          const agreement = agreements.find(a => a.id === agreementId);
          if (agreement) {
            this.showCustomerAgreementDetails(agreement);
          }
        });
      });
    };
    
    // Show customer requests tab
    const showRequestsTab = () => {
      const requests = finance.pendingRequests;
      
      let requestsHtml = '';
      if (requests.length === 0) {
        requestsHtml = `<div style="text-align: center; padding: 30px; background-color: #f5f5f5; border: 1px solid #ddd; margin-top: 20px;">No pending customer requests</div>`;
      } else {
        requestsHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #0078D7; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #999;">Customer</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #999;">Request Type</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #999;">Size & Traffic</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Resource Needs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #999;">Monthly Revenue</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #999;">Actions</th>
            </tr>
            ${requests.map((request, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
                <td style="padding: 8px; border: 1px solid #999;">${request.customerName}</td>
                <td style="padding: 8px; border: 1px solid #999;">${request.type}</td>
                <td style="padding: 8px; border: 1px solid #999; text-align: center;">
                  ${request.size}<br>
                  ${request.trafficPattern} Traffic
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #999; font-size: 11px;">
                  CPU: ${request.specifications.cpuCores} cores<br>
                  RAM: ${request.specifications.ramGB} GB<br>
                  Storage: ${request.specifications.storageGB} GB<br>
                  Bandwidth: ${request.specifications.bandwidthMbps} Mbps
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #999;">$${request.monthlyRevenue.toFixed(2)}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #999;">
                  <button class="accept-request-btn" data-id="${request.id}" style="font-size: 11px; padding: 2px 5px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32; margin-right: 5px;">Accept</button>
                  <button class="decline-request-btn" data-id="${request.id}" style="font-size: 11px; padding: 2px 5px; background-color: #F44336; color: white; border: 1px solid #C62828;">Decline</button>
                </td>
              </tr>
            `).join('')}
          </table>
        `;
      }
      
      tabContent.innerHTML = `
        <div style="padding: 10px 20px;">
          <h2 style="margin-top: 0; color: #000080;">Sales & Marketing</h2>
          <p>Manage customer requests and new business opportunities.</p>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Pending Requests</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">${requests.length}</p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999; margin-right: 10px;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Available Bandwidth</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">
                ${Math.max(0, (this.game.datacenter.egressRouter?.getTotalBandwidth() || 0) - financialSummary.totalBandwidthUtilization)} Mbps
              </p>
            </div>
            <div style="flex: 1; padding: 10px; background-color: #eee; border: 1px solid #999;">
              <h3 style="margin-top: 0; text-align: center; color: #000080;">Active Customers</h3>
              <p style="font-size: 24px; text-align: center; margin: 10px 0;">${financialSummary.activeCustomers}</p>
            </div>
          </div>
          
          ${requestsHtml}
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #2E7D32;">Generate New Business</h3>
            <p>Invest in marketing to generate additional customer leads.</p>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <button id="generate-lead-btn" style="padding: 5px 15px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32;">Generate Lead ($500)</button>
              <button id="marketing-campaign-btn" style="padding: 5px 15px; background-color: #2196F3; color: white; border: 1px solid #1565C0;">Run Marketing Campaign ($2,000)</button>
            </div>
          </div>
        </div>
      `;
      
      // Add accept/decline request button handlers
      document.querySelectorAll('.accept-request-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const requestId = btn.dataset.id;
          this.acceptCustomerRequest(requestId);
        });
      });
      
      document.querySelectorAll('.decline-request-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const requestId = btn.dataset.id;
          if (confirm("Are you sure you want to decline this request? The customer will look elsewhere.")) {
            finance.declineCustomerRequest(requestId);
            this.showFinances(); // Refresh the tab
          }
        });
      });
      
      // Add marketing button handlers
      document.getElementById('generate-lead-btn')?.addEventListener('click', () => {
        if (this.game.datacenter.funds < 500) {
          this.showStatusMessage("Not enough funds for lead generation", 3000);
          return;
        }
        
        this.game.datacenter.updateFunds(-500);
        finance.generateCustomerRequest();
        this.showStatusMessage("New lead generated", 3000);
        this.showFinances(); // Refresh the tab
      });
      
      document.getElementById('marketing-campaign-btn')?.addEventListener('click', () => {
        if (this.game.datacenter.funds < 2000) {
          this.showStatusMessage("Not enough funds for marketing campaign", 3000);
          return;
        }
        
        this.game.datacenter.updateFunds(-2000);
        
        // Generate multiple leads for a marketing campaign
        for (let i = 0; i < 5; i++) {
          finance.generateCustomerRequest();
        }
        
        this.showStatusMessage("Marketing campaign launched with 5 new leads", 3000);
        this.showFinances(); // Refresh the tab
      });
    };
    
    // Show the summary tab by default
    showSummaryTab();
    
    // Add tab switching handlers
    document.getElementById('finance-tab-summary').addEventListener('click', () => switchToTab('summary'));
    document.getElementById('finance-tab-agreements').addEventListener('click', () => switchToTab('agreements'));
    document.getElementById('finance-tab-requests').addEventListener('click', () => switchToTab('requests'));
    
    // Close button handler
    document.getElementById('finance-close-btn').addEventListener('click', () => {
      this.closeModal();
    });
  }
  
  // Accept a customer request and assign resources
  acceptCustomerRequest(requestId) {
    const finance = this.game.datacenter.finance;
    const request = finance.pendingRequests.find(req => req.id === requestId);
    
    if (!request) {
      this.showStatusMessage("Customer request not found", 3000);
      return;
    }
    
    // Check if we have enough bandwidth
    const currentUtilization = finance.calculateTotalBandwidthUtilization();
    const totalAvailableBandwidth = this.game.datacenter.egressRouter?.getTotalBandwidth() || 0;
    
    if (currentUtilization + request.specifications.bandwidthMbps > totalAvailableBandwidth) {
      this.showStatusMessage("Not enough bandwidth capacity. Upgrade circuits first.", 3000);
      return;
    }
    
    // Create content for server assignment modal
    const content = document.createElement('div');
    content.style.width = '600px';
    content.innerHTML = `
      <div style="padding: 15px;">
        <h2 style="margin-top: 0; color: #000080;">Accept Customer Request</h2>
        <p>Assign servers to fulfill <strong>${request.customerName}'s</strong> request for a <strong>${request.size} ${request.type}</strong>.</p>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 10px; margin-bottom: 15px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #000080;">Resource Requirements</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>CPU:</strong> ${request.specifications.cpuCores} cores
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>RAM:</strong> ${request.specifications.ramGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Storage:</strong> ${request.specifications.storageGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Bandwidth:</strong> ${request.specifications.bandwidthMbps} Mbps
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 5px;">
              <strong>Monthly Revenue:</strong> $${request.monthlyRevenue.toFixed(2)}
            </div>
          </div>
        </div>
        
        <p>An estimated <strong>${request.specifications.serversRequired} server(s)</strong> will be needed for this request.</p>
        
        <p>By accepting this request, we'll automatically allocate the necessary resources from our available servers.</p>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button id="cancel-request-btn" style="margin-right: 10px; padding: 5px 15px;">Cancel</button>
          <button id="confirm-accept-btn" style="padding: 5px 15px; background-color: #4CAF50; color: white; border: 1px solid #2E7D32;">Accept Request</button>
        </div>
      </div>
    `;
    
    // Show the modal
    this.openModal(content);
    
    // Add button handlers
    document.getElementById('cancel-request-btn').addEventListener('click', () => {
      this.closeModal();
    });
    
    document.getElementById('confirm-accept-btn').addEventListener('click', () => {
      // Accept the request and add to customer agreements
      const agreement = finance.acceptCustomerRequest(requestId);
      
      if (agreement) {
        this.showStatusMessage(`Accepted request from ${request.customerName}`, 3000);
      } else {
        this.showStatusMessage("Failed to accept request", 3000);
      }
      
      this.closeModal();
      this.showFinances(); // Refresh finances display
    });
  }
  
  // Show customer agreement details
  showCustomerAgreementDetails(agreement) {
    const content = document.createElement('div');
    content.style.width = '600px';
    content.innerHTML = `
      <div style="padding: 15px;">
        <h2 style="margin-top: 0; color: #000080;">Customer Agreement Details</h2>
        
        <div style="background-color: #eee; border: 1px solid #999; padding: 15px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #000080;">${agreement.customerName}</h3>
            <span style="background-color: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px;">Active</span>
          </div>
          <p style="margin-bottom: 5px;"><strong>Service Type:</strong> ${agreement.type}</p>
          <p style="margin-bottom: 5px;"><strong>Monthly Revenue:</strong> $${agreement.monthlyRevenue.toFixed(2)}</p>
          <p style="margin-bottom: 5px;"><strong>Start Date:</strong> ${new Date(agreement.startDate).toLocaleDateString()}</p>
        </div>
        
        <h3 style="color: #000080;">Resource Allocation</h3>
        <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px;">
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>CPU Cores:</strong> ${agreement.specifications.cpuCores}
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>RAM:</strong> ${agreement.specifications.ramGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>Storage:</strong> ${agreement.specifications.storageGB} GB
            </div>
            <div style="flex: 1; min-width: 120px; margin-bottom: 8px;">
              <strong>Bandwidth:</strong> ${agreement.bandwidthUtilization} Mbps
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button id="close-agreement-details-btn" style="padding: 5px 15px;">Close</button>
        </div>
      </div>
    `;
    
    // Show the modal
    this.openModal(content);
    
    // Add close button handler
    document.getElementById('close-agreement-details-btn').addEventListener('click', () => {
      this.closeModal();
    });
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
  
  // Show save game dialog
  showSaveGameDialog() {
    this.closeAllMenus();
    
    // Create modal content
    const content = document.createElement('div');
    content.innerHTML = `
      <h2 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #999;">Save Game</h2>
      <p>Choose a save slot to save your current game:</p>
      <div id="save-slots" style="margin: 15px 0; display: flex; flex-direction: column; gap: 10px;"></div>
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <button id="save-cancel-btn" style="margin-right: 10px;">Cancel</button>
      </div>
    `;
    
    // Show modal
    this.openModal(content);
    
    // Get slots container
    const slotsContainer = document.getElementById('save-slots');
    
    // Load save metadata
    const metaKey = `${this.game.saveName}_meta`;
    const metadata = JSON.parse(localStorage.getItem(metaKey) || '{}');
    
    // Create slot buttons
    for (let i = 1; i <= this.game.saveSlots; i++) {
      const slotInfo = metadata[i] || null;
      
      const slotBtn = document.createElement('div');
      slotBtn.style.padding = '10px';
      slotBtn.style.border = '1px solid #999';
      slotBtn.style.backgroundColor = '#eee';
      slotBtn.style.cursor = 'pointer';
      slotBtn.style.display = 'flex';
      slotBtn.style.justifyContent = 'space-between';
      slotBtn.style.alignItems = 'center';
      
      if (slotInfo) {
        // Slot has save data
        const date = new Date(slotInfo.timestamp);
        slotBtn.innerHTML = `
          <div>
            <strong>Slot ${i}</strong>
            <div>Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            <div>Funds: $${slotInfo.funds.toFixed(2)}, Racks: ${slotInfo.racks}</div>
          </div>
          <button class="save-slot-btn" data-slot="${i}">Save</button>
        `;
      } else {
        // Empty slot
        slotBtn.innerHTML = `
          <div>
            <strong>Slot ${i}</strong>
            <div>Empty save slot</div>
          </div>
          <button class="save-slot-btn" data-slot="${i}">Save</button>
        `;
      }
      
      slotsContainer.appendChild(slotBtn);
    }
    
    // Add event listeners
    document.querySelectorAll('.save-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        
        // Confirm if slot contains existing save
        if (metadata[slot] && !confirm(`Overwrite existing save in slot ${slot}?`)) {
          return;
        }
        
        // Save game
        if (this.game.saveGame(slot)) {
          this.showStatusMessage(`Game saved to slot ${slot}`, 3000);
          this.closeModal();
        } else {
          this.showStatusMessage('Failed to save game', 3000);
        }
      });
    });
    
    // Cancel button
    document.getElementById('save-cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });
  }
  
  // Show load game dialog
  showLoadGameDialog() {
    this.closeAllMenus();
    
    // Create modal content
    const content = document.createElement('div');
    content.innerHTML = `
      <h2 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #999;">Load Game</h2>
      <p>Choose a save to load:</p>
      <div id="load-slots" style="margin: 15px 0; display: flex; flex-direction: column; gap: 10px;"></div>
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <button id="load-cancel-btn" style="margin-right: 10px;">Cancel</button>
      </div>
    `;
    
    // Show modal
    this.openModal(content);
    
    // Get slots container
    const slotsContainer = document.getElementById('load-slots');
    
    // Load save metadata
    const metaKey = `${this.game.saveName}_meta`;
    const metadata = JSON.parse(localStorage.getItem(metaKey) || '{}');
    
    // Check for autosave
    const autoSaveKey = `${this.game.saveName}_autosave`;
    const autoSaveData = localStorage.getItem(autoSaveKey);
    
    if (autoSaveData) {
      try {
        const autoSave = JSON.parse(autoSaveData);
        const date = new Date(autoSave.timestamp);
        
        const slotBtn = document.createElement('div');
        slotBtn.style.padding = '10px';
        slotBtn.style.border = '1px solid #999';
        slotBtn.style.backgroundColor = '#eee';
        slotBtn.style.cursor = 'pointer';
        slotBtn.style.display = 'flex';
        slotBtn.style.justifyContent = 'space-between';
        slotBtn.style.alignItems = 'center';
        
        slotBtn.innerHTML = `
          <div>
            <strong>Auto-Save</strong>
            <div>Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            <div>Funds: $${autoSave.datacenter.funds.toFixed(2)}, Racks: ${autoSave.datacenter.racks.length}</div>
          </div>
          <div>
            <button class="load-slot-btn" data-slot="0">Load</button>
            <button class="delete-slot-btn" data-slot="0">Delete</button>
          </div>
        `;
        
        slotsContainer.appendChild(slotBtn);
      } catch (e) {
        console.error('Error parsing autosave data:', e);
      }
    }
    
    // Create slot buttons for regular saves
    let hasSaves = autoSaveData !== null;
    
    for (let i = 1; i <= this.game.saveSlots; i++) {
      const slotInfo = metadata[i] || null;
      
      if (slotInfo) {
        hasSaves = true;
        
        const slotBtn = document.createElement('div');
        slotBtn.style.padding = '10px';
        slotBtn.style.border = '1px solid #999';
        slotBtn.style.backgroundColor = '#eee';
        slotBtn.style.cursor = 'pointer';
        slotBtn.style.display = 'flex';
        slotBtn.style.justifyContent = 'space-between';
        slotBtn.style.alignItems = 'center';
        
        const date = new Date(slotInfo.timestamp);
        slotBtn.innerHTML = `
          <div>
            <strong>Slot ${i}</strong>
            <div>Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            <div>Funds: $${slotInfo.funds.toFixed(2)}, Racks: ${slotInfo.racks}</div>
          </div>
          <div>
            <button class="load-slot-btn" data-slot="${i}">Load</button>
            <button class="delete-slot-btn" data-slot="${i}">Delete</button>
          </div>
        `;
        
        slotsContainer.appendChild(slotBtn);
      }
    }
    
    // Show message if no saves found
    if (!hasSaves) {
      const noSaves = document.createElement('div');
      noSaves.textContent = 'No saved games found.';
      noSaves.style.padding = '20px';
      noSaves.style.textAlign = 'center';
      noSaves.style.backgroundColor = '#f5f5f5';
      noSaves.style.border = '1px solid #ddd';
      slotsContainer.appendChild(noSaves);
    }
    
    // Add event listeners
    document.querySelectorAll('.load-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        
        // Confirm load
        if (!confirm(`Load game from ${slot === 0 ? 'auto-save' : 'slot ' + slot}? Current progress will be lost.`)) {
          return;
        }
        
        // Load game
        if (this.game.loadGame(slot)) {
          this.showStatusMessage(`Game loaded from ${slot === 0 ? 'auto-save' : 'slot ' + slot}`, 3000);
          this.closeModal();
        } else {
          this.showStatusMessage('Failed to load game', 3000);
        }
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        
        // Confirm delete
        if (!confirm(`Delete save ${slot === 0 ? 'auto-save' : 'in slot ' + slot}? This cannot be undone.`)) {
          return;
        }
        
        // Delete save
        if (this.game.deleteSave(slot)) {
          this.showStatusMessage(`Save ${slot === 0 ? 'auto-save' : 'in slot ' + slot} deleted`, 3000);
          // Refresh the dialog
          this.closeModal();
          this.showLoadGameDialog();
        } else {
          this.showStatusMessage('Failed to delete save', 3000);
        }
      });
    });
    
    // Cancel button
    document.getElementById('load-cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });
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
    modalContent.style.width = '950px';
    modalContent.style.maxWidth = '95%';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal());
    modalContent.appendChild(closeButton);
    
    // Add title showing rack name
    const title = document.createElement('h2');
    title.textContent = `${rack.name} - Position (${rack.gridX}, ${rack.gridZ})`;
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
    
    // Profile tab
    const profileTab = document.createElement('div');
    profileTab.className = 'tab';
    profileTab.textContent = 'Profile View';
    profileTab.style.padding = '8px 15px';
    profileTab.style.backgroundColor = '#bbb';
    profileTab.style.border = '1px solid #999';
    profileTab.style.borderBottom = 'none';
    profileTab.style.marginRight = '5px';
    profileTab.style.cursor = 'pointer';
    profileTab.style.borderTopLeftRadius = '4px';
    profileTab.style.borderTopRightRadius = '4px';
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
    tabContainer.appendChild(profileTab);
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
    
    // Helper function to show profile view
    const showProfileView = () => {
      // Create the rack profile canvas
      contentContainer.innerHTML = `
        <h3>Rack Profile View</h3>
        <div style="display: flex; justify-content: space-between;">
          <div id="rack-profile-container" style="width: 250px; height: 720px; position: relative; border: 1px solid #999; margin-right: 20px; background-color: #333; overflow: hidden;">
            <!-- Profile display -->
          </div>
          <div style="flex-grow: 1;">
            <h4>Rack Information</h4>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <strong style="margin-right: 8px;">Name:</strong> 
              <span id="rack-name-display">${rack.name}</span>
              <button id="edit-rack-name-btn" style="margin-left: 10px; font-size: 11px; padding: 2px 5px;">Edit Name</button>
            </div>
            <div id="rack-name-edit" style="display: none; margin-bottom: 8px;">
              <input type="text" id="rack-name-input" value="${rack.name}" style="width: 200px; margin-right: 5px;">
              <button id="save-rack-name-btn" style="font-size: 11px; padding: 2px 5px;">Save</button>
              <button id="cancel-rack-name-btn" style="font-size: 11px; padding: 2px 5px; margin-left: 5px;">Cancel</button>
            </div>
            <p><strong>Status:</strong> ${rack.hasPower ? 'Powered' : 'No Power'}</p>
            <p><strong>Temperature:</strong> ${rack.temperature.toFixed(1)}°C</p>
            <p><strong>Power Usage:</strong> ${rack.calculateTotalPowerUsage()}W / ${rack.powerCapacity}W (${Math.round((rack.calculateTotalPowerUsage()/rack.powerCapacity)*100)}%)</p>
            <p><strong>Height:</strong> ${rack.rackHeightUnits}U</p>
            <p><strong>Used Space:</strong> ${rack.servers.reduce((sum, s) => sum + s.unitSize, 0) + rack.networkEquipment.reduce((sum, e) => sum + e.unitSize, 0)}U</p>
            <p><strong>Network:</strong> ${rack.connected ? 'Connected' : 'Not Connected'}</p>
            
            <div style="margin-top: 20px;">
              <h4>Equipment List</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 5px; border-bottom: 1px solid #999;">Position</th>
                    <th style="text-align: left; padding: 5px; border-bottom: 1px solid #999;">Name</th>
                    <th style="text-align: left; padding: 5px; border-bottom: 1px solid #999;">Type</th>
                    <th style="text-align: left; padding: 5px; border-bottom: 1px solid #999;">Size</th>
                    <th style="text-align: left; padding: 5px; border-bottom: 1px solid #999;">Status</th>
                  </tr>
                </thead>
                <tbody id="equipment-list">
                  ${[...rack.servers, ...rack.networkEquipment]
                    .sort((a, b) => b.position - a.position) // Sort by position (top to bottom)
                    .map(item => {
                      const type = item.constructor.name === 'Server' ? 'Server' : item.type;
                      return `
                        <tr>
                          <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.position}U</td>
                          <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.name || 'Unnamed'}</td>
                          <td style="padding: 5px; border-bottom: 1px solid #eee;">${type}</td>
                          <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.unitSize}U</td>
                          <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.powered !== undefined ? (item.powered ? 'On' : 'Off') : 'N/A'}</td>
                        </tr>
                      `;
                    }).join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      
      // Draw the rack profile
      setTimeout(() => {
        const profileContainer = document.getElementById('rack-profile-container');
        if (profileContainer) {
          console.log("Found profile container, drawing profile");
          drawRackProfile(profileContainer, rack);
        } else {
          console.error("Profile container not found");
        }
      }, 100);
      
      // Add edit rack name functionality
      setTimeout(() => {
        const editBtn = document.getElementById('edit-rack-name-btn');
        const saveBtn = document.getElementById('save-rack-name-btn');
        const cancelBtn = document.getElementById('cancel-rack-name-btn');
        const nameDisplay = document.getElementById('rack-name-display');
        const nameEdit = document.getElementById('rack-name-edit');
        const nameInput = document.getElementById('rack-name-input');
        
        if (editBtn && saveBtn && cancelBtn) {
          // Show edit form
          editBtn.addEventListener('click', () => {
            nameDisplay.parentElement.style.display = 'none';
            nameEdit.style.display = 'block';
            nameInput.focus();
            nameInput.select();
          });
          
          // Cancel edit
          cancelBtn.addEventListener('click', () => {
            nameEdit.style.display = 'none';
            nameDisplay.parentElement.style.display = 'flex';
            nameInput.value = rack.name;
          });
          
          // Save new name
          saveBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            if (newName) {
              // Update rack name and the 3D label
              rack.updateRackName(newName);
              nameDisplay.textContent = newName;
              
              // Update the profile view with new name
              profileContainer.innerHTML = '';
              drawRackProfile(profileContainer, rack);
              
              // Update modal title
              const modalTitle = document.querySelector('.modal-content h2');
              if (modalTitle) {
                modalTitle.textContent = `${rack.name} - Position (${rack.gridX}, ${rack.gridZ})`;
              }
              
              // Hide edit form
              nameEdit.style.display = 'none';
              nameDisplay.parentElement.style.display = 'flex';
            }
          });
        }
      }, 150);
    };
    
    // Function to draw the rack profile
    const drawRackProfile = (container, rack) => {
      console.log("Drawing rack profile for:", rack.name);
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 720; // Increased height for 42U plus header space and margin
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw rack U markers - Start at 50px from the bottom to allow for proper positioning
      const uHeight = 15; // Height of 1U in pixels
      const rackStartY = 50; // Space at the bottom of the canvas
      const headerHeight = 40; // Space at the top for power/temp indicators
      
      // Draw U markings
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      
      for (let u = 0; u <= rack.rackHeightUnits; u++) {
        const y = canvas.height - rackStartY - (u * uHeight);
        ctx.fillStyle = '#666';
        ctx.fillRect(0, y, 10, 1);
        
        // Add U numbers every 5U
        if (u % 5 === 0) {
          ctx.fillStyle = '#fff';
          ctx.fillText(u + 'U', 12, y + 4);
        }
      }
      
      // Draw rack frame with more space at the top for indicators
      const rackHeight = rack.rackHeightUnits * uHeight;
      const rackStartYPos = canvas.height - rackStartY - rackHeight;
      const headerSpace = 70; // Increased space for indicators at the top
      const rackEndYPos = canvas.height - rackStartY;
      
      // Top of rack frame
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, rackStartYPos);
      ctx.lineTo(canvas.width - 20, rackStartYPos);
      ctx.stroke();
      
      // Bottom of rack frame
      ctx.beginPath();
      ctx.moveTo(20, rackEndYPos);
      ctx.lineTo(canvas.width - 20, rackEndYPos);
      ctx.stroke();
      
      // Left side of rack frame
      ctx.beginPath();
      ctx.moveTo(20, rackStartYPos);
      ctx.lineTo(20, rackEndYPos);
      ctx.stroke();
      
      // Right side of rack frame
      ctx.beginPath();
      ctx.moveTo(canvas.width - 20, rackStartYPos);
      ctx.lineTo(canvas.width - 20, rackEndYPos);
      ctx.stroke();
      
      // Draw all equipment in the rack
      const allEquipment = [...rack.servers, ...rack.networkEquipment];
      
      allEquipment.forEach(item => {
        const y = canvas.height - rackStartY - ((item.position + item.unitSize) * uHeight);
        const height = item.unitSize * uHeight;
        
        // Different colors for servers and network equipment
        if (item.constructor.name === 'Server') {
          ctx.fillStyle = '#285f9f'; // Blue for servers
        } else {
          // Network equipment colors by type
          switch(item.type) {
            case 'SWITCH':
              ctx.fillStyle = '#2e7d32'; // Green
              break;
            case 'PATCH_PANEL':
              ctx.fillStyle = '#f9a825'; // Yellow
              break;
            default:
              ctx.fillStyle = '#6a1b9a'; // Purple
          }
        }
        
        ctx.fillRect(25, y, canvas.width - 50, height - 1);
        
        // Draw equipment name
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const name = item.constructor.name === 'Server' 
          ? (item.name || `Server ${item.unitSize}U`) 
          : (item.name || item.type);
        ctx.fillText(name, 30, y + (height / 2) + 4);
        
        // Draw front LEDs
        const ledSize = 4;
        
        // Status LED - green for powered, red for off
        ctx.fillStyle = item.powered !== undefined ? (item.powered ? '#22ff22' : '#ff2222') : '#ffff22';
        ctx.beginPath();
        ctx.arc(canvas.width - 15, y + 7, ledSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Network LED - blue for connected
        if (item.connected !== undefined) {
          ctx.fillStyle = item.connected ? '#2222ff' : '#666';
          ctx.beginPath();
          ctx.arc(canvas.width - 15, y + 17, ledSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw power status and temperature indicators at the top of the rack
      // (above the rack frame) - ABOVE the top U marker
      const indicatorY = rackStartYPos - headerSpace;
      
      // Draw rack name at the very top
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rack.name, canvas.width/2, indicatorY + 20);
      
      // Header panel background
      ctx.fillStyle = '#222';
      ctx.fillRect(25, indicatorY + 30, canvas.width - 50, 30);
      
      // Draw control panel background
      const panelY = indicatorY + 35;
      ctx.fillStyle = '#222';
      ctx.fillRect(15, panelY, canvas.width - 30, 30);
      
      // Power indicator
      ctx.fillStyle = '#333';
      ctx.fillRect(25, panelY + 5, 40, 20);
      
      // Power light
      ctx.fillStyle = rack.hasPower ? '#22ff22' : '#ff2222';
      ctx.beginPath();
      ctx.arc(45, panelY + 15, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Power text
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("POWER", 45, panelY + 35);
      
      // Temperature indicator
      ctx.fillStyle = '#333';
      ctx.fillRect(canvas.width - 65, panelY + 5, 40, 20);
      
      // Temperature display
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      const tempColor = rack.temperature > 30 ? '#ff6666' : '#ffffff';
      ctx.fillStyle = tempColor;
      ctx.fillText(`${rack.temperature.toFixed(1)}°C`, canvas.width - 45, panelY + 19);
      
      // Temperature text
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("TEMP", canvas.width - 45, panelY + 35);
      
      // Calculate power usage percentage (for reference only)
      const powerUsage = rack.calculateTotalPowerUsage();
      const powerPercent = Math.min(100, Math.round((powerUsage / rack.powerCapacity) * 100));
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
      profileTab.classList.remove('active');
      profileTab.style.backgroundColor = '#bbb';
      networkTab.classList.remove('active');
      networkTab.style.backgroundColor = '#bbb';
      showRackOverview();
    });
    
    serversTab.addEventListener('click', () => {
      serversTab.classList.add('active');
      serversTab.style.backgroundColor = '#d4d0c8';
      overviewTab.classList.remove('active');
      overviewTab.style.backgroundColor = '#bbb';
      profileTab.classList.remove('active');
      profileTab.style.backgroundColor = '#bbb';
      networkTab.classList.remove('active');
      networkTab.style.backgroundColor = '#bbb';
      showServersTab();
    });
    
    profileTab.addEventListener('click', () => {
      profileTab.classList.add('active');
      profileTab.style.backgroundColor = '#d4d0c8';
      overviewTab.classList.remove('active');
      overviewTab.style.backgroundColor = '#bbb';
      serversTab.classList.remove('active');
      serversTab.style.backgroundColor = '#bbb';
      networkTab.classList.remove('active');
      networkTab.style.backgroundColor = '#bbb';
      showProfileView();
    });
    
    networkTab.addEventListener('click', () => {
      networkTab.classList.add('active');
      networkTab.style.backgroundColor = '#d4d0c8';
      overviewTab.classList.remove('active');
      overviewTab.style.backgroundColor = '#bbb';
      serversTab.classList.remove('active');
      serversTab.style.backgroundColor = '#bbb';
      profileTab.classList.remove('active');
      profileTab.style.backgroundColor = '#bbb';
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
                  <span>${circuit.utilization * 100 < 50 ? 'NORMAL' : circuit.utilization * 100 < 80 ? 'BUSY' : 'HIGH LOAD'}</span>
                </div>
                <p><strong>Type:</strong> ${circuit.type}</p>
                <p><strong>Speed:</strong> ${circuit.speed} Gbps</p>
                <p><strong>Cost:</strong> $${circuit.cost}/month</p>
                <p><strong>Utilization:</strong> ${Math.round(circuit.utilization * 100)}%</p>
                <p><strong>Connections:</strong> ${circuit.connections.length} / ${circuit.specs.maxConnections}</p>
                <p><strong>IP Range:</strong> ${circuit.ipRange.base}.0/24</p>
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
        <p><strong>Status:</strong> ${circuit.utilization * 100 < 50 ? 'NORMAL' : circuit.utilization * 100 < 80 ? 'BUSY' : 'HIGH LOAD'}</p>
        <p><strong>Utilization:</strong> ${Math.round(circuit.utilization * 100)}%</p>
        <p><strong>IP Range:</strong> ${circuit.ipRange.base}.0/24</p>
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
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${conn.connected ? 'CONNECTED' : 'DISCONNECTED'}</td>
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
        <p><strong>Network:</strong> ${circuit.ipRange.base}.0/24</p>
        <p><strong>Gateway:</strong> ${circuit.ipRange.gateway}</p>
        <p><strong>Usable Range:</strong> ${circuit.ipRange.base}.1 - ${circuit.ipRange.base}.254</p>
        <p><strong>Broadcast:</strong> ${circuit.ipRange.base}.255</p>
        
        <h4>Allocated IP Addresses</h4>
        ${Object.keys(circuit.ipRange.assignedIps || {}).length === 0 
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
                ${Object.entries(circuit.ipRange.assignedIps || {}).map(([deviceId, ip]) => {
                  const equipment = this.game.findEquipmentById(deviceId);
                  return `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${equipment ? equipment.name : deviceId}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${ip}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">Active</td>
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
          <h4>Server Racks</h4>
          <p>Purchase racks to house your equipment</p>
          <button id="purchase-rack-btn">Browse Racks</button>
        </div>
      
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
    document.getElementById('purchase-rack-btn').addEventListener('click', () => {
      this.showRackPurchaseUI();
    });
    
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
  // Show UI for purchasing racks
  showRackPurchaseUI() {
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
    title.textContent = 'Purchase Server Racks';
    modalContent.appendChild(title);
    
    // Define rack options with cooling and power capacities
    const rackOptions = [
      {
        name: 'Basic Rack',
        cost: 800,
        specs: {
          name: 'Basic 42U Rack',
          rackHeightUnits: 42,
          powerCapacity: 2000, // 2 kW power capacity
          coolingCapacity: 1800, // 1.8 kW cooling capacity
          railType: 'Standard',
          maxWeight: 500 // kg
        }
      },
      {
        name: 'Standard Rack',
        cost: 1500,
        specs: {
          name: 'Standard 42U Rack',
          rackHeightUnits: 42,
          powerCapacity: 4000, // 4 kW power capacity
          coolingCapacity: 3800, // 3.8 kW cooling capacity
          railType: 'Standard',
          maxWeight: 800 // kg
        }
      },
      {
        name: 'Enterprise Rack',
        cost: 3000,
        specs: {
          name: 'Enterprise 42U Rack',
          rackHeightUnits: 42,
          powerCapacity: 8000, // 8 kW power capacity
          coolingCapacity: 7500, // 7.5 kW cooling capacity
          railType: 'Premium',
          maxWeight: 1200 // kg
        }
      },
      {
        name: 'High-Density Rack',
        cost: 5000,
        specs: {
          name: 'High-Density 48U Rack',
          rackHeightUnits: 48,
          powerCapacity: 15000, // 15 kW power capacity
          coolingCapacity: 14000, // 14 kW cooling capacity
          railType: 'Heavy Duty',
          maxWeight: 2000 // kg
        }
      }
    ];
    
    // Create rack options HTML
    const rackOptionsHtml = rackOptions.map(rack => `
      <div class="rack-option" data-name="${rack.name}" style="border: 1px solid #999; border-radius: 5px; padding: 15px; margin-bottom: 15px; cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0;">${rack.name}</h4>
          <span style="font-weight: bold;">$${rack.cost}</span>
        </div>
        <p><strong>Size:</strong> ${rack.specs.rackHeightUnits}U</p>
        <p><strong>Power Capacity:</strong> ${rack.specs.powerCapacity/1000} kW</p>
        <p><strong>Cooling Capacity:</strong> ${rack.specs.coolingCapacity/1000} kW</p>
        <p><strong>Rail Type:</strong> ${rack.specs.railType}</p>
        <p><strong>Max Weight:</strong> ${rack.specs.maxWeight} kg</p>
        <button class="purchase-rack-btn" data-rack="${rack.name}">Purchase</button>
      </div>
    `).join('');
    
    const content = document.createElement('div');
    content.innerHTML = `
      <p>Select a server rack to purchase:</p>
      <div class="rack-options">
        ${rackOptionsHtml}
      </div>
      <button id="back-to-purchase-btn" style="margin-top: 20px;">Back to Purchase Menu</button>
    `;
    
    modalContent.appendChild(content);
    this.openModal(modalContent);
    
    // Add event listeners for purchase buttons
    const purchaseButtons = document.querySelectorAll('.purchase-rack-btn');
    purchaseButtons.forEach(button => {
      button.addEventListener('click', () => {
        const rackName = button.dataset.rack;
        const rack = rackOptions.find(r => r.name === rackName);
        
        if (rack) {
          if (this.game.datacenter.funds < rack.cost) {
            alert('Not enough funds to purchase this rack.');
            return;
          }
          
          // Enter rack placement mode
          this.game.datacenter.funds -= rack.cost;
          
          // Save rack specs for placement
          this.game.datacenter.pendingRack = rack.specs;
          
          // Enter rack placement mode
          this.toggleRackPlacementMode();
          
          // Close the UI
          this.closeModal();
          
          // Show a prompt
          this.showStatusMessage('Click on the grid to place your new rack.');
        }
      });
    });
    
    // Back button
    document.getElementById('back-to-purchase-btn').addEventListener('click', () => {
      this.showReceivingDockUI();
    });
  }
  
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