// Ensure ethers is loaded before we import modules
async function waitForEthers(maxWait = 5000) {
  const startTime = Date.now();
  while (!window.ethers) {
    if (Date.now() - startTime > maxWait) {
      throw new Error('ethers library did not load within ' + maxWait + 'ms');
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Clear the timeout from index.html if it exists
  if (window.ethersLoadTimeout) {
    clearTimeout(window.ethersLoadTimeout);
  }
}

// Provide fallback functions while modules load
function setupFallbackFunctions() {
  console.log('📌 Setting up fallback functions...');
  
  window.toggleConnect = async function() {
    console.warn('⏳ App still initializing, please wait...');
    const retries = 50;
    for (let i = 0; i < retries; i++) {
      if (window.toggleConnect.isReady) break;
      await new Promise(r => setTimeout(r, 100));
    }
    if (window.toggleConnect.isReady) {
      return window.toggleConnect();
    }
    alert('App is still loading. Please try again in a moment.');
  };
  
  window.switchTab = function(tab, btn) {
    if (typeof btn?.classList === 'object') {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('panel-' + tab);
      if (panel) panel.classList.add('active');
      if (btn) btn.classList.add('active');
    }
  };
  
  window.switchTab.isReady = false;
  window.toggleConnect.isReady = false;
  window.executeMint = () => alert('App is still loading...');
  window.updateFee = () => {};
  window.previewNFT = () => {};
  window.closeModal = () => {};
  window.connectWithProvider = () => alert('App is still loading...');
  window.closeWalletModal = () => {};
  window.switchToRitual = () => alert('App is still loading...');
}

// Use dynamic imports for better error handling
async function init() {
  try {
    console.log('🚀 Initializing RitualX402 app...');
    
    // Setup fallback functions first
    setupFallbackFunctions();
    
    // Wait for ethers to be available on window
    await waitForEthers();
    console.log('✅ ethers.js loaded on window:', typeof window.ethers);
    
    // Dynamic import to avoid module loading issues
    console.log('📦 Loading modules...');
    const [
      walletModule, 
      mintModule, 
      tabsModule, 
      modalsModule
    ] = await Promise.all([
      import('./services/wallet.js').catch(e => {
        console.error('❌ Failed to load wallet module:', e);
        throw e;
      }),
      import('./services/mint.js').catch(e => {
        console.error('❌ Failed to load mint module:', e);
        throw e;
      }),
      import('./ui/tabs.js').catch(e => {
        console.error('❌ Failed to load tabs module:', e);
        throw e;
      }),
      import('./ui/modals.js').catch(e => {
        console.error('❌ Failed to load modals module:', e);
        throw e;
      })
    ]);
    
    const { toggleConnect, connectWithProvider, switchToRitual, closeWalletModal, connectWallet } = walletModule;
    const { executeMint } = mintModule;
    const { switchTab, updateFee, previewNFT } = tabsModule;
    const { closeModal } = modalsModule;

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
    
    // Mark functions as ready
    Object.keys(window).forEach(key => {
      if (typeof window[key] === 'function' && key.includes('toggle|execute|switch|update|preview|close|connect')) {
        if (window[key].isReady !== undefined) window[key].isReady = true;
      }
    });

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
    alert('Failed to load app: ' + errorMsg + '\n\nPlease refresh the page.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
