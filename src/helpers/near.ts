import * as nearAPI from 'near-api-js';
import BN from 'bn.js';
import { useStore } from '../layout';
import { MPC_VARIABLE } from '../config'

const { Near, keyStores, WalletConnection } = nearAPI;

const contractId = process.env.MPC_CONTRACT_ID;

let isSigning = false;
export async function sign(payload, path) {
  if (isSigning) {
    console.warn('Sign function is already running.');
    return;
  }
  isSigning = true;

  const wallet = useStore.getState().wallet;
  const networkId = useStore.getState().networkId
  const contractId = MPC_VARIABLE[networkId === 'testnet' ? 'MPC_CONTRACT_ID_TESTNET' : 'MPC_CONTRACT_ID_MAINNET']
  if (!wallet) {
    console.error('Wallet is not initialized');
    return;
  }

  const args = {
    request: {
      payload,
      path,
      key_version: 0,
    },
  };
  const attachedDeposit = '5'; // 1 yoctoNEAR

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
  const networkId = useStore.getState().networkId

  const config = {
    networkId,
    keyStore: keyStore,
    nodeUrl: networkId === 'testnet' ? 'https://rpc.testnet.near.org' : 'http://rpc.mainnet.near.org',
    // nodeUrl: 'http://rpc.mainnet.near.org',
    // walletUrl: 'https://testnet.mynearwallet.com/',
    // walletUrl: 'https://testnet.meteorwallet.app/', // Change this to the Meteor Wallet URL
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
  };
  const near = new Near(config);

  const wallet = new WalletConnection(near, 'my-app');
  const account = wallet.account();

  // Ensure the user is signed in

  const args = {
    request: {
      payload,
      path,
      key_version: 0,
    },
  };
  const attachedDeposit = new BN('10'); // 1 yoctoNEAR

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
}
