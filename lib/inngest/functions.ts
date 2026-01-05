import { getNews, getStockQuote } from "../actions/finnhub.actions";
import { getAllUsersForNewsEmail, getUserSubscriptionPlan, getPortfolioSymbolsByUserId } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail, sendPriceAlertEmail } from "../nodemailer";
import { getFormattedTodayDate } from "../utils/utils";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PRO_NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { connectToDatabase } from "@/database/mongoose";
import { PriceAlertModel } from "@/database/models/price-alert.model";
import { getPushSubscriptionsByUserId } from "@/lib/actions/push.actions";
import { sendPushNotifications } from "@/lib/services/push-notification.service";
import { sendPriceAlertSMS } from "@/lib/services/sms.service";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Stock Tracker. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "send-daily-news-summary" },
  [{ event: "app/user.daily-news-summary" }, { cron: "0 12 * * *" }],
  async ({ event, step }) => {
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
  
    if (!users || users.length === 0)
      return {
      success: false,
      message: "No users found for news email",
    };

    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
        subscriptionPlan: "free" | "pro" | "enterprise";
        portfolioSymbols: string[];
        watchlistSymbols: string[];
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
          try {
              const subscriptionPlan = await getUserSubscriptionPlan(user.id);
              const watchlistSymbols = await getWatchlistSymbolsByEmail(user.email);
              const portfolioSymbols = subscriptionPlan !== "free" 
                ? await getPortfolioSymbolsByUserId(user.id)
                : [];
              
              const allSymbols = [...new Set([...watchlistSymbols, ...portfolioSymbols])];
              const articleLimit = subscriptionPlan !== "free" ? 12 : 6;
              
              let articles = await getNews(allSymbols.length > 0 ? allSymbols : undefined);
              articles = (articles || []).slice(0, articleLimit);
              if (!articles || articles.length === 0) {
                  articles = await getNews();
                  articles = (articles || []).slice(0, articleLimit);
              }
              perUser.push({ 
                user, 
                articles,
                subscriptionPlan,
                portfolioSymbols,
                watchlistSymbols,
              });
          } catch (e) {
              perUser.push({ 
                user, 
                articles: [],
                subscriptionPlan: "free" as const,
                portfolioSymbols: [],
                watchlistSymbols: [],
              });
          }
      }
      return perUser;
  });

    const userNewsSummaries: {
      user: UserForNewsEmail;
      newsContent: string | null;
    }[] = [];

        for (const { user, articles, subscriptionPlan, portfolioSymbols, watchlistSymbols } of results) {
                try {
        let prompt: string;
        
        if (subscriptionPlan !== "free") {
          const userProfile = [
            user.investmentGoals ? `Investment Goals: ${user.investmentGoals}` : null,
            user.riskTolerance ? `Risk Tolerance: ${user.riskTolerance}` : null,
            user.preferredIndustry ? `Preferred Industry: ${user.preferredIndustry}` : null,
          ].filter(Boolean).join("\n");

          prompt = PRO_NEWS_SUMMARY_EMAIL_PROMPT
            .replace("{{userProfile}}", userProfile || "Not specified")
            .replace("{{portfolioSymbols}}", portfolioSymbols.join(", ") || "None")
            .replace("{{watchlistSymbols}}", watchlistSymbols.join(", ") || "None")
            .replace("{{newsData}}", JSON.stringify(articles, null, 2))
            .replace("{{investmentGoals}}", user.investmentGoals || "Not specified")
            .replace("{{riskTolerance}}", user.riskTolerance || "Not specified")
            .replace("{{preferredIndustry}}", user.preferredIndustry || "Not specified");
        } else {
          prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
            "{{newsData}}",
            JSON.stringify(articles, null, 2)
          );
        }

                    const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
                        body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

                    userNewsSummaries.push({ user, newsContent });
                } catch (e) {
                    userNewsSummaries.push({ user, newsContent: null });
                }
            }

    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);

