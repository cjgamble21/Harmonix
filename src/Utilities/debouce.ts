export const debounce = <T, R>(func: (...args: T[]) => R, timeout = 500) => {
    let timer: NodeJS.Timeout

    return (...args: T[]): Promise<R> =>
        new Promise((resolve) => {
            clearTimeout(timer)

            setTimeout(() => {
                const output = func(...args)
                resolve(output)
            }, timeout)
        })
}
