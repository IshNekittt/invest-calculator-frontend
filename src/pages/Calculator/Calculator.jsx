import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./Calculator.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Calculator() {
  const [inputs, setInputs] = useState({
    initial: 10000,
    monthly: 500,
    expectedReturn: 10,
    volatility: 15,
    inflation: 3,
    years: 20,
  });

  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const deviceId = localStorage.getItem("deviceId");

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      if (!deviceId) return;
      try {
        const res = await axios.get(`${API_URL}/api/history/${deviceId}`);
        if (isMounted) setHistory(res.data);
      } catch (err) {
        console.error("Не вдалося завантажити історію", err);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError(null);

    // JS-валідація (захист від мінусових значень)
    if (inputs.initial < 0 || inputs.monthly < 0 || inputs.years <= 0) {
      setError(
        "Значення капіталу та терміну не можуть бути від'ємними або нульовими!",
      );
      return;
    }
    if (inputs.years > 50) {
      setError("Максимальний термін розрахунку - 50 років.");
      return;
    }

    setLoading(true);
    try {
      const payload = { deviceId, inputs };
      const res = await axios.post(`${API_URL}/api/calculate`, payload);
      setChartData(res.data.chartData);

      if (deviceId) {
        const histRes = await axios.get(`${API_URL}/api/history/${deviceId}`);
        setHistory(histRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Помилка з'єднання з сервером");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className={styles.calcPage}>
      {/* Кнопка НАЗАД */}
      <Link to="/" className={styles.backButton}>
        <ArrowLeft size={24} />
        <span>Назад до опису моделі</span>
      </Link>

      <header className={styles.header}>
        <h2>Прогнозування Капіталу</h2>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {/* ЛІВА КОЛОНКА - ФОРМА */}
        <div className={styles.card}>
          <form onSubmit={handleCalculate} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Початковий капітал ($)</label>
              <input
                type="number"
                name="initial"
                value={inputs.initial}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Щомісячне поповнення ($)</label>
              <input
                type="number"
                name="monthly"
                value={inputs.monthly}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Очікувана дохідність (%)</label>
              <input
                type="number"
                name="expectedReturn"
                value={inputs.expectedReturn}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Волатильність (Ризик) (%)</label>
              <input
                type="number"
                name="volatility"
                value={inputs.volatility}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Інфляція (%)</label>
              <input
                type="number"
                name="inflation"
                value={inputs.inflation}
                onChange={handleChange}
                step="0.1"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Термін (років)</label>
              <input
                type="number"
                name="years"
                value={inputs.years}
                onChange={handleChange}
                min="1"
                max="50"
                required
              />
            </div>
            <button type="submit" disabled={loading} className={styles.btnCalc}>
              {loading ? "Рахуємо..." : "Розрахувати модель"}
            </button>
          </form>
        </div>

        {/* ПРАВА КОЛОНКА - ГРАФІК */}
        <div className={styles.card}>
          {chartData.length > 0 ? (
            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>
                Коридор ймовірностей (з урахуванням інфляції)
              </h3>
              {/* Висота 100% для розтягування по контейнеру */}
              <div style={{ flex: 1, minHeight: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="year" tick={{ fill: "#795548" }} />
                    <YAxis
                      tickFormatter={(val) => `$${val / 1000}k`}
                      tick={{ fill: "#795548" }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Рік: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      name="Оптимістичний (90%)"
                      dataKey="bestCase"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      name="Медіанний (50%)"
                      dataKey="median"
                      stroke="#1976D2"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      name="Песимістичний (10%)"
                      dataKey="worstCase"
                      stroke="#D32F2F"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.summaryValues}>
                <div>
                  Підсумок (Медіана):{" "}
                  <strong>
                    {formatCurrency(chartData[chartData.length - 1].median)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              Заповніть форму та натисніть "Розрахувати модель"
            </div>
          )}
        </div>
      </div>

      {/* НИЖНЯ ЧАСТИНА - ІСТОРІЯ */}
      <div className={styles.historySection}>
        <h3>Історія ваших розрахунків</h3>
        {history.length === 0 ? (
          <p className={styles.textMuted}>Ви ще не робили прогнозів</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div key={item._id} className={styles.historyCard}>
                <div>
                  <strong>Сума:</strong> {formatCurrency(item.inputs.initial)}
                </div>
                <div>
                  <strong>Термін:</strong> {item.inputs.years} років
                </div>
                <div>
                  <strong>Підсумок (Медіана):</strong>{" "}
                  {formatCurrency(item.summary.median)}
                </div>
                <div className={styles.date}>
                  {new Date(item.createdAt).toLocaleString("uk-UA")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
