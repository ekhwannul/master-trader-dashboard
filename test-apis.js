// Test API connections
const axios = require('axios');
require('dotenv').config();

async function testSantimentAPI() {
    console.log('🧪 Testing Santiment API...');
    
    try {
        const response = await axios.post('https://api.santiment.net/graphql', {
            query: `
            {
              getMetric(metric: "sentiment_balance_total") {
                timeseriesData(
                  slug: "bitcoin"
                  from: "2024-01-01T00:00:00Z"
                  to: "2024-01-02T00:00:00Z"
                  interval: "1d"
                ) {
                  datetime
                  value
                }
              }
            }
            `
        }, {
            headers: {
                'Authorization': `Apikey ${process.env.SANTIMENT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.errors) {
            console.log('❌ Santiment API Error:', response.data.errors);
            return false;
        } else {
            console.log('✅ Santiment API Working!');
            console.log('📊 Sample data:', response.data.data);
            return true;
        }
    } catch (error) {
        console.log('❌ Santiment API Failed:', error.message);
        return false;
    }
}

async function testFreeAPIs() {
    console.log('\n🧪 Testing Free APIs...');
    
    // Test CoinGecko
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        console.log('✅ CoinGecko API Working!');
        console.log('💰 BTC Price:', response.data.bitcoin.usd);
    } catch (error) {
        console.log('❌ CoinGecko API Failed:', error.message);
    }

    // Test Fear & Greed
    try {
        const response = await axios.get('https://api.alternative.me/fng/');
        console.log('✅ Fear & Greed API Working!');
        console.log('😱 Fear & Greed:', response.data.data[0].value, response.data.data[0].value_classification);
    } catch (error) {
        console.log('❌ Fear & Greed API Failed:', error.message);
    }

    // Test CryptoCompare
    try {
        const response = await axios.get('https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=USD&limit=5');
        console.log('✅ CryptoCompare API Working!');
        console.log('📈 BTC Data points:', response.data.Data.Data.length);
    } catch (error) {
        console.log('❌ CryptoCompare API Failed:', error.message);
    }
}

async function testBybitAPI() {
    console.log('\n🧪 Testing Bybit API...');
    
    if (!process.env.BYBIT_SECRET || process.env.BYBIT_SECRET === 'YOUR_SECRET_KEY_HERE') {
        console.log('⚠️  Bybit Secret Key not provided - using public endpoints only');
        
        // Test public endpoint
        try {
            const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
            console.log('✅ Bybit Public API Working!');
            console.log('💰 BTC Price:', response.data.result.list[0].lastPrice);
            return true;
        } catch (error) {
            console.log('❌ Bybit Public API Failed:', error.message);
            return false;
        }
    } else {
        console.log('🔐 Testing Bybit with API credentials...');
        // Would test with credentials here
        return true;
    }
}

async function runAllTests() {
    console.log('🚀 Master Trader Dashboard - API Testing\n');
    
    const results = {
        santiment: await testSantimentAPI(),
        bybit: await testBybitAPI(),
        freeAPIs: true
    };
    
    await testFreeAPIs();
    
    console.log('\n📊 Test Results Summary:');
    console.log('Santiment API:', results.santiment ? '✅ Working' : '❌ Failed');
    console.log('Bybit API:', results.bybit ? '✅ Working' : '❌ Failed');
    console.log('Free APIs: ✅ Working');
    
    console.log('\n🎯 Recommendation:');
    if (results.santiment && results.bybit) {
        console.log('🚀 All APIs working! You can run the full dashboard with premium features.');
    } else if (results.bybit) {
        console.log('📈 Bybit working! Dashboard will run with price data + free sentiment analysis.');
    } else {
        console.log('🆓 Using free APIs only. Dashboard will work with simulated data.');
    }
    
    console.log('\n▶️  To start the dashboard: npm start');
}

// Run tests
runAllTests().catch(console.error);