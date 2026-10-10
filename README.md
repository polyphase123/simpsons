# Hybrid Solar PV–Biogas & Storage Microgrid Simulator (Mobile 1-Screen)

A rock-solid, zero-flicker, single-screen mobile layout interactive simulator for an optimal hybrid renewable energy system (HRES) microgrid, based on the research paper:

> **"Optimal Design and Mathematical Modeling of Hybrid Solar PV–Biogas Generator with Energy Storage Power Generation System in Multi-Objective Function Cases"**  
> *Sustainability 2023, 15, 8264. https://doi.org/10.3390/su15108264*  
> Modeled for Debre Markos University / Distribution Feeder, Ethiopia (10.22°N, 37.44°E).  
> **Currency: Philippine Peso (PHP, ₱)**  
> **Mobile Simulator Implementation by Franz Xyrlo Tobias, PEE**

---

## 🇵🇭 Philippine Peso Financial Conversions (₱61.50 = €1.00)

| Metric | NSWOA (Optimal) | MOGWO | MOPSO |
| :--- | :---: | :---: | :---: |
| **Total Net Present Cost (NPC)** | **₱430.31M** (€6.997M) | ₱430.99M (€7.008M) | ₱431.18M (€7.011M) |
| **Levelized Cost of Energy (LCOE)** | **₱2.842/kWh** (€0.0462) | ₱2.884/kWh (€0.0469) | ₱2.890/kWh (€0.0470) |
| **Cost of Energy (COE)** | **₱3.266/kWh** (€0.0531) | ₱3.298/kWh (€0.0536) | ₱3.305/kWh (€0.0537) |
| **Reliability (LPSP)** | **0.0085 (0.85%)** | 0.0089 (0.89%) | 0.0092 (0.92%) |
| **Annual CO₂ Reduction** | **-7.37M kg/yr** | -7.33M kg/yr | -7.33M kg/yr |

---

## 🛠️ Key Improvements & Fixes

### 1. 🪲 Fixed "NET MICROGRID BALANCE" Flickering
- **Root Cause**: SMES coil float charging had a hard threshold at 95% without hysteresis, causing state to alternate rapidly by 25 kW on every frame. In addition, Net Balance was combining internal battery charging with external grid power, causing rapid DOM re-renders and class toggling.
- **Fix**:
  - Implemented clean hysteresis on SMES float charging (charge float only below 88%, stop at 95%).
  - Net Microgrid Balance is strictly defined as Clean Generation ($P_{PV} + P_{Biogas}$) minus Demand ($P_{Load}$).
  - Caches last displayed value and only updates DOM when the integer or sign changes.
  - Set rigid width and `tabular-nums` formatting on `.power-balance-wrap`.

### 2. ⚙️ Capacity Sizing Console & `🎯 OPTIMIZE SIZE` Button
- **Adjust Component Capacities**: Sliders for Solar PV Array (1,000–10,000 kWp), Biogas Generator (200–2,500 kW), PHES Hydro Pump/Turbine (100–1,500 kW), and SMES Buffer (50–500 kWh).
- **Dynamic Financial Recalculation**: Automatically updates 25-year lifecycle NPC in ₱M and LCOE in ₱/kWh when capacities change based on paper unit capital costs.
- **`🎯 OPTIMIZE SIZE` Button**: Instantly snaps all component capacities back to the mathematical Pareto optimum (NSWOA: 5,495.4 kWp, 860.3 kW, 400.7 kW, 142.3 kWh).

### 3. 📊 Energy Production Versus Load Diurnal Profile
- **3 Visual Modes**: `[⚡ Flow Map]`, `[📊 Profile vs Load]`, `[📈 Live Trend]`.
- **24-Hour Profile View**:
  - ☀️ **Solar PV Curve** (Golden area peaking at 12:00 noon, ~4,100 kW).
  - 🌾 **Biogas Gen Dispatch** (Emerald area filling evening/night deficit).
  - 💧 **PHES Hydro Dispatch** (Daytime surplus pumping & evening peak generation).
  - 🏢 **Campus Demand Curve** (Crimson line tracking 850–1,707 kW load).
  - ⚡ **Live Time Scrub Marker**: Displays current simulation time ($t$) and real-time generation vs load point.

---

## 🚀 How to Run Locally

Open [index.html](file:///Users/franzxyrloi.tobias/Desktop/github/homerpro/index.html) in your browser:
```bash
# macOS
open index.html
```
