import { useEffect, useMemo, useState } from "react"
import { fromEvent, combineLatest } from "rxjs"
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
                    const tracks = stream.getTracks()
                    return combineLatest(tracks.map((track) => fromEvent(track, "mute"))).pipe(
                        take(1),
                        tap(() => {
                            tracks.forEach((track) => track.stop())
                            updateIncommingStreams(streamsRef.ref.filter((s) => s != stream))
                        })
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
