# Paper Prioritization Framework
## Rahma — seqFISH AD/FTD Spatial Transcriptomics, Caltech PhD
## Last updated: April 15, 2026

> You are a world-class computational neuroscientist and ML engineer evaluating a portfolio of potential papers. 
> The evaluation criterion is ruthlessly honest: impact × novelty × feasibility given your specific data and timeline.
> The fundamental constraint: you have ~1 flagship paper to finish before November 2026. Everything else is ranked by 
> "what should I do if I could only add one more."

---

## The Complete Paper Universe

From across all our conversations, here is every paper idea you have mentioned or that naturally emerges from your data:

| # | Paper | Core idea |
|---|---|---|
| **F** | **Flagship: AD Spatial Atlas** | Multi-region seqFISH of human AD/CN brain; spatial domains, cell types, DE, LR, CPS proxy |
| 1 | EEF2 Efficiency Methods | EEF2 as in-tissue efficiency standard; spatially-resolved efficiency maps; efficiency regression |
| 2 | DAPI / Ghost Cells | DAPI+ transcript-desert cells; nuclear morphology → cell state; chromatin-RNA connection |
| 3 | CONCORD Latent SAE | Sparse autoencoder decomposition of CONCORD latent space; spatial gene program maps |
| 4 | SIR Epidemic Model | Microglial activation modeled as spatial epidemic; R₀ per Braak stage; invasion front mapping |
| 5 | Spatial PageRank / Influence Max | TF influence maximization on spatially-embedded GRN; spatially-aware master regulators |
| 6 | Tissue Assortativity | Cell-type spatial homophily as quantitative disease biomarker across Braak stages |
| 7 | Temporal Graph Networks | TGN on multi-patient Braak-stage snapshots; predict which cell-cell interactions emerge/dissolve |
| 8 | Spatial LR (Custom Kernel) | Proximity-weighted LR scores with Gaussian/Matérn kernel; disease zone comparison |
| 9 | Network Motifs in Tissue | Recurring spatial cell configuration "fingerprints" in AD subtypes and Braak stages |
| 10 | VEN / FTD Paper | Von Economo neuron vulnerability in FIC in AD vs. bvFTD; why VENs are spared in early AD |
| 11 | Subcellular RNA Localization | Nuclear/cytoplasmic RNA ratio; 4i-inspired; RNA processing defects in AD |
| 12 | AD Molecular Subtypes | AD1/AD2/AD3 spatial stratification; which subtype dominates which region |

---

## Scoring Rubric

Each paper scored 1–5 on four axes:

- **Impact**: Will this paper change how people do science or think about AD? Would it be cited 100+ times in 5 years?
- **Novelty**: Is there a clear gap in the literature? Would a reviewer at Nature Methods or Nature Neuroscience say "we haven't seen this"?
- **AD/FTD Relevance**: Does it directly use your specific data (UCSF FIC, RUSH FIC/DLPFC) and answer a question about neurodegeneration?
- **Graduation Risk**: 1 = zero additional work needed (emerges from flagship naturally); 5 = requires 1+ year of new work before the flagship is submitted

**Composite score** = (Impact × 2) + Novelty + AD Relevance − Graduation Risk

Higher = do this sooner and/or instead of alternatives.

---

## Scored Rankings

| # | Paper | Impact | Novelty | AD Relevance | Grad Risk | **Composite** |
|---|---|---|---|---|---|---|
| 1 | EEF2 Efficiency Methods | 4 | 5 | 5 | 1 | **18** |
| 6 | Tissue Assortativity | 4 | 5 | 5 | 1 | **18** |
| 4 | SIR Epidemic Model | 5 | 5 | 4 | 2 | **17** |
| 3 | CONCORD Latent SAE | 4 | 5 | 3 | 2 | **16** |
| 10 | VEN / FTD | 5 | 4 | 5 | 3 | **16** |
| 2 | DAPI / Ghost Cells | 4 | 4 | 4 | 2 | **16** |
| 5 | Spatial PageRank / Influence Max | 5 | 5 | 3 | 3 | **16** |
| 8 | Spatial LR Custom Kernel | 3 | 4 | 4 | 1 | **14** |
| 12 | AD Molecular Subtypes | 4 | 3 | 5 | 2 | **14** |
| 9 | Network Motifs | 3 | 5 | 3 | 3 | **13** |
| 7 | Temporal Graph Networks | 4 | 5 | 3 | 4 | **12** |
| 11 | Subcellular RNA Localization | 3 | 4 | 3 | 3 | **11** |

---

