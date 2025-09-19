// transactions/withdraw.cdc (UPDATED)
import Donation from 0xYourContractAddress

transaction(causeId: UInt64, amount: UFix64, recipient: Address) {
    prepare(signer: auth(Storage) &Account) {
        Donation.withdraw(
            causeId: causeId,
            amount: amount, 
            recipient: recipient,
            signer: signer.address
        )
    }
}