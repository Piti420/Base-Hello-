const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
const greetContractAddress = "0x06B17752e177681e5Df80e0996228D7d1dB2F61b";
const tokenContractAddress = "0xdEeBc11cB7eDAe91aD9a6165ab385B6D04a839E0";

const greetAbi = [
  "function greet() public",
  "function greetings(address) view returns (bool)"
];

const tokenAbi = [
  "function claim() public",
  "function balanceOf(address owner) view returns (uint256)"
];

async function connectWallet() {
  try {
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    document.getElementById("status").innerText = "Wallet connected ✅";
  } catch (err) {
    document.getElementById("status").innerText = "❌ Wallet connection failed";
  }
}

async function greetOnChain() {
  try {
    const contract = new ethers.Contract(greetContractAddress, greetAbi, signer);
    const tx = await contract.greet();
    await tx.wait();
    document.getElementById("status").innerText = "✅ You greeted onchain!";
    document.getElementById("share").style.display = "block";
  } catch (err) {
    document.getElementById("status").innerText = "❌ Failed to send GM. Make sure wallet is connected and try again.";
  }
}

async function claimHI() {
  try {
    const contract = new ethers.Contract(tokenContractAddress, tokenAbi, signer);
    const tx = await contract.claim();
    await tx.wait();
    document.getElementById("status").innerText = "✅ 100 HI claimed!";
  } catch (err) {
    document.getElementById("status").innerText = "❌ Failed to claim HI. Possibly already claimed.";
  }
}

function shareOnTwitter() {
  const text = encodeURIComponent("I just greeted the Base world 🌍 and claimed $HI on Hello Base! #HelloBase #Base #Farcaster");
  const url = "https://twitter.com/intent/tweet?text=" + text;
  window.open(url, "_blank");
}

function shareOnFarcaster() {
  const text = "I just greeted the Base world 🌍 and claimed $HI on Hello Base!";
  const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

window.onload = () => {
  connectWallet();
};
