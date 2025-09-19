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
        self.causes[causeId] = ca// contracts/Donation.cdc
access(all) contract Donation {
    
    // Events
    access(all) event DonationReceived(donor: Address, causeId: UInt64, amount: UFix64)
    access(all) event FundsWithdrawn(causeId: UInt64, to: Address, amount: UFix64)
    access(all) event CauseCreated(id: UInt64, name: String, goal: UFix64, owner: Address)

    // Struct to represent a cause
    access(all) struct Cause {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let goal: UFix64
        access(all) var amountRaised: UFix64
        access(all) let owner: Address
        access(all) var donors: {Address: UFix64}
        access(all) let createdAt: UFix64

        init(_id: UInt64, _name: String, _description: String, _goal: UFix64, _owner: Address) {
            self.id = _id
            self.name = _name
            self.description = _description
            self.goal = _goal
            self.amountRaised = 0.0
            self.owner = _owner
            self.donors = {}
            self.createdAt = getCurrentBlock().timestamp
        }

        // Function to update donation amount (can only be called by contract)
        access(contract) fun addDonation(donor: Address, amount: UFix64) {
            self.amountRaised = self.amountRaised + amount
            
            if self.donors[donor] == nil {
                self.donors[donor] = amount
            } else {
                self.donors[donor] = self.donors[donor]! + amount
            }
        }

        // Function to withdraw funds (can only be called by contract)
        access(contract) fun withdrawFunds(amount: UFix64) {
            pre {
                amount <= self.amountRaised: "Insufficient funds"
            }
            self.amountRaised = self.amountRaised - amount
        }
    }

    // Storage paths
    access(all) let DonationVaultStoragePath: StoragePath
    access(all) let DonationVaultPublicPath: PublicPath

    // Contract state
    access(all) var causes: {UInt64: Cause}
    access(all) var totalDonations: UFix64
    access(all) var nextCauseId: UInt64

    init() {
        self.causes = {}
        self.totalDonations = 0.0
        self.nextCauseId = 1
        
        // Storage paths
        self.DonationVaultStoragePath = /storage/DonationVault
        self.DonationVaultPublicPath = /public/DonationVault
    }

    // Create a new cause
    access(all) fun createCause(name: String, description: String, goal: UFix64, owner: Address): UInt64 {
        pre {
            name.length > 0: "Cause name cannot be empty"
            goal > 0.0: "Goal must be greater than 0"
        }
        
        let causeId = self.nextCauseId
        let newCause = Cause(
            _id: causeId,
            _name: name,
            _description: description,
            _goal: goal,
            _owner: owner
        )
        
        self.causes[causeId] = newCause
        self.nextCauseId = self.nextCauseId + 1
        
        emit CauseCreated(id: causeId, name: name, goal: goal, owner: owner)
        return causeId
    }

    // Donate to a cause - this will be called from transactions
    access(all) fun donate(causeId: UInt64, amount: UFix64, donor: Address) {
        pre {
            amount > 0.0: "Donation must be greater than 0"
            self.causes.containsKey(causeId): "Cause does not exist"
        }

        let cause = &self.causes[causeId] as &Cause
        cause.addDonation(donor: donor, amount: amount)
        
        self.totalDonations = self.totalDonations + amount
        
        emit DonationReceived(donor: donor, causeId: causeId, amount: amount)
    }

    // Withdraw funds from a cause (only cause owner can withdraw)
    access(all) fun withdraw(causeId: UInt64, amount: UFix64, recipient: Address, signer: Address) {
        pre {
            self.causes.containsKey(causeId): "Cause does not exist"
            amount > 0.0: "Withdrawal amount must be greater than 0"
        }

        let cause = &self.causes[causeId] as &Cause
        
        // Only cause owner can withdraw
        assert(cause.owner == signer, message: "Only cause owner can withdraw funds")
        assert(amount <= cause.amountRaised, message: "Insufficient funds")

        cause.withdrawFunds(amount: amount)
        self.totalDonations = self.totalDonations - amount
        
        emit FundsWithdrawn(causeId: causeId, to: recipient, amount: amount)
    }

    // Get a specific cause
    access(all) fun getCause(causeId: UInt64): Cause? {
        return self.causes[causeId]
    }

    // Get all causes
    access(all) fun getAllCauses(): {UInt64: Cause} {
        return self.causes
    }

    // Get total donations for a donor across all causes
    access(all) fun getTotalDonationsByDonor(donor: Address): UFix64 {
        var total: UFix64 = 0.0
        for cause in self.causes.values {
            if let donorAmount = cause.donors[donor] {
                total = total + donorAmount
            }
        }
        return total
    }
}use

        emit FundsWithdrawn(causeId: causeId, to: to, amount: amount)
    }
}
