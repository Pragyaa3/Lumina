import Donation from 0xYourContractAddress

transaction(amount: UFix64) {
    prepare(acct: AuthAccount) {
        Donation.donate(amount: amount)
    }
}
