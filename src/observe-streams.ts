import { Instance } from "simple-peer"
import { Observable, fromEvent, merge, connectable } from "rxjs"
import { mergeMap, take, endWith, takeUntil, startWith, map, tap } from "rxjs/operators"

export type StreamingInstance = Instance &
    Readonly<{
        streamsObservable: Observable<Array<MediaStream>>
        streams: Set<MediaStream>
    }>

export function isStreamingInstance(instance: any): instance is StreamingInstance {
    return "streamsObservable" in instance
}

export function observeStreams(instance: Instance): StreamingInstance {
    const streams = new Set<MediaStream>()
    const streamsObservable = connectable<Array<MediaStream>>(
        fromEvent<MediaStream>(instance, "stream", (s) => s).pipe(
            mergeMap((stream) => {
                streams.add(stream)
                const tracks = stream.getTracks()
                return merge(...tracks.map((track) => fromEvent(track, "mute"))).pipe(
                    take(1),
                    map(() => {
                        tracks.forEach((track) => track.stop())
                        streams.delete(stream)
                        return streams
                    }),
                    startWith(streams)
                )
            }),
            takeUntil(fromEvent(instance, "close")),
            map((set) => Array.from(set)),
            endWith([])
        )
    )
    streamsObservable.connect()
    return Object.assign(instance, {
        streams,
        streamsObservable,
    })
}
