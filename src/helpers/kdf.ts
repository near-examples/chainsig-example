import { base_decode } from 'near-api-js/lib/utils/serialize';
import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';
import hash from 'hash.js';
import bs58check from 'bs58check';

export function najPublicKeyStrToUncompressedHexPoint(
  najPublicKeyStr: string
): string {
  const decodedKey = base_decode(najPublicKeyStr.split(':')[1]!);
  return '04' + Buffer.from(decodedKey).toString('hex');
}

export async function deriveChildPublicKey(
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

export async function generateBtcAddress({
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
