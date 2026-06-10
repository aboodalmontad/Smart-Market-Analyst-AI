/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Search,
  Briefcase,
  History,
  RefreshCw,
  BookOpen,
  ShieldAlert,
  CheckCircle,
  ExternalLink,
  Cpu,
  Clock,
  AlertTriangle,
  Award,
  ArrowUpRight,
  TrendingUp as Bullet,
  CornerDownRight,
  HelpCircle,
  Wallet,
  Bell,
  Trash2,
  Volume2
} from "lucide-react";
import { MarketAnalysisReport, PortfolioAsset, PortfolioAlert } from "./types";

// Preseeded list of core assets across Stocks, Gold, and Crypto
interface SeedAsset {
  ticker: string;
  name: string;
  type: "stock" | "commodity" | "crypto";
  iconName: string;
}

const SEED_ASSETS: SeedAsset[] = [
  { ticker: "AAPL", name: "شركة أبل (Apple Inc.)", type: "stock", iconName: "AAPL" },
  { ticker: "NVDA", name: "شركة إنفيديا (NVIDIA Corp.)", type: "stock", iconName: "NVDA" },
  { ticker: "TSLA", name: "تيسلا موتورز (Tesla Motors)", type: "stock", iconName: "TSLA" },
  { ticker: "MSFT", name: "مايكروسوفت (Microsoft)", type: "stock", iconName: "MSFT" },
  { ticker: "XAU", name: "الذهب الفوري (Gold Spot vs USD)", type: "commodity", iconName: "XAU" },
  { ticker: "BTC", name: "بيتكوين (Bitcoin vs USD)", type: "crypto", iconName: "BTC" },
  { ticker: "ETH", name: "إيثيريوم (Ethereum vs USD)", type: "crypto", iconName: "ETH" },
  { ticker: "SOL", name: "سولانا (Solana vs USD)", type: "crypto", iconName: "SOL" },
];

interface TradeLog {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  type: "BUY" | "SELL";
  timestamp: string;
}

interface Candlestick {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  ma: number;
  volume: number;
  isUp: boolean;
}

function seedRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

function generateCandleData(basePrice: number, tickerStr: string, interval: "1m" | "5m" | "1h" | "1d"): Candlestick[] {
  const rand = seedRandom(tickerStr + "_" + interval);
  const count = 22;
  const times: string[] = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime());
    if (interval === "1m") {
      d.setMinutes(now.getMinutes() - i);
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      times.push(`${hrs}:${mins}`);
    } else if (interval === "5m") {
      const remainder = now.getMinutes() % 5;
      d.setMinutes(now.getMinutes() - remainder - i * 5);
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      times.push(`${hrs}:${mins}`);
    } else if (interval === "1h") {
      d.setHours(now.getHours() - i);
      const hrs = String(d.getHours()).padStart(2, '0');
      times.push(`${hrs}:00`);
    } else { // 1d
      d.setDate(now.getDate() - i);
      const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      times.push(`${d.getDate()} ${monthsAr[d.getMonth()]}`);
    }
  }

  let currentVal = basePrice;
  const rawCandles: { open: number; close: number; high: number; low: number; volume: number }[] = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const volatility = (interval === "1m" ? 0.0006 : interval === "5m" ? 0.0016 : interval === "1h" ? 0.004 : 0.012);
    const change = (rand() - 0.48) * 2 * volatility;
    const nextClose = currentVal / (1 + change);
    
    const close = currentVal;
    const open = nextClose;
    
    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);
    const high = maxOC + (rand() * volatility * 0.75) * currentVal;
    const low = minOC - (rand() * volatility * 0.75) * currentVal;
    const volume = Math.floor(1000 + rand() * 9000);
    
    rawCandles.unshift({ open, close, high, low, volume });
    currentVal = nextClose;
  }
  
  const finalCandles: Candlestick[] = [];
  const maPeriod = 5;
  for (let i = 0; i < count; i++) {
    const raw = rawCandles[i];
    let maSum = 0;
    let maCount = 0;
    for (let j = Math.max(0, i - maPeriod + 1); j <= i; j++) {
      maSum += rawCandles[j].close;
      maCount++;
    }
    const ma = maSum / maCount;
    
    finalCandles.push({
      time: times[i],
      open: raw.open,
      high: raw.high,
      low: raw.low,
      close: raw.close,
      ma: ma,
      volume: raw.volume,
      isUp: raw.close >= raw.open
    });
  }
  
  return finalCandles;
}

