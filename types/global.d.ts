declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type SearchCommandProps = {
        renderAs?: 'button' | 'text';
        label?: string;
        initialStocks: StockWithWatchlistStatus[];
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type User = {
        id: string;
        name: string;
        email: string;
        subscriptionPlan?: SubscriptionPlan;
    };

    type UserForNewsEmail = {
        id: string;
        email: string;
        name: string;
        investmentGoals?: string;
        riskTolerance?: string;
        preferredIndustry?: string;
    };

    type Stock = {
        symbol: string;
        name: string;
        exchange: string;
        type: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };

    type WatchlistButtonProps = {
        symbol: string;
        company: string;
        isInWatchlist: boolean;
        showTrashIcon?: boolean;
        type?: 'button' | 'icon';
        onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
    };

    type QuoteData = {
        c?: number;
        dp?: number;
    };

    type ProfileData = {
        name?: string;
        marketCapitalization?: number;
    };

    type FinancialsData = {
        metric?: { [key: string]: number };
    };

    type SelectedStock = {
        symbol: string;
        company: string;
        currentPrice?: number;
    };

    type WatchlistTableProps = {
        watchlist: StockWithData[];
    };

    type StockWithData = {
        userId: string;
        symbol: string;
        company: string;
        addedAt: Date;
        currentPrice?: number;
        changePercent?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        marketCap?: string;
        peRatio?: string;
    };

    type AlertsListProps = {
        alertData: Alert[] | undefined;
    };

    type MarketNewsArticle = {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

    type WatchlistNewsProps = {
        news?: MarketNewsArticle[];
    };

    type SearchCommandProps = {
        open?: boolean;
        setOpen?: (open: boolean) => void;
        renderAs?: 'button' | 'text';
        buttonLabel?: string;
        buttonVariant?: 'primary' | 'secondary';
        className?: string;
    };

    type AlertData = {
        symbol: string;
        company: string;
        alertName: string;
        alertType: 'upper' | 'lower';
        threshold: string;
    };

    type AlertModalProps = {
        alertId?: string;
        alertData?: AlertData;
        action?: string;
        open: boolean;
        setOpen: (open: boolean) => void;
    };

    type RawNewsArticle = {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

    type Alert = {
        id: string;
        symbol: string;
        company: string;
        alertName: string;
        currentPrice: number;
        alertType: 'upper' | 'lower';
        alertSubType?: 'price' | 'percentage' | 'volume' | 'technical';
        threshold?: number;
        percentageThreshold?: number;
        changePercent?: number;
    };

    type RateLimitConfig = {
        maxAttempts: number;
        windowMs: number; 
        lockDurationMs?: number; 
    };

    type PortfolioHolding = {
        _id?: string;
        userId: string;
        symbol: string;
        companyName: string;
        exchange?: string;
        quantity: number;
        averageCost: number;
        totalCost: number;
        currentPrice?: number;
        marketValue?: number;
        gainLoss?: number;
        gainLossPercent?: number;
        lastUpdated?: Date;
        notes?: string;
        createdAt: Date;
        updatedAt: Date;
    };

    type PortfolioTransaction = {
        _id?: string;
        userId: string;
        symbol: string;
        transactionType: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer';
        quantity: number;
        price: number;
        totalAmount: number;
        fees?: number;
        date: Date;
        notes?: string;
        holdingId?: string;
        createdAt: Date;
        updatedAt: Date;
    };

    type PortfolioSummary = {
        totalCost: number;
        totalMarketValue: number;
        totalGainLoss: number;
        totalGainLossPercent: number;
        dayGainLoss?: number;
        dayGainLossPercent?: number;
        holdingsCount: number;
        positions: PortfolioHolding[];
    };

    type AssetAllocation = {
        symbol: string;
        companyName: string;
        marketValue: number;
        percentage: number;
        quantity: number;
        averageCost: number;
        currentPrice?: number;
        gainLoss?: number;
        gainLossPercent?: number;
    };

    // Subscription & Billing Types
    type SubscriptionPlan = "free" | "pro" | "enterprise";

    type SubscriptionLimits = {
        maxStocks: number | null;
        maxAlerts: number | null; 
        alerts: "basic" | "advanced" | "custom";
        newsPriority: "standard" | "priority" | "premium";
        analytics: boolean;
        apiAccess: boolean;
        multiplePortfolios: boolean;
        teamCollaboration: boolean;
        dedicatedSupport: boolean;
    };

    type SubscriptionStatus = {
        plan: SubscriptionPlan;
        customerId?: string;
        status?: "active" | "inactive" | "cancelled" | "past_due";
        currentPeriodEnd?: Date;
    };

    
}

export {};