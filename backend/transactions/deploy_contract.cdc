// transactions/deploy_contract.cdc (UPDATED)
transaction {
    prepare(signer: auth(AddContract) &Account) {
        // Deploy the Donation contract
        // Replace CONTRACT_CODE with your actual contract code
        signer.contracts.add(
            name: "Donation", 
            code: "CONTRACT_CODE_HERE".utf8
        )
    }
}