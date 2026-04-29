import { toggleConnect, connectWithProvider, switchToRitual,
         closeWalletModal, connectWallet } from './services/wallet.js';
import { executeMint } from './services/mint.js';
import { switchTab, updateFee, previewNFT } from './ui/tabs.js';
import { closeModal } from './ui/modals.js';

// ── Expose ke HTML onclick attributes
window.toggleConnect       = toggleConnect;
window.connectWithProvider = connectWithProvider;
window.closeWalletModal    = closeWalletModal;
window.switchToRitual      = switchToRitual;
window.executeMint         = executeMint;
window.switchTab           = switchTab;
window.updateFee           = updateFee;
window.previewNFT          = previewNFT;
window.closeModal          = closeModal;

// ── Modal overlay click-to-close
document.getElementById('walletModal').addEventListener('click', function(e) {
  if (e.target === this) closeWalletModal();
});
document.getElementById('successModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── Auto-reconnect on page load
// FIX BUG #3: gunakan anyProvider, bukan hanya window.ethereum
window.addEventListener('load', () => {
  const anyProvider = window.ethereum || window.okxwallet;

  if (!anyProvider) {
    document.getElementById('noWalletAlert').classList.add('visible');
    return;
  }

  // Auto-reconnect jika sudah pernah connect sebelumnya
  if (anyProvider.selectedAddress) {
    connectWallet(anyProvider);
  }
});
