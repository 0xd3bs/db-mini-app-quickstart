# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Farcaster Mini App built with Next.js 15, OnchainKit, and the Farcaster SDK. It's a waitlist sign-up application that can be published to the Base app and Farcaster. The app demonstrates authentication with Farcaster QuickAuth and social sharing capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Core Configuration

- **minikit.config.ts**: Central configuration for the MiniApp manifest. Defines app metadata, branding (icons, screenshots, splash images), URLs (home, webhook), and Farcaster account association credentials. This file feeds into `app/.well-known/farcaster.json/route.ts` to generate the required manifest endpoint.

- **Environment Variables** (see .example.env):
  - `NEXT_PUBLIC_URL`: Your deployed app URL (required for production)
  - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Coinbase Developer Platform API key
  - `NEXT_FARCASTER_HEADER/PAYLOAD/SIGNATURE`: Account association credentials from Farcaster manifest tool

### Application Flow

1. **Root Provider** (app/rootProvider.tsx): Wraps the app with `OnchainKitProvider`, configuring Base chain connection and MiniKit integration (autoConnect enabled).

2. **Layout** (app/layout.tsx): Generates frame metadata from `minikit.config.ts` for proper embedding in Farcaster/Base. Uses `SafeArea` component for mobile app compatibility.

3. **Main Page** (app/page.tsx):
   - Initializes MiniKit frame with `useMiniKit()` hook
   - Authenticates user via `useQuickAuth()` hook calling `/api/auth`
   - Collects email for waitlist
   - Accesses user context via `context.user` (FID, displayName, etc.)
   - Redirects to `/success` after form submission

4. **Authentication** (app/api/auth/route.ts):
   - Verifies JWT token from `Authorization` header
   - Uses `@farcaster/quick-auth` to validate user identity
   - Returns user FID (Farcaster ID) and token metadata
   - Domain verification logic handles localhost, Vercel previews, and production

5. **Success Page** (app/success/page.tsx):
   - Uses `useComposeCast()` hook to enable social sharing
   - Allows users to create a Farcaster cast about joining the waitlist

### Key Dependencies

- **@coinbase/onchainkit**: Provides MiniKit SDK, SafeArea, and blockchain utilities
- **@farcaster/miniapp-sdk**: Core Farcaster MiniApp functionality
- **@farcaster/quick-auth**: JWT-based user authentication
- **wagmi/viem**: Ethereum wallet and chain interaction (Base chain)

## Deployment Workflow

1. Deploy to Vercel: `vercel --prod`
2. Update `NEXT_PUBLIC_URL` with production URL
3. Upload environment variables: `vercel env add <KEY> production`
4. Generate account association at https://farcaster.xyz/~/developers/mini-apps/manifest
5. Update `minikit.config.ts` with account association credentials
6. Redeploy: `vercel --prod`
7. Preview at https://base.dev/preview
8. Publish by creating a post in Base app with your app URL

## Important Notes

- The manifest endpoint is served at `/.well-known/farcaster.json` (required by Farcaster spec)
- User authentication happens automatically via MiniKit when the app loads in Farcaster/Base app
- The `context.user` object provides user data without needing QuickAuth if identity verification isn't required
- Webpack config externalizes `pino-pretty`, `lokijs`, and `encoding` to avoid bundling issues
- All client-side code using MiniKit hooks must use `"use client"` directive
