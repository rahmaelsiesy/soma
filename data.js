// ============================================================
// RAHMA'S PHD QUEST — DATA v2
// Each milestone has detailed steps (tasks), checklist items,
// robustness gates, and XP values.
// Nature-publication standard: a step is only DONE when it
// would satisfy a hostile expert reviewer.
// ============================================================

// ---- LEVEL SYSTEM ----
// XP per step completed; levels unlock new tracks
const LEVELS = [
  { level: 1, name: "Graduate Student",    xp_required: 0,    emoji: "🎓", reward: "Quest Board unlocked" },
  { level: 2, name: "Coder",               xp_required: 50,   emoji: "💻", reward: "txomics repo is live on GitHub" },
  { level: 3, name: "Data Wrangler",       xp_required: 150,  emoji: "🔬", reward: "First QC figures — Nature-ready" },
  { level: 4, name: "Analyst",             xp_required: 300,  emoji: "📊", reward: "First preprint drafted" },
  { level: 5, name: "Methods Developer",   xp_required: 500,  emoji: "⚡", reward: "EEF2 / Assortativity paper submitted" },
  { level: 6, name: "Spatial Genomicist",  xp_required: 750,  emoji: "🗺️", reward: "Flagship paper submitted" },
  { level: 7, name: "ML Neuroscientist",   xp_required: 1050, emoji: "🤖", reward: "CONCORD SAE paper submitted" },
  { level: 8, name: "PhD",                 xp_required: 1400, emoji: "🏆", reward: "Defense — DONE. Altos/Genentech/Illumina" },
];

// ---- STEP STATUSES ----
// 'locked' | 'pending' | 'inprogress' | 'done'

// ---- TRACK & MILESTONE METADATA ----
// ---- GRADUATION STATUS ----
// Required = must complete to graduate
// Optional = prioritized but not required
const CATEGORY_META = {
  dlpfc:    { label: "RUSH DLPFC AD",         color: "var(--c-dlpfc)",    emoji: "🧠", required: true,  goal: "Identify AD treatment targets & causes in dorsolateral prefrontal cortex" },
  fic:      { label: "RUSH FIC AD",           color: "var(--c-fic)",     emoji: "🔬", required: true,  goal: "Identify AD treatment targets & causes in agranular frontoinsular cortex (no L4)" },
  bd2:      { label: "BD2 ACC",               color: "var(--c-bd2)",     emoji: "💜", required: true,  goal: "Find cell-type & molecular changes in Bipolar I, II, and both in anterior cingulate cortex" },
  dg:       { label: "DG Neurogenesis",       color: "var(--c-dg)",      emoji: "🌱", required: true,  goal: "Identify possible adult neurogenesis in dentate gyrus" },
  eef2:     { label: "EEF2 Methods Paper",    color: "var(--c-eef2)",    emoji: "⚡", required: false, goal: "Prioritized optional: cell-type-stratified efficiency correction for seqFISH (publishable standalone)" },
  network:  { label: "Network & ML (Post-Grad)", color: "#9ca3af",          emoji: "🕸️", required: false, goal: "Post-graduation: SIR epidemic, assortativity, CONCORD SAE, network motifs" },
  package:  { label: "txomics Package",       color: "var(--c-package)", emoji: "📦", required: false, goal: "Public pip package — shared toolkit for all analyses" },
  cursor:   { label: "Cursor Plan (Pipeline)",color: "var(--c-cursor)",  emoji: "🤖", required: false, goal: "P0–P8 AI-assisted implementation packets — executes the DLPFC/FIC analyses" },
  learning: { label: "Learning Plan",         color: "var(--c-learning)",emoji: "📚", required: false, goal: "12 priority papers + methods mastery" },
  career:   { label: "Career Path",           color: "var(--c-career)",  emoji: "🚀", required: false, goal: "Thesis → Defense → Altos/Genentech/Illumina" },
  concord_sae:     { label: "CONCORD SAE",         color: "#b07da8",          emoji: "🧬", required: false, goal: "Sparse autoencoder interpretability over the CONCORD latent space — publishable methods paper" },
  assortativity:   { label: "Tissue Assortativity", color: "#9a9a6c",         emoji: "🕸️", required: false, goal: "Newman assortativity as a tissue-architecture biomarker across Braak stages and brain regions" },
  dementia_review: { label: "Dementia Review",     color: "#8b8b96",          emoji: "📖", required: false, goal: "Completed six-part dementia literature review (AD, FTD/ALS-FTD, Lewy/Vascular, Prion/CTE, molecular regulation, convergence)" },
};

// ---- DETAILED MILESTONE DATA ----
// Each milestone has: steps[] with tasks[], gate (robustness gate), xp, reward
// Steps are the candy land path inside each milestone's detail page.

