# Auth by Watchen (PREVIEW)

Auth by Watchen is an opinionated Next.js boilerplate with built-in authentication that combines traditional social logins with embedded crypto wallets, designed to help founders build Web3 applications for mainstream users without vendor lock-in. The project is configured to work with Sepolia Base Network by default.

## ✨ Features

- 🔐 **Multi-Platform Authentication**
  - Social logins via Google, Twitter, Discord
  - Web3 native auth with Farcaster and EOA
  - Powered by NextAuth.js
- 🚀 **Web3 Integration**
  - Embedded Ethereum Account Generation
  - Wagmi Integration
  - Transak Integration for On/Off-Ramp with improved Selling UX
  - Pre-configured for Sepolia Base Network
- 📦 **Developer Experience**
  - Built on Next.js v15.0.2 (Pages Router)
  - Type-safe with TypeScript
  - MongoDB Integration for data persistence
  - Responsive design out of the box
- 🛠️ **Architecture**
  - Clean project structure
  - Production-ready configuration
  - Easy to customize and extend

## 🔮 Authentication Flow Diagram

![Authentication Flow Diagram](https://watchen.xyz/auth-by-watchen-diagram.png)

## 🚀 Quick Start

1. Clone the repository:

```bash
git clone https://github.com/nickolastazes/auth-by-watchen-preview
cd auth-by-watchen-preview
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment variables:

```bash
cp .env.local.example .env.local
# Follow the configuration steps in .env.local
```

4. Set up MongoDB:

You'll need to set up a MongoDB database and add the connection string to your environment variables. The application will automatically create the required collections with the following schema:

## 📚 Database Schema

The boilerplate uses MongoDB with the following collection structure:

**Collection: users**
| Field | Type | Description |
|--------|------|-------------|
| \_id | ObjectId | Primary key, auto-generated |
| created_at | Date | Creation timestamp |
| provider | string | Authentication provider (e.g., 'google', 'twitter') |
| username_email | string | User's username or email |
| address | string | Ethereum wallet address |
| encrypted_private_key | string | Encrypted wallet private key |
| iv | string | Initialization vector for encryption |
| salt | string | Salt for encryption |
| export_account | boolean | Flag for account export status |

5. Start development server:

```bash
yarn dev
```

## 📁 Project Structure

```
├── components/            # Reusable React components
│   ├── Navbar.tsx        # Navigation component
│   └── WatchenAuth/      # Authentication Components
│       ├── AuroraBackground.tsx    # Background animation
│       ├── FarcasterButton.tsx     # Farcaster login
│       ├── TelegramButton.tsx      # Telegram login
│       ├── MainLogin.tsx           # Main login component
│       ├── TransakOffRamp.tsx      # Crypto selling
│       ├── TransakOnRamp.tsx       # Crypto buying
│       ├── Wallet.tsx              # Wallet management
│       └── WalletUi/              # Wallet UI components
│           ├── EmbeddedWalletUi.tsx
│           ├── ExternalWalletUi.tsx
│           └── WalletSkeleton.tsx
├── lib/                  # Core library code
│   └── mongodb.ts       # MongoDB client configuration
├── pages/               # Next.js pages
│   ├── _app.tsx        # App configuration
│   ├── _document.tsx   # Document setup
│   ├── app.tsx         # Main app page
│   ├── index.tsx       # Landing page
│   ├── sign-in/        # Auth pages
│   │   └── index.tsx   # Sign in page
│   └── api/            # API endpoints
│       ├── auth/       # NextAuth configuration
│       │   └── [...nextauth].ts
│       ├── proxy/      # Proxy endpoints
│       │   └── telegram-image.ts
│       └── user/       # User management endpoints
│           ├── check.ts
│           ├── create.ts
│           └── manage.ts
├── hooks/              # Custom React hooks
│   └── useWallet.ts   # Wallet management hook
├── styles/            # Global styles
│   └── globals.css   # Tailwind & custom styles
├── types/            # TypeScript definitions
│   ├── next-auth.d.ts # Auth type extensions
│   └── database.ts   # Database type definitions
├── utils/            # Helper functions
│   ├── cn.ts        # Class name utilities
│   ├── db.ts        # Database utilities
│   └── embeddedWalletClient.ts # Wallet client configuration
├── public/          # Static assets
│   └── auth-by-watchen.svg
├── middleware.ts    # Next.js middleware
├── next.config.mjs  # Next.js configuration
├── postcss.config.mjs # PostCSS configuration
├── tailwind.config.ts # Tailwind configuration
├── tsconfig.json   # TypeScript configuration
├── package.json    # Project dependencies
└── .env.local.example # Environment variables template
```

## 🌐 Network Configuration

This boilerplate is pre-configured to work with the Sepolia Base Network. To switch to a different network, you'll need to modify the network configuration in these files:

1. `pages/_app.tsx` - Update the chain configuration and RPC endpoints
2. `utils/embeddedWalletClient.ts` - Update the public client chain configuration
3. `components/WatchenAuth/WalletUi/EmbeddedWalletUi.tsx` - Update the chain import

- Test your application with test tokens
- Interact with Base's testnet infrastructure
- Deploy and test smart contracts
- Use Transak's testing environment for on/off ramp features

To switch to a different network, modify the network configuration in your environment variables.

## 🛣️ Roadmap

- 📱 **Progressive Web App (PWA)**
  - Native app-like experience on mobile devices
  - Push notifications support
  - Offline functionality
- 🔒 **Privacy & Security**
  - Snowflake-Tor integration for enhanced privacy
  - Censorship resistance capabilities
- 🌉 **Cross-Chain Functionality**
  - Relay integration or alternative (eg Across)
- 📱 **Mobile Platform Support**
  - iOS native app support
  - Android native app support
- 🔑 **Extended Authentication**

  - Email authentication
  - Passkey support
  - Phone number verification
  - Apple Sign-in

- 🧠 **Smart Ethereum Accounts**
  - ERC-4337 Account Abstraction support
  - Smart account creation and management

## 🤝 Support, Bugs and Suggestions

- Reach out:

  - Twitter: [@nickolas_tazes](https://x.com/nickolas_tazes)
  - Farcaster: [@tazes](https://warpcast.com/tazes)

  ## 📋 Changelog

### [0.0.4] - 2025-01-03

#### Added

- Telegram provider integration in MainLogin component
- Enhanced loading state management in FarcasterButton
- Improved error handling across authentication components

#### Changed

- Streamlined Wallet component structure for better maintainability
- Refactored user management API endpoints for improved efficiency
- Updated MainLogin component with expanded social provider options

#### Fixed

- Removed deprecated console error logs
- Enhanced error handling in authentication flow
- Improved loading state consistency across components

### [0.0.3] - 2024-12-30

#### Enhanced

- Implemented Suspense loading state for Wallet component with new WalletSkeleton
- Improved transaction handling in TransakOffRamp component
- Updated EmbeddedWalletUi to support loading states and smoother transitions

#### Changed

- Removed deprecated decrypt-key API endpoint
- Streamlined transaction signing process for better reliability
- Consolidated wallet loading states across components

#### Fixed

- Transaction handling edge cases in TransakOffRamp
- Loading state inconsistencies in wallet UI components
- Improved error handling during transaction signing

### [0.0.2] - 2024-12-23

#### Changed

- Migrated from Supabase to MongoDB for improved flexibility and scalability
- Updated database schema and related utilities
- Enhanced error handling in API endpoints

#### Added

- MongoDB integration with connection pooling
- New database utility functions in `utils/db.ts`
- Improved type safety for database operations

#### Fixed

- Database timeout issues with long-running queries
- Connection handling for concurrent requests
- Type definitions for database models

### [0.0.1] - 2024-11-16

#### Added

- Initial release with Supabase integration
- Multi-platform authentication support
- Web3 wallet integration
- Basic user management features

## 📝 License

This preview release is available for testing purposes. Full license terms will be announced with the official release.
