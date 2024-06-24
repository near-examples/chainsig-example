import * as nearAPI from 'near-api-js';
import BN from 'bn.js';

const { Near, Account, keyStores } = nearAPI;

// const contractId = "v5.multichain-mpc-dev.testnet"
// const contractId = "multichain-testnet-2.testnet"
const contractId = 'v2.multichain-mpc.testnet'

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

  const localStorage = JSON.parse(near.config.keyStore.localStorage.near_app_wallet_auth_key)
  const accountId = localStorage.accountId

  const account = new Account(near.connection, accountId);

  const args = {
    payload,
    path,
    key_version: 0,
    rlp_payload: undefined,
  };
  let attachedDeposit = '0';

  // may change in the future // if stops working try removing
  args.payload = payload.reverse();

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
      gas: new BN('300000000000000'),
      attachedDeposit,
    });
  } catch (e) {
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
