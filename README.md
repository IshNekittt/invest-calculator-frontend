# 📊 Investment Calculator UI (Monte Carlo & GBM)

A Single Page Application (SPA) for visualizing stochastic financial calculations based on Geometric Brownian Motion.

### 🛠 Tech Stack & Libraries

- **React 19 & Vite** — Core framework and bundler.
- **Recharts** — Data visualization (probability corridors).
- **Axios** — REST API requests.
- **React Router v6** — Client-side routing.
- **UUID** — Shadow authentication (stores a unique `deviceId` in LocalStorage).

### 📂 Project Structure

- `src/pages/Home` — Landing page with the academic background of the mathematical model.
- `src/pages/Calculator` — Main UI combining the input form, interactive `Recharts` line chart, and real-time history feed.
- Fully responsive design using modern CSS Modules and Flexbox/Grid layouts.

```text
src/
 ├── components/
 ├── pages/
 │   ├── Home/
 │   └── Calculator/
 ├── App.jsx
 └── index.css
```

### 🚀 Scripts

- `npm install` — Install dependencies.
- `npm run dev` — Start the local development server.
- `npm run build` — Build the app for production.
