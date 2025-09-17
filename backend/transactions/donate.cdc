import Donation from 0xYourContractAddress

transaction(causeId: String, amount: UFix64) {
    prepare(signer: AuthAccount) {
        Donation.donate(causeId: causeId, amount: amount)
    }
}