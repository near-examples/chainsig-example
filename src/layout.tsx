import React, { useEffect } from 'react';

import { create as createStore } from 'zustand';
import { Wallet } from "./wallets/near-wallet";
import { Navigation } from "./components/Navigation";
import { getNearContract } from "./config";

interface StoreState {
  wallet: Wallet | undefined;
  signedAccountId: string;
  networkId: string;
  setNetworkId: (networkId: string) => void;
  setWallet: (wallet: Wallet) => void;
  setSignedAccountId: (signedAccountId: string) => void;
}

// Store to share wallet and signed account
export const useStore = createStore<StoreState>((set) => ({
  wallet: undefined,
  signedAccountId: '',
  networkId: 'testnet',
  setNetworkId: (networkId) => set({ networkId }),
  setWallet: (wallet) => set({ wallet }),
  setSignedAccountId: (signedAccountId) => set({ signedAccountId })
}))

export default function RootLayout({ children }) {
  const { setWallet, setSignedAccountId, networkId } = useStore();

  useEffect(() => {
    // create wallet instance
    const wallet = new Wallet({ createAccessKeyFor: getNearContract(networkId), networkId: networkId })

    wallet.startUp(setSignedAccountId);
    setWallet(wallet);
  }, [networkId])

  return (
    <>
      <Navigation />  
      {children}
    </>
  );
}
