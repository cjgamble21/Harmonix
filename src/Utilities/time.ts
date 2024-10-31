export const formatSecondsToTimestamp = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds / 60) % 60)
    const secs = seconds % 60

    return [hours, minutes, secs]
        .filter((number, index) => index > 0 || number > 0)
        .map(String)
        .map((time, index) => (index > 0 ? time.padStart(2, '0') : time))
        .join(':')
}
