# 👁️ Tome of Eternal Holonomy (`Q16.16` Cosmology & Runic Engine)

> ✨ **PLAYABLE ALPHA (`v0.1.0`)** ✨  
> *Zero-dependency, zero-float `Q16.16` cellular sheaf kernel, 3D De Casteljau Bezier manifold, Shodo brush gesture recognizer, and sanity-detuned Karplus-Strong waveguide synth.*

A **deterministic cosmology and runic magick engine** inspired by *Eternal Darkness: Sanity's Requiem* and *Ōkami*.

Built on a strict **Dual-Ledger `Q16.16` fixed-point architecture**, this engine unifies 4-channel cellular sheaf cohomology, interactive 3D Bezier brush-stroke physics, 256-color (`CLUT8`) Bayer-dithered rendering, and real-time physical waveguide audio synthesis—with zero external runtime dependencies.

---

## 🌌 Cosmological Architecture

### 1. The Four Alignments as `Q16.16` Cellular Sheaf Stalks (`Ledger 1`)
Every node (0-cell) in the Tome's Circle of Power holds a 4-channel signed 32-bit integer vector \(\mathcal{F}(v) \in \mathbb{Z}_{32}^4\) scaled by \(2^{16}\) (`65536 = 1.0`):

| Channel | Entity | Domain | Dominance & Topological Role |
| :--- | :--- | :--- | :--- |
| **`[0]`** | **Chattur'gha** | Matter / Flesh (Red) | Dominates **Xel'lotath**; weak to **Ulyaoth** |
| **`[1]`** | **Ulyaoth** | Magick / Plane (Blue) | Dominates **Chattur'gha**; weak to **Xel'lotath** |
| **`[2]`** | **Xel'lotath** | Sanity / Mind (Green) | Dominates **Ulyaoth**; weak to **Chattur'gha** |
| **`[3]`** | **Mantorok** | Corpse-God / Binding (Purple) | **Tikhonov Regularizer (\(\lambda_{Q16} = 98\))**; clamps manifold singularities (\(\sigma_{\min} \to 0^+\)) |

* **Dirichlet Frustration Energy (\(\mathcal{E}\)):** When opposing alignments connect across a 1-cell edge, the coboundary operator (\(\delta^0\)) computes non-zero harmonic tension, driving **Sanity drain** and **Cosmic Distortion**.
* **Mantorok Equilibrium:** Acts as the hidden \(\mathbb{Z}_2\)-twisted stabilizer that damps cross-alignment conflict and prevents total topological collapse.

---

### 2. Interactive Runic Spellcasting (`3D De Casteljau` + `Shodo Brush`)
* **Circles of Power (`3, 5, 7, 9`-Point N-Gons):** Players inscribe **Alignment**, **Verb** (*Antorbok*, *Bankorok*, *Tier*, *Narokath*), and **Noun** (*Redgormor*, *Magormor*, *Aretak*) runes onto 3D-projected graph vertices.
* **3D Bezier Manifold & Tidal Brush:** Tracing runes deforms a **4×4 `Q16.16` De Casteljau surface** projected via Bhaskara I rational sine/cosine. Its gradient slope (\(\nabla S_{\text{Q16}}\)) transfers astral flux between rune sockets.
* **Shodo Brush Gesture Recognition:** Freehand strokes (*Enso* circles, chevrons, diamonds, slashes, and crosses) classify directly into runes, while **Pargon** nodes multiply `Q16.16` edge weights and spell potency by `1.5x` per rune.
* **Embodied Sequential Rituals:** Casting activates each vertex one by one (`720 ms` cadence) with 3D manifold shockwaves and pitch-shifted occult voice chanting.

---

### 3. Dual-Ledger Sanity Effects (`Ledger 1` vs. `Ledger 2`)
Because simulation state (`Ledger 1`) and observer presentation (`Ledger 2`) are strictly decoupled, fourth-wall Sanity hallucinations never corrupt deterministic physics or `< 4 KB` FNV-1a replay receipts:
* **Crimson Wall-Bleed & Scanline Tearing:** Drops in `sanityQ16` inject downward Chattur'gha blood drips and horizontal scanline shear directly into the `CLUT8` framebuffer.
* **Fourth-Wall Hallucinations:** Low Sanity tilts the viewport and flashes phantom system warnings while keeping `Ledger 1` bit-exact across devices.

---

