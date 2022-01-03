import { usePeerConnection } from "co-share-peer/react"
import { useStoreSubscription } from "co-share/react"
import { Suspense, useMemo } from "react"
import { CounterStore } from "../src/counter-store"
import { Observable, Subject } from "rxjs"
import create from "zustand"
import { Options } from "simple-peer"
import { RootStore } from "co-share"

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

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
    const store = useMemo(() => {
        if (!rootStore.storeMap.has("counter")) {
            const store = new CounterStore(0)
            rootStore.addStore(store, "counter")
            return store
        } else {
            return rootStore.storeMap.get("counter") as CounterStore
        }
    }, [rootStore])

    usePeerConnection(masterOptions, receiveSignal, sendSignal, undefined, rootStore)

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
    usePeerConnection(slaveOptions, receiveSignal, sendSignal, undefined, rootStore)
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
