# 👁️ Tome of Eternal Holonomy (`Q16.16` Cosmology & Runic Engine)

> 🚧 **UNDER CONSTRUCTION** 🚧  
> *Core `Q16.16` cellular sheaf kernel, De Casteljau rune-drawing surface, and dissonant Karplus-Strong waveguide synth are currently in active pre-alpha scaffolding.*

A **zero-float, deterministic cosmology and runic magick engine** inspired by *Eternal Darkness: Sanity's Requiem*. 

Built on a strict **Dual-Ledger `Q16.16` fixed-point architecture**, this engine unifies cellular sheaf cohomology, interactive Bezier brush-stroke physics, 256-color Bayer-dithered rendering, and real-time physical waveguide audio synthesis—with zero external runtime dependencies.

---

## 🌌 Cosmological Architecture

### 1. The Four Alignments as `Q16.16` Cellular Sheaf Stalks (`Ledger 1`)
Every node (0-cell) in the Tome's Circle of Power holds a 4-channel integer vector \(\mathcal{F}(v) \in \mathbb{Z}_{32}^4\) scaled by 2¹⁶ (`65536 = 1.0`):

| Channel | Entity | Domain | Dominance & Topological Role |
| :--- | :--- | :--- | :--- |
| **`[0]`** | **Chattur'gha** | Matter / Flesh (Red) | Dominates **Xel'lotath**; weak to **Ulyaoth** |
| **`[1]`** | **Ulyaoth** | Magick / Plane (Blue) | Dominates **Chattur'gha**; weak to **Xel'lotath** |
| **`[2]`** | **Xel'lotath** | Sanity / Mind (Green) | Dominates **Ulyaoth**; weak to **Chattur'gha** |
| **`[3]`** | **Mantorok** | Corpse-God / Binding (Purple) | **Tikhonov Regularizer (\(\lambda_{Q16} = 98\))**; clamps manifold singularities (\(\sigma_{\min} \to 0^+\)) |

* **Dirichlet Frustration Energy (\(\mathcal{E}\)):** When opposing alignments connect across a 1-cell edge, the coboundary operator (δ⁰) computes non-zero harmonic tension, driving **Sanity drain** and **Cosmic Distortion**.
* **Mantorok Equilibrium:** Acts as the hidden \(\mathbb{Z}_2\)-twisted stabilizer that binds the three Ancients and prevents total topological collapse.

---

### 2. Interactive Runic Spellcasting (`De Casteljau` + `Tidal Brush`)
* **Circles of Power (`3, 5, 7, 9`-Point N-Gons):** Players inscribe **Alignment**, **Verb** (*Antorbok*, *Tier*, *Bankorok*, *Narokath*, etc.), and **Noun** (*Pargon*, *Redgormor*, *Magormor*, *Aretak*) runes onto graph vertices.
* **Tidal Brush Physics:** Tracing runes deforms a **4×4 `Q16.16` Bezier surface**. The gradient slope (\(\nabla S_{\text{Q16}}\)) generates astral currents that carry magickal charge between nodes.
* **Pargon Amplification:** Placing *Pargon* runes into empty vertices multiplies `Q16.16` edge weights across the sheaf, scaling spell power and Dirichlet tension simultaneously.

---

### 3. Dual-Ledger Sanity Effects (`Ledger 1` vs. `Ledger 2`)
Because physics and rendering are strictly decoupled, Sanity hallucinations never corrupt deterministic state or replay logs:
* **True Spatial Warping (`Ledger 1`):** High Xel'lotath frustration warps Störmer–Verlet radial geometry and inverts node coordinates in bit-exact `Q16.16` space.
* **Fourth-Wall Hallucinations (`Ledger 2`):** Read-only observer glitches swap `CLUT8` 256-color palettes (bleeding walls via 4×4 Bayer dithering), tilt the horizon, or inject phantom UI warnings while preserving bit-exact SHA-256 simulation receipts.

---

