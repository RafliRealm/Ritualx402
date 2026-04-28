# RitualX402 — Mint Tokens & NFTs on Ritual Chain

**Decentralized minting interface powered by HTTP 402 Payment Protocol and Ritual Chain TEE verification.**

![Ritual Chain](https://img.shields.io/badge/Chain-Ritual%201979-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)

---

## 🎯 Overview

RitualX402 is a web application that enables users to mint ERC-20 tokens and NFTs (ERC-721) on Ritual Chain using the **HTTP 402 Payment Protocol**. Each mint transaction is:

1. **Signed** via EIP-712 typed data signature
2. **Verified** inside Ritual's Trusted Execution Environment (TEE) at precompile `0x0801`
3. **Confirmed** on-chain with transparent transaction tracking

No subscriptions, no API keys — just pay-per-mint via on-chain payments.

---

## ✨ Features

- ✅ **Multi-Wallet Support** — MetaMask, OKX, Rabby, Coinbase, WalletConnect
- ✅ **Token Minting** — Create custom ERC-20 tokens with configurable supply & decimals
- ✅ **NFT Minting** — Create ERC-721 NFTs with royalty support & image preview
- ✅ **Real-time Chain Info** — Block number, balance, network status updates
- ✅ **Transaction History** — Track all mints with block explorer links
- ✅ **5-Step Flow Visualization** — Visual progress indicator during mint
- ✅ **Mobile-Friendly** — Fully responsive design with touch support
- ✅ **Security** — EIP-712 signatures + nonce/deadline for replay protection

---

## 🚀 Quick Start

### Prerequisites
- Modern browser with Web3 wallet extension (MetaMask, OKX, Rabby, or Coinbase)
- Testnet RITUAL tokens (get from [faucet](https://faucet.ritualfoundation.org/))

### Usage
1. **Clone or download** the repository
2. **Open** `index.html` in your browser
3. **Connect** your wallet (top-right button)
4. **Switch** to Ritual Chain (ID: 1979) if needed
5. **Choose** Token or NFT tab
6. **Fill** the form with parameters
7. **Click** "Mint via X402"
8. **Sign** the EIP-712 payload in your wallet
9. **Confirm** the on-chain transaction
10. ✅ **Success** — Track your transaction in the history panel

---

## 📋 Form Fields

### Token Minting
| Field | Required | Constraints |
|-------|----------|-------------|
| Token Name | ✅ | 2-100 characters |
| Token Symbol | ✅ | 1-10 characters |
| Initial Supply | ✅ | Positive number, max 10^36 |
| Decimals | ❌ | 0-18 (default: 18) |
| Recipient | ❌ | Valid Ethereum address (defaults to connected wallet) |

### NFT Minting
| Field | Required | Constraints |
|-------|----------|-------------|
| NFT Name | ✅ | 2-100 characters |
| NFT Description | ❌ | Any length |
| Collection | ❌ | Any string (default: "RitualGenesis") |
| Royalty | ❌ | 0-100% (default: 0) |
| Image | ❌ | JPEG, PNG, GIF, WebP |
| Recipient | ❌ | Valid Ethereum address (defaults to connected wallet) |

---

## 💰 Fees

| Service | Cost | Network |
|---------|------|---------|
| Mint Token | 0.001 RITUAL | Ritual Testnet (1979) |
| Mint NFT | 0.005 RITUAL | Ritual Testnet (1979) |
| Adjustable Multiplier | 0.001× - 0.010× | Token tab only |

---

## 🔗 Network Configuration

**Ritual Chain (Testnet)**
```
Chain ID:     1979
Chain ID Hex: 0x7BB
RPC:          https://rpc.ritualfoundation.org
Explorer:     https://explorer.ritualfoundation.org
Faucet:       https://faucet.ritualfoundation.org
```

---

## 🏗️ Project Structure

```
ritualx402/
├── index.html              # Main HTML entry point
├── main.js                 # Module initialization & event handlers
├── config/
│   ├── chain.js            # Ritual Chain configuration
│   └── x402.js             # X402 payment config & constants
├── services/
│   ├── wallet.js           # Wallet connection & state management
│   ├── mint.js             # Mint orchestration (5-step flow)
│   ├── chain.js            # Blockchain info polling
│   └── x402.js             # EIP-712 payload builder
├── ui/
│   ├── flow-stepper.js     # Step indicator animation
│   ├── tabs.js             # Tab switching & fee updates
│   ├── modals.js           # Modal dialogs
│   └── tx-list.js          # Transaction history
├── utils/
│   └── helpers.js          # Utility functions
├── styles/
│   ├── main.css            # Core styling
│   └── components.css      # Component styles
├── .gitignore              # Git ignore rules
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

---

## 🔐 Security

### Cryptographic Security
- **EIP-712 Typed Signing** — Users sign structured data, not raw messages
- **Nonce** — Random 32-byte nonce prevents replay attacks
- **Deadline** — 60-second expiration window for signatures
- **Chain ID Binding** — Signatures tied to Ritual Chain (1979)

### Contract Security
- **TEE Verification** — Signature verified inside Ritual's TEE at precompile 0x0801
- **No Private Keys Exposed** — Wallet holds keys, not stored in app
- **Input Validation** — Address format checking, numeric bounds validation

### Web Security
- **Content Security** — No innerHTML usage (XSS prevention)
- **HTTPS Only** — Deployment requires HTTPS
- **No Sensitive Storage** — No localStorage of keys/seeds
- **CORS Headers** — Proper cross-origin handling

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RitualX402 MVP"
   git remote add origin https://github.com/YOUR_USERNAME/ritualx402
   git push -u origin main
   ```

2. **Connect Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel auto-detects static site → click "Deploy"

3. **Auto-Deploy on Push**
   - Every push to `main` branch → auto-deploys
   - Get live URL immediately

### Deploy to Other Platforms

**Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=.
```

**GitHub Pages**
```bash
# Commit & push to GitHub
# Enable Pages in repo settings
# Select "Deploy from branch: main"
```

**Self-Hosted (Apache/Nginx)**
```bash
# Copy all files to your web server's public directory
cp -r . /var/www/html/ritualx402/
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Wallet connection (all 5 wallet types)
- [ ] Network switching to Ritual Chain 1979
- [ ] Token mint with valid params
- [ ] NFT mint with image upload
- [ ] Invalid input rejection (e.g., bad address)
- [ ] Transaction history updates
- [ ] Mobile responsiveness (iPhone/Android)
- [ ] Balance updates after mint
- [ ] Explorer link opens correctly

### Test Data
```
Test Wallet Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f42a1e
Token Name: "Test Token"
Token Symbol: "TEST"
Supply: 1000000
NFT Name: "Test NFT"
Collection: "TestCollection"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Ritual Foundation** — https://ritualfoundation.org
- **Ritual Docs** — https://docs.ritualfoundation.org
- **Ethers.js v6** — https://docs.ethers.org/v6/
- **EIP-712** — https://eips.ethereum.org/EIPS/eip-712
- **HTTP 402** — https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402

---

## 💬 Support & Issues

- **Report Bug** — [Create GitHub Issue](https://github.com/YOUR_USERNAME/ritualx402/issues)
- **Discussion** — [Ritual Discord](https://discord.gg/ritual)
- **Documentation** — [Ritual Docs](https://docs.ritualfoundation.org)

---

## ⚠️ Disclaimer

This application interacts with blockchain networks and cryptocurrency. Use at your own risk. Always verify contract addresses and transactions before confirming. The developers are not responsible for lost funds or security breaches.

---

**Made with ❤️ for Ritual Chain | Last Updated: April 2026**
