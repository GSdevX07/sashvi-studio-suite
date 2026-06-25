import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.get('/', (_req, res) => res.json({ ok: true, service: 'sashvi-backend' }));

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/payments', paymentsRouter);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`sashvi-backend running on http://localhost:${port}`);
});
