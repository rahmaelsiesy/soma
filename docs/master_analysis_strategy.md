# Master Analysis Strategy: seqFISH Spatial Transcriptomics of Human Alzheimer's Disease Brain
## Caltech `spatialpy` Pipeline — Comprehensive Methods and Hypotheses

**Study Design:** ~10 AD donors + ~10 CN donors per region; 3 regions: frontal insular cortex (FIC), dorsolateral prefrontal cortex (DLPFC), dentate gyrus/hippocampus (DG/HC). Platform: seqFISH (single-molecule, subcellular resolution). Pipeline: `spatialpy`.

---

## Part 1: Biological Hypotheses → Questions for Spatial Data

### 1.1 Vascular Niche: BBB Breakdown, Pericyte Loss, Perivascular Macrophages

#### What the Literature Robustly Reports

Pericyte loss is the most transcriptomically perturbed vascular cell type in AD. Bhatt et al. (*Nat Commun* 2024) identified pericytic **SMAD3** upregulation and astrocytic **VEGFA** downregulation as a BBB signaling disruption validated by RNAscope and iPSC assays. Bubnys, Mathys et al. (*Nat Neurosci* 2023) profiled 22,514 cerebrovascular cells from 428 individuals and found venous and capillary endothelial cells show the largest transcriptomic disruption in AD, with loss of the BBB transcriptional program (CLDN5, FLT1, PECAM1). Sankowski et al. (*Nat Neurosci* 2023) used smFISH to demonstrate that SPP1 mRNA is expressed almost exclusively by CD163+/CD206+ perivascular macrophages (PVMs) adjacent to hippocampal vasculature in AD — a signal invisible to dissociated single-cell preparations, making spatial detection critical. PVM-derived SPP1 drives microglial phagocytic states via C1qa, Grn, Ctsb upregulation.

#### Underexplored / Contested

Whether BBB breakdown is spatially *causal* or *consequential* to amyloid deposition is unresolved at cellular resolution in human tissue. The ANGPTL/CD99 vascular-astrocyte axis identified by Bhatt et al. (*Nat Genet* 2024) has not been independently validated at seqFISH resolution. SLC2A1 (GLUT1) spatial downregulation as a BBB integrity metric in human seqFISH is untested. PVM spatial heterogeneity across FIC, DLPFC, and hippocampus is uncharacterized.

#### Precise Scientific Question

**Do pericytes (PDGFRB+, RGS5+) show reduced spatial density per vessel length in AD, and do PVMs (CD163+, SPP1+) show perivascular spatial enrichment with simultaneous microglial C1qa upregulation within 50 µm of SPP1+ cells — and is this relationship more pronounced in hippocampus than cortex?**

#### Testable Hypotheses

- **H₀:** PDGFRB+ cell density per CLDN5+ vessel segment does not differ between AD and CN, and SPP1 expression is not enriched within 20 µm of vessel boundaries versus distal regions.
- **H₁ (primary):** PDGFRB+ cells are significantly fewer per vessel length in AD (measured by bivariate K-function at r = 15 µm between PDGFRB+ and CLDN5+ cells); SPP1+ cells are enriched within 20 µm of vessel walls (log-odds ratio > 0, LGCP-derived); C1qa expression in microglia within 50 µm of SPP1+ PVMs is elevated relative to microglia > 100 µm from any SPP1+ cell.
- **H₁ (regional):** The magnitude of pericyte loss (PDGFRB+ density ratio AD/CN) is greater in DG/HC than in DLPFC or FIC, consistent with hippocampal vascular vulnerability preceding cortical BBB disruption.

**Key genes:** PDGFRB, RGS5, CLDN5, SLC2A1, FN1, PECAM1, CD163, SPP1, SMAD3, ABCC9

**Expected positive result:** PDGFRB+ cell density < 0.5 cells per 100 µm vessel length in AD versus ≥ 1.0 in CN; bivariate Ripley's K(r=20 µm) between SPP1+ and CLDN5+ cells significantly exceeds CSR null; C1qa expression in perivascular microglia 2–3× that of distal microglia.

**Expected null result:** PDGFRB and CLDN5 expression preserved at vessels; SPP1 diffusely expressed without perivascular enrichment — consistent with late-stage BBB disruption being post-transcriptional or occurring below detection threshold.

---

### 1.2 Amyloid Plaque Microenvironment: DAM, Reactive Astrocytes, Dystrophic Neurites

#### What the Literature Robustly Reports

Johnston et al. (*Res Square* 2023, MERFISH 5xFAD + Trem2R47H) quantified that 62.6% of nearest cells to plaques are microglia; microglia density is 2.25× higher within 100 µm versus 100–500 µm (p < 0.001), and DAM genes (CSF1, APOE, CST7) increase as a continuous function of decreasing plaque distance. Chen et al. (*GSE152506* 2020) defined 57 plaque-induced genes (PIGs) within 100 µm, with the OLIG network among the *earliest* plaque-responsive genes before complement/inflammation fully activates. SERPINA3+ reactive astrocytes are specifically enriched near neuritic plaques (not diffuse) in human Visium data (Karaahmet et al. *bioRxiv* 2024). The effective transcriptional radius of influence is **50–150 µm**, with the strongest effects at < 50 µm.

#### Underexplored / Contested

No human seqFISH study has measured dystrophic neurite genes (MAPT, NEFL, SCG2) as a spatially continuous function of plaque distance. Whether the microenvironment around neuritic plaques differs from diffuse plaques has been examined only by Bhatt et al. at Visium resolution (insufficient for single-cell spatial inference). TREM2-low homeostatic microglia spatial niches relative to plaques are not characterized at cellular resolution in human tissue.

#### Precise Scientific Question

**Does microglial DAM module score (TREM2, LPL, CST7, APOE) decrease monotonically with distance from amyloid plaque-proximal zones (0–50, 50–150, > 150 µm bins), and do SERPINA3+ reactive astrocytes co-cluster with DAM microglia at plaque sites, with the spatial relationship modulated by APOE4 carrier status?**

#### Testable Hypotheses

