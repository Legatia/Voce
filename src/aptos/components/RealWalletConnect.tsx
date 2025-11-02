import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Copy, ExternalLink, CheckCircle, AlertCircle, Download, Star } from "lucide-react";
import { useModernAptosWallet } from "../hooks/useModernAptosWallet";

interface RealWalletConnectProps {
  trigger?: React.ReactNode;
}

export const RealWalletConnect = ({ trigger }: RealWalletConnectProps) => {
  const {
    isConnected,
    isConnecting,
    account,
    walletInfo,
    balance,
    network,
    selectedWallet,
    availableWallets,
    installedWallets,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    formatAddress,
    getExplorerUrl,
  } = useModernAptosWallet();

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(network);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleConnect = async (walletName: string) => {
    if (privateKeyInput.trim()) {
      await connect(walletName, privateKeyInput.trim());
      setPrivateKeyInput("");
      setShowConnectDialog(false);
    } else {
      await connect(walletName);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = async () => {
    await switchNetwork(selectedNetwork);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Auto-connect to first available wallet
  const autoConnectToFirstWallet = async () => {
    if (installedWallets.length > 0 && !isConnected) {
      await connect(installedWallets[0].name);
    }
  };

  if (isConnected && account && walletInfo) {
    return (
      <div className="flex items-center gap-4">
        {/* Wallet Badge */}
        <Badge variant="outline" className="gap-1">
          <div className={`w-2 h-2 rounded-full ${
            network === "mainnet" ? "bg-red-500" :
            network === "testnet" ? "bg-blue-500" : "bg-green-500"
          }`} />
          {network.toUpperCase()}
        </Badge>

        {/* Wallet Info */}
        <Badge variant="secondary" className="gap-1">
          <Wallet className="w-3 h-3" />
          {walletInfo.name || selectedWallet || 'Wallet'}
        </Badge>

        {/* Balance */}
        <div className="text-sm">
          <span className="text-muted-foreground">Balance: </span>
          <span className="font-semibold">
            {balance ? `${balance.balance.toFixed(4)} APT` : "Loading..."}
          </span>
        </div>

        {/* Wallet Details Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Wallet className="w-4 h-4" />
              {formatAddress(walletInfo.address || '')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Details</DialogTitle>
              <DialogDescription>
                View your wallet address, balance, and manage your connection settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Address */}
              <div>
                <Label className="text-sm text-muted-foreground">Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden">
                    {walletInfo.address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(walletInfo.address)}
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getExplorerUrl(), "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Balance */}
              <div>
                <Label className="text-sm text-muted-foreground">Balance</Label>
                <div className="text-lg font-semibold mt-1">
                  {balance ? `${balance.balance.toFixed(4)} APT` : "Loading..."}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshBalance}
                  className="mt-1"
                >
                  Refresh Balance
                </Button>
              </div>

              {/* Network Switch */}
              <div>
                <Label className="text-sm text-muted-foreground">Network</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as any)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mainnet">Mainnet</SelectItem>
                      <SelectItem value="testnet">Testnet</SelectItem>
                      <SelectItem value="devnet">Devnet</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwitchNetwork}
                    disabled={selectedNetwork === network}
                  >
                    Switch
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="destructive" onClick={handleDisconnect} className="flex-1">
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2" disabled={isConnecting}>
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Aptos Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to interact with the Voce prediction market platform.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wallets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallets">Browser Wallets</TabsTrigger>
            <TabsTrigger value="import">Import Private Key</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-4">
            {installedWallets.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <Star className="w-4 h-4 inline mr-1" />
                  Detected {installedWallets.length} wallet{installedWallets.length > 1 ? "s" : ""}:
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {installedWallets.map((wallet) => (
                    <Card key={wallet.name} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{wallet.icon}</div>
                            <div>
                              <h3 className="font-semibold">{wallet.name}</h3>
                              <p className="text-xs text-muted-foreground">Click to connect</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleConnect(wallet.name)}
                            disabled={isConnecting}
                            size="sm"
                          >
                            {isConnecting ? "Connecting..." : "Connect"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Wallets Detected</h3>
                <p className="text-muted-foreground mb-6">
                  Install a supported wallet to continue
                </p>
                <div className="space-y-2">
                  {availableWallets.map((wallet) => (
                    <Button
                      key={wallet.name}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open(wallet.url, "_blank")}
                    >
                      <Download className="w-4 h-4" />
                      Install {wallet.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {installedWallets.length > 0 && (
              <Button
                variant="outline"
                onClick={autoConnectToFirstWallet}
                className="w-full"
                disabled={isConnecting}
              >
                Quick Connect to {installedWallets[0].name}
              </Button>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong className="text-blue-900">Browser wallets are recommended for best security.</strong>
                They provide better UX and hardware wallet support.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="private-key">Private Key</Label>
                <Input
                  id="private-key"
                  type="password"
                  placeholder="Enter your private key"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your private key will be stored locally in your browser for demo purposes.
                  Consider using a browser wallet for production.
                </p>
              </div>

              <Button
                onClick={() => handleConnect("private-key")}
                disabled={isConnecting || !privateKeyInput.trim()}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Import Private Key"}
              </Button>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong className="text-amber-900">For demo purposes only.</strong>
                  In production, use browser wallets for enhanced security and better user experience.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>• Supported wallets: Petra, Martian, Pontem</p>
          <p>• Private keys are stored locally (demo only)</p>
          <p>• Testnet APT can be obtained from the Aptos faucet</p>
          <p>• Your funds are secure in your chosen wallet</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};