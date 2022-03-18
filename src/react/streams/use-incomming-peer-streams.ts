import { useEffect, useMemo, useState } from "react"
import { StreamingInstance } from "../../observe-streams"

export function useIncommingPeerStreamsChange(
    peer: StreamingInstance,
    onChange: (streams: Array<MediaStream>) => void
): void {
    const streamsRef = useMemo<{ ref: Array<MediaStream> }>(() => ({ ref: Array.from(peer.streams) }), [peer])
    useEffect(() => {
        const subscription = peer.streamsObservable.subscribe({
            next: (streams: Array<MediaStream>) => {
                streamsRef.ref = streams
                onChange(streamsRef.ref)
            },
        })
        return () => subscription.unsubscribe()
    }, [peer, onChange, streamsRef])
}

export function useIncommingPeerStreams(peer: StreamingInstance): Array<MediaStream> {
    const [streams, setStreams] = useState<Array<MediaStream>>([])
    useIncommingPeerStreamsChange(peer, setStreams)
    return streams
}
