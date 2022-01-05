# Counter Example

We establish a WebRTC connection using [simple-peer](https://github.com/feross/simple-peer) and use the data channel to synchronize the shared counter using [co-share](https://github.com/cocoss-org/co-share).
This example strongly relates to the [co-share tutorial](https://cocoss-org.github.io/co-share/counter/).

*If you use chrome, you can verify the webrtc connection under chrome://webrtc-internals/.*

# Source Code

[`counter.tsx`](https://github.com/cocoss-org/co-share-peer/blob/master/examples/pages/counter.tsx)

```typescript

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

function Index() {
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
    const store = useMemo(() => {
        if (!rootStore.storeMap.has("counter")) {
            const store = new CounterStore(0)
            rootStore.addStore(store, "counter")
            return store
        } else {
            return rootStore.storeMap.get("counter") as CounterStore
        }
    }, [rootStore])

    usePeerConnection(masterOptions, receiveSignal, sendSignal, empty, undefined, rootStore)

    return <CounterExamplePage store={store} />
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
    usePeerConnection(slaveOptions, receiveSignal, sendSignal, empty, undefined, rootStore)
    const store = useStoreSubscription("counter", 1000, (value: number) => new CounterStore(value), [], rootStore)

    return <CounterExamplePage store={store} />
}

function CounterExamplePage({ store }: { store: CounterStore }) {
    const useStoreState = useMemo(
        () =>
            create<{
                counter: number
            }>(store.state),
        [store]
    )

    const { counter } = useStoreState()

    return (
        <div className="p-3 d-flex flex-row align-items-center justify-content-center flex-grow-1">
            <h1 className="mx-3">{counter}</h1>
            <button className="m-1 btn btn-outline-primary" onClick={() => store.increase()}>
                +
            </button>
        </div>
    )
}
```

[`counter-store.ts`](https://github.com/cocoss-org/co-share-peer/blob/master/examples/src/counter-store.ts)

```typescript
export class CounterStore extends Store {
    public subscriber: Subscriber<CounterStore, [number]> = Subscriber.create(
        CounterStore,
        (connection, accept, deny) => accept(this.state.getState().counter)
    )

    public state: StoreApi<{ counter: number }>

    public onUnlink(link: StoreLink): void {}

    public onLink(link: StoreLink): void {}

    constructor(value: number) {
        super()
        this.state = create(() => ({ counter: value }))
    }

    increase = Action.create(this, "incr", (origin) => {
        this.increase.publishTo(origin == null ? { to: "all" } : { to: "all-except-one", except: origin })
        this.state.setState({
            counter: this.state.getState().counter + 1,
        })
    })
}
```