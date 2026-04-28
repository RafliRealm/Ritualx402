import { RITUAL_CHAIN } from '../config/chain.js';

export const transactions = [];

export function addTx(hash, name, type, blockNum) {
  const empty = document.getElementById('txEmpty');
  if (empty) empty.remove();

  const list = document.getElementById('txList');
  const el   = document.createElement('div');
  el.className = 'tx-item';

  const badgeClass = type === 'nft' ? 'tx-badge nft' : 'tx-badge';
  const badgeLabel = type === 'nft' ? 'NFT' : 'TOKEN';
  const explorerLink = `${RITUAL_CHAIN.explorer}/tx/${hash}`;

  el.innerHTML = `
    <div class="tx-left">
      <a class="tx-hash" href="${explorerLink}" target="_blank" rel="noopener">
        ${hash.slice(0,14)}...${hash.slice(-8)}
      </a>
      <span class="tx-meta">${name} · X402 · Block #${blockNum} · ${new Date().toLocaleTimeString()}</span>
    </div>
    <span class="${badgeClass}">${badgeLabel}</span>
  `;

  list.prepend(el);
  transactions.unshift({ hash, name, type, blockNum });
}
