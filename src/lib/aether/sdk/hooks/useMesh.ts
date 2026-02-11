"use client";

import { useEffect, useState, useCallback } from "react";
import { useAether } from "../context/AetherContext";
import { MeshEvent } from "../../core/mesh-controller";

export function useMesh() {
    const {
        mesh, peerId, status, isEncrypted, meshKey, setMeshKey,
        isPioneer, setPioneerMode
    } = useAether();
    const [peers, setPeers] = useState<string[]>([]);

    // Internal listener for basic peer management
    useEffect(() => {
        const handler = (event: MeshEvent) => {
            if (event.type === "PEER_CONNECTED") {
                setPeers((prev) => Array.from(new Set([...prev, event.peerId!])));
            }
            if (event.type === "PEER_DISCONNECTED") {
                setPeers((prev) => prev.filter((id) => id !== event.peerId));
            }
        };

        mesh.onEvent(handler);
        return () => {
            // MeshController currently doesn't support unregistering specific handlers
        };
    }, [mesh]);

    const broadcast = useCallback(
        (type: string, payload: any) => {
            mesh.broadcast({ type, payload });
        },
        [mesh]
    );

    const connect = useCallback(
        (targetPeerId: string) => {
            mesh.connect(targetPeerId);
        },
        [mesh]
    );

    const onData = useCallback(
        (handler: (data: any, from: string) => void) => {
            const meshHandler = (event: MeshEvent) => {
                if (event.type === "DATA_RECEIVED") {
                    handler(event.data, event.peerId!);
                }
            };
            mesh.onEvent(meshHandler);
        },
        [mesh]
    );

    return {
        peerId,
        status,
        peers,
        isEncrypted,
        meshKey,
        setMeshKey,
        isPioneer,
        setPioneerMode,
        broadcast,
        connect,
        onData,
    };
}
