import { Action, Store, StoreLink, Subscriber } from "co-share"
import { BehaviorSubject } from "rxjs"

export class PeerStore extends Store {
    public subscriber: Subscriber<PeerStore, [Array<string>]> = Subscriber.create(
        PeerStore,
        (connection, accept, deny) => {
            this.addClient(connection.userData.id)
            accept(this.clients.value.filter((id) => id != connection.userData.id))
        }
    )

    public readonly clients: BehaviorSubject<Array<string>>

    constructor(clients: Array<string>, private onSignal: (senderId: string, message: any) => void) {
        super()
        this.clients = new BehaviorSubject(clients)
    }

    public signal = Action.create(this, "signal", (origin, message: any, receiverId?: string, senderId?: string) => {
        //the following routing algorithm assumes a star topology
        if (origin == null) {
            this.signal.publishTo({ to: "one", one: this.mainLink }, message, receiverId)
        } else if (origin.connection.userData.id === receiverId) {
            if(senderId != null) {
                this.onSignal(senderId, message)
            }
        } else {
            const link = Array.from(this.linkSet).find((link) => link.connection.userData.id === receiverId)
            if (link == null) {
                throw new Error(`unable to find connection with receiver id ${receiverId}`)
            }
            this.signal.publishTo({ to: "one", one: link }, senderId, receiverId, message)
        }
    })

    public onLink(link: StoreLink): void {}

    private addClient = Action.create(this, "addClient", (origin, clientInfo: string) => {
        this.clients.next([...this.clients.value, clientInfo])
        this.addClient.publishTo(origin == null ? { to: "all" } : { to: "all-except-one", except: origin }, clientInfo)
    })

    private removeClient = Action.create(this, "removeClient", (origin, clientId: string) => {
        this.clients.next(this.clients.value.filter((id) => id !== clientId))
        this.removeClient.publishTo(origin == null ? { to: "all" } : { to: "all-except-one", except: origin }, clientId)
    })

    public onUnlink(link: StoreLink): void {
        this.removeClient(link.connection.userData.id)
    }
}
