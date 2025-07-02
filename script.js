
async function sendGM() {
  const gmInput = document.getElementById('gm-input').value;
  if (!gmInput) return alert("Please write something!");
  const gmHistory = document.getElementById('gm-history');
  const time = new Date().toLocaleTimeString();
  gmHistory.innerHTML = `<p>${gmInput} - ${time}</p>` + gmHistory.innerHTML;
}
