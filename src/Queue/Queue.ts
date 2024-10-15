import { Primitive } from '../Utilities'

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

    public dequeue(items: T[], comparator: (item: T) => Primitive) {
        this.container = this.container.filter(
            (item) => !items.map(comparator).includes(comparator(item))
        )
    }
}
