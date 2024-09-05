import * as nearAPI from 'near-api-js';
import BN from 'bn.js';
import { useStore } from '../layout';

const { Near, Account, keyStores, WalletConnection } = nearAPI;

// const contractId = "v5.multichain-mpc-dev.testnet"
// const contractId = "multichain-testnet-2.testnet"
// const contractId = 'v2.multichain-mpc.testnet'
// const contractId = "v1.signer-dev.testnet"

const contractId = process.env.MPC_CONTRACT_ID;

let isSigning = false;
export async function sign(payload, path) {
  if (isSigning) {
    console.warn('Sign function is already running.');
    return;
  }
  isSigning = true;

  const wallet = useStore.getState().wallet;

  if (!wallet) {
    console.error('Wallet is not initialized');
    return;
  }

  // if (!wallet.isSignedIn()) {
  //   wallet.signIn(contractId);
  //   return;
  // }

  const args = {
    request: {
      payload,
      path,
      key_version: 0,
    },
  };
  const attachedDeposit = '1'; // 1 yoctoNEAR

  console.log('wtf ? ??? ? ? ? ? ')
  let result
  try {
    result = await wallet.callMethod({
      contractId,
      method: 'sign',
      args,
      gas: '250000000000000', // 250 Tgas
      deposit: attachedDeposit,
    });
    console.log('Transaction result:', result);
  } catch (error) {
    console.error('Error signing:', error);
  }
  console.log('result', result)
  return result
}

export async function signX(payload, path) {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const config = {
    networkId: 'testnet',
    keyStore: keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    // walletUrl: 'https://testnet.mynearwallet.com/',
    // walletUrl: 'https://testnet.meteorwallet.app/', // Change this to the Meteor Wallet URL

    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
  };
  const near = new Near(config);

  const wallet = new WalletConnection(near, 'my-app');
  const account = wallet.account();

  console.log(wallet, account)
  // Ensure the user is signed in
  if (!wallet.isSignedIn()) {  
    // @ts-ignore
    wallet.requestSignIn(contractId);
    return;
  }

  const args = {
    request: {
      payload,
      path,
      key_version: 0,
    },
  };
  const attachedDeposit = new BN('1'); // 1 yoctoNEAR

  console.log(
    'sign payload',
    payload.length > 200 ? payload.length : payload.toString(),
  );
  console.log('with path', path);
  console.log('this may take approx. 30 seconds to complete');

  let res;
  try {
    res = await account.functionCall({
      contractId,
      methodName: 'sign',
      args,
      gas: new BN('250000000000000'), // 250 Tgas
      attachedDeposit, // Ensure attachedDeposit is correctly set
    });

  } catch (e) {
    console.log(e)
    return console.log('error signing', JSON.stringify(e));
  }

  // parse result into signature values we need r, s but we don't need first 2 bytes of r (y-parity)
  // if ('SuccessValue' in (res.status)) {
  //   const successValue = (res.status).SuccessValue;
  //   const decodedValue = Buffer.from(successValue, 'base64').toString('utf-8');
  //   const parsedJSON = JSON.parse(decodedValue);

  //   return {
  //     r: parsedJSON[0].slice(2),
  //     s: parsedJSON[1],
  //   };
  // } else {
  //   return console.log('error signing', JSON.stringify(res));
  // }
}
