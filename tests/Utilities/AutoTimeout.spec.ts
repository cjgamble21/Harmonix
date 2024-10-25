import {
    describe,
    expect,
    test,
    jest,
    beforeEach,
    afterEach,
} from '@jest/globals'
import { AutoTimeout } from '../../src/Utilities'
import { FunctionLike, Mock } from 'jest-mock'

class TestableAutoTimeout extends AutoTimeout {}

describe('Auto Timeout Class', () => {
    describe('instance methods', () => {
        let instance: TestableAutoTimeout
        let onIdle: Mock<() => void>
        let isIdling: Mock<() => boolean>

        beforeEach(() => {
            jest.useFakeTimers()

            onIdle = jest.fn(() => {})
            isIdling = jest.fn(() => true)

            instance = new TestableAutoTimeout(onIdle, isIdling)
        })

        test('setIdleTimeout', () => {
            const timer = instance['setIdleTimeout']()

            expect(timer).toBeDefined()

            jest.advanceTimersByTime(instance['idleTimeout'])

            expect(onIdle).toBeCalled()
        })

        test('resetIdleTimeout', () => {
            const initialTimeout = instance['timeout']

            instance['resetIdleTimeout']()

            expect(instance['timeout']).not.toEqual(initialTimeout)
        })

        describe('resetTimeoutWithIdling', () => {
            test('idling', () => {
                const initialTimeout = instance['timeout']
                instance['resetTimeoutWithIdling']()

                const newTimeout = instance['timeout']

                expect(newTimeout).toEqual(initialTimeout)

                jest.advanceTimersByTime(instance['idleTimeout'])

                expect(onIdle).toHaveBeenCalled()
            })

            test('not idling', () => {
                instance = new TestableAutoTimeout(
                    onIdle,
                    jest.fn(() => false)
                )

                const initialTimeout = instance['timeout']
                instance['resetTimeoutWithIdling']()

                jest.advanceTimersByTime(10000)

                const newTimeout = instance['timeout']

                expect(newTimeout).not.toEqual(initialTimeout)
            })

            test('idling state change', () => {
                let isIdlingBoolean = true

                onIdle = jest.fn(() => {})
                isIdling = jest.fn(() => isIdlingBoolean)

                instance = new TestableAutoTimeout(onIdle, isIdling)

                const initialTimeout = instance['timeout']

                // onIdle should be set to invoke after idleTimeout time

                isIdlingBoolean = false

                jest.advanceTimersByTime(10000)

                expect(instance['timeout']).not.toEqual(initialTimeout)

                jest.advanceTimersByTime(instance['idleTimeout'])

                expect(onIdle).not.toBeCalled()
            })
        })

        afterEach(() => {
            jest.clearAllTimers()
        })
    })
})
