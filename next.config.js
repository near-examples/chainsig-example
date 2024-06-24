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
    MPC_CONTRACT_ID: "v2.multichain-mpc.testnet",
    // MPC_CONTRACT_ID: "v5.multichain-mpc-dev.testnet",
    MPC_PUBLIC_KEY: "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    // MPC_PUBLIC_KEY: "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    // TATUM_API_KEY: "t-660377bd70604e001c3712e6-045c28a4cd40450e890ecded",
  }
};

module.exports = nextConfig;
