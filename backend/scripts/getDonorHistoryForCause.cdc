// scripts/getDonorHistoryForCause.cdc
import Donation from 0xYourContractAddress

access(all) fun main(causeId: UInt64, donor: Address): UFix64 {
    if let cause = Donation.getCause(causeId: causeId) {
        return cause.donors[donor] ?? 0.0
    }
    return 0.0
}