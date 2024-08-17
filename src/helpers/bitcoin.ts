import { ethers } from 'ethers';
import { fetchJson } from './utils';
import { sign } from './near';
import * as bitcoinJs from 'bitcoinjs-lib';
const secp256k1 = require('secp256k1')
// function convertToDER(r, s) {
//   let rBuf = Buffer.from(r, 'hex');
//   let sBuf = Buffer.from(s, 'hex');

//   // Add padding if necessary to ensure r and s are 32 bytes
//   if (rBuf.length > 32) {
//     rBuf = rBuf.slice(rBuf.length - 32);
//   } else if (rBuf.length < 32) {
//     const pad = Buffer.alloc(32 - rBuf.length, 0);
//     rBuf = Buffer.concat([pad, rBuf]);
//   }

//   if (sBuf.length > 32) {
//     sBuf = sBuf.slice(sBuf.length - 32);
//   } else if (sBuf.length < 32) {
//     const pad = Buffer.alloc(32 - sBuf.length, 0);
//     sBuf = Buffer.concat([pad, sBuf]);
//   }

//   // Direct concatenation for raw signature (64 bytes)
//   const rawSignature = Buffer.concat([rBuf, sBuf]);

//   // Return raw signature if required by the signing function
//   if (rawSignature.length === 64) {
//     return rawSignature.toString('hex');
//   }

//   // DER encode the r and s if necessary (not typical for Bitcoin's signature)
//   let rEncoded = rBuf;
//   if (rEncoded[0] & 0x80) {
//     rEncoded = Buffer.concat([Buffer.from([0x00]), rEncoded]);
//   }
//   rEncoded = Buffer.concat([Buffer.from([0x02, rEncoded.length]), rEncoded]);

//   let sEncoded = sBuf;
//   if (sEncoded[0] & 0x80) {
//     sEncoded = Buffer.concat([Buffer.from([0x00]), sEncoded]);
//   }
//   sEncoded = Buffer.concat([Buffer.from([0x02, sEncoded.length]), sEncoded]);

//   const derEncoded = Buffer.concat([
//     Buffer.from([0x30, rEncoded.length + sEncoded.length]),
//     rEncoded,
//     sEncoded,
//   ]);

//   return derEncoded.toString('hex');
// }

const constructPsbt = async (
  address,
  to,
  amount
) => {
  if (!address) return console.log('must provide a sending address');
  
  const { getBalance, explorer } = bitcoin;
  const sats = parseInt(amount);

  // Get UTXOs
  const utxos = await getBalance({ address, getUtxos: true });
  if (!utxos) return;
  
  // Check balance (TODO include fee in check)
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

      const scriptHex = transaction.outs[utxo.vout].script.toString('hex');
      console.log(`UTXO script type: ${scriptHex}`);

      if (scriptHex.startsWith('76a914')) {
        console.log('legacy');
        const nonWitnessUtxo = await fetch(`${bitcoinRpc}/tx/${utxo.txid}/hex`).then(result => result.text())

        console.log('nonWitnessUtxo hex:', nonWitnessUtxo)
        // Legacy P2PKH input (non-SegWit)
        inputOptions = {
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(nonWitnessUtxo, 'hex'), // Provide the full transaction hex
          // nonWitnessUtxo,
          // sequence: 4294967295, // Enables RBF
        };
      } else if (scriptHex.startsWith('0014')) {
        console.log('segwit');

        // P2WPKH (SegWit) input
        inputOptions = {
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: transaction.outs[utxo.vout].script,
            value: utxo.value,
          },
        };
      } else if (scriptHex.startsWith('0020') || scriptHex.startsWith('5120')) {
        console.log('taproot');

        // Taproot (P2TR) input
        inputOptions = {
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: transaction.outs[utxo.vout].script,
            value: utxo.value,
          },
          tapInternalKey: 'taprootInternalPubKey' // Add your Taproot internal public key here
        };
      } else {
        throw new Error('Unknown script type');
      }

      // Add the input to the PSBT
      psbt.addInput(inputOptions);
    })
  );

  // Add output to the recipient
  psbt.addOutput({
    address: to,
    value: sats,
  });

  // Calculate fee (replace with real fee estimation)
  const feeRate = await fetchJson(`${bitcoinRpc}/fee-estimates`);
  const estimatedSize = utxos.length * 148 + 2 * 34 + 10;
  const fee = estimatedSize * (feeRate[6] + 3);
  const change = totalInput - sats - fee;

  // Add change output if necessary
  if (change > 0) {
    psbt.addOutput({
      address: address,
      value: Math.floor(change),
    });
  }

  // Return the constructed PSBT and UTXOs for signing
  return [utxos, psbt, explorer];
};



export const bitcoin = {
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
    const result = await constructPsbt(address, to, amount)
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

    await psbt.signAllInputsAsync(keyPair)

    // await Promise.all(
    //   utxos.map(async (_, index) => {
    //     try {
    //       await psbt.signInputAsync(index, keyPair);
    //     } catch (e) {
    //       console.warn(e, 'not signed');
    //     }
    //   }),
    // );
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
    const result = await constructPsbt(address, to, amount)
    if (!result) return
    const [utxos, psbt, explorer] = result;

    /* 
      sig object format on v1.signer-dev.testnet 
      {
          "big_r": {
              "affine_point": "0326A048E88A80CCE88AA8D6D529C00E287B8E92A38338F365D32D9A4B74E4C9AF"
          },
          "s": {
              "scalar":       "618E0304CE060E5DE4F2EF978E7E7F72B0C313540C1B59B5E3F3B260B163CEF0"
          },
          "recovery_id": 1
      }
    */

    const keyPair = {
      publicKey: Buffer.from(publicKey, 'hex'),
      sign: (transactionHash) => {
        const rHex = sig.big_r.affine_point.slice(2); // Remove the "03" prefix
        let sHex = sig.s.scalar;
        console.log('signature', sig)
        // Pad s if necessary
        if (sHex.length < 64) {
          sHex = sHex.padStart(64, '0');
        }
        
        const rBuf = Buffer.from(rHex, 'hex');
        const sBuf = Buffer.from(sHex, 'hex');
        // const v = Buffer.from('0', 'hex');

        // Combine r and s
        const rawSignature = Buffer.concat([rBuf, sBuf]);

        recoverPubkeyFromSignature(transactionHash, rawSignature)

        return rawSignature;
      },
    };

    await Promise.all(
      utxos.map(async (_, index) => {
        console.log('utxo:', _)
        try {
          await psbt.signInputAsync(index, keyPair);
        } catch (e) {
          console.warn(e, 'not signed');
        }
      }),
    );

    // await psbt.signAllInputsAsync(keyPair)
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

export const recoverPubkeyFromSignature = (transactionHash, rawSignature) => {
  [0,1].forEach(num => {
    const recoveredPubkey = secp256k1.recover(
      transactionHash, // 32 byte hash of message
      rawSignature, // 64 byte signature of message (not DER, 32 byte R and 32 byte S with 0x00 padding)
      num, // number 1 or 0. This will usually be encoded in the base64 message signature
      false, // true if you want result to be compressed (33 bytes), false if you want it uncompressed (65 bytes) this also is usually encoded in the base64 signature
    );
    console.log('recoveredPubkey', recoveredPubkey)
  })
}