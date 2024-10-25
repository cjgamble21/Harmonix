import { describe, test, jest, beforeEach, expect } from '@jest/globals'
import { Mock } from 'jest-mock'
import { debounce } from '../../src/Utilities'

describe('debounce', () => {
    let func: Mock<() => void>
    beforeEach(() => {
        func = jest.fn()
        jest.useFakeTimers()
    })

    test('multiple invocations should result in one function call', async () => {
        const debouncedFunc = debounce(func, 20)

        await Promise.race([debouncedFunc(), debouncedFunc(), debouncedFunc()])

        expect(func).toHaveBeenCalledTimes(2)
    })
})
