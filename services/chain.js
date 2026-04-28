// ethers is already loaded as global in index.html
const { ethers } = window;

import { getProvider, getAddress, getChainId } from './wallet.js';

let blockInterval = null;

async function updateChainInfoOnce() {
  const provider = getProvider();
  if (!provider) return;
  try {
    const block = await provider.getBlockNumber();
    document.getElementById('ciBlock').textContent = '#' + block.toLocaleString();

    const chainId = getChainId();
    if (chainId) {
      document.getElementById('ciChainId').textContent =
        `${chainId} (0x${chainId.toString(16).toUpperCase()})`;
    }

    const address = getAddress();
    if (address) {
      const bal = await provider.getBalance(address);
      const balTrunc = parseFloat(ethers.formatEther(bal)).toFixed(4);
      document.getElementById('ciBalance').textContent = balTrunc + ' RITUAL';
      document.getElementById('balanceBadge').textContent = balTrunc + ' RITUAL';
    }
  } catch (_) {
    // silent fail on poll
  }
}

export async function updateChainInfo() {
  // Clear any existing interval to prevent duplicates
  if (blockInterval) clearInterval(blockInterval);
  // Update immediately
  await updateChainInfoOnce();
  // Then set new interval
  blockInterval = setInterval(updateChainInfoOnce, 8000);
}

export function stopChainInfoUpdates() {
  if (blockInterval) {
    clearInterval(blockInterval);
    blockInterval = null;
  }
}
