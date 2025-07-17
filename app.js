// Konfiguracja adresów kontraktów
const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0"; // Claim 100 HI

let provider;
let signer;
let userAddress;

// ABI kontraktu GM
const gmABI = [
  "function gm() public returns (string memory)"
];

// ABI kontraktu HI (claim)
const hiABI = [
  "function claim() public"
];

// Połączenie z portfelem
async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("wallet-address").innerText = `🟢 ${userAddress}`;
  } else {
    alert("MetaMask not detected!");
  }
}

// Greet Onchain z gasLimit
async function greetOnchain() {
  try {
    if (!signer) return alert("Connect your wallet first");

    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const tx = await contract.gm({ gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Greeted onchain!";
    animateLogo();
  } catch (err) {
    console.error("Greet error:", err);
    document.getElementById("status").innerText = "❌ Failed to send GM. Check wallet or try again.";
  }
}

// Claim 100 HI
async function claimHI() {
  try {
    if (!signer) return alert("Connect your wallet first");

    const contract = new ethers.Contract(HI_CONTRACT, hiABI, signer);
    const tx = await contract.claim({ gasLimit: 150000 });
    await tx.wait();

    document.getElementById("status").innerText = "✅ Claimed 100 HI!";
    animateLogo();
  } catch (err) {
    console.error("Claim error:", err);
    document.getElementById("status").innerText = "❌ Failed to claim HI.";
  }
}

// Animacja logo po sukcesie
function animateLogo() {
  const logo = document.getElementById("logo");
  if (!logo) return;

  logo.classList.add("pulse");
  setTimeout(() => logo.classList.remove("pulse"), 1000);
}

// Przypnij event listenery
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton")?.addEventListener("click", connectWallet);
  document.getElementById("gmButton")?.addEventListener("click", greetOnchain);
  document.getElementById("claimButton")?.addEventListener("click", claimHI);
});
