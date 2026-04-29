import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js';
import { getProvider, getAddress, getChainId } from './wallet.js';

let blockInterval = null;

export async function updateChainInfo() {
  // FIX BUG #4: clear interval di AWAL, bukan di akhir, agar tidak ada multiple interval
  if (blockInterval) {
    clearInterval(blockInterval);
    blockInterval = null;
  }

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

  // Set interval baru setelah selesai
  blockInterval = setInterval(updateChainInfo, 8000);
}
