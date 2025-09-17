pub contract Donation {

    pub event DonationReceived(donor: Address, causeId: UInt64, amount: UFix64)
    pub event FundsWithdrawn(causeId: UInt64, to: Address, amount: UFix64)
    pub event CauseCreated(id: UInt64, name: String, goal: UFix64)

    pub struct Cause {
        pub let id: UInt64
        pub let name: String
        pub let goal: UFix64
        pub var amountRaised: UFix64
        pub var donors: {Address: UFix64}

        init(_id: UInt64, _name: String, _goal: UFix64) {
            self.id = _id
            self.name = _name
            self.goal = _goal
            self.amountRaised = 0.0
            self.donors = {}
        }
    }

    // Track causes
    pub var causes: {UInt64: Cause}
    pub var totalDonations: UFix64
    pub let owner: Address
    pub var nextCauseId: UInt64

    init() {
        self.causes = {}
        self.totalDonations = 0.0
        self.owner = self.account.address
        self.nextCauseId = 1
    }

    // Add a new cause
    pub fun createCause(name: String, goal: UFix64) {
        pre { self.account.address == self.owner: "Only owner can create cause" }
        let id = self.nextCauseId
        let cause = Cause(_id: id, _name: name, _goal: goal)
        self.causes[id] = cause
        self.nextCauseId = self.nextCauseId + 1
        emit CauseCreated(id: id, name: name, goal: goal)
    }

    // Donate to a cause
    pub fun donate(causeId: UInt64, amount: UFix64) {
        pre { amount > 0.0: "Donation must be > 0" }

        let donor = self.account.address
        let cause = self.causes[causeId] ?? panic("Cause does not exist")

        // Update totals
        self.totalDonations = self.totalDonations + amount
        cause.amountRaised = cause.amountRaised + amount

        if cause.donors[donor] == nil {
            cause.donors[donor] = amount
        } else {
            cause.donors[donor] = cause.donors[donor]! + amount
        }

        self.causes[causeId] = cause
        emit DonationReceived(donor: donor, causeId: causeId, amount: amount)
    }

    // Withdraw from a cause
    pub fun withdraw(causeId: UInt64, to: Address, amount: UFix64) {
        pre {
            self.account.address == self.owner: "Only owner can withdraw"
        }

        let cause = self.causes[causeId] ?? panic("Cause does not exist")
        pre { amount <= cause.amountRaised: "Not enough funds in cause" }

        cause.amountRaised = cause.amountRaised - amount
        self.totalDonations = self.totalDonations - amount
        self.causes[causeId] = cause

        emit FundsWithdrawn(causeId: causeId, to: to, amount: amount)
    }
}
