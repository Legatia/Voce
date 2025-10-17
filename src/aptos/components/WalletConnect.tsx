import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useAptosWallet } from "../hooks/useAptosWallet";
import { AptosNetwork } from "../config/network";

interface WalletConnectProps {
  trigger?: React.ReactNode;
}

export const WalletConnect = ({ trigger }: WalletConnectProps) => {
  const {
    isConnected,
    isConnecting,
    account,
    walletInfo,
    balance,
    network,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    formatAddress,
    getExplorerUrl,
  } = useAptosWallet();

  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<AptosNetwork>(network);

  const handleConnect = async () => {
    if (privateKeyInput.trim()) {
      await connect(privateKeyInput.trim());
      setPrivateKeyInput("");
      setShowPrivateKeyDialog(false);
    } else {
      // Generate new account
      await connect();
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

  if (isConnected && account && walletInfo) {
    return (
      <div className="flex items-center gap-4">
        {/* Network Badge */}
        <Badge variant="outline" className="gap-1">
          <div className={`w-2 h-2 rounded-full ${
            network === "mainnet" ? "bg-red-500" :
            network === "testnet" ? "bg-blue-500" : "bg-green-500"
          }`} />
          {network.toUpperCase()}
        </Badge>

        {/* Balance */}
        <div className="text-sm">
          <span className="text-muted-foreground">Balance: </span>
          <span className="font-semibold">
            {balance ? `${balance.balance.toFixed(4)} APT` : "Loading..."}
          </span>
        </div>

        {/* Wallet Info */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Wallet className="w-4 h-4" />
              {formatAddress(walletInfo.address)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Details</DialogTitle>
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
                  <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as AptosNetwork)}>
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
    <Dialog open={showPrivateKeyDialog} onOpenChange={setShowPrivateKeyDialog}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2" disabled={isConnecting}>
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Aptos Wallet</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">New Account</TabsTrigger>
            <TabsTrigger value="import">Import Account</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-6 bg-muted rounded-lg">
                <Wallet className="w-12 h-12 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-2">Create New Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a new Aptos account with a unique private key
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <strong>Important:</strong> Save your private key securely.
                      You'll need it to access your account in the future.
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={() => connect()} disabled={isConnecting} className="w-full">
                {isConnecting ? "Creating Account..." : "Create New Account"}
              </Button>
            </div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Your private key will be stored locally in your browser
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !privateKeyInput.trim()}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Import Account"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This demo uses in-browser wallet storage</p>
          <p>• For production, integrate with Petra, Martian, or other wallet adapters</p>
          <p>• Testnet APT can be obtained from the Aptos faucet</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};