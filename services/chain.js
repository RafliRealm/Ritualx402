// FIX BUG A: HAPUS import dari wallet.js untuk memutus circular dependency.
// wallet.js -> chain.js -> wallet.js = circular = module undefined saat load.
// Solusi: updateChainInfo menerima provider dan address sebagai parameter langsung.
import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.esm.min.js';

let blockInterval = null;

export async function updateChainInfo(provider, address, chainId) {
  // FIX: clear interval di awal agar tidak menumpuk
  if (blockInterval) {
    clearInterval(blockInterval);
    blockInterval = null;
  }

  if (!provider) return;

  try {
    const block = await provider.getBlockNumber();
    const elBlock = document.getElementById('ciBlock');
    if (elBlock) elBlock.textContent = '#' + block.toLocaleString();

    if (chainId) {
      const elChain = document.getElementById('ciChainId');
      if (elChain) elChain.textContent =
        `${chainId} (0x${chainId.toString(16).toUpperCase()})`;
    }

    if (address) {
      const bal = await provider.getBalance(address);
      const balTrunc = parseFloat(ethers.formatEther(bal)).toFixed(4);
      const elBal = document.getElementById('ciBalance');
      const elBadge = document.getElementById('balanceBadge');
      if (elBal) elBal.textContent = balTrunc + ' RITUAL';
      if (elBadge) elBadge.textContent = balTrunc + ' RITUAL';
    }
  } catch (_) {
    // silent fail on poll
  }

  // Simpan closure untuk interval berikutnya
  blockInterval = setInterval(() => updateChainInfo(provider, address, chainId), 8000);
}
