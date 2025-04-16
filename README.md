# Server Tycoon

A tycoon-style game where players manage a datacenter, including servers, networking equipment, and infrastructure. Build your datacenter empire by upgrading hardware and optimizing performance!

## Features

- Isometric 3D datacenter view
- Interactive server rack management
- Server hardware configuration and upgrades
- Networking equipment with cable management
- VLAN configuration and port management
- IP connectivity and internet circuits
- Movable server racks on datacenter floor
- Revenue generation based on performance and connectivity

## Game Mechanics

- **Datacenter Management**: 
  - Place and move server racks in your datacenter grid
  - Create logical network layouts with strategically placed racks
  - Connect racks to internet circuits via the egress router
- **Rack Management**: 
  - Click on a rack in the 3D view to see its details
  - Click "View Rack" to open a detailed rack view showing servers and network equipment
  - Click on a server or network device to see details and upgrade options
  - Drag and drop servers and network equipment to rearrange them within the rack
  - Drag racks on the datacenter floor to reposition them
- **Cable Management**:
  - Hold 'C' key and click on a port to start connecting a cable
  - Click on another port to complete the connection
  - Press ESC to cancel cable creation
  - Configure VLANs on network equipment
- **Network Equipment**:
  - Add switches, routers, firewalls, and patch panels
  - Configure port types (Ethernet, SFP, SFP+, QSFP)
  - Create and manage VLANs
  - Connect devices with various cable types
- **IP Connectivity**:
  - Set up internet connectivity through the egress router
  - Manage different circuit types with varying speeds and costs
  - Configure IP addressing for devices
  - Only internet-connected servers generate full revenue
- **Revenue Generation**: 
  - Better servers generate more revenue
  - Properly networked servers with internet access produce optimal income
  - Balance expenses (circuit costs) with revenue

## Controls

- **Mouse**: 
  - Left-click on objects to select them
  - Left-click and drag to rotate the camera
  - Scroll wheel to zoom in/out
- **Keyboard**:
  - Hold 'C' to enter cable management mode
  - ESC to cancel cable creation

## Technologies

- Three.js for 3D rendering
- Vite for fast development

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/mikemackintosh/servertycoon.git
   cd servertycoon
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser to the displayed URL (usually http://localhost:5173)

## Development Roadmap

- [x] Basic 3D environment
- [x] Interactive datacenter layout
- [x] Server rack visualization
- [x] Server component system
- [x] Rack detailed view
- [x] Network equipment
- [x] Cable management
- [x] VLAN configuration
- [ ] Power management
- [ ] Cooling systems
- [ ] Disasters and failures
- [ ] Staff management
- [ ] Multiple datacenters

## License

This project is licensed under the MIT License - see the LICENSE file for details.