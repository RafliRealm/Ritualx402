// Use dynamic imports for better error handling
async function init() {
  try {
    console.log('🚀 Initializing RitualX402 app...');
    
    // Dynamic import to avoid module loading issues
    const { toggleConnect, connectWithProvider, switchToRitual, closeWalletModal, connectWallet } = await import('./services/wallet.js');
    const { executeMint } = await import('./services/mint.js');
    const { switchTab, updateFee, previewNFT } = await import('./ui/tabs.js');
    const { closeModal } = await import('./ui/modals.js');

    console.log('✅ All modules loaded successfully');

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

    console.log('✅ Functions exposed to window');

    // Modal overlay click-to-close
    const walletModal = document.getElementById('walletModal');
    const successModal = document.getElementById('successModal');
    
    if (walletModal) {
      walletModal.addEventListener('click', function(e) {
        if (e.target === this) closeWalletModal();
      });
    }
    
    if (successModal) {
      successModal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
      });
    }

    // Auto-reconnect on page load
    window.addEventListener('load', async () => {
      const anyProvider = window.ethereum || window.okxwallet;
      if (!anyProvider) {
        const noWalletAlert = document.getElementById('noWalletAlert');
        if (noWalletAlert) noWalletAlert.classList.add('visible');
      }
      const ep = window.ethereum || window.okxwallet;
      if (ep && ep.selectedAddress) {
        console.log('🔄 Auto-reconnecting to wallet...');
        await connectWallet(ep);
      }
    });
    
    console.log('✅ RitualX402 app initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize app:', err);
    console.error('Stack:', err.stack);
    // Show error alert to user
    const errorMsg = err.message || 'Unknown error during initialization';
    alert('Failed to load app: ' + errorMsg);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
