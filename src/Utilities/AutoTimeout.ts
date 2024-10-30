export abstract class AutoTimeout {
    constructor(
        onIdle: () => void,
        isIdling: () => boolean,
        idleTimeout = 10 * 60 * 1000,
        timeoutInterval = 10000
    ) {
        this.onIdle = onIdle
        this.isIdling = isIdling
        this.idleTimeout = idleTimeout // Defaulted to 10 minutes
        this.timeoutInterval = timeoutInterval // Defaulted to 10 seconds
        this.timeout = this.setIdleTimeout()

        this.resetTimeoutUnlessIdling()
    }

    private setIdleTimeout() {
        return setTimeout(() => this.onIdle(), this.idleTimeout)
    }

    private resetIdleTimeout() {
        clearTimeout(this.timeout)
        this.timeout = this.setIdleTimeout()
    }

    private resetTimeoutUnlessIdling() {
        setInterval(() => {
            if (!this.isIdling()) this.resetIdleTimeout()
        }, this.timeoutInterval)
    }

    private onIdle: () => void
    private isIdling: () => boolean
    private idleTimeout: number
    private timeoutInterval: number
    private timeout: NodeJS.Timeout
}
