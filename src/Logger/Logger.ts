export namespace Logger {
    export function error(...errors: string[]) {
        errors
            .map(
                (error) =>
                    `[${new Date().toUTCString()}] :: APPLICATION ERROR :: ${error}`
            )
            .forEach((error) => {
                console.error(error)
            })
    }

    export function warn(...warnings: string[]) {
        warnings
            .map(
                (warning) =>
                    `[${new Date().toUTCString()}] :: APPLICATION WARNING :: ${warning}`
            )
            .forEach((warning) => console.debug(warning))
    }

    export function event(...events: string[]) {
        events
            .map(
                (event) =>
                    `[${new Date().toUTCString()}] :: EVENT TRIGGERED :: ${event}`
            )
            .forEach((event) => console.log(event))
    }

    export function debug(...events: string[]) {
        if (DEBUG) {
            Logger.event(...events.map((event) => `DEBUGGER EVENT :: ${event}`))
        }
    }
}
