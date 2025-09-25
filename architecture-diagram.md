# Nitrolite Architecture Diagrams

## System Architecture

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
    style K fill:#FF6B6B,stroke:#333,stroke-width:2px
    style L fill:#FFD700,stroke:#333,stroke-width:2px
```

## Wallet Connection Flow

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

## Gasless Transaction Flow

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

## UI Component Structure

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

## Network Flow Diagram

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

## Data Flow Architecture

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