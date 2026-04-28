export function animateFlowStep(step) {
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById('fd' + i);
    if (i < step)      dot.className = 'flow-dot done';
    else if (i === step) dot.className = 'flow-dot active';
    else                 dot.className = 'flow-dot';
  }
}

export function setStatus(type, dotId, textId, state, msg) {
  const bar = document.getElementById(type + 'Status');
  const dot = document.getElementById(dotId);
  const txt = document.getElementById(textId);
  bar.classList.add('visible');
  dot.className = 'status-dot ' + state;
  txt.textContent = msg;
}