export default function App() {
  // State variables
  const [selectedAsset, setSelectedAsset] = useState<SeedAsset>(SEED_ASSETS[4]); // Defaults to XAU/Gold
  const [customTicker, setCustomTicker] = useState<string>("");
  const [customType, setCustomType] = useState<"stock" | "commodity" | "crypto">("stock");
  const [customName, setCustomName] = useState<string>("");
  
  const [report, setReport] = useState<MarketAnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "portfolio" | "risk-guide">("analysis");

  // Chart view toggles
  const [showMA, setShowMA] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [chartInterval, setChartInterval] = useState<"1m" | "5m" | "1h" | "1d">("1d");

  // Simulated Portfolio state
  const [balance, setBalance] = useState<number>(100000);
  const [holdings, setHoldings] = useState<PortfolioAsset[]>([]);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Alert states
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [triggeredAlertsQueue, setTriggeredAlertsQueue] = useState<PortfolioAlert[]>([]);
  const [alertSymbol, setAlertSymbol] = useState<string>("");
  const [alertType, setAlertType] = useState<"above_profit" | "below_loss">("above_profit");
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>("");
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Save alerts to local storage
  const saveAlerts = (newAlerts: PortfolioAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem("sma_alerts", JSON.stringify(newAlerts));
    } catch (e) {
      console.error("Failed to persist alerts state:", e);
    }
  };

  // Top Index Tapes simulation
  const [indexTicks, setIndexTicks] = useState({
    sp500: { price: 5432.10, change: 0.45 },
    nasdaq: { price: 18765.40, change: 0.82 },
    gold: { price: 2415.80, change: -0.15 },
    btc: { price: 68120.00, change: 2.14 },
  });

  // Load Simulative Paper money portfolio from local storage on mount
  useEffect(() => {
    try {
      const storedBalance = localStorage.getItem("sma_balance");
      const storedHoldings = localStorage.getItem("sma_holdings");
      const storedLogs = localStorage.getItem("sma_trade_logs");
      const storedAlerts = localStorage.getItem("sma_alerts");

      if (storedBalance) setBalance(parseFloat(storedBalance));
      if (storedHoldings) setHoldings(JSON.parse(storedHoldings));
      if (storedLogs) setTradeLogs(JSON.parse(storedLogs));
      if (storedAlerts) setAlerts(JSON.parse(storedAlerts));
    } catch (e) {
      console.error("Failed to load browser storage constraints:", e);
    }
  }, []);

  // Save Simulative Paper portfolio to local storage
  const savePortfolio = (newBalance: number, newHoldings: PortfolioAsset[], newLogs: TradeLog[]) => {
    try {
      localStorage.setItem("sma_balance", newBalance.toString());
      localStorage.setItem("sma_holdings", JSON.stringify(newHoldings));
      localStorage.setItem("sma_trade_logs", JSON.stringify(newLogs));
    } catch (e) {
      console.error("Failed to persist simulation state:", e);
    }
  };

  // Check if any alerts are triggered for a given ticker and price
  const checkAlerts = (ticker: string, currentPrice: number) => {
    setAlerts(currentAlerts => {
      let triggeredAny = false;
      const updatedAlerts = currentAlerts.map(alert => {
        if (alert.isActive && alert.symbol.toLowerCase() === ticker.toLowerCase()) {
          const isTriggered = 
            (alert.type === "above_profit" && currentPrice >= alert.targetPrice) ||
            (alert.type === "below_loss" && currentPrice <= alert.targetPrice);
          
          if (isTriggered) {
            triggeredAny = true;
            const triggeredItem = {
              ...alert,
              isActive: false,
              triggeredAt: new Date().toISOString(),
              triggeredPrice: currentPrice
            };
            setTriggeredAlertsQueue(prev => {
              if (prev.some(p => p.id === alert.id)) return prev;
              return [triggeredItem, ...prev];
            });
            return triggeredItem;
          }
        }
        return alert;
      });

      if (triggeredAny) {
        try {
          localStorage.setItem("sma_alerts", JSON.stringify(updatedAlerts));
        } catch (e) {
          console.error("Failed to commit triggered alerts to local storage:", e);
        }
        return updatedAlerts;
      }
      return currentAlerts;
    });
  };

  // Run the analysis API call on selected asset
  const triggerAnalysis = async (ticker: string, type: "stock" | "commodity" | "crypto", name: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, assetType: type, assetName: name }),
      });
      if (!response.ok) {
        throw new Error("فشل الاتصال بخدمة التحليل الرئيسية.");
      }
      const data = await response.json();
      setReport(data);
      checkAlerts(ticker, data.currentPrice);
      
      // Sync simulated holding current price if asset and ticker exists
      setHoldings(prev => {
        const updated = prev.map(item => {
          if (item.symbol.toLowerCase() === ticker.toLowerCase()) {
            const ratio = ((data.currentPrice - item.avgBuyPrice) / item.avgBuyPrice) * 100;
            return {
              ...item,
              currentPrice: data.currentPrice,
              plPercentage: Number(ratio.toFixed(2))
            };
          }
          return item;
        });
        try {
          localStorage.setItem("sma_holdings", JSON.stringify(updated));
        } catch (e) {
          console.warn("Storage write failed due to browser sandbox or private mode limits:", e);
        }
        return updated;
      });

    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء تحليل الأصول المالية.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger default analysis on launch
  useEffect(() => {
    triggerAnalysis(selectedAsset.ticker, selectedAsset.type, selectedAsset.name);
  }, [selectedAsset]);

  // Simulating small random variations in top index rates for lifelike Bloomberg environment experience
  useEffect(() => {
    const timer = setInterval(() => {
      setIndexTicks(prev => {
        const tickVal = (v: number) => Number((v + (Math.random() - 0.5) * (v * 0.001)).toFixed(2));
        const chgVal = (chg: number) => Number((chg + (Math.random() - 0.5) * 0.1).toFixed(2));
        return {
          sp500: { price: tickVal(prev.sp500.price), change: chgVal(prev.sp500.change) },
          nasdaq: { price: tickVal(prev.nasdaq.price), change: chgVal(prev.nasdaq.change) },
          gold: { price: tickVal(prev.gold.price), change: chgVal(prev.gold.change) },
          btc: { price: tickVal(prev.btc.price), change: chgVal(prev.btc.change) },
        };
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Simulating live real-time price fluctuation for current portfolio items, triggering user-defined alerts
  useEffect(() => {
    const timer = setInterval(() => {
      setHoldings(prev => {
        if (prev.length === 0) return prev;
        let changed = false;
        const updated = prev.map(item => {
          // Fluctuat price by a tiny percentage (e.g. -0.2% to +0.2%)
          const pct = (Math.random() - 0.5) * 0.004; 
          const newPrice = Number((item.currentPrice * (1 + pct)).toFixed(2));
          if (newPrice !== item.currentPrice) {
            changed = true;
            // Fire check alerts dynamically!
            checkAlerts(item.symbol, newPrice);
            const ratio = ((newPrice - item.avgBuyPrice) / item.avgBuyPrice) * 100;
            return {
              ...item,
              currentPrice: newPrice,
              plPercentage: Number(ratio.toFixed(2))
            };
          }
          return item;
        });

        if (changed) {
          try {
            localStorage.setItem("sma_holdings", JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage write failed:", e);
          }
          return updated;
        }
        return prev;
      });
    }, 5000); // Check and fluctuate positions every 5 seconds
    return () => clearInterval(timer);
  }, []);

  // Handle custom ticker form search submit
  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTicker.trim()) return;
    
    const formedAsset: SeedAsset = {
      ticker: customTicker.trim().toUpperCase(),
      name: customName.trim() || `أصل مالي وتحليل (${customTicker.toUpperCase()})`,
      type: customType,
      iconName: customTicker.substring(0, 3).toUpperCase()
    };
    
    setSelectedAsset(formedAsset);
    setCustomTicker("");
    setCustomName("");
  };

  // Simulative Execution of Trade decisions (BUY / SELL)
  const handleSimulateTrade = (type: "BUY" | "SELL") => {
    if (!report) return;
    const price = report.currentPrice;
    const cost = price * tradeQty;

    if (type === "BUY") {
      if (cost > balance) {
        setTradeSuccessMsg("❌ خطأ: الرصيد الافتراضي المتاح غير كافٍ لإتمام هذه الصفقة.");
        setTimeout(() => setTradeSuccessMsg(null), 4000);
        return;
      }

      const newBalance = Number((balance - cost).toFixed(2));
      let updatedHoldings = [...holdings];
      const existingIdx = holdings.findIndex(h => h.symbol.toLowerCase() === report.ticker.toLowerCase());

      if (existingIdx > -1) {
        const item = holdings[existingIdx];
        const newQty = item.quantity + tradeQty;
        const newAvg = Number(((item.avgBuyPrice * item.quantity + cost) / newQty).toFixed(2));
        updatedHoldings[existingIdx] = {
          ...item,
          quantity: newQty,
          avgBuyPrice: newAvg,
          currentPrice: price,
          plPercentage: Number((((price - newAvg) / newAvg) * 100).toFixed(2))
        };
      } else {
        updatedHoldings.push({
          id: `${Date.now()}-${report.ticker}`,
          name: report.assetName,
          symbol: report.ticker,
          type: selectedAsset.type,
          avgBuyPrice: price,
          quantity: tradeQty,
          currentPrice: price,
          plPercentage: 0
        });
      }

      const newLog: TradeLog = {
        symbol: report.ticker,
        name: report.assetName,
        quantity: tradeQty,
        price: price,
        type: "BUY",
        timestamp: new Date().toISOString()
      };
      const newLogs = [newLog, ...tradeLogs];

      setBalance(newBalance);
      setHoldings(updatedHoldings);
      setTradeLogs(newLogs);
      savePortfolio(newBalance, updatedHoldings, newLogs);
      setTradeSuccessMsg(`✅ تم بنجاح شراء ${tradeQty} وحدة من ${report.assetName} بسعر $${price.toLocaleString()}`);
    } else {
      // SELL trade logic
      const existingIdx = holdings.findIndex(h => h.symbol.toLowerCase() === report.ticker.toLowerCase());
      if (existingIdx === -1 || holdings[existingIdx].quantity < tradeQty) {
        setTradeSuccessMsg("❌ خطأ: لا تملك كمية كافية من هذا الأصل لإتمام أمر البيع.");
        setTimeout(() => setTradeSuccessMsg(null), 4000);
        return;
      }

      const item = holdings[existingIdx];
      const revenue = price * tradeQty;
      const newBalance = Number((balance + revenue).toFixed(2));
      let updatedHoldings = [...holdings];

      if (item.quantity === tradeQty) {
        updatedHoldings.splice(existingIdx, 1);
      } else {
        const newQty = item.quantity - tradeQty;
        updatedHoldings[existingIdx] = {
          ...item,
          quantity: newQty,
          plPercentage: Number((((price - item.avgBuyPrice) / item.avgBuyPrice) * 100).toFixed(2))
        };
      }

      const newLog: TradeLog = {
        symbol: report.ticker,
        name: report.assetName,
        quantity: tradeQty,
        price: price,
        type: "SELL",
        timestamp: new Date().toISOString()
      };
      const newLogs = [newLog, ...tradeLogs];

      setBalance(newBalance);
      setHoldings(updatedHoldings);
      setTradeLogs(newLogs);
      savePortfolio(newBalance, updatedHoldings, newLogs);
      setTradeSuccessMsg(`✅ تم بنجاح بيع ${tradeQty} وحدة من ${report.assetName} بسعر $${price.toLocaleString()}`);
    }

    setTimeout(() => {
      setTradeSuccessMsg(null);
    }, 4500);
  };

  // Reset paper portfolio
  const handleResetPortfolio = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين المحفظة والعمليات التداولية الافتراضية بالكامل؟")) {
      setBalance(100000);
      setHoldings([]);
      setTradeLogs([]);
      savePortfolio(100000, [], []);
    }
  };

  // Create / add new alert helper
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertSymbol.trim()) {
      setAlertSuccessMsg("❌ خطأ: يرجى إدخال رمز الأوراق المالية أو اختيار أصل صحيح.");
      setTimeout(() => setAlertSuccessMsg(null), 4000);
      return;
    }
    const target = parseFloat(alertTargetPrice);
    if (!target || target <= 0) {
      setAlertSuccessMsg("❌ خطأ: يرجى كتابة مستهدف سعري صحيح أكبر من الصفر.");
      setTimeout(() => setAlertSuccessMsg(null), 4000);
      return;
    }

    const uSymbol = alertSymbol.trim().toUpperCase();
    const existingAsset = SEED_ASSETS.find(a => a.ticker.toUpperCase() === uSymbol) || holdings.find(h => h.symbol.toUpperCase() === uSymbol);
    const assetName = existingAsset ? existingAsset.name : `${uSymbol}`;

    const newAlert: PortfolioAlert = {
      id: `${Date.now()}-${uSymbol}-${Math.floor(Math.random() * 1000)}`,
      symbol: uSymbol,
      name: assetName,
      type: alertType,
      targetPrice: target,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newAlert, ...alerts];
    saveAlerts(updated);

    setAlertSymbol("");
    setAlertTargetPrice("");
    setAlertSuccessMsg(`🔔 تم تفعيل نظام التنبيه لـ ${uSymbol} عند مستهدف $${target.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
    setTimeout(() => setAlertSuccessMsg(null), 4000);
  };

  // Delete alert option
  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    saveAlerts(updated);
  };

  // Clear all alerts
  const handleClearAlerts = () => {
    saveAlerts([]);
  };

  // Synthesize an alert chime using Web Audio API oscillators which are reliable in all sandy sandboxes
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc2.start();
      osc.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("AudioContext failing or blocked by sandboxed browser autoplay policies:", e);
    }
  };

  // Play chime whenever new items are pushed into the triggered notifications queue
  useEffect(() => {
    if (triggeredAlertsQueue.length > 0) {
      playAlertChime();
    }
  }, [triggeredAlertsQueue]);

  // Quick helper to fetch simulated values if report list of history is small
  const getChartCoordinates = (data: any[], width: number, height: number) => {
    if (!data || data.length === 0) return { path: "", maPath: "", points: [] };
    
    const prices = data.map(d => d.price);
    const mas = data.map(d => d.ma || d.price);
    const minVal = Math.min(...prices) * 0.99;
    const maxVal = Math.max(...prices) * 1.01;
    const valRange = maxVal - minVal;

    const paddingX = 40;
    const paddingY = 30;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;

    const points = data.map((d, index) => {
      const x = paddingX + (index / (data.length - 1)) * plotWidth;
      const y = height - paddingY - ((d.price - minVal) / valRange) * plotHeight;
      const maY = height - paddingY - (((d.ma || d.price) - minVal) / valRange) * plotHeight;
      return { x, y, maY, ...d };
    });

    // Create SVG paths
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const maPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.maY}`).join(" ");

    return { path, maPath, points };
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Floating Alerts Container */}
      <div className="fixed top-6 left-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {triggeredAlertsQueue.map((al) => (
            <motion.div
              key={al.id}
              initial={{ opacity: 0, x: -50, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.8 }}
              className="pointer-events-auto bg-slate-900/95 border-2 border-indigo-500/80 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 w-full text-right"
              dir="rtl"
            >
              <div className="bg-indigo-950 text-indigo-400 p-2.5 rounded-xl shrink-0">
                <Bell size={18} className="animate-bounce" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100 font-mono text-sm">{al.symbol}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">{new Date(al.triggeredAt || "").toLocaleTimeString("ar-EG")}</span>
                    <button
                      onClick={() => setTriggeredAlertsQueue(prev => prev.filter(p => p.id !== al.id))}
                      className="text-slate-500 hover:text-white transition-colors p-0.5 cursor-pointer text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-xs text-indigo-300 font-bold mt-1">
                  {al.type === "above_profit" ? "📈 كسر مستهدف الأرباح المرتفع!" : "📉 كسر مستهدف الخسائر المتدني!"}
                </p>
                <p className="text-[11.5px] text-slate-300 mt-1 leading-normal">
                  تجاوز السعر المباشر لـ <strong>{al.name}</strong> المستهدف المعين <strong>${al.targetPrice.toLocaleString()}</strong> ليسجل الآن: <strong className={al.type === "above_profit" ? "text-emerald-400" : "text-rose-400"}>${al.triggeredPrice?.toLocaleString()}</strong>
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* 1. Global Market Tape Header */}
      <div className="bg-slate-950 border-b border-slate-850 px-4 py-2.5 text-xs text-slate-400 overflow-x-auto flex items-center justify-between gap-6 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-500 shrink-0">
          <Activity size={15} />
          <span>مؤشرات السوق المباشرة (استرشادي):</span>
        </div>
        
        <div className="flex items-center gap-6 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">S&P 500:</span>
            <span className="text-white font-medium">${indexTicks.sp500.price.toLocaleString()}</span>
            <span className={indexTicks.sp500.change >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {indexTicks.sp500.change >= 0 ? "▲" : "▼"} {indexTicks.sp500.change}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">NASDAQ:</span>
            <span className="text-white font-medium">${indexTicks.nasdaq.price.toLocaleString()}</span>
            <span className={indexTicks.nasdaq.change >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {indexTicks.nasdaq.change >= 0 ? "▲" : "▼"} {indexTicks.nasdaq.change}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">XAU/USD (Gold):</span>
            <span className="text-white font-medium">${indexTicks.gold.price.toLocaleString()}</span>
            <span className={indexTicks.gold.change >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {indexTicks.gold.change >= 0 ? "▲" : "▼"} {indexTicks.gold.change}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">BTC/USD (Bitcoin):</span>
            <span className="text-white font-medium">${indexTicks.btc.price.toLocaleString()}</span>
            <span className={indexTicks.btc.change >= 0 ? "text-emerald-500" : "text-rose-500"}>
              {indexTicks.btc.change >= 0 ? "▲" : "▼"} {indexTicks.btc.change}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 shrink-0">
          <Clock size={12} />
          <span className="font-mono text-[10px]">UTC: 2026-06-02</span>
        </div>
      </div>

      {/* 2. Brand Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-emerald-500/10">
            <Cpu size={25} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="app-title-main" className="text-xl font-bold tracking-tight text-white font-sans">
                Smart Market Analyst <span className="text-emerald-500">AI</span>
              </h1>
              <span className="bg-indigo-900/60 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-700/50 font-bold font-mono">V2.5</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              منصة التحليل الفني ودعم القرار المدعوم بالذكاء الاصطناعي وبحث Gemini الحي
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 shrink-0 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
              activeTab === "analysis"
                ? "bg-gradient-to-l from-emerald-600/20 to-indigo-600/20 text-white border-b border-emerald-500 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity size={14} />
            <span>غرفة التحليل الفني</span>
          </button>
          
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 relative ${
              activeTab === "portfolio"
                ? "bg-gradient-to-l from-emerald-600/20 to-indigo-600/20 text-white border-b border-emerald-500 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase size={14} />
            <span>محفظة التدريب الافتراضي</span>
            {holdings.length > 0 && (
              <span className="absolute top-1 left-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("risk-guide")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
              activeTab === "risk-guide"
                ? "bg-gradient-to-l from-emerald-600/20 to-indigo-600/20 text-white border-b border-emerald-500 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>دليل حوكمة المخاطر</span>
          </button>
        </div>
      </header>

      {/* 3. Advisory Disclaimer Alert (Upper) */}
      <div className="bg-amber-950/30 border-b border-amber-900/40 text-amber-300/80 px-6 py-2.5 text-xs flex items-center gap-3">
        <AlertTriangle size={15}  className="shrink-0 text-amber-500" />
        <span>
          <strong>تحذير مخاطر عام:</strong> هذا البرنامج مخصص لتقديم <strong>دعم قرار استثماري استرشادي</strong> مبني على حوسبة فنية وبيانات مؤرشفة ومسترجعة بالبحث، <strong>وليس مستشاراً مالياً مرخصاً يقدم توصيات مضمونة أو بديلة للبحث الاستثماري الخاص بك.</strong> تداول بحذر.
        </span>
      </div>

      {/* 4. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Controls, Asset selection and Sim stats (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Quick Lookup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/5 to-indigo-500/5 rounded-full filter blur-xl" />
            
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
              <Search size={15} className="text-emerald-500" />
              <span>البحث واختيار الأصول المالية</span>
            </h2>

            {/* Default seed list */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SEED_ASSETS.map((asset) => {
                const isSelected = selectedAsset.ticker === asset.ticker;
                return (
                  <button
                    key={asset.ticker}
                    onClick={() => {
                      if (!loading) {
                        setSelectedAsset(asset);
                        if (activeTab !== "analysis") setActiveTab("analysis");
                      }
                    }}
                    disabled={loading}
                    className={`px-3 py-2.5 text-right rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-gradient-to-l from-emerald-600/10 to-indigo-600/10 border-emerald-500/50 text-white font-bold shadow-md shadow-emerald-500/5"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {asset.ticker}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {asset.type === "stock" ? "أسهم" : asset.type === "crypto" ? "رقمي" : "سلع"}
                      </span>
                    </div>
                    <div className="truncate mt-1 text-slate-200">
                      {asset.name.split(" ")[0]} {asset.name.split(" ")[1] || ""}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-slate-800/80 my-4" />

            {/* Custom search trigger */}
            <form onSubmit={handleCustomSearch} className="space-y-3">
              <div className="text-[11px] text-slate-400 font-semibold">تخصيص تيكر يدوي (أي تيكر عالمي):</div>
              
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="مثال: AAPL, BTC, GLD"
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value)}
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-left text-white focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={customType}
                  onChange={(e: any) => setCustomType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="stock">سهم</option>
                  <option value="crypto">رقمي</option>
                  <option value="commodity">سلعة / ذهب</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="اسم الأصل بالعربية (اختياري)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right text-slate-200 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={loading || !customTicker}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disable-style"
              >
                <Search size={13} />
                <span>تحليل هذا المؤشر المخصص</span>
              </button>
            </form>
          </div>

          {/* Paper Money Sim Stats Quick View */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full filter blur-xl" />
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Wallet size={15} className="text-indigo-400" />
                <span>الرصيد وعمليات التدريب</span>
              </h2>
              <button 
                onClick={() => setActiveTab("portfolio")} 
                className="text-[11px] text-indigo-400 hover:underline"
              >
                تفاصيل المحفظة
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850">
              <div className="text-[11px] text-slate-500 font-medium">الرصيد الافتراضي المتاح للتداول التجريبي:</div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircle size={10} />
                <span>رصيد تجريبي افتراضي 100,000$ مجاني بالكامل</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
                <span>إجمالي الأصول المفتوحة:</span>
                <span className="font-mono text-white font-semibold">{holdings.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
                <span>قيمة الأصول الحالية:</span>
                <span className="font-mono text-indigo-300 font-semibold">
                  $
                  {holdings.reduce((acc, current) => acc + (current.currentPrice * current.quantity), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>

              {holdings.length > 0 && (
                <div className="p-2 bg-slate-950/60 rounded-lg text-[10px] border border-slate-850">
                  <span className="text-slate-500">الأصول النشطة الحالية:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {holdings.map(h => (
                      <span key={h.symbol} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {h.symbol}: {h.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Card on Safe Investment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative text-slate-400 text-xs text-justify">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-emerald-500" />
              <span>مبدأ العمل في اتخاذ القرار:</span>
            </h3>
            <p className="leading-relaxed">
              تعتمد هذه الأداة على الذكاء الاصطناعي من خلال معالجة متقدمة لـ <strong>مؤشرات القوة النسبية (RSI)</strong>، قراءات الزخم الفني المتقدم <strong>(MACD)</strong>، والمتوسطات الحسابية لتقديم رؤية استشارية متوازنة. يُرجى دائمًا موازنة هذه الرؤى مع إستراتيجية إدارة المخاطر الخاصة بك.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Tab contents (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center shadow-lg min-h-[400px]">
              <div className="relative">
                <RefreshCw size={40} className="text-emerald-500 animate-spin" />
                <Cpu size={18} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">يجري الآن فحص ودراسة الأسواق المالية...</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2 mx-auto leading-relaxed">
                  يتم استدعاء Gemini AI وتفعيل قنوات البحث والاتصال المباشرة بقواعد ومؤشرات {selectedAsset.ticker} لحجز وتدقيق التقرير الفني المباشر لعام 2026.
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center shadow-lg min-h-[400px]">
              <div className="p-3.5 bg-rose-950 text-rose-500 rounded-2xl border border-rose-900/50">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">عذراً، فشل معالجة طلب التحليل المالي</h3>
                <p className="text-xs text-rose-400 max-w-sm mt-1 mx-auto">
                  {error}
                </p>
                <button
                  onClick={() => triggerAnalysis(selectedAsset.ticker, selectedAsset.type, selectedAsset.name)}
                  className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  إعادة المحاولة الآن
                </button>
              </div>
            </div>
          )}

          {!loading && !error && report && (
            <AnimatePresence mode="wait">
              
              {/* TAB 1: Main AI analytical dashboard */}
              {activeTab === "analysis" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Top Notification if Local Fallback Loaded */}
                  {report.fallbackNotice && (
                    <div className={`p-4 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
                      report.quotaExceeded 
                        ? "bg-rose-950/20 border-rose-900/40 text-rose-300"
                        : "bg-indigo-950/40 border-indigo-900/50 text-indigo-300"
                    }`}>
                      <div className="flex items-start gap-2.5">
                        <Cpu size={16} className={`shrink-0 mt-0.5 ${report.quotaExceeded ? "text-rose-400" : "text-indigo-400"}`} />
                        <div className="space-y-1">
                          <p className="font-semibold">{report.fallbackNotice}</p>
                          {report.quotaExceeded && (
                            <p className="text-[10.5px] text-slate-400 leading-relaxed">
                              لحل هذه المشكلة وتفعيل البحث الحي للأخبار والبيانات المباشرة، يرجى التوجه للزاوية العلوية واختيار <strong className="text-rose-200">الإعدادات (Settings) &gt; الأسرار (Secrets)</strong> ثم إضافة مفتاحك الخاص تحت اسم <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono text-[9px]">GEMINI_API_KEY</code>.
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded text-white shrink-0 font-medium ${
                        report.quotaExceeded ? "bg-rose-900" : "bg-indigo-900"
                      }`}>
                        {report.quotaExceeded ? "الحد الأقصى للـ API" : "محاكاة محلية نشطة"}
                      </span>
                    </div>
                  )}

                  {/* Asset Primary Data Header Block */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      
                      {/* Asset and Ticker identifiers */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-mono font-bold text-sm text-emerald-400 border border-slate-700 shadow-inner">
                          {report.ticker}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-lg font-bold text-white">{report.assetName}</h2>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                              {selectedAsset.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 inline-flex">
                            <span className="font-semibold text-slate-400 font-mono">{report.ticker}/USD</span>
                            <span>•</span>
                            <span>تحديث التحليل:</span>
                            <span className="font-mono text-[10px]">
                              {new Date(report.analysisTimestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} UTC
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current live pricing rates */}
                      <div className="text-right flex flex-row md:flex-col items-baseline md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                        <span className="text-xs text-slate-500 font-semibold md:hidden">السعر المباشر:</span>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                            ${report.currentPrice >= 1 ? report.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : report.currentPrice}
                          </div>
                          <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                            report.priceChange24h >= 0 
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" 
                              : "bg-rose-950/60 text-rose-400 border border-rose-900/40"
                          }`}>
                            {report.priceChange24h >= 0 ? "+" : ""}{report.priceChange24h}%
                            {report.priceChange24h >= 0 ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 Hidden md:block font-mono">
                          أعلى اليوم: ${report.high24h.toLocaleString()} / أدنى اليوم: ${report.low24h.toLocaleString()}
                        </div>
                      </div>

                    </div>

                    {/* Secondary statistics grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-slate-850 pt-5">
                      <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 font-semibold">القيمة السوقية:</div>
                        <div className="font-mono text-xs font-bold text-slate-200 mt-1">{report.marketCap || "N/A"}</div>
                      </div>
                      
                      <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 font-semibold">حجم التداول (24س):</div>
                        <div className="font-mono text-xs font-bold text-slate-200 mt-1">{report.volume24h || "N/A"}</div>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 font-semibold">طبيعة المعنويات:</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            report.sentiment === "Bullish" || report.sentiment === "إيجابي" ? "bg-emerald-500" :
                            report.sentiment === "Bearish" || report.sentiment === "سلبي" ? "bg-rose-500" : "bg-yellow-500"
                          }`} />
                          <span className={`text-xs font-bold ${
                            report.sentiment === "Bullish" || report.sentiment === "إيجابي" ? "text-emerald-400" :
                            report.sentiment === "Bearish" || report.sentiment === "سلبي" ? "text-rose-400" : "text-yellow-400"
                          }`}>
                            {report.sentiment === "Bullish" ? "ثور الصعود (Bullish)" : 
                             report.sentiment === "Bearish" ? "دب الهبوط (Bearish)" : "محايد (Neutral)"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 font-semibold">قاعدة التداول الأساسية:</div>
                        <div className="text-xs font-bold text-slate-300 mt-1">{report.currency === "USD" ? "الدولار الأمريكي" : report.currency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Gauges & Metrics display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* RSI Oscillator display */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">مؤشر القوة النسبية RSI</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/55 px-2 py-0.5 rounded border border-emerald-900/30">
                          {report.technicalIndicators.rsi}
                        </span>
                      </div>
                      <div className="my-5">
                        {/* Custom visual progress bar representing oversold / intermediate / overbought ranges */}
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative border border-slate-850/80">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              report.technicalIndicators.rsi >= 70 ? "bg-rose-500" :
                              report.technicalIndicators.rsi <= 30 ? "bg-blue-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${report.technicalIndicators.rsi}%` }}
                          />
                          {/* Guides for thresholds */}
                          <div className="absolute left-[30%] top-0 w-0.5 h-full bg-slate-800" title="حد بيع مفرط" />
                          <div className="absolute left-[70%] top-0 w-0.5 h-full bg-slate-800" title="حد شراء مفرط" />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 mt-1.5 font-mono">
                          <span>بيع مفرط (30)</span>
                          <span>متعادل (50)</span>
                          <span>شراء مفرط (70)</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-850/60">
                        <span className="font-semibold text-slate-400">حالة RSI: </span>
                        <span className="text-slate-200">{report.technicalIndicators.rsiStatus}</span>
                      </div>
                    </div>

                    {/* MACD Oscillator Display */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-400 block mb-2">مؤشر التقارب والتباعد (MACD)</span>
                      <div className="flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 my-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <p className="text-[11px] font-mono font-medium text-slate-300 leading-snug">
                          {report.technicalIndicators.macd}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 border-t border-slate-850/60 pt-2 mt-2">
                        <span>مستوى الزخم: </span>
                        <span className="text-slate-200 font-semibold font-sans">تراكم إيجابي مستقر</span>
                      </div>
                    </div>

                    {/* Moving Averages Display */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-400 block mb-2">المتوسطات المتحركة (MA Signals)</span>
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 font-mono text-[11px] font-medium text-slate-300 mb-2">
                        {report.technicalIndicators.movingAverages}
                      </div>
                      <div className="text-xs text-slate-400 border-t border-slate-850/60 pt-2">
                        <span>أقوى إشارة تداول: </span>
                        <span className="text-emerald-400 font-bold font-sans">تداول فوق MA 50 & 200</span>
                      </div>
                    </div>

                  </div>

                  {/* INTERACTIVE SVG CHART WORKPLACE */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-850">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                            <TrendingUp size={16} className="text-emerald-500" />
                            <span>مخطط الشموع اليابانية التفاعلي لـ {report.ticker}</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            تتبع مباشر للقنوات الفنية وحركة ارتفاع ونزول الأسعار حسب الفاصل الزمني المختار.
                          </p>
                        </div>
                        
                        {/* MA Toggle */}
                        <button
                          onClick={() => setShowMA(!showMA)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer self-start sm:self-auto ${
                            showMA 
                              ? "bg-indigo-950/60 text-indigo-400 border-indigo-800/80" 
                              : "bg-slate-950 text-slate-500 border-slate-850"
                          }`}
                        >
                          {showMA ? "إخفاء المتوسط المتحرك MA" : "إظهار المتوسط المتحرك MA"}
                        </button>
                      </div>

                      {/* Interval/Timeframe Buttons */}
                      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-850 max-w-max">
                        <span className="text-[10px] text-slate-500 font-bold px-2.5">الفاصل الزمني:</span>
                        {[
                          { value: "1m", label: "دقيقة (1m)" },
                          { value: "5m", label: "5 دقائق (5m)" },
                          { value: "1h", label: "ساعة (1h)" },
                          { value: "1d", label: "يوم (1d)" }
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => {
                              setChartInterval(item.value as any);
                              setHoveredPoint(null); // reset tooltip on timeframe switch
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                              chartInterval === item.value
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SVG Canvas */}
                    <div className="relative bg-slate-950/80 rounded-2xl p-2 border border-slate-850/60 overflow-hidden">
                      
                      {/* Technical Labels Overlay */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 text-[9px] font-mono bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2 bg-emerald-500 rounded-sm block" />
                          <span>خضراء: شمعة صعود (افتتاح &lt; إغلاق)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2 bg-rose-500 rounded-sm block" />
                          <span>حمراء: شمعة هبوط (افتتاح &gt; إغلاق)</span>
                        </div>
                        {showMA && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-indigo-500 block border-t border-dashed border-indigo-400" />
                            <span>المتوسط المتحرك (Simple MA)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 border-t border-dotted border-rose-500 block" />
                          <span>مقاومة فنية (Resistance)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 border-t border-dotted border-emerald-500 block" />
                          <span>دعم فني فوري (Support)</span>
                        </div>
                      </div>

                      {/* Chart Render Canvas */}
                      <div className="w-full h-64 md:h-80">
                        {(() => {
                          const width = 680;
                          const height = 300;
                          const paddingX = 40;
                          const paddingY = 30;
                          const plotWidth = width - paddingX * 2;
                          const plotHeight = height - paddingY * 2;

                          // Generate 22 periods of high-fidelity candle data
                          const candles = generateCandleData(report.currentPrice, report.ticker, chartInterval);
                          
                          // Determine the extrema constraints for beautiful scale placement
                          const lowPrices = candles.map(c => c.low);
                          const highPrices = candles.map(c => c.high);
                          if (report.supportLevels) {
                            lowPrices.push(...report.supportLevels);
                          }
                          if (report.resistanceLevels) {
                            highPrices.push(...report.resistanceLevels);
                          }

                          const minP = Math.min(...lowPrices) * 0.995;
                          const maxP = Math.max(...highPrices) * 1.005;
                          const range = maxP - minP;

                          const getYCoord = (val: number) => {
                            return height - paddingY - ((val - minP) / range) * plotHeight;
                          };

                          const candleWidth = (plotWidth / candles.length) * 0.76;

                          // Compute Simple Moving Average paths
                          const points = candles.map((c, i) => {
                            const x = paddingX + (i / (candles.length - 1)) * plotWidth;
                            const yMa = getYCoord(c.ma);
                            return { x, yMa };
                          });

                          const maPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yMa}`).join(" ");

                          // Find active candle hovered coords for drawing tracking lines
                          const hoveredCandleIndex = (hoveredPoint && hoveredPoint.time)
                            ? candles.findIndex(c => c.time === hoveredPoint.time)
                            : -1;
                          
                          const hoveredX = hoveredCandleIndex !== -1
                            ? paddingX + (hoveredCandleIndex / (candles.length - 1)) * plotWidth
                            : 0;

                          const hoveredY = hoveredCandleIndex !== -1
                            ? getYCoord(hoveredPoint.close)
                            : 0;

                          return (
                            <svg 
                              viewBox={`0 0 ${width} ${height}`} 
                              className="w-full h-full overflow-visible"
                              dir="ltr"
                            >
                              {/* Horizontal Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                const levelPrice = minP + ratio * range;
                                const y = getYCoord(levelPrice);
                                return (
                                  <g key={idx}>
                                    <line 
                                      x1="40" 
                                      y1={y} 
                                      x2={width - 40} 
                                      y2={y} 
                                      stroke="#1e293b" 
                                      strokeWidth="0.8" 
                                    />
                                    <text 
                                      x={width - 35} 
                                      y={y + 4} 
                                      fill="#64748b" 
                                      fontSize="8" 
                                      className="font-mono text-left"
                                    >
                                      ${levelPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Technical Resistance Planes (Upper Limit) Dotted Lines */}
                              {report.resistanceLevels && report.resistanceLevels.map((lvl, index) => {
                                const y = getYCoord(lvl);
                                return (
                                  <g key={`res-${index}`}>
                                    <line
                                      x1="40"
                                      y1={y}
                                      x2={width - 150}
                                      y2={y}
                                      stroke="#ef4444"
                                      strokeWidth="1.2"
                                      strokeDasharray="4 3"
                                      opacity="0.85"
                                    />
                                    <text
                                      x={width - 145}
                                      y={y - 3}
                                      fill="#f87171"
                                      fontSize="8"
                                      fontFamily="monospace"
                                    >
                                      R{index + 1} Resistance: ${lvl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Technical Support Planes (Lower Limit) Dotted Lines */}
                              {report.supportLevels && report.supportLevels.map((lvl, index) => {
                                const y = getYCoord(lvl);
                                return (
                                  <g key={`sup-${index}`}>
                                    <line
                                      x1="40"
                                      y1={y}
                                      x2={width - 150}
                                      y2={y}
                                      stroke="#10b981"
                                      strokeWidth="1.2"
                                      strokeDasharray="4 3"
                                      opacity="0.85"
                                    />
                                    <text
                                      x={width - 145}
                                      y={y + 8}
                                      fill="#34d399"
                                      fontSize="8"
                                      fontFamily="monospace"
                                    >
                                      S{index + 1} Support: ${lvl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Moving Average Line overlay */}
                              {showMA && (
                                <path
                                  d={maPath}
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeDasharray="3 2"
                                  opacity="0.9"
                                />
                              )}

                              {/* Interactive Crosshair Tracking Lines */}
                              {hoveredCandleIndex !== -1 && (
                                <g pointerEvents="none">
                                  {/* Vertical dot tracker */}
                                  <line
                                    x1={hoveredX}
                                    y1={paddingY}
                                    x2={hoveredX}
                                    y2={height - paddingY}
                                    stroke="#475569"
                                    strokeWidth="1.2"
                                    strokeDasharray="3 3"
                                    opacity="0.85"
                                  />
                                  {/* Horizontal dot tracker */}
                                  <line
                                    x1={paddingX}
                                    y1={hoveredY}
                                    x2={width - paddingX}
                                    y2={hoveredY}
                                    stroke="#475569"
                                    strokeWidth="1.2"
                                    strokeDasharray="3 3"
                                    opacity="0.85"
                                  />
                                  {/* Cursor intersection accent */}
                                  <circle
                                    cx={hoveredX}
                                    cy={hoveredY}
                                    r="4"
                                    fill="#ffffff"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                  />
                                </g>
                              )}

                              {/* Candlestick Marks logic */}
                              {candles.map((c, i) => {
                                const x = paddingX + (i / (candles.length - 1)) * plotWidth;
                                const yHigh = getYCoord(c.high);
                                const yLow = getYCoord(c.low);
                                const yOpen = getYCoord(c.open);
                                const yClose = getYCoord(c.close);
                                
                                const rectTop = Math.min(yOpen, yClose);
                                const rectHeight = Math.max(1.8, Math.abs(yOpen - yClose));
                                const candleColor = c.isUp ? "#22c55e" : "#ef4444"; // Vibrant trading visualization colors
                                const strokeColor = c.isUp ? "#14532d" : "#7f1d1d"; // Darker boundaries for rich contrast

                                return (
                                  <g key={i}>
                                    {/* Vertical shadow/wick line (Thicker and crisper) */}
                                    <line 
                                      x1={x} 
                                      y1={yHigh} 
                                      x2={x} 
                                      y2={yLow} 
                                      stroke={candleColor} 
                                      strokeWidth="2.2" 
                                    />
                                    
                                    {/* Candle solid block body with higher contrast border */}
                                    <rect 
                                      x={x - candleWidth / 2} 
                                      y={rectTop} 
                                      width={candleWidth} 
                                      height={rectHeight} 
                                      fill={candleColor}
                                      stroke={strokeColor}
                                      strokeWidth="1.2"
                                      rx="1.5"
                                    />

                                    {/* Hover Highlight Border Glow */}
                                    {hoveredPoint && hoveredPoint.time === c.time && (
                                      <rect 
                                        x={x - candleWidth / 2 - 2.5} 
                                        y={rectTop - 2.5} 
                                        width={candleWidth + 5} 
                                        height={rectHeight + 5} 
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="1.8"
                                        rx="2.5"
                                        pointerEvents="none"
                                      />
                                    )}

                                    {/* Time grid ticks spaced out */}
                                    {i % 4 === 0 && (
                                      <g>
                                        <line 
                                          x1={x} 
                                          y1={height - paddingY} 
                                          x2={x} 
                                          y2={height - paddingY + 4} 
                                          stroke="#334155" 
                                          strokeWidth="1" 
                                        />
                                        <text
                                          x={x}
                                          y={height - 12}
                                          fontSize="8"
                                          fill="#475569"
                                          textAnchor="middle"
                                          className="font-mono"
                                        >
                                          {c.time}
                                        </text>
                                      </g>
                                    )}

                                    {/* Capture hover interactions precisely over entire vertical spacing */}
                                    <rect
                                      x={x - (plotWidth / candles.length) / 2}
                                      y={paddingY}
                                      width={plotWidth / candles.length}
                                      height={plotHeight}
                                      fill="transparent"
                                      className="cursor-pointer hover:bg-slate-500/5 transition-colors"
                                      onMouseEnter={() => setHoveredPoint(c)}
                                      onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Tooltip on hovering point */}
                      {hoveredPoint && (
                        <div className="absolute top-2 right-2 bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-300 shadow-xl max-w-xs space-y-1.5 backdrop-blur-md z-25">
                          <p className="text-emerald-400 font-bold font-sans text-xs pb-1 border-b border-slate-800 flex justify-between gap-4">
                            <span>⏱️ الفاصل: {chartInterval === "1m" ? "دقيقة" : chartInterval === "5m" ? "5 دقائق" : chartInterval === "1h" ? "ساعة" : "يوم"}</span>
                            <span>{hoveredPoint.time || hoveredPoint.date}</span>
                          </p>
                          {hoveredPoint.open !== undefined ? (
                            <>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                                <div>الافتتاح (O): <span className="text-white font-semibold">${hoveredPoint.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                <div>الإغلاق (C): <span className={`${hoveredPoint.isUp ? "text-emerald-400" : "text-rose-400"} font-semibold`}>${hoveredPoint.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                <div>الأعلى (H): <span className="text-slate-200 font-semibold">${hoveredPoint.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                <div>الأدنى (L): <span className="text-slate-200 font-semibold">${hoveredPoint.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                              </div>
                              <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/50 flex justify-between">
                                <span>الحجم: <span className="text-slate-200 font-mono">{hoveredPoint.volume.toLocaleString()}</span></span>
                                {showMA && (
                                  <span>متوسط MA: <span className="text-indigo-400">${hoveredPoint.ma.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <p>السعر الرئيسي: <span className="text-white font-bold">${hoveredPoint.price.toLocaleString()}</span></p>
                              {hoveredPoint.ma && (
                                <p className="text-indigo-400 text-[10px]">المتوسط المتحرك: ${hoveredPoint.ma.toLocaleString()}</p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Dynamic Decision Support (Core AI Recommendation) */}
                  <div className="bg-gradient-to-l from-slate-900 to-indigo-950/70 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-600/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                            <Award size={16} />
                          </div>
                          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">مخرجات محرك الذكاء الاصطناعي الفوري لدعم القرار</span>
                        </div>
                        
                        <h4 className="text-base font-bold text-white leading-relaxed">
                          ملخص ومبررات تقييم {report.assetName} الفني والرياضي:
                        </h4>
                        
                        <p className="text-xs text-slate-300 leading-relaxed text-justify">
                          {report.decisionSupport.rationale}
                        </p>
                      </div>

                      {/* Big Target support Badge and trade execution shortcut */}
                      <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-850 w-full md:w-60 text-center shrink-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">قرار الدعم المنصوح به:</span>
                          <div className="my-2.5">
                            <span className={`text-3xl font-extrabold px-6 py-2 rounded-2xl block text-center shadow-inner ${
                              report.decisionSupport.action === "شراء" || report.decisionSupport.action === "BUY"
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                                : report.decisionSupport.action === "بيع" || report.decisionSupport.action === "SELL"
                                ? "bg-rose-950/70 text-rose-400 border border-rose-500/30"
                                : "bg-slate-900 text-slate-300 border border-slate-800"
                            }`}>
                              {report.decisionSupport.action}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-semibold">مستوى ثقة خوارزمياتنا:</span>
                              <span className="font-mono text-indigo-400 font-bold">{report.decisionSupport.confidence}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${report.decisionSupport.confidence}%` }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Order Simulator Panel widget inside report page */}
                        <div className="mt-4 pt-4 border-t border-slate-850">
                          <label className="text-[10px] text-slate-400 text-right block mb-1">محاكاة القرار الافتراضي (الكمية):</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={tradeQty}
                              onChange={(e) => setTradeQty(Math.max(0.01, parseFloat(e.target.value) || 1))}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-center w-16 text-white text-right focus:outline-none"
                            />
                            
                            <button
                              onClick={() => handleSimulateTrade("BUY")}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              شـراء
                            </button>
                            <button
                              onClick={() => handleSimulateTrade("SELL")}
                              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              بـيـع
                            </button>
                          </div>

                          {tradeSuccessMsg && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-[9px] mt-2 bg-slate-900 p-1 rounded font-medium block leading-tight text-indigo-300 border border-slate-800 text-center"
                            >
                              {tradeSuccessMsg}
                            </motion.div>
                          )}
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* Multi-Dimensional Quantitative Research Analysis (Deep Fundamental + Risks) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Deep Fundamental description */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
                          <Cpu size={14} className="text-indigo-400" />
                          <span>التحليل الأساسي والهيكلي الكلي (Fundamental Health)</span>
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed text-justify">
                          {report.fundamentalAnalysis}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-500">
                        * يتضمن فحص سيولة الفائدة الفيدرالية، الطلب المؤسسي، والأخبار التشغيلية.
                      </div>
                    </div>

                    {/* Specific Risk Warnings */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
                          <AlertTriangle size={14} className="text-rose-500" />
                          <span>تحذيرات وحوكمة المخاطر الهيكلية للرمز {report.ticker}</span>
                        </h3>
                        
                        <ul className="space-y-2.5">
                          {report.riskWarnings && report.riskWarnings.map((warn, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-slate-400">
                              <CornerDownRight size={12} className="text-rose-500 shrink-0 mt-0.5" />
                              <span>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-rose-400/80 font-medium">
                        * تجنب الرافعة المالية المفرطة وتداول دائمًا وفق سيولة احتياطية محددة.
                      </div>
                    </div>

                  </div>

                  {/* Real-time search Grounding News Section (With direct clickable URLs!) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-4">
                      <ExternalLink size={14} className="text-emerald-500" />
                      <span>الأخبار المالية المستقاة من الويب عبر البحث المباشر (Verified Grounding)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.news && report.news.map((n, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-slate-800 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-2">
                              <span className="bg-slate-900 px-2 py-0.5 rounded text-indigo-400 border border-slate-850 font-mono">
                                Source: {n.source || "Finance Feed"}
                              </span>
                              <span>• أخبار موثقة</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 mt-1 leading-normal mb-2">
                              {n.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed text-justify mb-3">
                              {n.summary}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between mt-1">
                            <span className="text-[9px] text-slate-500">مصدر متصل ومباشر لعام 2026</span>
                            {n.url ? (
                              <a 
                                href={n.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                              >
                                <span>قراءة الخبر الأصلي</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-600">رابط تم تداوله فكرياً</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Permanent disclaimer warning block inside report */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-[11px] text-slate-500 leading-relaxed text-justify">
                    <p className="flex items-center gap-1.5 font-bold mb-1 text-slate-400">
                      <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                      <span>بيان إخلاء المسؤولية المالي والتنظيمي الموحد:</span>
                    </p>
                    <p>{report.disclaimer}</p>
                  </div>

                </motion.div>
              )}

              {/* TAB 2: Detailed Simulated Paper Portfolio Room */}
              {activeTab === "portfolio" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Portfolio header values */}
                  <div className="bg-gradient-to-l from-slate-900 to-indigo-950/50 border border-slate-800 rounded-3xl p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Briefcase size={20} className="text-indigo-400" />
                          <span>غرفة حساب التداول والمحاكاة الافتراضية</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          بيئة محاكاة تداول كاملة (Paper Trading) تتيح لك اختبار توصيات وقرارات دعم التحليل الفني لشركة Smart Market Analyst دون التورط في أي خسائر حقيقية.
                        </p>
                      </div>

                      <button
                        onClick={handleResetPortfolio}
                        className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 font-bold text-xs px-3 py-2 rounded-xl transition-colors border border-rose-900/40 cursor-pointer self-stretch sm:self-auto text-center"
                      >
                        إعادة تعيين المحفظة الافتراضية والعمليات
                      </button>
                    </div>

                    {/* Numeric Capital Tracker Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-slate-850 pt-5 text-center">
                      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850">
                        <span className="text-xs text-slate-500 font-semibold block">إجمالي رأس المال الافتراضي:</span>
                        <span className="text-2xl font-bold font-mono text-white mt-1 block">$100,000.00</span>
                      </div>
                      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850">
                        <span className="text-xs text-slate-500 font-semibold block">الرصيد النقدي المتاح للتداول (Cash Balance):</span>
                        <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850">
                        <span className="text-xs text-slate-500 font-semibold block">القيمة السوقية الحالية لجميع ممتلكاتك:</span>
                        <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                          $
                          {holdings.reduce((acc, curr) => acc + (curr.quantity * curr.currentPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Holdings Tracker Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Activity size={15} className="text-emerald-500" />
                      <span>المراكز التداولية النشطة الحالية (Open Portfolio Positions)</span>
                    </h3>

                    {holdings.length === 0 ? (
                      <div className="text-center p-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                        <Briefcase size={30} className="mx-auto text-slate-600 mb-2 scale-90" />
                        <span>لا توجد أي مراكز نشطة تداولياً في المحفظة حالياً.</span>
                        <p className="mt-1 text-slate-600">تصفح لوحة التحليل، حدد تيكر أصل مالي واضغط على "شراء" لبدء محاكاة محفظتك السعرية.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-850 pb-2">
                              <th className="py-2.5 pr-2">الأصل المالي</th>
                              <th>الرمز</th>
                              <th className="text-left font-mono">الكمية</th>
                              <th className="text-left font-mono">متوسط سعر الشراء</th>
                              <th className="text-left font-mono">السعر المباشر</th>
                              <th className="text-left font-mono">القيمة الفورية</th>
                              <th className="text-left font-mono pl-2">الربح الخسارة P&L%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {holdings.map((h) => {
                              const totalVal = h.quantity * h.currentPrice;
                              const plDollar = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                              return (
                                <tr key={h.symbol} className="hover:bg-slate-950/40 transition-colors">
                                  <td className="py-3 font-semibold text-slate-200 pr-2">{h.name}</td>
                                  <td className="font-mono text-slate-300 font-bold">{h.symbol}</td>
                                  <td className="text-left font-mono font-medium text-slate-300">{h.quantity}</td>
                                  <td className="text-left font-mono text-slate-300">${h.avgBuyPrice.toLocaleString()}</td>
                                  <td className="text-left font-mono text-slate-200">${h.currentPrice.toLocaleString()}</td>
                                  <td className="text-left font-mono font-bold text-slate-100">${totalVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                  <td className={`text-left font-mono font-bold pl-2 ${plDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {plDollar >= 0 ? "▲" : "▼"}{Math.abs(h.plPercentage)}% 
                                    <span className="text-[10px] block opacity-80">${plDollar.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Real-Time Price & Risk Alerts Management */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Create Alert Panel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-1">
                      <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                        <Bell size={16} className="text-indigo-400 animate-pulse animate-duration-2000" />
                        <span>تهيئة تنبيه سعري ذكي جديد</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                        سيقوم النظام بمراقبة تحركات الأسعار بشكل مستمر وإخطارك بمجرد تجاوز أو تراجع مستهدفك السعري المحدد.
                      </p>

                      <form onSubmit={handleAddAlert} className="space-y-3.5">
                        {/* Asset Ticker Input & Select */}
                        <div>
                          <label className="block text-[11px] text-slate-400 font-bold mb-1">رمز الأصل المالي (Ticker):</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={alertSymbol}
                              onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                              placeholder="مثال: AAPL, BTC, ETH"
                              className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-all text-right"
                              required
                            />
                            {holdings.length > 0 && (
                              <select
                                onChange={(e) => {
                                  setAlertSymbol(e.target.value);
                                  // Pre-fill target price with the current live price to be helpful!
                                  const matches = holdings.find(h => h.symbol === e.target.value);
                                  if (matches) {
                                    setAlertTargetPrice(matches.currentPrice.toString());
                                  }
                                }}
                                className="bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-2 text-[10px] text-slate-300 focus:outline-none text-right cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>أصولك...</option>
                                {holdings.map(h => (
                                  <option key={h.symbol} value={h.symbol}>{h.symbol}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Alert Type Selection */}
                        <div>
                          <label className="block text-[11px] text-slate-400 font-bold mb-1">شرط تفعيل الإشارة:</label>
                          <div className="grid grid-cols-2 gap-2" dir="rtl">
                            <button
                              type="button"
                              onClick={() => setAlertType("above_profit")}
                              className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                alertType === "above_profit"
                                  ? "bg-emerald-950/70 border-emerald-800 text-emerald-400 shadow-md"
                                  : "bg-slate-950 border-slate-850 text-slate-500"
                              }`}
                            >
                              صعود فوق (Profit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAlertType("below_loss")}
                              className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                alertType === "below_loss"
                                  ? "bg-rose-950/70 border-rose-800 text-rose-400 shadow-md"
                                  : "bg-slate-950 border-slate-850 text-slate-500"
                              }`}
                            >
                              تراجع تحت (Loss)
                            </button>
                          </div>
                        </div>

                        {/* Target Price Input */}
                        <div>
                          <label className="block text-[11px] text-slate-400 font-bold mb-1">
                            السعر المستهدف ($ USD):
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={alertTargetPrice}
                              onChange={(e) => setAlertTargetPrice(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-all text-left font-semibold"
                              required
                            />
                            <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-xs font-bold">$</span>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Bell size={13} className="shrink-0" />
                          <span>تفعيل وتثبيت منبه السعر</span>
                        </button>

                        {/* Success Feedback Display */}
                        {alertSuccessMsg && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-950/40 border border-indigo-900/30 p-2.5 rounded-xl text-[10px] text-center font-bold text-indigo-400 leading-normal"
                          >
                            {alertSuccessMsg}
                          </motion.div>
                        )}
                      </form>
                    </div>

                    {/* Active/History List Panel */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4" dir="rtl">
                          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Activity size={15} className="text-indigo-400 shrink-0" />
                            <span>مستشعرات التنبيه النشطة والتاريخية</span>
                          </h3>
                          {alerts.length > 0 && (
                            <button
                              onClick={handleClearAlerts}
                              className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors font-bold cursor-pointer"
                            >
                              حذف الكل
                            </button>
                          )}
                        </div>

                        {alerts.length === 0 ? (
                          <div className="text-center py-14 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl my-auto">
                            <Bell size={28} className="mx-auto text-slate-700 mb-2 opacity-60" />
                            <span>لا توجد أي منبهات أو شروط مخاطر جرى تعيينها حتى الآن.</span>
                            <p className="text-[10px] text-slate-600 mt-1">حدد رمزاً ومستهدفاً في النموذج الجانبي لتشغيل المنبه الذكي.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {alerts.map((al) => (
                              <div
                                key={al.id}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                  al.isActive
                                    ? "bg-slate-950 border-slate-850"
                                    : "bg-slate-950/40 border-slate-900/60 opacity-75"
                                }`}
                                dir="rtl"
                              >
                                <div className="flex items-start gap-3 text-right">
                                  <div className={`p-2 rounded-lg shrink-0 ${al.isActive ? "bg-indigo-950/60 text-indigo-400" : "bg-slate-900 text-slate-500"}`}>
                                    <Bell size={14} className={al.isActive ? "animate-bounce" : ""} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-200 font-mono">{al.symbol}</span>
                                      <span className="text-[10px] text-slate-500">• {al.name}</span>
                                    </div>
                                    <div className="text-[10.5px] mt-1 text-slate-400 flex flex-wrap items-center gap-1.5">
                                      <span>الشرط:</span>
                                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                        al.type === "above_profit"
                                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/10"
                                          : "bg-rose-950/50 text-rose-400 border border-rose-900/10"
                                      }`}>
                                        {al.type === "above_profit" ? `صعود مستهدف الربح 📈` : `هبوط حماية الخسارة 📉`}
                                      </span>
                                      <span>المستهدف:</span>
                                      <span className="font-bold text-slate-200 font-mono">${al.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-600 mt-1 font-mono">
                                      تاريخ الإنشاء: {new Date(al.createdAt).toLocaleString("ar-EG")}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-left">
                                    {al.isActive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-405 border border-indigo-900/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                        مراقبة السوق
                                      </span>
                                    ) : (
                                      <div className="text-left leading-tight">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-bold bg-amber-950 text-amber-400 border border-amber-900/30">
                                          🚨 تم التنبيه
                                        </span>
                                        {al.triggeredPrice && (
                                          <span className="block text-[8.5px] text-slate-500 font-mono mt-0.5 font-bold">
                                            سجل: ${al.triggeredPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleDeleteAlert(al.id)}
                                    className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer shrink-0"
                                    title="حذف التنبيه"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-[9.5px] text-slate-600 font-medium border-t border-slate-850/50 pt-3 mt-4 flex items-center justify-between" dir="rtl">
                        <span>* التنبيه يعمل محلياً في الخلفية ويفحص تقلبات تداولات السوق.</span>
                        {alerts.length > 0 && (
                          <span>المعينات: <strong className="text-slate-500 font-mono">{alerts.length}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Historical Trade Logs Ledger */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <History size={15} className="text-indigo-400" />
                      <span>دفتر العمليات وسجل الصفقات المنتهية (Verified Trade Logs Buffer)</span>
                    </h3>

                    {tradeLogs.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-xs">
                        <span>لا توجد سجلات عمليات منتهية بعد.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {tradeLogs.map((log, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.type === "BUY" 
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" 
                                  : "bg-rose-950 text-rose-400 border border-rose-900/30"
                              }`}>
                                {log.type === "BUY" ? "شراء" : "بيع"}
                              </span>
                              <div>
                                <span className="font-bold text-slate-200 block">{log.name}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(log.timestamp).toLocaleString("ar-EG")}
                                </span>
                              </div>
                            </div>

                            <div className="text-left font-mono">
                              <div className="text-slate-300 font-bold">
                                {log.quantity} {log.symbol}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                بسعر: ${log.price.toLocaleString()} • إجمالي: ${(log.price * log.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              )}

              {/* TAB 3: Advanced Risk Governance Guide & Financial advisory rules */}
              {activeTab === "risk-guide" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert size={18} className="text-indigo-400" />
                        <span>دليل إدارة المخاطر المالية والاسترشاد الفني بالذكاء الاصطناعي</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        إطار منهجي لتعزيز حوكمة تداول واستثمار واعي وتقييد عواطف الجشع والخوف الاستثماري السلوكي.
                      </p>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-justify">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3 font-mono">1</div>
                        <h4 className="text-xs font-bold text-slate-200 mb-2">إستراتيجية توزيع المحفظة والسيولة</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          يوصي خبراء المخاطر بألا تزيد إجمالي الموازنة لسلع عالية الخطورة كـ البيتكوين أو الأسهم الفردية عن 5-10% من إجمالي رأس المال السائل، والاحتفاظ دائماً بسيولة نقدية قوية (Cash Buffer) لمواجهة التصحيحات المفاجئة.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-justify">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3 font-mono">2</div>
                        <h4 className="text-xs font-bold text-slate-200 mb-2">تأمين الخسائر وإيقاف الضرر الفوري</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          الذكاء الاصطناعي يستنبط مستويات الدعم الفنية (Support levels). كسر هذه المستويات بحجم تداول كثيف يمثل إشارة تصفية مؤقتة ذكية لوقف تسييل الخسائر المتفاقمة وتأهيل السيولة لإعادة البناء عند القيعان.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-justify">
                        <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-900/30 text-purple-400 flex items-center justify-center font-bold text-xs mb-3 font-mono">3</div>
                        <h4 className="text-xs font-bold text-slate-200 mb-2">منهج تجنب التحيزات الإدراكية (FOMO)</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          تحدث معظم الخسائر عند الشراء المفرط الاندفاعي بسب الرغبة العاطفية في عدم تفويت الأرباح (FOMO). فحص مؤشر RSI أعلى 75 هو التنبيه الوحيد الخوارزمي المستند للحقائق لحماية سيولتك من الصعود الشمعداني الخادع.
                        </p>
                      </div>

                    </div>

                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 leading-relaxed">
                      <p className="font-bold flex items-center gap-1.5 mb-1.5">
                        <Award size={14} className="text-indigo-400" />
                        <span>رسالة نظام Smart Market Analyst الاستشارية:</span>
                      </p>
                      <span>
                        إن الغاية الجوهرية من الذكاء الاصطناعي في الاستثمار هي فلترة وتنقيح ضجيج الأخبار وحل تعقيدات الرياضيات الفنية. نأمل أن تساهم هذه الأيقونة في خلق مستثمر واعي يتبنى المنطق والدراسات المنهجية بدلاً من الشائعات والصدمات العاطفية.
                      </span>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </div>

      </main>

      {/* 5. Compact design status footer */}
      <footer className="bg-slate-950 border-t border-slate-850/80 px-6 py-4 mt-12 text-center text-xs text-slate-500 relative">
        <p className="font-sans font-medium text-slate-400">
          © 2026 Smart Market Analyst AI • نظام دعم القرارات المالي المستند لشبكة Gemini 3
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          بنيت الأداة كلوحة دعم استرشادية، التداولات المنفذة برأس مال وهمي. البيانات مستقاة من تداولات 2026.
        </p>
      </footer>

    </div>
  );
}
