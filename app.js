
const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
const gmContractAddress = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const gmABI = [{"inputs":[],"name":"gm","outputs":[],"stateMutability":"nonpayable","type":"function"}, {"inputs":[],"name":"gmCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

const hiTokenAddress = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";
const hiABI = [{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"}];

async function connectWallet() {
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  document.getElementById("status").textContent = "Wallet connected!";
}

async function sayGM() {
  if (!signer) return alert("Please connect wallet first.");
  const gmContract = new ethers.Contract(gmContractAddress, gmABI, signer);
  try {
    const tx = await gmContract.gm();
    await tx.wait();
    updateGMCount();
    document.getElementById("status").textContent = "GM sent!";
  } catch (err) {
    document.getElementById("status").textContent = "GM failed.";
    console.error(err);
  }
}

async function updateGMCount() {
  const contract = new ethers.Contract(gmContractAddress, gmABI, provider);
  const count = await contract.gmCount();
  document.getElementById("gmCount").textContent = "Total GMs: " + count;
}

async function claimHI() {
  if (!signer) return alert("Please connect wallet first.");
  const hiContract = new ethers.Contract(hiTokenAddress, hiABI, signer);
  try {
    const tx = await hiContract.claim();
    await tx.wait();
    document.getElementById("status").textContent = "100 HI claimed!";
  } catch (err) {
    document.getElementById("status").textContent = "Claim failed.";
    console.error(err);
  }
}

document.getElementById("connectWallet").onclick = connectWallet;
document.getElementById("sayGM").onclick = sayGM;
document.getElementById("claimButton").onclick = claimHI;
window.onload = updateGMCount;
