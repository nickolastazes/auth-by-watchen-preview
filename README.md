# Auth by Watchen (Preview)

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
  - Supabase Integration for data persistence
  - Responsive design out of the box
- 🛠️ **Architecture**

  - Clean project structure
  - Production-ready configuration
  - Easy to customize and extend

## 🔮 Authentication Flow Diagram

![Authentication Flow Diagram](https://watchen.xyz/diagram-auth-by-watchen-preview.png)

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

4. Set up Supabase database:

```sql
-- Create the users table with required fields
create table auth_by_watchen_users (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  provider text,
  username_email text,
  address text,
  encrypted_private_key text,
  iv text,
  salt text,
  export_account boolean default false
);

-- Enable public access (security is handled at the application level)
create policy "Enable all operations for users table"
  on auth_by_watchen_users
  for all
  using (true)
  with check (true);
```

## 📚 Database Schema

The boilerplate requires a Supabase database with the following table structure:

**Table: auth_by_watchen_users**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamp | Auto-generated timestamp |
| provider | text | Authentication provider (e.g., 'google', 'twitter') |
| username_email | text | User's username or email |
| address | text | Ethereum wallet address |
| encrypted_private_key | text | Encrypted wallet private key |
| iv | text | Initialization vector for encryption |
| salt | text | Salt for encryption |
| export_account | boolean | Flag for account export status |

**Note:** Database security is handled at the application level rather than through Postgres RLS policies.

5. Start development server:

```bash
yarn dev
```

## 📁 Project Structure

```
├── components/            # Reusable React components
│   ├── WatchenAuth/      # Authentication Components
│       ├── AuroraBackground.tsx    # Background animation
│       ├── FarcasterButton.tsx     # Farcaster login
│       ├── MainLogin.tsx           # Main login component
│       ├── TransakOffRamp.tsx      # Crypto selling
│       ├── TransakOnRamp.tsx       # Crypto buying
│       ├── Wallet.tsx              # Wallet management
│       └── WalletAltUi/           # Wallet UI components
│           ├── EmbeddedWalletAltUi.tsx
│           └── ExternalWalletAltUi.tsx
├── contracts/            # Smart contract development
│   ├── src/             # Contract source files
│   ├── test/            # Contract test files
│   ├── scripts/         # Deployment scripts
│   └── hardhat.config.ts # Hardhat configuration
├── pages/                # Next.js pages
│   ├── _app.tsx         # App configuration
│   ├── _document.tsx    # Document setup
│   ├── app.tsx          # Main app page
│   ├── index.tsx        # Landing page
│   ├── sign-in/         # Auth pages
│   └── api/             # API endpoints
│       └── auth/        # NextAuth configuration
├── hooks/               # Custom hooks
│   └── useWallet.ts    # Wallet management hook
├── styles/             # Global styles
│   └── globals.css     # Tailwind & custom styles
├── types/              # TypeScript definitions
│   └── next-auth.d.ts  # Auth type extensions
├── utils/              # Helper functions
│   ├── cn.ts          # Class name utilities
│   └── supabase.ts    # Supabase client
└── public/             # Static assets
```

## 🌐 Network Configuration

This boilerplate is pre-configured to work with the Sepolia Base Network. To switch to a different network, you'll need to modify the network configuration in these files:

1. `pages/_app.tsx` - Update the chain configuration and RPC endpoints
2. `utils/embeddedWalletClient.ts` - Update the public client chain configuration
3. `components/WatchenAuth/WalletAltUi/EmbeddedWalletAltUi.tsx` - Update the chain import

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

## 📝 License

This preview release is available for testing purposes. Full license terms will be announced with the official release.
