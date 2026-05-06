const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const eventRoutes = require("./routes/eventRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const authRoutes = require("./routes/authRoutes");
const retryRoutes = require("./routes/retryRoutes");
const getPrometheusMetrics = require("./controllers/prometheusMetricsController");

const app = express();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});

app.use(cors());
app.use(morgan("dev"));
app.use(limiter);
app.use(express.json());

app.use("/api", eventRoutes);
app.use("/api", metricsRoutes);
app.use("/api", authRoutes);
app.use("/api", retryRoutes);
app.get("/metrics", getPrometheusMetrics);
app.use(require("./middlewares/errorHandler"));

module.exports = app;