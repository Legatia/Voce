import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Wallet, Ticket, Image as ImageIcon, Sparkles } from "lucide-react";
import { MARKETPLACE_ITEMS, MarketplaceItem } from "@/types/marketplace";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const filterItems = (type?: 'ticket' | 'nft') => {
    if (!type) return MARKETPLACE_ITEMS;
    return MARKETPLACE_ITEMS.filter(item => item.type === type);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'bg-muted text-muted-foreground';
      case 'rare': return 'bg-primary/20 text-primary';
      case 'epic': return 'bg-secondary/20 text-secondary';
      case 'legendary': return 'bg-warning/20 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handlePurchase = (item: MarketplaceItem, paymentMethod: 'coins' | 'crypto') => {
    toast({
      title: "Purchase Successful!",
      description: `You bought ${item.name} with ${paymentMethod === 'coins' ? `${item.priceCoins} coins` : item.priceCrypto}`,
    });
  };

  const renderItemCard = (item: MarketplaceItem) => (
    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-4">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          {item.rarity && (
            <Badge className={getRarityColor(item.rarity)}>
              <Sparkles className="w-3 h-3 mr-1" />
              {item.rarity}
            </Badge>
          )}
        </div>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-warning" />
            <span className="font-bold">{item.priceCoins}</span>
          </div>
          {item.priceCrypto && (
            <div className="text-sm text-muted-foreground">
              or {item.priceCrypto}
            </div>
          )}
        </div>
        <div className="w-full flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => handlePurchase(item, 'coins')}
          >
            <Coins className="w-4 h-4 mr-1" />
            Buy with Coins
          </Button>
          {item.priceCrypto && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handlePurchase(item, 'crypto')}
            >
              <Wallet className="w-4 h-4 mr-1" />
              Crypto
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Purchase voting tickets and exclusive NFTs using platform coins or crypto
          </p>
        </div>

        {/* User Balance */}
        <Card className="mb-8 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Coins</p>
                  <p className="text-2xl font-bold">3,450</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold">125.50 USDC</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="w-4 h-4 mr-2" />
              Voting Tickets
            </TabsTrigger>
            <TabsTrigger value="nfts">
              <ImageIcon className="w-4 h-4 mr-2" />
              NFTs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filterItems().map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filterItems('ticket').map(renderItemCard)}
            </div>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filterItems('nft').map(renderItemCard)}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
