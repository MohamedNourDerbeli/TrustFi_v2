import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProfileNFTModule = buildModule("ProfileNFTModule", (m) => {
  const profileNFT = m.contract("ProfileNFT");

  return { profileNFT };
});

export default ProfileNFTModule;