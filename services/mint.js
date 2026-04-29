import { RITUAL_CHAIN } from '../config/chain.js';
import { X402_CONFIG } from '../config/x402.js';
import { getSigner, getAddress, getIsConnected, getChainId,
         connectWallet, switchToRitual } from './wallet.js';
import { buildX402Payload } from './x402.js';
import { updateChainInfo } from './chain.js';
import { setStatus, animateFlowStep } from '../ui/flow-stepper.js';
import { addTx } from '../ui/tx-list.js';
import { openSuccessModal } from '../ui/modals.js';
import { wait, encodeMetadataHex } from '../utils/helpers.js';

/**
 * sendX402Transaction — sends the on-chain transaction to Ritual Chain.
 * Value = mint fee (RITUAL). Data field carries JSON-encoded mint metadata.
 */
async function sendX402Transaction(type, params, feeWei, x402Payload) {
  const signer = getSigner();
  const metadataHex = encodeMetadataHex({
    x402:     true,
    resource: x402Payload.payload.authorization.resource,
    type,
    params,
    nonce:    x402Payload.payload.authorization.nonce,
    deadline: x402Payload.payload.authorization.deadline,
  });

  return await signer.sendTransaction({
    to:      X402_CONFIG.treasury,
    value:   feeWei,
    data:    metadataHex,
    chainId: RITUAL_CHAIN.chainId,
  });
}

/**
 * executeMint — main 5-step X402 mint orchestrator.
 */
export async function executeMint(type) {
  // FIX BUG #3: support OKX wallet dan wallet lain, bukan hanya window.ethereum
  const anyProvider = window.ethereum || window.okxwallet;
  if (!anyProvider) {
    document.getElementById('noWalletAlert').classList.add('visible');
    return;
  }

  if (!getIsConnected()) {
    await connectWallet(anyProvider);
    if (!getIsConnected()) return;
  }

  if (getChainId() !== RITUAL_CHAIN.chainId) {
    await switchToRitual();
    if (getChainId() !== RITUAL_CHAIN.chainId) return;
  }

  const btn      = document.getElementById(type + 'MintBtn');
  const resource = type === 'token' ? '/v1/mint/token' : '/v1/mint/nft';

  // FIX BUG #6: snapshot feeWei sekali agar tidak berubah jika slider digerak saat proses
  const feeWei = type === 'token'
    ? X402_CONFIG.mintFeeToken
    : X402_CONFIG.mintFeeNFT;

  const params = collectParams(type);
  btn.disabled = true;

  try {
    // Step 1
    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      `→ [1/5] Sending mint request to ${resource}...`);
    animateFlowStep(1);
    await wait(400);

    // Step 2
    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      '← [2/5] HTTP 402 Payment Required received from server');
    animateFlowStep(2);
    await wait(400);

    // Step 3 — EIP-712 sign
    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      '⟳ [3/5] Building X402 payment payload — please sign in wallet...');
    btn.innerHTML = `<span class="btn-icon">✍</span> Sign Payment in Wallet...`;
    animateFlowStep(3);

    const x402Payload = await buildX402Payload(resource, feeWei);

    // Show payload (sudah JSON-safe karena value sudah string)
    const payloadViewer = document.getElementById(type + 'PayloadViewer');
    const payloadLabel  = document.getElementById(type + 'PayloadLabel');
    payloadLabel.style.display = 'block';
    payloadViewer.classList.add('visible');
    payloadViewer.textContent = JSON.stringify(x402Payload, null, 2);

    await wait(300);

    // Step 4
    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      '⟳ [4/5] TEE executor verifying payment at 0x0801...');
    btn.innerHTML = `<span class="btn-icon">⟳</span> TEE Verifying...`;
    animateFlowStep(4);
    await wait(600);

    // Step 5 — on-chain tx
    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      `⟳ [5/5] Submitting transaction to Ritual Chain (ID: ${RITUAL_CHAIN.chainId})...`);
    btn.innerHTML = `<span class="btn-icon">⟳</span> Confirm in Wallet...`;
    animateFlowStep(5);

    const tx = await sendX402Transaction(type, params, feeWei, x402Payload);

    setStatus(type, type+'StatusDot', type+'StatusText', 'pending',
      '⏳ Transaction submitted — waiting for confirmation...');
    btn.innerHTML = `<span class="btn-icon">⟳</span> Waiting for Block...`;

    const receipt = await tx.wait(1);
    const hash    = receipt.hash || tx.hash;

    setStatus(type, type+'StatusDot', type+'StatusText', 'success',
      `✓ Confirmed in block #${receipt.blockNumber} · TX: ${hash.slice(0,16)}...`);

    addTx(hash, params.name, type, receipt.blockNumber);
    updateChainInfo();
    openSuccessModal(type, params.name, hash, receipt.blockNumber);

  } catch (err) {
    console.error(err);
    let msg = err.message || 'Unknown error';
    if (err.code === 4001 || err.code === 'ACTION_REJECTED')
      msg = 'Transaction rejected by user.';
    else if (msg.includes('insufficient funds'))
      msg = 'Insufficient RITUAL balance. Get tokens from the faucet.';
    else if (msg.includes('network'))
      msg = 'Network error. Check your RPC connection.';

    setStatus(type, type+'StatusDot', type+'StatusText', 'error', '✗ Failed: ' + msg);
  } finally {
    btn.disabled = false;
    btn.innerHTML = type === 'token'
      ? `<span class="btn-icon">⬡</span> Mint Token via X402`
      : `<span class="btn-icon">◈</span> Mint NFT via X402`;
  }
}

function collectParams(type) {
  const address = getAddress();
  if (type === 'token') {
    const recipient = document.getElementById('tokenRecipient').value.trim() || address;
    return {
      name:      document.getElementById('tokenName').value     || 'Unnamed Token',
      symbol:    document.getElementById('tokenSymbol').value   || 'UNK',
      supply:    document.getElementById('tokenSupply').value   || '1000000',
      decimals:  document.getElementById('tokenDecimals').value || '18',
      recipient,
    };
  }
  const recipient = document.getElementById('nftRecipient').value.trim() || address;
  return {
    name:        document.getElementById('nftName').value       || 'Unnamed NFT',
    description: document.getElementById('nftDesc').value       || '',
    collection:  document.getElementById('nftCollection').value || 'RitualGenesis',
    royalty:     document.getElementById('nftRoyalty').value    || '0',
    recipient,
  };
}
