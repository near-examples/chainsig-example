import React, { useEffect } from 'react';

import { create as createStore } from 'zustand';
import { Wallet } from "./wallets/near-wallet";
import { Navigation } from "./components/Navigation";
import { getNearContract } from "./config";

interface StoreState {
  wallet: Wallet | undefined;
  signedAccountId: string;
  networkId: string;
  addressType: 'segwit' | 'legacy';
  setNetworkId: (networkId: string) => void;
  setWallet: (wallet: Wallet) => void;
  setSignedAccountId: (signedAccountId: string) => void;
  setAddressType: (addressType: 'segwit' | 'legacy') => void;
}

// Store to share wallet and signed account
export const useStore = createStore<StoreState>((set) => ({
  wallet: undefined,
  signedAccountId: '',
  networkId: 'testnet',
  addressType: 'segwit',
  setNetworkId: (networkId) => set({ networkId }),
  setWallet: (wallet) =>set({ wallet }),
  setSignedAccountId: (signedAccountId) => {
    const okx_account_id = localStorage.getItem('okx_account_id')
    if (!signedAccountId && okx_account_id) {
      // @ts-ignore
      return set({ okx_account_id })
    }
    return set({ signedAccountId })
  },
  setAddressType: (addressType) => set({ addressType })
}))

export default function RootLayout({ children }) {
  const { setWallet, setSignedAccountId, networkId } = useStore();

  if (typeof window !== 'undefined') {
    window.okxwallet.near.on("accountChanged", ((accountId) => {
      localStorage.removeItem('okx_account_id');
      setSignedAccountId(null)
    }))
    window.okxwallet.near.on("signOut", (() => {
      localStorage.removeItem('okx_account_id');
      setSignedAccountId(null)
    }))
    // @ts-ignore
    window.okxwallet.near.on("signIn", ((accountId) => {
      localStorage.setItem('okx_account_id', accountId);
      setSignedAccountId(accountId)
    }))
  }

  useEffect(() => {
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
