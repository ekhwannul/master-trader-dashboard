// Free crypto data sources (no API key required)
const axios = require('axios');

class FreeDataSources {
    // CoinGecko - Free API (no key needed)
    static async getCoinGeckoPrice(coinId = 'bitcoin') {
        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
            return response.data;
        } catch (error) {
            console.error('CoinGecko API error:', error);
            return null;
        }
    }

    // CoinGecko OHLC data
    static async getCoinGeckoOHLC(coinId = 'bitcoin', days = 7) {
        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`);
            return response.data;
        } catch (error) {
            console.error('CoinGecko OHLC error:', error);
            return null;
        }
    }

    // Alternative.me Fear & Greed (free)
    static async getFearGreedIndex() {
        try {
            const response = await axios.get('https://api.alternative.me/fng/');
            return response.data;
        } catch (error) {
            console.error('Fear & Greed API error:', error);
            return null;
        }
    }

    // CryptoCompare (free tier)
    static async getCryptoCompareData(symbol = 'BTC', limit = 100, timeframe = '1h') {
        try {
            const symbolMap = {
                'MATIC': 'MATIC',
                'POL': 'MATIC',
                'WBTC': 'BTC',
                'WETH': 'ETH'
            };
            
            const mappedSymbol = symbolMap[symbol] || symbol;
            
            const endpoints = {
                '1m': 'histominute',
                '5m': 'histominute',
                '15m': 'histominute',
                '1h': 'histohour',
                '4h': 'histohour',
                '1d': 'histoday'
            };
            
            const aggregates = {
                '1m': 1,
                '5m': 5,
                '15m': 15,
                '1h': 1,
                '4h': 4,
                '1d': 1
            };
            
            const endpoint = endpoints[timeframe] || 'histohour';
            const aggregate = aggregates[timeframe] || 1;
            
            const response = await axios.get(`https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${mappedSymbol}&tsym=USD&limit=${limit}&aggregate=${aggregate}`);
            return response.data;
        } catch (error) {
            console.error(`CryptoCompare API error for ${symbol}:`, error.message);
            return null;
        }
    }

    // Convert CoinGecko OHLC to chart format
    static formatOHLCForChart(ohlcData) {
        return ohlcData.map(item => ({
            time: Math.floor(item[0] / 1000),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4])
        }));
    }

    // Convert CryptoCompare to chart format
    static formatCryptoCompareForChart(data) {
        if (!data.Data || !data.Data.Data) return [];
        
        return data.Data.Data.map(item => ({
            time: Math.floor(item.time),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseFloat(item.volumefrom || 0)
        }));
    }
}

module.exports = FreeDataSources;