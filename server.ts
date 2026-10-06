import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// EV Tutor Knowledge Base & Assistant API
app.post('/api/gemini/tutor', async (req, res) => {
  const { query, level = 'Engineering', context } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const systemInstruction = `You are the lead Chief EV Powertrain & Systems Engineer and AI Tutor for VOLTX.
Your goal is to provide precise, technically rigorous, yet intuitive engineering explanations about Electric Vehicles.
The learner requested explanation at the "${level}" level (options: Beginner, Engineering, Advanced, Interview).

Key guidelines:
1. "Beginner": Use clear physical analogies, intuitive diagrams in ASCII/Unicode if helpful, zero confusing jargon without immediate explanation.
2. "Engineering": Real engineering equations (e.g. $P = V \\cdot I$, $T = \\frac{P}{\\omega}$, FOC Clarke/Park transformation, pre-charge RC time constant $\\tau = R \\cdot C$, inverter switching losses $P_{sw} = f_{sw} \\cdot (E_{on} + E_{off})$), automotive standards (ISO 26262, UN 38.3, SAE J1772, ISO 15118), and real EV component specs.
3. "Advanced": In-depth silicon carbide SiC vs GaN switching characteristics, space vector PWM (SVPWM) sector modulation, d-q axis cross-coupling inductance compensation, BMS Extended Kalman Filter (EKF) state estimation, electrochemical impedance spectroscopy (EIS), thermal runaway propagation venting.
4. "Interview": Frame responses like a seasoned Tesla / Lucid / Porsche / Rivian battery or powertrain technical interview response: The "Bottom-Line Answer", the "Underlying Physics / Engineering Tradeoffs", and the "Key Metrics & Common Pitfalls".

Always stay focused on EV hardware, software, physics, and safety. Never provide generic non-EV responses.`;

  try {
    if (ai && process.env.GEMINI_API_KEY) {
      const prompt = `Context: ${context || 'General Electric Vehicle Engineering'}\n\nQuestion: ${query}\n\nTarget Depth: ${level} level. Provide a structured, clear response with relevant formulas, real-world examples, and key takeaway.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({
        answer: response.text,
        source: 'gemini-3.8-flash',
      });
    }
  } catch (err: any) {
    console.warn('Gemini API call failed, falling back to local expert engine:', err?.message);
  }

  // High-fidelity fallback engineering knowledge engine
  const fallbackAnswer = generateExpertEVAnswer(query, level, context);
  return res.json({
    answer: fallbackAnswer,
    source: 'voltx-expert-engine',
  });
});

function generateExpertEVAnswer(query: string, level: string, context?: string): string {
  const q = query.toLowerCase();

  if (q.includes('pre-charge') || q.includes('precharge') || q.includes('dc-link')) {
    if (level === 'Beginner') {
      return `### Why Do Electric Vehicles Need a Pre-Charge Circuit?

Imagine connecting a giant empty water reservoir to a high-pressure fire hydrant instantly. The water rushes in with explosive violence!

In an EV, the **inverter contains massive DC-link capacitors** (typically 500µF to 1500µF) to smooth out high-voltage DC power. 
When the vehicle is OFF, these capacitors are at **0 Volts**. 
The high-voltage battery sits at **400V or 800V**.

If you closed the main positive contactor directly without pre-charging:
- The capacitors act like a dead short circuit ($R \\approx 0.01\\,\\Omega$).
- An instantaneous inrush current of **thousands of Amperes** ($I = V/R > 5000\\text{ A}$) would surge across the contactor contacts.
- This creates an intense electric arc that **welds the mechanical contactor tips together** or blows the high-voltage pyro-fuse.

**The Solution:**
A small current-limiting resistor ($20\\,\\Omega - 100\\,\\Omega$) and a dedicated pre-charge relay are engaged first. Current trickles safely into the capacitors until voltage reaches 95% of battery voltage (typically within 100–300 ms). Then, the main contactor snaps shut effortlessly with zero arcing, and the pre-charge contactor disconnects.`;
    }
    return `### Engineering Analysis: Inverter DC-Link Pre-Charge Dynamics

**1. The Physics of Inrush Current**
The uncharged inverter DC-link capacitance $C_{dc}$ (typically $600\\,\\mu\\text{F} \\text{ to } 1200\\,\\mu\\text{F}$) has negligible initial voltage ($V_c(0) = 0\\text{ V}$).
Direct contactor closure across pack voltage $V_{pack} = 400\\text{ V}$ with loop resistance $R_{loop} \\approx 20\\text{ m}\\Omega$ would produce:
$$I_{inrush}(0^+) = \\frac{V_{pack}}{R_{loop}} = \\frac{400\\text{ V}}{0.02\\,\\Omega} = 20,000\\text{ A}$$
This violates the contactor's breaking/making capability (typically rated for $< 600\\text{ A}$ continuous, $2000\\text{ A}$ short-time surge) and creates contact welding via molten spot formation.

**2. The RC Charging Circuit Equations**
The pre-charge circuit places resistor $R_{pre}$ (typically $25\\,\\Omega - 50\\,\\Omega$, $50\\text{ W}$ aluminum-housed wirewound) in series with the DC bus:
$$V_C(t) = V_{pack} \\left(1 - e^{-t / \\tau}\\right), \\quad \\text{where } \\tau = R_{pre} \\cdot C_{dc}$$
Peak initial current:
$$I_{peak} = \\frac{V_{pack}}{R_{pre}} = \\frac{400\\text{ V}}{33\\,\\Omega} \\approx 12.12\\text{ A}$$
Energy dissipated in $R_{pre}$ during one pre-charge cycle:
$$E_{dissipated} = \\frac{1}{2} C_{dc} V_{pack}^2 = \\frac{1}{2} (800\\,\\mu\\text{F})(400\\text{ V})^2 = 64\\text{ Joules}$$

**3. State Machine Sequence**
1. BMS closes **Negative Main Contactor (Contactor -)**.
2. BMS closes **Pre-charge Contactor (Pre-Chg)**.
3. VCU/Inverter reports capacitor voltage $V_{dc\\_link}$ via CAN message \`0x185\`.
4. Once $|V_{pack} - V_{dc\\_link}| \\le 20\\text{ V}$ (approx. $95\\%$ charged, $t \\approx 3\\tau$):
5. BMS commands **Main Positive Contactor (Contactor +)** CLOSE.
6. BMS confirms auxiliary feedback switches on Main (+).
7. BMS commands **Pre-charge Contactor** OPEN.
8. System transitions to **HV READY**.`;
  }

  if (q.includes('accelerator') || q.includes('pedal')) {
    return `### Signal Path: Accelerator Pedal to Road Torque

1. **Dual Redundant Sensor Reading (APP 1 & APP 2):**
   The accelerator pedal utilizes two independent Hall-effect or potentiometer sensors with opposing or offset transfer curves (e.g., Sensor 1: 0.5V → 4.5V; Sensor 2: 0.25V → 2.25V) to satisfy **ISO 26262 ASIL-D** functional safety requirements. If $|V_1 - 2V_2| > \\text{tolerance}$ for $>100\\text{ ms}$, a plausibility fault triggers safe torque cutoff.

2. **Vehicle Control Unit (VCU) Interpretation:**
   - Raw pedal percentage $\\alpha \\in [0, 100\\%]$ is passed through a driver pedal map (Comfort, Sport, Track, Eco).
   - Speed governor, traction control slip limits (TC), and yaw moment controller (torque vectoring) apply modulation.
   - The VCU derives requested motor shaft torque $T_{req}^*$.

3. **Inverter Space Vector & Field Oriented Control (FOC):**
   - The motor controller executes Clarke and Park transformations to decouple stator currents into flux component $I_d$ and torque component $I_q$.
   - $I_q^* = \\frac{2}{3} \\frac{T_{req}^*}{P \\cdot \\left[\\lambda_{pm} + (L_d - L_q) I_d\\right]}$ (where $P$ is pole pairs).
   - Space Vector PWM (SVPWM) applies high-frequency gate pulses (8 kHz – 16 kHz) to the SiC/IGBT power bridges.

4. **Mechanical Transmission:**
   - Motor electromagnetic torque $T_e$ drives the single-speed reduction gearbox (ratio $i_g \\approx 8.5:1$ to $10.5:1$).
   - Output torque at the wheels: $T_{wheel} = T_e \\cdot i_g \\cdot \\eta_{gearbox}$.
   - Road tractive force: $F_{tractive} = \\frac{T_{wheel}}{r_{dynamic\\_tire}} - F_{drag} - F_{rolling}$.`;
  }

  if (q.includes('400') || q.includes('800') || q.includes('voltage')) {
    return `### 400V vs. 800V Architecture: Engineering Comparison

**1. Ohmic Loss Reduction ($P = I^2 R$)**
At equivalent power ($P = V \\cdot I = 250\\text{ kW}$):
- **400V System:** $I = \\frac{250,000}{400} = 625\\text{ A}$
- **800V System:** $I = \\frac{250,000}{800} = 312.5\\text{ A}$
Since conductor resistive heat dissipation is proportional to current squared ($I^2 R$), halving the current reduces copper losses by **$75\\%$** or allows reducing cable cross-sectional area from $95\\text{ mm}^2$ to $35\\text{ mm}^2$, saving $15 - 25\\text{ kg}$ in vehicle wiring harness mass.

**2. Fast Charging Capability**
Combined Charging System (CCS2) liquid-cooled cables are typically current-limited to $500\\text{ A}$.
- At 400V: Peak charging power $= 400\\text{ V} \\times 500\\text{ A} = 200\\text{ kW}$.
- At 800V: Peak charging power $= 800\\text{ V} \\times 500\\text{ A} = 400\\text{ kW}$ (e.g. Porsche Taycan, Hyundai E-GMP 18-minute 10%–80% charges).

**3. Semiconductor & Insulation Challenges**
- 800V requires **1200V-rated power switches** (Silicon Carbide SiC MOSFETs) rather than inexpensive 650V Silicon IGBTs.
- Stator winding insulation must withstand higher $dV/dt$ voltage gradients ($>10\\text{ kV}/\\mu\\text{s}$) to avoid partial discharge degradation and premature winding dielectric breakdown.`;
  }

  return `### EV Engineering Insights on "${query}"

**Fundamental Operating Principles:**
In modern battery electric vehicles (BEVs), energy conversion, real-time control, and functional safety are tightly synchronized across high-voltage (HV) and low-voltage (LV) domains.

1. **Energy Storage & Conditioning:**
   The traction pack consists of series/parallel cell topologies monitored by Cell Supervision Circuits (CSC). The Battery Management System (BMS) continuously estimates State of Charge (SOC via Coulomb counting + OCV lookup / EKF), State of Health (SOH via internal resistance growth $\\Delta R_i$ and capacity fade), and State of Power (SOP discharge/regen limits).

2. **Power Inversion & Traction:**
   The 3-phase inverter transforms DC battery potential to variable-frequency, variable-amplitude sinusoidal AC via Field Oriented Control (FOC). Clarke/Park transformations decouple stator current into magnetizing flux ($I_d$) and torque-producing current ($I_q$).

3. **Thermal Management Integration:**
   A liquid cooling loop with 50/50 water-ethylene glycol maintains battery cells within their optimal $20^\\circ\\text{C} - 35^\\circ\\text{C}$ window and motor/inverter components under $65^\\circ\\text{C}$ using an electric compressor, chiller, PTC heater, and proportional 4-way coolant control valves.

**Key Metrics & Diagnostic Rule of Thumb:**
- Always inspect insulation resistance ($R_{iso} > 500\\,\\Omega/\\text{V}$ per UN ECE R100).
- Monitor CAN bus error counters (TEC/REC) during high torque switching transients to diagnose EMI shielding degradation.`;
}

// Development with Vite vs Production static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VOLTX EV Platform server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