const QUEST_DATA = {

  // ============================================================
  // REQUIRED PAPER 1: RUSH DLPFC AD
  // Goal: identify AD treatment targets / causes in DLPFC
  // Shared pipeline with FIC (Cursor P0–P8 primarily targets this region)
  // ============================================================
  dlpfc: [
    {
      id: "f-decoding",
      title: "Decoding QC & FDR Sweep",
      depends_on: ["pkg-decoding", "c-p1"],
      emoji: "🔬",
      desc: "Post-hoc FDR threshold sweep from dots.hdf5. Establish optimal decode yield. Gene-stratified efficiency plot. Shared foundation for DLPFC + FIC.",
      category: "dlpfc", priority: "P0",
      xp: 30,
      reward: "🎯 Pipeline foundation locked in. Every downstream analysis rests on this.",
      steps: [
        {
          id: "f-decoding-1",
          title: "Load dots.hdf5 and parse structure",
          type: "code",
          desc: "Read dots.hdf5 using h5py. Confirm columns: flux, peak, sharpness, roundness1, roundness2, area per dot per hyb round. Check offsets shape (5,197,244,2). Total detected dots vs. decoded.",
          checklist: [
            "dots.hdf5 loads without error",
            "All expected columns present",
            "Offsets shape matches expected (5,197,244,2)",
            "Total detected dot count matches known value (59,316,503 all FDR)",
          ],
          xp: 5,
          estimated_blocks: 2,
        },
        {
          id: "f-decoding-2",
          title: "Run a post-hoc FDR threshold sweep",
          type: "code",
          desc: "Sweep FDR threshold from 0.001 to 0.10 in steps of 0.005 using existing decoded output. Plot decode yield (%) vs. FDR threshold. Identify elbow. Target: 1-3% blank barcode rate.",
          checklist: [
            "Sweep covers ≥20 threshold values",
            "Blank barcode rate plotted vs. threshold",
            "Elbow identified and documented",
            "Chosen threshold justified in writing (not just convention)",
          ],
          xp: 8,
          estimated_blocks: 3,
        },
        {
          id: "f-decoding-3",
          title: "Run gene-stratified efficiency analysis",
          type: "code",
          desc: "Compute per-gene efficiency (decoded / expected based on copy number). Plot distribution across genes. Flag outlier genes with <5% or >95% efficiency. These are the genes to watch in downstream DE.",
          checklist: [
            "Per-gene efficiency computed for all 1,193 barcoded genes",
            "Distribution plot made (Nature-ready)",
            "Outlier genes flagged and saved to file",
            "EEF2 efficiency highlighted as reference",
          ],
          xp: 8,
          estimated_blocks: 3,
        },
        {
          id: "f-decoding-4",
          title: "Compute per-cell matching rate",
          type: "code",
          desc: "Matching rate = decoded_dots / total_detected_dots per cell. This is distinct from transcripts per cell. Compute per cell, per cell type (once cell types are assigned), and per brain region.",
          checklist: [
            "Matching rate formula implemented correctly (decoded / total detected, NOT per gene)",
            "Per-cell matching rate saved to AnnData obs",
            "Distribution plot shows expected ~15.6% global rate",
          ],
          xp: 5,
          estimated_blocks: 2,
        },
        {
          id: "f-decoding-5",
          title: "Build publication-ready QC figures",
          type: "figure",
          desc: "All QC figures meet Nature conventions: 88mm single column, Arial 7pt axis labels, Wong colorblind palette, scale bars where applicable. Figures: (1) decode yield vs FDR curve, (2) gene efficiency distribution, (3) matching rate per cell violin.",
          checklist: [
            "FigureStyle class applied (from txomics/plotting/)",
            "All figures exported as SVG + PNG (300 DPI) + PDF",
            "No fonts embedded except Arial/Helvetica",
            "Color palette is colorblind-safe (Wong 8-color or viridis)",
          ],
          xp: 4,
          estimated_blocks: 2,
        },
      ],
      gate: {
        title: "Robustness Gate: Decoding QC",
        items: [
          "Chosen FDR threshold has <3% blank barcode rate AND is consistent with published seqFISH studies",
          "Matching rate is stable across tissue sections from same donor (CV < 15%)",
          "Gene-stratified efficiency shows no systematic bias by gene GC content or length",
          "All figures pass a blind review by lab mate (ask someone to critique before advancing)",
        ]
      }
    },

    {
      id: "f-segmentation",
      depends_on: ["f-decoding", "pkg-spatial"],
      title: "Cell Segmentation & QC",
      emoji: "🔵",
      desc: "Cell segmentation validation, CPS proxy scoring, DAPI ghost cell detection. Shared for DLPFC + FIC.",
      category: "dlpfc", priority: "P1",
      xp: 35,
      reward: "🔵 Every cell has an ID, a quality score, and a home in the tissue.",
      steps: [
        { id: "f-seg-1", title: "Check segmentation overlap with DAPI", type: "code",
          desc: "Compute DAPI signal overlap per segmented cell. Flag cells with <20% DAPI overlap as potential segmentation artifacts. These are not ghost cells — they are mis-segmented regions.",
          checklist: ["DAPI overlap score per cell computed","Cells below 20% overlap flagged","Flagged cells removed from analysis OR kept with flag in metadata"],
          xp: 6, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "f-seg-2", title: "Apply transcript count QC filters", type: "code",
          desc: "Apply quality filters: min 10 transcripts per cell, max 5000 (doublet proxy). Plot before/after distributions. Report fraction removed.",
          checklist: ["Min/max filters applied","Before/after violin plots","Fraction removed reported (<15% expected for high-quality sections)"],
          xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "f-seg-3", title: "Score the 6 CPS proxy modules", type: "code",
          desc: "Implement 6-module CPS proxy gene panel. Modules: (1) Neuronal integrity ↓ (SST,VIP,CUX2,MEF2C,LAMP5), (2) Microglial activation ↑ (TREM2,SPP1,APOE,AIF1), (3) Astrocyte reactivity ↑ (GFAP,C3,VIM), (4) Tau/neurodegeneration ↑ (MAPT,NEFL), (5) Excitatory neuron loss ↓ (SLC17A7,MEF2C), (6) BBB integrity ↓ (CLDN5,SLC2A1,PDGFRB). Per-cell z-scored sum per module.",
          checklist: ["All 6 modules implemented","Z-scoring done per module","CPS composite score saved to AnnData","Spatial CPS heatmap generated (this is an interactive dashboard target)"],
          xp: 12, cognitive_type: "deep", compute_lead_hrs: 12, estimated_blocks: 2 },
        { id: "f-seg-4", title: "Detect ghost cells", type: "code",
          desc: "Flag cells with n_transcripts < 5th percentile AND DAPI signal present as candidate ghost cells. Compute DAPI texture features (entropy, peripheral ratio) per ghost candidate. Classify into: apoptotic (CASP3↑), senescent (CDKN1A↑), or transcriptionally silent.",
          checklist: ["Ghost candidates flagged (expected <5% of cells)","DAPI texture features extracted","3-class classification run","Ghost cells kept in AnnData with 'ghost' label — NOT removed"],
          xp: 12, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: {
        title: "Robustness Gate: Segmentation",
        items: [
          "Cell type proportions (post-QC) match published snRNA-seq proportions within 2-fold (Mathys 2019 as reference)",
          "Ghost cell fraction is consistent across tissue sections (<5% variance between sections from same donor)",
          "CPS proxy scores correlate with neuropathological staging direction (Braak/Thal from metadata)",
        ]
      }
    },

    {
      id: "f-celltyping",
      depends_on: ["f-segmentation", "c-p2", "l-mathys19"],
      title: "Cell Typing & Integration",
      emoji: "🧩",
      desc: "CONCORD-based integration across all cohorts. Cell-type annotation. Efficiency confound removal. Shared for DLPFC + FIC.",
      category: "dlpfc", priority: "P1",
      xp: 40,
      reward: "🧩 Every cell has an identity. The atlas is built.",
      steps: [
        { id: "f-ct-1", title: "Run CONCORD cross-sample integration", type: "code",
          desc: "Run CONCORD on all samples jointly. Use efficiency_group as batch variable (treat efficiency quartile as a batch). Parameters: n_latent=32, temperature=0.07, n_epochs=100. Save latent embeddings to AnnData.obsm['X_concord'].",
          checklist: ["CONCORD runs without NaN loss","LISI score > 0.5 (batch mixing achieved)","UMAP of latent space shows cell types, not batch structure","Efficiency-stratified UMAP shows mixing (not efficiency clusters)"],
          xp: 12, cognitive_type: "deep", compute_lead_hrs: 24, estimated_blocks: 2 },
        { id: "f-ct-2", title: "Cluster and annotate cell types", type: "code",
          desc: "Leiden clustering on CONCORD embedding. Use gene module marker scores (Section 1 of gene_modules.md) for annotation. PIPELINE PAUSES HERE for user validation before advancing.",
          checklist: ["Leiden resolution swept (0.1, 0.3, 0.5, 0.8, 1.0) — silhouette score used to choose","Clusters annotated using gene_modules.md marker module","Annotation shown on UMAP + on spatial tissue plot","USER VALIDATES annotations before advancing — do not skip this checkpoint"],
          xp: 10, cognitive_type: "deep", compute_lead_hrs: 8, estimated_blocks: 2 },
        { id: "f-ct-3", title: "Subcluster each major cell type", type: "code",
          desc: "For each major cell type, sub-cluster using the relevant marker subset. Key subclusters: eN laminar (L2/3 CUX2+ vs L4 RORB+ vs L5 FEZF2+ vs L6 TBR1+), iN subtypes (SST/PVALB/VIP/LAMP5), microglia states (homeostatic P2RY12+ vs DAM TREM2+), astrocyte states (A1 C3+ vs homeostatic AQP4+).",
          checklist: ["eN subclusters show expected laminar distribution on spatial plot","DAM vs homeostatic microglia clearly separated","FIC shows no L4 RORB+ band (agranular cortex — this is a positive control)","VENs (ADCYAP1+) appear in Layer Va of FIC only"],
          xp: 15, cognitive_type: "deep", compute_lead_hrs: 8, estimated_blocks: 2 },
        { id: "f-ct-4", title: "Compare cell-type composition across regions and disease", type: "figure",
          desc: "Bar plots: cell type proportions per sample, colored by disease status, faceted by brain region. Statistical test: LMM for each cell type proportion ~ disease + (1|donor). Report effect sizes.",
          checklist: ["Proportions normalized correctly (per total cells per sample)","LMM run with donor as random effect","Effect size (Cohen's d) reported alongside p-value","Figures: Nature-ready stacked bar + per-cell-type violin"],
          xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: {
        title: "Robustness Gate: Cell Typing",
        items: [
          "Leave-one-sample-out: repeat annotation without one sample — do cluster boundaries shift? (stability test)",
          "Top 3 marker genes per cluster are in the expected gene module from gene_modules.md",
          "FIC agranular cortex shows NO L4 RORB+ band — if it does, annotation is wrong",
          "Cell type proportions tested in both cohorts independently (UCSF + RUSH) before combined analysis",
        ]
      }
    },

    {
      id: "f-spatial-domains",
      depends_on: ["f-celltyping", "l-banksy"],
      title: "Spatial Domain Discovery (DLPFC)",
      emoji: "🗺️",
      desc: "BANKSY spatial clustering in DLPFC. Disease-emergent spatial domains (DESDs). Laminar architecture (L1–L6 expected).",
      category: "dlpfc", priority: "P2",
      xp: 35,
      reward: "🗺️ The tissue has a map. DESDs identified — potential disease signatures found.",
      steps: [
        { id: "f-sd-1", title: "Run BANKSY spatial clustering", type: "code",
          desc: "Run BANKSY with lambda parameter sweep (0.1, 0.2, 0.3, 0.5). Lambda controls neighborhood averaging weight. Use ARI against manual layer annotations (DLPFC Maynard 2021 as benchmark) to choose lambda. Leiden on BANKSY embedding.",
          checklist: ["Lambda sweep run, ARI vs manual labels reported","Chosen lambda documented with justification","Spatial domain plots show smooth, anatomically coherent domains","FIC domains match known agranular cortex architecture (L1-L3-L5-L6, no L4)"],
          xp: 12, cognitive_type: "deep", compute_lead_hrs: 16, estimated_blocks: 2 },
        { id: "f-sd-2", title: "Detect disease-emergent spatial domains (DESDs)", type: "code",
          desc: "Test each spatial domain: is it enriched in disease samples vs. CN? Use permutation test (shuffle disease labels within donor, 1000x). A DESD = domain significantly expanded or contracted in AD or bvFTD (FDR < 0.05, effect size > 0.3).",
          checklist: ["Permutation test run for all domains","FDR correction applied (Benjamini-Hochberg)","DESDs listed with: domain ID, disease association, region, effect size","Spatial visualization of DESDs highlighted on tissue"],
          xp: 12, cognitive_type: "deep", compute_lead_hrs: 12, estimated_blocks: 2 },
        { id: "f-sd-3", title: "Compute the laminar integrity score", type: "code",
          desc: "For cortical sections: compute laminar integrity score = normalized assortativity of layer labels within each sample. Higher score = more intact laminar architecture. Correlate with Braak stage.",
          checklist: ["Layer labels assigned per cell (using laminar marker subset)","Assortativity score computed per sample","Spearman correlation with Braak stage reported (expect negative: more disease = less laminar organization)"],
          xp: 8, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "f-sd-4", title: "Identify spatial-domain marker genes", type: "figure",
          desc: "For each DESD: dotplot of top 10 marker genes (per BANKSY cluster). These become the biological interpretation of each domain. Cross-reference with gene_modules.md to name each domain (e.g., 'inflammatory niche', 'tau-enriched zone').",
          checklist: ["Dotplot: mean expression + % cells expressing, per domain","Top genes cross-referenced with gene_modules.md","Each DESD named with biological hypothesis","Figure: Nature-ready spatial plot with DESDs highlighted + legend"],
          xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: {
        title: "Robustness Gate: Spatial Domains",
        items: [
          "BANKSY domains replicate across independent tissue sections from same donor",
          "DESDs found in FIC must be tested in DLPFC independently (cross-region replication)",
          "Spatial autocorrelation (Moran's I) of domain labels is > 0.5 (domains are spatially coherent, not random)",
          "Negative control: random gene sets should NOT produce coherent spatial domains",
        ]
      }
    },

    {
      id: "f-deg",
      depends_on: ["f-celltyping", "pkg-deg"],
      title: "Extended DEG (DLPFC)",
      emoji: "📊",
      desc: "5-level DE in DLPFC: gene → pathway coherence → spatial coherence → cell-type decomposition → cross-region replication. AD treatment target candidates emerge here.",
      category: "dlpfc", priority: "P3",
      xp: 45,
      reward: "📊 Differential expression that would survive Nature Neuroscience review.",
      steps: [
        { id: "f-deg-1", title: "Level 1: Pseudo-bulk DE (gene level)", type: "code",
          desc: "Aggregate cells per cell type per sample. Use DESeq2 (via rpy2 or pydeseq2). Include efficiency_residual as covariate. Random effect: donor. Comparison: AD vs CN, bvFTD vs CN, AD vs bvFTD, per cell type per region.",
          checklist: ["One pseudo-bulk profile per cell type per sample (NOT per cell)","efficiency_residual included as numeric covariate","LRT test used (not Wald) for multi-factor design","Volcano plots made, top 20 genes labeled"],
          xp: 10, cognitive_type: "deep", compute_lead_hrs: 12, estimated_blocks: 2 },
        { id: "f-deg-2", title: "Level 2: Pathway coherence scoring", type: "code",
          desc: "For each DE gene, test if other genes in the same pathway (from gene_modules.md) change in the expected direction. Coherence score = fraction of pathway genes changing in predicted direction. A DE gene with coherence < 0.5 is not pathway-supported — demote it.",
          checklist: ["Pathway coherence computed for all DE genes","Genes with coherence < 0.5 flagged as 'unsupported'","Pathway enrichment (Fisher's exact, gene_modules.md as gene sets) run on high-coherence DE genes","Pattern/Interpretation table generated per pathway"],
          xp: 10, cognitive_type: "deep", compute_lead_hrs: 6, estimated_blocks: 2 },
        { id: "f-deg-3", title: "Level 3: Spatial coherence", type: "code",
          desc: "For each Level 2-supported DE gene: compute Moran's I of its expression within the relevant cell type. A spatially coherent DE gene (I > 0.1, p < 0.05) changes in a spatially organized way — more biologically meaningful than diffuse changes.",
          checklist: ["Moran's I computed per DE gene per cell type","Effective N correction applied: n_eff = n / (1 + 2*sum(rho_k))","Spatial DE visualization: expression plotted on tissue for top 5 spatially coherent DE genes","Genes are ranked: pathway-supported AND spatially coherent = highest confidence"],
          xp: 10, cognitive_type: "deep", compute_lead_hrs: 8, estimated_blocks: 2 },
        { id: "f-deg-4", title: "Level 4: Cell-type decomposition", type: "code",
          desc: "If a gene is DE in region-level analysis: test which cell types drive it. This prevents 'neuron DE' from being a composition artifact (fewer neurons in disease → their genes look DE). Use MuSiC or a simple linear decomposition.",
          checklist: ["Cell-type decomposition run for all region-level DE genes","Genes where composition alone explains DE are flagged","Remaining genes (composition-controlled) are primary claims"],
          xp: 10, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "f-deg-5", title: "Level 5: Cross-region replication", type: "code",
          desc: "A DE gene that replicates across ≥2 brain regions is a much stronger finding. Run DE analysis in FIC, DLPFC, DG independently. Primary claims = genes DE in ≥2 regions at FDR < 0.05.",
          checklist: ["DE analysis run separately per region","Venn diagram of overlapping DE genes across regions","Primary findings list = intersection (≥2 regions)","Supplementary: region-specific findings labeled as exploratory"],
          xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: {
        title: "Robustness Gate: Extended DEG",
        items: [
          "No DE gene is in the known seqFISH efficiency artifact list (from EEF2 efficiency analysis)",
          "Top 5 DE genes per cell type are validated: direction matches published snRNA-seq (Mathys 2019, Allen Brain Atlas)",
          "Permutation FDR: shuffle disease labels 1000x, show empirical FDR matches nominal FDR",
          "Effect sizes (log2FC + Cohen's d) reported for every primary DE claim — not just p-values",
        ]
      }
    },

    {
      id: "f-cps",
      depends_on: ["f-celltyping", "f-spatial-domains"],
      title: "CPS Proxy Spatial Map (DLPFC)",
      emoji: "🧠",
      desc: "Cellular Pathology Score proxy in DLPFC. Spatial distribution. Braak/Thal correlation. Causal disease mechanism evidence.",
      category: "dlpfc", priority: "P3",
      xp: 25,
      reward: "🧠 A continuous disease severity score mapped onto every cell in the tissue.",
      steps: [
        { id: "f-cps-1", title: "Compute a CPS composite score per cell", type: "code", desc: "Combine the 6 CPS module scores (from segmentation step) into a single composite. Weights: neuronal integrity (−1), microglial activation (+1), astrocyte reactivity (+0.5), tau (+ 1), eN loss (−0.5), BBB (−0.5). Normalize to 0-1 scale.", checklist: ["Composite CPS score saved to AnnData","Score distribution per disease group shown","Spatial heatmap generated (high-value interactive dashboard)"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "f-cps-2", title: "Correlate CPS with Braak and Thal stages", type: "code", desc: "Spearman correlation of mean CPS per sample with Braak stage and Thal phase (from metadata). Expected: r > 0.6 with Braak, r > 0.5 with Thal.", checklist: ["Spearman r and p-value reported","Scatter plot: mean CPS vs Braak stage per sample","Permutation p-value (shuffle Braak stage labels 10,000x)"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-cps-3", title: "Stratify CPS by AD subtype", type: "figure", desc: "Separate CPS trajectories for AD1/AD2/AD3 molecular subtypes (from CONCORD). Do subtypes differ in CPS progression? ANOVA across subtypes.", checklist: ["CPS per subtype computed","ANOVA with post-hoc Tukey test","Effect sizes reported","Figure: boxplot per subtype + spatial map"], xp: 7, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Robustness Gate: CPS", items: ["CPS correlates with Braak stage independently in UCSF and RUSH cohorts","CPS spatial pattern is not driven by tissue edge effects (partial correlation controlling for x,y position)"]}
    },

    {
      id: "f-ven",
      depends_on: ["f-celltyping", "fic-spatial-domains"],
      title: "VEN Loss Analysis (FIC)",
      emoji: "🔺",
      desc: "Von Economo neuron identification and quantification in FIC layer Va. Key AD/bvFTD vulnerability marker.",
      category: "fic", priority: "P4",
      xp: 30,
      reward: "🔺 VEN story told at single-cell spatial resolution. Seeley 2006 replicated and extended.",
      steps: [
        { id: "f-ven-1", title: "Identify ADCYAP1+ cells in Layer Va", type: "code", desc: "Identify ADCYAP1+ cells (ADCYAP1 > 75th percentile) that are ALSO in Layer Va (laminar assignment from spatial domains step). VEN score = z(ADCYAP1) + z(SLIT2) + z(SLC17A7) - z(GAD1). VEN = score > 1.5 AND cell area > 75th percentile in layer Va.", checklist: ["VEN score implemented correctly","Only FIC Layer Va cells classified as VENs","DLPFC/DG ADCYAP1+ cells are NOT classified as VENs (specificity control)","VEN count per sample reported"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-ven-2", title: "Compare VEN density across bvFTD, AD, and CN", type: "code", desc: "VEN density = N_VEN / Area_LayerVa (cells/mm²). LMM: density ~ disease_status + (1|donor). Expected: bvFTD ≈ 56% depletion, AD mild, CN reference.", checklist: ["Density metric computed (per mm², not proportion)","LMM run with donor random effect","Effect size (Cohen's d) and 95% CI reported","Depletion index reported: DI = 1 − (density_disease/density_CN)"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-ven-3", title: "Profile the transcriptional state of surviving VENs", type: "code", desc: "In bvFTD VENs: are surviving VENs under stress? Test: Wilcoxon of UPR_score + tau_score + apoptosis_score in bvFTD VENs vs CN VENs.", checklist: ["Stress composite score computed per VEN","Wilcoxon rank-sum test with effect size (rank-biserial r)","TARDBP and FUS expression in surviving bvFTD VENs specifically tested"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "f-ven-4", title: "Map the VEN microenvironment clearance response", type: "figure", desc: "Within 50µm of VEN-depleted zones in bvFTD FIC: is there microglial DAM enrichment? Compute cell type composition within r=50µm of Layer Va in each disease group.", checklist: ["Radius-based composition analysis implemented","Statistical comparison of AIF1+/TREM2+ fraction near Layer Va: bvFTD vs CN","Spatial figure: VEN locations + surrounding microglia highlighted"], xp: 2, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Robustness Gate: VEN", items: ["ADCYAP1+ cell area is significantly larger than surrounding L5 neurons (VENs are morphologically distinct — use segmentation area as proxy)","VEN depletion is specific to FIC Layer Va — NOT seen in DLPFC Layer Va in same bvFTD samples","Depletion index is stable under different VEN score thresholds (sensitivity analysis)"]}
    },

    {
      id: "f-niche",
      depends_on: ["f-celltyping", "m-lr"],
      title: "Cell–Cell Niche Analysis (DLPFC)",
      emoji: "🤝",
      desc: "Neighborhood composition in DLPFC. Spatial LR with custom distance kernel. DAM-neuron interaction zones as potential treatment targets.",
      category: "dlpfc", priority: "P5",
      xp: 30,
      reward: "🤝 Cell–cell communication atlas. Who talks to whom, and how that breaks in disease.",
      steps: [
        { id: "f-niche-1", title: "Build the neighborhood composition matrix", type: "code", desc: "For each cell i: compute fraction of each cell type within r=50µm. Result: N_cells × N_celltypes matrix of neighborhood composition. t-SNE/UMAP of this matrix identifies 'niche types'.", checklist: ["Radius r swept (25, 50, 100µm)","Niche type clustering run (Leiden on composition matrix)","Niche types mapped back to tissue — spatial plot","Disease-associated niche changes tested"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-niche-2", title: "Run spatial LR analysis with a distance kernel", type: "code", desc: "For each known LR pair (from CellChatDB): compute interaction score with spatial distance decay: score_ij = L_i * R_j * exp(-d_ij / lambda). Lambda = 50µm (paracrine). Sum scores for all cell pairs. Disease comparison: LMM per interaction ~ disease + (1|donor).", checklist: ["LR pairs from CellChatDB loaded (filter to genes in probeset)","Distance kernel with lambda=50µm implemented","Top 20 interactions per cell-type pair reported","Pattern/Interpretation table for top disease-changed interactions"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-niche-3", title: "Map DAM-neuron interaction zones", type: "figure", desc: "Highlight zones where TREM2hi microglia are within 50µm of MAPT-high neurons. These are candidate 'pathological niche' zones. Quantify in AD vs CN vs bvFTD.", checklist: ["DAM-neuron proximity score per cell pair computed","Disease comparison of zone frequency (permutation test)","Spatial visualization on tissue — Nature figure"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Robustness Gate: Niche", items: ["LR interactions replicate in both cohorts independently","Distance kernel lambda parameter tested at 25, 50, 100µm — primary claims stable across all three","Positive control: known microglial-neuron interactions (TREM2-APOE, CX3CR1-CX3CL1) show expected enrichment"]}
    },

    {
      id: "f-write",
      depends_on: ["f-deg", "f-cps", "f-niche", "c-p8"],
      title: "DLPFC AD Paper: Write & Submit",
      emoji: "✍️",
      desc: "Full DLPFC AD manuscript. All figures publication-ready. Interactive GitPages dashboard. Nature Neuroscience format.",
      category: "dlpfc", priority: "P8",
      xp: 50,
      reward: "🏆 SUBMITTED. Nature Neuroscience. Flagship paper done.",
      steps: [
        { id: "f-write-1", title: "Finalize all figures to Nature standards", type: "figure", desc: "Every figure passes the statistical checklist in robustness_and_validation.md. All figures: SVG + PNG (300 DPI) + PDF. All in txomics/plotting/. No hardcoded paths.", checklist: ["Statistical checklist passed for every main figure","Effect sizes reported on all figures","All figures in txomics/plotting/—none hardcoded in analysis repo","Colorblind-safe palette used throughout"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "f-write-2", title: "Publish interactive dashboards on GitPages", type: "code", desc: "Deploy 5 dashboards: Efficiency Explorer, Spatial Domain Browser, CONCORD Embedding Explorer, Extended DE Browser, CPS Proxy Map. Built with Quarto + Observable JS.", checklist: ["All 5 dashboards functional","Widgets are genuinely useful (not decorative)","GitPages URL stable and linked from README","Data files are minimal size (sample data, not full HDF5)"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "f-write-3", title: "Draft the manuscript", type: "writing", desc: "Full manuscript: Introduction (using BIO_BACKGROUND.md), Methods (every step documented), Results (organized around 5 key findings), Discussion (5 causal hypotheses). Target: Nature Neuroscience format.", checklist: ["Introduction: biological context from BIO_BACKGROUND.md","Methods: reproducible (Zenodo DOI + GitHub link)","Results: each claim supported by robustness gate evidence","Discussion: limitations section explicitly addresses U1-U10 from robustness doc"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "f-write-4", title: "Run internal review and revision", type: "writing", desc: "Submit draft to advisor. Address all comments. Go through statistical checklist one final time. Ask one lab mate to attempt to reproduce Figure 1 from your code.", checklist: ["Advisor review completed","Statistical checklist passed (final)","Figure 1 reproduced independently by lab mate","Code deposited: GitHub + Zenodo DOI"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Final Gate: Submission Ready", items: ["Every main finding passed its robustness gate (check all gates above)","Peer pre-review by ≥1 senior PhD student or postdoc","All code on GitHub, documented, pip-installable txomics","Response to 5 most likely reviewer critiques pre-written (from reviewer template in robustness doc)"]}
    },
  ],

  // ============================================================
  // REQUIRED PAPER 2: RUSH FIC AD
  // Goal: AD treatment targets / causes in agranular FIC (no L4 RORB+ band)
  // FIC is the most selectively vulnerable region in bvFTD; unique laminar biology
  // ============================================================
  fic: [
    {
      id: "fic-spatial-domains",
      depends_on: ["f-celltyping"],
      title: "Spatial Domains (FIC)",
      emoji: "🗺️",
      desc: "BANKSY spatial clustering in FIC. Agranular cortex — no L4, so laminar assignment uses L1/L2, L3, L5a (VEN layer), L5b, L6 markers. Positive control: no RORB+ band.",
      category: "fic", priority: "P2",
      xp: 25,
      reward: "🗺️ FIC laminar map validated. VEN layer (L5a) confirmed.",
      steps: [
        { id: "fic-sd-1", title: "Confirm agranular laminar markers", type: "code", desc: "In FIC: confirm RORB is NOT expressed in a band (positive control for agranular status). Expected layers: L1 (low density), L2 (RELN+), L3 (CUX2+), L5a (ADCYAP1+ VEN layer), L5b (CTIP2+), L6 (TBR1+). No L4 RORB+ band.", checklist: ["RORB expression: no band detected in FIC (positive control)","L5a VEN layer: ADCYAP1+ cells identified","Layer markers visualized spatially","FIC laminar map saved"], xp: 10, estimated_blocks: 2 },
        { id: "fic-sd-2", title: "Run BANKSY spatial clustering (FIC)", type: "code", desc: "Run BANKSY on FIC samples. Disease-emergent spatial domain detection — compare to DLPFC. Do the same DESDs appear? FIC-specific DESDs?", checklist: ["BANKSY run on FIC samples","DESDs identified","FIC vs. DLPFC DESD comparison","FIC-specific DESDs annotated"], xp: 15, estimated_blocks: 3 },
      ],
      gate: { title: "FIC Spatial Gate", items: ["RORB absent in FIC (agranular confirmed)","VEN layer L5a identified","DESDs in FIC replicate at least 2 from DLPFC"] }
    },
    {
      id: "fic-deg",
      depends_on: ["fic-spatial-domains", "f-celltyping", "pkg-deg"],
      title: "FIC AD: Extended DEG",
      emoji: "📊",
      desc: "5-level DE in FIC. Compare to DLPFC DE: what is shared (disease signature) vs. FIC-specific (region vulnerability)? Convergence = stronger causal candidates.",
      category: "fic", priority: "P3",
      xp: 35,
      reward: "📊 FIC disease signature defined. Shared AD targets identified across regions.",
      steps: [
        { id: "fic-deg-1", title: "Run 5-level DEG in FIC", type: "code", desc: "Same pipeline as DLPFC. Pseudo-bulk → pathway coherence → spatial coherence → cell-type decomposition → cross-region replication (with DLPFC as replication cohort).", checklist: ["All 5 DE levels run in FIC","FDR-corrected gene list","Pathway coherence scores computed","DLPFC cross-replication test done"], xp: 20, estimated_blocks: 6 },
        { id: "fic-deg-2", title: "Identify FIC ∩ DLPFC convergent targets", type: "code", desc: "Genes DE in both FIC AND DLPFC (same direction) = highest-confidence AD treatment targets. Rank by: (1) effect size, (2) pathway coherence in both regions, (3) known drug target status (DrugBank lookup).", checklist: ["Convergent gene list generated","DrugBank / OpenTargets lookup for top 20 genes","Divergent genes identified (region-specific)","Figure: Venn + ranked convergent target list"], xp: 15, estimated_blocks: 4 },
      ],
      gate: { title: "FIC DEG Gate", items: ["FIC DE result stable in both UCSF + RUSH cohorts","Top convergent targets are not efficiency artifacts","At least 3 convergent genes have prior AD literature support (cite papers)"] }
    },
    {
      id: "fic-ven",
      depends_on: ["f-celltyping", "fic-spatial-domains"],
      title: "VEN Loss Analysis (FIC)",
      emoji: "🔺",
      desc: "Von Economo neuron identification and quantification in FIC layer Va. Key AD/bvFTD vulnerability marker — unique to FIC/ACC, not present in DLPFC.",
      category: "fic", priority: "P4",
      xp: 40,
      reward: "🔺 VEN vulnerability quantified. Disease-specific depletion characterized.",
      steps: [
        { id: "f-ven-1", title: "Identify ADCYAP1+ cells in Layer Va", type: "code", desc: "Identify ADCYAP1+ cells (ADCYAP1 > 75th percentile) that are ALSO in Layer Va (laminar assignment from spatial domains step). VEN score = z(ADCYAP1) + z(SLIT2) + z(SLC17A7) - z(GAD1). VEN = score > 1.5 AND cell area > 75th percentile in layer Va.", checklist: ["VEN score implemented correctly","Only FIC Layer Va cells classified as VENs","DLPFC ADCYAP1+ cells are NOT classified as VENs (specificity control)","VEN count per sample reported"], xp: 10, estimated_blocks: 3 },
        { id: "f-ven-2", title: "Compare VEN density across bvFTD, AD, and CN", type: "code", desc: "VEN density = N_VEN / Area_LayerVa (cells/mm²). LMM: density ~ disease_status + (1|donor). Expected: bvFTD ≈ 56% depletion, AD mild, CN reference.", checklist: ["Density metric computed (per mm², not proportion)","LMM run with donor random effect","Effect size (Cohen's d) and 95% CI reported","Depletion index reported: DI = 1 − (density_disease/density_CN)"], xp: 10, estimated_blocks: 3 },
        { id: "f-ven-3", title: "Profile the transcriptional state of surviving VENs", type: "code", desc: "In bvFTD VENs: are surviving VENs under stress? Test: Wilcoxon of UPR_score + tau_score + apoptosis_score in bvFTD VENs vs CN VENs.", checklist: ["Stress composite score computed per VEN","Wilcoxon rank-sum test with effect size","TARDBP and FUS expression in surviving bvFTD VENs tested"], xp: 8, estimated_blocks: 2 },
        { id: "f-ven-4", title: "Map the VEN microenvironment clearance response", type: "figure", desc: "Within 50µm of VEN-depleted zones in bvFTD FIC: is there microglial DAM enrichment? Compute cell type composition within r=50µm of Layer Va in each disease group.", checklist: ["Radius-based composition analysis implemented","AIF1+/TREM2+ fraction near Layer Va: bvFTD vs CN","Spatial figure: VEN locations + surrounding microglia highlighted"], xp: 2, estimated_blocks: 2 },
      ],
      gate: { title: "VEN Gate", items: ["VEN depletion replicates in UCSF + RUSH independently","Specificity: DLPFC cells are NOT mis-classified as VENs","VEN layer assignment validated against published ADCYAP1 in situ data"] }
    },
    {
      id: "fic-write",
      depends_on: ["fic-deg", "fic-ven", "c-p8"],
      title: "FIC AD Paper: Write & Submit",
      emoji: "✍️",
      desc: "FIC AD manuscript. Emphasizes: (1) agranular cortex vulnerability, (2) VEN loss, (3) convergent AD targets with DLPFC. Nature Neuroscience format.",
      category: "fic", priority: "P8",
      xp: 30,
      reward: "🔬 FIC AD paper submitted. Two required papers done.",
      steps: [
        { id: "fic-w-1", title: "Finalize all FIC figures", type: "figure", desc: "FIC-specific figures: laminar map, VEN depletion, FIC DEG, convergent target list. Nature-ready.", checklist: ["VEN depletion figure (density plot + spatial)","FIC vs DLPFC Venn of convergent targets","FIC DESD spatial map","All figures pass statistical checklist"], xp: 10, estimated_blocks: 4 },
        { id: "fic-w-2", title: "Draft the FIC manuscript", type: "writing", desc: "Full FIC manuscript with emphasis on agranular cortex biology and treatment target convergence with DLPFC.", checklist: ["Introduction covers FIC biology (agranular, VENs, bvFTD)","Methods: reproducible","Results: VEN depletion + convergent targets as key findings","Discussion: therapeutic implications of convergent targets"], xp: 15, estimated_blocks: 6 },
        { id: "fic-w-3", title: "Run advisor review and submit", type: "writing", desc: "Advisor review, revision, submission.", checklist: ["Advisor approved","Statistical checklist final pass","Zenodo DOI","Submitted"], xp: 5, estimated_blocks: 2 },
      ],
      gate: { title: "FIC Submission Gate", items: ["All robustness gates above passed","VEN result replicates in both cohorts","Convergent DLPFC+FIC targets verified as not efficiency artifacts"] }
    },
  ],

  // ============================================================
  // REQUIRED PAPER 3: BD2 ACC
  // Goal: cell-type & molecular changes in Bipolar I, II, and both in ACC
  // ACC = anterior cingulate cortex; BD includes BD-I and BD-II
  // ============================================================
  bd2: [
    {
      id: "bd2-qc",
      depends_on: ["pkg-decoding", "pkg-spatial"],
      title: "BD2 ACC: Data QC & Setup",
      emoji: "🔬",
      desc: "Load and QC BD2 ACC samples. Establish cohort metadata: BD-I vs BD-II diagnosis, medication status, sex, age. Confirm sample quality before analysis.",
      category: "bd2", priority: "P0",
      xp: 20,
      reward: "🔬 BD2 data loaded. Cohort characterized.",
      steps: [
        { id: "bd2-qc-1", title: "Load BD2 ACC samples & metadata", type: "code", desc: "Load ACC samples. Key metadata columns: BD_diagnosis (BD-I, BD-II, Control), mood_stabilizer (yes/no), antipsychotic (yes/no), sex, age, PMI. Check missingness.", checklist: ["All samples load without error","Metadata columns present and validated","BD-I vs BD-II sample sizes confirmed","PMI distribution checked (PMI < 30hr threshold)"], xp: 8, estimated_blocks: 2 },
        { id: "bd2-qc-2", title: "Run BD2 decoding QC and set the FDR threshold", type: "code", desc: "Run same FDR sweep as DLPFC. Confirm decode yield is comparable. Flag any outlier samples.", checklist: ["FDR sweep run on ACC data","Decode yield per sample plotted","Outlier samples flagged (>2 SD below mean)","Threshold finalized"], xp: 8, estimated_blocks: 2 },
        { id: "bd2-qc-3", title: "Run cell segmentation and QC (ACC)", type: "code", desc: "Run segmentation pipeline on ACC. Confirm expected cell density. Ghost cell detection. CPS proxy scoring adapted for BD (no Braak stage — use PANSS proxy if available).", checklist: ["Segmentation run","Expected cell density range confirmed","Ghost cells flagged","Notes: no Braak stage for BD — document alternative severity metric"], xp: 5, estimated_blocks: 2 },
      ],
      gate: { title: "BD2 QC Gate", items: ["All samples pass QC thresholds","BD-I and BD-II groups both have n ≥ 5","Medication confound plan documented before analysis begins"] }
    },
    {
      id: "bd2-celltypes",
      depends_on: ["bd2-qc", "f-celltyping"],
      title: "BD2 ACC: Cell Typing",
      emoji: "🧩",
      desc: "Cell type annotation in ACC. ACC has a VEN layer (L5a, like FIC). Expect: pyramidal neurons, interneurons (PV+, SST+, VIP+), oligodendrocytes, astrocytes, microglia. BD may show interneuron loss (PV+ hypothesis).",
      category: "bd2", priority: "P1",
      xp: 30,
      reward: "🧩 ACC cell atlas established. BD-specific cell type changes identified.",
      steps: [
        { id: "bd2-ct-1", title: "Transfer cell type labels from DLPFC atlas", type: "code", desc: "Use CONCORD to project DLPFC cell type labels onto ACC data. Validate with ACC-specific markers: ADCYAP1 (VENs), PVALB (PV+ interneurons), SST, VIP, CUX2, CTIP2.", checklist: ["CONCORD projection run","ACC marker genes validate cell type labels","VEN layer (ADCYAP1+ L5a) identified in ACC","Cell type proportions per sample computed"], xp: 15, estimated_blocks: 3 },
        { id: "bd2-ct-2", title: "Compare cell composition across BD-I, BD-II, and Control", type: "code", desc: "Test: are BD-I and BD-II different in cell type composition? Key hypothesis: PV+ interneuron loss in BD. LMM: cell_fraction ~ BD_diagnosis + sex + age + medication + (1|donor).", checklist: ["LMM run per cell type","BD-I vs Control tested","BD-II vs Control tested","BD-I vs BD-II tested (key comparison for your paper)"], xp: 10, estimated_blocks: 3 },
        { id: "bd2-ct-3", title: "Analyze VENs in ACC (BD context)", type: "code", desc: "ACC has VENs like FIC. Are VENs altered in BD? Test VEN density in BD-I vs BD-II vs Control. Cross-reference with FIC VEN analysis — shared vulnerability hypothesis.", checklist: ["VEN density computed in ACC","BD-I vs BD-II vs Control comparison","Cross-reference with FIC VEN result","Shared vs. disease-specific VEN vulnerability documented"], xp: 5, estimated_blocks: 2 },
      ],
      gate: { title: "BD2 Cell Typing Gate", items: ["Cell type labels validated with ACC marker genes","PV+ interneuron test: BD vs CN — direction consistent with literature (Ernst 2009, Wang 2011)","Medication confound tested: result holds after controlling for mood stabilizer use"] }
    },
    {
      id: "bd2-deg",
      depends_on: ["bd2-celltypes", "pkg-deg"],
      title: "BD2 ACC: Molecular Changes (DEG)",
      emoji: "📊",
      desc: "Extended DEG in ACC: BD-I vs Control, BD-II vs Control, BD-I vs BD-II. Key hypothesis: BD-I and BD-II share a core molecular signature but differ in magnitude or specific cell types. Medication confound is critical to address.",
      category: "bd2", priority: "P2",
      xp: 40,
      reward: "📊 BD molecular signature defined. BD-I vs BD-II divergence mapped.",
      steps: [
        { id: "bd2-deg-1", title: "Run pseudo-bulk DE: BD-I, BD-II, BD-both vs Control", type: "code", desc: "Run pseudo-bulk DESeq2 for 3 contrasts: BD-I vs CN, BD-II vs CN, BD-combined vs CN. Also BD-I vs BD-II directly. Include sex, age, PMI, medication as covariates.", checklist: ["3 contrasts run","Medication (mood stabilizer, antipsychotic) as covariate","FDR-corrected gene lists","Effect sizes reported"], xp: 15, estimated_blocks: 6 },
        { id: "bd2-deg-2", title: "Score pathway coherence and decompose by cell type", type: "code", desc: "Same as flagship 5-level framework: pathway coherence scoring on BD gene lists. Which pathways are dysregulated? Key expected pathways: calcium signaling, glutamate/GABA balance, circadian rhythm, mitochondrial function.", checklist: ["Pathway coherence computed","Top 5 pathways per contrast annotated with literature","Cell-type decomposition: which cell types drive BD DE?","BD-I vs BD-II pathway divergence documented"], xp: 15, estimated_blocks: 4 },
        { id: "bd2-deg-3", title: "Score cannabinoid pathway and stress-response modules", type: "code", desc: "Your hypothesis from gene module design: test cannabinoid pathway (CNR1, CNR2, FAAH, MGLL) in BD. Also: differentiate stress response subtypes (UPR markers: ATF6, EIF2AK3, ERN1 vs ISR: EIF2AK1, EIF2AK2 vs classical heat shock).", checklist: ["Cannabinoid module genes tested in BD","UPR vs ISR vs heat shock stress pathways separated","Which stress subtype predominates in BD-I vs BD-II?","Cite supporting literature for each finding"], xp: 10, estimated_blocks: 3 },
      ],
      gate: { title: "BD2 DEG Gate", items: ["BD-I result stable after removing lithium-treated samples (medication confound check)","Cannabinoid module finding: not driven by a single gene with poor efficiency","BD-I vs BD-II comparison: effect size reported, not just p-value"] }
    },
    {
      id: "bd2-spatial",
      depends_on: ["bd2-celltypes"],
      title: "BD2 ACC: Spatial Architecture",
      emoji: "🗺️",
      desc: "BANKSY spatial domains in BD ACC. Do spatial patterns differ between BD-I and BD-II? Laminar disruption in BD? L5a VEN layer integrity as spatial readout.",
      category: "bd2", priority: "P3",
      xp: 25,
      reward: "🗺️ BD spatial architecture mapped. Laminar disruption quantified.",
      steps: [
        { id: "bd2-sp-1", title: "Run BANKSY spatial clustering (ACC)", type: "code", desc: "Run BANKSY on ACC samples. Identify: (1) layer-preserving domains, (2) disease-emergent domains in BD vs CN.", checklist: ["BANKSY run","Domains compared: BD-I vs BD-II vs Control","L5a VEN layer domain integrity scored","Disease-emergent domains (if any) annotated"], xp: 15, estimated_blocks: 3 },
        { id: "bd2-sp-2", title: "Score spatial coherence of BD molecular changes", type: "code", desc: "Are BD DE genes spatially coherent (Moran’s I)? Do they cluster in specific domains? This links molecular changes to spatial context.", checklist: ["Moran’s I computed for top BD DE genes","Spatial coherence compared BD vs CN","Genes with high spatial coherence prioritized for discussion"], xp: 10, estimated_blocks: 2 },
      ],
      gate: { title: "BD2 Spatial Gate", items: ["Spatial results consistent across BD-I and BD-II samples independently","L5a VEN layer identifiable in ACC (required for VEN analysis validity)"] }
    },
    {
      id: "bd2-write",
      depends_on: ["bd2-deg", "bd2-spatial"],
      title: "BD2 ACC Paper: Write & Submit",
      emoji: "✍️",
      desc: "BD2 ACC manuscript. Key novel framing: (1) single-cell spatial resolution of BD changes, (2) BD-I vs BD-II comparison rarely done at this resolution, (3) cannabinoid/stress pathway findings.",
      category: "bd2", priority: "P8",
      xp: 30,
      reward: "💜 BD2 paper submitted. Three required papers done.",
      steps: [
        { id: "bd2-w-1", title: "Finalize all BD2 figures", type: "figure", desc: "BD2 main figures: cell type composition (BD-I vs BD-II vs CN), top DE pathways, spatial domain map, VEN density in ACC.", checklist: ["All figures Nature-ready","BD-I vs BD-II comparison prominently shown","Medication confound addressed in figure or supplement"], xp: 10, estimated_blocks: 4 },
        { id: "bd2-w-2", title: "Draft the BD2 manuscript", type: "writing", desc: "Full manuscript. Introduction emphasizes: why single-cell spatial in BD? Why BD-I vs BD-II? Methods: medication confound plan. Results: 3-4 key findings.", checklist: ["Introduction cites BD spatial transcriptomics gap","BD-I vs BD-II framing clear","Cannabinoid/stress pathways discussed with cited literature","Limitations: medication confound, sample size"], xp: 15, estimated_blocks: 6 },
        { id: "bd2-w-3", title: "Run advisor review and submit", type: "writing", desc: "Advisor review, revision, submission.", checklist: ["Advisor approved","Statistical checklist final pass","Submitted"], xp: 5, estimated_blocks: 2 },
      ],
      gate: { title: "BD2 Submission Gate", items: ["Medication confound analysis complete and reported","BD-I vs BD-II comparison is the central finding, not just an afterthought","Cannabinoid/stress pathway findings cited to literature"] }
    },
  ],

  // ============================================================
  // REQUIRED PAPER 4: DG NEUROGENESIS
  // Goal: identify possible adult neurogenesis in dentate gyrus
  // DG = dentate gyrus; adult hippocampal neurogenesis (AHN) is contested in humans
  // ============================================================
  dg: [
    {
      id: "dg-qc",
      depends_on: ["pkg-decoding", "pkg-spatial"],
      title: "DG: Data QC & Setup",
      emoji: "🔬",
      desc: "Load and QC DG/hippocampus samples. Confirm DG subfield boundaries (GCL, SGZ, hilus, CA3 border). Note: LATE TDP-43 may confound some donors — must screen.",
      category: "dg", priority: "P0",
      xp: 20,
      reward: "🔬 DG data loaded. Subfields identified.",
      steps: [
        { id: "dg-qc-1", title: "Load DG samples + LATE TDP-43 screen", type: "code", desc: "Load DG/HC samples. Screen for LATE: TARDBP expression pattern, pathological TDP-43 IHC score from metadata if available. Flag LATE-suspect samples.", checklist: ["DG samples loaded","TARDBP expression checked per sample","LATE-suspect samples flagged","Analysis plan: run with and without LATE-suspect samples"], xp: 8, estimated_blocks: 2 },
        { id: "dg-qc-2", title: "Annotate DG subfields spatially", type: "code", desc: "Annotate DG subfields using spatial position + marker genes: GCL (PROX1+, CALB1+), SGZ (DCX+, PCNA+), Hilus (VGLUT2+, SPP1+), CA3 (KCNQ5+, LGI2+). SGZ = where newborn neurons originate.", checklist: ["PROX1+ GCL identified","SGZ boundary approximated (thin layer at GCL-hilus border)","DCX expression in SGZ checked","Subfield labels saved to AnnData"], xp: 12, estimated_blocks: 3 },
      ],
      gate: { title: "DG QC Gate", items: ["DG subfields spatially resolvable","LATE-suspect samples identified and documented","DCX detection confirmed (even if sparse — this is the key neurogenesis marker)"] }
    },
    {
      id: "dg-neurogenesis",
      depends_on: ["dg-qc", "f-celltyping"],
      title: "DG: Adult Neurogenesis Evidence",
      emoji: "🌱",
      desc: "Primary aim: detect evidence of adult neurogenesis in human DG. Key markers: DCX (doublecortin, immature neurons), PCNA (proliferation), PROX1 (mature GCL), PSA-NCAM. This is a contested field — rigor is essential.",
      category: "dg", priority: "P1",
      xp: 45,
      reward: "🌱 Neurogenesis evidence assessed. Novel spatial + transcriptomic characterization.",
      steps: [
        { id: "dg-ng-1", title: "Identify and characterize DCX+ cells", type: "code", desc: "Identify DCX-expressing cells in DG. DCX is in the probeset. Classify: DCX-high (immature, SGZ-proximal), DCX-low (maturing, GCL-proximal). Test: are DCX+ cells in the SGZ? This is the spatial neurogenesis signature.", checklist: ["DCX expression distribution plotted","DCX-high vs DCX-low threshold set","Spatial position of DCX+ cells: are they SGZ-proximal?","DCX+ cell count per sample reported"], xp: 15, estimated_blocks: 3 },
        { id: "dg-ng-2", title: "Build the neurogenesis transcriptomic signature", type: "code", desc: "For DCX+ cells: compute a neurogenesis score = z(DCX) + z(PCNA) + z(CALB2) - z(PROX1_high). High score = immature, low score = mature granule cell. Plot maturation trajectory.", checklist: ["Neurogenesis score implemented","Score distribution per cell in SGZ vs GCL","Maturation trajectory visualized (pseudotime or score gradient)","Score compared AD vs CN vs young controls (if available)"], xp: 15, estimated_blocks: 4 },
        { id: "dg-ng-3", title: "Measure the AD effect on neurogenesis", type: "code", desc: "Does AD reduce neurogenesis? Test: DCX+ cell density in SGZ: AD vs CN (LMM with donor random effect). Also: LATE confound check — does removing LATE-suspect samples change the AD effect?", checklist: ["LMM: DCX+ density ~ disease + age + PMI + (1|donor)","Effect size and CI reported","LATE confound check done","Figure: DCX+ density per disease group"], xp: 10, estimated_blocks: 3 },
        { id: "dg-ng-4", title: "Validate DCX with IF in the wet lab", type: "wetlab", desc: "DCX IHC/IF on n=20 DG sections. Validate: (1) DCX+ cells present in SGZ in young/healthy donors, (2) DCX+ cells reduced in AD donors, (3) DCX co-localizes with PROX1 in maturing cells.", checklist: ["DCX antibody (Abcam ab18723) validated on positive control","n=20 sections: DG from young, CN elderly, AD elderly","DCX+ cell count per section in SGZ","Co-localization with PROX1: ImageJ/FIJI analysis"], xp: 5, estimated_blocks: 1 },
      ],
      gate: { title: "Neurogenesis Rigor Gate", items: ["DCX+ cells are spatially SGZ-proximal (not just scattered)","LATE confound check: AD effect on neurogenesis holds without LATE-suspect samples","DCX IF wet lab confirms seqFISH spatial signal","Skeptic’s challenge addressed: could DCX+ cells be mature interneurons? (Check GAD1 co-expression)"] }
    },
    {
      id: "dg-celltypes",
      depends_on: ["dg-qc", "f-celltyping"],
      title: "DG: Cell Census & Disease Changes",
      emoji: "🧩",
      desc: "Full cell type census in DG. Expected: granule cells (PROX1+), mossy cells (hilus), CA3 pyramidal, DG interneurons (PV+, SST+), astrocytes, microglia, OPCs. What changes in AD?",
      category: "dg", priority: "P2",
      xp: 30,
      reward: "🧩 DG cell atlas complete. Disease-associated cell changes quantified.",
      steps: [
        { id: "dg-ct-1", title: "Annotate DG cell types", type: "code", desc: "Annotate DG cell types. Key: distinguish granule cells (PROX1+, CALB1+), mossy cells (hilus, CALB2+, SLC17A7+), CA3 pyramidal (KCNQ5+), newborn granule cells (DCX+, PROX1-low). Microglia, astrocytes standard.", checklist: ["All major DG cell types annotated","Newborn granule cells separated from mature GCs","Mossy cells identified in hilus","Proportions per sample reported"], xp: 15, estimated_blocks: 3 },
        { id: "dg-ct-2", title: "Compare disease-associated cell-type changes (DG)", type: "code", desc: "LMM per cell type: fraction ~ disease + age + PMI + (1|donor). Key hypotheses: (1) newborn granule cell loss in AD, (2) mossy cell loss (hippocampal sclerosis), (3) microglial DAM enrichment in DG in AD.", checklist: ["LMM run for all DG cell types","Newborn GC fraction tested","Mossy cell fraction tested","Microglial state (DAM score) in DG tested"], xp: 15, estimated_blocks: 3 },
      ],
      gate: { title: "DG Cell Census Gate", items: ["Cell type proportions consistent with published DG snRNA-seq (Sorrells et al., Boldrini et al.)","LATE confound check: cell composition results stable without LATE-suspect samples"] }
    },
    {
      id: "dg-write",
      depends_on: ["dg-neurogenesis", "dg-celltypes"],
      title: "DG Neurogenesis Paper: Write & Submit",
      emoji: "✍️",
      desc: "DG neurogenesis manuscript. Frame around the ongoing controversy (Sorrells 2018 vs Boldrini 2018). Your seqFISH data provides: (1) spatial resolution, (2) transcriptomic maturation, (3) AD disease context.",
      category: "dg", priority: "P8",
      xp: 30,
      reward: "🌱 DG neurogenesis paper submitted. All 4 required papers done. 🎉",
      steps: [
        { id: "dg-w-1", title: "Finalize all DG figures", type: "figure", desc: "DG main figures: neurogenesis score spatial map, DCX+ density per disease group, cell type census, maturation trajectory.", checklist: ["Neurogenesis spatial map (SGZ highlighted)","DCX+ density: AD vs CN","Maturation trajectory","All figures pass statistical checklist"], xp: 10, estimated_blocks: 4 },
        { id: "dg-w-2", title: "Draft the DG manuscript", type: "writing", desc: "Full manuscript. Introduction: address the Sorrells vs Boldrini controversy head-on. State your hypothesis before showing data. Methods: LATE confound handling. Results: spatial + transcriptomic + wet lab converge.", checklist: ["Introduction: Sorrells 2018 + Boldrini 2018 framed","LATE confound handling in Methods","Three lines of evidence converge (spatial + transcriptomic + IF)","Limitations: sample size, PMI"], xp: 15, estimated_blocks: 6 },
        { id: "dg-w-3", title: "Run advisor review and submit", type: "writing", desc: "Advisor review, revision, submission.", checklist: ["Advisor approved","Sorrells/Boldrini controversy framing approved","Submitted"], xp: 5, estimated_blocks: 2 },
      ],
      gate: { title: "DG Submission Gate", items: ["Three converging lines of evidence for neurogenesis (spatial + transcriptomic + wet lab)","LATE confound handled","Reviewer challenge: DCX+ cells are not interneurons (GAD1 negative)"] }
    },
  ],

  // ============================================================
  // PRIORITIZED OPTIONAL: EEF2 METHODS PAPER + related methods
  // EEF2 builds directly from DLPFC pipeline; publishable standalone
  // Also includes: DAPI, Assortativity, CONCORD SAE, LR, Subtypes, Network ML
  // ============================================================
  eef2: [
    {
      id: "m-eef2",
      depends_on: ["f-decoding", "pkg-decoding", "l-eef2"],
      title: "EEF2 Efficiency Paper",
      emoji: "⚡",
      desc: "Methods paper: EEF2 is not a universal housekeeping gene in seqFISH. Cell-type-stratified efficiency correction.",
      category: "methods", priority: "Top",
      xp: 60,
      reward: "⚡ First author. Zero graduation risk. Methods innovation published.",
      steps: [
        { id: "m-eef2-1", title: "Fit the OLS efficiency regression model", type: "code",
          desc: "efficiency_i = beta_0 + sum_k(beta_k * celltype_k) + epsilon_i. Compute R² (variance explained by cell type). Target: R² > 0.3 for the claim to be meaningful. See paper_plans.pdf Paper 1 for full math.",
          checklist: ["OLS regression implemented","R² computed and reported","F-test for cell type effect (ANOVA)","efficiency_residual saved per cell"],
          xp: 15, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "m-eef2-2", title: "Run a permutation test (shuffle cell type labels)", type: "code",
          desc: "Shuffle cell type labels 1000x. Recompute R² each time. p-value = fraction of shuffled R² > observed R². This is the key null hypothesis test.",
          checklist: ["1000 permutations run","Null R² distribution plotted","p-value computed (expected: p < 0.001)","Figure: observed R² vs null distribution (histogram)"],
          xp: 10, cognitive_type: "deep", compute_lead_hrs: 6, estimated_blocks: 2 },
        { id: "m-eef2-3", title: "Test cross-region and cross-cohort stability", type: "code",
          desc: "Run the same analysis in FIC, DLPFC, DG separately AND in UCSF and RUSH cohorts separately. The cell-type efficiency ranking must be consistent.",
          checklist: ["Analysis run independently in all 3 regions","Analysis run independently in both cohorts","Spearman correlation of efficiency rankings: FIC vs DLPFC vs DG (expect r > 0.7)","Inconsistencies documented and explained"],
          xp: 10, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "m-eef2-4", title: "Measure impact on downstream DE (artifact genes)", type: "code",
          desc: "Run DE without correction vs. with efficiency_residual covariate. Genes that are significant before but not after correction = efficiency artifacts. Build the artifact gene list.",
          checklist: ["DE run both ways (with and without efficiency covariate)","Artifact gene list generated","Known housekeeping genes (from HRT Atlas) should BECOME non-significant after correction (positive control)","Volcano plots: before vs. after — key figure for paper"],
          xp: 15, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "m-eef2-5", title: "Validate with smFISH in the wet lab", type: "wetlab",
          desc: "Design 8-gene smFISH panel (EEF2 + ACTB + GAPDH + SLC17A7 + GAD1 + AQP4 + AIF1 + MOG). Run on n=10 sections. Compare smFISH efficiency (ground truth ~85%) vs. seqFISH efficiency per cell type.",
          checklist: ["smFISH probes ordered (LGC Biosearch Stellaris)","Sections selected: n=10 from fresh-frozen samples with acceptable RNA","smFISH imaging run on Caltech confocal","Efficiency comparison: smFISH vs. seqFISH by cell type plotted"],
          xp: 10, cognitive_type: "lab", compute_lead_hrs: 72 , estimated_blocks: 2, },
      ],
      gate: { title: "Robustness Gate: EEF2 Paper", items: ["R² > 0.3 in ALL 3 brain regions independently","Permutation p < 0.001","smFISH shows cell-type efficiency pattern matches seqFISH pattern (r > 0.6)","Retroactive analysis: show ≥3 published seqFISH papers have DE genes that are efficiency artifacts by your method"]}
    },
    {
      id: "m-dapi",
      depends_on: ["f-segmentation", "c-p7"],
      title: "DAPI Ghost Cells Paper",
      emoji: "👻",
      desc: "Novel method: DAPI signal morphology → chromatin state → transcriptional output.",
      category: "methods", priority: "Mid",
      xp: 45,
      reward: "👻 New method published. Ghost cells are real, classifiable, and biologically meaningful.",
      steps: [
        { id: "m-dapi-1", title: "Extract DAPI features", type: "code", desc: "Extract per-nucleus: integrated density, mean intensity, texture entropy (H), circularity, peripheral condensation ratio (PR), eccentricity. See paper_plans.pdf Paper 2 for formulas.", checklist: ["All 6 features extracted per nucleus","Feature distributions inspected (no NaN or Inf)","Features saved to AnnData"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "m-dapi-2", title: "Run the spatial independence test (rule out probe artifact)", type: "code", desc: "Partial correlation: ghost_fraction vs. mean_density within 100µm² bins, controlling for x/y position. If r < -0.3, ghost cells are probe artifacts. If r ~ 0, ghost cells are biological.", checklist: ["100µm spatial bins created","Partial correlation computed (controlling for tissue position)","Result: r is near 0 (ghost cells are NOT simply low-penetration areas)"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "m-dapi-3", title: "Train a GMM classifier for 3 ghost-cell types", type: "code", desc: "Gaussian Mixture Model on 6 DAPI features + n_transcripts. BIC used to choose K (expect K=3-4). Interpret components as: apoptotic, senescent, transcriptionally silent, normal.", checklist: ["GMM fit with K=2,3,4,5 — BIC curve plotted","Chosen K documented","Components labeled using CASP3/CDKN1A/BCL2 expression in each class","Validation: CASP3+ cells enriched in apoptotic component (positive control)"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "m-dapi-4", title: "Validate with TUNEL + H3K9me3 in the wet lab", type: "wetlab", desc: "TUNEL staining (apoptosis marker) + H3K9me3 IF (heterochromatin) on n=20 sections. Expected: TUNEL+ ≈ apoptotic ghost component; H3K9me3 high ≈ high peripheral DAPI ratio cells.", checklist: ["TUNEL kit ordered and run","H3K9me3 antibody (Abcam ab8898) IF run","Co-localization of TUNEL+ with apoptotic GMM component quantified","H3K9me3 level vs. DAPI peripheral ratio: Pearson r > 0.4 expected"], xp: 8, estimated_blocks: 1 },
      ],
      gate: { title: "Robustness Gate: DAPI Paper", items: ["Ghost cell classifier trained on FIC, tested on DLPFC — AUC > 0.75","DAPI entropy vs. n_transcripts correlation (Pearson r > 0.3) in all 3 brain regions independently","TUNEL wet lab confirms apoptotic component identity"]}
    },
    {
      id: "m-assortativity",
      depends_on: ["f-celltyping", "l-assortativity"],
      title: "Tissue Assortativity Biomarker",
      emoji: "🔗",
      desc: "Newman assortativity as a spatial biomarker. Distinguishes AD subtypes. Correlates with Braak stage.",
      category: "methods", priority: "Top",
      xp: 55,
      reward: "🔗 First author. Zero graduation risk. Novel spatial biomarker published.",
      steps: [
        { id: "m-ass-1", title: "Construct the spatial graph (kNN + Delaunay)", type: "code", desc: "Build kNN graphs for k=5,10,15,20,30. Also Delaunay triangulation. Compute Newman assortativity r for continuous attributes (gene module scores) and categorical (cell types). See paper_plans.pdf Paper 3 for full formula.", checklist: ["kNN graphs built for all k values","Delaunay triangulation implemented","Assortativity r computed for all k values","Robustness test: Spearman correlation of r values across k choices (expect >0.85)"], xp: 12, estimated_blocks: 4 },
        { id: "m-ass-2", title: "Compute the per-gene assortativity landscape", type: "code", desc: "Compute r for every gene in probeset. Rank by |r|. Top assortative genes = those that show strongest spatial clustering. Bottom = spatially random or disassortative genes.", checklist: ["Per-gene assortativity computed for all 1,193 genes","Ranked list saved","Top 10 most assortative genes annotated with module from gene_modules.md","Comparison: assortative genes in AD vs CN — do they differ?"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "m-ass-3", title: "Correlate with clinical Braak stage", type: "code", desc: "Spearman correlation of mean tissue assortativity per sample with Braak stage. LMM: r ~ Braak_stage + brain_region + (1|donor). Permutation p-value (shuffle Braak labels 10,000x).", checklist: ["Spearman r and permutation p-value computed","LMM run and reported","Effect size (R²) of Braak stage on assortativity","Jackknife CI across samples computed"], xp: 12, cognitive_type: "deep", compute_lead_hrs: 6, estimated_blocks: 4 },
        { id: "m-ass-4", title: "Compare the model vs. cell-type proportions", type: "code", desc: "Predict Braak stage from: (A) cell-type proportions alone, (B) proportions + assortativity. delta-AUC must be > 0.05 for assortativity to add information. This is the key novelty claim.", checklist: ["Both models trained and compared (leave-one-out CV)","delta-AUC reported","Bootstrap CI on delta-AUC (does CI exclude 0?)","Figure: ROC curves for both models"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "m-ass-5", title: "Validate assortativity with large-N IF", type: "wetlab", desc: "Run 6-plex IF (NeuN, GFAP, IBA1, OLIG2, CLDN5, DAPI) on n=30 brain donor sections. Compute cell-type assortativity from IF-detected cell positions. This validates the concept at protein level with large N.", checklist: ["IF panel run on n=30 sections (n=10 per disease group)","Cell type positions extracted from IF images","Assortativity computed from IF data","Correlation of IF-assortativity vs. seqFISH-assortativity per sample (expect r > 0.5)"], xp: 6, estimated_blocks: 1 },
      ],
      gate: { title: "Robustness Gate: Assortativity Paper", items: ["Assortativity stable across k=5 to k=20 (Spearman r > 0.85)","Clinical correlation (Braak) replicates in UCSF and RUSH cohorts independently","IF large-N (n=30) confirms direction of assortativity change in AD","Model comparison: assortativity adds delta-AUC > 0.05 over cell-type proportions (CI excludes 0)"]}
    },
    {
      id: "m-concord",
      depends_on: ["f-celltyping", "c-p6", "l-concord", "l-sae"],
      title: "CONCORD Interpretability Paper",
      emoji: "🔮",
      desc: "Sparse autoencoder on CONCORD latent space. Biologically interpretable features.",
      category: "methods", priority: "3rd",
      xp: 50,
      reward: "🔮 Novel interpretability method for spatial single-cell data published.",
      steps: [
        { id: "m-conc-1", title: "Design and train the SAE architecture", type: "code", desc: "Overcomplete SAE: encoder h = ReLU(W_enc * z + b_enc), m >> d. Loss = reconstruction + lambda * L1(h). Train for lambda sweep (0.01, 0.05, 0.1, 0.5). See paper_plans.pdf Paper 5 for full math.", checklist: ["SAE implemented in PyTorch","Lambda sweep run, interpretability-reconstruction tradeoff plotted","Lambda chosen before looking at biological labels","Training loss curve saved"], xp: 12, estimated_blocks: 4 },
        { id: "m-conc-2", title: "Test feature stability across 10 random seeds", type: "code", desc: "Run SAE 10x with different random seeds. For each feature pair across runs, compute cosine similarity. Stable features (cos_sim > 0.85) = report. Unstable = discard.", checklist: ["10 training runs completed","Cosine similarity matrix computed","Fraction of stable features reported","Only stable features carried forward"], xp: 10, estimated_blocks: 4 },
        { id: "m-conc-3", title: "Interpret features biologically", type: "code", desc: "For each stable feature k: find top-100 cells by activation, compute enriched genes, cross-reference with gene_modules.md. Flag technical features (r > 0.3 with efficiency_residual).", checklist: ["All stable features have a proposed biological label","Technical features flagged","Disease-relevant features identified (differ AD vs CN)","Spatial Moran's I per feature computed"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "m-conc-4", title: "Validate across the Allen Brain Atlas", type: "code", desc: "Apply trained SAE to Allen Brain Cell Atlas data (different platform). Do the same stable features emerge? Cosine similarity of top features between datasets > 0.7 = cross-platform generalization.", checklist: ["Allen data loaded and preprocessed","CONCORD embedding computed on Allen data","SAE applied (frozen weights)","Feature cosine similarity reported"], xp: 13, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Robustness Gate: SAE Paper", items: [">50% of features are stable (cos_sim > 0.85 across seeds)","Top 5 disease-relevant features have known biological interpretation AND low efficiency correlation (<0.3)","Cross-dataset generalization: key features appear in Allen Brain data"]}
    },
    {
      id: "m-lr",
      depends_on: ["f-celltyping", "f-spatial-domains"],
      title: "Spatial LR Custom Kernel",
      emoji: "📡",
      desc: "Ligand-receptor interactions scored with a distance-decay kernel exp(-d/lambda) instead of a binary proximity cutoff. Sweep lambda across 25-200um, benchmark top interactions against CellChat and NicheNet, and report the three-way intersection as high-confidence calls.",
      category: "methods", priority: "Mid",
      xp: 35,
      reward: "📡 Spatially-aware cell communication method published as txomics tool.",
      steps: [
        { id: "m-lr-1", title: "Parameterize the distance kernel", type: "code", desc: "score_ij = L_i * R_j * exp(-d_ij / lambda). Sweep lambda = 25, 50, 100, 200µm. Compare to binary proximity threshold (standard approach).", checklist: ["Kernel implemented","Lambda sweep run","Comparison to binary threshold: which finds more biologically meaningful interactions?"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "m-lr-2", title: "Identify disease-changed LR interactions", type: "code", desc: "LMM per interaction ~ disease + (1|donor). FDR correction. Top changed interactions annotated with pathway context.", checklist: ["LMM run for all interactions","BH correction applied","Top 20 interactions annotated","Pattern/Interpretation tables for key interactions"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "m-lr-3", title: "Benchmark vs. CellChat and NicheNet", type: "code", desc: "Run same data through CellChat and NicheNet. Compare top interactions. Report overlap: interactions found by all 3 methods = highest confidence.", checklist: ["CellChat run on same data","NicheNet run on same data","Overlap Venn diagram made","Primary claims = intersection of ≥2 methods"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Robustness Gate: LR Paper", items: ["Known positive control interactions (TREM2-APOE, CX3CR1-CX3CL1) detected by kernel method","Top interactions replicate in both cohorts","Kernel method detects ≥10% more disease-relevant interactions than binary threshold (justifies methodological advance)"]}
    },
    {
      id: "m-subtypes",
      depends_on: ["f-celltyping", "m-concord"],
      title: "AD Molecular Subtypes",
      emoji: "🧬",
      desc: "Spatial characterization of AD1/AD2/AD3 subtypes. LATE TDP-43 confound.",
      category: "methods", priority: "Mid",
      xp: 35,
      reward: "🧬 AD heterogeneity mapped in space. Subtype-stratified analysis ready.",
      steps: [
        { id: "m-sub-1", title: "Classify AD1, AD2, and AD3 subtypes", type: "code", desc: "Use CONCORD latent space to classify AD samples into transcriptomic subtypes. Reference: Mathys 2023 subtype signatures. Validate with Murray neuropathological subtype data from metadata.", checklist: ["Subtype classifier trained on published signatures","Samples classified with confidence score","Murray subtype correlation computed","Subtype assignments validated against clinical metadata"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "m-sub-2", title: "Check LATE TDP-43 confounds in DG/HC", type: "code", desc: "In DG/HC region: test whether TARDBP expression pattern suggests LATE co-pathology. LATE creates a TDP-43-positive subpopulation that confounds AD vs. CN comparison in DG. Flag affected samples.", checklist: ["TARDBP expression in DG/HC neurons tested","LATE-suspect samples identified","DG/HC analysis run with and without LATE-suspect samples","Results reported separately: LATE-confounded vs. clean"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "m-sub-3", title: "Run subtype-stratified analyses", type: "code", desc: "Repeat key analyses (DEG, CPS, spatial domains) stratified by AD subtype. Do subtypes show different spatial signatures?", checklist: ["All major analyses run per subtype","Subtype-specific DE genes identified","Pattern/Interpretation table per subtype","Figure: spatial domain composition per subtype"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Robustness Gate: Subtypes", items: ["Subtype classification replicates when run on UCSF and RUSH separately","LATE confound analysis: main AD/CN findings are stable after removing LATE-suspect samples"]}
    },
  ],

  // ============================================================
  // Network/ML papers — post-grad priority, keep in board as optional
  network: [
    {
      id: "n-sir",
      depends_on: ["f-celltyping", "l-sir"],
      title: "SIR Epidemic Model Paper",
      emoji: "🦠",
      desc: "Neuroinflammation as epidemic. SIR model on spatial microglial activation.",
      category: "network", priority: "2nd",
      xp: 55,
      reward: "🦠 Novel quantitative framework for neuroinflammation dynamics published.",
      steps: [
        { id: "n-sir-1", title: "Score DAM and classify S/I/R states", type: "code", desc: "DAM_score = z(TREM2) + z(SPP1) + z(APOE) + z(ITGAX) - z(P2RY12) - z(TMEM119). Threshold sweep for S/I/R classification (25th/50th/75th percentile). See paper_plans.pdf Paper 4.", checklist: ["DAM score computed per microglia","3 threshold options tested","S/I/R states assigned and visualized on tissue","Sensitivity analysis: do results change across thresholds?"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "n-sir-2", title: "Fit the spatial transmission kernel", type: "code", desc: "beta_ij = beta_0 * exp(-d_ij / lambda). MLE for beta_0, gamma, lambda. MCMC posterior (500 samples). R_0 = beta/gamma with 95% credible interval.", checklist: ["Spatial kernel implemented","MLE optimization converges","MCMC traces show convergence (R_hat < 1.01)","R_0 computed per sample with CI"], xp: 15, estimated_blocks: 6 },
        { id: "n-sir-3", title: "Stratify by Braak stage", type: "code", desc: "Does R_0 increase with Braak stage? Spearman r(R_0, Braak_stage). If epidemic model is correct: R_0 should increase as disease progresses (from Braak I to VI).", checklist: ["R_0 computed per sample","Spearman correlation with Braak stage","Permutation p-value computed","Figure: R_0 vs Braak stage scatter per sample"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "n-sir-4", title: "Compare the model vs. the independent-activation null", type: "code", desc: "Null model: each microglia activates independently with probability p (no spatial transmission). Compare AIC/BIC: SIR spatial model vs. null. delta_BIC > 10 required for primary claim.", checklist: ["Null model implemented and fit","AIC and BIC for both models reported","delta_BIC > 10 (strong evidence for SIR model)","If not: reframe as 'spatial DAM clustering describes the data better than independent activation'"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "n-sir-5", title: "Validate with IBA1 + TREM2 IF (large N)", type: "wetlab", desc: "4-plex IF on n=30 sections: IBA1, TREM2, GFAP, DAPI. Compute Ripley's K for TREM2+ IBA1+ cells. K(r) > π*r² = DAM cells cluster spatially (consistent with epidemic spread).", checklist: ["IF run on n=30 FIC + DLPFC sections","Ripley's K computed for TREM2+ cells","K(r) at r=50-200µm compared: AD vs CN vs FTD","Result supports DAM spatial clustering grows with disease"], xp: 6, estimated_blocks: 1 },
      ],
      gate: { title: "Robustness Gate: SIR Paper", items: ["delta_BIC > 10 vs. null model in ALL 3 brain regions","R_0 > 1 in AD confirmed in both cohorts independently","MCMC convergence verified (R_hat < 1.01 for all parameters)","IBA1/TREM2 IF clustering result is directionally consistent with computational R_0 estimate"]}
    },
    {
      id: "n-motifs",
      depends_on: ["f-celltyping", "l-gnn"],
      title: "Network Motifs Paper",
      emoji: "🔺",
      desc: "Spatial co-expression networks built from pairwise correlations (|r|>0.3, BH-FDR<0.05), mined for recurring 3- and 4-node motifs. Tests whether AD, control, and FTD brains carry distinguishable motif frequencies that work as tissue fingerprints.",
      category: "network", priority: "Mid",
      xp: 40,
      reward: "🔺 Tissue fingerprint method published. AD/CN/FTD distinguishable from network structure alone.",
      steps: [
        { id: "n-mot-1", title: "Build the spatial co-expression network", type: "code", desc: "Pearson correlation per gene pair across all cells in section. Edge if |r| > 0.3 AND FDR < 0.05. Multiple testing: BH on ~711,000 pairs. Directed edges from TRRUST/dorothea.", checklist: ["~711,000 pairs tested","BH correction applied","Network density reported (expect 1-5% of possible edges)","Known regulatory pairs in database checked as positive control"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "n-mot-2", title: "Count motifs and compute Z-scores", type: "code", desc: "Count all 3-node motifs (13 types, Milo 2002). Null: 1000 configuration model randomizations. Z_m = (N_m - mean(N_m_rand)) / std(N_m_rand). Fingerprint = vector of 13 Z-scores per sample.", checklist: ["All 13 motif types counted","1000 null randomizations run","Z-score vector computed per sample","Top enriched motifs identified and annotated"], xp: 15, estimated_blocks: 6 },
        { id: "n-mot-3", title: "Run PERMANOVA on disease-group discrimination", type: "code", desc: "F_stat from fingerprint distance matrix (999 permutations). If p < 0.05: fingerprint space contains disease information. Follow-up: which motifs drive the discrimination?", checklist: ["PERMANOVA run with 999 permutations","p-value and R² (effect size) reported","Post-hoc: motifs most different between AD and CN identified","Partial R² vs. cell-type proportions computed"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "n-mot-4", title: "Replicate on Allen Brain data", type: "code", desc: "Apply same motif analysis to Allen Brain Atlas spatial data. Same high-Z motifs should appear. This is the cross-platform replication required for publication.", checklist: ["Allen data motif analysis run","Overlap of top motifs: your data vs. Allen (expect >50% of top 5 motifs shared)","Motifs unique to your data = seqFISH-specific resolution advantage"], xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Robustness Gate: Motifs Paper", items: ["PERMANOVA p < 0.05 AND R² > 0.1 (disease explains >10% of fingerprint variance)","Top motifs replicate in Allen Brain Atlas data","Motif Z-scores stable across 3 null model choices (configuration, ER, spatial)"]}
    },
    {
      id: "n-pagerank",
      depends_on: ["f-spatial-domains"],
      title: "Spatial PageRank Paper",
      emoji: "⭐",
      desc: "PageRank identifies master regulators in the tissue microenvironment. Post-graduation.",
      category: "network", priority: "Post-grad",
      xp: 40,
      reward: "⭐ Post-graduation paper. Novel spatial master regulator identification method.",
      steps: [
        { id: "n-pr-1", title: "Run PageRank on the spatial gene-gene network", type: "code", desc: "Directed spatial co-expression network. PageRank: p_i = (1-d)/N + d * sum_j(p_j / C(j)) where C(j) = out-degree of j, d = 0.85 damping. High PageRank genes = master regulators.", checklist: ["Directed network built","PageRank converged (tolerance < 1e-6)","Top 20 PageRank genes identified","Cross-reference with known master regulators (STAT3, NFKB1, TP53 in probeset)"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "n-pr-2", title: "Run influence maximization on the subgraph", type: "code", desc: "Greedy algorithm: select seed set S to maximize activated nodes under independent cascade model. This identifies which genes, if targeted therapeutically, would most disrupt the disease network.", checklist: ["Independent cascade model implemented","Greedy seed selection (k=5 seeds)","Seed set interpreted biologically","Disease vs. CN network: do seed sets differ?"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: PageRank", items: ["PageRank results replicate when directed vs. undirected network used","Influence maximization seed sets differ between AD and CN (otherwise no disease specificity)"]}
    },
    {
      id: "n-tgn",
      depends_on: ["n-sir", "l-gnn"],
      title: "Temporal Graph Networks Paper",
      emoji: "⏳",
      desc: "TGN for modeling Braak stage progression. High learning curve. Post-graduation.",
      category: "network", priority: "Post-grad",
      xp: 50,
      reward: "⏳ Post-graduation flagship ML paper. Dynamic disease progression model.",
      steps: [
        { id: "n-tgn-1", title: "Prerequisite: GNN fundamentals", type: "learning", desc: "Before starting: complete learning plan GNN paper (Hamilton textbook + GNN papers). Target: build a simple GCN on CONCORD embedding as warm-up. Only advance when GCN runs correctly.", checklist: ["Hamilton GNN textbook Chapters 1-5 read","Simple GCN implemented on CONCORD embedding","GCN node classification AUC > 0.8 on held-out cells"], xp: 15, cognitive_type: "medium", estimated_blocks: 3 },
        { id: "n-tgn-2", title: "Model Braak stage as a temporal graph", type: "code", desc: "Model each Braak stage as a time snapshot. TGN: node features = cell states; edges = spatial neighbors; temporal signal = Braak progression.", checklist: ["TGN architecture implemented (PyTorch Geometric)","Braak stage encoding as temporal signal","Prediction: TGN predicts Braak stage from spatial cell state"], xp: 35, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: TGN Paper", items: ["TGN outperforms static GCN on Braak stage prediction (AUC improvement > 0.05)","Temporal attention weights show biologically interpretable early vs. late stage importance"]}
    },
    {
      id: "n-ven-ftd",
      title: "VEN/FTD Paper",
      emoji: "🧠",
      desc: "Dedicated VEN loss paper using FIC seqFISH data. Post-graduation priority #1.",
      category: "network", priority: "Post-grad",
      xp: 45,
      reward: "🧠 Post-graduation landmark paper. Seeley 2006 spatially replicated and extended.",
      steps: [
        { id: "n-ven-1", title: "Characterize VENs and their transcriptome", type: "code", desc: "Comprehensive VEN transcriptome from seqFISH. All differentially expressed genes in VENs vs. other L5 neurons. Pathway analysis. VEN-specific spatial signatures.", checklist: ["VEN transcriptome computed (pseudo-bulk)","VEN vs L5-IT DE analysis","Pathway enrichment in VEN-specific genes","Comparison to published VEN transcriptomics (Seeley 2012, Hodge 2019)"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "n-ven-2", title: "Score TDP-43 pathology signatures in remaining VENs", type: "code", desc: "TARDBP, FUS, UBQLN2, VCP expression in surviving VENs: bvFTD vs AD vs CN. Are surviving VENs transcriptionally stressed?", checklist: ["TARDBP/FUS module score per VEN","Comparison across disease groups","Effect size and permutation p-value","Figure: violin of TDP-43 module per VEN per disease group"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "n-ven-3", title: "Validate with IF: ADCYAP1/pTDP-43 on n=30", type: "wetlab", desc: "ADCYAP1 + phospho-TDP-43 (pS409/410) dual IF on n=30 FIC sections. Count VENs per mm². Test 56% depletion hypothesis in bvFTD. This IS the key validation for this paper.", checklist: ["IF run on n=10 bvFTD, n=10 AD, n=10 CN FIC sections","VEN density per mm² counted per section","Depletion index computed: DI ~ 0.56 in bvFTD (pre-registered prediction)","pTDP-43 inclusions in ADCYAP1+ cells quantified"], xp: 10, cognitive_type: "lab", compute_lead_hrs: 72 , estimated_blocks: 1, },
      ],
      gate: { title: "Gate: VEN/FTD Paper", items: ["IF wet lab DI ≈ 0.56 in bvFTD (replicates Seeley 2006)","VEN depletion is FIC-Layer-Va-specific — NOT seen in DLPFC or in other cortical layers of FIC","TDP-43 stress score elevated in surviving bvFTD VENs (Wilcoxon p < 0.05)"]}
    },
  ],

  // ============================================================
  package: [
    {
      id: "pkg-setup",
      title: "txomics: Repo Setup",
      emoji: "🏗️",
      desc: "Initialize txomics as public pip package. CI/CD, docs, FigureStyle skeleton.",
      category: "package", priority: "P0",
      xp: 20,
      reward: "🏗️ pip install txomics works. The package exists in the world.",
      steps: [
        { id: "pkg-s-1", title: "Set up the txomics repo scaffold", type: "code", desc: "Create txomics/ with pyproject.toml, src/txomics/__init__.py, tests/, docs/, .github/workflows/ci.yml. See P0_scaffold_and_infrastructure.md for exact structure.", checklist: ["pyproject.toml with all dependencies","GitHub Actions CI runs pytest on push","pre-commit hooks: black, ruff, mypy","Docs: MkDocs or Sphinx scaffold"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-s-2", title: "Build the FigureStyle plotting class", type: "code", desc: "txomics/plotting/figure_style.py: FigureStyle class with apply(), remove_chartjunk(), nature_width(), scale_bar() methods. Encodes all Nature journal figure conventions.", checklist: ["FigureStyle class implemented","nature_width(column='single') returns 88mm","Wong 8-color categorical palette as default","scale_bar() adds 50µm scale bar to spatial plots","Unit test: apply FigureStyle to a test figure, check output"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-s-3", title: "Verify pip install txomics works end-to-end", type: "code", desc: "Final check: fresh venv, pip install from GitHub, import txomics, run txomics.hello() or similar smoke test.", checklist: ["pip install succeeds in clean venv","import txomics works","At least one function runs without error","Package pushed to GitHub (PUBLIC)"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Gate: Package Setup", items: ["CI passes on GitHub","pip install succeeds from test PyPI or GitHub","FigureStyle produces figures that pass Nature figure guidelines"]}
    },
    {
      id: "pkg-decoding",
      depends_on: ["pkg-setup"],
      title: "txomics: Decoding Module",
      emoji: "🔢",
      desc: "seqFISH-specific decoding QC: FDR sweep, gene-stratified efficiency, matching rate.",
      category: "package", priority: "P0",
      xp: 20,
      reward: "🔢 Decoding QC is a one-function call. Others can use this.",
      steps: [
        { id: "pkg-d-1", title: "Build the dots.hdf5 reader", type: "code", desc: "txomics.io.read_dots_hdf5() reads dots.hdf5 and returns a DataFrame with correct column names. Handles edge cases: missing columns, wrong shapes.", checklist: ["Function works on actual dots.hdf5","Returns DataFrame with flux/peak/sharpness/roundness1/roundness2/area","Error message if expected columns missing"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-d-2", title: "Build the FDR sweep function", type: "code", desc: "txomics.qc.fdr_sweep(dots, thresholds, blank_genes) returns DataFrame of threshold vs. blank_rate, decode_yield. Includes plot function.", checklist: ["Function runs end-to-end","Output matches manual calculation","Plot function produces Nature-ready figure with FigureStyle"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-d-3", title: "Build the matching rate function", type: "code", desc: "txomics.qc.matching_rate(adata) computes decoded_dots/total_detected per cell. Adds to adata.obs['matching_rate']. Tests included.", checklist: ["Function adds matching_rate to adata.obs","Unit test with synthetic data","Result matches manual calculation on real data"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Gate: Decoding Module", items: ["All functions pass pytest unit tests","Docstrings complete with examples","Performance: fdr_sweep runs in < 30 seconds on full dots.hdf5"]}
    },
    {
      id: "pkg-spatial",
      depends_on: ["pkg-setup"],
      title: "txomics: Spatial Analysis",
      emoji: "🗺️",
      desc: "BANKSY wrapper, neighborhood composition, spatial autocorrelation, laminar assignment.",
      category: "package", priority: "P2",
      xp: 25,
      reward: "🗺️ Spatial analysis is reusable, documented, and ready for others.",
      steps: [
        { id: "pkg-sp-1", title: "Build the BANKSY wrapper", type: "code", desc: "txomics.spatial.banksy(adata, lambda_param, resolution) runs BANKSY and returns adata with domain labels in adata.obs['spatial_domain']. Lambda parameter documented.", checklist: ["BANKSY installed as dependency","Function runs on real data","Lambda parameter with recommended values documented","Example in docs"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "pkg-sp-2", title: "Build neighborhood composition", type: "code", desc: "txomics.spatial.neighborhood_composition(adata, radius, celltype_key) returns N_cells × N_celltypes composition matrix.", checklist: ["Radius parameter in µm (not pixels)","Handles edge cells correctly","Performance: < 60s for 50,000 cells"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-sp-3", title: "Compute Moran's I with effective N", type: "code", desc: "txomics.spatial.morans_i(adata, gene) returns I, p_value, n_effective. n_eff = n / (1 + 2*sum(rho_k)). Essential for spatial autocorrelation-corrected statistics.", checklist: ["Moran's I matches libpysal reference implementation","n_eff computed and returned","Permutation p-value option"], xp: 7, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Gate: Spatial Module", items: ["BANKSY wrapper produces same result as direct BANKSY on benchmark data (ARI within 0.02)","Moran's I matches libpysal on same data (tolerance 1e-4)"]}
    },
    {
      id: "pkg-deg",
      depends_on: ["pkg-setup", "pkg-decoding"],
      title: "txomics: Extended DEG",
      emoji: "📊",
      desc: "Five-level DEG framework packaged in txomics: pseudo-bulk DESeq2, per-cell mixed models, efficiency-corrected tests, spatial-aware DEGs, and cross-region meta-analysis. Every level takes efficiency_residual as a covariate so seqFISH detection bias cannot masquerade as biology.",
      category: "package", priority: "P3",
      xp: 25,
      reward: "📊 The most rigorous DE method for seqFISH. Published and used by others.",
      steps: [
        { id: "pkg-de-1", title: "Build pseudo-bulk DE (Level 1)", type: "code", desc: "txomics.de.pseudobulk_de(adata, group_key, covariate_keys) wraps DESeq2/pydeseq2. Returns results DataFrame with log2FC, padj, effect_size.", checklist: ["pydeseq2 installed as dependency","efficiency_residual supported as covariate","Returns tidy DataFrame with standard column names"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-de-2", title: "Build pathway coherence scoring (Level 2)", type: "code", desc: "txomics.de.pathway_coherence(de_results, gene_modules) computes coherence score for each DE gene. Returns de_results with coherence column.", checklist: ["Coherence score formula implemented correctly","gene_modules.md format supported","Example notebook in docs"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-de-3", title: "Build the full 5-level DEG pipeline", type: "code", desc: "txomics.de.extended_deg(adata, ...) runs all 5 levels sequentially and returns tiered results: primary (Levels 1-5), secondary (Levels 1-3), exploratory (Level 1 only).", checklist: ["All 5 levels integrated","Tiered results clearly labeled","Runtime < 10 minutes for typical dataset"], xp: 9, cognitive_type: "deep", compute_lead_hrs: 8 , estimated_blocks: 3, },
      ],
      gate: { title: "Gate: DEG Module", items: ["Extended DEG identifies fewer false positives than simple Wilcoxon on permuted-label negative control data","Pathway coherence scores are correlated with biological prior knowledge (enrichment of known AD genes in high-coherence hits)"]}
    },
    {
      id: "pkg-concord",
      depends_on: ["pkg-setup", "l-concord"],
      title: "txomics: CONCORD Tools",
      emoji: "🔮",
      desc: "CONCORD wrappers, efficiency batch handling, SAE interpretability tools.",
      category: "package", priority: "P4",
      xp: 20,
      reward: "🔮 Integration + interpretability tools shipped as reusable package.",
      steps: [
        { id: "pkg-co-1", title: "Build the CONCORD integration wrapper", type: "code", desc: "txomics.integration.run_concord(adata, batch_key, latent_dim) wraps CONCORD. Returns adata with X_concord in obsm. Efficiency batch handling documented.", checklist: ["Function runs on real data","LISI score computation included","Efficiency batch variable documented in tutorial"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "pkg-co-2", title: "Implement the SAE module", type: "code", desc: "txomics.interpretability.SparseAutoencoder(n_latent, n_features, lambda_l1). PyTorch implementation. Feature stability test included.", checklist: ["PyTorch dependency documented","Training loop with loss tracking","Feature interpretation helper: top_cells_per_feature()"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Gate: CONCORD Module", items: ["CONCORD wrapper reproduces published LISI scores on benchmark data","SAE training converges and produces stable features on real data"]}
    },
    {
      id: "pkg-network",
      depends_on: ["pkg-setup", "l-sir"],
      title: "txomics: Network Analysis",
      emoji: "🕸️",
      desc: "Unified network module in txomics: k-NN spatial graph builder, Newman assortativity, distance-kernel LR scoring, spatial SIR solver, and PageRank/influence maximization. One import path for every network analysis the lab uses downstream.",
      category: "package", priority: "P5",
      xp: 20,
      reward: "🕸️ All network methods packaged and ready for the field.",
      steps: [
        { id: "pkg-n-1", title: "Build the spatial graph builder", type: "code", desc: "txomics.network.build_spatial_graph(adata, method='knn', k=10) returns NetworkX graph or AnnData.obsp sparse matrix.", checklist: ["kNN and Delaunay options","Distance in µm","Symmetric adjacency matrix stored in obsp"], xp: 7, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-n-2", title: "Implement assortativity and SIR", type: "code", desc: "txomics.network.assortativity(graph, node_attr) returns r. txomics.network.sir_model(adata, ...) returns R0, beta, gamma per sample.", checklist: ["Assortativity matches NetworkX reference","SIR returns R0 with CI","Both have unit tests"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-n-3", title: "Implement the custom LR kernel", type: "code", desc: "txomics.network.lr_kernel(adata, lr_pairs, lambda_um=50) returns interaction score matrix.", checklist: ["lambda parameter in µm","LR pairs from CellChatDB loadable","Performance: < 60s for 50k cells × 200 LR pairs"], xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Gate: Network Module", items: ["Assortativity matches NetworkX on identical graph","SIR model R0 estimate matches analytical solution on toy SIR data"]}
    },
    {
      id: "pkg-plotting",
      depends_on: ["pkg-setup", "l-figdesign"],
      title: "txomics: FigureStyle & Plots",
      emoji: "🎨",
      desc: "FigureStyle class encoding Nature conventions. Full plotting library.",
      category: "package", priority: "P0",
      xp: 20,
      reward: "🎨 Every figure in the PhD is publication-ready by default.",
      steps: [
        { id: "pkg-pl-1", title: "Build the full FigureStyle class", type: "code", desc: "Complete FigureStyle with: apply() sets rcParams, scale_bar() with µm units, nature_width(col='single'/'double'), save_figure(svg=True, png=True, pdf=True, dpi=300).", checklist: ["All methods implemented","Unit test: save_figure() produces 3 files per call","Example gallery in docs"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "pkg-pl-2", title: "Build spatial visualization functions", type: "code", desc: "txomics.plotting.spatial_scatter(adata, color), spatial_domain_map(adata), cell_type_spatial(adata). All use FigureStyle defaults. Scale bar added automatically.", checklist: ["All 3 functions work","Scale bar in µm (using pixel_size parameter from AnnData)","Colors from Wong palette by default"], xp: 6, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-pl-3", title: "Define the statistical plot standards", type: "code", desc: "txomics.plotting.violin_with_points(), volcano_plot(), dot_plot(). All show individual data points for N≤20. All include effect size annotation.", checklist: ["violin_with_points shows raw data when N<=20","volcano_plot labels top genes automatically","dot_plot matches scanpy aesthetics but with FigureStyle"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Gate: Plotting Module", items: ["All plots pass blind review: 'would this pass Nature Methods figure guidelines?'","scale_bar() correctly converts pixel coordinates to µm using adata.uns['pixel_size']"]}
    },
    {
      id: "pkg-dashboard",
      depends_on: ["pkg-plotting", "c-p8"],
      title: "txomics: Dashboard Components",
      emoji: "📱",
      desc: "Five Quarto + Observable JS dashboards hosted on GitHub Pages: QC overview, cell-type atlas, spatial domains, disease contrasts, and LR/network explorer. Click-through from any figure to the exact cells and genes behind it.",
      category: "package", priority: "P7",
      xp: 25,
      reward: "📱 Interactive spatial atlas live on GitPages. Shareable with the world.",
      steps: [
        { id: "pkg-db-1", title: "Build the Efficiency Explorer dashboard", type: "code", desc: "Interactive: select cell type → see efficiency distribution. Quarto + Plotly. Data: pre-computed efficiency stats per cell type.", checklist: ["Dashboard loads in < 3s","Cell type selector works","Efficiency violin updates dynamically","Deployed to GitPages"], xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "pkg-db-2", title: "Build the Spatial Domain Browser", type: "code", desc: "Interactive tissue viewer: pan/zoom, color by domain/cell type/gene expression. Most useful dashboard — justify every widget.", checklist: ["Pan/zoom functional","Gene expression color toggle works","Domain label overlay toggleable","Data: efficient format (parquet/DuckDB, not full HDF5)"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "pkg-db-3", title: "Build the CONCORD Embedding Explorer, DE Browser, and CPS Map", type: "code", desc: "Three additional dashboards: (1) UMAP with cell type/disease/gene toggle, (2) DE gene browser with spatial plot linked, (3) CPS proxy spatial heatmap.", checklist: ["All 3 deployed to GitPages","Linked brushing between UMAP and spatial view (DE Browser)","CPS map shows slider for disease group filter"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Gate: Dashboards", items: ["All 5 dashboards load in < 5s on standard internet connection","Mobile-friendly layout (test on phone)","Each dashboard has a 'Why is this interactive?' justification in the README"]}
    },
    {
      id: "pkg-singularity",
      title: "Containerization (Singularity)",
      emoji: "🐳",
      desc: "Singularity container for reproducibility. NOT yet — wait 3 months.",
      category: "package", priority: "Later",
      xp: 15,
      reward: "🐳 Fully reproducible pipeline. Paper reviewers can re-run everything.",
      steps: [
        { id: "pkg-sing-1", title: "Prerequisites (unlock this step in 3 months)", type: "code", desc: "PREREQUISITE: Snakemake pipeline must be stable. Code must be on GitHub. At least P0-P5 cursor packets implemented. Only start this when the pipeline is stable enough to containerize.", checklist: ["Snakemake pipeline runs end-to-end","Code is on GitHub","P0-P5 cursor packets implemented"], xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "pkg-sing-2", title: "Write the Singularity/Apptainer definition file", type: "code", desc: "Write txomics.def: base image (Ubuntu 22.04), install Python + all deps, copy txomics package. Test on Caltech HPC cluster.", checklist: ["txomics.def builds without error","Container runs full pipeline on test data","Singularity image pushed to Zenodo or CVMFS"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Gate: Singularity", items: ["Container reproduces all main figures from raw data without manual intervention","Container runs on Caltech HPC cluster (SLURM)"]}
    },
  ],

  // ============================================================
  cursor: [
    {
      id: "c-p0",
      depends_on: ["pkg-setup"], title: "P0: Environment & Decoding QC", emoji: "🔧", category: "cursor", priority: "P0", xp: 25, reward: "🔧 Both repos initialized. FigureStyle class working. First QC figures made.",
      desc: "Repository setup (ad_seqfish_analysis + txomics), Python environment, dots.hdf5 reader, FDR sweep, decoding QC figures.",
      steps: [
        { id: "c-p0-1", title: "Cursor packet: P0_scaffold_and_infrastructure.md", type: "code", desc: "Follow P0 packet in Cursor. Key outputs: both repos initialized, conda/venv configured, FigureStyle class skeleton, RunContext class, AnnData schema defined.", checklist: ["Both repos on GitHub","conda env file committed","FigureStyle.apply() works","AnnData schema documented in README"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "c-p0-2", title: "Verify: dots.hdf5 loads + FDR sweep runs", type: "code", desc: "Run txomics.io.read_dots_hdf5() on actual data. Run txomics.qc.fdr_sweep(). Confirm outputs match known values (15.6% yield at FDR 0.05).", checklist: ["dots.hdf5 reads without error","FDR sweep produces expected decode yield","FDR sweep figure looks correct — matches expectations from existing analysis"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "P0 Gate", items: ["pip install -e . works in both repos","CI passes on GitHub Actions","FDR sweep figure is Nature-ready (FigureStyle applied)"]}
    },
    {
      id: "c-p1",
      depends_on: ["c-p0", "pkg-decoding"], title: "P1: Data Loading & QC", emoji: "🔵", category: "cursor", priority: "P1", xp: 25, reward: "🔵 Clean AnnData object. Every cell has quality scores.",
      desc: "HDF5 loader, transcript assignment, QC module, threshold sweep.",
      steps: [
        { id: "c-p1-1", title: "Cursor packet: P1_data_loading_and_qc.md", type: "code", desc: "Follow P1 packet. Key outputs: genexcell HDF5 loader, transcript-to-cell assignment, QC metrics per cell, CPS proxy scoring.", checklist: ["genexcell_p2.hdf5 loads (1,808,951 × 4)","QC metrics in adata.obs","CPS proxy scores computed","Ghost cells flagged"], xp: 25, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "P1 Gate", items: ["QC metrics pass sanity checks","Cell proportions match published snRNA-seq within 2-fold","CPS scores correlate with disease metadata direction"]}
    },
    {
      id: "c-p2",
      depends_on: ["c-p1", "m-eef2"], title: "P2: Efficiency & Normalization", emoji: "⚡", category: "cursor", priority: "P2", xp: 25, reward: "⚡ Efficiency confound characterized. Normalization pipeline locked.",
      desc: "EEF2 efficiency map, gene-stratified FDR, CONCORD efficiency correction.",
      steps: [{ id: "c-p2-1", title: "Cursor packet: P2_efficiency_and_normalization.md", type: "code", desc: "Follow P2 packet. EEF2 efficiency regression, efficiency_residual computed, CONCORD with efficiency_group as batch variable.", checklist: ["efficiency_residual in adata.obs","R² of cell-type efficiency model > 0.3","CONCORD runs with efficiency batch correction","LISI score > 0.5 after correction"], xp: 25, cognitive_type: "deep" }],
      estimated_blocks: 6,
      gate: { title: "P2 Gate", items: ["R² > 0.3 (cell type explains efficiency)","Permutation p < 0.001","LISI score improvement after CONCORD vs. before"]}
    },
    {
      id: "c-p3",
      depends_on: ["c-p2"], title: "P3: Clustering & Cell Types", emoji: "🧩", category: "cursor", priority: "P3", xp: 30, reward: "🧩 Cell type atlas complete. Pipeline paused for your validation.",
      desc: "CONCORD+Harmony clustering, cortical layer assignment, CPS proxy score.",
      steps: [
        { id: "c-p3-1", title: "Cursor packet: P3_clustering_and_cell_types.md", type: "code", desc: "Leiden clustering, cell type annotation, laminar assignment, subclustering.", checklist: ["Cell types annotated","Laminar assignment done","Subclusters: eN laminar, microglia states, astrocyte states","PIPELINE PAUSED — user validates annotations before advancing"], xp: 25, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "c-p3-2", title: "USER VALIDATION CHECKPOINT", type: "validation", desc: "Inspect UMAP colored by marker gene expression. Inspect spatial plots with cell type overlays. Validate that FIC shows no L4 RORB+ band. Validate VENs appear only in FIC Layer Va. Sign off before advancing.", checklist: ["UMAP inspected","Spatial tissue plots inspected","FIC L4 absence confirmed","VEN spatial specificity confirmed","Written sign-off recorded in notebook"], xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "P3 Gate", items: ["User has explicitly validated cell type annotations","All laminar marker genes show expected spatial gradient","Cell type proportions within 2-fold of Mathys 2019"]}
    },
    {
      id: "c-p4",
      depends_on: ["c-p3", "pkg-deg"], title: "P4: Differential Expression", emoji: "📊", category: "cursor", priority: "P4", xp: 30, reward: "📊 Extended DEG framework run. Disease signatures characterized.",
      desc: "5-level DEG pipeline: pseudo-bulk → pathway coherence → spatial coherence → cell-type decomposition → cross-region.",
      steps: [{ id: "c-p4-1", title: "Cursor packet: P4_differential_expression.md", type: "code", desc: "All 5 DE levels run. Primary, secondary, exploratory tiers established.", checklist: ["All 5 levels completed","Primary DE gene list established","Pathway coherence scores computed","Cross-region replication tested"], xp: 30, cognitive_type: "deep" }],
      estimated_blocks: 6,
      gate: { title: "P4 Gate", items: ["No primary DE gene is in efficiency artifact list","Effect sizes reported for all primary claims","Permutation FDR matches nominal FDR"]}
    },
    {
      id: "c-p5",
      depends_on: ["c-p4", "m-lr"], title: "P5: Spatial Domains & LR", emoji: "🗺️", category: "cursor", priority: "P5", xp: 30, reward: "🗺️ Tissue map complete. Cell-cell communication characterized.",
      desc: "Cursor packet P5: BANKSY spatial domains at multiple lambda, distance-kernel LR interactions, and subcellular RNA localization. Outputs DESDs (disease-enriched spatial domains) and DAM-neuron niche calls ready for the flagship figures.",
      steps: [{ id: "c-p5-1", title: "Cursor packet: P5_spatial_domains_and_LR.md", type: "code", desc: "BANKSY run, DESDs identified, LR kernel analysis completed.", checklist: ["BANKSY domains computed","DESDs identified and annotated","LR interactions computed with distance kernel","DAM-neuron niche analysis done"], xp: 30, cognitive_type: "deep" }],
      estimated_blocks: 6,
      gate: { title: "P5 Gate", items: ["DESDs replicate in both cohorts","BANKSY lambda chosen via ARI on benchmark data","Top LR interactions validated against CellChat"]}
    },
    {
      id: "c-p6",
      depends_on: ["c-p2", "l-concord"], title: "P6: Integration & Embedding", emoji: "🔮", category: "cursor", priority: "P6", xp: 25, reward: "🔮 Multi-sample integration locked. SAE features interpretable.",
      desc: "Cursor packet P6: multi-sample CONCORD integration with LISI>0.5, then a sparse autoencoder over the latent space. Labels the top disease-relevant SAE features and flags any driven by efficiency so interpretation is not an artifact of technical batch.",
      steps: [{ id: "c-p6-1", title: "Cursor packet: P6_integration_and_embedding.md", type: "code", desc: "Full multi-sample CONCORD, LISI validation, SAE training and feature interpretation.", checklist: ["CONCORD LISI > 0.5","SAE stable features identified","Top 5 disease-relevant features labeled","Efficiency-technical features flagged"], xp: 25, cognitive_type: "deep" }],
      estimated_blocks: 6,
      gate: { title: "P6 Gate", items: ["LISI > 0.5 after integration","≥5 stable SAE features with biological labels","No top features driven by efficiency (|r| < 0.3)"]}
    },
    {
      id: "c-p7",
      depends_on: ["c-p3", "l-gut2018"], title: "P7: Ghost Cells & DAPI", emoji: "👻", category: "cursor", priority: "P7", xp: 25, reward: "👻 Ghost cell biology characterized. DAPI texture pipeline working.",
      desc: "Ghost cell H1/H2/H3 hypotheses, nuclear morphology, ghost classifier.",
      steps: [{ id: "c-p7-1", title: "Cursor packet: P7_ghost_cells_and_DAPI.md", type: "code", desc: "DAPI feature extraction, spatial independence test, GMM classifier.", checklist: ["DAPI features extracted","Spatial independence test passed (ghost cells not probe artifacts)","GMM classifier run with BIC-chosen K","Ghost cell types labeled"], xp: 25, cognitive_type: "deep" }],
      estimated_blocks: 6,
      gate: { title: "P7 Gate", items: ["Spatial independence test: r near 0 (ghost cells not probe artifacts)","GMM components interpretable (CASP3+ in apoptotic component)","Ghost cell fraction consistent across donors (<5% variance)"]}
    },
    {
      id: "c-p8",
      depends_on: ["c-p4", "c-p5", "c-p6", "c-p7"], title: "P8: Snakemake & HPC + Dashboards", emoji: "🚀", category: "cursor", priority: "P8", xp: 30, reward: "🚀 Reproducible pipeline. Everything deployed. Code on GitHub.",
      desc: "Cursor packet P8: Snakemake s00-s20 pipeline with a Caltech-HPC SLURM config, dry-run green, and all five dashboards live on GitHub Pages. txomics + analysis repos public with a Zenodo DOI for the data release.",
      steps: [
        { id: "c-p8-1", title: "Cursor packet: P8_snakemake_and_hpc.md", type: "code", desc: "Snakemake pipeline s00-s20. SLURM configuration for Caltech HPC. Full dry-run passes.", checklist: ["Snakemake dry-run passes","SLURM config tested on cluster","Pipeline runs from raw data to final figures"], xp: 15, cognitive_type: "deep", compute_lead_hrs: 8, estimated_blocks: 6 },
        { id: "c-p8-2", title: "GitPages dashboards live", type: "code", desc: "All 5 dashboards deployed. txomics package on GitHub. Analysis repo documentation complete.", checklist: ["All 5 dashboards live on GitPages","txomics README clear for external users","Analysis repo README has reproduction instructions","Zenodo DOI created for data release"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "P8 Gate", items: ["Full pipeline runs on Caltech HPC cluster from scratch","All dashboards load in < 5s","Zenodo DOI created and cited in manuscript"]}
    },
  ],

  // ============================================================
  learning: [
    {
      id: "l-seqfish", title: "seqFISH+ (Eng 2019)", emoji: "📄", category: "learning", priority: "Foundation", xp: 10,
      reward: "📄 Platform foundation locked. You understand your data at the method level.",
      desc: "Long Cai / Lubeck lab's foundational seqFISH+ paper (Eng et al. 2019 Science). Read it closely, then implement a single-hyb toy decoder so the encoding, barcode matching, and FDR math are truly understood at a reviewer-grade level.",
      steps: [
        { id: "l-sf-1", title: "Read full paper + methods", type: "learning", desc: "Read Eng et al. 2019 Science. Focus: encoding strategy, barcode design, error correction, FDR computation, decoding pipeline. Take notes on every step that generates a parameter you use.", checklist: ["Paper read with active notes","Encoding strategy understood","FDR computation understood","Notes: how does the decoder fail?"], xp: 5, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-sf-2", title: "Implement a toy decoder (1 hyb round)", type: "code", desc: "Implement a simplified version of the seqFISH barcode matching for 1 hybridization round from scratch (Python). This forces deep understanding of the decoding logic.", checklist: ["Toy decoder implemented","Correct barcodes decoded from synthetic data","Error rate tested at different noise levels"], xp: 5, cognitive_type: "deep", compute_lead_hrs: 24 , estimated_blocks: 2, },
      ],
      gate: { title: "Mastery Gate", items: ["Can explain the seqFISH encoding strategy to a non-expert in 5 minutes","Understands why FDR = blank_barcode_rate / (signal_rate + blank_rate) — not just a threshold"]}
    },
    {
      id: "l-mathys19", title: "Mathys 2019 snRNA-seq AD", emoji: "📄", category: "learning", priority: "Foundation", xp: 8,
      reward: "📄 Your baseline comparison locked. You know what Mathys found that you need to replicate or extend.",
      desc: "First large-scale snRNA-seq of AD human brain. Your spatial data should replicate and extend this.",
      steps: [
        { id: "l-m19-1", title: "Read paper + extract key DE gene lists", type: "learning", desc: "Read Mathys et al. 2019 Nature. Extract: (1) top DE genes per cell type in AD, (2) cell type proportions in AD vs CN, (3) key pathway findings. This becomes your positive control list.", checklist: ["Paper read","Top DE genes per cell type extracted to a file","Cell type proportions noted","3 key findings from paper listed"], xp: 5, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-m19-2", title: "Run a replication test (positive control)", type: "code", desc: "Run your DE analysis. Check: do Mathys 2019 top DE genes also show up as DE in your data? If yes: positive control passes. If not: investigate why (N, cohort, platform differences).", checklist: ["Mathys top 20 DE genes checked in your results","Replication rate reported (% of Mathys genes DE in your data)","Discrepancies documented and explained"], xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: [">50% of Mathys top-20 AD DE genes replicate in your data (directionally consistent)","Can explain 3 key differences between snRNA-seq and seqFISH that would cause discrepancies"]}
    },
    {
      id: "l-banksy", title: "BANKSY (Singhal 2024)", emoji: "📄", category: "learning", priority: "High", xp: 8,
      desc: "Spatial clustering with neighborhood averaging. Your primary spatial domain tool.",
      reward: "📄 BANKSY mastered. Spatial domains will be biologically coherent.",
      steps: [
        { id: "l-b-1", title: "Read BANKSY paper", type: "learning", desc: "Singhal et al. 2024 Nature Genetics. Focus: what does lambda control? How does neighborhood averaging improve clustering vs. single-cell expression alone?", checklist: ["Paper read","Lambda parameter effect understood","Benchmark results noted (ARI on Maynard 2021 DLPFC data)"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-b-2", title: "Run BANKSY on benchmark data (Maynard 2021)", type: "code", desc: "Download Maynard 2021 DLPFC data. Run BANKSY. Compute ARI vs. manual layer labels. Sweep lambda. This is both learning AND benchmarking for txomics.", checklist: ["Maynard 2021 data downloaded","BANKSY run with lambda sweep","ARI plotted vs lambda","Best lambda documented"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can explain the BANKSY objective function in plain language","ARI on Maynard 2021 data > 0.4 (matches published benchmark)"]}
    },
    {
      id: "l-concord", title: "CONCORD (Li et al.)", emoji: "📄", category: "learning", priority: "High", xp: 8,
      desc: "Contrastive learning for single-cell integration. Your integration tool AND the basis for SAE paper.",
      reward: "📄 CONCORD mastered. Integration is principled, not a black box.",
      steps: [
        { id: "l-c-1", title: "Read CONCORD paper", type: "learning", desc: "Focus: contrastive loss function, what makes a positive pair, temperature parameter, how efficiency_group can be used as batch variable.", checklist: ["Paper read","Contrastive loss understood","Positive pair definition understood","Batch variable usage documented"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-c-2", title: "Run CONCORD on toy data with known batch structure", type: "code", desc: "Simulate a dataset with known batch and biological structure. Run CONCORD. Verify: LISI score improves after correction. Biological signal is retained (cell types still separable).", checklist: ["CONCORD runs on simulated data","LISI before vs after computed","Cell type ARI after CONCORD > before"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can explain why LISI > 0.5 means good batch mixing","Understands why efficiency_group is treated as a batch variable (not a biological variable)"]}
    },
    {
      id: "l-eef2", title: "EEF2 / Efficiency Literature", emoji: "📄", category: "learning", priority: "High", xp: 8,
      desc: "Transcript efficiency in spatial transcriptomics. Foundation for the EEF2 paper.",
      reward: "📄 Efficiency literature mastered. Paper 1 hypothesis is bulletproof.",
      steps: [
        { id: "l-e-1", title: "Read Codeluppi 2018 + relevant efficiency papers", type: "learning", desc: "Codeluppi et al. 2018 Nature Methods (osmFISH). Qian et al. 2020 Nature Methods. Focus: how efficiency is measured, reported, and corrected in published work.", checklist: ["Codeluppi 2018 read","Qian 2020 read","Notes: how do other groups handle efficiency variation?","Gaps identified: what has not been done (your paper's contribution)"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-e-2", title: "Read HRT Atlas (housekeeping gene database)", type: "learning", desc: "HRT Atlas v1.0 (Hounkpe et al. 2021). Extract list of validated housekeeping genes. Check which are in your probeset. These are your positive control for efficiency correction.", checklist: ["HRT Atlas accessed","Housekeeping genes in probeset identified","List saved to file for use in EEF2 paper benchmarking"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can state 3 reasons why EEF2 might NOT be a universal housekeeping gene","Can name 5 housekeeping genes in your probeset with HRT Atlas evidence"]}
    },
    {
      id: "l-gut2018", title: "Gut et al. 2018 (4i)", emoji: "📄", category: "learning", priority: "Mid", xp: 5,
      desc: "Multiplexed protein maps linking subcellular organization to cell states.",
      reward: "📄 Conceptual bridge between DAPI chromatin features and cell state established.",
      steps: [{ id: "l-g-1", title: "Read Gut 2018", type: "learning", desc: "Focus: how subcellular protein localization links to cell state. Apply conceptual framework to DAPI texture as chromatin compaction proxy.", checklist: ["Paper read","3 key conceptual bridges to your DAPI paper noted"], xp: 5, cognitive_type: "medium" }],
      estimated_blocks: 2,
      gate: { title: "Mastery Gate", items: ["Can explain how Gut 2018's subcellular organization concept motivates the DAPI texture analysis"]}
    },
    {
      id: "l-nuspire", title: "NuSPIRe (Spatial AD)", emoji: "📄", category: "learning", priority: "High", xp: 7,
      desc: "Your closest competitor. Know exactly where your seqFISH work goes beyond this.",
      reward: "📄 Competitor landscape known. Your unique contributions are clearly defined.",
      steps: [
        { id: "l-n-1", title: "Read NuSPIRe paper", type: "learning", desc: "Read carefully. Build comparison table: what they found vs. what you expect to find. What does seqFISH resolution give you that 10x Visium cannot?", checklist: ["Paper read","Comparison table: NuSPIRe vs your seqFISH work","Unique contributions of seqFISH listed (cell-level resolution, laminar, 1193 genes, FIC region)"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-n-2", title: "Replication check: do their key findings appear in your data?", type: "code", desc: "Run a quick check of NuSPIRe's top reported spatial gene expression patterns. If they appear in your data: positive control. If not: investigate.", checklist: ["NuSPIRe top findings checked in your data","Discrepancies documented (platform vs. biology)"], xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can articulate in one paragraph: what does your work add beyond NuSPIRe?"]}
    },
    {
      id: "l-sir", title: "SIR / Network Epidemiology", emoji: "📄", category: "learning", priority: "Mid", xp: 7,
      desc: "Classical SIR dynamics from Keeling & Rohani Ch 2-3: derive R_0, implement the ODEs with scipy, and plot S/I/R curves across a range of R_0. Foundation for the spatial microglial-spread epidemic paper.",
      reward: "📄 SIR model mastered. Neuroinflammation-as-epidemic paper can be implemented.",
      steps: [
        { id: "l-sir-1", title: "Read Keeling & Rohani Chapters 2-3", type: "learning", desc: "Textbook: 'Modeling Infectious Diseases' Ch 2-3. Derive R_0 from first principles. Understand stability analysis (endemic equilibrium).", checklist: ["Chapters 2-3 read","R_0 derived from scratch (on paper)","Stability condition understood: R_0 > 1 = epidemic"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-sir-2", title: "Implement SIR numerically (ODE solver)", type: "code", desc: "Implement classical SIR with scipy.integrate.odeint. Plot S/I/R curves for R_0 = 0.5, 1.0, 1.5, 2.0, 3.0. This is the foundation for the spatial SIR model.", checklist: ["SIR ODEs implemented","Curves for 5 R_0 values plotted","Phase portrait (S vs I) plotted"], xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can derive R_0 analytically from the SIR ODEs","Can explain why the spatial extension requires MLE/MCMC rather than analytical R_0"]}
    },
    {
      id: "l-gnn", title: "Graph Neural Networks", emoji: "📄", category: "learning", priority: "Mid", xp: 10,
      desc: "GNN fundamentals. Required prerequisite before the Temporal Graph Networks paper.",
      reward: "📄 GNN unlocked. Post-graduation Temporal GNN paper is reachable.",
      steps: [
        { id: "l-gnn-1", title: "Read Hamilton GNN textbook Ch 1-5", type: "learning", desc: "Read Hamilton 'Graph Representation Learning' Ch 1-5. Key concepts: message passing, graph convolution, GAT (graph attention), readout functions.", checklist: ["Chapters 1-5 read","Message passing equation written from memory","GAT vs GCN difference understood"], xp: 5, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-gnn-2", title: "Implement GCN on CONCORD embedding", type: "code", desc: "Build simple 2-layer GCN using PyTorch Geometric. Input: CONCORD latent vectors as node features, spatial kNN graph as edges. Task: predict cell type. AUC > 0.8.", checklist: ["GCN implemented in PyTorch Geometric","Cell type prediction AUC > 0.8","Loss curve shows convergence"], xp: 5, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["GCN cell type prediction AUC > 0.8 on held-out cells","Can explain message passing in one paragraph"]}
    },
    {
      id: "l-sae", title: "Sparse Autoencoders (SAE)", emoji: "📄", category: "learning", priority: "Mid", xp: 8,
      desc: "SAE for latent space interpretability. Foundation for CONCORD interpretability paper.",
      reward: "📄 SAE mastered. CONCORD interpretability paper can be implemented.",
      steps: [
        { id: "l-sae-1", title: "Read Bricken et al. 2023 (Anthropic Monosemanticity)", type: "learning", desc: "The foundational SAE interpretability paper. Focus: why L1 sparsity produces monosemantic features, feature frequency vs interpretability tradeoff.", checklist: ["Paper read","Monosemanticity concept understood","L1 penalty effect on feature sparsity understood"], xp: 4, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-sae-2", title: "Implement SAE on CONCORD latent vectors", type: "code", desc: "PyTorch SAE on your CONCORD latent vectors. Lambda sweep. Identify top 5 stable features. Label them biologically.", checklist: ["SAE trains and loss converges","Lambda sweep plotted","5 stable features labeled with biological hypothesis"], xp: 4, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["SAE produces at least 3 features that are recognizably biological (correlate with known gene modules)","Feature stability test passes: cos_sim > 0.85 for top 3 features across 5 random seeds"]}
    },
    {
      id: "l-assortativity", title: "Network Assortativity Theory", emoji: "📄", category: "learning", priority: "High", xp: 6,
      desc: "Newman assortativity coefficient. Foundation for assortativity biomarker paper.",
      reward: "📄 Assortativity theory mastered. Biomarker paper can be implemented.",
      steps: [
        { id: "l-ass-1", title: "Read Newman 2003 Physical Review Letters", type: "learning", desc: "THE assortativity paper. Understand the formula from first principles — not just how to use the function.", checklist: ["Paper read","Formula derived on paper","Intuition: what does r = 0.5 mean biologically?"], xp: 3, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-ass-2", title: "Implement assortativity on spatial graph", type: "code", desc: "Compute assortativity on a simple test graph using the formula directly (not just networkx.degree_assortativity_coefficient). Verify matches NetworkX.", checklist: ["Formula implemented from scratch","Result matches NetworkX","Applied to 2 samples from your data: what is r?"], xp: 3, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["Can derive the Newman assortativity formula from the definition of Pearson correlation on edge endpoints","Manual implementation matches NetworkX (tolerance 1e-4)"]}
    },
    {
      id: "l-figdesign", title: "Figure Design (Nature/Science)", emoji: "📄", category: "learning", priority: "Mid", xp: 5,
      desc: "Rougier 2014 PLoS CB 'Ten Simple Rules for Better Figures' plus the Krzywinski & Altman Points of View series, then reproduce one published Nature Methods figure in matplotlib via the FigureStyle class. Calibrates the 3-second 'looks like Nature' test.",
      reward: "📄 Figure design mastered. FigureStyle class reflects real expertise.",
      steps: [
        { id: "l-fd-1", title: "Read Rougier et al. 2014 + Krzywinski & Altman", type: "learning", desc: "Rougier et al. 2014 PLoS Comp Biol 'Ten Simple Rules for Better Figures'. Krzywinski & Altman 2013 Nature Methods 'Points of View' series.", checklist: ["Rougier 2014 read","Krzywinski series read (at least 5 columns)","Checklist: 5 rules implemented in your FigureStyle class"], xp: 3, cognitive_type: "medium", estimated_blocks: 2 },
        { id: "l-fd-2", title: "Reproduce one Nature Methods figure", type: "code", desc: "Pick any figure from a published Nature Methods paper. Reproduce it exactly in matplotlib using FigureStyle. This calibrates your sense of 'publication quality'.", checklist: ["Target figure chosen and documented","Reproduction attempted","Self-assessment: does it look like the original?"], xp: 2, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Mastery Gate", items: ["FigureStyle class passes the '3-second test': figures look like a Nature paper at first glance"]}
    },
  ],

  // ============================================================
  career: [
    {
      id: "car-thesis",
      depends_on: ["f-write"], title: "Thesis Chapter 1 Draft", emoji: "📝", category: "career", priority: "Nov 2026", xp: 40,
      desc: "Flagship DLPFC+FIC AD spatial atlas results written up as thesis Chapter 1. Advisor-approved outline first, then a full draft that leans on BIO_BACKGROUND.md for intro and cites the txomics methods paper for its pipeline.",
      reward: "📝 First thesis chapter submitted to advisor.",
      steps: [
        { id: "car-t-1", title: "Get the thesis outline approved", type: "writing", desc: "Submit thesis outline to advisor. Get approval on chapter organization before writing.", checklist: ["Outline includes 3-4 chapters","Chapter 1 = flagship paper","Chapters 2-3 = methods papers","Advisor has approved outline in writing"], xp: 5, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "car-t-2", title: "Submit the Chapter 1 draft", type: "writing", desc: "Write Chapter 1 based on flagship paper manuscript. Use BIO_BACKGROUND.md for introduction.", checklist: ["Draft submitted to advisor","Biological context from BIO_BACKGROUND.md integrated","Methods section references txomics package","All main figures included"], xp: 35, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: Chapter 1", items: ["Advisor approves chapter draft","All figures pass Nature figure standards"]}
    },
    {
      id: "car-github", title: "Code on GitHub", emoji: "🐙", category: "career", priority: "ASAP", xp: 15,
      desc: "Move both repos off the Caltech server and into GitHub: txomics public with a green CI badge and working pip install from main, ad_seqfish_analysis private with pinned txomics version. Portfolio piece for Altos, Genentech, and Illumina applications.",
      reward: "🐙 Code is backed up, version-controlled, and ready for job applications.",
      steps: [
        { id: "car-g-1", title: "Publish the txomics repo on GitHub", type: "code", desc: "Initialize txomics repo, push to GitHub as PUBLIC. This is your portfolio piece for Altos/Genentech/Illumina.", checklist: ["git init + push done","README is clear for external users","pip install from GitHub works","CI badge in README"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "car-g-2", title: "Push the ad_seqfish_analysis repo privately to GitHub", type: "code", desc: "Initialize analysis repo, push to GitHub as PRIVATE. Document dependencies on txomics.", checklist: ["Private repo created","All analysis notebooks committed","Requirements.txt or pyproject.toml complete","README: 'this repo uses txomics v0.x.x'"], xp: 7, cognitive_type: "deep", estimated_blocks: 3 },
      ],
      gate: { title: "Gate: GitHub", items: ["pip install txomics from GitHub works in a clean venv","Analysis repo README clearly describes how to reproduce main results"]}
    },
    {
      id: "car-preprint",
      depends_on: ["f-write", "m-eef2"], title: "First Preprint (bioRxiv)", emoji: "📬", category: "career", priority: "2026", xp: 40,
      desc: "EEF2 efficiency paper or tissue assortativity paper as first solo preprint.",
      reward: "📬 First preprint live. You are a published first author.",
      steps: [
        { id: "car-pre-1", title: "Finish the paper manuscript (EEF2 or Assortativity)", type: "writing", desc: "Full manuscript: title, abstract, intro, methods, results, discussion, figures (Nature format). All robustness gates passed.", checklist: ["All robustness gates passed","Statistical checklist completed","Figures: Nature-ready","Advisor has reviewed and approved for submission"], xp: 25, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "car-pre-2", title: "Submit to bioRxiv", type: "writing", desc: "Submit to bioRxiv. Post on Twitter/X and LinkedIn. Email to 3 people who might cite it.", checklist: ["bioRxiv submission completed","DOI obtained","Announced on social media","Code and data on Zenodo"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: Preprint", items: ["Advisor has reviewed and approved","Robustness and validation checklist fully completed","Code deposited on Zenodo with DOI"]}
    },
    {
      id: "car-defense",
      depends_on: ["car-thesis", "car-preprint"], title: "PhD Defense", emoji: "🎓", category: "career", priority: "Nov 2026", xp: 80,
      desc: "Caltech Bioengineering PhD defense targeting November 2026. Thesis submitted to the committee at least two weeks ahead, public talk scheduled, and closed-door Q&A passed.",
      reward: "🎓 DR. RAHMA. You did it.",
      steps: [
        { id: "car-d-1", title: "Submit the thesis to the committee", type: "writing", desc: "Full thesis (3-4 chapters) submitted to committee. Minimum 2 weeks before defense.", checklist: ["All chapters approved by advisor","Formatting requirements met","Submitted to committee 2+ weeks before defense"], xp: 30, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "car-d-2", title: "Give the defense presentation", type: "writing", desc: "45-minute presentation + Q&A. Practice with lab 2× before. Prepare for hardest questions from robustness_and_validation.md universal critiques.", checklist: ["2 practice talks done","Answers to top 10 reviewer critiques prepared","Slides reviewed by advisor"], xp: 30, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "car-d-3", title: "Pass the defense and submit revisions", type: "writing", desc: "Defense passed. Committee revisions (if any) completed and submitted. Degree conferred.", checklist: ["Defense passed","All revisions completed","Degree conferred by Caltech Registrar"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: Defense", items: ["Flagship paper published or under review","At least 1 methods paper submitted or published","All committee members have pre-approved the thesis"]}
    },
    {
      id: "car-txomics-release",
      depends_on: ["pkg-dashboard", "pkg-singularity"], title: "txomics Public Release", emoji: "🚀", category: "career", priority: "2026", xp: 25,
      desc: "Public pip release of txomics. Documentation, tutorials, GitPages site.",
      reward: "🚀 txomics is live on PyPI. Signals engineering value to Altos/Genentech/Illumina.",
      steps: [
        { id: "car-tx-1", title: "Release v1.0 on PyPI", type: "code", desc: "Final documentation pass, tests at >80% coverage, version 1.0.0 released on PyPI.", checklist: ["All public functions documented","Test coverage > 80%","pip install txomics works from PyPI","CHANGELOG.md written"], xp: 15, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "car-tx-2", title: "Announce and reference usage in the paper Methods", type: "writing", desc: "Announce on Twitter/X. GitPages site live with interactive demo. Cited in flagship paper Methods as 'analyses performed using txomics (github.com/rahma/txomics)'.", checklist: ["Announcement posted","GitPages site live","Cited in flagship paper Methods section"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Gate: txomics Release", items: ["pip install txomics && python -c 'import txomics; print(txomics.__version__)' works","GitPages interactive demo loads in < 5s"]}
    },
    {
      id: "car-apps", title: "Industry Applications", emoji: "💼", category: "career", priority: "Late 2026", xp: 30,
      desc: "Apply to Altos Labs, Genentech, Illumina. Southern California hybrid roles.",
      reward: "💼 Applications submitted. The end is in sight.",
      steps: [
        { id: "car-a-1", title: "Assemble the portfolio", type: "writing", desc: "Portfolio includes: txomics GitHub (public), flagship paper (preprint or published), 1-2 methods papers, GitPages dashboard, LinkedIn updated.", checklist: ["txomics GitHub polished","Flagship paper preprint live","LinkedIn updated with PhD work","1-page research summary written"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "car-a-2", title: "Submit the applications", type: "writing", desc: "Apply to Altos Labs (ML Scientist), Genentech (Computational Neuroscience), Illumina (Spatial Genomics). Tailored cover letter for each.", checklist: ["Altos Labs application submitted","Genentech application submitted","Illumina application submitted","3 references contacted and confirmed"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
      ],
      gate: { title: "Gate: Applications", items: ["PhD defense date confirmed","At least 1 paper published or under review at Nature-tier journal"]}
    },
    {
      id: "car-offer", title: "Offer Accepted 🎉", emoji: "🏆", category: "career", priority: "2027", xp: 100,
      desc: "The finish line. Scientist/ML role at Altos, Genentech, or Illumina.",
      reward: "🏆 DR. RAHMA. Scientist at [Company]. Southern California. You did the thing.",
      steps: [
        { id: "car-o-1", title: "Offer received and negotiated", type: "career", desc: "Offer received. Negotiate: title, salary, lab independence, publication rights. Consult advisor and peers on offer terms.", checklist: ["Offer received","Salary benchmarked (Levels.fyi, ask postdocs/peers)","Negotiation attempt made","Offer signed"], xp: 50, cognitive_type: "deep", estimated_blocks: 2 },
        { id: "car-o-2", title: "Start date confirmed. YOU DID IT. 🎉", type: "career", desc: "Start date confirmed. Give yourself 2 weeks off. You spent 5+ years on this. Celebrate properly.", checklist: ["Start date confirmed","2 weeks off taken","Celebrate with people who matter"], xp: 50, cognitive_type: "deep", estimated_blocks: 2 },
      ],
      gate: { title: "Final Gate", items: ["This is the last gate. There are no more gates. YOU WIN."]}
    },
  ],

  // ============================================================
  // OPTIONAL METHODS PAPER: CONCORD SAE Interpretability
  // Sparse autoencoder over the CONCORD latent space.
  // Ranked third additional paper in the portfolio (methods, medium-risk).
  // ============================================================
  concord_sae: [
    {
      id: "sae-arch",
      depends_on: ["c-p6"],
      title: "SAE Architecture & Training",
      emoji: "🧠",
      desc: "PyTorch sparse autoencoder on frozen CONCORD embeddings. Top-k or L1 sparsity, width 4-16x latent dim, multi-seed training for feature stability.",
      category: "concord_sae", priority: "Mid",
      xp: 25,
      reward: "🧠 Stable SAE features trained on CONCORD latents. Feature dictionary saved for downstream interpretation.",
      steps: [
        { id: "sae-a-1", title: "Implement the PyTorch SAE", type: "code", desc: "Encoder + decoder + top-k or L1 sparsity. Width sweep 4x, 8x, 16x latent dim. Reconstruction loss + sparsity regularizer. Train on frozen CONCORD embeddings.", checklist: ["Top-k and L1 variants implemented", "Width sweep run", "Reconstruction R² > 0.9 at chosen width", "Dead-feature rate < 10%"], xp: 12, cognitive_type: "deep", estimated_blocks: 5 },
        { id: "sae-a-2", title: "Run multi-seed stability analysis", type: "code", desc: "Train 5 seeds. Match features across seeds by cosine similarity. Only features stable across ≥4 seeds (cos>0.8) enter the final feature set.", checklist: ["5 seeds trained", "Feature matching implemented", "Stability threshold applied", "Final feature count reported"], xp: 13, cognitive_type: "deep", estimated_blocks: 5 },
      ],
      gate: { title: "SAE Training Gate", items: ["Reconstruction R² > 0.9", "At least 5 seeds trained with >80% feature overlap", "Dead-feature rate documented"] }
    },
    {
      id: "sae-interp",
      depends_on: ["sae-arch"],
      title: "Sparse Feature Interpretation",
      emoji: "🔍",
      desc: "Map each stable SAE feature to cell types, spatial domains, and disease states. Flag features that correlate with efficiency_residual so they can be excluded from biological claims.",
      category: "concord_sae", priority: "Mid",
      xp: 25,
      reward: "🔍 Top features labeled. Disease-relevant features separated from technical efficiency features.",
      steps: [
        { id: "sae-i-1", title: "Map features to biology", type: "code", desc: "For each stable feature: top activating cells → enriched cell types, layers, domains, donors, disease. Cross-tabulate with cell-type annotations and BANKSY domains.", checklist: ["Top activating cells extracted per feature", "Cell-type enrichment computed", "Spatial domain enrichment computed", "Disease association tested"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "sae-i-2", title: "Check for efficiency confounds", type: "code", desc: "Correlate each feature's activation with efficiency_residual. Any |r| > 0.3 is flagged as efficiency-driven and excluded from biological interpretation (robustness_and_validation.md rule).", checklist: ["|r| with efficiency_residual computed per feature", "Flagged features listed", "Remaining biological features written up"], xp: 13, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Interpretation Gate", items: ["≥5 biologically labeled features", "No top features driven by efficiency (|r| < 0.3)", "Feature dictionary saved as parquet"] }
    },
    {
      id: "sae-bench",
      depends_on: ["sae-interp"],
      title: "Benchmark vs PCA & NMF",
      emoji: "📉",
      desc: "Head-to-head on the same CONCORD latents: PCA, NMF, and the SAE. Compare reconstruction, sparsity, feature stability, and how cleanly each decomposition separates disease from technical batch.",
      category: "concord_sae", priority: "Mid",
      xp: 20,
      reward: "📉 SAE's advantage over classical decompositions quantified for the reviewer.",
      steps: [
        { id: "sae-b-1", title: "Build PCA and NMF baselines", type: "code", desc: "Fit PCA and NMF on the same CONCORD latents at matched component count. Evaluate reconstruction, sparsity, stability across seeds.", checklist: ["PCA fit at matched k", "NMF fit at matched k", "Reconstruction + sparsity + stability reported"], xp: 8, cognitive_type: "deep", estimated_blocks: 3 },
        { id: "sae-b-2", title: "Test disease vs technical separability", type: "code", desc: "For each method: fraction of top components driven by disease vs efficiency/donor. Report clear win condition for SAE.", checklist: ["Metric defined and documented", "SAE vs PCA vs NMF table produced", "Winner called with effect size"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Benchmark Gate", items: ["Matched-k comparison reported", "SAE advantage quantified on ≥1 published dataset in addition to our own"] }
    },
    {
      id: "sae-manuscript",
      depends_on: ["sae-bench"],
      title: "Nature Methods Manuscript",
      emoji: "📝",
      desc: "Full methods paper: SAE architecture, interpretability protocol, efficiency-confound audit, PCA/NMF benchmark, public code in txomics. Target Nature Methods or Cell Systems.",
      category: "concord_sae", priority: "Mid",
      xp: 30,
      reward: "📝 CONCORD SAE preprint on bioRxiv. Submission to Nature Methods.",
      steps: [
        { id: "sae-m-1", title: "Finish the manuscript draft", type: "writing", desc: "Intro, methods, results, discussion with Nature-style figures. Methods reference txomics. All robustness gates passed.", checklist: ["Intro frames SAE interpretability gap", "All 4 main figures finalized", "Supplementary benchmarks included", "Advisor-approved draft"], xp: 20, cognitive_type: "deep", estimated_blocks: 6 },
        { id: "sae-m-2", title: "Post preprint and submit", type: "writing", desc: "bioRxiv preprint, then submit to Nature Methods. Code tagged release in txomics, Zenodo DOI for data.", checklist: ["bioRxiv preprint live", "Nature Methods submission confirmed", "txomics release tagged", "Zenodo DOI obtained"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Submission Gate", items: ["bioRxiv DOI", "Nature Methods submission confirmed", "Public code + data with DOI"] }
    },
  ],

  // ============================================================
  // OPTIONAL METHODS PAPER: Tissue Assortativity
  // Newman assortativity as a tissue-architecture biomarker.
  // Top-tier spinout — near-zero extra work beyond flagship pipeline.
  // ============================================================
  assortativity: [
    {
      id: "assort-compute",
      depends_on: ["c-p5"],
      title: "Compute Newman Assortativity",
      emoji: "🕸️",
      desc: "Build k-NN spatial graphs per section, compute Newman assortativity coefficient r over cell-type labels, and benchmark robustness to k, radius, and label resolution.",
      category: "assortativity", priority: "Mid",
      xp: 25,
      reward: "🕸️ Assortativity pipeline in txomics. r values computed for every section with robustness envelopes.",
      steps: [
        { id: "as-c-1", title: "Build the spatial graph and r implementation", type: "code", desc: "k-NN spatial graph in txomics.network. Implement Newman r from scratch, then validate against NetworkX to 1e-4 tolerance.", checklist: ["k-NN builder in txomics.network", "Manual Newman r matches NetworkX", "Unit tests pass", "Runs on 1M+ cell section in <2 min"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "as-c-2", title: "Test robustness to k and radius", type: "code", desc: "Sweep k ∈ {5,10,20,30}, radius ∈ {25,50,100µm}, and cell-type resolution (broad vs subtype). Report r ± CI across choices per section.", checklist: ["Sweep complete", "CIs reported", "Choice justified by highest stability", "Results saved as parquet"], xp: 15, cognitive_type: "deep", estimated_blocks: 5 },
      ],
      gate: { title: "Computation Gate", items: ["Newman r matches NetworkX within 1e-4", "Choice of k/radius survives robustness sweep", "r and CI reported for every section"] }
    },
    {
      id: "assort-braak",
      depends_on: ["assort-compute"],
      title: "Benchmark Across Braak Stages & Regions",
      emoji: "📊",
      desc: "Model r ~ Braak + region + APOE with donor random effects. Show whether tissue architecture becomes measurably more disordered along Braak progression across DLPFC, FIC, and DG.",
      category: "assortativity", priority: "Mid",
      xp: 25,
      reward: "📊 Clear Braak-stage trend in r, region-stratified, APOE-controlled. Publication-grade effect sizes.",
      steps: [
        { id: "as-b-1", title: "Fit the Braak + region LMM", type: "code", desc: "r ~ Braak_stage + region + APOE + (1|donor). Report effect size, CI, and partial R² for each term.", checklist: ["LMM fit with donor RE", "Braak effect size with CI reported", "Region interaction tested", "APOE confound controlled"], xp: 12, cognitive_type: "deep", estimated_blocks: 4 },
        { id: "as-b-2", title: "Replicate across datasets", type: "code", desc: "Run identical pipeline on a published spatial dataset (e.g. MERFISH AD cohort) and show the Braak trend replicates.", checklist: ["External dataset pipeline run", "Direction of effect matches", "Magnitude reported", "Figure prepared"], xp: 13, cognitive_type: "deep", estimated_blocks: 5 },
      ],
      gate: { title: "Benchmark Gate", items: ["Braak effect survives LMM with donor RE", "Replicates direction on ≥1 external spatial dataset", "APOE confound reported explicitly"] }
    },
    {
      id: "assort-paper",
      depends_on: ["assort-braak"],
      title: "Methods Paper Submission",
      emoji: "📬",
      desc: "Short methods paper: graph construction, Newman r, robustness envelope, Braak trend with external replication. Positioned as near-zero-cost biomarker extractable from any spatial dataset.",
      category: "assortativity", priority: "Mid",
      xp: 25,
      reward: "📬 Tissue assortativity paper preprinted and submitted. High-ROI first solo publication.",
      steps: [
        { id: "as-p-1", title: "Finish the manuscript and figures", type: "writing", desc: "Compact methods paper, 3-4 main figures. Methods references txomics. Advisor approval before submission.", checklist: ["Manuscript draft", "3-4 main figures finalized", "All robustness gates cited in methods", "Advisor sign-off"], xp: 15, cognitive_type: "deep", estimated_blocks: 5 },
        { id: "as-p-2", title: "Submit to bioRxiv and the journal", type: "writing", desc: "Preprint on bioRxiv, submit to Nature Methods / Bioinformatics / Genome Biology. Tagged code release in txomics.", checklist: ["bioRxiv DOI", "Journal submission confirmed", "txomics tag released", "Zenodo DOI for data"], xp: 10, cognitive_type: "deep", estimated_blocks: 4 },
      ],
      gate: { title: "Submission Gate", items: ["bioRxiv DOI", "Journal submission confirmed", "txomics release tag public"] }
    },
  ],

  // ============================================================
  // DEMENTIA LITERATURE REVIEW (Completed retrospective track)
  // Six-part synthesis used as hypothesis source for the flagship paper.
  // All parts already done — migration pre-marks them complete on load.
  // ============================================================
  dementia_review: [
    {
      id: "dem-review-1",
      title: "Six-Part Dementia Synthesis",
      emoji: "📖",
      desc: "Completed review covering AD history + biomarkers, FTD/ALS-FTD, Lewy body and vascular dementias, prion disease and CTE, molecular regulation (tau isoforms, insulin/CNR/apoptosis), and convergence toward unified therapeutic targets. Serves as the hypothesis engine and introduction scaffolding for every disease-focused paper in the portfolio.",
      category: "dementia_review", priority: "Done",
      xp: 60,
      reward: "📖 Dementia review logged. Acts as reusable intro and scientist-lineage map for AD, FTD, and convergence papers.",
      steps: [
        { id: "dem-ad", title: "Part 1: Alzheimer's Disease", type: "learning", desc: "Auguste Deter and Alois Alzheimer, diagnostic evolution NINCDS-ADRDA 1984 → NIA-AA 2011 → ATN 2018, biomarkers (Aβ42/40, p-tau181, p-tau217, NfL, amyloid PET, tau PET, plasma p-tau217), clinical phenotypes (amnestic, PCA, logopenic PPA, bvAD), genetics (APP/PSEN1/PSEN2, APOE/TREM2/BIN1/PICALM/CLU/CD33/ABCA7/SORL1), neuropathology (plaques, ABC scoring, Braak staging).", checklist: ["Historical origins covered", "Diagnostic criteria evolution mapped", "Biomarker panel documented", "Clinical phenotypes included", "Genetic risk architecture summarized", "Neuropathology and Braak staging covered"], xp: 12, cognitive_type: "deep", estimated_blocks: 1 },
        { id: "dem-ftd-als", title: "Part 2: FTD & ALS-FTD", type: "learning", desc: "bvFTD, PPA subtypes, semantic dementia, FTD-MND overlap, TDP-43 and tau pathology, C9orf72 / GRN / MAPT genetics, and the bvFTD vs bvAD diagnostic tension that the FIC VEN work directly addresses.", checklist: ["bvFTD clinical profile", "PPA subtypes", "TDP-43 and tau pathology", "C9orf72 / GRN / MAPT genetics", "bvFTD vs bvAD overlap"], xp: 10, cognitive_type: "deep", estimated_blocks: 1 },
        { id: "dem-lewy-vasc", title: "Part 3: Lewy Body & Vascular Dementias", type: "learning", desc: "DLB, PDD, α-synuclein biology, autonomic + REM-sleep features, vascular dementia subtypes, small-vessel disease, mixed pathologies, and the fact that most late-life dementia is mixed rather than pure.", checklist: ["DLB / PDD criteria", "α-synuclein pathology", "Vascular dementia subtypes", "Mixed-pathology reality documented"], xp: 8, cognitive_type: "deep", estimated_blocks: 1 },
        { id: "dem-prion-cte", title: "Part 4: Prion Disease & CTE", type: "learning", desc: "Sporadic / familial / iatrogenic / variant CJD, GSS, FFI, prion biology and protein templating. CTE staging, repetitive head-impact epidemiology, and how prion-like tau and α-synuclein spread link back to Braak staging.", checklist: ["CJD subtypes", "Prion templating mechanism", "CTE staging", "Prion-like spread of tau / α-syn connected to other chapters"], xp: 8, cognitive_type: "deep", estimated_blocks: 1 },
        { id: "dem-molecular", title: "Part 5: Molecular Regulation", type: "learning", desc: "Tau isoforms (3R/4R) and MAPT splicing, insulin / IGF-1 signaling and 'type 3 diabetes' framing, cannabinoid CNR1/CNR2 biology, apoptosis and necroptosis pathways, UPR branches, NLRP3, autophagy, NRF2, and how these map onto the gene modules used in the flagship paper.", checklist: ["Tau isoform biology", "Insulin / CNR pathway links", "Apoptosis / necroptosis", "UPR / NLRP3 / autophagy / NRF2", "Mapped to probeset gene modules"], xp: 12, cognitive_type: "deep", estimated_blocks: 1 },
        { id: "dem-convergence", title: "Part 6: Convergence & Cure Strategy", type: "learning", desc: "Shared endpoints across dementias — reactive glia, BBB failure, mitochondrial stress, proteostasis collapse — and why a convergence-targeting strategy is the editorial frame for the flagship atlas, the FIC VEN paper, and the SIR microglial-epidemic paper.", checklist: ["Convergent mechanisms identified", "Therapeutic target logic", "Links to flagship / VEN / SIR framing", "Review finalized and filed"], xp: 10, cognitive_type: "deep", estimated_blocks: 1 },
      ],
      gate: { title: "Review Complete", items: ["All 6 parts written and filed as dementia-review-enhanced.md", "Scientist-lineage sections included", "Ready to reuse as intro material for flagship / VEN / SIR papers"] }
    },
  ],

};
