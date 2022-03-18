import { usePeerConnection } from "co-share-peer/react"
import { useStoreSubscription } from "co-share/react"
import { Suspense, useMemo } from "react"
import { CounterStore } from "../src/counter-store"
import { Observable, Subject } from "rxjs"
import create from "zustand"
import { RootStore } from "co-share"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import MD from "../content/counter.md"
import { ConnectOptions } from "co-share-peer"

export default function Index() {
    return (
        <div className="d-flex flex-column fullscreen">
            <Header selectedIndex={0} />
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

const optionsC1: ConnectOptions = {
    initiator: true,
    observeStreams: false,
}
const optionsC2: ConnectOptions = {
    observeStreams: false,
}

function Environment() {
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

const masterOptions: ConnectOptions = {
    initiator: true,
    observeStreams: false,
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
    options: ConnectOptions
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

const slaveOptions: ConnectOptions = {
    observeStreams: false
}

function SlaveCounterExamplePage({
    receiveSignal,
    sendSignal,
    rootStore,
}: {
    rootStore: RootStore
    options: ConnectOptions
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
