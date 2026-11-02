# Wallet sign-in — additive rollout (2026-11-02)

- Shared intake only; legacy wallet/contract code and database schema unchanged.
- Uses installed Supabase SDK `signInWithWeb3`, EIP-4361 verification by Supabase Auth, not address-only login. SDK reads selected EVM account/chain and requests `personal_sign`. No transaction or network switching is requested.
- Five-minute signature expiry, SDK message generation, current shared-page URI; never include private client query/hash in sign-in message.
- Email login retained. Web3 identity is a separate user; no destructive reset or automatic ownership transfer of existing jobs. Same owner RLS applies to either authentication method.
- Dashboard: Authentication → Sign In / Providers → Web3 Wallet → enable Ethereum. Keep Email enabled. Permit exact shared-page URLs in URL Configuration, including `https://nato-san.github.io/PortalProof/?view=shared` and local test URL. Verify actual URI matching with a live signature before release; do not weaken domain checks globally.
- Mobile requires an injected EVM provider (e.g. MetaMask in-app browser); standalone mobile Safari/Chrome WalletConnect is not implemented. Multiple injected wallets currently use `window.ethereum`.
- Tests cover wrapper arguments, missing provider, auth errors and incomplete sessions using a mocked SDK. Live Portaldot-wallet authentication, rejected/replayed signatures, logout/reload and two-account RLS tests remain required. No live wallet signature has been performed by the agent.
- Authenticated identity is the wallet used at login; changing the wallet extension's selected account does not change that identity. Log out and sign in again to switch identities. Receiving-wallet ownership enforcement is not added in this scoped change.
- Unpublished until separately verified/approved. Roll back frontend commit to remove the new button; email accounts/data are untouched.

Official reference: https://supabase.com/docs/guides/auth/auth-web3
