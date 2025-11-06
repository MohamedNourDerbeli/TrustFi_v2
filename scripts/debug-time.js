const { ethers } = require("hardhat");

async function main() {
  console.log("🕐 Time Debug Script");
  console.log("===================\n");

  // Get current JavaScript time
  const jsNow = Date.now();
  const jsNowSeconds = Math.floor(jsNow / 1000);
  
  console.log(`JavaScript Date.now(): ${jsNow} (milliseconds)`);
  console.log(`JavaScript time in seconds: ${jsNowSeconds}`);
  console.log(`JavaScript date: ${new Date(jsNow).toISOString()}\n`);

  // Get blockchain time
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const latestBlock = await provider.getBlock("latest");
  const blockTimestamp = latestBlock.timestamp;
  
  console.log(`Blockchain timestamp: ${blockTimestamp} (seconds)`);
  console.log(`Blockchain date: ${new Date(blockTimestamp * 1000).toISOString()}\n`);

  // Calculate difference
  const diffSeconds = jsNowSeconds - blockTimestamp;
  const diffDays = diffSeconds / (24 * 60 * 60);
  
  console.log(`Time difference: ${diffSeconds} seconds`);
  console.log(`Time difference: ${diffDays.toFixed(2)} days`);
  
  if (Math.abs(diffSeconds) > 60) {
    console.log("\n⚠️  WARNING: Significant time difference detected!");
    console.log("This could cause negative profile ages.");
  } else {
    console.log("\n✅ Time difference is normal.");
  }
}

main().catch(console.error);