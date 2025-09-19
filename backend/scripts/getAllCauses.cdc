// scripts/getAllCauses.cdc
import Donation from 0xYourContractAddress

access(all) fun main(): {UInt64: Donation.Cause} {
    return Donation.getAllCauses()
}