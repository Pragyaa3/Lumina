// scripts/getCause.cdc
import Donation from 0xYourContractAddress

access(all) fun main(causeId: UInt64): Donation.Cause? {
    return Donation.getCause(causeId: causeId)
}