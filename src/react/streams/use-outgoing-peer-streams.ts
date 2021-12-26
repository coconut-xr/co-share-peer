import { useEffect, useRef } from "react"
import { Instance } from "simple-peer"

export function useOutgoingPeerStream(peer: Instance, intendedOutgoingStreams: Array<MediaStream>): void {
    const currentOutgoingStreamsRef = useRef<Array<MediaStream>>([])

    useEffect(() => {
        return () => {
            //remove all streams from old peer
            if (!peer.destroyed) {
                for (const currentOutgoingStream of currentOutgoingStreamsRef.current) {
                    peer.removeStream(currentOutgoingStream)
                }
            }
            currentOutgoingStreamsRef.current = []
        }
    }, [peer])

    useEffect(() => {
        for (const intendedOutgoingStream of intendedOutgoingStreams) {
            if (!currentOutgoingStreamsRef.current.includes(intendedOutgoingStream)) {
                peer.addStream(intendedOutgoingStream)
            }
        }
        for (const currentOutgoingStream of currentOutgoingStreamsRef.current) {
            if (!intendedOutgoingStreams.includes(currentOutgoingStream)) {
                peer.removeStream(currentOutgoingStream)
            }
        }
        currentOutgoingStreamsRef.current = [...intendedOutgoingStreams]
    }, [intendedOutgoingStreams, peer])
}
