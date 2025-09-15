import Donation from 0x01 // replace 0x01 with your Flow account

transaction {
    prepare(acct: AuthAccount) {
        acct.contracts.add(name: "Donation", code: "Donation contract code".utf8)
    }
}
