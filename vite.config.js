import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/coingecko': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coingecko/, ''),
        secure: false
      },
      // Endpoint Rotasyonu için 3 farklı giriş noktası
      '/binance1': {
        target: 'https://api1.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance1/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Referer': 'https://www.binance.com/',
          'Origin': 'https://www.binance.com'
        }
      },
      '/binance2': {
        target: 'https://api2.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance2/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Referer': 'https://www.binance.com/',
          'Origin': 'https://www.binance.com'
        }
      },
      '/binance3': {
        target: 'https://api3.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance3/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Referer': 'https://www.binance.com/',
          'Origin': 'https://www.binance.com'
        }
      },
      // Geriye dönük uyumluluk için standart /binance (api1'e gider)
      '/binance': {
        target: 'https://api1.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      }
    }
  }
})
