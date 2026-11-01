# V2 progress — 2026-11-01

Local contract prototype only; not deployed, not connected to the UI, and not pushed.

`PortalProofOrderV2` is creator-authored evidence, compatible with wallet-free request intake. Only the recorded creator can deliver and acknowledge a payment reference. A unique creator nonce separates identical repeat commissions. State transitions and duplicate payment references are enforced. No client signature or receipt verification is claimed by the contract. It holds no funds.

V1 source, ABI, artifact and address remain unchanged. Existing browser data is not migrated. The current wallet-free UI still blocks V1 issuance until V2 integration.

The local EVM tests compile V2 from source using pinned solc and execute it with Ganache; they cover invalid inputs, creator-scoped nonce replay, separate identical orders, unauthorized calls, missing orders, out-of-order updates, terminal immutability, payment reuse and rejection of funds.

Remaining design risk: a dishonest creator can acknowledge a fake or unrelated payment hash, including one that another creator later wants to use. Global hash uniqueness is not payment authenticity. Independent RPC verification, report ownership/assignment and handling of disputed references remain mandatory before the certificate can claim a matching payment. Customer agreement is service-level consent, not a client wallet signature.

Next: define the payment attribution policy; implement shared receipt/consent storage with creator authentication and version checks; integrate V2 behind an explicit version boundary; independently verify records; obtain approval before any live deployment.

Dependency caveat: pinned Ganache 7.9.2 is a development-only local EVM dependency. Installation reported 34 audit findings including critical/high bundled dependencies; `npm audit --omit=dev` also reports bundled Ganache paths, so that command is not evidence of a clean release. No automatic force-fix was applied. Audit reachability and replace or isolate the test runtime before deployment infrastructure uses this dependency tree. Ganache is not imported by application code or its production bundle. On this Mac it falls back from the optional µWS native binary to the JavaScript implementation; the local tests still pass.
