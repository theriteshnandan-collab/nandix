"use client";

import { useEffect } from "react";
import { useAether } from "@/lib/aether/sdk/context/AetherContext";

export function PWARegistry() {
    const { mesh } = useAether();

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("[AETHER] Sovereign Service Worker Registered:", reg.scope))
                .catch((err) => console.error("[AETHER] SW Registration Failed:", err));

            // Handle Asset Requests from SW
            navigator.serviceWorker.addEventListener('message', async (event) => {
                if (event.data && event.data.type === 'MESH_ASSET_REQUEST') {
                    const { path } = event.data;
                    console.log(`[AETHER] Mesh-Bootstrapping: Peer requesting asset ${path}`);

                    const assetBuffer = await mesh.requestAsset(path);
                    if (assetBuffer && event.ports[0]) {
                        event.ports[0].postMessage({ assetBuffer });
                    } else if (event.ports[0]) {
                        event.ports[0].postMessage({ error: 'ASSET_NOT_FOUND_IN_MESH' });
                    }
                }
            });
        }
    }, [mesh]);

    return null;
}
