// pages/index.js
import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";

// Configure FCL
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org", // Flow testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xDonation": "0x783e668fcfec3578" // Replace with your contract address
});

export default function Home() {
  const [user, setUser] = useState({ loggedIn: null, addr: undefined });
  const [causes, setCauses] = useState({});
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form states
  const [causeName, setCauseName] = useState("");
  const [causeDescription, setCauseDescription] = useState("");
  const [causeGoal, setCauseGoal] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedCause, setSelectedCause] = useState("");

  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  // Authentication functions
  const logIn = () => {
    fcl.authenticate();
  };

  const logOut = () => {
    fcl.unauthenticate();
  };

  // Fetch all causes
  const fetchCauses = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import Donation from 0x783e668fcfec3578
          
          access(all) fun main(): {UInt64: Donation.Cause} {
            return Donation.getAllCauses()
          }
        `
      });
      setCauses(response || {});
    } catch (error) {
      console.error("Error fetching causes:", error);
    }
  };

  // Fetch total donations
  const fetchTotalDonations = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import Donation from 0x783e668fcfec3578
          
          access(all) fun main(): UFix64 {
            return Donation.totalDonations
          }
        `
      });
      setTotalDonations(response || 0);
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  };

  // Create a new cause
  const createCause = async () => {
    if (!causeName || !causeDescription || !causeGoal) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Donation from 0x783e668fcfec3578
          
          transaction(name: String, description: String, goal: UFix64) {
            prepare(signer: AuthAccount) {
              let causeId = Donation.createCause(
                name: name,
                description: description,
                goal: goal,
                owner: signer.address
              )
              log("Created cause with ID: ".concat(causeId.toString()))
            }
          }
        `,
        args: (arg, t) => [
          arg(causeName, t.String),
          arg(causeDescription, t.String),
          arg(parseFloat(causeGoal), t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 50
      });

      console.log("Transaction submitted:", transactionId);
      
      // Wait for transaction to be sealed
      const result = await fcl.tx(transactionId).onceSealed();
      console.log("Transaction result:", result);

      // Reset form and refresh data
      setCauseName("");
      setCauseDescription("");
      setCauseGoal("");
      fetchCauses();
      alert("Cause created successfully!");
    } catch (error) {
      console.error("Error creating cause:", error);
      alert("Error creating cause: " + error.message);
    }
    setLoading(false);
  };

  // Make a donation
  const makeDonation = async () => {
    if (!selectedCause || !donationAmount) {
      alert("Please select a cause and enter donation amount");
      return;
    }

    setLoading(true);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Donation from 0x783e668fcfec3578
          
          transaction(causeId: UInt64, amount: UFix64) {
            prepare(signer: AuthAccount) {
              // For now, just record the donation without actual token transfer
              Donation.donate(causeId: causeId, amount: amount, donor: signer.address)
            }
          }
        `,
        args: (arg, t) => [
          arg(parseInt(selectedCause), t.UInt64),
          arg(parseFloat(donationAmount), t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 50
      });

      await fcl.tx(transactionId).onceSealed();
      
      // Reset form and refresh data
      setDonationAmount("");
      setSelectedCause("");
      fetchCauses();
      fetchTotalDonations();
      alert("Donation successful!");
    } catch (error) {
      console.error("Error making donation:", error);
      alert("Error making donation: " + error.message);
    }
    setLoading(false);
  };

  // Load data when user logs in
  useEffect(() => {
    if (user.loggedIn) {
      fetchCauses();
      fetchTotalDonations();
    }
  }, [user.loggedIn]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          💫 Lumina - Transparent Donations
        </h1>

        {/* Authentication Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {!user.loggedIn ? (
            <div className="text-center">
              <p className="mb-4">Connect your Flow wallet to get started</p>
              <button
                onClick={logIn}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-2">Connected as: <code className="bg-gray-100 px-2 py-1 rounded">{user.addr}</code></p>
              <button
                onClick={logOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {user.loggedIn && (
          <>
            {/* Stats Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Platform Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{totalDonations}</div>
                  <div className="text-gray-600">Total FLOW Donated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{Object.keys(causes).length}</div>
                  <div className="text-gray-600">Active Causes</div>
                </div>
              </div>
            </div>

            {/* Create Cause Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Create New Cause</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Cause Name"
                  value={causeName}
                  onChange={(e) => setCauseName(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Goal (FLOW)"
                  value={causeGoal}
                  onChange={(e) => setCauseGoal(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <textarea
                  placeholder="Description"
                  value={causeDescription}
                  onChange={(e) => setCauseDescription(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
                  rows="3"
                />
              </div>
              <button
                onClick={createCause}
                disabled={loading}
                className="mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
              >
                {loading ? "Creating..." : "Create Cause"}
              </button>
            </div>

            {/* Donation Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Make a Donation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={selectedCause}
                  onChange={(e) => setSelectedCause(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select a cause</option>
                  {Object.entries(causes).map(([id, cause]) => (
                    <option key={id} value={id}>
                      {cause.name} (${cause.amountRaised}/${cause.goal} FLOW)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (FLOW)"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <button
                onClick={makeDonation}
                disabled={loading}
                className="mt-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
              >
                {loading ? "Donating..." : "Donate"}
              </button>
            </div>

            {/* Causes List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Active Causes</h2>
              {Object.keys(causes).length === 0 ? (
                <p className="text-gray-600">No causes created yet. Create the first one!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(causes).map(([id, cause]) => {
                    const progress = (cause.amountRaised / cause.goal) * 100;
                    return (
                      <div key={id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">{cause.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{cause.description}</p>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm">
                            <span>{cause.amountRaised} FLOW</span>
                            <span>{cause.goal} FLOW</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {Object.keys(cause.donors).length} donors
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}