(() => {
  const address = document.getElementById('upi-id');
  const button = document.getElementById('copy-upi');
  const status = document.getElementById('copy-status');

  button.addEventListener('click', async () => {
    status.textContent = '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address.value);
        status.textContent = 'UPI ID copied.';
        return;
      }
    } catch {
      // The browser can deny clipboard access even after a button press.
    }
    address.focus();
    address.select();
    status.textContent = 'Use your device’s Copy command on the selected ID.';
  });
  button.hidden = false;
})();
