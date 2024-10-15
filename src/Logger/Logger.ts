export namespace Logger {
    export function error(invoker: string, ...errors: string[]) {
        errors
            .map(
                (error) => `APPLICATION ERROR :: Error in ${invoker} : ${error}`
            )
            .forEach((error) => console.log(error))
    }

    export function warn(...warnings: string[]) {
        warnings
            .map((warning) => `APPLICATION WARNING :: ${warning}`)
            .forEach((warning) => console.log(warning))
    }

    export function event(...events: string[]) {
        events
            .map((event) => `EVENT TRIGGERED :: ${event}`)
            .forEach((event) => console.log(event))
    }
}
