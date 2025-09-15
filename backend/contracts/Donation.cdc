pub contract Donation {

    // Event logs
    pub event DonationReceived(donor: Address, amount: UFix64)
    pub event FundsWithdrawn(to: Address, amount: UFix64)

    // Stores total donations
    pub var totalDonations: UFix64

    // Maps donor address → donated amount
    pub var donations: {Address: UFix64}

    // Owner of contract
    pub let owner: Address

    init() {
        self.totalDonations = 0.0
        self.donations = {}
        self.owner = self.account.address
    }

    // Function for people to donate
    pub fun donate(amount: UFix64) {
        pre {
            amount > 0.0: "Donation must be greater than 0"
        }

        let donor = self.account.address

        // Add to total
        self.totalDonations = self.totalDonations + amount

        // Update donor’s total
        if self.donations[donor] == nil {
            self.donations[donor] = amount
        } else {
            self.donations[donor] = self.donations[donor]! + amount
        }

        emit DonationReceived(donor: donor, amount: amount)
    }

    // Withdraw function only for owner
    pub fun withdraw(to: Address, amount: UFix64) {
        pre {
            self.account.address == self.owner: "Only owner can withdraw"
            amount <= self.totalDonations: "Not enough funds"
        }

        self.totalDonations = self.totalDonations - amount
        emit FundsWithdrawn(to: to, amount: amount)
    }
}
