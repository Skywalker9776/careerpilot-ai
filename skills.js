// Keyword skill matcher used when AI is off (and to pre-rank jobs when AI is on).
// Whole-word matching with aliases, so "trust" no longer matches "rust" and "BSC" counts as BNB Chain.
// Only job-relevant skills are listed. Nothing here relates to protected characteristics.
const SKILL_MAP = {
  // languages
  solidity: [], vyper: [], rust: [], typescript: [], javascript: [], python: [], golang: ['go lang', 'go developer', 'go engineer'],
  'c++': ['cpp'], java: [], kotlin: [], swift: [], sql: ['postgresql', 'postgres', 'mysql'], motoko: [], 'move language': ['sui move', 'aptos move'], 'cairo lang': [],
  // frameworks and tools
  react: ['reactjs', 'react.js'], 'next.js': ['nextjs'], 'node.js': ['nodejs', 'node js', 'node'], express: ['expressjs'], hardhat: [], foundry: [], truffle: [],
  'ethers.js': ['ethers'], 'web3.js': ['web3js'], viem: [], wagmi: [], substrate: [], cosmwasm: [], docker: [], kubernetes: ['k8s'], aws: ['amazon web services'],
  gcp: ['google cloud'], azure: [], git: ['github'], 'ci/cd': ['cicd'], graphql: [], 'rest api': ['restful', 'rest apis'], devops: [], figma: [],
  // chains and protocols
  ethereum: ['eth'], evm: [], bitcoin: ['btc'], solana: [], 'bnb chain': ['bsc', 'bnb smart chain', 'binance smart chain', 'bnb'], polygon: [], arbitrum: [], optimism: [],
  avalanche: [], cosmos: [], polkadot: [], 'near protocol': [], sui: [], aptos: [], 'ton blockchain': [], tron: [],
  icp: ['internet computer', 'internet computer protocol', 'dfinity', 'ic protocol'], 'layer 2': ['l2', 'layer2', 'rollup', 'rollups'],
  'zero knowledge': ['zk', 'zkp', 'zk-snarks', 'zksnarks', 'zk proofs', 'zk-rollup'],
  // crypto domains
  defi: ['decentralized finance'], nft: ['nfts'], dao: ['daos'], dex: ['decentralized exchange', 'amm', 'automated market maker'], lending: [], staking: [],
  'yield farming': ['liquidity mining'], liquidity: [], bridge: ['cross-chain', 'cross chain'], oracle: ['oracles', 'chainlink'], tokenomics: ['token economics'],
  stablecoin: ['stablecoins'], rwa: ['real world assets', 'real-world assets'], mev: [], wallet: ['wallets'], custody: [], cex: ['centralized exchange', 'exchange operations'],
  'market making': ['market maker'], trading: ['trader'], quant: ['quantitative'], 'on-chain analytics': ['onchain analytics', 'on-chain data', 'onchain data', 'dune analytics', 'dune'],
  subgraph: ['the graph'], 'smart contract': ['smart contracts', 'smart-contract'], web3: ['web 3', 'web3.0'], blockchain: ['distributed ledger', 'dlt'],
  crypto: ['cryptocurrency', 'cryptocurrencies', 'digital asset', 'digital assets'], 'token listing': ['exchange listing', 'exchange listings', 'token listings'],
  // security
  security: [], audit: ['audits', 'auditing', 'auditor'], 'penetration testing': ['pentest', 'pentesting', 'pen testing'], fuzzing: ['fuzz testing'],
  'formal verification': [], 'incident response': [], 'threat modeling': ['threat modelling'], cryptography: ['cryptographic'],
  // risk and compliance
  kyc: ['know your customer'], aml: ['anti-money laundering', 'anti money laundering'], compliance: [], 'risk management': ['risk assessment', 'risk analysis'], risk: [],
  sanctions: [], mica: [], regulatory: ['regulation', 'regulations'], 'fraud detection': ['fraud prevention', 'fraud'], 'due diligence': [],
  // business and community
  'business development': ['bizdev', 'biz dev', 'partnerships'], growth: ['growth marketing', 'growth hacking'], community: ['community management', 'community manager'],
  discord: [], telegram: [], content: ['content creation', 'content writing'], copywriting: ['copywriter'], marketing: [], seo: [], 'product management': ['product manager'],
  product: [], 'project management': ['project manager', 'scrum', 'agile'], support: ['customer support', 'customer service'], operations: [], sales: [],
  'investor relations': [], fundraising: ['venture capital'], 'token launch': ['ido', 'ico', 'tge'], research: ['market research', 'crypto research'], 'financial advisory': ['financial advisor'],
  // data and AI
  data: ['data analysis', 'data analytics'], analytics: [], 'machine learning': ['ml'], ai: ['artificial intelligence'], llm: ['llms', 'large language model', 'large language models'],
  'prompt engineering': [], excel: [], tableau: [], 'power bi': [], design: ['ui design', 'ux design', 'product design'], 'ui/ux': ['ux', 'ui'],
};
const SKILLS = Object.keys(SKILL_MAP);

const escRe = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const cache = new Map();
function skillRegex(skill) {
  const k = String(skill).toLowerCase();
  let re = cache.get(k);
  if (!re) {
    const names = [k, ...(SKILL_MAP[k] || [])].map(escRe);
    re = new RegExp('(?<![a-z0-9])(?:' + names.join('|') + ')(?![a-z0-9])', 'i');
    cache.set(k, re);
  }
  return re;
}
const hasSkill = (text, skill) => skillRegex(skill).test(String(text || ''));
const extractSkills = text => SKILLS.filter(s => hasSkill(text, s));

module.exports = { SKILLS, SKILL_MAP, hasSkill, extractSkills };
