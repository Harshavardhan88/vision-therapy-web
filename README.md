# AmblyoCare 👁️🎮

> **Next-Generation Web & VR Gamified Dichoptic Vision Therapy Platform for Amblyopia Rehabilitation and Binocular Vision Recovery**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-Three.js-blue?style=flat-square&logo=three.js)](https://docs.pmnd.rs/react-three-fiber)
[![WebXR](https://img.shields.io/badge/WebXR-Stereoscopic_VR-orange?style=flat-square&logo=webxr)](https://immersiveweb.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh_%26_Iris-teal?style=flat-square)](https://developers.google.com/mediapipe)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_8-119EFF?style=flat-square&logo=capacitor)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Author**: [Harsha Vardhan](https://github.com/Harshavardhan88)

---

## 📌 Executive Summary

**Amblyopia** ("lazy eye") affects 2–5% of the global population and represents the most common cause of monocular vision impairment in children and young adults. Historically, treatment has relied on **passive occlusion therapy (eye patching)**, where the dominant (fellow) eye is patched for hours daily. While patching forces usage of the amblyopic eye, it suffers from severe limitations:
- **Low Pediatric Compliance**: Children resist wearing opaque patches due to discomfort, social stigma, and boredom.
- **Monocular, Not Binocular**: Patching does not retrain the brain to fuse images from both eyes simultaneously, frequently resulting in persistent stereo-blindness and regression once patching ceases.
- **Interocular Suppression Unaddressed**: It fails to actively recalibrate cortical suppression mechanisms within the visual cortex (V1/V2).

**AmblyoCare** solves these limitations through **active dichoptic stimulation**, **immersive 3D/VR environments**, and **computer-vision-guided distance enforcement**. By presenting complementary, synchronized visual stimuli to each eye (via red-cyan anaglyph glasses or stereoscopic VR headsets), AmblyoCare forces the visual cortex to combine signals from both eyes to solve tasks, breaking active suppression while maintaining high compliance through engaging, gamified mechanics.

---

## 🔬 Scientific & Clinical Principles

### 1. Dichoptic Visual Stimulation
In dichoptic therapy, visual elements of a single game are split across ocular channels:
- **Amblyopic Eye Channel**: Receives high-contrast, salient foreground gameplay elements (targets, interactive objects, crucial gameplay cues).
- **Fellow (Dominant) Eye Channel**: Receives reduced-contrast background context and distractor elements.
- **Binocular Fusion Requirement**: The player cannot succeed without integrating information from both eyes concurrently, stimulating binocular neuroplasticity and lowering interocular suppression thresholds.

```
       [ Left Eye (e.g. Red Lens) ]  ──► Receives High-Contrast Target
                                           ▲
                                           │  Cortical Fusion (V1/V2)
                                           ▼
       [ Right Eye (e.g. Cyan Lens) ] ──► Receives Background / Context
```

### 2. Real-Time Contrast Balancing
Clinicians can dial and calibrate the contrast ratio between the dominant eye and the amblyopic eye. As the patient demonstrates progress (reduced suppression depth and improved stereoacuity), the dominant eye's contrast is gradually increased until full binocular balance (1.0 ratio) is achieved.

### 3. MediaPipe Gaze & Viewing Distance Calibration
Dichoptic visual angles and spatial frequencies require strict adherence to viewing distance:
- **Iris Distance Tracking**: Utilizes MediaPipe FaceMesh to calculate real-time millimeter distances between screen and cornea.
- **Distance Enforcement**: Pauses gameplay and presents clinical guidance if the patient leans outside the calibrated 40–50 cm operational window.
- **Fixation & Suppression Monitoring**: Continuously assesses fixation stability and detects prolonged monocular suppression events.

---

## 🎮 Therapy Modules & Gamification Suite

| Module | Engine | Clinical Target | Description |
| :--- | :--- | :--- | :--- |
| **Balloon Pop** | 2D Canvas / WebGL | Contrast Balancing & Suppression | High-speed dichoptic target popping where targets and obstacles are split between channels. Features adaptive speed scaling. |
| **Cosmic Quiz** | React / Framer Motion | Binocular Cognitive Integration | Dichoptic reading and problem-solving puzzles where questions and answer keys require simultaneous binocular fusion. |
| **Neon Reflex** | 2D Vector / Motion | Saccadic & Pursuit Tracking | Fast-paced trajectory prediction and target tracking designed to exercise oculomotor dynamics in the amblyopic visual field. |
| **Neural Pathways** | WebGL / Interactive | Visual Cortex Neuroplasticity | Synaptic connection mapping puzzles requiring coordinated binocular motor control and visual cortex spatial mapping. |
| **Target Tap VR** | React Three Fiber / WebXR | 3D Stereopsis & Depth Perception | Fully stereoscopic 3D virtual reality therapy. Renders separate viewpoints per eye to restore true physiological stereopsis. |

---

## 👥 Role-Based Access Architecture

AmblyoCare provides dedicated, secured interfaces tailored for each stakeholder in the vision therapy journey:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AmblyoCare Ecosystem                            │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   Doctor Portal   │  Patient Portal   │         Parent Portal          │
│                   │                   │                                │
│ • Prescribe Rx    │ • Daily Quests    │ • Adherence Monitoring         │
│ • Suppression Log │ • XP & Streaks    │ • Screen Distance Warnings     │
│ • LogMAR Charts   │ • Avatars & Badges│ • Session History Summaries    │
│ • Contrast Tuning │ • Therapy Games   │ • Compliance Alerts            │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

- **Doctor Portal**:
  - Detailed patient roster with diagnostic tracking (affected eye, baseline acuity, prescribed difficulty).
  - Suppression depth curves, fixation stability scores, and session completion logs.
  - Granular control over dichoptic contrast levels and session length prescriptions.
- **Patient Portal**:
  - Gamified progression system with XP, streaks, level-ups, and cosmetic reward unlocks.
  - One-click access to assigned daily regimens.
  - Interactive onboarding and color-calibration workflows.
- **Parent Portal**:
  - Simplified tracking overview for pediatric compliance oversight.
  - Notifications for missed sessions or persistent posture/distance violations.

---

## ♿ Accessibility & Universal Design

AmblyoCare is engineered according to WCAG 2.1 AA clinical software guidelines:
- **Color-Blindness Compensation**: Integrated SVG matrix filters accommodating **Protanopia**, **Deuteranopia**, and **Tritanopia**.
- **Visual Acuity Customization**: Adjustable UI font sizes, high-contrast monochrome themes, and dyslexia-friendly typography.
- **Motor & Keyboard Accessibility**: Full keyboard navigation, screen-reader-compliant ARIA semantics, and customizable hit-box tolerances for young or motor-impaired patients.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Tier                          │
│                                                         │
│   Next.js 14 App Router  │  Capacitor 8 Android App     │
│   ├── React Three Fiber  ├── Native Webview Shell       │
│   ├── WebXR Device API   └── Sensor Integration         │
│   └── MediaPipe FaceMesh                                │
└────────────────────────────┬────────────────────────────┘
                             │ REST / JSON (JWT Auth)
┌────────────────────────────▼────────────────────────────┐
│                    API Gateway                          │
│                                                         │
│   FastAPI (Python 3.10+)                                │
│   ├── OAuth2 Password Flow + JWT Bearer Tokens          │
│   ├── CORS, CSP, & Security Headers                     │
│   └── CRUD Operations & Gamification Engine             │
└────────────────────────────┬────────────────────────────┘
                             │ SQLAlchemy ORM
┌────────────────────────────▼────────────────────────────┐
│                    Database Tier                        │
│                                                         │
│   SQLite (Dev) / PostgreSQL (Production)                │
│   ├── Users, Roles (Doctor, Patient, Parent)            │
│   ├── Clinical Patient Profiles & Prescriptions         │
│   └── Therapy Sessions & Performance Telemetry          │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
vision-therapy-web/
├── app/                              # Next.js 14 App Router
│   ├── dashboard/                    # Role-based dashboards
│   │   ├── doctor/                   # Doctor clinical oversight portal
│   │   ├── parent/                   # Parent pediatric monitoring portal
│   │   └── patient/                  # Patient gamified home portal
│   ├── login/                        # Authentication & credential login
│   ├── signup/                       # Registration workflow with role assignment
│   ├── profile/                      # User profile & clinical settings
│   ├── therapy/                      # Active therapy room & game launcher
│   ├── layout.tsx                    # Root layout with global providers
│   └── page.tsx                      # Landing page with interactive preview
│
├── backend/                          # FastAPI Clinical Backend
│   ├── crud.py                       # Database CRUD operations
│   ├── database.py                   # SQLAlchemy engine & session maker
│   ├── gamification.py               # XP, streaks, levels, and badge engine
│   ├── main.py                       # FastAPI application & route definitions
│   ├── models.py                     # SQLAlchemy database models
│   ├── schemas.py                    # Pydantic validation schemas
│   └── requirements.txt              # Python dependency manifest
│
├── components/                       # Reusable React & Three.js components
│   ├── eye-tracking/                 # MediaPipe FaceMesh & distance tracker
│   ├── game/                         # Dichoptic game implementations
│   │   ├── BalloonGame.tsx           # 2D Dichoptic Balloon Pop
│   │   ├── CalibrationGame.tsx       # Red-cyan & distance calibration
│   │   ├── CosmicQuiz.tsx            # Cognitive dichoptic integration
│   │   ├── DichopticCanvas.tsx       # Dual-channel rendering engine
│   │   ├── NeonGame.tsx              # High-contrast pursuit tracker
│   │   ├── NeuralPathwaysDesktop.tsx # Cortex neuroplasticity mapper
│   │   └── TargetTapVR.tsx           # 3D WebXR stereoscopic therapy
│   ├── story/                        # Gamified narrative wrapper
│   └── ui/                           # Clinical, accessible UI primitives
│
├── android/                          # Native Capacitor Android project
├── public/                           # Static assets, icons, sound effects
├── scripts/                          # Build & Android packaging utilities
├── LICENSE                           # MIT License
├── package.json                      # Frontend dependencies & npm scripts
└── tsconfig.json                     # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or higher
- **Python**: `v3.10` or higher
- **Webcam**: Required for real-time MediaPipe distance and gaze tracking.
- **Red-Cyan 3D Glasses**: Required for desktop anaglyph dichoptic therapy.
- *(Optional)* **WebXR / VR Headset**: Meta Quest, Pico, or smartphone VR shell for 3D stereoscopic modes.

---

### Option 1: One-Click Start (Windows)
Double-click the included automation script:
```bat
start_dev.bat
```
This simultaneously boots the FastAPI backend on port `8000` and the Next.js development server on port `3000`.

---

### Option 2: Manual Installation & Startup

#### 1. Backend Service (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.env\Scriptsctivate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
The interactive Swagger API documentation will be accessible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

#### 2. Frontend Application (Next.js)
```bash
# In the root repository directory
npm install

# Launch the Next.js development server
npm run dev
```
Open your browser to [http://localhost:3000](http://localhost:3000).

---

### 📱 Android Deployment (Capacitor)

AmblyoCare can be packaged into a standalone Android tablet or smartphone application:

1. **Build and Sync Assets**:
   ```bash
   npm run android:sync
   ```
2. **Open in Android Studio**:
   ```bash
   npm run android:open
   ```
3. **Configure Physical Device Testing**:
   When testing on a physical tablet over local Wi-Fi, pass your host computer's local IP address:
   ```bash
   # Windows PowerShell
   $env:CAP_SERVER_URL="http://<YOUR_LAN_IP>:3000"; npm run android:sync
   ```

---

## 🧪 Testing Suite

AmblyoCare includes automated test suites covering unit logic, React components, accessibility, and end-to-end user flows:

```bash
# Run Jest unit and component test suites
npm test

# Run tests in watch mode
npm run test:watch

# Run accessibility (a11y) audit tests
npx jest accessibility.test.tsx
```

---

## 🛡️ Clinical Disclaimer

> **IMPORTANT**: AmblyoCare is an investigational vision therapy platform designed to augment, not replace, professional clinical care. Amblyopia, strabismus, and convergence insufficiency require personalized clinical assessment. Patients must use this software under the prescription, guidance, and regular supervision of a licensed ophthalmologist, optometrist, or certified orthoptist. Discontinue use immediately and consult your eye doctor if you experience eye strain, diplopia (double vision), headaches, or visual discomfort.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **Harsha Vardhan**. All rights reserved.
