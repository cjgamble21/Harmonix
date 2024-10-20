export const debounce = <T, R>(func: (...args: T[]) => R, timeout = 500) => {
    let timer: NodeJS.Timeout

    return (...args: T[]) =>
        new Promise<Awaited<R>>((resolve) => {
            clearTimeout(timer)

            timer = setTimeout(async () => {
                const output = await func(...args)
                resolve(output)
            }, timeout)
        })
}
