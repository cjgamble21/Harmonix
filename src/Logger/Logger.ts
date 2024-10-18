export namespace Logger {
    export function error(...errors: string[]) {
        errors
            .map(
                (error) =>
                    `[${new Date().toISOString()}] :: APPLICATION ERROR :: ${error}`
            )
            .forEach((error) => console.error(error))
    }

    export function warn(...warnings: string[]) {
        warnings
            .map(
                (warning) =>
                    `[${new Date().toISOString()}] :: APPLICATION WARNING :: ${warning}`
            )
            .forEach((warning) => console.debug(warning))
    }

    export function event(...events: string[]) {
        events
            .map(
                (event) =>
                    `[${new Date().toISOString()}] :: EVENT TRIGGERED :: ${event}`
            )
            .forEach((event) => console.log(event))
    }
}
