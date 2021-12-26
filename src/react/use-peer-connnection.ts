import { Connection, RootStore, rootStore, RootStoreDefaultLinkId, StoreLink, StoreLinkId } from "co-share"
import { useEffect, useMemo } from "react"
import SimplePeer, { Instance, Options } from "simple-peer"
import { fromEvent } from "rxjs"
import { map } from "rxjs/operators"
import { encode, decode } from "messagepack"
import { Observable, Subscription } from "rxjs"
import { tap } from "rxjs/operators"
import { suspend } from "suspend-react"

export function usePeerConnection(
    options: Options,
    receiveSignal: () => Observable<any>,
    sendSignal: (data: any) => void,
    userData?: any,
    providedRootStore: RootStore = rootStore
): Connection {
    const [connection, link] = suspend(
        connect.bind(null, options, receiveSignal, sendSignal, userData, providedRootStore),
        [options, receiveSignal, sendSignal, userData, providedRootStore]
    )
    useEffect(() => () => link.close(), [link])

    return connection
}

function connect(
    options: Options,
    receiveSignal: () => Observable<any>,
    sendSignal: (data: any) => void,
    userData: any,
    rootStore: RootStore
): Promise<[Connection, StoreLink]> {
    return new Promise((resolve) => {
        const peer = new SimplePeer(options)
        const subscription = new Subscription()

        const cleanUp = () => {
            subscription.unsubscribe()
            peer.destroy()
        }

        subscription.add(
            receiveSignal()
                .pipe(tap((data: any) => peer.signal(data)))
                .subscribe()
        )
        subscription.add(fromEvent(peer, "close").pipe(tap(cleanUp)).subscribe())
        subscription.add(fromEvent(peer, "error").pipe(tap(cleanUp)).subscribe())
        subscription.add(fromEvent(peer, "signal").pipe(tap(sendSignal)).subscribe())
        subscription.add(
            fromEvent(peer, "connect")
                .pipe(
                    tap(() => {
                        const connection: Connection = {
                            disconnect: () => peer.destroy(),
                            publish: (...params) => peer.send(encode(params)),
                            receive: () => fromEvent<Buffer>(peer, "data").pipe(map((data) => decode(data))),
                            userData,
                        }
                        subscription.unsubscribe()
                        resolve([connection, rootStore.link(RootStoreDefaultLinkId, connection)])
                    })
                )
                .subscribe()
        )
        return peer
    })
}
