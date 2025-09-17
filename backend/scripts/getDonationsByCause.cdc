import Donation from 0x783e668fcfec3578

pub fun main(causeId: String): UFix64 {
    return Donation.causes[causeId]?.total ?? 0.0
}
