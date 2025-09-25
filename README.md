# Budget Buddy - Smart Crypto Companion

Budget Buddy is a cutting-edge Web3 application that enables smart cryptocurrency management and advanced transaction tracking for better financial planning.

## 🚀 Features

### Core Features
- **Zero-Fee Transactions**: Gasless crypto transfers using NitroLite protocol
- **MetaMask Authentication**: Secure wallet connection via Yellow SDK
- **Transaction Monitoring**: Real-time monitoring of all MetaMask wallet transactions
- **Recurring Payments**: Schedule and manage automated recurring transactions
- **Privacy-First Design**: AES-GCM encryption and zero-knowledge processing
- **Multi-Network Support**: Ethereum Mainnet and Sepolia testnet
- **WalletConnect Integration**: Support for MetaMask, Trust Wallet, and other wallets

### Technical Highlights
- Built with React 18, TypeScript, and Vite
- Responsive design with Tailwind CSS
- State management with Zustand
- Smooth animations with Framer Motion
- Form handling with React Hook Form
- Real-time updates and monitoring

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

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

## 🔐 Security

Budget Buddy implements multiple security layers:

1. **Client-Side Encryption**: All sensitive data is encrypted using AES-GCM
2. **Zero-Knowledge Proofs**: Transaction privacy without revealing details
3. **Secure Key Management**: Encryption keys are generated and stored locally
4. **Meta-Transaction Security**: EIP-712 signed transactions for gasless operations

## 🌐 Supported Networks

| Network | Chain ID | Gasless Support | Explorer |
|---------|----------|----------------|----------|
| Ethereum Mainnet | 1 | ✅ | etherscan.io |
| Sepolia Testnet | 11155111 | ✅ | sepolia.etherscan.io |

## 📊 NitroLite Protocol

Budget Buddy leverages advanced Web3 technology for smart crypto management:

- **Meta-Transactions**: Users sign transactions without paying gas
- **Relayer Network**: Decentralized network of relayers execute transactions
- **Cost Efficiency**: Up to 95% reduction in transaction costs
- **Fast Processing**: Average 2.3 second transaction times

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Toggle between themes
- **Glass Morphism**: Modern glass-effect design elements
- **Smooth Animations**: Framer Motion powered transitions
- **Real-time Updates**: Live transaction status and balance updates

## 🔄 Data Management

- **Export/Import**: Backup and restore all application data
- **Local Storage**: Persistent storage of user preferences
- **Data Encryption**: Sensitive information is encrypted locally
- **Privacy Control**: Users control their data completely

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask Not Connecting**
   - Ensure MetaMask is installed and unlocked
   - Check if the correct network is selected
   - Refresh the page and try again

2. **Gasless Transactions Not Working**
   - Verify you're on a supported network
   - Check if NitroLite protocol is available
   - Ensure sufficient relayer availability

3. **Transaction Monitoring Issues**
   - Check wallet connection status
   - Verify network connectivity
   - Ensure proper permissions are granted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NitroLite Protocol** for gasless transaction infrastructure
- **MetaMask** for wallet integration
- **WalletConnect** for multi-wallet support
- **Ethereum Foundation** for the underlying blockchain technology

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation wiki

---

**Built with ❤️ for the Web3 community**
```
