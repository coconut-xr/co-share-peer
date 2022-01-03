import { useIncommingPeerStreams, useOutgoingPeerStream, usePeerConnection } from "co-share-peer/react"
import { useStoreSubscription } from "co-share/react"
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react"
import { CounterStore } from "../src/counter-store"
import { Observable, Subject } from "rxjs"
import create from "zustand"
import { Options } from "simple-peer"
import { RootStore, Store } from "co-share"
import { MediaDevicesControl } from "../src/media-devices"
import { StreamType, useMediaDevices, useSelectDefaultMediaDevice, useStreamType } from "co-media"
import { Error } from "@material-ui/icons"

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

const isServer = typeof window === "undefined"

export default function Index() {
    const [c1Root, receiveFromC1, sendToC1, c2Root, receiveFromC2, sendToC2] = useMemo(() => {
        const toC1 = new Subject<any>()
        const toC2 = new Subject<any>()
        return [
            new RootStore(new Map()),
            () => toC2,
            (val: any) => toC1.next(val),
            new RootStore(new Map()),
            () => toC1,
            (val: any) => toC2.next(val),
        ]
    }, [])
    return (
        <div className="d-flex flex-row main">
            {!isServer && (
                <>
                    <Suspense fallback={"Loading ..."}>
                        <MasterCounterExamplePage
                            rootStore={c1Root}
                            options={optionsC1}
                            receiveSignal={receiveFromC2}
                            sendSignal={sendToC2}
                        />
                    </Suspense>
                    <div className="border-end border-dark h-100" />
                    <Suspense fallback={"Loading ..."}>
                        <SlaveCounterExamplePage
                            rootStore={c2Root}
                            options={optionsC2}
                            receiveSignal={receiveFromC1}
                            sendSignal={sendToC1}
                        />
                    </Suspense>
                </>
            )}
        </div>
    )
}

const masterOptions: Options = {
    initiator: true,
}

function MasterCounterExamplePage({
    receiveSignal,
    sendSignal,
    rootStore,
}: {
    rootStore: RootStore
    options: Options
    receiveSignal: () => Observable<any>
    sendSignal: (data: any) => void
}) {
    usePeerConnection(masterOptions, receiveSignal, sendSignal, undefined, rootStore)

    return <CounterExamplePage store={rootStore} />
}

const slaveOptions: Options = {}

function SlaveCounterExamplePage({
    receiveSignal,
    sendSignal,
    rootStore,
}: {
    rootStore: RootStore
    options: Options
    receiveSignal: () => Observable<any>
    sendSignal: (data: any) => void
}) {
    usePeerConnection(slaveOptions, receiveSignal, sendSignal, undefined, rootStore)

    return <CounterExamplePage store={rootStore} />
}

function CounterExamplePage({ store }: { store: Store }) {
    const incommingStreams = useIncommingPeerStreams(store.mainLink.connection.userData.peer)

    const [outgroundAudioStream, setOutgroundAudioStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundVideoStream, setOutgroundVideoStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundScreenStream, setOutgroundScreenStream] = useState<MediaStream | undefined>(undefined)

    const outgoingStreams = useMemo(
        () => [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream].filter(filterNull),
        [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream]
    )

    useOutgoingPeerStream(store.mainLink.connection.userData.peer, outgoingStreams)

    const devices = useMediaDevices()

    const audioInput = useSelectDefaultMediaDevice("audioinput", devices)
    const videoInput = useSelectDefaultMediaDevice("videoinput", devices)
    const screenCapture = useSelectDefaultMediaDevice("screencapture", devices)

    return (
        <div className="flex-grow-1 d-flex flex-column">
            <Suspense fallback={<span>Loading ...</span>}>
                <div className="d-flex flex-column flex-grow-1 justify-content-center">
                    {incommingStreams.map((stream) => (
                        <Stream key={stream.id} stream={stream} />
                    ))}
                </div>
                <div className="d-flex flex-row align-items-center justify-content-center">
                    <MediaDevicesControl
                        audioInput={audioInput}
                        videoInput={videoInput}
                        screenCapture={screenCapture}
                        setAudioStream={setOutgroundAudioStream}
                        setVideoStream={setOutgroundVideoStream}
                        setScreenStream={setOutgroundScreenStream}
                    />
                </div>
            </Suspense>
        </div>
    )
}

export function Stream({ stream }: { stream: MediaStream }): JSX.Element {
    const type = useStreamType(stream)
    const ref = useRef<HTMLVideoElement | null>(null)
    useLayoutEffect(() => {
        if (ref.current != null) {
            ref.current.srcObject = stream
            ref.current.play()
        }
    }, [stream])
    switch (type) {
        case StreamType.AUDIO:
            return <audio ref={ref} />
        case StreamType.VIDEO:
            return <video playsInline className="flex-grow-1 flex-basis-0" ref={ref} />
        default:
            ref.current = null
            return <Error />
    }
}

function filterNull<T>(val: T | undefined): val is T {
    return val != null
}