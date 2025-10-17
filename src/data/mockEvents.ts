export interface Event {
  id: number;
  title: string;
  category: string;
  votingDeadline: string;
  resultDeadline?: string;
  participants: number;
  xpReward: number;
  cryptoReward: string;
  isVotingClosed: boolean;
  description: string;
  region: string;
  creator: string;
  createdAt: string;
  resolutionCriteria: string;
  dataSources: string[];
}

export const mockEvents: Event[] = [
  {
    id: 1,
    title: "Will AI achieve AGI by December 2025?",
    category: "Technology",
    votingDeadline: "Dec 1, 2025",
    resultDeadline: "Jan 1, 2026",
    participants: 2847,
    xpReward: 500,
    cryptoReward: "50 USDC",
    isVotingClosed: false,
    description: "Artificial General Intelligence (AGI) represents a milestone where AI systems can perform any intellectual task that humans can. This event will resolve YES if a credible AI research organization or independent body announces the achievement of AGI by December 31, 2025.",
    region: "Global",
    creator: "TechOracle",
    createdAt: "Oct 15, 2024",
    resolutionCriteria: "Resolution will be based on official announcements from major AI research labs (OpenAI, DeepMind, Anthropic, etc.) or peer-reviewed publications demonstrating AGI capabilities. AGI is defined as an AI system that can perform 95% of economically valuable work at human level or better.",
    dataSources: ["OpenAI Blog", "DeepMind Research", "ArXiv AI Papers", "MIT Technology Review"],
  },
  {
    id: 2,
    title: "Bitcoin to reach $100K before Q2 2025?",
    category: "Crypto",
    votingDeadline: "Mar 15, 2025",
    resultDeadline: "Jul 1, 2025",
    participants: 5234,
    xpReward: 750,
    cryptoReward: "80 USDC",
    isVotingClosed: false,
    description: "Bitcoin has been on a volatile journey. This prediction market asks whether BTC will hit the psychological $100,000 milestone before the second quarter of 2025 begins (before April 1, 2025).",
    region: "Global",
    creator: "CryptoWhale",
    createdAt: "Oct 20, 2024",
    resolutionCriteria: "This event resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) before April 1, 2025, 00:00 UTC. The price must be sustained for at least 1 hour.",
    dataSources: ["CoinMarketCap", "Coinbase", "Binance", "TradingView"],
  },
  {
    id: 3,
    title: "2024 US Elections: Voter turnout above 65%?",
    category: "Politics",
    votingDeadline: "Nov 1, 2024",
    resultDeadline: "Nov 15, 2024",
    participants: 8921,
    xpReward: 1000,
    cryptoReward: "100 USDC",
    isVotingClosed: true,
    description: "The 2024 United States presidential election could see historic voter turnout. This market predicts whether total voter turnout will exceed 65% of eligible voters.",
    region: "Americas",
    creator: "PoliPredict",
    createdAt: "Sep 1, 2024",
    resolutionCriteria: "Resolution based on official voter turnout data from the U.S. Election Assistance Commission. Turnout is calculated as total votes cast divided by the voting-eligible population (VEP). Final certification must occur by November 30, 2024.",
    dataSources: ["U.S. Election Assistance Commission", "Federal Election Commission", "Associated Press", "Pew Research"],
  },
  {
    id: 4,
    title: "Tesla stock to surpass $300 by end of 2024?",
    category: "Finance",
    votingDeadline: "Dec 15, 2024",
    resultDeadline: "Jan 5, 2025",
    participants: 3456,
    xpReward: 600,
    cryptoReward: "60 USDC",
    isVotingClosed: false,
    description: "Tesla's stock price has been a subject of intense speculation. This market asks whether TSLA will close above $300 per share by the last trading day of 2024.",
    region: "Global",
    creator: "WallStreetPro",
    createdAt: "Oct 10, 2024",
    resolutionCriteria: "This event resolves YES if Tesla (TSLA) closes at or above $300.00 per share on the last trading day of 2024 (December 31, 2024) on NASDAQ. The official closing price from NASDAQ will be used for resolution.",
    dataSources: ["NASDAQ Official", "Yahoo Finance", "Bloomberg Terminal", "SEC Filings"],
  },
  {
    id: 5,
    title: "New COVID variant to emerge in 2025?",
    category: "Health",
    votingDeadline: "Dec 31, 2024",
    resultDeadline: "Feb 1, 2025",
    participants: 4123,
    xpReward: 550,
    cryptoReward: "55 USDC",
    isVotingClosed: false,
    description: "Public health experts continue monitoring COVID-19 evolution. This market predicts whether a new variant of concern will be officially designated by the WHO in January 2025.",
    region: "Global",
    creator: "HealthWatch",
    createdAt: "Oct 25, 2024",
    resolutionCriteria: "Resolves YES if the World Health Organization officially designates a new SARS-CoV-2 Variant of Concern (VOC) during January 2025. The variant must be distinct from previously designated VOCs.",
    dataSources: ["World Health Organization", "CDC", "GISAID", "Nature Medicine"],
  },
  {
    id: 6,
    title: "SpaceX Mars mission announced before 2026?",
    category: "Space",
    votingDeadline: "Jun 30, 2025",
    resultDeadline: "Dec 31, 2025",
    participants: 6789,
    xpReward: 900,
    cryptoReward: "90 USDC",
    isVotingClosed: false,
    description: "SpaceX has ambitious plans for Mars exploration. This market predicts whether SpaceX will officially announce a crewed Mars mission with a specific launch date before January 1, 2026.",
    region: "Global",
    creator: "SpaceFan2024",
    createdAt: "Oct 5, 2024",
    resolutionCriteria: "Resolves YES if SpaceX makes an official announcement (via press release, Elon Musk's verified social media, or NASA partnership announcement) of a crewed Mars mission with a specific target launch window before January 1, 2026.",
    dataSources: ["SpaceX Official", "NASA.gov", "Space.com", "Elon Musk Twitter/X"],
  },
];