## IF I COULD ONLY DO 1 ADDITIONAL PAPER

### EEF2 Efficiency Methods (tied #1 composite) OR Tissue Assortativity (tied #1)

These two have identical composite scores but are completely different in character. Choose based on what you want your post-PhD identity to be.

---

### Option A: EEF2 Efficiency Methods Paper

**Why it wins:**

This paper has zero graduation risk because you are computing EEF2 counts as part of the flagship analysis anyway. The efficiency regression (DAPI, polyT, cell area, laminar position as covariates) is code you must write regardless. The methods contribution is packaging this as a standalone, rigorous, field-defining paper.

**What the field lacks:** No seqFISH paper has ever published a spatially-resolved, cell-type-stratified efficiency map with biological interpretation. The standard practice is to either (1) ignore efficiency, (2) use a global scaling factor, or (3) use EEF2 as a single QC metric but never report what it actually reveals. This is a gap that will embarrass the field in retrospect — and you can close it.

**The core finding that would make this publishable:**
> "Detection efficiency in seqFISH varies by up to [X]-fold across cell types and [Y]-fold across laminar positions within the same tissue section, independent of biological gene expression differences. This variation, if uncorrected, creates systematic false positives in cross-cell-type differential expression. We develop a spatially-resolved efficiency correction framework using EEF2 as an internal standard."

That statement, if shown empirically in your data, is a Nature Methods paper. The variation number is the key result — it either exists (paper is important) or doesn't (you've validated that efficiency is uniform, which is also publishable as a negative result validating seqFISH quality).

**Learning curve:** Near zero. You already know h5py, numpy, linear regression, and scanpy. The only new tool is PyMC or statsmodels for the regression uncertainty quantification.

**Timeline:** 3–4 months of focused work running parallel to flagship, because the code must be written anyway.

**Publication target:** Nature Methods, Cell Reports Methods, or eLife.

---

### Option B: Tissue Assortativity

**Why it wins:**

This is a single-function analysis (`nx.attribute_assortativity_coefficient`) that can be computed in an afternoon from data you already have. But the scientific content is deep and genuinely novel: spatial cell-type homophily as a quantitative, single-number biomarker of tissue reorganization that tracks with Braak stage ACROSS PATIENTS. 

**The core finding:**
> "Global spatial cell-type assortativity in human cortex decreases monotonically with Braak stage (ρ = X, p = Y), reflecting progressive breakdown of cell-type segregation as microglia invade neuronal zones and astrocytes become reactive. This measure, computable from any spatial transcriptomics dataset, provides a tissue-architecture biomarker that predicts clinical severity independent of individual gene expression changes."

**Why it's novel:** Assortativity is used in social network science and protein interaction networks but has never been computed on human brain spatial transcriptomics as a disease biomarker. The theoretical justification is clean (graph theory meets tissue biology), the implementation is trivial, and the clinical interpretation is crystal clear.

**Learning curve:** Zero. networkx is already in your environment.

**Graduation risk:** The analysis is a 2-page section in the flagship paper first. The standalone paper is a short, high-impact methods + clinical biomarker contribution.

**Timeline:** Could be a single methods paper written in 2–3 months.

**Publication target:** Nature Communications, Cell Reports, or as a highlighted analysis in the flagship that gets spun out.

---

## IF I COULD DO 2 ADDITIONAL PAPERS

