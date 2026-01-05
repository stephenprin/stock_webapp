'use server';

import { connectToDatabase } from '@/database/mongoose';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { Watchlist } from '@/database/models/watchlist.model';
import { getStockQuote, getStockQuotesBatch, getCompanyProfile } from './finnhub.actions';
import { getUserSubscriptionPlan } from './user.actions';
import { getSubscriptionLimits } from '@/lib/utils/subscription';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    return [];
  }
}

export async function getWatchlistItems(): Promise<{
  success: boolean;
  items?: StockWithData[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to view your watchlist',
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const items = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean();

    if (items.length === 0) {
      return {
        success: true,
        items: [],
      };
    }

    const symbols = items.map((item) => item.symbol);
    const quotes = await getStockQuotesBatch(symbols);

    const itemsWithData: StockWithData[] = await Promise.all(
      items.map(async (item) => {
        const quote = quotes.get(item.symbol);
        const currentPrice = quote?.currentPrice || 0;
        const changePercent = quote?.changePercent || 0;

        let marketCap: string | undefined;
        let peRatio: string | undefined;

        try {
          const profile = await getCompanyProfile(item.symbol);
          if (profile?.marketCapitalization) {
            const mc = profile.marketCapitalization;
            if (mc >= 1e12) {
              marketCap = `$${(mc / 1e12).toFixed(2)}T`;
            } else if (mc >= 1e9) {
              marketCap = `$${(mc / 1e9).toFixed(2)}B`;
            } else if (mc >= 1e6) {
              marketCap = `$${(mc / 1e6).toFixed(2)}M`;
            } else {
              marketCap = `$${mc.toLocaleString()}`;
            }
          }
          if (profile?.finnhubIndustry) {
            // P/E ratio might come from a different endpoint, for now we'll leave it undefined
            // Can be enhanced later with financial metrics endpoint
          }
        } catch {
          // Profile fetch failed, continue without it
        }

        const priceFormatted = currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'N/A';
        const changeFormatted = changePercent !== 0 
          ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
          : '0.00%';

        return {
          userId: item.userId,
          symbol: item.symbol,
          company: item.company,
          addedAt: item.addedAt,
          currentPrice,
          changePercent,
          priceFormatted,
          changeFormatted,
          marketCap,
          peRatio,
        } as StockWithData;
      })
    );

    return {
      success: true,
      items: itemsWithData,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch watchlist items',
    };
  }
}

export async function addToWatchlist(
  symbol: string,
  company: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  upgradeRequired?: boolean;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to add stocks to your watchlist',
      };
    }

    await connectToDatabase();
    const userId = session.user.id;
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = company.trim();

    if (!cleanSymbol || !cleanCompany) {
      return {
        success: false,
        error: 'Symbol and company name are required',
      };
    }

    const existingItem = await Watchlist.findOne({
      userId,
      symbol: cleanSymbol,
    });

    if (existingItem) {
      return {
        success: false,
        error: `${cleanSymbol} is already in your watchlist`,
      };
    }

    const currentCount = await Watchlist.countDocuments({ userId });
    const subscriptionPlan = await getUserSubscriptionPlan(userId, session.user.email || undefined);
    const limits = await getSubscriptionLimits(subscriptionPlan);

    if (limits.maxWatchlistStocks !== null && currentCount >= limits.maxWatchlistStocks) {
      return {
        success: false,
        error: `You've reached the limit of ${limits.maxWatchlistStocks} stocks for your ${subscriptionPlan} plan. Upgrade to Pro for unlimited stock tracking.`,
        upgradeRequired: true,
      };
    }

    await Watchlist.create({
      userId,
      symbol: cleanSymbol,
      company: cleanCompany,
      addedAt: new Date(),
    });

    return {
      success: true,
      message: `${cleanSymbol} added to watchlist`,
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        error: 'This stock is already in your watchlist',
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to add stock to watchlist',
    };
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to remove stocks from your watchlist',
      };
    }

    await connectToDatabase();
    const userId = session.user.id;
    const cleanSymbol = symbol.trim().toUpperCase();

    const result = await Watchlist.findOneAndDelete({
      userId,
      symbol: cleanSymbol,
    });

    if (!result) {
      return {
        success: false,
        error: `${cleanSymbol} is not in your watchlist`,
      };
    }

    return {
      success: true,
      message: `${cleanSymbol} removed from watchlist`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to remove stock from watchlist',
    };
  }
}

export async function checkWatchlistLimit(): Promise<{
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentCount: number;
  limit: number | null;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        allowed: false,
        reason: 'You must be logged in',
        currentCount: 0,
        limit: null,
      };
    }

    await connectToDatabase();
    const userId = session.user.id;
    const currentCount = await Watchlist.countDocuments({ userId });
    const subscriptionPlan = await getUserSubscriptionPlan(userId, session.user.email || undefined);
    const limits = await getSubscriptionLimits(subscriptionPlan);
    
    if (limits.maxWatchlistStocks === null) {
      return {
        allowed: true,
        currentCount,
        limit: null,
      };
    }
    
    if (currentCount >= limits.maxWatchlistStocks) {
      return {
        allowed: false,
        reason: `You've reached the limit of ${limits.maxWatchlistStocks} stocks for your ${subscriptionPlan} plan. Upgrade to Pro for unlimited stock tracking.`,
        upgradeRequired: true,
        currentCount,
        limit: limits.maxWatchlistStocks,
      };
    }
    
    return {
      allowed: true,
      currentCount,
      limit: limits.maxWatchlistStocks,
    };
  } catch (error) {
    return {
      allowed: true,
      currentCount: 0,
      limit: null,
    };
  }
}

export async function isStockInWatchlist(symbol: string): Promise<{
  success: boolean;
  isInWatchlist: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        isInWatchlist: false,
        error: 'You must be logged in',
      };
    }

    await connectToDatabase();
    const userId = session.user.id;
    const cleanSymbol = symbol.trim().toUpperCase();

    const item = await Watchlist.findOne({
      userId,
      symbol: cleanSymbol,
    }).lean();

    return {
      success: true,
      isInWatchlist: !!item,
    };
  } catch (error: any) {
    return {
      success: false,
      isInWatchlist: false,
      error: error.message || 'Failed to check watchlist status',
    };
  }
}

export async function getWatchlistSymbols(): Promise<{
  success: boolean;
  symbols?: string[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        symbols: [],
        error: 'You must be logged in',
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    const symbols = items.map((i) => String(i.symbol));

    return {
      success: true,
      symbols,
    };
  } catch (error: any) {
    return {
      success: false,
      symbols: [],
      error: error.message || 'Failed to fetch watchlist symbols',
    };
  }
}

