import * as nearAPI from 'near-api-js';
import BN from 'bn.js';

const { Near, Account, keyStores, WalletConnection } = nearAPI;

// const contractId = "v5.multichain-mpc-dev.testnet"
// const contractId = "multichain-testnet-2.testnet"
// const contractId = 'v2.multichain-mpc.testnet'
const contractId = "v1.signer-dev.testnet"

export async function sign(payload, path) {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const config = {
    networkId: 'testnet',
    keyStore: keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com/',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
  };
  const near = new Near(config);

  const wallet = new WalletConnection(near, 'my-app');
  const account = wallet.account();

  // Ensure the user is signed in
  if (!wallet.isSignedIn()) {  
    // @ts-ignore
    wallet.requestSignIn(contractId);
    return;
  }

  const args = {
    request: {
      payload: payload.reverse(), // ensure payload is reversed as needed
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
  if ('SuccessValue' in (res.status)) {
    const successValue = (res.status).SuccessValue;
    const decodedValue = Buffer.from(successValue, 'base64').toString('utf-8');
    const parsedJSON = JSON.parse(decodedValue);

    return {
      r: parsedJSON[0].slice(2),
      s: parsedJSON[1],
    };
  } else {
    return console.log('error signing', JSON.stringify(res));
  }
}
