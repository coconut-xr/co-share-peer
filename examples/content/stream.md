# Stream Example

We establish a WebRTC connection using [simple-peer](https://github.com/feross/simple-peer) and use the media channels to stream the microphone/camera/screen.
This user-media is captured with the help of the [co-media](https://github.com/cocoss-org/co-media) library.

*If you use chrome, you can verify the webrtc connection under chrome://webrtc-internals/.*

# Source Code

[`stream.tsx`](https://github.com/cocoss-org/co-share-peer/blob/master/examples/pages/stream.tsx)

```typescript

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

export function Index() {
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
```