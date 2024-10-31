export const debounce = <T extends (...args: any) => any>(
    func: T,
    timeout = 500
) => {
    let timer: NodeJS.Timeout

    return (...args: Parameters<T>) =>
        new Promise<Awaited<ReturnType<T>>>((resolve) => {
            clearTimeout(timer)

            timer = setTimeout(async () => {
                const output = await func(...args)
                resolve(output)
            }, timeout)
        })
}
