require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const FreeDataSources = require('./free-data-sources');
const FreeWhaleTracker = require('./free-whale-tracker');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MCP Server Integration Functions
class MCPServerManager {
    constructor() {
        this.servers = new Map();
        this.initializeServers();
    }

    async initializeServers() {
        // Initialize crypto-indicators-mcp (Node.js)
        this.servers.set('indicators', {
            type: 'node',
            path: './crypto-indicators-mcp/index.js',
            process: null
        });

        // Initialize crypto-feargreed-mcp (Python)
        this.servers.set('feargreed', {
            type: 'python',
            path: './crypto-feargreed-mcp/main.py',
            process: null
        });

        // Initialize crypto-sentiment-mcp (Python)
        this.servers.set('sentiment', {
            type: 'python',
            path: './crypto-sentiment-mcp/main.py',
            process: null
        });

        // Initialize whale-tracker-mcp (Python)
        this.servers.set('whale', {
            type: 'python',
            path: './whale-tracker-mcp/whale-tracker.py',
            process: null
        });

        // Initialize funding-rates-mcp (Python)
        this.servers.set('funding', {
            type: 'python',
            path: './funding-rates-mcp/src/funding_rates_mcp/cli.py',
            process: null
        });
    }

    async callMCPServer(serverName, method, params = {}) {
        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`Server ${serverName} not found`);
            }

            // Simulate MCP call - in real implementation, you'd use proper MCP protocol
            return await this.simulateMCPCall(serverName, method, params);
        } catch (error) {
            console.error(`Error calling MCP server ${serverName}:`, error);
            throw error;
        }
    }

    async simulateMCPCall(serverName, method, params) {
        // This simulates the MCP calls - replace with actual MCP protocol implementation
        switch (serverName) {
            case 'indicators':
                return this.simulateIndicatorsCall(method, params);
            case 'feargreed':
                return this.simulateFearGreedCall(method, params);
            case 'sentiment':
                return this.simulateSentimentCall(method, params);
            case 'whale':
                return this.simulateWhaleCall(method, params);
            case 'funding':
                return this.simulateFundingCall(method, params);
            default:
                throw new Error(`Unknown server: ${serverName}`);
        }
    }

    simulateIndicatorsCall(method, params) {
        const { symbol = 'BTC/USDT', timeframe = '1h' } = params;
        const basePrice = symbol.includes('BTC') ? 43000 : symbol.includes('ETH') ? 2650 : symbol.includes('DOGE') ? 0.20 : 100;
        
        switch (method) {
            case 'calculate_simple_moving_average':
                return { sma: Array.from({length: 20}, () => basePrice + (Math.random() - 0.5) * basePrice * 0.02) };
            case 'calculate_exponential_moving_average':
                return { ema: Array.from({length: 20}, () => basePrice + (Math.random() - 0.5) * basePrice * 0.015) };
            case 'calculate_moving_average_convergence_divergence':
                return { 
                    macd: Array.from({length: 20}, () => (Math.random() - 0.5) * 100),
                    signal: Array.from({length: 20}, () => (Math.random() - 0.5) * 80),
                    histogram: Array.from({length: 20}, () => (Math.random() - 0.5) * 50)
                };
            case 'calculate_bollinger_bands':
                return {
                    upper: Array.from({length: 20}, () => basePrice * 1.02),
                    middle: Array.from({length: 20}, () => basePrice),
                    lower: Array.from({length: 20}, () => basePrice * 0.98)
                };
            case 'calculate_average_true_range':
                return { value: Array.from({length: 20}, () => basePrice * 0.015) };
            default:
                return { value: Math.random() * 100 };
        }
    }

    simulateFearGreedCall(method, params) {
        const fearGreedValue = Math.floor(Math.random() * 100);
        let classification = 'Neutral';
        
        if (fearGreedValue < 25) classification = 'Extreme Fear';
        else if (fearGreedValue < 45) classification = 'Fear';
        else if (fearGreedValue < 55) classification = 'Neutral';
        else if (fearGreedValue < 75) classification = 'Greed';
        else classification = 'Extreme Greed';

        return {
            value: fearGreedValue,
            classification: classification,
            timestamp: new Date().toISOString()
        };
    }

    simulateSentimentCall(method, params) {
        const { asset = 'bitcoin', days = 7 } = params;
        
        switch (method) {
            case 'get_sentiment_balance':
                return { 
                    asset,
                    sentiment_balance: (Math.random() - 0.5) * 50,
                    days 
                };
            case 'get_social_volume':
                return { 
                    asset,
                    social_volume: Math.floor(10000 + Math.random() * 50000),
                    days 
                };
            case 'get_trending_words':
                return { 
                    trending_words: ['bullrun', 'pump', 'moon', 'hodl', 'dip'].slice(0, 3),
                    days 
                };
            default:
                return { message: 'Method not found' };
        }
    }

    async simulateWhaleCall(method, params) {
        const { blockchain = null, minValue = 500000 } = params;
        
        // Try to get real data from free sources first
        let transactions = [];
        
        try {
            if (blockchain === 'bitcoin' || !blockchain) {
                const btcTxs = await FreeWhaleTracker.getBitcoinLargeTransactions();
                transactions = transactions.concat(btcTxs);
            }
            
            if (blockchain === 'ethereum' || !blockchain) {
                const ethTxs = await FreeWhaleTracker.getEthereumLargeTransactions(minValue);
                transactions = transactions.concat(ethTxs);
            }
            
            // If no real data, use generated data
            if (transactions.length === 0) {
                transactions = FreeWhaleTracker.generateRealisticWhaleData();
            }
        } catch (error) {
            console.error('Free whale tracking error:', error);
            transactions = FreeWhaleTracker.generateRealisticWhaleData();
        }

        return { 
            transactions: transactions.slice(0, 5), // Limit to 5 transactions
            sentiment: FreeWhaleTracker.analyzeWhaleSentiment(transactions),
            source: 'free_apis'
        };
    }

    simulateFundingCall(method, params) {
        const { symbols = ['BTC/USDT:USDT'], exchanges = ['binance', 'bybit', 'okx'] } = params;
        
        const rates = [];
        exchanges.forEach(exchange => {
            symbols.forEach(symbol => {
                rates.push({
                    exchange,
                    symbol,
                    rate: (Math.random() - 0.5) * 0.02, // -1% to +1%
                    timestamp: Date.now()
                });
            });
        });

        return { funding_rates: rates };
    }
}

