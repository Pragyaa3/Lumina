// frontend/flow/config.js
import * as fcl from "@onflow/fcl";

fcl.config()
  .put("accessNode.api", "https://access-testnet.onflow.org") // Testnet node
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn") // Flow testnet wallet
  .put("0xDonation", "0x23564a5651ac4133"); // Your deployed Donation contract address

export default fcl;
