
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
let signer;
let userAddress;

const GM_CONTRACT = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const HI_TOKEN_CONTRACT = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";

const gmABI = [
  "function gm() public",
  "function getGMCount(address) view returns (uint256)",
  "function lastGmAt(address) view returns (uint256)"
];

const hiABI = [
  "function claim() public",
  "function claimed(address) view returns (bool)"
];

async function connectWallet() {
  try {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("status").innerText = `Connected: ${userAddress}`;
    updateGMCount();
  } catch (err) {
    document.getElementById("status").innerText = "Wallet connection failed.";
  }
}

async function greetOnchain() {
  try {
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, signer);
    const last = await contract.lastGmAt(userAddress);
    const now = Math.floor(Date.now() / 1000);
    if (now - last.toNumber() < 86400) {
      document.getElementById("status").innerText = "❌ You can greet only once every 24 hours.";
      return;
    }
    const tx = await contract.gm();
    await tx.wait();
    document.getElementById("status").innerText = "✅ Greeted onchain!";
    document.getElementById("shareButtons").style.display = "block";
    updateGMCount();
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "❌ Failed to send GM. Make sure wallet is connected.";
  }
}

async function claimHI() {
  try {
    const contract = new ethers.Contract(HI_TOKEN_CONTRACT, hiABI, signer);
    const alreadyClaimed = await contract.claimed(userAddress);
    if (alreadyClaimed) {
      document.getElementById("status").innerText = "You already claimed your 100 HI.";
      return;
    }
    const tx = await contract.claim();
    await tx.wait();
    document.getElementById("status").innerText = "✅ Claimed 100 HI!";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "❌ Claim failed. Make sure wallet is connected.";
  }
}

async function updateGMCount() {
  try {
    const contract = new ethers.Contract(GM_CONTRACT, gmABI, provider);
    const count = await contract.getGMCount(userAddress);
    document.getElementById("gmCount").innerText = `Total GM's: ${count.toString()}`;
  } catch {
    document.getElementById("gmCount").innerText = "";
  }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("greetButton").addEventListener("click", greetOnchain);
document.getElementById("claimButton").addEventListener("click", claimHI);