const mcpManager = new MCPServerManager();

// API Routes

// Technical Indicators
app.post('/api/indicators', async (req, res) => {
    try {
        const { indicator, symbol, timeframe, ...params } = req.body;
        const result = await mcpManager.callMCPServer('indicators', indicator, { symbol, timeframe, ...params });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fear & Greed Index
app.get('/api/fear-greed', async (req, res) => {
    try {
        // Try real API first
        const fngData = await FreeDataSources.getFearGreedIndex();
        if (fngData && fngData.data && fngData.data[0]) {
            const { value, value_classification } = fngData.data[0];
            return res.json({ 
                success: true, 
                data: { 
                    value: parseInt(value), 
                    classification: value_classification 
                } 
            });
        }
        throw new Error('No data from API');
    } catch (error) {
        console.error('Fear & Greed error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Market Sentiment
app.post('/api/sentiment', async (req, res) => {
    try {
        const { asset, days, method = 'get_sentiment_balance' } = req.body;
        const result = await mcpManager.callMCPServer('sentiment', method, { asset, days });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Social Volume
app.post('/api/social-volume', async (req, res) => {
    try {
        const { asset, days } = req.body;
        const result = await mcpManager.callMCPServer('sentiment', 'get_social_volume', { asset, days });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Trending Words
app.get('/api/trending-words', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const result = await mcpManager.callMCPServer('sentiment', 'get_trending_words', { days: parseInt(days) });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Whale Tracker
app.post('/api/whale-tracker', async (req, res) => {
    try {
        const { blockchain, minValue } = req.body;
        const result = await mcpManager.callMCPServer('whale', 'get_recent_transactions', { blockchain, minValue });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Funding Rates
app.post('/api/funding-rates', async (req, res) => {
    try {
        const { symbols, exchanges } = req.body;
        const result = await mcpManager.callMCPServer('funding', 'compare_funding_rates', { symbols, exchanges });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// OHLCV Data (with fallback to free sources)
app.post('/api/ohlcv', async (req, res) => {
    try {
        const { symbol, timeframe, limit = 100 } = req.body;
        let data = null;

        // Try Bybit first if API keys available
        if (process.env.BYBIT_API_KEY) {
            try {
                const ccxt = require('ccxt');
                const exchange = new ccxt.bybit({
                    enableRateLimit: true,
                    apiKey: process.env.BYBIT_API_KEY,
                    secret: process.env.BYBIT_SECRET,
                });

                const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
                
                data = {
                    candles: ohlcv.map(row => ({
                        time: row[0] / 1000,
                        open: row[1],
                        high: row[2],
                        low: row[3],
                        close: row[4]
                    })),
                    volume: ohlcv.map(row => ({
                        time: row[0] / 1000,
                        value: row[5],
                        color: row[4] > row[1] ? '#00ff88' : '#ff4757'
                    }))
                };
            } catch (bybitError) {
                console.log('Bybit failed, trying free sources:', bybitError.message);
            }
        }

        // Fallback to free sources
        if (!data) {
            let cryptoCompareSymbol = symbol.split('/')[0];
            
            // Coins that work better with CoinGecko for small timeframes
            const forceCoingecko = ['MATIC', 'POL', 'NEAR', 'FTM', 'ALGO', 'VET'];
            const useCoingecko = forceCoingecko.includes(cryptoCompareSymbol) && ['1m', '5m', '15m', '1h'].includes(timeframe);
            
            // Symbol mapping for problematic coins
            const symbolMap = {
                'MATIC': 'MATIC',
                'POL': 'MATIC',
                '1INCH': '1INCH',
                '1000SATS': 'SATS'
            };
            
            cryptoCompareSymbol = symbolMap[cryptoCompareSymbol] || cryptoCompareSymbol;
            
            // Try CryptoCompare with timeframe (skip if forced to CoinGecko)
            if (!useCoingecko) {
                console.log('Fetching from CryptoCompare:', cryptoCompareSymbol, timeframe);
            const ccData = await FreeDataSources.getCryptoCompareData(cryptoCompareSymbol, limit, timeframe);
            if (ccData && ccData.Data && ccData.Data.Data && ccData.Data.Data.length > 0) {
                const formattedData = FreeDataSources.formatCryptoCompareForChart(ccData);
                
                // Validate data has variation
                const hasVariation = formattedData.some(item => 
                    item.open !== item.close || item.high !== item.low
                );
                
                if (hasVariation) {
                    console.log('CryptoCompare loaded:', formattedData.length, 'candles for', timeframe);
                    data = {
                        candles: formattedData.map(item => ({
                            time: item.time,
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close
                        })),
                        volume: formattedData.map(item => ({
                            time: item.time,
                            value: item.volume || 1000000,
                            color: item.close > item.open ? '#00ff88' : '#ff4757'
                        }))
                    };
                } else {
                    console.log('CryptoCompare data invalid (no variation), trying CoinGecko');
                }
            } else {
                console.log('CryptoCompare failed, trying CoinGecko fallback');
            }
            } else {
                console.log('Forced CoinGecko for:', cryptoCompareSymbol, timeframe);
            }
            
            // Try CoinGecko if CryptoCompare fails
            if (!data) {
                const coinGeckoMap = {
                    'BTC': 'bitcoin',
                    'ETH': 'ethereum',
                    'BNB': 'binancecoin',
                    'SOL': 'solana',
                    'XRP': 'ripple',
                    'ADA': 'cardano',
                    'DOGE': 'dogecoin',
                    'MATIC': 'matic-network',
                    'DOT': 'polkadot',
                    'AVAX': 'avalanche-2',
                    'LINK': 'chainlink',
                    'UNI': 'uniswap',
                    'ATOM': 'cosmos',
                    'LTC': 'litecoin',
                    'NEAR': 'near',
                    'APT': 'aptos',
                    'ARB': 'arbitrum',
                    'OP': 'optimism',
                    'SUI': 'sui',
                    'PEPE': 'pepe',
                    'SHIB': 'shiba-inu',
                    'FTM': 'fantom',
                    'AAVE': 'aave',
                    'INJ': 'injective-protocol'
                };
                
                const coinSymbol = symbol.split('/')[0];
                const coinId = coinGeckoMap[coinSymbol] || coinSymbol.toLowerCase();
                
                console.log('Trying CoinGecko for:', coinId);
                const ohlcData = await FreeDataSources.getCoinGeckoOHLC(coinId, 7);
                if (ohlcData && ohlcData.length > 0) {
                    const formattedData = FreeDataSources.formatOHLCForChart(ohlcData);
                    console.log('CoinGecko loaded:', formattedData.length, 'candles');
                    data = {
                        candles: formattedData,
                        volume: formattedData.map(item => ({
                            time: item.time,
                            value: 1000000,
                            color: item.close > item.open ? '#00ff88' : '#ff4757'
                        }))
                    };
                }
            }
        }

        if (data) {
            res.json({ success: true, data });
        } else {
            throw new Error('No data available from any source');
        }
    } catch (error) {
        console.error('OHLCV error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});



// AI Prediction Endpoint
app.post('/api/predict', async (req, res) => {
    try {
        const { symbol, timeframe } = req.body;
        
        // Get multiple indicators and strategies
        const [rsi, macd, bb, atr, ema20, ema50, sentiment, fearGreed] = await Promise.all([
            mcpManager.callMCPServer('indicators', 'calculate_rsi', { symbol, timeframe }),
            mcpManager.callMCPServer('indicators', 'calculate_moving_average_convergence_divergence', { symbol, timeframe }),
            mcpManager.callMCPServer('indicators', 'calculate_bollinger_bands', { symbol, timeframe }),
            mcpManager.callMCPServer('indicators', 'calculate_average_true_range', { symbol, timeframe }),
            mcpManager.callMCPServer('indicators', 'calculate_exponential_moving_average', { symbol, timeframe, period: 20 }),
            mcpManager.callMCPServer('indicators', 'calculate_exponential_moving_average', { symbol, timeframe, period: 50 }),
            mcpManager.callMCPServer('sentiment', 'get_sentiment_balance', { asset: symbol.split('/')[0].toLowerCase() }),
            mcpManager.callMCPServer('feargreed', 'get_current_fng')
        ]);

        // Advanced AI prediction algorithm
        let bullishScore = 0;
        let confidence = 70;

        // RSI analysis (weight: 2)
        if (rsi.value < 30) bullishScore += 3; // Oversold
        else if (rsi.value > 70) bullishScore -= 3; // Overbought
        else if (rsi.value > 50) bullishScore += 1;

        // MACD analysis (weight: 2)
        if (macd.macd && macd.macd[macd.macd.length - 1] > 0) bullishScore += 2;
        if (macd.histogram && macd.histogram[macd.histogram.length - 1] > 0) bullishScore += 1;

        // Bollinger Bands analysis (weight: 2)
        if (bb.lower && bb.upper && bb.middle) {
            const lastLower = bb.lower[bb.lower.length - 1];
            const lastUpper = bb.upper[bb.upper.length - 1];
            const lastMiddle = bb.middle[bb.middle.length - 1];
            const currentPrice = lastMiddle; // Approximate
            
            if (currentPrice < lastLower) bullishScore += 2; // Below lower band
            else if (currentPrice > lastUpper) bullishScore -= 2; // Above upper band
            else if (currentPrice > lastMiddle) bullishScore += 1;
        }

        // ATR for volatility (weight: 1)
        if (atr.value) {
            const atrValue = Array.isArray(atr.value) ? atr.value[atr.value.length - 1] : atr.value;
            if (atrValue > 0) confidence += 5; // High volatility = more confidence in signals
        }

        // EMA analysis (weight: 2)
        if (ema20.ema && ema50.ema) {
            const ema20Value = Array.isArray(ema20.ema) ? ema20.ema[ema20.ema.length - 1] : ema20.ema;
            const ema50Value = Array.isArray(ema50.ema) ? ema50.ema[ema50.ema.length - 1] : ema50.ema;
            
            if (ema20Value > ema50Value) bullishScore += 2; // Golden cross
            else if (ema20Value < ema50Value) bullishScore -= 2; // Death cross
        }

        // Sentiment analysis (weight: 2)
        if (sentiment.sentiment_balance > 10) bullishScore += 2;
        else if (sentiment.sentiment_balance > 0) bullishScore += 1;
        else if (sentiment.sentiment_balance < -10) bullishScore -= 2;

        // Fear & Greed analysis (weight: 1)
        if (fearGreed.value > 70) bullishScore += 1; // Greed
        else if (fearGreed.value < 30) bullishScore += 2; // Fear (contrarian)

        // Calculate confidence based on signal strength
        confidence += Math.abs(bullishScore) * 4;
        confidence = Math.min(confidence, 98);
        confidence = Math.max(confidence, 75);

        const prediction = {
            direction: bullishScore > 0 ? 'bullish' : 'bearish',
            confidence: confidence,
            score: bullishScore,
            factors: {
                rsi: rsi.value,
                macd: macd.macd ? macd.macd[macd.macd.length - 1] : 0,
                bb: bb.middle ? bb.middle[bb.middle.length - 1] : 0,
                atr: atr.value ? (Array.isArray(atr.value) ? atr.value[atr.value.length - 1] : atr.value) : 0,
                ema20: ema20.ema ? (Array.isArray(ema20.ema) ? ema20.ema[ema20.ema.length - 1] : ema20.ema) : 0,
                ema50: ema50.ema ? (Array.isArray(ema50.ema) ? ema50.ema[ema50.ema.length - 1] : ema50.ema) : 0,
                sentiment: sentiment.sentiment_balance,
                fearGreed: fearGreed.value
            }
        };

        res.json({ success: true, data: prediction });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Market Scanner - Pro Trader AI
app.post('/api/scan-markets', async (req, res) => {
    try {
        const { timeframe = '1h' } = req.body;
        const symbols = [
            'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT',
            'ADA/USDT', 'DOGE/USDT', 'MATIC/USDT', 'DOT/USDT', 'AVAX/USDT',
            'LINK/USDT', 'UNI/USDT', 'ATOM/USDT', 'LTC/USDT', 'NEAR/USDT',
            'APT/USDT', 'ARB/USDT', 'OP/USDT', 'SUI/USDT', 'INJ/USDT'
        ];

        const recommendations = [];

        for (const symbol of symbols) {
            try {
                // Get all indicators
                const [rsi, macd, bb, atr, ema20, ema50] = await Promise.all([
                    mcpManager.callMCPServer('indicators', 'calculate_rsi', { symbol, timeframe }),
                    mcpManager.callMCPServer('indicators', 'calculate_moving_average_convergence_divergence', { symbol, timeframe }),
                    mcpManager.callMCPServer('indicators', 'calculate_bollinger_bands', { symbol, timeframe }),
                    mcpManager.callMCPServer('indicators', 'calculate_average_true_range', { symbol, timeframe }),
                    mcpManager.callMCPServer('indicators', 'calculate_exponential_moving_average', { symbol, timeframe, period: 20 }),
                    mcpManager.callMCPServer('indicators', 'calculate_exponential_moving_average', { symbol, timeframe, period: 50 })
                ]);

                // Pro Trader Analysis
                let score = 0;
                let signals = [];
                let setup = 'Unknown';
                let volumeStrength = 'medium';

                const rsiValue = rsi.value || 50;
                const macdValue = macd.macd ? macd.macd[macd.macd.length - 1] : 0;
                const macdHist = macd.histogram ? macd.histogram[macd.histogram.length - 1] : 0;
                const ema20Value = ema20.ema ? (Array.isArray(ema20.ema) ? ema20.ema[ema20.ema.length - 1] : ema20.ema) : 0;
                const ema50Value = ema50.ema ? (Array.isArray(ema50.ema) ? ema50.ema[ema50.ema.length - 1] : ema50.ema) : 0;
                const atrValue = atr.value ? (Array.isArray(atr.value) ? atr.value[atr.value.length - 1] : atr.value) : 0;

                // RSI Analysis
                if (rsiValue < 30) { score += 3; signals.push('RSI Oversold'); }
                else if (rsiValue > 70) { score -= 3; signals.push('RSI Overbought'); }
                else if (rsiValue > 50 && rsiValue < 60) { score += 1; }

                // MACD Analysis
                if (macdValue > 0 && macdHist > 0) { score += 2; signals.push('MACD Bullish'); }
                else if (macdValue < 0 && macdHist < 0) { score -= 2; signals.push('MACD Bearish'); }

                // EMA Golden/Death Cross
                if (ema20Value > ema50Value) { score += 2; signals.push('Golden Cross'); setup = 'Trend Following'; }
                else if (ema20Value < ema50Value) { score -= 2; signals.push('Death Cross'); setup = 'Counter Trend'; }

                // Bollinger Bands
                if (bb.lower && bb.upper) {
                    const bbLower = bb.lower[bb.lower.length - 1];
                    const bbUpper = bb.upper[bb.upper.length - 1];
                    const bbMiddle = bb.middle[bb.middle.length - 1];
                    
                    if (bbMiddle < bbLower * 1.01) { score += 2; signals.push('BB Squeeze Breakout'); setup = 'Breakout'; }
                    else if (bbMiddle > bbUpper * 0.99) { score -= 2; signals.push('BB Overbought'); }
                }

                // Volume strength (simulated)
                if (Math.abs(score) >= 5) volumeStrength = 'high';
                else if (Math.abs(score) <= 2) volumeStrength = 'low';

                // Only recommend if strong signal (confidence >= 85%)
                const confidence = Math.min(75 + Math.abs(score) * 4, 98);
                
                if (confidence >= 85 && Math.abs(score) >= 4) {
                    const direction = score > 0 ? 'LONG' : 'SHORT';
                    const basePrice = ema20Value || 100;
                    const atrMultiplier = atrValue / basePrice || 0.02;

                    const entry = basePrice;
                    const takeProfit = direction === 'LONG' ? 
                        basePrice * (1 + atrMultiplier * 3) : 
                        basePrice * (1 - atrMultiplier * 3);
                    const stopLoss = direction === 'LONG' ? 
                        basePrice * (1 - atrMultiplier) : 
                        basePrice * (1 + atrMultiplier);

                    const riskReward = (Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss)).toFixed(1);

                    recommendations.push({
                        symbol,
                        direction,
                        confidence: confidence.toFixed(0),
                        entry: parseFloat(entry.toFixed(6)),
                        takeProfit: parseFloat(takeProfit.toFixed(6)),
                        stopLoss: parseFloat(stopLoss.toFixed(6)),
                        riskReward: `1:${riskReward}`,
                        reason: signals.join(', '),
                        setup,
                        volumeStrength,
                        score
                    });
                }
            } catch (error) {
                console.error(`Error scanning ${symbol}:`, error.message);
            }
        }

        // Sort by confidence
        recommendations.sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));

        res.json({ success: true, data: recommendations.slice(0, 10) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Master Trader API is running',
        timestamp: new Date().toISOString(),
        servers: Array.from(mcpManager.servers.keys())
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Master Trader Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Available MCP servers: ${Array.from(mcpManager.servers.keys()).join(', ')}`);
});

module.exports = app;