// Master Trader Dashboard JavaScript
class MasterTraderDashboard {
    constructor() {
        this.chart = null;
        this.currentSymbol = 'BTC/USDT';
        this.currentTimeframe = '1h';
        this.indicators = {};
        this.predictions = {};
        this.watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        this.init();
    }

    init() {
        this.initChart();
        this.bindEvents();
        this.startDataUpdates();
        this.loadInitialData();
    }

    initChart() {
        const chartContainer = document.getElementById('tradingChart');
        if (!window.LightweightCharts) {
            console.error('LightweightCharts not loaded');
            return;
        }
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                background: { color: 'transparent' },
                textColor: '#999',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.candlestickSeries = this.chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        });

        this.resistanceLine = this.chart.addLineSeries({
            color: 'rgba(239, 83, 80, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
        });

        this.supportLine = this.chart.addLineSeries({
            color: 'rgba(38, 166, 154, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
        });

        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
            });
        });
    }

    bindEvents() {
        document.getElementById('symbolSelect').addEventListener('change', (e) => {
            this.currentSymbol = e.target.value;
            this.loadChartData();
            this.updateIndicators();
        });

        document.getElementById('timeframeSelect').addEventListener('change', (e) => {
            this.currentTimeframe = e.target.value;
            this.refreshAllData();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAllData();
        });

        document.getElementById('watchlistBtn').addEventListener('click', () => {
            this.openWatchlist();
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                document.getElementById(modalId).style.display = 'none';
            });
        });

        document.getElementById('addToWatchlist').addEventListener('click', () => {
            this.addToWatchlist();
        });

        document.getElementById('recommendationsBtn').addEventListener('click', () => {
            this.openRecommendations();
        });

        document.getElementById('scanMarketsBtn').addEventListener('click', () => {
            this.scanMarkets();
        });
    }

    async loadInitialData() {
        await this.loadChartData();
        await this.updateFearGreedIndex();
        await this.updateMarketSentiment();
        await this.updateWhaleActivity();
        await this.updateFundingRates();
        await this.updateIndicators();
        await this.generatePrediction();
    }

    async loadChartData() {
        try {
            console.log('Loading chart:', this.currentSymbol, this.currentTimeframe);
            const response = await fetch('/api/ohlcv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: this.currentSymbol,
                    timeframe: this.currentTimeframe,
                    limit: 100
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            console.log('API result:', result);
            
            if (result.success && result.data && result.data.candles && result.data.candles.length > 0) {
                const sortedCandles = result.data.candles
                    .filter(c => c.open && c.high && c.low && c.close && c.time)
                    .sort((a, b) => a.time - b.time);
                
                if (sortedCandles.length === 0) {
                    throw new Error('No valid candles for ' + this.currentSymbol);
                }
                
                console.log('First candle:', sortedCandles[0]);
                this.candlestickSeries.setData(sortedCandles);
                this.lastPrice = sortedCandles[sortedCandles.length - 1].close;
                
                this.calculateSupportResistance(sortedCandles);
                
                console.log('Loaded:', sortedCandles.length, 'candles for', this.currentTimeframe);
            } else {
                throw new Error('No data for ' + this.currentSymbol);
            }
        } catch (error) {
            console.error('Chart error:', error);
            alert('Failed to load chart: ' + error.message);
        }
    }

    async updateFearGreedIndex() {
        try {
            const response = await fetch('/api/fear-greed');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            if (result.success && result.data) {
                const { value, classification } = result.data;
                console.log('Fear & Greed:', value, classification);
                document.getElementById('fearGreedValue').textContent = `${value} (${classification})`;
                
                const trendElement = document.getElementById('marketTrend');
                if (value > 60) {
                    trendElement.textContent = 'BULLISH';
                    trendElement.className = 'value bullish';
                } else if (value < 40) {
                    trendElement.textContent = 'BEARISH';
                    trendElement.className = 'value bearish';
                } else {
                    trendElement.textContent = 'NEUTRAL';
                    trendElement.className = 'value neutral';
                }
            }
        } catch (error) {
            console.error('Fear & Greed error:', error);
            document.getElementById('fearGreedValue').textContent = 'Error';
        }
    }

    async updateIndicators() {
        try {
            const [rsiResponse, macdResponse, bbResponse, atrResponse, ema20Response, ema50Response] = await Promise.all([
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_rsi',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe,
                        period: 14
                    })
                }),
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_moving_average_convergence_divergence',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe
                    })
                }),
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_bollinger_bands',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe
                    })
                }),
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_average_true_range',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe
                    })
                }),
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_exponential_moving_average',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe,
                        period: 20
                    })
                }),
                fetch('/api/indicators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        indicator: 'calculate_exponential_moving_average',
                        symbol: this.currentSymbol,
                        timeframe: this.currentTimeframe,
                        period: 50
                    })
                })
            ]);

            const bbResult = await bbResponse.json();
            const atrResult = await atrResponse.json();
            const ema20Result = await ema20Response.json();
            const ema50Result = await ema50Response.json();
            
            this.bollingerBands = bbResult.success ? bbResult.data : null;
            this.atr = atrResult.success && atrResult.data.value ? atrResult.data.value[atrResult.data.value.length - 1] : null;
            this.ema20 = ema20Result.success && ema20Result.data.ema ? ema20Result.data.ema[ema20Result.data.ema.length - 1] : null;
            this.ema50 = ema50Result.success && ema50Result.data.ema ? ema50Result.data.ema[ema50Result.data.ema.length - 1] : null;

            const rsiResult = await rsiResponse.json();
            const macdResult = await macdResponse.json();

            if (rsiResult.success && rsiResult.data.value) {
                const rsiValue = Array.isArray(rsiResult.data.value) ? 
                    rsiResult.data.value[rsiResult.data.value.length - 1] : rsiResult.data.value;
                
                const rsiElement = document.getElementById('rsiValue');
                rsiElement.textContent = rsiValue.toFixed(1);
                const rsiSignal = rsiElement.nextElementSibling;
                
                if (rsiValue > 70) {
                    rsiSignal.textContent = 'OVERBOUGHT';
                    rsiSignal.className = 'indicator-signal bearish';
                } else if (rsiValue < 30) {
                    rsiSignal.textContent = 'OVERSOLD';
                    rsiSignal.className = 'indicator-signal bullish';
                } else {
                    rsiSignal.textContent = 'NEUTRAL';
                    rsiSignal.className = 'indicator-signal neutral';
                }
            }

            if (macdResult.success && macdResult.data.macd) {
                const macdValue = Array.isArray(macdResult.data.macd) ? 
                    macdResult.data.macd[macdResult.data.macd.length - 1] : macdResult.data.macd;
                
                const macdElement = document.getElementById('macdValue');
                macdElement.textContent = macdValue > 0 ? `+${macdValue.toFixed(3)}` : macdValue.toFixed(3);
                const macdSignal = macdElement.nextElementSibling;
                
                if (macdValue > 0) {
                    macdSignal.textContent = 'BULLISH';
                    macdSignal.className = 'indicator-signal bullish';
                } else {
                    macdSignal.textContent = 'BEARISH';
                    macdSignal.className = 'indicator-signal bearish';
                }
            }
        } catch (error) {
            console.error('Indicators error:', error);
        }
    }

    async updateMarketSentiment() {
        try {
            const response = await fetch('/api/sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset: this.currentSymbol.split('/')[0].toLowerCase(),
                    days: 7,
                    method: 'get_sentiment_balance'
                })
            });

            if (!response.ok) {
                console.warn('Sentiment API not available');
                return;
            }

            const result = await response.json();
            if (result.success && result.data) {
                const sentimentScore = result.data.sentiment_balance || 0;
                const sentimentElement = document.getElementById('sentimentScore');
                sentimentElement.textContent = sentimentScore > 0 ? `+${sentimentScore.toFixed(1)}` : sentimentScore.toFixed(1);
                sentimentElement.className = sentimentScore > 0 ? 'sentiment-value bullish' : 'sentiment-value bearish';
            }
        } catch (error) {
            console.warn('Sentiment error:', error.message);
        }
    }

    async updateWhaleActivity() {
        try {
            const response = await fetch('/api/whale-tracker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blockchain: this.currentSymbol.includes('BTC') ? 'bitcoin' : 'ethereum',
                    minValue: 500000
                })
            });

            const result = await response.json();
            if (result.success && result.data && result.data.transactions) {
                const container = document.getElementById('whaleTransactions');
                container.innerHTML = result.data.transactions.slice(0, 3).map(tx => `
                    <div class="whale-tx">
                        <span class="whale-amount">$${(tx.amount_usd / 1000000).toFixed(1)}M</span>
                        <span class="whale-type ${tx.type}">${tx.type.toUpperCase()}</span>
                        <span class="whale-time">${tx.time_ago || 'recent'}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Whale error:', error);
        }
    }

    async updateFundingRates() {
        try {
            const response = await fetch('/api/funding-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbols: [this.currentSymbol + ':USDT'],
                    exchanges: ['binance', 'bybit', 'okx']
                })
            });

            if (!response.ok) {
                console.warn('Funding rates API not available');
                return;
            }

            const result = await response.json();
            if (result.success && result.data && result.data.funding_rates) {
                const container = document.getElementById('fundingRates');
                container.innerHTML = result.data.funding_rates.map(rate => `
                    <div class="funding-item">
                        <span class="exchange">${rate.exchange}:</span>
                        <span class="rate ${rate.rate > 0 ? 'positive' : 'negative'}">
                            ${rate.rate > 0 ? '+' : ''}${rate.rate.toFixed(4)}%
                        </span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.warn('Funding error:', error.message);
        }
    }

    async generatePrediction() {
        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: this.currentSymbol,
                    timeframe: this.currentTimeframe
                })
            });

            const result = await response.json();
            if (result.success) {
                const { direction, confidence } = result.data;
                const currentPrice = this.getCurrentPrice();
                
                const atrMultiplier = this.atr ? this.atr / currentPrice : 0.02;
                const targetPrice = direction === 'bullish' ? 
                    currentPrice * (1 + atrMultiplier * 2) : currentPrice * (1 - atrMultiplier * 2);
                const stopLoss = direction === 'bullish' ? 
                    currentPrice * (1 - atrMultiplier) : currentPrice * (1 + atrMultiplier);

                const directionElement = document.querySelector('.direction-value');
                directionElement.textContent = direction === 'bullish' ? 'BULLISH 📈' : 'BEARISH 📉';
                directionElement.className = `direction-value ${direction}`;

                document.getElementById('confidenceScore').textContent = `${confidence.toFixed(0)}%`;
                document.getElementById('targetPrice').textContent = `$${targetPrice.toLocaleString()}`;
                document.getElementById('stopLoss').textContent = `$${stopLoss.toLocaleString()}`;
                
                const riskReward = Math.abs(targetPrice - currentPrice) / Math.abs(currentPrice - stopLoss);
                document.getElementById('riskReward').textContent = `1:${riskReward.toFixed(1)}`;

                this.updateTradingSignals(direction, confidence, currentPrice, targetPrice, stopLoss);
            }
        } catch (error) {
            console.error('Prediction error:', error);
        }
    }

    async refreshAllData() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.textContent = '🔄 Refreshing...';
        refreshBtn.disabled = true;

        try {
            await Promise.all([
                this.loadChartData(),
                this.updateFearGreedIndex(),
                this.updateMarketSentiment(),
                this.updateWhaleActivity(),
                this.updateFundingRates(),
                this.updateIndicators(),
                this.generatePrediction()
            ]);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.disabled = false;
        }
    }

    startDataUpdates() {
        setInterval(() => {
            this.updateIndicators();
            this.generatePrediction();
        }, 30000);

        setInterval(() => {
            this.updateFearGreedIndex();
            this.updateMarketSentiment();
        }, 120000);

        setInterval(() => {
            this.updateWhaleActivity();
            this.updateFundingRates();
        }, 300000);
    }

    getCurrentPrice() {
        return this.lastPrice || 0;
    }

    calculateSupportResistance(candles) {
        if (!candles || candles.length < 20) return;
        
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        
        const resistance = Math.max(...highs.slice(-50));
        const support = Math.min(...lows.slice(-50));
        
        const resistanceData = candles.map(c => ({ time: c.time, value: resistance }));
        const supportData = candles.map(c => ({ time: c.time, value: support }));
        
        this.resistanceLine.setData(resistanceData);
        this.supportLine.setData(supportData);
    }



    openWatchlist() {
        document.getElementById('watchlistModal').style.display = 'flex';
        this.renderWatchlist();
    }

    async renderWatchlist() {
        const container = document.getElementById('watchlistItems');
        if (this.watchlist.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">No coins in watchlist</p>';
            return;
        }

        const items = await Promise.all(this.watchlist.map(async (item) => {
            const currentPrice = await this.fetchCurrentPrice(item.symbol);
            const change = ((currentPrice - item.entryPrice) / item.entryPrice * 100).toFixed(2);
            const changeClass = change >= 0 ? 'positive' : 'negative';
            
            return `
                <div class="watchlist-item">
                    <div class="watchlist-symbol">${item.symbol}</div>
                    <div class="watchlist-prices">
                        <div>Entry: $${item.entryPrice.toLocaleString()}</div>
                        <div>Current: $${currentPrice.toLocaleString()}</div>
                    </div>
                    <div class="watchlist-change ${changeClass}">${change >= 0 ? '+' : ''}${change}%</div>
                    <button class="remove-watchlist" data-symbol="${item.symbol}">×</button>
                </div>
            `;
        }));

        container.innerHTML = items.join('');
        
        document.querySelectorAll('.remove-watchlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeFromWatchlist(e.target.dataset.symbol);
            });
        });
    }

    async fetchCurrentPrice(symbol) {
        try {
            const response = await fetch('/api/ohlcv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, timeframe: '1h', limit: 1 })
            });
            const result = await response.json();
            if (result.success && result.data.candles.length > 0) {
                return result.data.candles[0].close;
            }
        } catch (error) {
            console.error('Fetch price error:', error);
        }
        return 0;
    }

    addToWatchlist() {
        const exists = this.watchlist.find(item => item.symbol === this.currentSymbol);
        if (exists) {
            alert('Coin already in watchlist!');
            return;
        }

        this.watchlist.push({
            symbol: this.currentSymbol,
            entryPrice: this.lastPrice || 0,
            addedAt: Date.now()
        });
        
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
    }

    openRecommendations() {
        document.getElementById('recommendationsModal').style.display = 'flex';
    }

    async scanMarkets() {
        const statusEl = document.getElementById('scanStatus');
        const itemsEl = document.getElementById('recommendationsItems');
        const scanBtn = document.getElementById('scanMarketsBtn');
        
        scanBtn.disabled = true;
        scanBtn.textContent = '🔍 Scanning...';
        statusEl.textContent = 'Analyzing markets...';
        itemsEl.innerHTML = '<div class="loading-spinner">Scanning 50+ coins...</div>';

        try {
            const response = await fetch('/api/scan-markets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeframe: this.currentTimeframe })
            });

            const result = await response.json();
            if (result.success && result.data) {
                this.renderRecommendations(result.data);
                statusEl.textContent = `Found ${result.data.length} opportunities`;
            } else {
                itemsEl.innerHTML = '<p style="text-align:center;color:#ff4757;">Scan failed. Try again.</p>';
            }
        } catch (error) {
            console.error('Scan error:', error);
            itemsEl.innerHTML = '<p style="text-align:center;color:#ff4757;">Error scanning markets</p>';
        } finally {
            scanBtn.disabled = false;
            scanBtn.textContent = '🔍 Scan Markets Now';
        }
    }

    renderRecommendations(recommendations) {
        const container = document.getElementById('recommendationsItems');
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">No strong signals found. Market conditions not ideal.</p>';
            return;
        }

        const items = recommendations.map(rec => {
            const directionClass = rec.direction === 'LONG' ? 'bullish' : 'bearish';
            const directionIcon = rec.direction === 'LONG' ? '📈' : '📉';
            const profitPercent = ((rec.takeProfit - rec.entry) / rec.entry * 100).toFixed(2);
            const riskPercent = ((rec.entry - rec.stopLoss) / rec.entry * 100).toFixed(2);
            
            return `
                <div class="recommendation-card ${directionClass}">
                    <div class="rec-header">
                        <div class="rec-symbol">${rec.symbol}</div>
                        <div class="rec-direction ${directionClass}">${directionIcon} ${rec.direction}</div>
                        <div class="rec-confidence">${rec.confidence}%</div>
                    </div>
                    <div class="rec-body">
                        <div class="rec-reason">
                            <strong>Pro Analysis:</strong> ${rec.reason}
                        </div>
                        <div class="rec-prices">
                            <div class="price-item">
                                <span class="price-label">Entry:</span>
                                <span class="price-value">$${rec.entry.toLocaleString()}</span>
                            </div>
                            <div class="price-item">
                                <span class="price-label">Take Profit:</span>
                                <span class="price-value profit">$${rec.takeProfit.toLocaleString()} (+${profitPercent}%)</span>
                            </div>
                            <div class="price-item">
                                <span class="price-label">Stop Loss:</span>
                                <span class="price-value loss">$${rec.stopLoss.toLocaleString()} (-${riskPercent}%)</span>
                            </div>
                        </div>
                        <div class="rec-stats">
                            <div class="stat-item">
                                <span>Risk/Reward:</span>
                                <strong>${rec.riskReward}</strong>
                            </div>
                            <div class="stat-item">
                                <span>Volume:</span>
                                <strong class="${rec.volumeStrength}">${rec.volumeStrength.toUpperCase()}</strong>
                            </div>
                            <div class="stat-item">
                                <span>Setup:</span>
                                <strong>${rec.setup}</strong>
                            </div>
                        </div>
                    </div>
                    <button class="view-chart-btn" data-symbol="${rec.symbol}">View Chart</button>
                </div>
            `;
        }).join('');

        container.innerHTML = items;
        
        document.querySelectorAll('.view-chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = e.target.dataset.symbol;
                this.currentSymbol = symbol;
                document.getElementById('symbolSelect').value = symbol;
                document.getElementById('recommendationsModal').style.display = 'none';
                this.refreshAllData();
            });
        });
    }

    updateTradingSignals(direction, confidence, currentPrice, targetPrice, stopLoss) {
        const signals = [{
            pair: this.currentSymbol,
            type: direction === 'bullish' ? 'LONG' : 'SHORT',
            confidence: `${confidence.toFixed(0)}%`,
            entry: `$${currentPrice.toLocaleString()}`,
            target: `$${targetPrice.toLocaleString()}`,
            sl: `$${stopLoss.toLocaleString()}`,
            class: direction
        }];

        const container = document.getElementById('signalsContainer');
        container.innerHTML = signals.map(signal => `
            <div class="signal-item ${signal.class}">
                <div class="signal-header">
                    <span class="signal-pair">${signal.pair}</span>
                    <span class="signal-type">${signal.type}</span>
                    <span class="signal-confidence">${signal.confidence}</span>
                </div>
                <div class="signal-details">
                    Entry: ${signal.entry} | Target: ${signal.target} | SL: ${signal.sl}
                </div>
            </div>
        `).join('');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MasterTraderDashboard();
});
