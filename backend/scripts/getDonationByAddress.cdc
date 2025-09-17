import Donation from 0x783e668fcfec3578

pub fun main(donor: Address): UFix64 {
    if let donated = Donation.donations[donor] {
        return donated
    }
    return 0.0
}
