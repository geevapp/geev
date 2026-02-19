# Geev

Geev is a decentralized social platform built on the Stellar blockchain that enables users to create giveaways, post help requests, and participate in community-driven mutual aid. It combines social networking features with Web3 wallet integration to facilitate transparent, trustless giving and receiving.

[![Tests](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/geevapp)

## FRONTEND TECHNOLOGY STACK

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API + SWR for data fetching
- **Icons**: Lucide React
- **Animations**: Framer Motion (for scroll animations and transitions)
- **Theme System**: next-themes with light/dark mode support

## DOCUMENTATION

- [Theme System](docs/theme.md) - Light/dark mode implementation and usage guide
- [Components](docs/components.md) - Component library documentation

## BACKEND INFRASTRUCTURE

The backend is integrated into the Next.js application using API Routes.

- **ORM**: Prisma (PostgreSQL)
- **API Routes**: Located in `app/api/`
- **Utilities**:
  - `lib/prisma.ts`: Prisma client singleton and connection testing.
  - `lib/api-response.ts`: Standardized API response helpers (`apiSuccess`, `apiError`).
- **Middleware**: Handles Request Logging and CORS in `middleware.ts`.

## RESOURCES

- [FIGMA UI KIT](https://www.figma.com/design/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=a3DcI1rqYjGvbhBd-0)
- [APP PROTOTYPE (FIGMA)](https://www.figma.com/proto/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=Sk47E3cbSLVg2zcA-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=6%3A192&show-proto-sidebar=1)
- [PROJECT SUMMARY](https://docs.google.com/document/d/1ZEfrbVF_rjJ3GrLYeTxTboRL15dT0kaVyioXrdPpmMU)
- [FEATURE SPECIFICATIONS](https://docs.google.com/document/d/1qRyFhhAqBgZU8NtrVmMk6HV2qSi0nb_K3sxrgPaKymI)

## Getting Started

### Frontend Application

If you're working on the frontend application, the `app` directory contains the Next.js codebase. To get started, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing and creating pages and components. The backend API routes are located in `app/api/` and can be modified to implement the necessary functionality for the application.
Refer to the [app/README.md](app/README.md) for more detailed information on the frontend and backend infrastructure, documentation, and resources.

### Smart Contracts

The `contracts` directory contains the Soroban smart contracts for the platform. To get started with the smart contracts, follow these steps:

1. Install Soroban CLI:
   ```bash
   cargo install --locked soroban-cli
   ```
2. Build the smart contracts:
   ```bash
   soroban build
   ```
3. Deploy the smart contracts to the Stellar testnet or a local Soroban environment:
   ```bash
   soroban deploy --network testnet
   ```
   or
   ```bash
   soroban deploy --network local
   ```
4. Interact with the deployed smart contracts using the Soroban CLI or by integrating them into the frontend application.
   Refer to the [contracts/README.md](contracts/README.md) for more detailed information on the smart contract architecture, deployment, and interaction.