**Add: SIR Epidemic Model (Paper #4)**

**Why this is the right second choice:**

The SIR model is your most conceptually original contribution — it doesn't exist anywhere in the spatial transcriptomics literature. It gives the flagship paper a mechanistic narrative that no other AD spatial paper has: you don't just show THAT microglia are activated near plaques, you show HOW FAST activation propagates (R₀), WHERE the invasion front is, and HOW the dynamics change across Braak stages. 

**This directly answers a question neurobiologists have asked for 30 years:** Is neuroinflammation in AD a local reaction or does it propagate? The SIR model gives a quantitative answer.

**The mathematical novelty is real:** The network SIR model with spatially-varying edge-weighted transmission rates (β_ij = f(proximity, LR interaction score)) has not been published in the spatial transcriptomics context. The epidemiology community has done this on social networks; the computational biology community has not imported it.

**Learning curve:** Moderate. You need:
- networkx (already know)
- scipy.optimize for parameter fitting (basic, 1 week to learn)
- PyTorch Geometric for the GNN version (1–2 months if doing the full GNN — but the basic SIR model requires NONE of this, just NetworkX)

**Start with the simple version:** Fit β and γ per Braak stage using the NetworkX simulation + scipy.optimize (shown in the prior chat). This requires no deep learning. The GNN extension (learning spatial transmission rates from features) can come later.

**Graduation risk:** Low-to-medium. The core analysis (SIR states + parameter fitting) takes 2–3 months. The full GNN extension is a separate paper.

**Publication target for the SIR paper:** Nature Neuroscience, eLife, or Cell Systems. The "neuroinflammation as an epidemic" framing will get attention.

---

## IF I COULD DO 3 ADDITIONAL PAPERS

**Add: CONCORD Latent SAE Interpretability (Paper #3)**

**Why third:**

This paper has a different audience from everything else — it's a computational methods paper aimed at the ML/genomics community, not the AD neurobiology community. That's both a strength (diversifies your publication profile, directly relevant to the ML roles you're targeting at Altos and Genentech) and a risk (requires collaborating with or deeply engaging the CONCORD team, whose paper just came out in 2025).

**Why it's publishable:**
CONCORD explicitly states its latent dimensions are interpretable via gradient-based methods but doesn't implement it. The sparse autoencoder approach (Cunningham et al. ICML 2025) applies it to LLMs but not to single-cell or spatial transcriptomics. You would be the first to apply SAE to contrastive learning embeddings in spatial data, mapping sparse features back to tissue coordinates. This is a genuine methods contribution.

**Why it's the right third paper:**
The CONCORD analysis is required for the flagship. The SAE decomposition is a natural extension that takes 1–2 months of additional work. The spatial feature maps (embedding → tissue → gene program → spatial location) are visually compelling and tell a story no other paper tells.

**Learning curve:** High. Requires PyTorch fluency to implement SAE from scratch. This is why it's third, not second — you need the PyTorch fundamentals from the learning plan (Phase 1) before this is tractable.

**Graduation risk:** Medium. Start building this AFTER the flagship analysis pipeline is running.

---

## IF I COULD DO 4 OR MORE (post-graduation, long game)

### VEN / FTD Paper — High impact, your unique FIC data

**Why this is a high-priority post-graduation paper:**

You have FIC (frontal insular cortex) data from both UCSF and RUSH cohorts. VENs (Von Economo neurons) are uniquely enriched in FIC and are one of the most selectively vulnerable cell types in bvFTD while being relatively spared in early AD. This dissociation — VEN vulnerability in FTD vs. sparing in AD — is biologically mysterious and clinically important (it's part of why FTD and AD can look similar symptomatically early but have different cell biology).

**What makes this publishable:**
Nobody has done spatially-resolved seqFISH of VENs in human FIC across AD/FTD/control. VENs are a small population that is invisible to dissociated scRNA preparations (they don't survive well). Spatial transcriptomics at single-cell resolution in intact tissue is the ONLY way to study VENs properly. You have this data. No one else does.

**Why it's post-graduation:**
VEN identification requires either: (1) an existing VEN marker gene panel validated in your data, or (2) morphological identification from your IF images combined with spatial coordinates. Both are additional work that shouldn't delay the flagship.

**Timeline post-graduation:** 6–12 months.

---

### Spatial PageRank / Influence Maximization — Therapeutics framing

**Why this is compelling but post-graduation:**

The influence maximization paper is scientifically exciting but has a high learning curve and requires building the full spatially-embedded GRN pipeline (SCENIC + spatial correlation + PyTorch Geometric). This is at least 6 months of new infrastructure on top of the flagship. The payoff is enormous — a paper that tells you not just what gene to target but WHERE in the tissue to deliver it — but it's not the right focus right before graduation.

**Post-graduation timeline:** 12–18 months, ideally as a postdoc or industry collaboration paper.

---

### Temporal Graph Networks — Beautiful but risky

**Why it's ranked lower despite high novelty:**

The TGN framework requires treating your patients at different Braak stages as temporal snapshots of a single disease process. This is a biologically interesting assumption but statistically fragile at N=10 per condition. TGN needs enough temporal "events" (cell-cell interactions that appear or disappear across Braak stages) to learn dynamics reliably. With sparse sampling (one section per patient, not longitudinal data), the model may not have enough signal.

Additionally, implementing TGN in PyTorch from the Rossi et al. codebase is a 3–4 month engineering effort. The learning curve is steep and the graduation risk is high.

**If you do this:** Do it as a collaboration with a CS/ML lab that already has TGN infrastructure. Your contribution is the biological insight and data; their contribution is the engineering.

---

### Network Motifs — Fast win with good storytelling value

**Why it's underrated in the scoring:**

The graduation risk is medium, but the analysis itself (finding recurring 3–5 cell spatial configurations that are enriched in AD vs. CN, or in specific Braak stages) can be done with existing tools (networkx.graphlets, orca). The storytelling value is high — "the tissue has recurring spatial 'words' like sentences in a language, and AD changes the vocabulary" is memorable.

**Best framing:** Start as a section of the flagship paper ("Spatial cell arrangement motifs in AD"), and if the results are compelling, spin out into a standalone methods paper. No need to over-commit upfront.

---

## Prioritization Decision Tree

```
GRADUATING NOVEMBER 2026?
│
├─── YES (current situation)
│     │
│     ├─ Paper budget: 1 additional → EEF2 Efficiency Methods (zero grad risk)
│     │                                 OR Tissue Assortativity (zero grad risk)
│     │                                 PICK BASED ON: efficiency paper if you want methods identity;
│     │                                               assortativity if you want biomarker identity
│     │
│     ├─ Paper budget: 2 additional → Add SIR Epidemic Model
│     │                               (start AFTER flagship pipeline is running, ~June 2026)
│     │
│     └─ Paper budget: 3 additional → Add CONCORD SAE interpretability
│                                     (requires PyTorch fluency first, start ~July 2026)
│
└─── POST-GRADUATION (2027+)
      │
      ├─ Priority 1: VEN / FTD paper — your unique data, no one else can do this
      ├─ Priority 2: Spatial PageRank / Influence Max — highest therapeutic impact
      ├─ Priority 3: Temporal Graph Networks — most technically ambitious
      └─ Priority 4: Network Motifs — easiest to collaborate on or assign to a rotation student
```

---

## The Learning Curve Honest Assessment

Given your current skill set (strong Python, scanpy, some R; needs PyTorch):

| Paper | New tools required | Time to learn | OK before graduation? |
|---|---|---|---|
| EEF2 Efficiency | statsmodels, PyMC (optional) | 1 week | ✅ Yes |
| Tissue Assortativity | networkx (you likely know it) | 1 day | ✅ Yes |
| SIR Epidemic Model | networkx + scipy.optimize | 2–3 weeks | ✅ Yes |
| CONCORD SAE | PyTorch, autoencoder design | 2–3 months | ⚠️ Risky |
| VEN / FTD | None beyond flagship | N/A | ⚠️ Data requires more annotation |
| Spatial PageRank + Influence Max | networkx + PyTorch Geometric | 3–4 months | ❌ Post-graduation |
| Temporal Graph Networks | PyTorch + TGN codebase | 4–6 months | ❌ Post-graduation |

---

## Critical Assumptions to Question

Before committing to any of these, question the following:

**On the SIR model:**
> The assumption that Braak-stage cross-patient data represents temporal progression is not validated. Two patients at Braak II are not the same as one patient followed from Braak I to Braak III. You are treating a cross-sectional dataset as a longitudinal one. This is the Achilles heel of the SIR paper. The response: this assumption is stated explicitly, tested with sensitivity analysis, and is the same assumption made by every pseudotime method in scRNA (Monocle, Palantir). It is accepted by the field with the caveat that longitudinal validation is future work.

**On assortativity:**
> The assumption that spatial proximity in a 2D tissue section reflects physiological cell-cell interaction is imperfect. You are measuring 2D adjacency from a 3D tissue. Cells that appear adjacent in a section may be far apart in 3D. This affects assortativity calculations. Response: acknowledge this; compute assortativity at multiple radius cutoffs and show the signal is robust. Use the 3D z-coordinate from seqFISH (you have 5 z-slices) to partially correct.

**On EEF2 as efficiency proxy:**
> The assumption that EEF2 expression is constant across cell types (i.e., all variation in EEF2 detection = efficiency, not biology) is testable but not proven. EEF2 is a translation elongation factor — its expression DOES vary with protein synthesis rate, which differs by cell type and metabolic state. A neuron making lots of protein will have more EEF2 mRNA than a quiescent oligodendrocyte precursor, and this is biology not technical variation. Response: this is why efficiency_residual (after cell-type correction) is the right metric, not raw EEF2 counts. The regression model (cell type as covariate) explicitly separates biological from technical EEF2 variation. This IS the methods contribution.

**On the whole social network framing:**
> The mapping between social networks and tissue biology is mathematically valid but editorially risky at some journals (reviewers may see it as a cute analogy, not a scientific advance). The response: never lead with "social network algorithms." Lead with the biological question and the mathematical approach. The fact that the same approach was developed for Facebook is context, not the main claim. Nature Neuroscience reviewers care about neuroscience; methods reviewers care about the algorithm. Frame accordingly.
