# Nitrolite UI/UX Mockup Diagrams

## Dashboard Layout

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

## Send Transaction Flow

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

## Recurring Payments Interface

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

## Real-time Data Components

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
    style B fill:#FFD700,stroke:#333,stroke-width:2px
    style C fill:#FF6B6B,stroke:#333,stroke-width:2px
```

## Mobile Responsive Layout

```mermaid
graph TD
    subgraph "Mobile Layout"
        A[Mobile Header: Hamburger + Title + Network]
        B[Tab Bar: Dashboard, Send, Recurring, Settings]
        C[Content Area: Responsive Cards]
    end
    
    subgraph "Mobile Dashboard View"
        C1[Wallet Card]
        C2[Balance Card]
        C3[Quick Actions]
        C4[Recent Transactions]
    end
    
    A --> B
    A --> C
    C --> C1
    C --> C2
    C --> C3
    C --> C4
    
    style A fill:#4A90E2,stroke:#333,stroke-width:2px
    style B fill:#50C878,stroke:#333,stroke-width:2px
```

## Dark/Light Mode Components

```mermaid
graph LR
    subgraph "Theme System"
        A[Theme Provider]
        B[CSS Variables]
        C[UI Components]
        D[Dark Theme]
        E[Light Theme]
    end
    
    A --> B
    A --> C
    B --> D
    B --> E
    C --> D
    C --> E
    
    style A fill:#9B59B6,stroke:#333,stroke-width:2px
    style D fill:#34495E,stroke:#33,stroke-width:2px
    style E fill:#ECF0F1,stroke:#333,stroke-width:2px