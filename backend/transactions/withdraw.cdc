import Donation from 0xYourContractAddress

transaction(to: Address, amount: UFix64) {
    prepare(acct: AuthAccount) {
        Donation.withdraw(to: to, amount: amount)
    }
}
