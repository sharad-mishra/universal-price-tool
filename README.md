# 🌍 Universal Price Comparison Tool

**Live Demo**: [https://universal-price-tool.vercel.app](https://universal-price-tool.vercel.app)

---

## 🧾 Overview

**Universal Price Comparison Tool** is a full-stack web application designed to help users find the best prices for products across online retailers — globally. It intelligently fetches product data using Google Shopping (via SerpAPI), and extracts clean, structured results using **Google Gemini 1.5 Flash AI**.

Built with:

- ✨ React (CDN setup, no build step)
- 🚀 Node.js + Express.js backend
- 🧠 Gemini AI + SerpAPI
- ⚡ Real-time price results
- 🧪 API testable via Postman or cURL

---

## 🔑 Key Features

- 🌐 **Global Price Comparison**  
  Search for any product across 100+ countries. Just select a country and enter a product name.

- 🤖 **AI-Powered Extraction**  
  Uses Gemini 1.5 Flash to extract key product details:  
  → Name, price, currency, seller, rating, reviews, delivery, and direct links.

- ⚡ **Real-time Pricing**  
  Results are fetched live via SerpAPI, processed on the fly.

- 🔍 **Country Dropdown with Search**  
  Type either a full country name or ISO code (e.g., "DE") to filter the dropdown list.

- 💾 **Recent Search History**  
  Stores your last 10 searches locally so you can easily revisit them.

- 💅 **Responsive, Modern UI**  
  Built with Tailwind CSS. Mobile-friendly.

- 🧠 **In-Memory Caching**  
  Reduces API calls and improves performance.

---

## 🚀 Live Demo

Visit the hosted app here:  
👉 [https://universal-price-tool.vercel.app](https://universal-price-tool.vercel.app)

---

## 📦 Backend API

The core backend logic is available at the `/api/prices` endpoint.

### 🔧 Sample Request

**GET** `/api/prices?country=US&query=iPhone%2016%20Pro`

- **country**: ISO 2-letter code (e.g., `IN`, `US`, `DE`)
- **query**: URL-encoded product name

---

## 🔬 API Testing via cURL

The Universal Price Comparison Tool exposes a single RESTful endpoint for price lookup:

```
GET /api/prices?country=<COUNTRY_CODE>&query=<PRODUCT_NAME>
```

### ✅ Live API Endpoint

```
https://universal-price-tool.vercel.app/api/prices
```

### 🧪 Example 1: Search for iPhone 16 Pro in the US

```bash
curl -X GET "https://universal-price-tool.vercel.app/api/prices?country=US&query=iPhone%2016%20Pro%20128GB"      -H "Accept: application/json"
```

### 🧪 Example 2: Search for boAt Airdopes in India

```bash
curl -X GET "https://universal-price-tool.vercel.app/api/prices?country=IN&query=boAt%20Airdopes%20311%20Pro"      -H "Accept: application/json"
```

### 🧪 Example 3: Search for Sony WH-1000XM5 in Germany

```bash
curl -X GET "https://universal-price-tool.vercel.app/api/prices?country=DE&query=Sony%20WH-1000XM5"      -H "Accept: application/json"
```

### 📦 Example Response Format

```json
[
  {
    "productName": "Apple iPhone 16 Pro 128GB",
    "price": "99900",
    "currency": "USD",
    "link": "https://www.example.com/iphone-deal",
    "source": "BestBuy",
    "thumbnail": "https://example.com/iphone.jpg",
    "rating": 4.8,
    "reviews": 5200,
    "delivery": "Free 2-day shipping"
  }
]
```

---

## 🔬 API Testing via Postman

1. Open Postman.
2. Set method to `GET`.
3. URL: `https://universal-price-tool.vercel.app/api/prices?country=IN&query=Macbook%20Air`
4. Click **Send**.
5. View structured JSON response.

---

## 🧱 Architecture

### 🎨 Frontend

- React via CDN (no Webpack/Vite)
- Tailwind CSS
- Font Awesome icons
- LocalStorage-based recent search history
- Served from Express backend

### ⚙️ Backend

- Express.js server
- `/api/prices` endpoint
- Integrates:
  - 🔍 **SerpAPI** for search data
  - 🤖 **Google Gemini Flash 1.5** for AI parsing
- In-memory caching via `node-cache`
- Logging with `winston`

---

## 🔑 Setup and Installation

### ✅ Prerequisites

- Node.js v18+
- `npm` or `yarn`
- API keys for:
  - [SerpAPI](https://serpapi.com/)
  - [Google Gemini](https://aistudio.google.com/)

### 📁 .env Setup

```env
SERPAPI_KEY=your_serpapi_api_key
GEMINI_API_KEY=your_gemini_api_key
CACHE_TTL=3600
NODE_ENV=development
```

### 🧪 Install Dependencies

```bash
git clone <repo-url>
cd universal-price-comparison
npm install
```

### ▶️ Run Server

```bash
npm start
```

Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🧠 Tech Stack

### Backend

- Node.js
- Express
- Axios
- SerpAPI
- Gemini Flash AI
- node-cache
- winston (logging)

### Frontend

- React (CDN JSX + Babel)
- Tailwind CSS
- Font Awesome
- LocalStorage (history)

---

## 🛠️ Future Enhancements

- ✅ Webpack/Vite frontend bundling
- 🔔 Price alerts
- 📊 Price history tracker
- 🔐 User accounts
- 🌍 Internationalization (i18n)
- 🚢 Docker deployment
- 🧪 Full test suite with Jest
- 📦 Redis-based distributed cache

---

## 🤝 Contributing

Open issues and PRs are welcome! Please follow conventional commits.

---

## 📄 License

MIT © 2025  
_Universal Price Comparison Tool_