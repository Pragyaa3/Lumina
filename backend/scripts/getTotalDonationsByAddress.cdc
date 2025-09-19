// scripts/getTotalDonationsByAddress.cdc (CREATE NEW FILE)
import Donation from 0x783e668fcfec3578

access(all) fun main(donor: Address): UFix64 {
    return Donation.getTotalDonationsByDonor(donor: donor)
}