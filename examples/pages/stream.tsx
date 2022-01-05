import { useIncommingPeerStreams, useOutgoingPeerStream, usePeerConnection } from "co-share-peer/react"
import { Suspense, useMemo, useState } from "react"
import { Observable, Subject } from "rxjs"
import { Options } from "simple-peer"
import { Connection, RootStore } from "co-share"
import { useMediaDevices, useSelectDefaultMediaDevice } from "co-media"
import { MediaDevicesControl, Stream } from "../src/media-devices"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import MD from "../content/stream.md"


export default function Index() {
    return (
        <div className="d-flex flex-column fullscreen">
            <Header selectedIndex={1} />
            <div className="d-flex flex-column justify-content-stretch container-lg">
                <div style={{ height: "calc(90vh - 176px)" }} className="d-flex flex-row-responsive border mt-3">
                    <Environment />
                </div>
                <div className="p-3 flex-basis-0 flex-grow-1">
                    <MD />
                </div>
            </div>
            <Footer />
        </div>
    )
}

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

export function Environment() {
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
        <>
            {global.window != null && (
                <>
                    <Suspense fallback={"Loading ..."}>
                        <MasterCounterExamplePage
                            rootStore={c1Root}
                            options={optionsC1}
                            receiveSignal={receiveFromC2}
                            sendSignal={sendToC2}
                        />
                    </Suspense>
                    <div className="border flex-basis-0 border-dark h-100" />
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
        </>
    )
}

const masterOptions: Options = {
    initiator: true,
}

function empty(): void {
    //empty
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
    const connection = usePeerConnection(masterOptions, receiveSignal, sendSignal, empty, undefined, rootStore)
    return <StreamPage unifier={0} connection={connection} />
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
    const connection = usePeerConnection(slaveOptions, receiveSignal, sendSignal, empty, undefined, rootStore)
    return <StreamPage unifier={1} connection={connection} />
}

function StreamPage({ unifier, connection }: { unifier: number; connection: Connection }) {
    const [outgroundAudioStream, setOutgroundAudioStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundVideoStream, setOutgroundVideoStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundScreenStream, setOutgroundScreenStream] = useState<MediaStream | undefined>(undefined)

    const outgoingStreams = useMemo(
        () => [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream].filter(filterNull),
        [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream]
    )

    const devices = useMediaDevices()

    const audioInput = useSelectDefaultMediaDevice("audioinput", devices)
    const videoInput = useSelectDefaultMediaDevice("videoinput", devices)
    const screenCapture = useSelectDefaultMediaDevice("screencapture", devices)

    const incommingStreams = useIncommingPeerStreams(connection.userData.peer)
    useOutgoingPeerStream(connection.userData.peer, outgoingStreams)

    return (
        <div className="d-flex flex-grow-1 flex-column overflow-hidden flex-basis-0">
            <div className="d-flex flex-grow-1 flex-column overflow-hidden justify-content-around overflow-hidden">
                {incommingStreams.map((stream) => (
                    <Stream key={stream.id} stream={stream} />
                ))}
            </div>

            <div className="d-flex flex-row align-items-center justify-content-center">
                <MediaDevicesControl
                    unifier={unifier}
                    audioInput={audioInput}
                    videoInput={videoInput}
                    screenCapture={screenCapture}
                    setAudioStream={setOutgroundAudioStream}
                    setVideoStream={setOutgroundVideoStream}
                    setScreenStream={setOutgroundScreenStream}
                />
            </div>
        </div>
    )
}

function filterNull<T>(val: T | undefined): val is T {
    return val != null
}
