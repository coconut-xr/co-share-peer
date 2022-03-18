import { useEffect, useState } from "react"
import { StreamingInstance } from "../../observe-streams"

export function useIncommingPeerStreamsChange(
    peer: StreamingInstance,
    onChange: (streams: Array<MediaStream>) => void
): void {
    useEffect(() => {
        const subscription = peer.streamsObservable.subscribe({
            next: (streams: Array<MediaStream>) => onChange(streams),
        })
        return () => subscription.unsubscribe()
    }, [peer, onChange])
}

export function useIncommingPeerStreams(peer: StreamingInstance): Array<MediaStream> {
    const [streams, setStreams] = useState<Array<MediaStream>>(Array.from(peer.streams))
    useIncommingPeerStreamsChange(peer, setStreams)
    return streams
}
