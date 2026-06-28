# Sashvi Backend API

Base URL: `https://your-backend.example.com`

Auth

- POST `/auth/register` { name, email, password }
- POST `/auth/login` { email, password } -> { access, refresh }
- POST `/auth/resend-verification` { email }
- POST `/auth/verify` { token }

Products

- GET `/products` - list products
- GET `/products/:id` - product detail
- POST `/products` (admin)
- PUT `/products/:id` (admin)
- DELETE `/products/:id` (admin)

Orders

- POST `/orders` - create order (authenticated)
- GET `/orders` - list user orders
- GET `/orders/:id` - get order

Payments

- POST `/payments/razorpay/create` { orderId, amountType } -> razorpay order
- POST `/payments/razorpay/verify` { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
