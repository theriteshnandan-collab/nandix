# 🌌 NANDIX — The Sovereign Deployment

**$0 Infrastructure. Total Independence. Unkillable by Design.**

NANDIX is a fully decentralized web application powered by the **AETHER Mesh** — a peer-to-peer runtime that replaces AWS, Vercel, and every cloud provider with your users' own devices.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
```

Static output is generated in `out/`. Deploy anywhere — or nowhere. The mesh handles the rest.

---

## Architecture

| Layer | Role | Technology |
|:---|:---|:---|
| **Transport** | Peer Discovery & Data Relay | WebRTC (PeerJS) |
| **Persistence** | Local-First Storage | IndexedDB |
| **Security** | Identity & Encryption | ECDSA + AES-GCM + Shamir SSS |
| **Economy** | Incentive Layer | Aether Credits (AEX) + Multi-Witnessing |
| **AI** | Edge Inference | Transformers.js (WASM) |
| **Distribution** | Self-Replication | Sovereign Seed Protocol + Service Worker |

## The Sovereign Seed

NANDIX doesn't need a URL. Click **"Manifest Sovereign Seed"** in the HUD to export a single `seed.html` file. Share it. Anyone who opens it joins the mesh and becomes a host. No servers required.

## Tech Stack

- **Next.js 16** (App Router, Static Export)
- **TypeScript 5** (Strict, Zero `any`)
- **Tailwind CSS 4**
- **Framer Motion** (Micro-interactions)
- **PeerJS** (WebRTC Mesh)

---

*Built with sovereignty. Powered by the mesh.*
