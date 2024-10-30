import { AutoTimeout } from '../../../Utilities'
import { VideoMetadata } from '../../../Youtube/types'

export class UserContext extends AutoTimeout {
    constructor(onIdle: () => void, isIdle: () => boolean) {
        super(
            () => onIdle(),
            () => isIdle()
        )
    }

    public getSelectedOption(option: string) {
        const matchingOption = this.lastKnownOptions.find(
            ({ id, title }) => option === id || option === title
        )

        return matchingOption ?? this.lastKnownOptions?.[0] ?? null
    }

    public setLastKnownOptions(options: VideoMetadata[]) {
        this.lastKnownOptions = options
    }

    private lastKnownOptions: VideoMetadata[] = []
}
