import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";

// Configure FCL for your deployed contract
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xDonation": "0x23564a5651ac4133"
});

// Cause categories for enhanced UX
const CAUSE_CATEGORIES = [
  { id: 'education', name: 'Education', icon: '📚', color: 'bg-blue-500' },
  { id: 'health', name: 'Healthcare', icon: '🏥', color: 'bg-red-500' },
  { id: 'environment', name: 'Environment', icon: '🌱', color: 'bg-green-500' },
  { id: 'disaster', name: 'Disaster Relief', icon: '🆘', color: 'bg-purple-500' },
  { id: 'community', name: 'Community', icon: '🏘️', color: 'bg-indigo-500' },
  { id: 'animals', name: 'Animal Welfare', icon: '🐾', color: 'bg-orange-500' }
];

export default function Home() {
  const [user, setUser] = useState({ loggedIn: null, addr: undefined });
  const [causes, setCauses] = useState({});
  const [filteredCauses, setFilteredCauses] = useState({});
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [causeName, setCauseName] = useState("");
  const [causeDescription, setCauseDescription] = useState("");
  const [causeGoal, setCauseGoal] = useState("");
  const [causeCategory, setCauseCategory] = useState("education");
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedCause, setSelectedCause] = useState("");

  // Notification state
  const [notification, setNotification] = useState(null);

  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Authentication functions
  const logIn = () => {
    setLoading(true);
    fcl.authenticate().finally(() => setLoading(false));
  };

  const logOut = () => {
    fcl.unauthenticate();
  };

  // Fetch all causes from blockchain
  const fetchCauses = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import Donation from 0x23564a5651ac4133
          
          access(all) fun main(): {UInt64: Donation.Cause} {
            return Donation.getAllCauses()
          }
        `
      });
      
      // Enhance causes with UI categories
      const enhancedCauses = {};
      Object.entries(response || {}).forEach(([id, cause]) => {
        enhancedCauses[id] = {
          ...cause,
          category: cause.category || 'community', // Default category
          featured: Math.random() > 0.7 // Random featured status for demo
        };
      });
      
      setCauses(enhancedCauses);
    } catch (error) {
      console.error("Error fetching causes:", error);
      showNotification("Failed to load causes", 'error');
    }
  };

  // Fetch total donations from blockchain
  const fetchTotalDonations = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import Donation from 0x23564a5651ac4133
          
          access(all) fun main(): UFix64 {
            return Donation.totalDonations
          }
        `
      });
      setTotalDonations(parseFloat(response) || 0);
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  };

  // Filter causes based on category and search
  useEffect(() => {
    let filtered = { ...causes };

    if (selectedCategory !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, cause]) => cause.category === selectedCategory)
      );
    }

    if (searchQuery) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, cause]) => 
          cause.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cause.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredCauses(filtered);
  }, [causes, selectedCategory, searchQuery]);

  // Create a new cause (REAL BLOCKCHAIN TRANSACTION)
  const createCause = async () => {
    if (!causeName.trim() || !causeDescription.trim() || !causeGoal || parseFloat(causeGoal) <= 0) {
      showNotification("Please fill all fields with valid values", 'error');
      return;
    }

    setLoading(true);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Donation from 0x23564a5651ac4133
          
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
        `,
        args: (arg, t) => [
          arg(causeName, t.String),
          arg(causeDescription, t.String),
          arg(parseFloat(causeGoal), t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      
      // Reset form and refresh data
      setCauseName("");
      setCauseDescription("");
      setCauseGoal("");
      setCauseCategory("education");
      setActiveTab('discover');
      fetchCauses();
      showNotification(`Cause "${causeName}" created successfully on blockchain!`);
    } catch (error) {
      console.error("Error creating cause:", error);
      showNotification("Error creating cause: " + error.message, 'error');
    }
    setLoading(false);
  };

  // Make a donation (REAL BLOCKCHAIN TRANSACTION)
  const makeDonation = async () => {
    if (!selectedCause || !donationAmount || parseFloat(donationAmount) <= 0) {
      showNotification("Please select a cause and enter a valid donation amount", 'error');
      return;
    }

    setLoading(true);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Donation from 0x23564a5651ac4133
          
          transaction(causeId: UInt64, amount: UFix64) {
            prepare(signer: auth(Storage) &Account) {
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
        limit: 100
      });

      await fcl.tx(transactionId).onceSealed();
      
      setDonationAmount("");
      setSelectedCause("");
      fetchCauses();
      fetchTotalDonations();
      showNotification(`Successfully donated ${donationAmount} FLOW on blockchain!`);
    } catch (error) {
      console.error("Error making donation:", error);
      showNotification("Error making donation: " + error.message, 'error');
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

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return CAUSE_CATEGORIES.find(cat => cat.id === categoryId) || 
           { name: categoryId, icon: '📋', color: 'bg-gray-500' };
  };

  // Calculate progress percentage
  const getProgress = (raised, goal) => Math.min((raised / goal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Lumina
                </h1>
                <p className="text-sm text-gray-500">Blockchain Donations Platform</p>
              </div>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {!user.loggedIn ? (
                <button
                  onClick={logIn}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Connect Flow Wallet"}
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Connected</p>
                    <p className="text-xs text-gray-500">{user.addr?.substring(0, 16)}...</p>
                  </div>
                  <button
                    onClick={logOut}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {user.loggedIn ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Donated</p>
                  <p className="text-3xl font-bold text-green-600">{totalDonations.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">FLOW tokens</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Causes</p>
                  <p className="text-3xl font-bold text-blue-600">{Object.keys(causes).length}</p>
                  <p className="text-sm text-gray-500">on blockchain</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Donors</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Object.values(causes).reduce((acc, cause) => acc + Object.keys(cause.donors || {}).length, 0)}
                  </p>
                  <p className="text-sm text-gray-500">contributors</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
            {['discover', 'create', 'donate'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div>
              {/* Search and Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search causes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {CAUSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Causes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(filteredCauses).map(([id, cause]) => {
                  const categoryInfo = getCategoryInfo(cause.category);
                  const progress = getProgress(cause.amountRaised, cause.goal);
                  
                  return (
                    <div key={id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                      {cause.featured && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-1 text-sm font-medium">
                          ⭐ Featured
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.icon} {categoryInfo.name}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2 text-gray-900">{cause.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{cause.description}</p>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{cause.amountRaised} FLOW</span>
                              <span className="text-gray-500">{cause.goal} FLOW</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% funded</p>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {Object.keys(cause.donors || {}).length} donors
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(filteredCauses).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No causes found</h3>
                  <p className="text-gray-500">Create the first cause or adjust your search</p>
                </div>
              )}
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Cause</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cause Name</label>
                    <input
                      type="text"
                      placeholder="Enter cause name"
                      value={causeName}
                      onChange={(e) => setCauseName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (FLOW)</label>
                    <input
                      type="number"
                      placeholder="Enter goal amount"
                      value={causeGoal}
                      onChange={(e) => setCauseGoal(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe your cause and how donations will be used"
                    value={causeDescription}
                    onChange={(e) => setCauseDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                  />
                </div>
                
                <button
                  onClick={createCause}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? "Creating on Blockchain..." : "Create Cause"}
                </button>
              </div>
            </div>
          )}

          {/* Donate Tab */}
          {activeTab === 'donate' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Donation</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Cause</label>
                  <select
                    value={selectedCause}
                    onChange={(e) => setSelectedCause(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a cause</option>
                    {Object.entries(causes).map(([id, cause]) => (
                      <option key={id} value={id}>
                        {cause.name} ({cause.amountRaised}/{cause.goal} FLOW)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (FLOW)</label>
                  <input
                    type="number"
                    placeholder="Enter donation amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={makeDonation}
                  disabled={loading || !selectedCause || !donationAmount}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? "Processing on Blockchain..." : "Donate Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Landing Page */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">💫</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Lumina
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The transparent, blockchain-powered donation platform where every contribution 
              is recorded on Flow blockchain for complete transparency and accountability.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Blockchain Secured</h3>
                <p className="text-gray-600">Every donation recorded immutably on Flow blockchain</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Instant Transfers</h3>
                <p className="text-gray-600">Smart contracts enable immediate, secure transactions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Global Impact</h3>
                <p className="text-gray-600">Support causes worldwide with borderless technology</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}