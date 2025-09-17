import Donation from 0xYourContractAddress

transaction(causeId: String, amount: UFix64, to: Address) {
    prepare(signer: AuthAccount) {
        Donation.withdraw(causeId: causeId, amount: amount, to: to)
    }
}