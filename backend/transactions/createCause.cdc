// transactions/createCause.cdc (NEW FILE - ADD THIS)
import Donation from 0xYourContractAddress

transaction(name: String, description: String, goal: UFix64) {
    prepare(signer: auth(Storage) &Account) {
        let causeId = Donation.createCause(
            name: name,
            description: description, 
            goal: goal,
            owner: signer.address
        )
        log("Created cause with ID: ".concat(causeId.toString()))
    }
}

// transactions/donate.cdc (UPDATED)
import Donation from 0xYourContractAddress

transaction(causeId: UInt64, amount: UFix64) {
    prepare(signer: auth(Storage) &Account) {
        // For now, just record the donation without actual token transfer
        // In production, you'd handle real FlowToken transfers here
        Donation.donate(causeId: causeId, amount: amount, donor: signer.address)
    }
}