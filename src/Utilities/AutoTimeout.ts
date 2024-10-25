export abstract class AutoTimeout {
    constructor(
        onIdle: () => void,
        isIdling: () => boolean,
        idleTimeout = 10 * 60 * 1000
    ) {
        this.onIdle = onIdle
        this.isIdling = isIdling
        this.idleTimeout = idleTimeout // Defaulted to 10 minutes
        this.timeout = this.setIdleTimeout()

        this.interval = this.resetTimeoutWithIdling()
    }

    private setIdleTimeout() {
        return setTimeout(() => this.onIdle(), this.idleTimeout)
    }

    private resetIdleTimeout() {
        clearTimeout(this.timeout)
        this.timeout = this.setIdleTimeout()
    }

    private resetTimeoutWithIdling() {
        return setInterval(() => {
            if (!this.isIdling()) this.resetIdleTimeout()
        }, 10000) // Check every 10 seconds for idling
    }

    private onIdle: () => void
    private isIdling: () => boolean
    private idleTimeout: number
    private timeout: NodeJS.Timeout
    private interval: NodeJS.Timeout
}