### 4. Creepy Procedural Soundscape & Acoustic Telemetry
* **Karplus-Strong Waveguide & 16-bit Galois LFSR:** Generates plucked ancient strings, sub-bass drones, and vowel-formant whispers from pure integer bit-shifts.
* **Sanity-Coupled Detuning:** Delay-line lengths scale directly with Dirichlet frustration energy (\(\mathcal{E}\)), shifting harmonic intervals into microtonal tritones as Sanity drops—enabling full non-visual navigation and WCAG AAA acoustic telemetry.

---

## 🗂️ Repository Scaffolding

```text
tome-of-eternal-holonomy/
├── README.md
├── LICENSE
├── docs/
│   ├── COSMOLOGY_SPEC.md          # Q16.16 Sheaf math, 4-Alignment matrices & Mantorok A7.2 clamping
│   ├── RUNIC_CODEX.md             # Full 12-rune table, N-gon circles (3/5/7/9) & Pargon multipliers
│   └── ACCESSIBILITY_TELEMETRY.md # WCAG AAA CLUT8 palettes & non-visual acoustic mapping
├── src/
│   ├── core/                      # LEDGER 1: Pure deterministic Q16.16 simulation (zero floats)
│   │   ├── q16.js                 # Fixed-point math, Bhaskara sine LUT, bit-exact PRNG (LFSR)
│   │   ├── sheaf_cosmology.js     # 4D Stalk vectors, coboundary operator (δ⁰) & Dirichlet energy
│   │   ├── mantorok_twist.js      # Z2 orientation twist & Tikhonov singularity regularizer
│   │   └── replay_ledger.js       # < 4 KB deterministic input log & SHA-256 state verifier
│   ├── physics/                   # Interactive Bezier tidal surface & rune circuit solver
│   │   ├── bezier_patch.js        # 4x4 De Casteljau surface & damped integer spring grid
│   │   ├── tidal_currents.js      # Gradient slope (∇S_Q16) astral flow between rune nodes
│   │   └── circle_of_power.js     # N-gon vertex topology & spell syntax validator
│   ├── render/                    # LEDGER 2: Read-only 480x272 retro framebuffer & sanity VFX
│   │   ├── clut8_palette.js       # 256-color high-contrast alignment palettes (Chattur'gha/Ulyaoth/Xel'lotath/Mantorok)
│   │   ├── bayer_dither.js        # 4x4 ordered dithering & Phong-style integer shading
│   │   └── sanity_glitches.js     # Read-only camera tilt, wall-bleed & phantom UI hallucinations
│   └── audio/                     # LEDGER 2: Zero-asset procedural synthesizer
│       ├── karplus_strong.js      # Integer delay-line string & sub-drone waveguide
│       ├── formant_whisper.js     # LFSR noise + resonant integer filters for rune incantations
│       └── sanity_telemetry.js    # Microtonal detuning driven by Dirichlet frustration (ℰ)
├── tests/
│   ├── determinism_test.js        # Cross-platform bit-exactness & replay hash verification
│   └── sheaf_equilibrium_test.js  # Validates Mantorok regularizer against alignment collapse
└── index.html                     # Zero-dependency single-page sandbox runner (480x272 upscaled)
```

---

## 🛠️ Roadmap & Status

- [x] **Phase 0:** Architectural synthesis (`Q16.16` Sheaf + Bezier Brush + Karplus-Strong specs)
- [ ] **Phase 1:** `src/core/` — `Q16.16` arithmetic, Bhaskara LUT, and 4-Alignment Sheaf solver
- [ ] **Phase 2:** `src/physics/` — Interactive `4×4` De Casteljau rune-drawing canvas & Circle of Power
- [ ] **Phase 3:** `src/audio/` — Dissonant Karplus-Strong waveguide & LFSR incantation whispers
- [ ] **Phase 4:** `src/render/` — `480×272` `CLUT8` Bayer-dithered renderer & `Ledger 2` Sanity hallucinations
