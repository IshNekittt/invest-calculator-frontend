import { useState, useEffect } from "react";
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

  // 1. ИЗОЛИРОВАННЫЙ useEffect (никаких внешних зависимостей)
  useEffect(() => {
    let isMounted = true; // Защита от каскадных рендеров

    const loadHistory = async () => {
      if (!deviceId) return;
      try {
        const res = await axios.get(`${API_URL}/api/history/${deviceId}`);
        // Обновляем стейт только если компонент всё ещё существует на экране
        if (isMounted) {
          setHistory(res.data);
        }
      } catch (err) {
        console.error("Не вдалося завантажити історію", err);
      }
    };

    loadHistory();

    // Функция очистки при размонтировании
    return () => {
      isMounted = false;
    };
  }, [deviceId]); // Зависит ТОЛЬКО от deviceId, линтер будет счастлив

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = { deviceId, inputs };
      const res = await axios.post(`${API_URL}/api/calculate`, payload);
      setChartData(res.data.chartData);

      // 2. Обновляем историю напрямую, не используя внешние функции
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
      <header className={styles.header}>
        <h2>Прогнозирование Капитала</h2>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {/* ЛЕВАЯ КОЛОНКА - ФОРМА */}
        <div className={styles.card}>
          <form onSubmit={handleCalculate} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Начальный капитал ($)</label>
              <input
                type="number"
                name="initial"
                value={inputs.initial}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Ежемесячное пополнение ($)</label>
              <input
                type="number"
                name="monthly"
                value={inputs.monthly}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Ожидаемая доходность (%)</label>
              <input
                type="number"
                name="expectedReturn"
                value={inputs.expectedReturn}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Волатильность (Риск) (%)</label>
              <input
                type="number"
                name="volatility"
                value={inputs.volatility}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Инфляция (%)</label>
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
              <label>Срок (лет)</label>
              <input
                type="number"
                name="years"
                value={inputs.years}
                onChange={handleChange}
                max="50"
                required
              />
            </div>
            <button type="submit" disabled={loading} className={styles.btnCalc}>
              {loading ? "Считаем..." : "Рассчитать модель"}
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА - ГРАФИК */}
        <div className={styles.card}>
          {chartData.length > 0 ? (
            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>
                Коридор вероятностей (с учетом инфляции)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="year" tick={{ fill: "#795548" }} />
                  <YAxis
                    tickFormatter={(val) => `$${val / 1000}k`}
                    tick={{ fill: "#795548" }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Год: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Оптимистичный (90%)"
                    dataKey="bestCase"
                    stroke="#4CAF50"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    name="Медианный (50%)"
                    dataKey="median"
                    stroke="#1976D2"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    name="Пессимистичный (10%)"
                    dataKey="worstCase"
                    stroke="#D32F2F"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className={styles.summaryValues}>
                <div>
                  Итог (Медиана):{" "}
                  <strong>
                    {formatCurrency(chartData[chartData.length - 1].median)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              Заполните форму и нажмите "Рассчитать"
            </div>
          )}
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ - ИСТОРИЯ */}
      <div className={styles.historySection}>
        <h3>История ваших расчетов</h3>
        {history.length === 0 ? (
          <p className={styles.textMuted}>Вы еще не делали прогнозов</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div key={item._id} className={styles.historyCard}>
                <div>
                  <strong>Сумма:</strong> {formatCurrency(item.inputs.initial)}
                </div>
                <div>
                  <strong>Срок:</strong> {item.inputs.years} лет
                </div>
                <div>
                  <strong>Итог (Медиана):</strong>{" "}
                  {formatCurrency(item.summary.median)}
                </div>
                <div className={styles.date}>
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
