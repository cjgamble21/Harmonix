export class TimeoutHandler {
    timeout: NodeJS.Timeout | null = null
    wait: number

    constructor(timeout: number) {
        this.wait = timeout
    }

    beginTimeout(callback: () => void) {
        this.timeout = setTimeout(callback, this.wait)
    }

    clearTimeout() {
        if (!this.timeout) return null
        clearTimeout(this.timeout)
    }
}
