import { Logger } from '../../../Logger'
import { UserContext } from './UserContext'

export class UserContextManager {
    private userContexts: Map<string, UserContext>

    constructor() {
        this.userContexts = new Map()
    }

    public getUserContext(user: string) {
        const context = this.userContexts.get(user)

        if (context) return context

        this.userContexts.set(
            user,
            new UserContext(() => this.onUserContextIdle(user))
        )

        Logger.event(`Initialized context for user ${user}`)

        return this.userContexts.get(user)
    }

    private onUserContextIdle(user: string) {
        this.userContexts.delete(user)
    }
}
