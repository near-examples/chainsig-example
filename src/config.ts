const contractPerNetwork = {
  mainnet: 'v1.signer',
  testnet: 'v1.signer-prod.testnet'
};

export const MPC_VARIABLE = {
  // MPC_CONTRACT_ID_TESTNET: "v1.signer-dev.testnet",
  MPC_CONTRACT_ID_TESTNET: "v1.signer-prod.testnet",
  MPC_CONTRACT_ID_MAINNET: "v1.signer",
  // MPC_PUBLIC_KEY_TESTNET: "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
  MPC_PUBLIC_KEY_TESTNET: "secp256k1:54hU5wcCmVUPFWLDALXMh1fFToZsVXrx9BbTbHzSfQq1Kd1rJZi52iPa4QQxo6s5TgjWqgpY8HamYuUDzG6fAaUq",
  MPC_PUBLIC_KEY_MAINNET: "secp256k1:3tFRbMqmoa6AAALMrEFAYCEoHcqKxeW38YptwowBVBtXK1vo36HDbUWuR6EZmoK4JcH6HDkNMGGqP1ouV7VZUWya"
}

export const getNearContract = (networkId) => contractPerNetwork[networkId]
