import { useCallback, useEffect, useMemo, useState } from "react"
import { fromEvent } from "rxjs"
import { mergeMap, take, tap } from "rxjs/operators"
import { Instance } from "simple-peer"

export function useIncommingPeerStreamsChange(peer: Instance, onChange: (streams: Array<MediaStream>) => void): void {
    const streamsRef = useMemo<{ ref: Array<MediaStream> }>(() => ({ ref: [] }), [peer])
    useEffect(() => {
        const updateIncommingStreams = (streams: Array<MediaStream>) => {
            streamsRef.ref = streams
            onChange(streamsRef.ref)
        }

        const subscription = fromEvent<MediaStream>(peer, "stream", (s) => s)
            .pipe(
                mergeMap((stream) => {
                    updateIncommingStreams([...streamsRef.ref, stream])
                    return fromEvent(stream, "inactive").pipe(
                        take(1),
                        tap(() => updateIncommingStreams(streamsRef.ref.filter((s) => s != stream)))
                    )
                })
            )
            .subscribe()
        return () => subscription.unsubscribe()
    }, [peer, onChange, streamsRef])
}

export function useIncommingPeerStreams(peer: Instance): Array<MediaStream> {
    const [streams, setStreams] = useState<Array<MediaStream>>([])
    useIncommingPeerStreamsChange(peer, setStreams)
    return streams
}
