import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ProfileNFTModule from "./ProfileNFT";

const ReputationCardModule = buildModule("ReputationCardModule", (m) => {
  // Get the ProfileNFT contract from the ProfileNFT module
  const { profileNFT } = m.useModule(ProfileNFTModule);

  // Deploy ReputationCard contract with ProfileNFT address as constructor parameter
  const reputationCard = m.contract("ReputationCard", [profileNFT]);

  return { reputationCard, profileNFT };
});

export default ReputationCardModule;