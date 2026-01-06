import { RealTimePrice } from "./RealTimePrice";
import { getPortfolioHoldings } from "@/lib/actions/portfolio.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function RealTimePriceWrapper() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.email) {
      return null;
    }

    const [watchlistSymbols, portfolioResult] = await Promise.all([
      getWatchlistSymbolsByEmail(session.user.email),
      getPortfolioHoldings(),
    ]);

    const portfolioSymbols = portfolioResult.success && portfolioResult.holdings
      ? portfolioResult.holdings.map((h: any) => h.symbol)
      : [];

    const allSymbols = Array.from(new Set([...watchlistSymbols, ...portfolioSymbols]));

    if (allSymbols.length === 0) {
      return null;
    }

    return (
      <RealTimePrice 
        symbols={allSymbols} 
        maxDisplay={5}
        title="Real-Time Prices"
        description="Live updates for your watchlist & portfolio"
      />
    );
  } catch (error) {
    return null;
  }
}
