// scripts/getTotalDonations.cdc
import Donation from 0x23564a5651ac4133

access(all) fun main(): UFix64 {
    return Donation.totalDonations
}