import { RITUAL_CHAIN } from '../config/chain.js';

export function openSuccessModal(type, name, hash, blockNumber) {
  const explorerLink = `${RITUAL_CHAIN.explorer}/tx/${hash}`;
  document.getElementById('modalTitle').textContent =
    type === 'token' ? 'Token Minted! ⬡' : 'NFT Minted! ◈';
  document.getElementById('modalMsg').textContent =
    `"${name}" has been minted on Ritual Chain via X402 payment.\n` +
    `TEE verified the EIP-712 signature and included the transaction in block #${blockNumber}.`;
  document.getElementById('modalHash').innerHTML =
    `TX Hash:<br/><a href="${explorerLink}" target="_blank" rel="noopener">${hash}</a>`;
  document.getElementById('successModal').classList.add('open');
}

export function closeModal() {
  document.getElementById('successModal').classList.remove('open');
}
