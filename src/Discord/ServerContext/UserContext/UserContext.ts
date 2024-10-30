import { AutoTimeout } from '../../../Utilities'

export class UserContext extends AutoTimeout {
    constructor(onIdle: () => void) {
        super(
            () => onIdle(),
            () => false
        )
    }
}
