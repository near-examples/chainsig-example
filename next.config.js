// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // distDir: 'build',
  images: {
    unoptimized: true,
  },
  basePath: '',
  env: {
    // MPC_CONTRACT_ID: "v2.multichain-mpc.testnet",
    // MPC_CONTRACT_ID: "v5.multichain-mpc-dev.testnet",
    // MPC_CONTRACT_ID: "v1.multichain-mpc-dev.testnet",
    // MPC_CONTRACT_ID: "v1.signer-dev.testnet",
    MPC_CONTRACT_ID: "v1.signer-prod.testnet",
    // MPC_PUBLIC_KEY: "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    // MPC_PUBLIC_KEY: "secp256k1:54hU5wcCmVUPFWLDALXMh1fFToZsVXrx9BbTbHzSfQq1Kd1rJZi52iPa4QQxo6s5TgjWqgpY8HamYuUDzG6fAaUq",
    MPC_PUBLIC_KEY: "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3"
  }
};

module.exports = nextConfig;
