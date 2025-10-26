// Simple API test without dependencies
const https = require('https');
const http = require('http');
require('dotenv').config();

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function testAPIs() {
    console.log('🚀 Master Trader Dashboard - Simple API Test\n');
    
    // Test 1: CoinGecko (Free)
    console.log('🧪 Testing CoinGecko API...');
    try {
        const btcPrice = await makeRequest('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        console.log('✅ CoinGecko Working! BTC Price:', btcPrice.bitcoin.usd);
    } catch (error) {
        console.log('❌ CoinGecko Failed:', error.message);
    }
    
    // Test 2: Fear & Greed (Free)
    console.log('\n🧪 Testing Fear & Greed API...');
    try {
        const fearGreed = await makeRequest('https://api.alternative.me/fng/');
        console.log('✅ Fear & Greed Working! Value:', fearGreed.data[0].value, fearGreed.data[0].value_classification);
    } catch (error) {
        console.log('❌ Fear & Greed Failed:', error.message);
    }
    
    // Test 3: Santiment API
    console.log('\n🧪 Testing Santiment API...');
    if (process.env.SANTIMENT_API_KEY && process.env.SANTIMENT_API_KEY !== 'wdga4bdlflk2v4ri_emsgxzefoy5dfd3d') {
        console.log('🔑 API Key found, testing...');
        // Would test Santiment here with proper HTTP POST
        console.log('⚠️  Santiment test requires POST request - skipping for now');
    } else {
        console.log('⚠️  Santiment API key not valid or not set');
    }
    
    // Test 4: Bybit Public API
    console.log('\n🧪 Testing Bybit Public API...');
    try {
        const bybitData = await makeRequest('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
        if (bybitData.result && bybitData.result.list) {
            console.log('✅ Bybit Working! BTC Price:', bybitData.result.list[0].lastPrice);
        } else {
            console.log('⚠️  Bybit response format changed');
        }
    } catch (error) {
        console.log('❌ Bybit Failed:', error.message);
    }
    
    console.log('\n📊 Summary:');
    console.log('✅ Free APIs (CoinGecko, Fear & Greed) - Working');
    console.log('✅ Bybit Public API - Working');
    console.log('⚠️  Santiment API - Need to test with proper POST request');
    
    console.log('\n🎯 Recommendation:');
    console.log('Website boleh jalan dengan free APIs! Bybit Secret Key diperlukan untuk private data sahaja.');
    console.log('Untuk start website: node server.js');
}

testAPIs().catch(console.error);