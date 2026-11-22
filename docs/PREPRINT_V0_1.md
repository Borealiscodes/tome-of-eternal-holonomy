# Preprint: Deterministic Cellular Sheaves, `Q16.16` Bezier Manifolds, and Embodied Runic Telemetry in *Tome of Eternal Holonomy* (`v0.1.0-alpha`)

**Author:** Borealis Serenity Hedling 
**Date:** November 22, 2026  
**Repository:** `://github.com`  
**Status:** Exploratory Proof-of-Concept Preprint (`v0.1.0`)

---

## Abstract

Modern interactive game engines typically decouple visual rendering, physics simulation, and audio synthesis across heavy floating-point middleware stacks, sacrificing bit-exact determinism and low-vision acoustic accessibility. This preprint documents the architecture and empirical lessons of ***Tome of Eternal Holonomy* (`v0.1.0`)**, a zero-dependency, zero-float interactive proof of concept inspired by *Eternal Darkness: Sanity's Requiem* (Silicon Knights, 2002), *Ōkami* (Clover Studio, 2006), and PlayStation Portable (PSP) fixed-point graphics pipelines. By unifying 4-channel `Q16.16` cellular sheaf cohomology, `4×4` De Casteljau bicubic Bezier manifolds, `4×4` Bayer-dithered `CLUT8` 3D projection, and integer Karplus-Strong waveguide synthesis under a strict Dual-Ledger architecture, the prototype demonstrates how constrained retro mathematics can drive both diegetic Sanity hallucinations and non-visual acoustic telemetry. Finally, we critically evaluate the prototype's current limitations—most notably its coarse Shodo gesture vocabulary and browser-native speech synthesis—and outline an extraction roadmap toward production-grade runic spellcasting.

---

## 1. Mathematical & Computational Architecture

All simulation state (`Ledger 1`) executes strictly in signed 32-bit fixed-point arithmetic (`Q16.16`, where $1.0 \equiv 2^{16} = 65,536$), eliminating IEEE-754 floating-point drift across host CPUs.

### 1.1 Four-Alignment Cellular Sheaf & Mantorok Regularization
Rather than modeling cosmic alignments as isolated scalar health pools, each vertex $v$ in an $N$-point Circle of Power ($N \in \{3, 5, 7, 9\}$) stores a 4D stalk vector $\mathcal{F}(v) = [c_v, u_v, x_v, m_v]^T \in \mathbb{Z}_{32}^4$ corresponding to **Chattur'gha** (Matter), **Ulyaoth** (Magick), **Xel'lotath** (Sanity), and **Mantorok** (Binding) (Hansen & Ghrist, 2019).

