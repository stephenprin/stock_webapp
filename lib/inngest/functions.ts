import { getNews, getStockQuote } from "../actions/finnhub.actions";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actiond";
import { sendNewsSummaryEmail, sendWelcomeEmail, sendPriceAlertEmail } from "../nodemailer";
import { getFormattedTodayDate } from "../utils/utils";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { connectToDatabase } from "@/database/mongoose";
import { PriceAlertModel } from "@/database/models/price-alert.model";
import { getPushSubscriptionsByUserId } from "@/lib/actions/push.actions";
import { sendPushNotifications } from "@/lib/services/push-notification.service";

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
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
          try {
              const symbols = await getWatchlistSymbolsByEmail(user.email);
              let articles = await getNews(symbols);
              articles = (articles || []).slice(0, 6);
              if (!articles || articles.length === 0) {
                  articles = await getNews();
                  articles = (articles || []).slice(0, 6);
              }
              perUser.push({ user, articles });
          } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
              perUser.push({ user, articles: [] });
          }
      }
      return perUser;
  });

    const userNewsSummaries: {
      user: UserForNewsEmail;
      newsContent: string | null;
    }[] = [];

        for (const { user, articles } of results) {
                try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

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
        console.error("Failed to summarize news for : ", user.email);
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
        threshold: alert.threshold,
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
    const priceMap = new Map<string, number>();

    await step.run("fetch-stock-prices", async () => {
      const priceResults = await Promise.allSettled(
        uniqueSymbols.map(async (symbol) => {
          try {
            const quote = await getStockQuote(symbol);
            return { symbol, price: quote?.currentPrice || null };
          } catch (error) {
            return { symbol, price: null };
          }
        })
      );

      priceResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.price !== null) {
          priceMap.set(result.value.symbol, result.value.price);
        }
      });
    });

    const triggeredAlerts: Array<{
      alert: typeof activeAlerts[0];
      currentPrice: number;
    }> = [];

    for (const alert of activeAlerts) {
      const currentPrice = priceMap.get(alert.symbol);
      
      if (!currentPrice) {
        continue;
      }

      const shouldTrigger =
        alert.alertType === "upper"
          ? currentPrice >= alert.threshold
          : currentPrice <= alert.threshold;

      if (shouldTrigger && !alert.triggeredAt) {
        triggeredAlerts.push({ alert, currentPrice });
      }
    }

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
        threshold: number;
        triggeredAt?: Date | string;
      };
      currentPrice: number;
      email: string;
      name: string;
    };

    const alertsWithUserInfo = await step.run("fetch-user-info", async (): Promise<AlertWithUserInfo[]> => {
      const uniqueUserIds = [...new Set(triggeredAlerts.map((t) => t.alert.userId))];
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      
      if (!db) {
        throw new Error("MongoDB connection not found");
      }

      const userCollection = db.collection("user");
      const result: AlertWithUserInfo[] = [];

      for (const userId of uniqueUserIds) {
        try {
          const user = await userCollection.findOne<{ id: string; email: string; name: string }>(
            { id: userId },
            { projection: { _id: 1, id: 1, email: 1, name: 1 } }
          );

          if (user && user.email && user.name) {
            const alertsForUser = triggeredAlerts.filter(
              (t) => t.alert.userId === userId
            );
            alertsForUser.forEach(({ alert, currentPrice }) => {
              result.push({
                alert,
                currentPrice,
                email: user.email,
                name: user.name,
              });
            });
          }
        } catch (error) {
        }
      }

      return result;
    });

    await step.run("send-alert-emails", async () => {
      await Promise.allSettled(
        alertsWithUserInfo.map(async ({ alert, currentPrice, email, name }) => {
          try {
          
            await sendPriceAlertEmail({
              email,
              name,
              symbol: alert.symbol,
              company: alert.company,
              currentPrice,
              targetPrice: alert.threshold,
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
              
              await sendPushNotifications(
                subscriptions,
                {
                  title: `${alertEmoji} Price Alert: ${alert.symbol}`,
                  body: `${alert.symbol} (${alert.company}) is ${alertDirection} your target price of $${alert.threshold.toFixed(2)}. Current price: $${currentPrice.toFixed(2)}`,
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
            console.error(
              `Error sending push notifications for user ${userId}:`,
              error
            );
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
