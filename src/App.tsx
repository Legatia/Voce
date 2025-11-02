import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CreateEvent from "./pages/CreateEvent";
import Leaderboard from "./pages/Leaderboard";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import LiveStreamingPage from "./pages/LiveStreamingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.TESTNET, // Use testnet for development
        aptosApiKey: import.meta.env.VITE_APTOS_API_KEY || ""
      }}
      onError={(error) => console.error("Wallet adapter error:", error)}
    >
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/live-streaming" element={<LiveStreamingPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </AptosWalletAdapterProvider>
  </QueryClientProvider>
);

export default App;