export const checkPriceAlerts = inngest.createFunction(
  { id: "check-price-alerts" },
  [{ cron: "*/5 * * * *" }], 
  async ({ step }) => {
    const activeAlerts = await step.run("fetch-active-alerts", async () => {
      await connectToDatabase();
      const alerts = await PriceAlertModel.find({ isActive: true }).lean();
      
      return alerts.map((alert) => ({
        _id: (alert._id as any)?.toString(),
        userId: alert.userId,
        symbol: alert.symbol,
        company: alert.company,
        alertName: alert.alertName,
        alertType: alert.alertType,
        alertSubType: alert.alertSubType || "price",
        threshold: alert.threshold,
        percentageThreshold: alert.percentageThreshold,
        previousDayClose: alert.previousDayClose,
        conditions: alert.conditions,
        conditionLogic: alert.conditionLogic,
        technicalIndicator: alert.technicalIndicator,
        triggeredAt: alert.triggeredAt,
      }));
    });

    if (!activeAlerts || activeAlerts.length === 0) {
      return {
        success: true,
        message: "No active alerts to check",
        checked: 0,
        triggered: 0,
      };
    }

    const uniqueSymbols = [...new Set(activeAlerts.map((alert) => alert.symbol))];
    const stockDataMap = new Map<string, { currentPrice: number; previousClose: number; volume?: number }>();

    await step.run("fetch-stock-data", async () => {
      const stockResults = await Promise.allSettled(
        uniqueSymbols.map(async (symbol) => {
          try {
            const quote = await getStockQuote(symbol);
            if (!quote) {
              return { symbol, data: null };
            }
            return {
              symbol,
              data: {
                currentPrice: quote.currentPrice,
                previousClose: quote.previousClose,
                volume: undefined,
              },
            };
          } catch (error) {
            return { symbol, data: null };
          }
        })
      );

      stockResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.data !== null) {
          stockDataMap.set(result.value.symbol, result.value.data);
        }
      });
    });

    const triggeredAlerts: Array<{
      alert: typeof activeAlerts[0];
      currentPrice: number;
      evaluationReason?: string;
    }> = [];

    await step.run("evaluate-alerts", async () => {
      const { evaluateAlert } = await import("@/lib/services/alert-evaluation.service");

      for (const alert of activeAlerts) {
        const stockData = stockDataMap.get(alert.symbol);
        
        if (!stockData) {
          continue;
        }

        if (alert.triggeredAt) {
          continue;
        }

        const evaluationResult = await evaluateAlert(
          {
            alertSubType: alert.alertSubType,
            alertType: alert.alertType,
            threshold: alert.threshold,
            percentageThreshold: alert.percentageThreshold,
            previousDayClose: alert.previousDayClose || stockData.previousClose,
            conditions: alert.conditions,
            conditionLogic: alert.conditionLogic,
            technicalIndicator: alert.technicalIndicator,
          },
          alert.symbol,
          {
            currentPrice: stockData.currentPrice,
            previousClose: stockData.previousClose,
            volume: stockData.volume,
          }
        );

        if (evaluationResult.shouldTrigger) {
          triggeredAlerts.push({
            alert,
            currentPrice: stockData.currentPrice,
            evaluationReason: evaluationResult.reason,
          });
        }
      }
    });

    if (triggeredAlerts.length === 0) {
      return {
        success: true,
        message: "No alerts triggered",
        checked: activeAlerts.length,
        triggered: 0,
      };
    }

    type AlertWithUserInfo = {
      alert: {
        _id: string;
        userId: string;
        symbol: string;
        company: string;
        alertName: string;
        alertType: "upper" | "lower";
        alertSubType: string;
        threshold?: number;
        percentageThreshold?: number;
        previousDayClose?: number;
        conditions?: any[];
        conditionLogic?: string;
        technicalIndicator?: any;
        triggeredAt?: Date | string;
      };
      currentPrice: number;
      email: string;
      name: string;
      phoneNumber?: string;
      smsNotificationsEnabled?: boolean;
      isPro: boolean;
      evaluationReason?: string;
    };

    const alertsWithUserInfo = await step.run("fetch-user-info", async (): Promise<AlertWithUserInfo[]> => {
      const uniqueUserIds = [...new Set(triggeredAlerts.map((t) => t.alert.userId))];
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      
      if (!db) {
        throw new Error("MongoDB connection not found");
      }

      const userCollection = db.collection("user");
      const customerCollection = db.collection("customer");
      const result: AlertWithUserInfo[] = [];

      for (const userId of uniqueUserIds) {
        try {
          const user = await userCollection.findOne<{ id: string; email: string; name: string; phoneNumber?: string; smsNotificationsEnabled?: boolean }>(
            { id: userId },
            { projection: { _id: 1, id: 1, email: 1, name: 1, phoneNumber: 1, smsNotificationsEnabled: 1 } }
          );

          if (!user || !user.email || !user.name) {
            continue;
          }

          let isPro = false;
          try {
            const customer = await customerCollection.findOne<{ 
              userId?: string; 
              products?: Array<{ id: string; status: string }> 
            }>(
              { userId },
              { projection: { products: 1 } }
            );

            if (customer?.products) {
              isPro = customer.products.some(
                (p) => 
                  (p.id === "pro_plan" || p.id === "enterprise_plan") &&
                  (p.status === "active" || p.status === "trialing")
              );
            }
          } catch (error) {
          }

          const alertsForUser = triggeredAlerts.filter(
            (t) => t.alert.userId === userId
          );
          
          alertsForUser.forEach(({ alert, currentPrice, evaluationReason }) => {
            result.push({
              alert,
              currentPrice,
              email: user.email,
              name: user.name,
              phoneNumber: user.phoneNumber,
              smsNotificationsEnabled: user.smsNotificationsEnabled !== false,
              isPro,
              evaluationReason,
            });
          });
        } catch (error) {
        }
      }

      return result;
    });

    await step.run("send-alert-emails", async () => {
      await Promise.allSettled(
        alertsWithUserInfo.map(async ({ alert, currentPrice, email, name }) => {
          try {
          
            const targetPrice = alert.alertSubType === "percentage" && alert.previousDayClose
              ? alert.previousDayClose * (1 + (alert.percentageThreshold || 0) / 100)
              : alert.threshold || currentPrice;

            await sendPriceAlertEmail({
              email,
              name,
              symbol: alert.symbol,
              company: alert.company,
              currentPrice,
              targetPrice,
              alertType: alert.alertType,
            });

            await PriceAlertModel.updateOne(
              { _id: alert._id },
              { $set: { triggeredAt: new Date() } }
            );
          } catch (error) {
          }
        })
      );
    });

    await step.run("send-push-notifications", async () => {
      const uniqueUserIds = [...new Set(alertsWithUserInfo.map((a) => a.alert.userId))];
      
      await Promise.allSettled(
        uniqueUserIds.map(async (userId) => {
          try {
            const subscriptions = await getPushSubscriptionsByUserId(userId);
            
            if (subscriptions.length === 0) {
              return;
            }

            const userAlerts = alertsWithUserInfo.filter(
              (a) => a.alert.userId === userId
            );

            for (const { alert, currentPrice } of userAlerts) {
              const alertEmoji = alert.alertType === "upper" ? "📈" : "📉";
              const alertDirection = alert.alertType === "upper" ? "above" : "below";
              
              let alertMessage = "";
              if (alert.alertSubType === "percentage" && alert.percentageThreshold !== undefined) {
                alertMessage = `${alert.symbol} (${alert.company}) moved ${alert.percentageThreshold > 0 ? "+" : ""}${alert.percentageThreshold.toFixed(1)}%. Current price: $${currentPrice.toFixed(2)}`;
              } else if (alert.threshold !== undefined) {
                alertMessage = `${alert.symbol} (${alert.company}) is ${alertDirection} your target price of $${alert.threshold.toFixed(2)}. Current price: $${currentPrice.toFixed(2)}`;
              } else {
                alertMessage = `${alert.symbol} (${alert.company}) alert triggered. Current price: $${currentPrice.toFixed(2)}`;
              }
              
              await sendPushNotifications(
                subscriptions,
                {
                  title: `${alertEmoji} Price Alert: ${alert.symbol}`,
                  body: alertMessage,
                  icon: "/favicon.ico",
                  badge: "/favicon.ico",
                  data: {
                    url: `/search?symbol=${alert.symbol}`,
                    symbol: alert.symbol,
                    alertId: alert._id,
                    type: "price-alert",
                  },
                }
              );
            }
          } catch (error) {
          }
        })
      );
    });

    await step.run("send-sms-notifications", async () => {
      const proUsersWithPhone = alertsWithUserInfo.filter(
        (a) => a.isPro && a.phoneNumber && a.phoneNumber.trim() !== "" && a.smsNotificationsEnabled !== false
      );

      if (proUsersWithPhone.length === 0) {
        return;
      }

      await Promise.allSettled(
        proUsersWithPhone.map(async ({ alert, currentPrice, phoneNumber }) => {
          try {
            if (!phoneNumber) {
              return;
            }

            const targetPrice = alert.alertSubType === "percentage" && alert.previousDayClose
              ? alert.previousDayClose * (1 + (alert.percentageThreshold || 0) / 100)
              : alert.threshold || currentPrice;

            const smsResult = await sendPriceAlertSMS({
              phoneNumber,
              symbol: alert.symbol,
              company: alert.company,
              currentPrice,
              targetPrice,
              alertType: alert.alertType,
            });

            if (!smsResult.success) {
            }
          } catch (error) {
          }
        })
      );
    });

    return {
      success: true,
      message: "Price alerts checked and notifications sent",
      checked: activeAlerts.length,
      triggered: alertsWithUserInfo.length,
    };
  }
);
