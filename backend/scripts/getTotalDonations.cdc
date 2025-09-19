// scripts/getTotalDonations.cdc
import Donation from 0xYourContractAddress

access(all) fun main(): UFix64 {
    return Donation.totalDonations
}