export class Queue<T> {
    container: T[]

    constructor(container?: T[]) {
        this.container = container ?? []
    }

    public isEmpty(): boolean {
        return this.container.length === 0
    }

    public push(...items: T[]): void {
        this.container.push(...items)
    }

    public pop(): T | null {
        if (this.isEmpty()) return null

        return this.container.pop() as T
    }
}