- **H₀:** DAM module score in microglia does not differ across distance bins from plaque-proximal zones; Moran's I for DAM score is not significantly > 0.
- **H₁ (dose-response):** Mean DAM score in the 0–50 µm bin exceeds the 50–150 µm bin by > 0.5 SD, which in turn exceeds the > 150 µm bin; this gradient is replicable in ≥ 8/10 AD samples.
- **H₁ (astrocyte co-clustering):** SERPINA3+ astrocytes are enriched within 100 µm of high-DAM microglial clusters (bivariate Ripley's K at r = 100 µm > CSR null; FDR < 0.05 after spatial permutation); this enrichment is absent in CN samples.
- **H₁ (APOE4 modification):** In APOE4-carrier AD samples, DAM score enrichment near plaque zones is stronger but spatially broader (larger Matérn correlation length-scale estimated by nnSVG), consistent with altered TREM2-APOE4 lipid handling.

**Key genes:** TREM2, LPL, CST7, SPP1, APOE, ITGAX, CLEC7A, P2RY12, TMEM119, SERPINA3, GFAP, C4b, CLU, CSF1

**Expected positive result:** DAM score decreases monotonically across bins in > 8/10 AD samples; SERPINA3 expression in astrocytes is elevated within 100 µm of DAM cluster centroids; bivariate K confirms non-random DAM-astrocyte co-clustering.

**Expected null result:** DAM microglia uniformly distributed without plaque-proximity enrichment in human tissue — would challenge the amyloid-centric DAM model in human brain and suggest the mouse model findings do not transfer.

---

### 1.3 Neuroinflammation Spatial Domains: Disease Hotspots

#### What the Literature Robustly Reports

Spatial transcriptomics clustering of 5xFAD mouse brain identifies a white matter cluster (Cluster 5) with early DAM/WAM enrichment and gray matter clusters with high DAM/DAA scores at late stage (Choi et al. *Nature* 2023). In human Visium data, spots annotated to L3/L4 show the most substantial downregulation, while glial-enriched spots show upregulation. In MERFISH data, the proportion of plaque-proximal cells that are microglia is 62.6%, with microglia-astrocyte co-activation constituting the primary "inflamed hotspot" unit. SPP1 perivascular restriction data (Sankowski et al. 2023) suggests that vascular proximity seeds early neuroinflammatory hotspots.

#### Underexplored / Contested

Whether spatially discrete, statistically bounded neuroinflammatory hotspots are a consistent feature across multiple *human* AD samples — not demonstrated with N sufficient for inference. Whether hotspots are primarily near vasculature versus near plaques is not resolved. Whether these domains correspond to the "severe subgroup" (hyper-progressors) in SEA-AD is unknown.

#### Precise Scientific Question

**Are there spatially discrete neuroinflammatory hotspots in AD cortex — defined as zones where DAM score, reactive astrocyte score (GFAP, C3, SERPINA3), and complement expression (C1qa, C4b) are simultaneously elevated — and do these hotspots preferentially associate with vasculature (CLDN5+) or plaque-proximal zones (high-DAM density)?**

#### Testable Hypotheses

- **H₀ (null):** DAM and reactive astrocyte scores vary continuously across tissue without spatial clustering; Moran's I for the composite neuroinflammation score is not significant.
- **H₁ (plaque-driven hotspots):** DBSCAN or LGCP applied to the composite neuroinflammation score identifies 3–8 statistically significant spatial clusters per AD section; cluster centroids are significantly closer to high-DAM zones than expected by spatial permutation (p < 0.05).
- **H₁ (vascular co-association):** A significant fraction (> 50%) of identified hotspot centroids are within 50 µm of a CLDN5+ cell, above the frequency expected by random hotspot placement across the tissue.
- **H₁ (progression-linked):** Number of hotspots per section and hotspot composite score correlates positively with CPS/Braak stage across the 10 AD samples (Spearman ρ > 0.5).

**Key genes:** ITGAX, CD68, CLEC7A, CST7, C1qa, GFAP, SERPINA3, C3, CLU, CXCL10, CLDN5

**Expected positive result:** 3–8 discrete hotspots per AD section; hotspot proximity to vessels and DAM zones is non-random; hotspot number scales with disease severity.

**Expected null result:** No discrete hotspots; inflammation is a bulk tissue effect distributed across all cortical layers without spatial concentration.

---

### 1.4 Neuronal Vulnerability Gradients: Layer-Specific Loss and Interneuron Depletion

#### What the Literature Robustly Reports

L2/3 IT (Intratelencephalic) excitatory neurons are the most vulnerable in late AD: SEA-AD MERFISH (Gabitto et al. *Nat Neurosci* 2024) confirms these are localized to supragranular layers 2–3 in middle temporal gyrus. CUX2+/RORB+ co-expressing neurons are selectively vulnerable across multiple snRNA-seq datasets. SST interneurons are the earliest and most robustly depleted inhibitory subtype, with loss beginning at CPS 0.4–0.6 (early phase) confirmed by MERFISH (correlation = 0.84 with snRNA-seq). Mathys et al. (*Cell* 2023) identified a coordinated upregulation of cohesin complex (SMC1A, SMC3) and DNA damage response (BRCA1, ATM) in CUX2+ excitatory neurons in AD, across 427 donors. Green et al. (*Nature* 2024) identified EC-specific RELN+ L2 neurons and CA1 hippocampal neurons as the earliest depleted populations across 6 brain regions.

#### Underexplored / Contested

Whether L5 excitatory neurons are more or less vulnerable than L2/3 IT neurons depends on brain region and disease stage. Whether SST+ spatial depletion co-occurs with local E/I imbalance (measured by CUX2+ excitatory neuron stress in the same spatial zone) has not been directly mapped. The spatial gradient of RELN+ neuron depletion across EC → hippocampus → neocortex is proposed but not demonstrated in human seqFISH at population scale.

#### Precise Scientific Question

**Is there a detectable layer-specific reduction in CUX2+/RORB+ excitatory neuron density and SST+ interneuron density in supragranular layers (L2–L3) of AD relative to CN, and does SST+ depletion spatially co-occur with elevated CUX2+ neuronal stress signatures (SMC1A, ATM upregulation; NRXN1, SYP downregulation) within the same spatial domains, suggesting local E/I circuit disruption?**

#### Testable Hypotheses

- **H₀:** CUX2+ cell density in L2–L3 does not differ between AD and CN; SST+ density does not differ across layers or conditions.
- **H₁ (layer-specific depletion):** CUX2+ cell density in L2–L3 is reduced by ≥ 30% in high-Braak AD samples relative to CN; SST+ density in L2–L3 is reduced ≥ 25%; this depletion is greater in L2–L3 than L5–L6 (interaction effect).
- **H₁ (spatial E/I co-disruption):** In spatial bins where SST+ density is below the CN 25th percentile, CUX2+ neurons show significantly higher SMC1A + ATM module score and lower NRXN1 + SYP module score, measured by spatial mixed-effects model with random intercept per donor.
- **H₁ (EC/HC gradient):** RELN+ cell density shows greater depletion in DG/HC sections than in FIC/DLPFC sections for the same Braak stage (region × condition interaction in pseudobulk mixed model).

**Key genes:** CUX2, RORB, EYA4, RELN, TOX3, FIBCD1, NRXN1, SYP, SMC1A, BRCA1, KCNIP4, SST, PVALB, VIP, CORT, GAD1, GAD2

**Expected positive result:** CUX2+ depletion in L2–L3 confirmed in ≥ 7/10 AD samples; spatial zones of SST+ loss overlap with zones of CUX2+ neuronal stress; EC/HC shows earlier/stronger depletion than cortex.

**Expected null result:** Cell densities preserved numerically but transcriptional stress signature present — indicates early molecular vulnerability before cell death, still biologically significant.

---

### 1.5 Oligodendrocyte/Myelin Spatial Changes

#### What the Literature Robustly Reports

Choi et al. (*Nature* 2023, 5xFAD Visium) showed that white matter shows the largest number of DEGs at 3 months — before gray matter plaque accumulation — including early glial activation and myelin gene dysregulation. Disease-associated oligodendrocytes (DAOs) expressing MOL2 signature + Alzheimer risk genes (C4b, APOE, CD74) emerge from MOL2 mature oligodendrocytes in both 5xFAD and human AD brains (Na et al. *Nat Commun* 2023). Three DA-OL states (DA1 immune-regulatory, DA2, IFN-OL) are identified across AD and MS models; DA1 persists and invades lesion sites. OPC numbers increase at early CPS (remyelination attempt) then are depleted at late stage in SEA-AD.

#### Underexplored / Contested

Spatial distribution of DAOs in human AD cortex — whether perivascular, WM-GM boundary, or diffuse — is not established in seqFISH. MFOL versus MOL spatial segregation under AD conditions is not mapped in human spatial data. The relationship between WAM-mediated myelin debris clearance and OPC response zones is untested.

#### Precise Scientific Question

**Is there white matter enrichment of an early DAM/WAM-like signature (APOE, B2M, SPP1) in low-Braak AD samples, and do DAO-marker-expressing oligodendrocytes (C4b+, APOE+, OPALIN-low) accumulate at WM-GM boundaries in AD cortex relative to CN, preceding gray matter neuroinflammation?**

#### Testable Hypotheses

- **H₀:** OL subtype composition in WM versus GM does not differ between AD and CN; C4b/APOE expression in oligodendrocytes is not spatially enriched at WM-GM boundaries.
- **H₁ (early WM disruption):** In samples with Braak stage ≤ III, WM oligodendrocytes show significantly higher DAO module score (C4b + APOE + CD74) than GM oligodendrocytes (paired t-test within donor); OPALIN expression is reduced in WM adjacent to the WM-GM boundary relative to WM core.
- **H₁ (OPC remyelination):** OPC density (PDGFRA+, SOX10+ cells) in WM is elevated in early AD (Braak I–III) and reduced in late AD (Braak V–VI) relative to CN — a non-monotonic trajectory requiring stratification by CPS proxy.

**Key genes:** MBP, OPALIN, PLP1, CNP, MOG, MAG, PDGFRA, SOX10, DSCAM, C4b, APOE, CD74, CLDN11, UGT8

---

### 1.6 Lipid/APOE Metabolism Niches

#### What the Literature Robustly Reports

APOE is the most abundantly expressed AD risk gene in microglia and astrocytes, with spatial enrichment near plaques (Johnston et al. 2023). CLU is upregulated in DAA astrocytes near plaques in both mouse and human data (Chen 2020, Johnston 2023). TREM2-APOE interaction is spatially regulated: DAM2 microglia co-express TREM2 and APOE at plaque sites; APOE4 status modifies this (higher binding affinity). Astrocyte choline/polyamine metabolism genes are associated with cognitive resilience (Green et al. *Nature* 2024), potentially occupying a spatially distinct niche from GFAP+ reactive astrocytes. LDAM (lipid droplet-associated microglia, PLIN2+/PLIN3+) represent a distinct population from TREM2-high DAM with phagocytosis dysfunction.

#### Precise Scientific Question

**Do APOE-high microglia and APOE-high astrocytes co-localize in a shared spatial niche near plaque-dense zones, and do CLU+ astrocytes show spatial anti-correlation with C3+/SERPINA3+ reactive astrocytes, suggesting a spatial partition between pro-resolution lipid-handling (CLU+) and pro-inflammatory (C3+) astrocyte programs?**

#### Testable Hypotheses

- **H₀:** APOE expression in microglia and astrocytes shows no spatial co-enrichment; CLU and SERPINA3/C3 expression in astrocytes are not spatially anti-correlated.
- **H₁ (APOE niche):** Bivariate Moran's I between APOE expression in microglia and astrocytes is significantly positive (I > 0, FDR < 0.05); both are enriched near high-DAM zones at the same spatial scale (Matérn range estimate consistent between the two cell types).
- **H₁ (astrocyte partition):** Bivariate spatial cross-correlation function between CLU expression and SERPINA3 expression in astrocytes is significantly negative at r < 100 µm — CLU-high zones are SERPINA3-low and vice versa, indicating spatial segregation of the two reactive programs.

**Key genes:** APOE, CLU, ABCA7, ABCA1, TREM2, LPL, SORL1, LDLR, NPC1, PLIN2, PLIN3, HMGCR

---

### 1.7 Cell-Cell Communication in Disease Microenvironments

#### What the Literature Robustly Reports

Sankowski et al. (*Nat Neurosci* 2023) validated spatially that PVM-derived SPP1 (within 20 µm of vessels) binds microglial CD44/ITGAV, inducing C1qa upregulation and synapse elimination. TGFβ signaling to microglia/PVM is downregulated to ~60% of control levels in AD (Yu et al. *BMC Neurosci* 2024), disrupting homeostatic microglia maintenance. CX3CL1-CX3CR1 is downregulated in AD, potentially contributing to aberrant synaptic pruning. WNT pathway signaling from endothelial cells to neurons is downregulated in AD (Bhatt et al. *Nat Genet* 2024).

#### Underexplored / Contested

Ephrin signaling in spatial AD data has not been addressed. CXCL10-CXCR3 chemokine signaling in AD spatial context is underexplored. Most CCC analyses use bulk ligand-receptor scoring without accounting for exact cell positions; seqFISH enables true proximity-constrained CCC inference.

#### Precise Scientific Question

**Which ligand-receptor pairs (SPP1→CD44, C3→C3AR1, TGFB1→TGFBR2, CX3CL1→CX3CR1) show statistically significant spatial proximity signatures — where ligand-expressing sender cells and receptor-expressing receiver cells are closer than expected by chance — and are these proximity signatures disrupted in AD relative to CN?**

#### Testable Hypotheses

- **H₀ (SPP1→C1qa):** SPP1+ cells are not closer to C1qa+ microglia than expected by spatial permutation null; C1qa expression in microglia does not decrease as a function of distance from SPP1+ cells.
- **H₁ (SPP1→C1qa):** Nearest-neighbor distance from SPP1+ PVMs to C1qa+ microglia is significantly shorter in AD than CN (Wilcoxon at donor level, FDR < 0.05); LGCP-estimated SPP1 intensity field peaks within 20 µm of CLDN5+ vessels in AD.
- **H₁ (TGFβ disruption):** TGFB1 expression in homeostatic (P2RY12+) microglia is spatially auto-correlated with TMEM119 expression in surrounding cells (Moran's I > 0) in CN; this spatial correlation is lost or weakened in AD (permutation test on difference in Moran's I, FDR < 0.05).

**Key genes:** SPP1, CD44, ITGAV, C1qa, C3, C3AR1, TGFB1, TGFBR2, CX3CL1, CX3CR1, WNT5A, FZD4, CXCL10, CXCR3

---

## Part 2: Cross-Field Spatial Analysis Methods — What to Use and Why

### Priority Tier 1: Must-Do (Core Spatial Analyses)

#### 2.1 Ripley's K/L Functions and Bivariate K for Cell-Type Co-localization

**What it does mathematically:** Ripley's K(r) is defined as \( \hat{K}(r) = \frac{|A|}{n^2} \sum_{i \neq j} \mathbf{1}(d_{ij} \leq r) \cdot w_{ij}^{-1} \), where \( |A| \) is tissue area, n is cell count, \( d_{ij} \) is the distance between cells i and j, and \( w_{ij}^{-1} \) is an edge-correction weight. The normalized L(r) = √(K(r)/π) - r has a null value of zero under complete spatial randomness (CSR). The bivariate version \( K_{12}(r) \) substitutes two cell types; positive deviation from zero indicates co-clustering.

**Why it is better than naive approaches:** A naive count of "proportion of microglia near plaques" is sensitive to overall cell density and tissue area. K(r) formally accounts for edge effects, normalizes for density, and provides a full profile across distance scales r. KAMP (Wrobel & Song 2024) extends K to handle unequal cell densities across white and gray matter — a critical correction for human brain data where WM has far fewer cells per unit area.

**Application to AD seqFISH:** Use bivariate K(TREM2+, CLDN5+) to ask whether DAM microglia are clustered near vasculature. Use bivariate K(DAM, astrocyte) to ask whether reactive astrocytes co-cluster with DAM microglia within 100 µm. Compare L(r) curves between AD and CN at each r, with spatial permutation tests (permuting cell-type labels within donor, 999 iterations) to generate null distributions. Report K(100 µm) as the primary test statistic for plaque microenvironment hypotheses.

**Software:** `spatstat` (R) for K, L, G, bivariate functions; KAMP (arXiv 2412.08498) for density-corrected K; MERINGUE (R, Miller et al. *Genome Research* 2021) for seqFISH-scale spatial cross-correlation. MERINGUE was specifically applied to MERFISH/seqFISH data in mouse and human tissue.

**Limitations:** K(r) is a global summary — it cannot identify which *specific spatial locations* show clustering, only whether clustering occurs somewhere in the tissue. It assumes stationarity (spatial homogeneity of the process), which is violated when comparing WM versus GM. Use domain-specific K (computed within annotated cortical layers) to mitigate this. K does not model uncertainty in the intensity field.

---

#### 2.2 Log-Gaussian Cox Process (LGCP) for Spatial Intensity Field Estimation

**What it does mathematically:** An LGCP models cell positions as a Poisson process with a spatially varying intensity function \( \lambda(\mathbf{s}) \) that is itself a realization of a log-Gaussian field: \( \log \lambda(\mathbf{s}) \sim \mathcal{GP}(m(\mathbf{s}), C(\mathbf{s}, \mathbf{s}')) \), where C is typically a Matérn covariance kernel with range parameter ρ and variance σ². The SPDE (stochastic partial differential equation) approximation allows fitting via INLA in O(n log n) time.

**Why it is better than kernel density estimation (KDE):** KDE produces a single point estimate of the intensity surface with no uncertainty. LGCP provides a *posterior distribution* over the intensity surface, quantifies uncertainty in where DAM clusters are located, and can formally test whether spatial correlation in the intensity field is greater in AD than CN by comparing posterior distributions of σ² and ρ. LGCP also handles the spatial correlation in the intensity field itself — not just correlation between individual cells.

**Application to AD seqFISH:** Fit separate LGCPs to DAM microglial positions in each AD and CN section. Extract: (1) the posterior mean intensity surface — where are microglial hotspots? (2) Matérn range parameter ρ — what is the spatial scale of microglial clustering? (3) σ² — how strong is spatial clustering relative to a uniform Poisson process? Compare AD versus CN using the posterior distributions of ρ and σ². Thomas cluster processes can additionally model each plaque as a parent point, with microglia as offspring, estimating plaque density and offspring spread jointly.

**Software:** `stelfi` (R/CRAN, Jones-Todd & van Helsdingen 2024) for LGCP and Hawkes models via TMB. R-INLA + `inlabru` for Bayesian LGCP via SPDE. `spatstat::lgcp` for basic fitting. Wang et al. (2025) demonstrated BayesFlow (invertible neural networks) for likelihood-free Bayesian LGCP inference on 2D biological imaging data directly analogous to seqFISH.

**Limitations:** LGCP assumes the intensity field is stationary within the fitting region — apply within annotated spatial domains, not across the whole tissue simultaneously. Fitting is slow for very large seqFISH datasets (millions of cells); use the fast variational approximation of Dovers (2023) for scalability.

---

#### 2.3 Spatially Variable Gene Detection: nnSVG vs. SPARK-X vs. SpatialDE2

**What each does:** All three test whether a gene's expression pattern across cell positions is more spatially structured than expected by chance, using GP covariance kernels as the model for spatial structure.

**Why nnSVG wins for seqFISH (Weber et al. *Nat Commun* 2023):** nnSVG uses nearest-neighbor Gaussian processes (NNGP), approximating the full GP covariance by conditioning on k nearest neighbors. This gives three critical advantages over alternatives: (1) **gene-specific length-scale estimation** — the spatial scale at which each gene is variable (e.g., TREM2 varies at the 50 µm plaque-microenvironment scale while OPALIN varies at the 500 µm layer scale) is estimated separately per gene, not imposed globally; (2) **scales to single-molecule seqFISH data** with millions of cells; (3) enables SVG detection **within spatial domains** (e.g., SVGs specifically within the DAM-enriched niche), not only globally.

SPARK-X (Zhu, Sun & Zhou *Genome Biology* 2021) is faster but uses a fixed kernel set and does not estimate gene-specific length scales. SpatialDE2 (Velten et al.) models spatially varying coefficients and is appropriate for decomposing SVG patterns into cell-type compositional effects. Use SpatialDE2 as a secondary tool to ask whether a gene is spatially variable *beyond* what is explained by cell-type composition changes.

STANCE (Su et al. *bioRxiv* 2024) detects **cell-type-specific SVGs** — essential for finding genes spatially variable only within DAM microglia, not across all cells.

**Application to AD seqFISH:** Run nnSVG separately in each section, then use DESpace (Tiberi & Robinson *Bioinformatics* 2024) for multi-sample aggregation — DESpace jointly models biological replicates and identifies spatial domains driving variability across samples, addressing the multi-donor design. The Matérn length-scale parameter from nnSVG provides an interpretable metric: if the length-scale of TREM2 SVG is shorter in AD than CN, the DAM spatial signature is more locally concentrated (near plaques), consistent with amyloid-centric activation. Compare length-scale distributions between AD and CN using posterior credible intervals.

**Software:** `nnSVG` (Bioconductor), `SPARK` (CRAN), `DESpace` (Bioconductor/CRAN), `STANCE` (GitHub).

**Limitations:** SVG methods identify spatial variability but do not localize *where* in the tissue it occurs — combine with LGCP or domain annotation for localization. SVG methods assume a single type of spatial pattern (e.g., smooth gradient); genes with sharp boundaries or multi-scale patterns may be missed.

---

#### 2.4 Pseudobulk Mixed-Effects DEG Testing for N=10

**Why naive Wilcoxon is wrong:** Treating each cell as an independent observation creates pseudoreplication. With ~10,000 microglia per section and N=10 donors per group, the effective n for a cell-level test approaches 100,000 when it should be 10. This inflates the test statistic by a factor of √(n_cells/n_donors) ≈ 31×, producing systematically anti-conservative p-values. Zimmerman et al. (*Nat Commun* 2021) documented this rigorously; Crowell et al. (*Nat Commun* 2020, muscat) benchmarked alternatives and confirmed that pseudobulk is the appropriate default.

**The pseudobulk model:** Aggregate transcript counts per (donor × cell-type) group, yielding a count matrix of shape (n_samples × n_celltypes) × n_genes. Then fit a negative binomial generalized linear model:

\[ \log \mu_{ij} = \beta_0 + \beta_1 \cdot \text{condition}_i + \log(\text{library size}_{ij}) \]

using DESeq2 or edgeR. This treats each donor as a single observation. With N=10 per group the statistical power is limited, but the type-I error is properly controlled.

**The muscat implementation:** The `muscat` R package implements pseudobulk DEG for multi-sample, multi-condition single-cell data with explicit support for spatial cell-type assignments. Use `pbDS` (pseudobulk differential state) with edgeR for cell-type-specific DEG across AD versus CN.

**When it breaks:** If fewer than ~20 cells of a given type are present in a sample, the pseudobulk sum is too noisy to estimate NB dispersion reliably. For rare cell types (e.g., LDAM), use compositional analysis (Milo, described below) instead of DEG testing.

**Software:** `muscat` (Bioconductor), `DESeq2`, `edgeR`. For spatial transcriptomics specifically, see Ospina et al. (*Sci Reports* 2024) for the spatial LME extension (Section 3.4).

**Limitations:** Pseudobulk discards within-sample spatial information entirely. For spatial hypotheses, within-sample spatial contrasts (Section 3.3) are more powerful because they remove donor-level variance.

---

#### 2.5 Spatial Neighborhood Analysis: BANKSY vs. concordex vs. Milo

**BANKSY** (Singhal et al. 2024) augments each cell's expression vector with a spatial neighborhood expression average, then clusters on the combined feature space. This enforces spatial smoothness on cluster boundaries. Use BANKSY for cortical layer annotation and domain definition where the biological ground truth involves both transcriptional identity and spatial location.

**concordex** (Bhattacharya et al. 2024) is a statistic measuring the concordance between transcriptional neighborhoods and spatial neighborhoods — effectively asking whether cells that are transcriptionally similar are also spatially proximate. Use concordex to assess whether DAM microglia form spatially coherent transcriptional clusters versus scattered individuals.

**Milo** (Dann et al. *Nat Biotechnol* 2022) uses k-nearest neighbor graphs to define local cell neighborhoods, then performs differential abundance testing between conditions using a negative binomial GLM. Critically, Milo preserves the single-cell resolution and provides spatial context when combined with spatial coordinates. Use Milo for: (1) identifying compositional changes in cell-type proportions across AD versus CN (not DEG, but differential abundance); (2) finding which specific cell-state neighborhoods are differentially abundant — e.g., TREM2-high versus TREM2-low microglial neighborhoods. Milo's spatial extension uses spatial graphs rather than transcriptional k-NN.

**When to use each:** Use BANKSY for spatial domain calling; concordex for assessing spatial coherence of cell states; Milo for differential abundance testing of cell states/niches across conditions.

**Software:** `Banksy` (Bioconductor), `concordex` (CRAN/Bioconductor), `miloR` (Bioconductor).

---

#### 2.6 Niche/Microenvironment Detection: SpatialPCA + MENDER + Tensor Decomposition

**SpatialPCA** (Shang & Zhou *Nat Commun* 2022) extracts low-dimensional spatial embeddings via a GP prior that enforces smooth spatial variation. It enables trajectory inference on tissue (e.g., ordered spatial gradient from deep WM through cortical layers to L1), UMAP visualization of spatial domains, and pseudo-tissue pseudo-time analysis. Apply SpatialPCA to identify the continuous spatial gradient from white matter through cortical laminae in each section, then use this embedding as a covariate in downstream spatial models.

**MENDER** (Yuan *Nat Commun* 2024) identifies spatial domains via multi-scale neighborhood representations, scales to millions of cells, and specifically improved discovery of previously overlooked brain domains in aging data. Run MENDER as the primary domain-calling algorithm for large seqFISH sections where BANKSY is too slow.

**Tensor decomposition for multi-sample spatial analysis:** For multi-donor data (10 AD + 10 CN per region), represent each sample as a spatial expression tensor (cells × genes × spatial_coordinates), then apply non-negative tensor factorization (NTF) or coupled matrix-tensor factorization to identify spatial gene expression factors that are shared across samples. This extracts the consistent spatial patterns from noisy single-sample data. Implemented in `scNTF` (Python) or via custom NTF in `tensortools` or R `rTensor`.

---

### Priority Tier 2: High-Value Methods

#### 2.7 Hawkes Process for Self-Exciting Microglial Activation

**What it does:** A spatially extended Hawkes process models the rate of cellular events (here, microglial DAM transitions) as \( \lambda(\mathbf{s}, t) = \mu(\mathbf{s}) + \sum_{t_i < t} g(||\mathbf{s} - \mathbf{s}_i||) \), where \( \mu(\mathbf{s}) \) is the background rate (baseline microglial density), and g(·) is the triggering kernel modeling how each existing DAM cell increases the probability of DAM transition in nearby microglia. The kernel g is typically exponential: \( g(r) = \alpha e^{-\beta r} \), where α is the triggering magnitude and 1/β is the spatial range.

**Application to AD seqFISH:** Treat DAM microglia (TREM2+, CST7+) as "events" in space. If microglial DAM activation is a locally contagious process — mediated by short-range cytokine signaling (e.g., IL-34, CSF1) — the triggering parameter α will be significantly > 0, and the range 1/β will reflect the signaling radius. Compare the fitted α between AD and CN donors and between plaque-proximal and distal tissue zones. A positive α would indicate that DAM activation is spatially self-exciting (contagion model), not just passively responding to distributed amyloid.

This is a novel application: no published study has applied Hawkes/ETAS models to spatial transcriptomics data. It constitutes a methodological advance that could be a primary contribution of the spatialpy pipeline.

**Software:** `stelfi` (R/CRAN), `ETAS.inlabru` (R, Bayesian via INLA), `spatstat::update.kppm` for Hawkes fitting.

**Limitations:** Hawkes processes require sufficient event density for reliable parameter estimation. If fewer than ~500 DAM cells per section, parameter uncertainty will be large. Use simulation-based power analysis before interpreting fitted parameters. Hawkes processes model *spatial* events but not the underlying amyloid pathology directly — the model is phenomenological.

---

#### 2.8 Persistent Homology / TDA for Spatial Topology

**What it does:** Persistent homology computes topological features (connected components β₀, loops β₁, voids β₂) of a point cloud or scalar field across a range of filtration scales ε. Features that "persist" across many scales ε (long barcodes) are topologically robust signals; short-lived features are noise. This is mathematically equivalent to asking: "what is the shape of the data at multiple scales simultaneously?"

**Application to AD seqFISH:** Benjamin et al. (*Nature* 2024) demonstrated that multiscale topological features of subcellular RNA distributions in seqFISH-like data outperform standard gene count approaches for cell classification. Apply PHD-MS (Beamer & Cang 2025) to identify spatial domains (e.g., plaque microenvironments, cortical layers) without requiring pre-specification of the number of domains. Apply persistent homology to DAM microglial coordinates: β₁ persistence (loops) would indicate that DAM cells form ring-like structures around plaques — a topology invisible to K(r) or LGCP. Limbeck & Rieck (2024) show that Betti curves are more robust than Moran's I and do not require p-value thresholds.

**Software:** `gudhi` (Python, full TDA suite), `TDAstats` (R/CRAN), `STopover` (R, Morse filtration for colocalization), PHD-MS (GitHub, GUI).

**Limitations:** TDA summaries (persistence diagrams, Betti curves) are not directly interpretable as biological quantities without additional mapping. Statistical testing requires permutation methods (computationally expensive). MCIST (Cottrell & Wei *Adv Sci* 2025) combines TDA with GNN and achieves state-of-the-art spatial domain clustering across 37 benchmark datasets — consider as a unified framework rather than TDA alone.

---

#### 2.9 Graph Neural Networks: STAGATE and GraphST

**What they do:** STAGATE (Dong et al. *Nat Commun* 2022) builds a spatial adjacency graph (k-NN on coordinates) and trains an attention-based graph autoencoder to produce a low-dimensional embedding that captures both transcriptional identity and spatial organization. GraphST (Long et al. *Nat Commun* 2023) uses contrastive graph learning. MCIST (2025) is the current state-of-the-art, combining multiscale topological representations with GNN; benchmarked on 37 datasets with > 11% improvement over previous best.

**Application to AD seqFISH:** Use STAGATE or MCIST to define spatial domains across 10 AD + 10 CN sections jointly (using moscot alignment for cross-sample spatial registration first). The learned embedding enables direct comparison of spatial domains across donors. Apply CytoCommunity (Hu et al. *Nat Methods* 2024) for formal statistical comparison of tissue cellular neighborhood compositions between AD and CN — it uses graph pooling and enables group-level niche comparison, critical for multi-donor designs.

**Limitations:** GNN-based methods require hyperparameter tuning (k-NN graph radius, embedding dimension). Their embeddings are not interpretable as specific biological quantities. Computational cost scales with the number of cells and edges.

---

#### 2.10 Optimal Transport (moscot) for Cross-Sample Spatial Alignment

**What it does:** Optimal transport finds the minimum-cost mapping between two probability distributions. In spatial biology, it maps cells from one tissue section to positions in another (or in a reference coordinate system) by minimizing a cost function combining expression dissimilarity and spatial displacement.

**Application to AD seqFISH:** Use moscot (Klein, Palla, Lange et al. *Nature* 2024) for: (1) aligning multiple seqFISH sections from different donors into a common coordinate framework before multi-sample analysis; (2) estimating spatiotemporal trajectories of microglial activation as a function of CPS proxy stage (using `moscot.spatiotemporal`). PASTE2 (Liu, Zeira & Raphael *Genome Research* 2023) enables 3D reconstruction of AD brain architecture from multiple 2D sections using partial fused Gromov-Wasserstein OT, allowing recovery of laminar structure across the z-axis. COMMOT (Cang et al. *Nat Methods* 2023) maps spatial directionality of key ligand-receptor pairs (APOE→TREM2, complement→C1q) in the AD microenvironment using collective OT with spatial distance constraints.

**Software:** `moscot` (Python, pip install moscot), `PASTE2` (Python/PyPI), `COMMOT` (Python).

**Limitations:** OT assumes all cells in one section can be matched to cells in another — violated if sections have substantially different cell-type compositions (e.g., different AD stages). Use partial OT (PASTE2) to relax this assumption. OT-based alignment requires that at least some spatial features are shared across sections.

---

### Priority Tier 3: Exploratory / Novel

#### 2.11 ETAS-Like Hawkes for Tau Spreading

Treat the spatial distribution of tau-associated transcriptional states (MAPT-high, NEFL-high cells) as a branching point process across the Braak stage ordering of the 10 AD samples. Model Braak stage as a "temporal" dimension and the spatial spread of tau-associated signatures as ETAS-like branching from the entorhinal cortex "seed." Fit using `ETAS.inlabru` (R-INLA), treating each AD sample as a different "time" point. The background rate represents the baseline tau-vulnerable neuron distribution; the triggering kernel represents spatial spread of tau pathology. This is methodologically novel and constitutes a primary research contribution.

#### 2.12 Wavelet Decomposition for Multi-Scale Spatial Analysis

Apply Haar wavelet decomposition to spatial gene expression matrices (Xu & Sankaran 2022) to simultaneously decompose expression patterns at cellular scale (~10 µm), niche scale (~50–200 µm), and laminar scale (~500 µm–1 mm). A wavelet energy analysis tests whether AD disrupts laminar gene expression coherence (macro-scale) while preserving local cellular organization, or vice versa. This is orthogonal to GP-based SVG methods and captures oscillatory spatial patterns (e.g., periodic cortical layer structure).

#### 2.13 Bivariate Moran's I for Spatial Co-Expression

Bivariate Moran's I between genes X and Y: \( I_{XY} = \frac{n}{\sum_{ij} w_{ij}} \cdot \frac{\sum_i \sum_j w_{ij} z_{Xi} z_{Yj}}{\sum_i z_{Xi}^2} \), where \( w_{ij} \) are spatial weights and z are standardized expression values. A significantly positive \( I_{XY} \) indicates that high expression of X in one cell is spatially associated with high expression of Y in neighboring cells — identifying trans-cellular spatial co-expression (potential ligand-receptor or co-stimulatory relationships). Apply across all gene pairs in the panel to identify spatially co-expressed pairs that are not captured by single-cell correlation. MERINGUE (Miller et al. 2021) implements this at seqFISH scale.

---

## Part 3: Addressing the Small-N Problem (N ≤ 10 per group)

### 3.1 Why N=10 is a Fundamental Challenge

The nested data structure of seqFISH is a three-level hierarchy: **transcripts → cells → sections → donors → conditions**. Each donor contributes thousands to millions of cells, but the donors are the unit of biological independence. Donor-to-donor variability in AD is substantial: Braak stage ranges from I–VI, APOE genotype varies, co-pathologies (TDP-43, Lewy bodies) occur in a subset, and tissue quality (PMI, fixation) introduces technical variance. Ignoring this structure — treating cells as independent — inflates the effective n by 2–3 orders of magnitude.

For a Gaussian linear model with N=10 donors per group, the realized power at α=0.05 for detecting a standardized effect of d = 0.8 is approximately 0.56 (barely above chance). This requires strategic study design choices that maximize within-sample contrasts and carefully interpret between-sample results.

### 3.2 The Pseudobulk Strategy

For each cell type k in each donor i, sum raw transcript counts:

\[ Y_{gik} = \sum_{c \in \{k, i\}} X_{gic} \]

where \( X_{gic} \) is the count of gene g in cell c. This produces a donor × gene count matrix per cell type, fit by negative binomial DESeq2:

\[ Y_{gik} \sim \text{NB}(\mu_{gik}, \phi_g), \quad \log \mu_{gik} = \beta_{g0} + \beta_{g1} \cdot \text{AD}_i + \log s_{ik} \]

where \( s_{ik} \) is the library size offset. The dispersion \( \phi_g \) is estimated per gene using edgeR's robust empirical Bayes shrinkage. This is the muscat framework (Crowell et al. 2020). When it breaks: if fewer than 20 cells of type k are detected in donor i, the pseudobulk sum is too sparse; use Milo compositional abundance testing instead for rare cell types.

### 3.3 Within-Sample Spatial Contrasts: The Most Powerful Design

For any given AD sample, compare cells **near plaque** (proximal zone, < 100 µm of high-DAM centroid) versus cells **far from plaque** (distal zone, > 300 µm). Because both populations are from the same donor, donor-level confounders (APOE genotype, genetic background, tissue quality) cancel completely. The spatial contrast has far greater power than the between-donor contrast.

Formalize as a paired spatial contrast within each AD donor i:

\[ \Delta_{gi} = \bar{X}_{g, \text{prox}, i} - \bar{X}_{g, \text{dist}, i} \]

Then test H₀: \( \mathbb{E}[\Delta_{gi}] = 0 \) using a one-sample t-test across the 10 AD donors on \( \Delta_{gi} \). This is powered by N=10 paired observations, with within-donor variance serving as the error term. Genes where \( \Delta_{gi} > 0 \) in 9/10 or 10/10 donors are the most reproducible findings.

### 3.4 Linear Mixed-Effects Models for Spatial Data

For global spatial comparisons, use spatial linear mixed-effects models (Ospina et al. *Sci Reports* 2024):

\[ Y_{gc}(\mathbf{s}) = \beta_{g0} + \beta_{g1} \cdot \text{AD}_i + b_{gi} + \omega_g(\mathbf{s}) + \varepsilon_{gc} \]

where \( b_{gi} \sim \mathcal{N}(0, \sigma^2_b) \) is the donor-level random intercept, \( \omega_g(\mathbf{s}) \) is a spatially correlated random effect modeled as a GP with exponential covariance \( C(\mathbf{s}, \mathbf{s}') = \sigma^2_\omega \exp(-||\mathbf{s} - \mathbf{s}'||/\rho) \), and \( \varepsilon_{gc} \sim \mathcal{N}(0, \sigma^2) \) is residual error. Ospina et al. showed that non-spatial models (modeling only \( b_{gi} \)) show severely inflated type-I error even when controlling for donor, because spatial autocorrelation within sections is not captured by a scalar random intercept alone. Fit using `nlme` or `mgcv` (R) for the exponential spatial covariance, or R-INLA for Bayesian estimation.

### 3.5 Cross-Sample Consistency Scoring

For any spatial finding computed in each AD donor (e.g., DAM score enrichment near plaque), report a **consistency score** \( C \) = fraction of donors where the effect is in the expected direction:

\[ C = \frac{1}{N_{AD}} \sum_{i=1}^{N_{AD}} \mathbf{1}(\Delta_{gi} > 0) \]

This is NOT a stringency filter — report all results with their consistency score. A finding with C = 10/10 and a finding with C = 6/10 should both be reported; the C = 6/10 finding may represent a real effect in a subset of donors, potentially linked to disease heterogeneity. For cross-sample comparisons, compute effect sizes in all 10 × 10 AD-CN pairwise combinations and report the distribution of pairwise effect sizes (median, IQR) alongside the group-level test result.

### 3.6 Correlating Inconsistency with Disease Heterogeneity

When some AD samples fail to show a finding: regress the per-donor effect size \( \Delta_{gi} \) against available metadata — Braak stage, CERAD score, MMSE, CPS proxy score (computed from the seqFISH data itself; see Part 6). If donors with low \( \Delta_{gi} \) cluster at low Braak stage, the finding is stage-dependent rather than absent. If they cluster at specific APOE genotypes or PMI values, the finding is confounded. This converts "inconsistency" from a weakness into a discovery about disease heterogeneity.

### 3.7 Bayesian Hierarchical Models

Bayesian hierarchical models are ideal for small N because they implement **partial pooling**: individual donor estimates are shrunk toward the group mean by an amount proportional to their uncertainty. An extreme estimate in one donor (which could be noise) is pulled toward the average; a consistent estimate across donors is reinforced. The model:

\[ \theta_i \sim \mathcal{N}(\mu_\theta, \tau^2), \quad Y_i | \theta_i \sim p(Y | \theta_i) \]

where \( \theta_i \) are donor-specific effect sizes, \( \mu_\theta \) is the group-level mean, and \( \tau^2 \) is inter-donor variance. Posterior distributions on \( \mu_\theta \) and \( \tau^2 \) directly quantify the group-level signal and its across-donor consistency. Use Stan or PyMC for custom hierarchical NB models. For spatial data, scVI's hierarchical VAE framework (Lopez et al. *Nat Methods* 2018) provides a deep generative model with donor-level batch effects as latent variables — use the SCVI spatial extension for seqFISH data.

### 3.8 Power Analysis for Spatial Data

Simulate power as a function of cells per sample per cell type using the following approach:
1. Fit empirical NB parameters (mean, dispersion) from CN data for each gene.
2. Simulate AD data by multiplying the mean by the hypothesized fold-change (e.g., 1.5× for moderately upregulated genes).
3. Apply pseudobulk DESeq2 to the simulated data (varying N_donors from 5 to 20 and N_cells from 20 to 10,000 per donor per cell type).
4. Report power as the fraction of simulations where the gene is detected at FDR < 0.05.

Rule of thumb from existing benchmarks: for a 1.5× fold-change and N=10 donors per group, you need approximately 500+ cells per cell type per donor to achieve 80% power in pseudobulk testing. For rare cell types with < 100 cells per donor, power drops below 40% for 1.5× effects.

---

## Part 4: Probabilistic / Bayesian Modeling for Low-Count Gene Expression

### 4.1 The seqFISH Noise Model

seqFISH decodes transcripts through combinatorial barcode schemes across sequential hybridization rounds. Two primary error sources exist: (1) **false positives** — non-specific probe binding produces spurious transcripts; (2) **false negatives** — missed transcripts due to probe efficiency < 1. Each probe has a detection efficiency \( \eta_g \in (0,1] \), meaning that for a cell with true expression \( \lambda_{gc} \), the observed count \( X_{gc} \) is distributed approximately as \( \text{Binomial}(n = \lambda_{gc}, p = \eta_g) \) plus a Poisson false-positive rate \( \phi \) from non-specific binding. For genes with low true expression (≤ 10 transcripts/cell), the false-positive floor dominates, and apparent expression differences may reflect probe efficiency differences across samples rather than biological signal.

### 4.2 Negative Binomial and Zero-Inflated NB Model for Sparse Counts

For cell-level counts of gene g in cell c: \( X_{gc} \sim \text{NB}(\mu_{gc}, \phi_g) \), with \( \text{Var}(X_{gc}) = \mu_{gc} + \mu_{gc}^2/\phi_g \). The NB is appropriate because biological expression is overdispersed — variance exceeds the Poisson mean due to transcriptional bursting, cell-state heterogeneity, and technical variation. A zero-inflated NB (ZINB) adds a point mass at zero: \( P(X_{gc} = 0) = \pi_{gc} + (1 - \pi_{gc}) \cdot \text{NB}(0; \mu, \phi) \), where \( \pi_{gc} \) is the probability of a structural zero (gene not expressed in this cell, regardless of efficiency). Use ZINB when the fraction of zeros in a cell type × gene combination substantially exceeds what the NB predicts (likelihood ratio test between NB and ZINB).

### 4.3 Bayesian Hierarchical NB Model for Low-Count Genes

For a gene expressed at ≤ 10 transcripts/cell on average, the observed count is a convolution of true expression and detection noise. Model the true expression \( \lambda_{gc} \) as a latent variable:

\[ X_{gc} | \lambda_{gc} \sim \text{Poisson}(\eta_g \cdot \lambda_{gc}) + \text{Poisson}(\phi) \]
\[ \lambda_{gc} \sim \text{Gamma}(\alpha_{g,k}, \beta_{g,k}) \]

where the Gamma prior parameters \( (\alpha_{g,k}, \beta_{g,k}) \) are set by cell type k using single-cell reference data from the Allen Brain Cell Atlas or snRNA-seq from the same cohort. The posterior distribution of \( \lambda_{gc} \) integrates over detection efficiency uncertainty. For cells showing 1–10 counts of gene g in an AD sample: if the prior under CN is \( P(\lambda_{gc} \leq 1) > 0.95 \) (gene nearly unexpressed in CN), then observing 5 counts in 30% of AD cells is either real upregulation or false positives. The posterior predictive p-value — \( P(X \geq 5 | \lambda \sim \text{prior}_\text{CN}, \eta_g, \phi) \) — quantifies the probability of observing the AD data under the CN prior. If this p-value is < 0.05, the upregulation is unlikely to be explained by noise given the probe efficiency.

### 4.4 Detection Efficiency Estimation

Use blank control probes (probes targeting sequences absent from the human genome, included in every seqFISH panel) to estimate the false-positive rate \( \phi \): \( \hat{\phi} = \text{mean transcript density of blank channels} \). Use housekeeping probes (targeting ubiquitously expressed genes such as ACTB, GAPDH, MALAT1 with known high expression) to calibrate probe-specific efficiency \( \hat{\eta}_g \) by comparing observed counts with expected counts from a reference snRNA-seq dataset of the same tissue: \( \hat{\eta}_g = \hat{\mu}_{g}^{\text{seqFISH}} / \mu_g^{\text{reference}} \).

### 4.5 FDR Parameter Justification for seqFISH Decoding

The FDR score in seqFISH decoding (specifically the `spatialpy` decoding step) represents the estimated probability that a decoded transcript is a false positive given its barcode distance to the nearest codebook entry. Lower FDR score corresponds to higher confidence. The dual-axis FDR plot shows on the primary y-axis the FDR (fraction of decoded transcripts likely spurious) and on the secondary y-axis the count score or number of transcripts decoded, both as a function of the decoding threshold. The **elbow point** on this plot — where FDR begins to rise steeply while the transcript count plateaued — is the optimal threshold: it captures the bulk of real transcripts while excluding the high-FDR tail.

**Uniform processing across samples does NOT mean identical parameters.** Different sections may have different autofluorescence, staining efficiency, or signal-to-noise ratios. The correct approach is to **target an equivalent FDR level** (e.g., FDR = 0.05) in each sample independently. Concretely: for each section, find the threshold T such that the estimated FDR at T is ≤ 5%, and apply that T to that section. This produces a different numeric threshold per section but an equivalent biological FDR. Document the per-section threshold values and their associated true positive rates (TPR) — sections with anomalously low TPR at FDR = 5% should be flagged for technical review.

**Propagating FDR uncertainty forward:** Assign each decoded transcript a posterior probability of being real: \( P(\text{real} | \text{score}) = 1 - \text{FDR}(\text{score}) \). For downstream analysis, use these posterior probabilities as weights in a soft-assignment framework rather than hard thresholding. For low-count genes, use the FDR uncertainty explicitly in the Bayesian model (Section 4.3) by substituting \( \eta_g \) with the probe-specific efficiency estimated from housekeeping probes.

### 4.6 Testing Low-Count Gene Activation with scRNA-seq Priors

For gene g with near-zero expression in CN: obtain the Allen Brain Cell Atlas (or published snRNA-seq) distribution of expression across cell types. Set the hierarchical prior on mean expression: \( \mu_g^{\text{prior}} \sim \text{Gamma}(\alpha, \beta) \) fit to the reference distribution. For AD cells, the posterior P(\mu_g^{AD} > \mu_g^{CN} | data) is the Bayesian p-value for upregulation. This approach handles the asymmetric information: high confidence that expression is near-zero in CN (strong prior) versus uncertain low-level expression in AD (weak likelihood from ≤ 10 counts). Genes passing P(\mu_g^{AD} > \mu_g^{CN} | data) > 0.95 and showing biological plausibility (e.g., known AD-relevant function) are candidates for validation by orthogonal methods (RNAscope, multiplexed smFISH).

---

## Part 5: Cross-Region Analysis Framework

### Region-Specific Null Hypotheses

Each brain region has distinct baseline anatomy requiring region-specific null models:

- **FIC (frontal insular cortex):** Six-layer neocortex with prominent Von Economo neurons in L5; baseline DAM enrichment expected to be lower than HC; BBB integrity baseline may be higher.
- **DLPFC:** Classic prefrontal cortex; L3 pyramidal neurons are disease-relevant; SST interneuron density is higher here than FIC; reference for prefrontal pathology studies (most previous snRNA-seq AD work).
- **DG/hippocampus:** Trilaminar (granule cell layer, hilus, molecular layer); highest plaque and tau burden expected at matched Braak stages; no L1–L6 laminar annotation applies — use DG, CA1, CA3 zone annotation instead.

The appropriate null for each region is derived from the CN samples from that specific region, not pooled across regions.

### Analyses Run Identically Across Regions (Same Pipeline, Different Priors)

The following analyses should run identically in each region with region-appropriate priors:
1. Cortical layer / zone annotation (using region-specific marker genes)
2. LGCP fitting to DAM microglia positions
3. nnSVG SVG detection
4. Pseudobulk DEG per cell type (AD vs. CN)
5. Bivariate K-function for DAM-vasculature and DAM-astrocyte co-localization
6. CPS proxy score computation (same gene panel; see Part 6)

### Identifying Region-Universal vs. Region-Specific Results

A finding is **region-universal** if the effect is in the expected direction in all three regions and the cross-region meta-analysis is statistically significant. A finding is **region-specific** if the effect is significant in one or two regions but not all three and the region × condition interaction term is significant. Use a fixed-effects meta-analysis model across the three regions:

\[ \hat{\beta}_{\text{meta}} = \frac{\sum_r w_r \hat{\beta}_r}{\sum_r w_r}, \quad w_r = \frac{1}{SE_r^2} \]

Heterogeneity is assessed by Cochran's Q statistic: \( Q = \sum_r w_r (\hat{\beta}_r - \hat{\beta}_{\text{meta}})^2 \), where Q > χ² with 2 df at p < 0.05 indicates significant region heterogeneity (use random-effects model instead). For spatial findings, report the I² heterogeneity statistic alongside the meta-analytic estimate.

### Statistical Framework for Cross-Region Meta-Analysis

- **Fixed-effects model** (appropriate when assuming the same biological effect in all three regions): use inverse-variance weighting as above.
- **Random-effects model** (appropriate when allowing region-specific effect sizes): use DerSimonian-Laird or REML estimation of between-region variance τ². For spatial findings with fewer than 3 regions, random-effects estimates are unreliable — report fixed-effects results with Q-test heterogeneity assessment.
- For cell-type abundance findings, apply Milo separately per region and then meta-analyze the DA testing results across regions using Fisher's combined probability test on the per-region p-values.

---

## Part 6: AD Stratification via CPS Score

### Computing a Spatial CPS Proxy from seqFISH Data

The Continuous Pseudoprogression Score (CPS) was introduced in Gabitto et al. (*Nat Neurosci* 2024) from quantitative immunofluorescence (pTau, Aβ42, IBA1, GFAP, NeuN). Since seqFISH measures mRNA not protein, compute a CPS proxy using gene expression module scores as surrogates for each CPS component:

| CPS Component | Protein Marker | seqFISH Gene Proxy | Expected in AD progression |
|---|---|---|---|
| Tau burden | pTau | MAPT (in neurons), SPP1 (in DAM) | Increases with Braak |
| Amyloid burden | Aβ42 | APOE, CLU (in reactive glia near plaques) | Increases early |
| Microglial activation | IBA1 | CST7, TREM2, ITGAX module score | Increases with CPS |
| Astrogliosis | GFAP | GFAP, SERPINA3, C3 module score | Increases with CPS |
| Neuronal integrity | NeuN | SLC17A7, RBFOX3 (excitatory neurons); SST density | Decreases with CPS |

For each AD sample, compute module scores per gene set using UCell or AddModuleScore. Define the spatial CPS proxy as a weighted composite:

\[ \text{CPS\_proxy}_i = w_1 \cdot \text{DAM\_score}_i + w_2 \cdot \text{Reactive\_Astrocyte\_score}_i - w_3 \cdot \text{SST\_density}_i - w_4 \cdot \text{L2/3\_IT\_density}_i \]

where weights \( w_1, \ldots, w_4 \) are set to normalize each component to unit variance across the 10 AD samples before summation (equal-weight approach), or estimated by PCA (first PC of the four normalized components).

### Key Gene Panels Defining Early vs. Late Disease

- **Early phase (CPS 0.2–0.5, Gabitto et al.):** SST depletion (SST, CORT, CHODL), early microglial activation (APOE, B2M, TYROBP — DAM1 markers), reactive astrocyte emergence (GFAP elevated, SERPINA3 moderate), OPC remyelination response (PDGFRA, SOX10 elevated in WM).
- **Late phase (CPS 0.5–1.0):** L2/3 IT excitatory neuron loss (CUX2, RORB depletion), PV interneuron loss (PVALB), fully activated DAM (TREM2, LPL, CST7, CLEC7A — DAM2 markers), complement activation (C1qa, C4b, C3), LDAM emergence (PLIN2, PLIN3).

### Ordering 10 AD Samples Along the CPS Proxy Axis

Rank the 10 AD samples by CPS\_proxy score (ascending = early, descending = late). Validate by correlating the ranking with available clinical metadata (Braak stage, CERAD score, MMSE) using Spearman ρ. If clinical metadata is unavailable or incomplete, the CPS\_proxy ranking itself serves as the biological ordering. Samples with CPS\_proxy ≥ median (late-phase cluster) and CPS\_proxy < median (early-phase cluster) can be treated as two subgroups for exploratory stratified analysis. Report the CPS\_proxy values alongside all primary findings.

### Turning Inconsistent Findings into a Progression Story

When a finding shows C < 7/10 consistency across AD samples (Section 3.5): plot the per-donor effect size \( \Delta_{gi} \) against CPS\_proxy rank and fit a linear regression. If the slope is significantly positive (β > 0, t-test), the finding is real but stage-dependent: it emerges at later CPS. This converts an apparently "inconsistent" result — which could otherwise be dismissed as noise — into a biologically meaningful finding about disease stage-dependence. Report: (1) the stage-dependent trajectory of the finding, (2) the CPS\_proxy threshold above which the finding is consistently observed.

### Testing Whether Spatial Findings Associate with CPS Position

For each spatial metric M (e.g., LGCP-estimated spatial clustering strength σ², hotspot number, bivariate K at r=100 µm), fit:

\[ M_i = \alpha + \beta \cdot \text{CPS\_proxy}_i + \varepsilon_i \]

using linear regression across the 10 AD samples (or 20 total samples if CN samples are assigned CPS\_proxy = 0). Report β, 95% CI, and p-value. Additionally, test whether spatial within-sample heterogeneity (coefficient of variation of the composite disease score across spatial bins) correlates with CPS\_proxy — if high-CPS samples show greater within-section spatial variability (more pronounced hotspots), this supports the hotspot model of AD progression (Section 1.3).

---

## Supplementary: Recommended spatialpy Implementation Checklist

**Per-section preprocessing:**
- Decode transcripts using per-section FDR-equalized threshold (target FDR ≤ 0.05 via dual-axis plot elbow)
- Assign transcripts to cells via SMURF or Baysor soft-segmentation
- Annotate cell types using marker-based scoring + BANKSY spatial domain-aware clustering
- Annotate cortical layers (L1: RELN+NDNF; L2/3: CUX2, LAMP5; L4: RORB; L5: BCL11B, FEZF2; L6: TLE4; WM: MBP, OPALIN)

**Per-cell-type analyses:**
- Pseudobulk DEG: muscat + DESeq2/edgeR (AD vs. CN per cell type per region)
- Milo differential abundance testing
- Module score computation: DAM, DAA, vulnerable neuron, resilience programs (UCell)

**Spatial analyses (per section):**
- Ripley's K and bivariate K: spatstat + KAMP correction
- LGCP fitting: stelfi or R-INLA for intensity field estimation
- nnSVG SVG detection; STANCE for cell-type-specific SVGs
- DESpace for multi-sample SVG aggregation
- SpatialPCA for spatial embeddings and trajectory
- MENDER for domain calling (large sections)

**Cross-sample analyses:**
- moscot spatial alignment for common coordinate system
- Tensor decomposition for joint multi-sample spatial patterns
- CPS proxy scoring and ranking
- Cross-region meta-analysis (fixed-effects + Q-test)

**Novel/exploratory:**
- Hawkes process fitting for DAM self-excitation (stelfi)
- TDA/persistent homology for plaque microenvironment topology (gudhi/PHD-MS)
- COMMOT for proximity-constrained ligand-receptor communication
- ETAS-Hawkes for tau spreading (ETAS.inlabru)

---

*This document was prepared as a supplementary methods framework for the Caltech seqFISH AD project using the spatialpy pipeline. Source literature: Gabitto et al. Nat Neurosci 2024 (SEA-AD/CPS); Mathys et al. Cell 2023; Green et al. Nature 2024; Johnston et al. 2023 (MERFISH 5xFAD); Sankowski et al. Nat Neurosci 2023 (PVM SPP1); Karaahmet et al. bioRxiv 2024 (SERPINA3+ astrocytes); Choi et al. Nature 2023 (5xFAD WM); Weber et al. Nat Commun 2023 (nnSVG); Klein et al. Nature 2024 (moscot); Cottrell & Wei Adv Sci 2025 (MCIST); Benjamin et al. Nature 2024 (TDA seqFISH); Ospina et al. Sci Reports 2024 (spatial LME); Crowell et al. Nat Commun 2020 (muscat); Zimmerman et al. Nat Commun 2021 (pseudoreplication); Jones-Todd & van Helsdingen 2024 (stelfi LGCP/Hawkes); Reinhart 2018 (Hawkes review); Limbeck & Rieck 2024 (persistent homology for ST).*
