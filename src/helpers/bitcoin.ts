import { ethers } from 'ethers';
import { fetchJson } from './utils';
import { sign } from './near';
import * as bitcoinJs from 'bitcoinjs-lib';

const constructPtsb = async (
  address,
  to ,
  amount,
): Promise<[any[], any, string] | void> => {
  if (!address) return console.log('must provide a sending address');
  const { getBalance, explorer } = bitcoin;
  const sats = parseInt(amount);

  // get utxos
  const utxos = await getBalance({ address, getUtxos: true });

  if (!utxos) return
  // check balance (TODO include fee in check)
  if (utxos[0].value < sats) {
    return console.log('insufficient funds');
  }

  const psbt = new bitcoinJs.Psbt({ network: bitcoinJs.networks.testnet });

  let totalInput = 0;
  await Promise.all(
    utxos.map(async (utxo) => {
      totalInput += utxo.value;

      const transaction = await fetchTransaction(utxo.txid);
      let inputOptions;
      if (transaction.outs[utxo.vout].script.includes('0014')) {
        inputOptions = {
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: transaction.outs[utxo.vout].script,
            value: utxo.value,
          },
        };
      } else {
        inputOptions = {
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(transaction.toHex(), 'hex'),
        };
      }

      psbt.addInput(inputOptions);
    }),
  );

  psbt.addOutput({
    address: to,
    value: sats,
  });

  // calculate fee
  const feeRate = await fetchJson(`${bitcoinRpc}/fee-estimates`);
  const estimatedSize = utxos.length * 148 + 2 * 34 + 10;
  const fee = estimatedSize * (feeRate[6] + 3);
  const change = totalInput - sats - fee;

  if (change > 0) {
    psbt.addOutput({
      address: address,
      value: Math.floor(change),
    });
  }

  return [utxos, psbt, explorer]
}

const bitcoin = {
  name: 'Bitcoin Testnet',
  currency: 'sats',
  explorer: 'https://blockstream.info/testnet',
  getBalance: async ({ address, getUtxos = false }) => {
    try {
      const res = await fetchJson(
        `https://blockstream.info/testnet/api/address/${address}/utxo`,
      );

      if (!res) return

      let utxos = res.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
      }));
      // ONLY RETURNING AND SIGNING LARGEST UTXO
      // WHY?
      // For convenience in client side, this will only require 1 Near signature for 1 Bitcoin TX.
      // Solutions for signing multiple UTXOs using MPC with a single Near TX are being worked on.
      let maxValue = 0;
      utxos.forEach((utxo) => {
        if (utxo.value > maxValue) maxValue = utxo.value;
      });
      utxos = utxos.filter((utxo) => utxo.value === maxValue);

      if (!utxos || !utxos.length) {
        console.log(
          'no utxos for address',
          address,
          'please fund address and try again',
        );
      }

      return getUtxos ? utxos : maxValue;
    } catch (e) {
      console.log('e', e)
    }
  },
  send: async ({
    from: address,
    publicKey,
    to,
    amount,
    path,
  }) => {
    const result = await constructPtsb(address, to, amount)
    if (!result) return
    const [utxos, psbt] = result;

    const keyPair = {
      publicKey: Buffer.from(publicKey, 'hex'),
      sign: async (transactionHash) => {
        const payload = Object.values(ethers.utils.arrayify(transactionHash));
        await sign(payload, path);
        return null
      },
    };

    await Promise.all(
      utxos.map(async (_, index) => {
        console.log(index)
        try {
          await psbt.signInputAsync(index, keyPair);
        } catch (e) {
          console.warn(e, 'not signed');
        }
      }),
    );
    return null
  },
  broadcast: async ({
    from: address,
    publicKey,
    to,
    amount,
    path,
    sig
  }) => {
    const result = await constructPtsb(address, to, amount)
    if (!result) return
    const [utxos, psbt, explorer] = result;

    /* 
      sig object format on v1.signer-dev.testnet 
      {
          "big_r": {
              "affine_point": "0326A048E88A80CCE88AA8D6D529C00E287B8E92A38338F365D32D9A4B74E4C9AF"
          },
          "s": {
              "scalar": "618E0304CE060E5DE4F2EF978E7E7F72B0C313540C1B59B5E3F3B260B163CEF0"
          },
          "recovery_id": 1
      }
    */

    const keyPair = {
      publicKey: Buffer.from(publicKey, 'hex'),
      sign: (transactionHash) => {    
        const r = sig.big_r.affine_point;
        const s = sig.s.scalar;

        if (r.length !== 66 || s.length !== 64) {
          throw new Error('Invalid signature length');
        }

        console.log('!L!L!L', r)
        // Create a 64-byte signature buffer by concatenating r and s
        const signature = Buffer.concat([
          Buffer.from(r.slice(2), 'hex'), // slice off the '02' prefix for the affine point
          Buffer.from(s, 'hex'),
        ]);

        // Ensure that the signature returned is exactly 64 bytes
        return signature;
      },
    };

    await Promise.all(
      utxos.map(async (_, index) => {
        try {
          await psbt.signInputAsync(index, keyPair);
        } catch (e) {
          console.warn(e, 'not signed');
        }
      }),
    );

    psbt.finalizeAllInputs();

    // broadcast tx
    try {
      const res = await fetch(`https://corsproxy.io/?${bitcoinRpc}/tx`, {
        method: 'POST',
        body: psbt.extractTransaction().toHex(),
      });
      if (res.status === 200) {
        const hash = await res.text();
        console.log('tx hash', hash);
        console.log('explorer link', `${explorer}/tx/${hash}`);
        console.log(
          'NOTE: it might take a minute for transaction to be included in mempool',
        );

        return hash
      } else {
        return res
      }
    } catch (e) {
      console.log('error broadcasting bitcoin tx', JSON.stringify(e));
    }
  },
};

export default bitcoin;

const bitcoinRpc = `https://blockstream.info/testnet/api`;
async function fetchTransaction(transactionId) {
  const data = await fetchJson(`${bitcoinRpc}/tx/${transactionId}`);
  const tx = new bitcoinJs.Transaction();

  tx.version = data.version;
  tx.locktime = data.locktime;

  data.vin.forEach((vin) => {
    const txHash = Buffer.from(vin.txid, 'hex').reverse();
    const vout = vin.vout;
    const sequence = vin.sequence;
    const scriptSig = vin.scriptsig
      ? Buffer.from(vin.scriptsig, 'hex')
      : undefined;
    tx.addInput(txHash, vout, sequence, scriptSig);
  });

  data.vout.forEach((vout) => {
    const value = vout.value;
    const scriptPubKey = Buffer.from(vout.scriptpubkey, 'hex');
    tx.addOutput(scriptPubKey, value);
  });

  data.vin.forEach((vin, index) => {
    if (vin.witness && vin.witness.length > 0) {
      const witness = vin.witness.map((w) => Buffer.from(w, 'hex'));
      tx.setWitness(index, witness);
    }
  });

  return tx;
}
