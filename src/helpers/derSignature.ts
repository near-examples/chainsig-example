import { ethers } from 'ethers';
import { fetchJson } from './utils';
import { sign } from './near';
import * as bitcoinJs from 'bitcoinjs-lib';
import * as secp from '@bitcoinerlab/secp256k1';
console.log('ethers', ethers);

const compressPublicKey = (publicKey) => {
  if (publicKey.length === 65) {
    if (publicKey[0] !== 0x04) {
      throw new Error('Invalid uncompressed public key format');
    }
    return secp.pointCompress(publicKey, true);
  }
  return publicKey;
};

const bitcoin = {
  name: 'Bitcoin Testnet',
  currency: 'sats',
  explorer: 'https://blockstream.info/testnet',
  getBalance: async ({ address, getUtxos = false }) => {
    try {
      const res = await fetchJson(
        `https://blockstream.info/testnet/api/address/${address}/utxo`,
      );

      if (!res) return;

      let utxos = res.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
      }));

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
      console.log('e', e);
    }
  },
  send: async ({
    from: address,
    publicKey,
    to = 'n47ZTPR31eyi5SZNMbZQngJ4wiZMxXw1bS',
    amount = '1',
  }) => {
    console.log('send: async ({', address, publicKey);
    if (!address) return console.log('must provide a sending address');
    const { getBalance, explorer, currency } = bitcoin;
    const sats = parseInt(amount);

    const utxos = await getBalance({ address, getUtxos: true });

    if (!utxos) return;

    console.log('balance', utxos[0].value, currency);
    if (utxos[0].value < sats) {
      return console.log('insufficient funds');
    }
    console.log('sending', amount, currency, 'from', address, 'to', to);

    const psbt = new bitcoinJs.Psbt({ network: bitcoinJs.networks.testnet });
    let totalInput = 0;
    await Promise.all(
      utxos.map(async (utxo) => {
        totalInput += utxo.value;

        const transaction = await fetchTransaction(utxo.txid);
        let inputOptions;
        const output = transaction.outs[utxo.vout];
        const script = output.script;
        console.log(`UTXO Script for vout ${utxo.vout}:`, script.toString('hex'));

        if (script.includes('0014')) {
          inputOptions = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script,
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
        console.log('Input options:', inputOptions);

        psbt.addInput(inputOptions);
      }),
    );

    psbt.addOutput({
      address: to,
      value: sats,
    });

    const feeRate = await fetchJson(`${bitcoinRpc}/fee-estimates`);
    const estimatedSize = utxos.length * 148 + 2 * 34 + 10;
    console.log('estimatedSize', estimatedSize);
    const fee = estimatedSize * (feeRate[6] + 3);
    console.log('btc fee', fee);
    const change = totalInput - sats - fee;
    console.log('change leftover', change);
    if (change > 0) {
      psbt.addOutput({
        address: address,
        value: change,
      });
    }

    const compressedPublicKey = compressPublicKey(Buffer.from(publicKey, 'hex'));

    const keyPair = {
      publicKey: Buffer.from(compressedPublicKey), // Ensure publicKey is a Buffer
      sign: async (transactionHash) => {
        console.log('transactionHash', transactionHash);
        const payload = Object.values(ethers.utils.arrayify(transactionHash));
        console.log('Payload for signing:', payload);
        const sig = await sign(payload, "bitcoin,1");
        console.log('Signature:', sig, payload);
        if (!sig) return;

        // Convert r and s to Buffer
        const r = Buffer.from(sig.r, 'hex');
        const s = Buffer.from(sig.s, 'hex');
        const derSignature = bitcoinJs.script.signature.encode(
          // @ts-ignore
          { r, s },
          bitcoinJs.Transaction.SIGHASH_ALL
        );

        return Buffer.from(derSignature); // Ensure the signature is a Buffer
      },
    };

    console.log('Compressed Public Key:', keyPair.publicKey.toString('hex'));

    // Ensure publicKey is valid
    if (keyPair.publicKey.length !== 33) {
      throw new Error('Invalid public key length. Expected 33 bytes.');
    }

    await Promise.all(
      utxos.map(async (_, index) => {
        console.log(`Signing input ${index} with key ${keyPair.publicKey.toString('hex')}`);
        try {
          await psbt.signInputAsync(index, keyPair);
        } catch (e) {
          console.warn(`Failed to sign input ${index}:`, e.message);
        }
      }),
    );
    console.log('psbt', psbt);

    utxos.forEach((_, index) => {
      try {
        // @ts-ignore
        psbt.finalizeInput(index, (inputIndex, input) => {
          const inputOptions = psbt.data.inputs[inputIndex];
          if (inputOptions.witnessUtxo) {
            const p2wpkh = bitcoinJs.payments.p2wpkh({
              pubkey: keyPair.publicKey,
            });
            return {
              // @ts-ignore
              finalScriptWitness: bitcoinJs.payments.witnessStackToScriptWitness(p2wpkh.witness),
            };
          } else if (inputOptions.nonWitnessUtxo) {
            const p2pkh = bitcoinJs.payments.p2pkh({
              pubkey: keyPair.publicKey,
              network: bitcoinJs.networks.testnet,
            });
            return {
              finalScriptSig: bitcoinJs.script.compile([
                input.finalScriptSig,
                p2pkh.output,
              ]),
            };
          } else {
            throw new Error('Unknown UTXO type');
          }
        });
      } catch (e) {
        console.warn(`Failed to finalize input ${index}:`, e.message);
      }
    });

    try {
      console.log('blockstream body', psbt.extractTransaction().toHex());
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
      }
      return res;
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

