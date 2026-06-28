import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { ordersRouter } from "./routes/orders";
import { paymentsRouter } from "./routes/payments";
import { requestRouter } from "./routes/request";
import { uploadRouter } from "./routes/upload";
import { categoriesRouter } from "./routes/categories";
import { couponsRouter } from "./routes/coupons";
import { reviewsRouter } from "./routes/reviews";
import { instagramRouter } from "./routes/instagram";
import { customersRouter } from "./routes/customers";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.get("/", (_req, res) => res.json({ ok: true, service: "sashvi-backend" }));

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/orders", ordersRouter);
app.use("/payments", paymentsRouter);
app.use("/request", requestRouter);
app.use("/upload", uploadRouter);
app.use("/coupons", couponsRouter);
app.use("/reviews", reviewsRouter);
app.use("/instagram-feed", instagramRouter);
app.use("/customers", customersRouter);

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`sashvi-backend running on http://localhost:${port}`);
});
