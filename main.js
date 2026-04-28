// Use dynamic imports for better error handling
async function init() {
  try {
    // Dynamic import to avoid module loading issues
    const { toggleConnect, connectWithProvider, switchToRitual, closeWalletModal, connectWallet } = await import('./services/wallet.js');
    const { executeMint } = await import('./services/mint.js');
    const { switchTab, updateFee, previewNFT } = await import('./ui/tabs.js');
    const { closeModal } = await import('./ui/modals.js');

    // Expose to window for HTML onclick handlers
    window.toggleConnect = toggleConnect;
    window.connectWithProvider = connectWithProvider;
    window.closeWalletModal = closeWalletModal;
    window.switchToRitual = switchToRitual;
    window.executeMint = executeMint;
    window.switchTab = switchTab;
    window.updateFee = updateFee;
    window.previewNFT = previewNFT;
    window.closeModal = closeModal;

    // Modal overlay click-to-close
    document.getElementById('walletModal').addEventListener('click', function(e) {
      if (e.target === this) closeWalletModal();
    });
    document.getElementById('successModal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });

    // Auto-reconnect on page load
    window.addEventListener('load', async () => {
      const anyProvider = window.ethereum || window.okxwallet;
      if (!anyProvider) {
        document.getElementById('noWalletAlert').classList.add('visible');
      }
      const ep = window.ethereum || window.okxwallet;
      if (ep && ep.selectedAddress) {
        await connectWallet(ep);
      }
    });
  } catch (err) {
    console.error('Failed to initialize app:', err);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
