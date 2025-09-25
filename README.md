<div align="center">

# 🚀 Nitrolite ERC-7824 Real-Time Dashboard

<img src="https://img.shields.io/badge/ERC--7824-Compatible-blue?style=for-the-badge&logo=ethereum" alt="ERC-7824 Compatible" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React 18" />
<img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
<img src="https://img.shields.io/badge/WebSocket-Live-00D924?style=for-the-badge&logo=websocket" alt="WebSocket" />

**A cutting-edge real-time blockchain dashboard with auto-wallet detection, live data feeds, and modern glassmorphism UI**

[🎯 Features](#-features) • [🚀 Quick Start](#-quick-start) • [🏗️ Architecture](#-architecture) • [📊 Diagrams](#-diagrams) • [📚 Documentation](#-documentation)

---

</div>

## ✨ **What is Nitrolite?**

Nitrolite is a next-generation real-time blockchain dashboard that provides live monitoring of ERC-7824 compatible networks with **automatic wallet detection**, **real-time data feeds**, and a **beautiful modern interface**. Experience Web3 like never before with our glassmorphism design and seamless user experience.

## 🎯 **Features**

<div align="center">

### 🚀 Core Features

| Feature | Description | Status |
|---------|-------------|---------|
| 🤖 Auto Wallet Detection | Automatically detects and connects to available wallets | ✅ |
| 🔗 Auto Connection | Seamless connection restoration for returning users | ✅ |
| 💰 Gasless Transactions | Execute transactions without paying gas fees | ✅ |
| 🔄 Recurring Payments | Automated recurring payment scheduling | ✅ |
| 📡 Live WebSocket Feeds | Real-time data from ClearNode and blockchain networks | ✅ |
| 🔗 ClearNode Integration | Direct integration with ClearNode API for enhanced data | ✅ |
| 📊 Live Network Stats | Real-time network monitoring and statistics | ✅ |
| ⛽ Real-Time Gas Prices | Live gas price tracking and optimization | ✅ |

### 🎨 UI/UX Excellence

| Feature | Description | Status |
|---------|-------------|---------|
| 🌈 Glassmorphism Design | Beautiful backdrop blur effects with translucent cards | ✅ |
| 🎭 Framer Motion Animations | Smooth transitions and micro-interactions | ✅ |
| 🌙 Dark/Light Mode | Seamless theme switching | ✅ |
| 📱 Responsive Design | Optimized for desktop, tablet, and mobile devices | ✅ |
| 🎯 Interactive Elements | Hover effects, scale animations, and visual feedback | ✅ |

</div>

<div align="center">

| 🔥 **Core Features** | 🎨 **UI/UX Excellence** | ⚡ **Real-Time Data** |
|:---:|:---:|:---:|
| 🤖 Auto Wallet Detection | 🌈 Glassmorphism Design | 📡 Live WebSocket Feeds |
| 🔗 Auto Connection | 🎭 Framer Motion Animations | 🔗 ClearNode Integration |
| 💰 Gasless Transactions | 🌙 Dark/Light Mode | 📊 Live Network Stats |
| 🔄 Recurring Payments | 📱 Responsive Design | ⛽ Real-Time Gas Prices |

</div>

### 🤖 **Intelligent Auto-Detection**
```typescript
// Automatically detects and connects to available wallets
✅ MetaMask Auto-Detection
✅ Previously Connected Account Recovery  
✅ Network Auto-Switching
✅ Balance Auto-Refresh
```

### 🎨 **Modern UI/UX Design**
- **🌈 Glassmorphism Interface**: Beautiful backdrop blur effects with translucent cards
- **🎭 Smooth Animations**: Framer Motion powered transitions and micro-interactions  
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🌙 Theme Support**: Seamless dark/light mode switching
- **🎯 Interactive Elements**: Hover effects, scale animations, and visual feedback

### ⚡ **Real-Time Data Feeds**
- **📡 Live WebSocket Connections**: Real-time data from ClearNode and blockchain networks
- **🔗 Multi-Chain Support**: Ethereum, Polygon, and Sepolia networks
- **📊 Network Monitoring**: Live block heights, gas prices, and network health
- **💎 Asset Tracking**: Real-time asset information and price feeds
- **🔄 Transaction Tracking**: Live transaction status updates and confirmations

### 🛠️ **Technical Excellence**
- **⚛️ React 18**: Latest React features with concurrent rendering
- **📘 TypeScript**: Full type safety and enhanced developer experience  
- **⚡ Vite**: Lightning-fast build tool and development server
- **🎨 Tailwind CSS**: Utility-first CSS framework for rapid styling
- **🗃️ Zustand**: Lightweight state management with persistence
- **🔒 Ethers.js**: Secure blockchain interactions and wallet management

## 🛠️ Installation

<div align="center">

### Quick Setup Guide

```mermaid
graph LR
    A[Clone Repository] --> B[Install Dependencies]
    B --> C[Configure Environment]
    C --> D[Start Development Server]
    D --> E[Build for Production]
```

</div>

1. **Clone the repository** 📦
   ```bash
   git clone <repository-url>
   cd budget-buddy
   ```

2. **Install dependencies** ⚙️
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server** ▶️
   ```bash
   npm run dev
   ```

4. **Build for production** 🏗️
   ```bash
   npm run build
   ```

<div align="center">

### Prerequisites

| Requirement | Version | Description |
|-------------|---------|-------------|
| 🟨 Node.js | ≥18.0.0 | JavaScript runtime environment |
| 📦 npm | ≥8.0.0 | Package manager |
| 🌐 Git | ≥2.0.0 | Version control system |

</div>

## 🔧 Configuration

### Environment Setup
Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_NITROLITE_RELAYER_URL=https://api.nitrolite.io
```

### Network Configuration
The application supports:
- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111)

## 📱 Usage

### Connecting a Wallet
1. Click "Connect Wallet" in the sidebar
2. Choose between MetaMask or WalletConnect
3. Approve the connection in your wallet

### Sending Gasless Transactions
1. Navigate to the "Send" tab
2. Enter recipient address and amount
3. Toggle "Gasless Transaction" for zero fees
4. Confirm the transaction

### Setting Up Recurring Payments
1. Go to the "Recurring" tab
2. Click "New Payment"
3. Configure recipient, amount, and frequency
4. The system will automatically execute payments

### Monitoring Transactions
- Real-time transaction status updates
- Filter by type (gasless/regular) and status
- Export transaction history to CSV
- View transactions on blockchain explorer

## 🏗️ Architecture

### Core Services
- **WalletService**: Manages wallet connections and network switching
- **NitroLiteService**: Handles gasless transactions via NitroLite protocol
- **TransactionService**: Real-time transaction monitoring and management
- **RecurringPaymentService**: Automated recurring payment scheduling
- **EncryptionService**: AES-GCM encryption for privacy protection

### State Management
- Zustand for global state management
- Persistent storage for user preferences
- Real-time updates across components

### Security Features
- AES-GCM encryption for sensitive data
- Zero-knowledge proof generation
- Local key management
- Privacy-first architecture

## 📊 Diagrams

### System Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React 18 UI] --> B[Zustand State Management]
        B --> C[Wallet Connection Service]
    end
    
    subgraph "Service Layer"
        C --> D[Wallet Service]
        C --> E[NitroLite Service]
        C --> F[Transaction Service]
        C --> G[Recurring Payment Service]
        C --> H[Encryption Service]
        C --> I[WebSocket Service]
    end
    
    subgraph "Blockchain Layer"
        D --> J[MetaMask/WalletConnect]
        E --> K[NitroLite Protocol]
        F --> L[Ethereum Networks]
        G --> M[Blockchain Nodes]
    end
    
    subgraph "External Services"
        I --> N[ClearNode API]
        E --> O[Relayer Network]
        F --> P[Blockchain Explorers]
    end
    
    style A fill:#4A90E2,stroke:#33,stroke-width:2px
    style D fill:#50C878,stroke:#33,stroke-width:2px
    style K fill:#FF6B6B,stroke:#33,stroke-width:2px
    style L fill:#FFD700,stroke:#333,stroke-width:2px
```

### Wallet Connection Flow
```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant WS as Wallet Service
    participant WC as WalletConnect
    participant MM as MetaMask
    
    U->>UI: Click Connect Wallet
    UI->>WS: Check for existing wallet
    alt No wallet connected
        WS->>UI: Show connection options
        U->>UI: Select WalletConnect/MetaMask
        UI->>WC: Initialize WalletConnect
        UI->>MM: Check MetaMask availability
        alt WalletConnect selected
            WC->>U: Show QR Code
            U->>WC: Scan QR Code
        else MetaMask selected
            MM->>U: Show connection prompt
            U->>MM: Approve connection
        end
        WC-->>UI: Connection established
        MM-->>UI: Connection established
        UI->>WS: Store wallet connection
        WS->>UI: Update connection status
    else Wallet already connected
        WS->>UI: Restore previous connection
        UI->>U: Wallet connected
    end
```

### Gasless Transaction Flow
```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant NLS as NitroLite Service
    participant NL as NitroLite Protocol
    participant RN as Relayer Network
    participant BC as Blockchain
    
    U->>UI: Enter transaction details
    U->>UI: Enable gasless transaction
    UI->>NLS: Prepare gasless transaction
    NLS->>NL: Create EIP-712 signature
    NL->>UI: Return signed transaction
    UI->>NLS: Send to relayer
    NLS->>RN: Submit to relayer network
    RN->>BC: Execute transaction on blockchain
    BC->>RN: Transaction confirmed
    RN->>NLS: Confirmation received
    NLS->>UI: Update transaction status
    UI->>U: Transaction completed
```

### UI Component Structure
```mermaid
graph TD
    subgraph "Main Components"
        A[App.tsx]
        A --> B[Layout.tsx]
        A --> C[Dashboard.tsx]
        A --> D[WalletConnection.tsx]
    end
    
    subgraph "Dashboard Sections"
        C --> E[TransactionList.tsx]
        C --> F[Send.tsx]
        C --> G[Recurring.tsx]
        C --> H[Settings.tsx]
        C --> I[Notifications.tsx]
    end
    
    subgraph "WebSocket Components"
        B --> J[WebSocketStatusIndicator.tsx]
        B --> K[WebSocketEventsDisplay.tsx]
        B --> L[NitroliteRealTimeDemo.tsx]
    end
    
    subgraph "Services"
        M[wallet.ts]
        N[nitrolite.ts]
        O[transactions.ts]
        P[recurring.ts]
        Q[websocket.ts]
    end
    
    A -.-> M
    A -.-> N
    A -.-> O
    A -.-> P
    A -.-> Q
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style C fill:#50C878,stroke:#333,stroke-width:2px
    style E fill:#FF6B6B,stroke:#333,stroke-width:2px
    style M fill:#9B59B6,stroke:#33,stroke-width:2px
```

### Network Flow Diagram
```mermaid
graph LR
    subgraph "Client Side"
        A[React App]
        B[Tailwind CSS]
        C[Zustand Store]
    end
    
    subgraph "Blockchain Services"
        D[Wallet Service]
        E[NitroLite Service]
        F[Transaction Service]
    end
    
    subgraph "External Networks"
        G[Ethereum Mainnet]
        H[Sepolia Testnet]
        I[Polygon Network]
    end
    
    subgraph "Infrastructure"
        J[ClearNode API]
        K[Relayer Network]
        L[WebSocket Server]
    end
    
    A --> D
    A --> E
    A --> F
    D --> G
    D --> H
    E --> K
    F --> J
    A --> L
    L --> G
    L --> H
    L --> I
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style G fill:#FF6B,stroke:#333,stroke-width:2px
    style K fill:#50C878,stroke:#333,stroke-width:2px
    style J fill:#FFD700,stroke:#333,stroke-width:2px
```

### Data Flow Architecture
```mermaid
graph LR
    A[User Interaction] --> B[React State]
    B --> C[Zustand Store]
    C --> D[Service Layer]
    D --> E[Blockchain API]
    D --> F[WebSocket Connection]
    D --> G[External Services]
    E --> H[Blockchain Network]
    F --> I[Real-time Data Feed]
    G --> J[Infura/Alchemy]
    G --> K[WalletConnect]
    
    I --> D
    H --> E
    J --> G
    K --> D
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style D fill:#9B59B6,stroke:#333,stroke-width:2px
    style H fill:#FF6B,stroke:#333,stroke-width:2px
```

## 🔐 Security

Budget Buddy implements multiple security layers:

1. **Client-Side Encryption**: All sensitive data is encrypted using AES-GCM
2. **Zero-Knowledge Proofs**: Transaction privacy without revealing details
3. **Secure Key Management**: Encryption keys are generated and stored locally
4. **Meta-Transaction Security**: EIP-712 signed transactions for gasless operations

## 🌐 Supported Networks

<div align="center">

### Network Compatibility Matrix

| Network | Chain ID | Gasless Support | Explorer | Status |
|---------|----------|----------------|----------|--------|
| Ethereum Mainnet | 1 | ✅ | [etherscan.io](https://etherscan.io) | 🟢 Active |
| Sepolia Testnet | 11155111 | ✅ | [sepolia.etherscan.io](https://sepolia.etherscan.io) | 🟢 Active |
| Polygon Mainnet | 137 | 🔄 | [polygonscan.com](https://polygonscan.com) | 🟡 Coming Soon |
| Arbitrum One | 42161 | 🔄 | [arbiscan.io](https://arbiscan.io) | 🟡 Coming Soon |

### Multi-Chain Architecture

```mermaid
graph LR
    A[Nitrolite Dashboard] --> B[Ethereum Mainnet]
    A --> C[Sepolia Testnet]
    A --> D[Polygon Mainnet]
    A --> E[Arbitrum One]
    
    B --> F[Etherscan]
    C --> G[Sepolia Etherscan]
    D --> H[Polygonscan]
    E --> I[Arbiscan]
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style B fill:#50C878,stroke:#333,stroke-width:2px
    style C fill:#50C878,stroke:#33,stroke-width:2px
    style D fill:#FFD700,stroke:#333,stroke-width:2px
    style E fill:#FFD70,stroke-width:2px
```

</div>

## 📊 NitroLite Protocol

<div align="center">

Budget Buddy leverages advanced Web3 technology for smart crypto management:

### Protocol Architecture

```mermaid
graph TB
    subgraph "User Experience Layer"
        A[User Signs Transaction]
    end
    
    subgraph "Protocol Layer"
        B[Meta-Transaction Creation]
        C[Relayer Network]
        D[Gasless Execution]
    end
    
    subgraph "Blockchain Layer"
        E[Ethereum Network]
        F[Transaction Processing]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style C fill:#50C878,stroke:#333,stroke-width:2px
    style E fill:#FF6B,stroke:#333,stroke-width:2px
```

### Key Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| 💰 **Cost Efficiency** | Up to 95% reduction in transaction costs | ⭐⭐⭐⭐⭐ |
| ⚡ **Fast Processing** | Average 2.3 second transaction times | ⭐⭐⭐⭐⭐ |
| 🔐 **Security** | EIP-712 signed transactions for gasless operations | ⭐⭐⭐⭐ |
| 🌐 **Multi-Chain** | Support for Ethereum, Polygon, and more | ⭐⭐⭐⭐ |

</div>

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Toggle between themes
- **Glass Morphism**: Modern glass-effect design elements
- **Smooth Animations**: Framer Motion powered transitions
- **Real-time Updates**: Live transaction status and balance updates

### UI Mockup Diagrams

#### Dashboard Layout
```mermaid
graph TB
    subgraph "Nitrolite Dashboard"
        A[Header: Nitrolite Dashboard + Network Selector]
        B[Sidebar: Navigation Menu]
        C[Main Content Area]
    end
    
    subgraph "Sidebar Navigation"
        B1[🏠 Dashboard]
        B2[💳 Send]
        B3[🔄 Recurring]
        B4[📊 Analytics]
        B5[⚙️ Settings]
        B6[🔔 Notifications]
    end
    
    subgraph "Main Content - Dashboard View"
        C1[Wallet Connection Status Card]
        C2[Balance Summary Cards]
        C3[Recent Transactions Table]
        C4[Network Stats Panel]
        C5[Gas Price Tracker]
        C6[Quick Actions Panel]
    end
    
    subgraph "Dashboard Cards"
        D1[Total Balance Card]
        D2[Asset Distribution Card]
        D3[Network Health Card]
        D4[Transaction Activity Card]
    end
    
    A --> B
    A --> C
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
    B --> B6
    C --> C1
    C --> C2
    C --> C3
    C --> C4
    C --> C5
    C --> C6
    C2 --> D1
    C2 --> D2
    C2 --> D3
    C2 --> D4
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style B fill:#50C878,stroke:#333,stroke-width:2px
    style C fill:#FFD700,stroke:#333,stroke-width:2px
    style D1 fill:#FF6B,stroke:#333,stroke-width:2px
    style D2 fill:#9B59B6,stroke:#333,stroke-width:2px
```

#### Send Transaction Flow
```mermaid
graph TD
    subgraph "Send Transaction Interface"
        A[Send Page Header]
        B[Recipient Address Input]
        C[Amount Input]
        D[Token Selection Dropdown]
        E[Gasless Transaction Toggle]
        F[Transaction Fee Display]
        G[Send Button]
        H[Transaction Confirmation Modal]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    B --> F
    C --> F
    D --> F
    E --> F
    F --> G
    G --> H
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style G fill:#50C878,stroke:#333,stroke-width:2px
    style H fill:#FF6B,stroke:#333,stroke-width:2px
```

#### Recurring Payments Interface
```mermaid
graph LR
    subgraph "Recurring Payments"
        A[New Recurring Payment Button]
        B[Payment Configuration Form]
        C[Schedule Selector]
        D[Amount & Recipient Fields]
        E[Payment History Table]
        F[Active Recurring Payments List]
    end
    
    A --> B
    B --> C
    B --> D
    C --> F
    D --> F
    F --> E
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style F fill:#FF6B,stroke:#333,stroke-width:2px
    style E fill:#50C878,stroke:#333,stroke-width:2px
```

#### Real-time Data Components
```mermaid
graph TB
    subgraph "Real-time Data Display"
        A[WebSocket Status Indicator]
        B[Live Block Number]
        C[Current Gas Price]
        D[Network Health Status]
        E[Active Connections Count]
        F[Transaction Per Second]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style B fill:#FFD70,stroke:#333,stroke-width:2px
    style C fill:#FF6B6B,stroke:#333,stroke-width:2px
```

## 🔄 Data Management

- **Export/Import**: Backup and restore all application data
- **Local Storage**: Persistent storage of user preferences
- **Data Encryption**: Sensitive information is encrypted locally
- **Privacy Control**: Users control their data completely

## 🐛 Troubleshooting

<div align="center">

### Common Issues & Solutions

```mermaid
graph TD
    A[Troubleshooting] --> B[Wallet Connection Issues]
    A --> C[Transaction Issues]
    A --> D[Network Issues]
    
    B --> B1[MetaMask Not Connecting]
    B --> B2[Wallet Not Detected]
    B --> B3[Network Switching Problems]
    
    C --> C1[Gasless Transaction Failures]
    C --> C2[Transaction Not Confirming]
    C --> C3[Balance Not Updating]
    
    D --> D1[WebSocket Disconnections]
    D --> D2[Slow Data Updates]
    D --> D3[API Connection Errors]
    
    B1 --> B1a[Check MetaMask Extension]
    B1 --> B1b[Verify Network Selection]
    B1 --> B1c[Refresh Browser]
    
    style A fill:#FF6B6B,stroke:#33,stroke-width:2px
    style B fill:#4ECDC4,stroke:#333,stroke-width:2px
    style C fill:#4ECDC4,stroke:#333,stroke-width:2px
    style D fill:#4ECDC4,stroke:#333,stroke-width:2px
```

</div>

### Common Issues

<div align="center">

| Issue | Solution | Difficulty |
|-------|----------|------------|
| **MetaMask Not Connecting** | Ensure MetaMask is installed and unlocked; Check if the correct network is selected; Refresh the page and try again | 🟢 Easy |
| **Gasless Transactions Not Working** | Verify you're on a supported network; Check if NitroLite protocol is available; Ensure sufficient relayer availability | 🟡 Medium |
| **Transaction Monitoring Issues** | Check wallet connection status; Verify network connectivity; Ensure proper permissions are granted | 🟡 Medium |

</div>

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

<div align="center">

### Partners & Technologies

| Partner | Contribution | Logo |
|---------|--------------|------|
| **NitroLite Protocol** | gasless transaction infrastructure | 🚀 |
| **MetaMask** | wallet integration | 🔐 |
| **WalletConnect** | multi-wallet support | 🔗 |
| **Ethereum Foundation** | underlying blockchain technology | ⚛️ |
| **React** | frontend framework | ⚛️ |
| **TypeScript** | type safety | 🧠 |

### Tech Stack

```mermaid
graph LR
    A[Nitrolite Dashboard] --> B[React 18]
    A --> C[TypeScript]
    A --> D[Vite]
    A --> E[Tailwind CSS]
    A --> F[Zustand]
    A --> G[Ethers.js]
    A --> H[WebSocket]
    A --> I[Node.js]
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style B fill:#61DAFB,stroke:#333,stroke-width:2px
    style C fill:#3178C6,stroke:#33,stroke-width:2px
    style D fill:#646CFF,stroke:#333,stroke-width:2px
    style E fill:#38BDF8,stroke:#33,stroke-width:2px
    style F fill:#FF6B6B,stroke:#333,stroke-width:2px
    style G fill:#50C878,stroke:#333,stroke-width:2px
    style H fill:#00D924,stroke:#333,stroke-width:2px
    style I fill:#8CC84B,stroke:#333,stroke-width:2px
```

</div>

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation wiki

---

## 🎮 Interactive Demo

Experience the power of Nitrolite in real-time with our interactive dashboard demo. Connect your wallet and explore the features that make Nitrolite the premier ERC-7824 dashboard solution. The demo showcases real-time blockchain data, gasless transactions, and our intuitive UI/UX design. Try it now to see how Nitrolite transforms your Web3 experience!

**Built with ❤️ for the Web3 community**
```
