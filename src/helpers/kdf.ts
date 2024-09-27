import { base_decode } from 'near-api-js/lib/utils/serialize';
import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';
import hash from 'hash.js';
import bs58check from 'bs58check';
import { bech32 } from 'bech32'

export function najPublicKeyStrToUncompressedHexPoint(
  najPublicKeyStr: string
): string {
  const decodedKey = base_decode(najPublicKeyStr.split(':')[1]!);
  return '04' + Buffer.from(decodedKey).toString('hex');
}

export function najPublicKeyStrToCompressedPoint(najPublicKeyStr: string): string {
  const ec = new EC('secp256k1');
  
  // Decode the key from base58, then convert to a hex string
  const decodedKey = base_decode(najPublicKeyStr.split(':')[1]!);
  
  // Check if the key is already in uncompressed format
  if (decodedKey.length === 64) {
    // If it's a raw 64-byte key, we must assume it's uncompressed and manually prepend '04' (uncompressed prefix)
    const uncompressedKey = '04' + Buffer.from(decodedKey).toString('hex');
    
    // Create a key pair from the uncompressed key
    const keyPoint = ec.keyFromPublic(uncompressedKey, 'hex').getPublic();
    
    // Return the compressed public key as a hex string
    return keyPoint.encodeCompressed('hex');
  } else {
    throw new Error('Unexpected key length. Expected uncompressed key format.');
  }
}

export async function deriveChildPublicKey(
  parentCompressedPublicKeyHex: string,
  signerId: string,
  path: string = ''
): Promise<string> {
  const ec = new EC('secp256k1');
  const scalarHex = sha3_256(
    `near-mpc-recovery v0.1.0 epsilon derivation:${signerId},${path}`
  );

  // Decode compressed public key
  const keyPoint = ec.keyFromPublic(parentCompressedPublicKeyHex, 'hex').getPublic();

  // Multiply the scalar by the generator point G
  const scalarTimesG = ec.g.mul(scalarHex);

  // Add the result to the old public key point
  const newPublicKeyPoint = keyPoint.add(scalarTimesG);

  // Return the new compressed public key
  return newPublicKeyPoint.encodeCompressed('hex');
}

export async function deriveChildPublicKeyX(
  parentUncompressedPublicKeyHex: string,
  signerId: string,
  path: string = ''
): Promise<string> {
  const ec = new EC('secp256k1');
  const scalarHex = sha3_256(
    `near-mpc-recovery v0.1.0 epsilon derivation:${signerId},${path}`
  );

  const x = parentUncompressedPublicKeyHex.substring(2, 66);
  const y = parentUncompressedPublicKeyHex.substring(66);

  // Create a point object from X and Y coordinates
  const oldPublicKeyPoint = ec.curve.point(x, y);

  // Multiply the scalar by the generator point G
  const scalarTimesG = ec.g.mul(scalarHex);

  // Add the result to the old public key point
  const newPublicKeyPoint = oldPublicKeyPoint.add(scalarTimesG);
  const newX = newPublicKeyPoint.getX().toString('hex').padStart(64, '0');
  const newY = newPublicKeyPoint.getY().toString('hex').padStart(64, '0');
  return '04' + newX + newY;
}

export async function uncompressedHexPointToBtcAddress(
  uncompressedHexPoint: string,
  networkByte: Buffer
): Promise<string> {
  // Step 1: SHA-256 hashing of the public key
  const publicKeyBytes = Uint8Array.from(Buffer.from(uncompressedHexPoint, 'hex'));
  const sha256HashOutput = await crypto.subtle.digest('SHA-256', publicKeyBytes);

  // Step 2: RIPEMD-160 hashing on the result of SHA-256
  const ripemd160 = hash.ripemd160().update(Buffer.from(sha256HashOutput)).digest();

  // Step 3: Adding network byte (0x00 for Bitcoin Mainnet, 0x6f for Testnet)
  const networkByteAndRipemd160 = Buffer.concat([networkByte, Buffer.from(ripemd160)]);

  // Step 4: Base58Check encoding
  return bs58check.encode(networkByteAndRipemd160);
}

export async function generateBtcAddressX({
  publicKey,
  accountId,
  path = '',
  isTestnet = true
}: {
  publicKey: string;
  accountId: string;
  path?: string;
  isTestnet?: boolean;
}): Promise<{ address: string; publicKey: string }> {
  const childPublicKey = await deriveChildPublicKey(
    najPublicKeyStrToUncompressedHexPoint(publicKey),
    accountId,
    path
  );

  const networkByte = Buffer.from([isTestnet ? 0x6f : 0x00]); // 0x00 for mainnet, 0x6f for testnet
  const address = await uncompressedHexPointToBtcAddress(childPublicKey, networkByte);

  return {
    address,
    publicKey: childPublicKey
  };
}

export async function uncompressedHexPointToSegwitAddress(
  uncompressedHexPoint: string,
  networkPrefix: string
): Promise<string> {
  const publicKeyBytes = Uint8Array.from(Buffer.from(uncompressedHexPoint, 'hex'));
  const sha256HashOutput = await crypto.subtle.digest('SHA-256', publicKeyBytes);

  const ripemd160 = hash.ripemd160().update(Buffer.from(sha256HashOutput)).digest();

  const witnessVersion = 0x00; // for P2PWPKH
  // @ts-ignore
  const words = bech32.toWords(Buffer.from(ripemd160));
  words.unshift(witnessVersion);
  // @ts-ignore
  const address = bech32.encode(networkPrefix, words);

  return address;
}

export async function generateBtcAddress({
  publicKey,
  accountId,
  path = '',
  isTestnet = true,
  addressType = 'p2wpkh'
}: {
  publicKey: string;
  accountId: string;
  path?: string;
  isTestnet?: boolean;
  addressType?: 'p2pkh' | 'p2wpkh';
}): Promise<{ address: string; publicKey: string }> {
  const childPublicKey = await deriveChildPublicKey(
    najPublicKeyStrToCompressedPoint(publicKey),  // Use the compressed key
    accountId,
    path
  );

  let address: string;

  if (addressType === 'p2pkh') {
    const networkByte = Buffer.from([isTestnet ? 0x6f : 0x00]); // 0x00 for mainnet, 0x6f for testnet
    address = await uncompressedHexPointToBtcAddress(childPublicKey, networkByte);
  } else if (addressType === 'p2wpkh') {
    const networkPrefix = isTestnet ? 'tb' : 'bc';
    address = await uncompressedHexPointToSegwitAddress(childPublicKey, networkPrefix);
  } else {
    throw new Error(`Unsupported address type: ${addressType}`);
  }

  return {
    address,
    publicKey: childPublicKey
  };
}