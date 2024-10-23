export abstract class AutoTimeout {
    constructor(onIdle: () => void, idleTimeout = 10 * 60 * 1000) {
        this.onIdle = onIdle
        this.idleTimeout = idleTimeout // Defaulted to 10 minutes
        this.timeout = this.setIdleTimeout()

        this.resetTimeoutWithMethodInvocations()
    }

    private setIdleTimeout() {
        return setTimeout(this.onIdle, this.idleTimeout)
    }

    private resetIdleTimeout() {
        clearTimeout(this.timeout)
        this.timeout = this.setIdleTimeout()
    }

    private resetTimeoutWithMethodInvocations() {
        const prototype = Object.getPrototypeOf(this)
        const methods = Object.getOwnPropertyNames(prototype).filter(
            (name) =>
                typeof prototype[name] === 'function' && name !== 'constructor'
        )

        methods.forEach((method) => {
            const originalMethod = prototype[method]

            prototype[method] = (...args: any[]) => {
                this.resetIdleTimeout()
                originalMethod.apply(this, args)
            }
        })
    }

    private onIdle: () => void
    private idleTimeout: number
    private timeout: NodeJS.Timeout
}
