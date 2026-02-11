"use client";

import { motion } from "framer-motion";
import { Cpu, Network, ShieldCheck, Share2, Activity, Zap, DollarSign, Lock } from "lucide-react";
import MeshStats from "@/components/sentinel/MeshStats";
import NodeMap from "@/components/sentinel/NodeMap";
import AetherTerminal from "@/components/sentinel/AetherTerminal";
import DistributedCounter from "@/components/sentinel/DistributedCounter";
import SecurityDashboard from "@/components/sentinel/SecurityDashboard";
import CortexVisualizer from "@/components/sentinel/CortexVisualizer";
import MeshHealth from "@/components/sentinel/MeshHealth";
import NoirCompose from "@/components/noir/NoirCompose";
import NoirFeed from "@/components/noir/NoirFeed";
import SovereignNotes from "@/components/noir/SovereignNotes";
import ChaosDashboard from "@/components/sentinel/ChaosDashboard";
import { useMesh } from "@/lib/aether/sdk/hooks/useMesh";

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-8 lg:p-12 flex flex-col items-center justify-start gap-12 overflow-x-hidden bg-void relative">
      {/* Background radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#002222_0%,transparent_50%)] pointer-events-none opacity-20" />

      {/* Sovereignty Header */}
      <Header />

      {/* Feature Cards Grid */}
      <div className="w-full max-w-7xl">
        <FeatureCards />
      </div>

      {/* Main Dashboard Layout */}
      <div className="w-full max-w-[1700px] grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 relative z-10">

        {/* Left Column: Sentinel HUD (Stats & Security) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ChaosDashboard />
          <MeshStats />
          <SecurityDashboard />
          <MeshHealth />
          <AetherTerminal />
        </div>

        {/* Center Column: AETHER NOIR (The Social Mesh) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <NoirCompose />
          <div className="h-[650px] overflow-y-auto no-scrollbar scroll-smooth pr-2">
            <NoirFeed />
          </div>
        </div>

        {/* Right Column: App B & Topology */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <SovereignNotes />
          <div className="h-[250px] glass-sentinel rounded-lg overflow-hidden relative">
            <NodeMap />
          </div>
          <CortexVisualizer />
          <DistributedCounter />
        </div>

      </div>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5 relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-cyan-glow rounded-full animate-pulse shadow-[0_0_10px_#00FFFF]" />
          <span className="text-[10px] tracking-[0.5em] font-mono text-cyan-glow uppercase">Engine: AETHER ALPHA</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-2">
          NANDIX
        </h1>
        <p className="text-silver/60 max-w-md font-mono text-xs leading-relaxed tracking-wide">
          THE SOVEREIGN DEPLOYMENT. A REVOLUTIONARY P2P CLOUD BUILT ON THE AETHER MESH. $0 INFRASTRUCTURE. TOTAL INDEPENDENCE.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-4"
      >
        <button
          onClick={() => window.location.href = '/dashboard/media'}
          className="px-6 py-2 rounded-sm border border-cyan-glow/30 text-cyan-glow font-mono text-[10px] uppercase tracking-widest hover:bg-cyan-glow/10 transition-all duration-300"
        >
          Media Hub
        </button>
        <button className="px-6 py-2 rounded-sm bg-cyan-glow text-void font-bold font-mono text-[10px] uppercase tracking-widest hover:scale-105 transition-all duration-300">
          Join Mesh
        </button>
      </motion.div>
    </div>
  );
}

function FeatureCards() {
  const { peers, status } = useMesh();

  const cards = [
    { label: "Active Nodes", value: `${peers.length + 1} ONLINE`, icon: Network, color: "text-cyan-glow" },
    { label: "Network Health", value: "99.9%", icon: Activity, color: "text-emerald-500" },
    { label: "Total Cost Saved", value: "$0.12", icon: DollarSign, color: "text-amber-500" },
    { label: "Mesh Security", value: "ZK-E2EE", icon: Lock, color: "text-cyan-glow" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-sentinel p-6 rounded-lg flex flex-col gap-2 group hover:border-cyan-glow/30 transition-all duration-500"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-silver/40 uppercase tracking-widest">{card.label}</span>
            <card.icon className={`w-4 h-4 ${card.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
          </div>
          <div className="text-2xl font-bold text-white tracking-tighter">
            {card.value}
          </div>
          {card.label === "Mesh Security" && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-cyan-glow rounded-full" />
              <span className="text-[8px] font-mono text-cyan-glow uppercase tracking-tighter">Active</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <div className="w-full max-w-7xl pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 opacity-40">
      <span className="font-mono text-[8px] tracking-[1em] text-silver uppercase">
        NANDIX // POWERED BY AETHER SOVEREIGN ENGINE
      </span>
      <div className="flex gap-6">
        <span className="font-mono text-[8px] text-silver/60 uppercase cursor-pointer hover:text-cyan-glow transition-colors">Manifesto</span>
        <span className="font-mono text-[8px] text-silver/60 uppercase cursor-pointer hover:text-cyan-glow transition-colors">Documentation</span>
        <span className="font-mono text-[8px] text-silver/60 uppercase cursor-pointer hover:text-cyan-glow transition-colors">Status: Stable</span>
      </div>
    </div>
  );
}
