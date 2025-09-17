import { useState } from "react";
import fcl from "../flow/config";

export default function Home() {
  const [user, setUser] = useState({ loggedIn: false });

  const logIn = async () => {
    const currentUser = await fcl.authenticate();
    setUser(currentUser);
  };

  const logOut = async () => {
    await fcl.unauthenticate();
    setUser({ loggedIn: false });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Lumina Dashboard</h1>
      {!user.loggedIn ? (
        <button onClick={logIn} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Connected as: {user.addr}</p>
          <button onClick={logOut} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
