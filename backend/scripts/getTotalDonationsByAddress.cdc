// scripts/getTotalDonationsByAddress.cdc (CREATE NEW FILE)
import Donation from 0x23564a5651ac4133

access(all) fun main(donor: Address): UFix64 {
    return Donation.getTotalDonationsByDonor(donor: donor)
}