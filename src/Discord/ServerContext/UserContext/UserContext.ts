import { AutoTimeout } from '../../../Utilities'
import { queryVideos } from '../../../Youtube'
import { VideoMetadata } from '../../../Youtube/types'

export class UserContext extends AutoTimeout {
    constructor(onIdle: () => void, isIdle: () => boolean) {
        super(
            () => onIdle(),
            () => isIdle()
        )
    }

    public async getSongOptions(query: string) {
        const options = await queryVideos(query)

        this.lastKnownOptions = options

        return options
    }

    public async getSelectedOption(option: string) {
        if (this.lastKnownOptions.length === 0) {
            const options = await queryVideos(option)
            return options[0]
        }

        const matchingOption = this.lastKnownOptions.find(
            ({ id, title }) => option === id || option === title
        )

        return matchingOption ?? this.lastKnownOptions?.[0] ?? null
    }

    private lastKnownOptions: VideoMetadata[] = []
}
