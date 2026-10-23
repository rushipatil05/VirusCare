# VirusCare — Hospital Patient Management System

**VirusCare** is a full-stack MERN web application built for a virus quarantine and treatment facility. It addresses real-world clinical and administrative challenges during epidemic containment: strict bed capacity controls (74-bed cap), daily temperature rounds, physician visit documentation, automated fever-free discharge clearance, epidemiological mortality tracking, and immutable audit logging.

---

## 🔑 Login Credentials

The 1-click demo buttons have been replaced with a standard email and password login form. Use any of the pre-seeded staff credentials below to log in:

| Role | Email | Password | Permissions & Workflow |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@viruscare.org` | `admin123` | Patient registration, dynamic room allocation, discharge confirmation, bed deallocation, facility configuration (fever threshold), and full analytics. |
| **Doctor** | `doctor@viruscare.org` | `doctor123` | Review admitted patients, view fever history, conduct daily rounds, record clinical observations and severity. |
| **Nurse** | `nurse@viruscare.org` | `nurse123` | Record daily patient temperatures in Celsius (°C), view pending rounds, submit audited temperature corrections. |

---

## 🛠️ Technology Stack

- **Frontend:** React 18 with Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6
- **Backend:** Node.js, Express.js REST API
- **Database:** MongoDB & Mongoose ORM
- **Security & Auth:** JSON Web Tokens (JWT), bcrypt password hashing, Role-Based Access Control (RBAC) middleware

---

## 🏥 Key Business Rules & Features

1. **Bed Allocation & Capacity Control (74 Beds Max):**
   - The facility enforces a maximum capacity of 74 patients.
   - Rooms 1 to 74 are dynamically assigned. Database-level partial unique indexes prevent duplicate room allocation.
   - When all 74 beds are occupied, new admissions are strictly blocked until a bed is vacated.

2. **Daily Temperature Recording (Nurse):**
   - Nurse logs patient temperature in Celsius with optional clinical notes.
   - **Duplicate Prevention:** The server enforces a compound unique index on `(patient, recordDate)`. Duplicate entries for the same calendar date are blocked with a `409 Conflict`.
   - **Audited Corrections:** Corrections require an explicit reason and preserve `previousTemperature`, `correctedBy`, and `correctedAt`.
   - **Fever & Clinical Warnings:** Configurable fever threshold (default 38.0°C). Any temperature > threshold marks the day as fever-positive. Readings < 35.0°C or > 40.0°C trigger clinical warnings.

3. **Daily Doctor Visits (Doctor):**
   - Doctors review pending daily visits and temperature trends.
   - If today's temperature has not yet been recorded, a clinical advisory banner is displayed without blocking necessary patient care.
   - Observations, severity (`Stable`, `Improving`, `Guarded`, `Critical`), and treatment plans are recorded.

4. **Automated Discharge Clearance (Admin):**
   - Patients qualify for discharge **only** after **3 consecutive full calendar days without fever** (daily reading ≤ fever threshold).
   - Missing temperature records break the streak and do not count as fever-free days.
   - Any fever-positive day resets the consecutive counter back to `0`.
   - Admin confirmation immediately vacates the room back into the available pool.

5. **Epidemiological Analytics & 15% Mortality Benchmark:**
   - **Mortality Rate:** Calculated based on closed cases: `Deaths / (Deaths + Discharges) * 100%`. Missing/active cases are strictly excluded from the closed-cases denominator to avoid artificially diluting mortality.
   - **Benchmark Alert:** Compares mortality rate against the **15.0% expected benchmark**. If mortality exceeds 15%, a prominent critical alert is displayed.

6. **Audit Trail:**
   - Tracks all registrations, room changes, temperature recordings, corrections, visits, discharges, and configuration updates.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas connection URI)

### 2. Install Dependencies
From the project root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Environment Configuration
Ensure `.env` files are configured:

**`backend/.env`**:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/viruscare
JWT_SECRET=viruscare_secure_jwt_secret_token_key_2026
FEVER_THRESHOLD=38.0
MAX_CAPACITY=74
```

**`frontend/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Seed Demo Data (10 Realistic Patients)
Populate the database with sample clinical scenarios:
```bash
npm run seed
```

### 5. Run the Application
Run both backend API and frontend client with a single command:
```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 🧪 Automated End-to-End Test

To run the complete verification script that tests:
*Patient registration → Temperature recording → Duplicate prevention → Doctor visit → Discharge calculation → Bed release → Analytics calculation*

```bash
cd backend
node test-e2e.js
```

---

## 🌐 Deployment Instructions

### Backend (Render / Railway)
1. Set the root directory or service path to `backend`.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Environment variables to set in the host dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: A secure random secret
   - `PORT`: `5000` (or host provided `$PORT`)
   - `FEVER_THRESHOLD`: `38.0`
   - `MAX_CAPACITY`: `74`

### Frontend (Vercel)
1. Set root directory to `frontend`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com/api`
