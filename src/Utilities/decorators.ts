import { Logger } from '../Logger'

export const SwallowErrors = <T extends new (...args: any) => InstanceType<T>>(
    constructor: T,
    context: ClassDecoratorContext
) => {
    if (context.kind !== 'class') return

    const methods = Object.getOwnPropertyNames(constructor.prototype).filter(
        (name) =>
            typeof constructor.prototype[name] === 'function' &&
            name !== 'constructor'
    )

    methods.forEach((method) => {
        const originalMethod = constructor.prototype[method]

        constructor.prototype[method] = async function (...args: any[]) {
            try {
                const result = await originalMethod.apply(this, args)

                return result
            } catch (err: any) {
                Error.captureStackTrace(err)
                Logger.error(`Critical error occurred in ${method} :: ${err}`)
            }
        }
    })
}
