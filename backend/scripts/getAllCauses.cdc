// scripts/getAllCauses.cdc
import Donation from 0x23564a5651ac4133

access(all) fun main(): {UInt64: Donation.Cause} {
    return Donation.getAllCauses()
}