### 4. Creepy Procedural Soundscape & Acoustic Telemetry
* **Karplus-Strong Waveguide & 16-bit Galois LFSR:** Generates continuous `44 Hz / 58 Hz` sub-bass ritual drones, bowed/plucked ancient strings, cathedral feedback echoes, and vowel-formant whispers from pure integer bit-shifts.
* **Sanity-Coupled Detuning:** Delay-line lengths scale directly with Sanity loss, bending consonant intervals upward toward microtonal tritones for non-visual acoustic telemetry.

---

## 🗂️ Repository Structure

```text
tome-of-eternal-holonomy/
├── README.md
├── package.json
├── index.html                                    # Zero-dependency 480x272 interactive sandbox & Grimoire
├── docs/
│   ├── COSMOLOGY_SPEC.md                         # Q16.16 Sheaf math, 4-Alignment dominance & Mantorok clamping
│   ├── RUNIC_CODEX.md                            # 12-rune codex, N-gon circles (3/5/7/9) & Pargon multipliers
│   ├── PREPRINT_V0_1.md                          # v0.1.0 mathematical preprint, mechanical roadmap & APA references
│   └── BILL_NYE_COSMOLOGY_TILE_EXPLAINER.md      # Accessible 5-tile visual science breakdown
├── src/
│   ├── core/                                     # LEDGER 1: Pure deterministic Q16.16 simulation (zero floats)
│   │   ├── q16.js                                # Fixed-point arithmetic, Bhaskara I sine & 16-bit Galois LFSR
│   │   ├── sheaf_cosmology.js                    # 4D Stalk vectors, coboundary energy (ℰ) & Mantorok regularizer
│   │   └── replay_ledger.js                      # < 4 KB deterministic input recorder & 32-bit FNV-1a verifier
│   ├── physics/                                  # Interactive Bezier tidal manifold & runic circuit solver
│   │   ├── bezier_patch.js                       # 4x4 De Casteljau bicubic surface & damped integer spring grid
│   │   ├── circle_of_power.js                    # N-gon 3D/2D vertex topology, astral flux & spell evaluator
│   │   └── shodo_rune_brush.js                   # Deterministic freehand brush gesture classifier
│   ├── render/                                   # LEDGER 2: Read-only 480x272 retro framebuffer & sanity VFX
│   │   ├── bayer_clut8.js                        # 3D isometric Phong rasterizer, 4x4 Bayer dithering & rune glyphs
│   │   └── sanity_glitches.js                    # Read-only crimson wall-bleed, scanline tear & phantom UI alerts
│   └── audio/                                    # LEDGER 2: Zero-asset procedural synthesizer
│       ├── karplus_strong.js                     # Sanity-detuned integer delay-line waveguide voice
│       └── formant_whisper.js                    # Sub-bass ritual drone, cathedral echo & LFSR formant whispers
└── tests/
    ├── sheaf_equilibrium_test.js                 # Verifies Bhaskara trig, Dirichlet tension & Mantorok damping
    ├── circle_physics_test.js                    # Verifies 5-point Pargon amplification & Bezier tidal flux
    ├── audio_telemetry_test.js                   # Verifies Sanity pitch detuning & deterministic Int16 PCM output
    └── determinism_test.js                       # Verifies < 4 KB replay serialization & bit-exact FNV-1a digest
```

---

## 🚀 Quick Start

```bash
# Run deterministic test suite (Node.js >= 20)
npm test

# Serve interactive sandbox locally
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080` in your browser, tap **🔊 Enable Audio**, and select a preset ritual from the **📖 Tome Grimoire** (or draw Shodo gestures directly on the 3D manifold).

---

## 🛠️ Roadmap & Status

- [x] **Phase 0:** Architectural synthesis (`Q16.16` Sheaf + Bezier Brush + Karplus-Strong specs)
- [x] **Phase 1:** `src/core/` — `Q16.16` arithmetic, Bhaskara LUT, 4-Alignment Sheaf solver & `< 4 KB` FNV-1a replay ledger
- [x] **Phase 2:** `src/physics/` — `4×4` De Casteljau tidal patch, Circle of Power (`3/5/7/9`) & Shodo brush classifier
- [x] **Phase 3:** `src/audio/` — Sanity-detuned Karplus-Strong waveguide, sub-bass drone & LFSR formant whispers
- [x] **Phase 4:** `src/render/` — 3D projected `480×272` `CLUT8` Bayer-dithered renderer, vector rune sigils & `Ledger 2` Sanity hallucinations
- [x] **Phase 5:** `docs/` — Mathematical preprint (`v0.1.0`), Runic Codex & Tile Explainer
- [ ] **Phase 6 (`v0.2.0`):** Fixed-point `$1` Unistroke Recognizer for full 12-rune freehand accuracy & adjacency-weighted *Noita*-style spell chords
