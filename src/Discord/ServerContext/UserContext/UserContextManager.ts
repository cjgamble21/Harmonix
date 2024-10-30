import { Logger } from '../../../Logger'
import { UserContext } from './UserContext'

export class UserContextManager {
    private userContexts: Map<string, UserContext>

    constructor() {
        this.userContexts = new Map()
    }

    public getUserContext(user: string, isIdle: () => boolean) {
        const context = this.userContexts.get(user)

        if (context) return context

        const newUserContext = new UserContext(
            () => this.onUserContextIdle(user),
            () => isIdle()
        )

        this.userContexts.set(user, newUserContext)

        Logger.event(`Initialized context for user ${user}`)

        return newUserContext
    }

    private onUserContextIdle(user: string) {
        this.userContexts.delete(user)
    }
}
