"use server";

import { ChatMessage, ChatContext, ChatResponse } from "@/types/support-chat";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

interface GeminiRequest {
  contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: ChatContext
): Promise<ChatResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        message: "",
        error: "AI service is not configured. Please contact support.",
      };
    }

    const systemPrompt = buildSystemPrompt(context);
    
    const contents = conversationHistory
      .slice(-10)
      .map((msg) => ({
        role: (msg.role === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: msg.content }],
      }));

    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const requestBody: GeminiRequest = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        message: "",
        error: errorData.error?.message || "Failed to get AI response. Please try again.",
      };
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        message: "",
        error: "AI response was empty. Please try again.",
      };
    }

    return {
      message: text,
    };
  } catch (error) {
    return {
      message: "",
      error: "An error occurred while processing your message. Please try again.",
    };
  }
}

function buildSystemPrompt(context: ChatContext): string {
  let portfolioInfo = `- Portfolio Holdings: ${context.portfolioHoldingsCount} stocks`;
  
  if (context.portfolioHoldings && context.portfolioHoldings.length > 0) {
    portfolioInfo += `\n- Portfolio Details:\n`;
    
    context.portfolioHoldings.forEach((holding) => {
      const gainLossInfo = holding.gainLoss !== undefined && holding.gainLossPercent !== undefined
        ? ` (${holding.gainLoss >= 0 ? '+' : ''}${holding.gainLossPercent.toFixed(2)}%, ${holding.gainLoss >= 0 ? '+' : ''}$${Math.abs(holding.gainLoss).toFixed(2)})`
        : '';
      
      const priceInfo = holding.currentPrice !== undefined
        ? ` @ $${holding.currentPrice.toFixed(2)}`
        : '';
      
      const sectorInfo = holding.sector ? ` [${holding.sector}${holding.industry ? ` - ${holding.industry}` : ''}]` : '';
      
      portfolioInfo += `  • ${holding.symbol}: ${holding.quantity} shares @ avg $${holding.averageCost.toFixed(2)}${priceInfo}${gainLossInfo}${sectorInfo}\n`;
    });
    
    if (context.portfolioTotalValue !== undefined && context.portfolioTotalCost !== undefined) {
      portfolioInfo += `- Total Portfolio Value: $${context.portfolioTotalValue.toFixed(2)}\n`;
      portfolioInfo += `- Total Cost Basis: $${context.portfolioTotalCost.toFixed(2)}\n`;
      
      if (context.portfolioTotalGainLoss !== undefined && context.portfolioTotalGainLossPercent !== undefined) {
        const totalGainLoss = context.portfolioTotalGainLoss;
        const totalGainLossPercent = context.portfolioTotalGainLossPercent;
        portfolioInfo += `- Total Gain/Loss: ${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss).toFixed(2)} (${totalGainLoss >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%)\n`;
      }
    }
  }

  return `You are a helpful AI support assistant for Stock Tracker, a stock market tracking and portfolio management platform.

USER CONTEXT:
- Subscription Plan: ${context.subscriptionPlan}
${portfolioInfo}
- Active Alerts: ${context.activeAlertsCount}

KNOWLEDGE BASE:
${context.faqKnowledge}

GUIDELINES:
1. Be friendly, professional, and concise
2. Answer questions about Stock Tracker features, subscription plans, portfolio management, alerts, and stock tracking
3. When users ask about their portfolio, provide specific insights based on their actual holdings, including:
   - Performance analysis of individual positions
   - Sector/industry diversification insights
   - Suggestions for portfolio optimization
   - Risk assessment based on their holdings
   - Market trends affecting their specific stocks
4. Reference the FAQ knowledge base when relevant
5. For subscription-related questions, highlight benefits of ${context.subscriptionPlan === "free" ? "Pro/Enterprise" : context.subscriptionPlan} plans when appropriate
6. For technical issues, provide step-by-step solutions
7. If you don't know something, admit it and suggest contacting support
8. Keep responses conversational and helpful, not robotic
9. For Pro/Enterprise users, acknowledge their plan benefits
10. When discussing portfolio performance, be specific and reference actual holdings when relevant

Your role is to assist users effectively while encouraging platform engagement and providing valuable portfolio insights.`;
}

