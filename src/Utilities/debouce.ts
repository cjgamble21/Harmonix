export const debounce = <T, R>(func: (...args: T[]) => R, timeout = 500) => {
    let timer: NodeJS.Timeout

    return (...args: T[]) =>
        new Promise<Awaited<R>>((resolve) => {
            clearTimeout(timer)

            setTimeout(() => {
                const output = func(...args)
                output instanceof Promise ? output.then(resolve) : output
            }, timeout)
        })
}