Across any 1-cell edge $e = (u, v)$ with weight $w_e$, cyclic rock-paper-scissors dominance ($\text{Chattur'gha} \succ \text{Xel'lotath} \succ \text{Ulyaoth} \succ \text{Chattur'gha}$) induces coboundary Dirichlet frustration energy $\mathcal{E}(e)$:

$$\mathcal{E}_{\text{raw}}(u, v) = (c_u x_v + x_u c_v) + (x_u u_v + u_u x_v) + (u_u c_v + c_u u_v)$$

To prevent singular manifold collapse when opposing Ancients are chained, **Mantorok** operates as an `A7.2` Tikhonov binding regularizer ($\lambda_{Q16} = 98 \approx 0.0015$):

$$\mathcal{E}(e) = w_e \cdot \mathcal{E}_{\text{raw}}(u, v) \cdot \text{clamp}\!\left(1 - \frac{\frac{1}{2}(m_u + m_v) + \lambda_{Q16}}{4},\; 0.125,\; 1.0\right)$$

Accumulated Dirichlet tension $\sum_e \mathcal{E}(e)$ directly governs Sanity decay in `Ledger 1` while remaining completely isolated from `Ledger 2` observer glitches.

### 1.2 `4×4` De Casteljau Bezier Manifolds & `CLUT8` Phong Dithering
Tactile pointer impulses excite a $4 \times 4$ damped integer spring grid ($k_{\text{stiff}} = 2400$, $k_{\text{damp}} = 61800$ in `Q16.16`), evaluated via nested cubic De Casteljau interpolation:

$$S(u, v) = \sum_{i=0}^{3} \sum_{j=0}^{3} B_i^3(u)\, B_j^3(v)\, P_{i,j}$$

Surface normals derived from finite height differences ($\Delta_u S, \Delta_v S$) drive specular rim shading quantized into a 256-color (`CLUT8`) lookup table partitioned into four 64-shade alignment banks, smoothed across a $480 \times 272$ framebuffer using a $4 \times 4$ Bayer ordered dithering threshold matrix (Bayer, 1973). Trigonometric projection uses Bhaskara I's 7th-century rational sine approximation:

$$\sin(x) \approx \frac{16x(\pi - x)}{5\pi^2 - 4x(\pi - x)}, \quad x \in [0, \pi]$$

### 1.3 Integer Karplus-Strong Waveguide & Acoustic Telemetry
Procedural audio combines a 16-bit Galois Linear-Feedback Shift Register (LFSR, polynomial `0xB400`) with a 4-voice integer Karplus-Strong delay line (Karplus & Strong, 1983):

$$y[n] = \left\lfloor \frac{y[n - L] + y[n - L - 1]}{2} \right\rfloor - \left( \left\lfloor \frac{y[n - L] + y[n - L - 1]}{2} \right\rfloor \gg 10 \right)$$

Delay period $L = \lfloor f_s / f_{\text{detuned}} \rfloor$ shortens proportionally to Sanity loss $(1 - \text{Sanity}_{Q16})$, bending consonant intervals upward toward a microtonal tritone ($\sqrt{2} \approx 1.414$) and providing continuous non-visual acoustic telemetry of topological tension.

---

## 2. Honest Evaluation: What `v0.1.0` Gets Right

1. **Dual-Ledger Integrity Under Hallucination:** Fourth-wall Sanity effects (crimson Bayer wall-bleed, scanline tearing, viewport tilt, and phantom memory-card corruption banners) execute strictly in `Ledger 2`. Deterministic replay logs remain under $4\text{ KB}$ and verify to identical 32-bit FNV-1a state digests (`0xc07f53b3`) regardless of active visual distortions.
2. **Embodied Ritual Pacing:** Rather than resolving spells instantaneously, the sequential ritual sequencer (`720 ms` per vertex) replicates the deliberate, dread-inducing cadence of *Eternal Darkness*, pairing each vertex ignition with localized 3D manifold shockwaves and acoustic resonance.
3. **Zero-Asset Edge Portability:** The entire engine—including 3D software rasterizer, synth, and sheaf solver—runs at 60 FPS on mobile browsers with zero external libraries or binary assets.

---

## 3. Limitations & Mechanical Extractions from Prior Art

While effective as a nostalgic proof of concept, `v0.1.0` lacks the expressive depth required for full freehand spellcraft. Future iterations should extract and adapt four proven mechanics:

### 3.1 Upgrade Gesture Recognition (`$1` / `$P` Fixed-Point Unistroke Recognizer)
* **Current Flaw:** `ShodoRuneBrush` relies on coarse bounding-box aspect ratios and raw turning counts, reliably distinguishing only ~6–7 primitive strokes—insufficient for a full 12-rune codex without false positives.
* **Extraction (*Ōkami* & *Arx Fatalis*):** Replace ad-hoc heuristics with a fixed-point **`$1` Unistroke Recognizer** (Wobbrock et al., 2007) or **Rubine linear feature classifier** (Rubine, 1991). Resampling strokes to $N = 32$ equidistant points in `Q16.16`, rotating to an indicative angle via `atan2` LUTs, and scoring golden-section angular distance against canonical rune templates enables reliable recognition of all 12 runes—and allows stroke accuracy to scale spell potency, mirroring *Arx Fatalis* (Arkane Studios, 2002).

### 3.2 Dynamic Brush Velocity & Ink Economy (*Black & White* / *Ōkami*)
* **Current Flaw:** Brush strokes apply uniform impulse regardless of drawing speed or stroke pressure.
* **Extraction:** Couple pointer velocity $\Delta \mathbf{p} / \Delta t$ to ink thickness and Dirichlet excitation—slow, deliberate calligraphy yields high-stability Mantorok/Ulyaoth bindings, while frantic, jagged scribbles spike Xel'lotath chaos and bleed ink across the manifold.

### 3.3 Combinatorial Spell-Graph Topology (*Noita*)
* **Current Flaw:** Circle of Power slots currently evaluate flat `Alignment + Verb + Noun + Pargon` bags regardless of vertex adjacency.
* **Extraction (*Noita*, Nolla Games, 2019):** Make graph adjacency semantically meaningful on the cellular sheaf—placing *Pargon* between a *Verb* and *Noun* should amplify edge flux specifically along that directed chord, whereas placing opposing Ancients on adjacent nodes should create unstable "chaotic discharge" spells that trade massive potency for rapid Sanity burn.

### 3.4 Voice Narration: The "Cursed Speak & Spell" Trade-Off
* **Current Flaw & Intentional Joke:** In `v0.1.0`, rune incantations are narrated via the browser's native `window.speechSynthesis` API tuned to `pitch = 0.42` and `rate = 0.72` rather than a high-fidelity neural TTS model (such as **Piper** VITS ONNX wave synthesis).
* **The Dane Cook Observation:** Leaving the stock robotic browser voice pitched down into the subterranean basement makes *"pargon... redgormor..."* sound unmistakably like **Dane Cook's** classic stand-up routine regarding the **Cursed Speak & Spell**—where a battery-starved children's educational toy begins possessedly spelling out demonic commands in a flat, soulless monotone (Cook, 2003). While bundling ~15–60 MB of Piper neural ONNX weights would eliminate the Speak & Spell timbre in favor of realistic whispered Latin/cthonic voice acting, keeping the stock `speechSynthesis` fallback preserves our sub-100 KB footprint—and accidentally nails the exact energy of a haunted 1980s Texas Instruments toy.

---

## 4. References (APA 7th Edition)

* Arkane Studios. (2002). *Arx Fatalis* [Video game]. JoWooD Productions.
* Bayer, B. E. (1973). An optimum method for two-level rendition of continuous-tone pictures. *IEEE International Conference on Communications*, *1*, 26-11–26-15.
* Clover Studio. (2006). *Ōkami* [Video game]. Capcom.
* Cook, D. (2003). Speak & Spell [Track 12]. On *Harmful If Swallowed* [Album]. Comedy Central Records.
* Hansen, J., & Ghrist, R. (2019). Toward a spectral theory of cellular sheaves. *Journal of Applied and Computational Topology*, *3*(4), 315–358. https://doi.org
* Karplus, K., & Strong, A. (1983). Digital synthesis of plucked-string and drum timbre. *Computer Music Journal*, *7*(2), 43–55. https://doi.org
* Lionhead Studios. (2001). *Black & White* [Video game]. Electronic Arts.
* Nolla Games. (2019). *Noita* [Video game]. Nolla Games.
* Rubine, D. (1991). Specifying gestures by example. *ACM SIGGRAPH Computer Graphics*, *25*(4), 329–337. https://doi.org
* Silicon Knights. (2002). *Eternal Darkness: Sanity's Requiem* [Video game]. Nintendo.
* Wobbrock, J. O., Wilson, A. D., & Li, Y. (2007). Gestures without libraries, toolkits or training: A $1 recognizer for user interface prototypes. Proceedings of the 20th Annual ACM Symposium on User Interface Software and Technology (UIST '07), 159–168. doi.org

