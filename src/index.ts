import { RootStore, Connection, StoreLink, RootStoreDefaultLinkId } from "co-share"
import { encode, decode } from "messagepack"
import SimplePeer, { Options } from "simple-peer"
import { Observable, Subscription, fromEvent } from "rxjs"
import { tap, map } from "rxjs/operators"

export function connectPeer(
    options: Options,
    receiveSignal: () => Observable<any>,
    onSignal: (data: any) => void,
    onCleanup: () => void,
    createUserData: ((instance: SimplePeer.Instance) => any) | undefined,
    rootStore: RootStore
): Promise<[Connection, StoreLink]> {
    return new Promise((resolve) => {
        const peer = new SimplePeer(options)
        const subscription = new Subscription()

        const cleanUp = () => {
            subscription.unsubscribe()
            peer.destroy()
            onCleanup()
        }

        subscription.add(
            receiveSignal()
                .pipe(tap((data: any) => peer.signal(data)))
                .subscribe()
        )
        subscription.add(fromEvent(peer, "close").pipe(tap(cleanUp)).subscribe())
        subscription.add(fromEvent(peer, "error").pipe(tap(cleanUp)).subscribe())
        subscription.add(fromEvent(peer, "signal").pipe(tap(onSignal)).subscribe())
        subscription.add(
            fromEvent(peer, "connect")
                .pipe(
                    tap(() => {
                        const connection: Connection = {
                            disconnect: cleanUp,
                            publish: (...params) => peer.send(encode(params)),
                            receive: () => fromEvent<Buffer>(peer, "data", (s) => s).pipe(map((data) => decode(data))),
                            userData: {
                                ...(createUserData == null ? {} : createUserData(peer)),
                                peer,
                            },
                        }
                        const link = rootStore.link(RootStoreDefaultLinkId, connection)
                        resolve([connection, link])
                    })
                )
                .subscribe()
        )
        return peer
    })
}
