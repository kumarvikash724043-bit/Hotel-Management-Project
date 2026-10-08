# Grand Hotel Management System

A hotel operations app built with Java 17, Spring Boot, Maven, HTML, CSS, and vanilla JavaScript. All application state lives in Java in-memory collections. There is no database or database dependency; data resets when the backend restarts.

## Prerequisites

- Java 17 or newer
- Apache Maven 3.6+
- Python 3 (for the local static frontend server), or another static HTTP server

## Start the backend

Open PowerShell in the `hotel-management-system` directory:

```powershell
cd backend
mvn spring-boot:run
```

The API listens at `http://localhost:8080/api`. Maven downloads the declared Spring Boot dependencies on the first run. To build without starting the server, run `mvn -DskipTests package` from `backend`.

## Start the frontend

Open a second PowerShell window in the `hotel-management-system` directory:

```powershell
py -m http.server 5500 --directory frontend
```

Visit `http://localhost:5500`. Keep the backend running in the first window. The frontend uses Fetch and CORS to call the API.

The API base URL defaults to `http://localhost:8080/api`. To change it per browser, set `localStorage.setItem('hotelApiBaseUrl', 'https://your-host/api')` in the browser console and reload. You can also set `window.HOTEL_API_BASE_URL = 'https://your-host/api'` in an HTML page's `<head>` before `js/app.js` loads.

## Demo access

- Email: `manager@grandhotel.com`
- Password: `Hotel@123`

Staff accounts created through Sign Up are held in memory and disappear when the backend restarts. Demo authentication is intended for local evaluation and does not implement production session security.

## Included workflows

- Dashboard, room inventory, guest reservations, and customer directory
- Room categories and rates, date overlap protection, night and room-charge calculation
- Food menu, food orders associated with a booking, quantity changes, and subtotals
- Check-in and check-out state transitions
- Itemized invoice for room charges, food, services, tax, and discount; print from the invoice page
- About, sign up, login, and logout

The backend seeds rooms across Platinum, Golden, and Silver categories, all six dining categories, and the demo manager account. New bookings, orders, staff, and invoices are stored in memory only.

## API overview

- `POST /api/auth/login`, `POST /api/auth/signup`
- `GET /api/dashboard`
- `GET|POST /api/rooms`
- `GET|POST /api/bookings`, `GET /api/bookings/{id}`
- `POST /api/bookings/{id}/check-in`, `POST /api/bookings/{id}/check-out`
- `GET /api/customers`
- `GET|POST /api/food`
- `GET|POST /api/food/orders`, `PATCH /api/food/orders/{orderId}/items/{foodId}`, `DELETE /api/food/orders/{orderId}`
- `GET /api/bookings/{id}/invoice`

CORS allows local development origins on `localhost` and `127.0.0.1` with arbitrary ports.
