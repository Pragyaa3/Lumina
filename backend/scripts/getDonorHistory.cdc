import Donation from 0x783e668fcfec3578

pub fun main(donor: Address): {String: UFix64}? {
    return Donation.donations[donor]
}
