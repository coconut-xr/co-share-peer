import { Connection, RootStore, rootStore } from "co-share"
import { useEffect } from "react"
import { Instance } from "simple-peer"
import { Observable } from "rxjs"
import { suspend } from "suspend-react"
import { connectPeer, ConnectOptions } from ".."

const usePeerConnectionPersistSymbol = Symbol()

export function usePeerConnection(
    options: ConnectOptions,
    receiveSignal: () => Observable<any>,
    onSingal: (data: any) => void,
    onCleanup: () => void,
    createUserData?: (instance: Instance) => any,
    providedRootStore: RootStore = rootStore
): Connection {
    const [connection, link] = suspend(
        () => connectPeer(options, receiveSignal, onSingal, onCleanup, createUserData, providedRootStore),
        [options, receiveSignal, onSingal, createUserData, providedRootStore, usePeerConnectionPersistSymbol]
    )
    useEffect(() => () => link.close(), [link])
    return connection
}
