export type MarketplaceItemType = 'ticket' | 'nft';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  type: MarketplaceItemType;
  priceCoins: number;
  priceCrypto?: string;
  image: string;
  stock?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: '1',
    name: 'Single Vote Ticket',
    description: 'Place one prediction on any active event',
    type: 'ticket',
    priceCoins: 50,
    priceCrypto: '0.5 USDC',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=ticket1',
    stock: 999
  },
  {
    id: '2',
    name: '5 Vote Bundle',
    description: 'Get 5 votes with a 10% discount',
    type: 'ticket',
    priceCoins: 225,
    priceCrypto: '2.25 USDC',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=ticket5',
    stock: 999
  },
  {
    id: '3',
    name: '20 Vote Bundle',
    description: 'Get 20 votes with a 20% discount',
    type: 'ticket',
    priceCoins: 800,
    priceCrypto: '8 USDC',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=ticket20',
    stock: 999
  },
  {
    id: '4',
    name: 'Crystal Ball NFT',
    description: 'A mystical oracle that boosts XP gains by 10%',
    type: 'nft',
    priceCoins: 2000,
    priceCrypto: '20 USDC',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=crystal',
    rarity: 'epic'
  },
  {
    id: '5',
    name: 'Golden Trophy NFT',
    description: 'Exclusive NFT for top predictors. +15% XP boost',
    type: 'nft',
    priceCoins: 5000,
    priceCrypto: '50 USDC',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=trophy',
    rarity: 'legendary'
  },
  {
    id: '6',
    name: 'Wisdom Owl NFT',
    description: 'Grants early access to new events',
    type: 'nft',
    priceCoins: 1500,
    priceCrypto: '15 USDC',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=owl',
    rarity: 'rare'
  },
  {
    id: '7',
    name: 'Lucky Charm NFT',
    description: 'Common collectible with community badge',
    type: 'nft',
    priceCoins: 500,
    priceCrypto: '5 USDC',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=charm',
    rarity: 'common'
  },
  {
    id: '8',
    name: 'Diamond Seer NFT',
    description: 'Ultra-rare NFT with 25% XP boost and VIP status',
    type: 'nft',
    priceCoins: 10000,
    priceCrypto: '100 USDC',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=diamond',
    rarity: 'legendary'
  }
];
