import { RITUAL_CHAIN } from '../config/chain.js';
import { X402_CONFIG } from '../config/x402.js';
import { getSigner, getAddress } from './wallet.js';

/**
 * buildX402Payload — constructs the X402 payment authorization object.
 * Follows EIP-3009 / x402 V2 spec:
 *   X-PAYMENT: base64(JSON({ x402Version, scheme, network, payload, signature }))
 */
export async function buildX402Payload(resource, feeWei) {
  const signer  = getSigner();
  const address = getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 60;
  const nonce    = window.ethers.hexlify(window.ethers.randomBytes(32));

  const domain = {
    name: 'X402Payment',
    version: '2',
    chainId: RITUAL_CHAIN.chainId,
  };

  const types = {
    PaymentAuthorization: [
      { name: 'from',     type: 'address' },
      { name: 'to',       type: 'address' },
      { name: 'value',    type: 'uint256' },
      { name: 'nonce',    type: 'bytes32' },
      { name: 'deadline', type: 'uint256' },
      { name: 'resource', type: 'string'  },
    ],
  };

  const message = {
    from:     address,
    to:       X402_CONFIG.treasury,
    value:    feeWei,
    nonce,
    deadline,
    resource,
  };

  const signature = await signer.signTypedData(domain, types, message);

  return {
    x402Version: 1,
    scheme: 'exact',
    network: `eip155:${RITUAL_CHAIN.chainId}`,
    payload: {
      signature,
      authorization: {
        from:  address,
        to:    X402_CONFIG.treasury,
        value: feeWei.toString(),
        nonce,
        deadline,
        resource,
      },
    },
  };
}
