import { Connection, RootStore, rootStore } from "co-share"
import { useEffect } from "react"
import SimplePeer, { Options } from "simple-peer"
import { Observable } from "rxjs"
import { suspend } from "suspend-react"
import { connectPeer } from ".."

const usePeerConnectionPersistSymbol = Symbol()

export function usePeerConnection(
    options: Options,
    receiveSignal: () => Observable<any>,
    onSingal: (data: any) => void,
    onCleanup: () => void,
    createUserData?: (instance: SimplePeer.Instance) => any,
    providedRootStore: RootStore = rootStore
): Connection {
    const [connection, link] = suspend(
        () => connectPeer(options, receiveSignal, onSingal, onCleanup, createUserData, providedRootStore),
        [options, receiveSignal, onSingal, createUserData, providedRootStore, usePeerConnectionPersistSymbol]
    )
    useEffect(() => () => link.close(), [link])

    return connection
}
