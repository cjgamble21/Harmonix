export namespace Logger {
    export function error(invoker: string, ...errors: string[]) {
        console.error(
            `APPLICATION ERROR :: Error in ${invoker} : ${errors.join(', ')}`
        )
    }

    export function warn(...warnings: string[]) {
        console.warn(`APPLICATION WARNING :: ${warnings.join(', ')}`)
    }

    export function event(...events: string[]) {
        console.log(`${events.map((event) => `EVENT TRIGGERED :: ${event}`)}`)
    }
}
