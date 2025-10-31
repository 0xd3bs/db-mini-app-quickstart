# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Farcaster Mini App implementing the Analytic Hierarchy Process (AHP) using Saaty's Scale for multi-criteria decision making. The app allows users to compare options pairwise, calculates weights using the geometric mean method, validates consistency using the Consistency Ratio (CR), and enables social sharing on Farcaster and The Base App.

**Key features:**
- Mobile-first design with touch gestures for navigation
- Pairwise comparisons using Saaty's 1-9 scale (including reciprocals like 1/2, 1/3, etc.)
- Weight calculation via geometric mean (valid AHP method)
- Consistency checking (λmax, CI, CR with Saaty's Random Index)
- Share functionality via Farcaster (invitation posts & results with data)
- Share/import functionality via URL parameters and JSON export
- Theme toggle (light/dark mode)
- Conflict detection suggesting which pairs to review when CR ≥ 0.1
- NO localStorage persistence - fresh state on each reload
- Built with Next.js 15, OnchainKit, and Farcaster SDK

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

**Requirements:** Node.js >= 18.18.0, pnpm as package manager

## Architecture

### Core Configuration

- **minikit.config.ts**: Central configuration for the MiniApp manifest. Defines app metadata (Saaty AHP), branding (icons, screenshots, splash images), URLs (home, webhook), and Farcaster account association credentials. This file feeds into `app/.well-known/farcaster.json/route.ts` to generate the required manifest endpoint.

- **Environment Variables** (see .example.env):
  - `NEXT_PUBLIC_URL`: Your deployed app URL (required for production and Farcaster sharing)
  - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Coinbase Developer Platform API key
  - `NEXT_FARCASTER_HEADER/PAYLOAD/SIGNATURE`: Account association credentials from Farcaster manifest tool

### Pages (Next.js App Router)

- `app/page.tsx` - Main AHP interface with objective/options input, pairwise comparisons, results display, Farcaster sharing buttons, and bottom sheets for URL/JSON sharing and reviewing conflicts
- `app/verify/page.tsx` - Verification page that runs internal tests validating AHP implementation correctness
- `app/layout.tsx` - Root layout with OnchainKitProvider, SafeArea component, and frame metadata

### Core Libraries (`lib/`)

**`lib/ahp.ts`** - Core AHP calculations:
- `createReciprocalMatrix(n)` - Creates n×n identity matrix
- `computeWeightsGeometricMean(matrix)` - Calculates normalized weights from comparison matrix using geometric mean (nth root of row products)
- `computeLambdaMax(matrix, weights)` - Calculates principal eigenvalue
- `computeConsistencyRatio(matrix, weights)` - Returns `{lambdaMax, CI, CR}` where CI = (λmax - n)/(n-1) and CR = CI/RI
- `RI_VALUES` - Saaty's Random Index for n=1..10
- `multiplyMatrixVector(matrix, vector)` - Matrix-vector multiplication for eigenvalue calculation

**`lib/scale.ts`** - Saaty scale conversions:
- `toSaatyFromStep(step)` - Converts step (-8 to +8) to Saaty value (1/9 to 9)
- `toStepFromSaaty(value)` - Inverse conversion
- `degreeLabelFromStep(step)` - Returns Spanish labels like "ligeramente", "moderadamente", "fuertemente", "extremadamente"

**`lib/state.ts`** - State persistence (NO localStorage):
- `encodeStateToUrlParam(state)` - Base64-encodes state for URL sharing (URL-safe variant)
- `decodeStateFromUrlParam(param)` - Decodes URL parameter to restore state
- `AhpState` type: `{goal, options, values, pairIndex}`

### Components (`components/`)

**`PairControl.tsx`** - Interactive comparison control with:
- Range slider (-8 to +8 steps)
- Increment/decrement buttons
- Quick preset chips (Igual, Ligeramente, Moderadamente, Fuertemente, Extremadamente)
- Invert button to flip preference direction
- Dynamic label showing current preference and Saaty value

**`BottomSheet.tsx`** - Modal bottom sheet for mobile UX (URL/JSON share, conflict review)

**`ThemeToggle.tsx`** - Theme switcher component (persists to localStorage)

### Styling

- `app/globals.css` - All styles use CSS variables from `styles/tokens.css`
- Mobile-first responsive design with breakpoints for smaller screens
- CSS variables for spacing, colors, and layout
- Sticky footer with navigation controls and progress bar
- Bottom sheets for secondary actions

### State Management

- Main page uses React hooks (useState, useMemo, useEffect)
- NO localStorage persistence for AHP state (as per user requirement)
- URL parameter `?s=...` is the ONLY way to restore state (for sharing)
- MiniKit initialized with `useMiniKit()` hook for Farcaster integration
- Comparisons stored in `values` object with keys `"i-j"` mapping to Saaty values

## AHP Implementation Details

**Matrix Construction:**
- Reciprocal property enforced: `a_ij = 1/a_ji` and `a_ii = 1`
- User only compares upper triangle pairs; lower triangle computed automatically

**Weight Calculation:**
- Geometric mean method: for each row i, compute `w_i = (∏_j a_ij)^(1/n)`
- Normalize: `w_i / Σw_i`
- This is a valid approximation of the principal eigenvector

**Consistency Checking:**
- λmax (principal eigenvalue) calculated via `Σ(Aw)_i/w_i/n`
- CI (Consistency Index) = `(λmax - n)/(n-1)`
- CR (Consistency Ratio) = `CI/RI` where RI is Saaty's Random Index
- CR < 0.1 (10%) considered acceptable
- When CR ≥ 0.1, app suggests pairs to review based on deviation from expected ratio

**Conflict Detection:**
- Compares actual comparison `a_ij` with expected `w_i/w_j`
- Deviation measured as `|log(a_ij) - log(w_i/w_j)|`
- Top conflicts shown in "Pares a revisar" list with "Go" button to jump to that pair

## Farcaster Integration

### Sharing Functionality

The app provides TWO sharing options via `useComposeCast()` hook from OnchainKit:

1. **Share Invitation** - Generic promotional post:
   ```
   "I just used Saaty AHP to make a better decision! Try it yourself: "
   + [app URL]
   ```

2. **Share Results** - Detailed analysis with data:
   ```
   "My AHP Analysis:
   Goal: [user's goal]
   1. [Option A] (45.6%)
   2. [Option B] (34.2%)
   3. [Option C] (20.2%)
   CR: 5.3% ✓ Consistent

   Try Saaty AHP: "
   + [app URL with encoded state]
   ```

Both buttons appear in the Results section after weights are calculated.

### MiniKit Integration

- **Initialization**: `useMiniKit()` hook called in `useEffect` to set frame ready
- **Context Access**: User data available via `context.user` (FID, displayName)
- **Cast Composition**: `composeCastAsync()` opens native Farcaster compose dialog
- **Embeds**: All shares include URL embeds for easy access

## Path Aliases

- `@/*` resolves to project root (configured in tsconfig.json)
- Example: `@/lib/ahp` → `lib/ahp.ts`

## UI/UX Patterns

**Mobile-first:**
- Touch gestures: swipe left/right between pairs (50px threshold)
- Fixed bottom footer with navigation controls and progress bar
- Bottom sheets for secondary actions (share, review conflicts)
- Compact layout on smaller screens

**Accessibility:**
- ARIA labels on controls
- Semantic HTML
- Keyboard navigable

**State sharing:**
- Users can share via URL parameter (base64-encoded state)
- Export/import via JSON in share bottom sheet
- NO automatic localStorage saving (fresh state on reload)

## Testing

The `/verify` page runs automated tests validating:
1. Scale bijection (step ↔ Saaty round-trip)
2. Matrix reciprocity properties
3. Consistent triad weight calculation and CR≈0
4. Permutation invariance
5. 4-option consistency
6. Eigenvalue property (λmax = n for consistent matrices)

All tests should pass ("PASS" badges). If any fail, the AHP implementation has a bug.

## Language

- UI is in Spanish ("Objetivo", "Opciones", "Comparaciones por pares", etc.)
- Code comments and variable names are in English
- When adding features, maintain Spanish for user-facing text

## Deployment Workflow

1. Deploy to Vercel: `vercel --prod`
2. Update `NEXT_PUBLIC_URL` with production URL
3. Upload environment variables: `vercel env add NEXT_PUBLIC_ONCHAINKIT_API_KEY production`
4. Generate account association at https://farcaster.xyz/~/developers/mini-apps/manifest
5. Add Farcaster credentials:
   - `vercel env add NEXT_FARCASTER_HEADER production`
   - `vercel env add NEXT_FARCASTER_PAYLOAD production`
   - `vercel env add NEXT_FARCASTER_SIGNATURE production`
6. Redeploy: `vercel --prod`
7. Test at https://base.dev/preview
8. Publish by creating a post in Base app with your URL

## Important Notes

- No external dependencies for AHP calculations (pure TypeScript)
- No build-time tests configured; verification is runtime via `/verify` page
- App works offline after first load (no external API calls for AHP logic)
- No authentication or backend required; entirely client-side
- The manifest endpoint is served at `/.well-known/farcaster.json` (required by Farcaster spec)
- MiniKit provides automatic user context when app loads in Farcaster/Base app
- Webpack config externalizes `pino-pretty`, `lokijs`, and `encoding` to avoid bundling issues
- All client-side code using MiniKit hooks must use `"use client"` directive
- **Always use pnpm as package manager** (not npm)
- **Always create commit messages in English** when using git
- State persistence removed - app starts fresh on each reload, shareable only via URL
