import { X402_CONFIG } from '../config/x402.js';

export function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  btn.classList.add('active');
}

export function updateFee(v) {
  const fee = (0.001 * v).toFixed(3);
  X402_CONFIG.mintFeeTokenEth = fee;
  document.getElementById('feeLabel').textContent = fee;
  document.getElementById('tokenFeeDisplay').textContent = fee + ' RITUAL';
  document.getElementById('feeRangeVal').textContent = v + '×';
  // Trigger fee getter recalculation for mintFeeToken
  const updatedFeeWei = X402_CONFIG.mintFeeToken;
  console.log('Fee updated to:', fee, 'RITUAL (' + updatedFeeWei + ' Wei)');
}

export function previewNFT(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('nftPreview');
    prev.innerHTML = `
      <img src="${e.target.result}" alt="NFT Preview"/>
      <div class="preview-overlay"><span>◈</span><span>Change image</span></div>
    `;
    prev.classList.add('has-image');
    prev.onclick = () => document.getElementById('nftImageInput').click();
  };
  reader.readAsDataURL(input.files[0]);
}
