/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TechnicalIndicators {
  rsi: number;
  rsiStatus: string;
  macd: string;
  movingAverages: string;
}

export interface GroundingNewsItem {
  title: string;
  source: string;
  url: string;
  summary: string;
}

export interface DecisionSupport {
  action: "BUY" | "SELL" | "HOLD" | "شراء" | "بيع" | "احتفاظ";
  confidence: number; // 0 to 100
  rationale: string;
}

export interface HistoricalPricePoint {
  date: string;
  price: number;
  ma?: number;
}

export interface MarketAnalysisReport {
  assetName: string;
  ticker: string;
  currentPrice: number;
  currency: string;
  priceChange24h: number; // Percentage, e.g. +1.45 or -2.3
  marketCap: string;
  volume24h: string;
  high24h: number;
  low24h: number;
  technicalSummary: string;
  technicalIndicators: TechnicalIndicators;
  sentiment: "Bullish" | "Bearish" | "Neutral" | "إيجابي" | "سلبي" | "متعادل";
  fundamentalAnalysis: string;
  supportLevels: number[];
  resistanceLevels: number[];
  news: GroundingNewsItem[];
  decisionSupport: DecisionSupport;
  riskWarnings: string[];
  disclaimer: string;
  historicalSimData: HistoricalPricePoint[];
  analysisTimestamp: string;
  fallbackNotice?: string;
  quotaExceeded?: boolean;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  type: "stock" | "commodity" | "crypto";
  avgBuyPrice: number;
  quantity: number;
  currentPrice: number;
  plPercentage: number;
}

export interface PortfolioAlert {
  id: string;
  symbol: string;
  name: string;
  type: "above_profit" | "below_loss";
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  triggeredPrice?: number;
}

