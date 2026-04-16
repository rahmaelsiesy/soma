# Robustness Testing & Wet Lab Validation Guide

## seqFISH Spatial Transcriptomics of Human AD/FTD Brain Tissue

**Author:** Prepared for Rahma — Caltech Bioengineering PhD  
**Philosophy:** Every test below is designed by a hostile-but-fair *Nature Neuroscience* reviewer attempting to disprove each finding. If you can survive these attacks, the finding is publishable. If you cannot, it is not.

**Cohort:** Human brain tissue (FIC, DLPFC, DG/Hippocampus); N≤10 per condition; Spatial Genomics seqFISH platform; UCSF and RUSH cohorts  
**Probeset:** 1,193 genes; decoder yields ~15.6% global efficiency at FDR 0.05

---

# Section 1: Universal Reviewer Critiques

These critiques apply to **every** analysis in the project. Any manuscript that does not pre-emptively address all ten will receive a rejection or major revision.

---

## U1: Small N Criticism

> *"With N≤10 per condition, any finding is likely underpowered and may not replicate. The authors cannot distinguish true biological signal from individual variation. The confidence intervals for effect sizes must be enormous."*

**Computational robustness tests:**

- **Post-hoc power analysis:** For every primary finding, compute observed effect size (Cohen's d for two-group comparisons, η² for multi-group) and report achieved power at α = 0.05. Use the `pwr` package in R or `statsmodels` in Python. Be honest: if power < 0.8, state it explicitly.

```python
from scipy import stats
import numpy as np

def cohens_d(group1, group2):
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    return (np.mean(group1) - np.mean(group2)) / pooled_std
```

- **Jackknife / leave-one-donor-out sensitivity:** For every primary finding, remove each donor in turn and re-run the analysis. If any single donor's removal changes the direction or significance of the finding, flag it as donor-driven and report which donor.

```python
def jackknife_sensitivity(data, donors, analysis_func):
    """Remove each donor, re-run analysis, check stability."""
    full_result = analysis_func(data)
    results = {}
    for d in np.unique(donors):
        subset = data[donors != d]
        results[d] = analysis_func(subset)
    # Flag if any removal flips sign or crosses significance threshold
    return results
```

- **Bootstrap confidence intervals:** Resample donors (not cells) with replacement 10,000 times. Compute the 95% percentile bootstrap CI for each effect size. If CI crosses zero, the finding is not robust.

- **Compare to published large-N studies:** For every DE gene or cell-type proportion claim, check concordance with Mathys et al. 2019 (ROSMAP, n=48 donors, 80,660 cells; *Nature* 570:332–337) and the Allen Brain Cell Atlas (SEA-AD, 84 donors, 2.78M cells). If your finding replicates in these datasets, small N is mitigated. If it does not appear in large-N data, it is likely a false positive — or your spatial method detects something bulk/snRNA-seq cannot (explain which).

**Wet lab validation:**

- **IF on larger N from brain donor database:** Design experiment to validate top 3 DE hits using antibodies on n=20–30 samples. Since donor database has mostly low-RNA-quality tissue, IF/IHC is the only viable approach — but it is sufficient. Protein-level replication on 3× the sample size directly addresses the N criticism.

---

## U2: Cell Segmentation Artifacts

> *"Spatial transcriptomics cell segmentation is known to be imperfect. Many apparent 'cells' may be segmentation fragments, merged cells, or background noise. How do the authors know their cell-type calls are correct?"*

**Computational robustness tests:**

- **DAPI overlap assessment:** For every segmented cell, compute the fraction of the segmented area that overlaps with DAPI signal. Cells with <50% DAPI overlap are likely segmentation artifacts. Report the fraction of cells removed by this filter.

- **Transcript count distribution analysis:** Plot the distribution of transcripts per cell. Flag cells below the 10th percentile as potential fragments. Flag cells above the 99th percentile as potential merges. Report cell-type assignments before and after removing flagged cells.

- **Co-detection rate per cell:** For each cell, compute: (genes detected) / (genes expected given cell type from reference atlas). Cells with abnormally low co-detection rate relative to their assigned type are suspicious.

- **Cross-platform proportion comparison:** Compare cell-type proportions from seqFISH to published snRNA-seq proportions from the same brain regions (Mathys 2019 for PFC; Allen Brain Cell Atlas for MTG/DLPFC). Deviations >2-fold for any major cell type require explanation.

**Wet lab validation:**

- **smFISH with 5-gene cell-type marker panel:** Design single-channel smFISH for SLC17A7 (excitatory neurons), GAD1 (inhibitory), AQP4 (astrocytes), AIF1/IBA1 (microglia), MOG (oligodendrocytes). Run on n=5–10 sections. Single-channel smFISH has ~80–90% detection efficiency (Raj et al. 2008, *Nature Methods*) and does not depend on combinatorial decoding. Compare cell-type proportions from smFISH to seqFISH on adjacent sections.

- **IF with canonical antibodies:** NeuN (pan-neuronal, Millipore MAB377), GFAP (astrocytes, Dako Z0334), IBA1 (microglia, Wako 019-19741), OLIG2 (OL lineage, Millipore AB9610). Count cell types in same tissue blocks. If IF proportions match seqFISH proportions within 20%, segmentation is adequate.

---

## U3: Batch / Cohort Effects

> *"The authors have samples from UCSF FIC and RUSH FIC/DLPFC cohorts processed at different times. Any finding that doesn't replicate across cohorts may be a batch effect rather than biology."*

**Computational robustness tests:**

- **Within-cohort replication:** Run every primary analysis in UCSF-only and RUSH-only subsets. Only findings that are directionally consistent (same sign) in both cohorts should be reported as primary claims. Findings present in only one cohort should be reported as "cohort-specific, requiring replication."

- **LISI (Local Inverse Simpson Index) scores:** Compute LISI for batch/cohort label in the embedding space. High LISI = well-mixed = low batch effect. Report LISI before and after batch correction (Harmony, scVI, etc.).

- **Batch-associated gene lists:** Run DE between cohorts (UCSF vs. RUSH) ignoring disease status. Any gene in the top 200 batch-DE list that also appears in your disease-DE list is a candidate batch artifact. Flag these genes and report findings with and without them.

- **Variance partitioning:** For each gene, decompose variance into: donor, cohort, disease, cell type, and residual components using a linear mixed model. Genes where cohort explains >20% of variance are batch-dominated.

**Wet lab validation:**

- IF validation targets must include samples from **both** cohorts. Any finding validated only in one cohort's tissue is not validated.

---

## U4: Decode Efficiency as Confound

> *"seqFISH decode efficiency varies per cell (15.6% global yield at FDR 0.05). If efficiency correlates with disease status, apparent DE genes may be efficiency artifacts rather than biology."*

**Computational robustness tests:**

- **Efficiency distribution per disease group:** Plot violin plots of per-cell efficiency for AD, FTD, CN. If distributions differ significantly (KS test p < 0.01), efficiency is confounded with disease.

- **Efficiency-residual covariate in all DE models:** For every DE analysis, include `efficiency_residual` (after cell-type regression) as a covariate. Report DE results with and without this covariate. Genes that are significant only WITHOUT the covariate are efficiency artifacts — flag and exclude from primary claims.

```python
# Pseudocode for efficiency-corrected DE
import statsmodels.api as sm

def de_with_efficiency(gene_expr, disease_label, efficiency_residual):
    X = pd.DataFrame({
        'disease': disease_label,
        'eff_resid': efficiency_residual
    })
    X = sm.add_constant(X)
    model = sm.OLS(gene_expr, X).fit()
    return model.pvalues['disease'], model.params['disease']
```

- **Stability test:** Genes that flip direction (positive → negative log-fold-change) after efficiency correction are artifacts. Report the count and identity of flipped genes.

**Wet lab validation:**

- **smFISH validation (gold standard rebuttal):** Single-molecule FISH uses single-channel detection with no combinatorial decoding. Detection efficiency is ~80–90% and is independent of the seqFISH decoder. If top DE genes replicate by smFISH, they are real regardless of decode efficiency. This is the single most powerful rebuttal to this critique.

---

## U5: Multiple Testing / FDR Inflation

> *"With 1,193 genes tested across multiple cell types, brain regions, and disease comparisons, the FDR correction is insufficient. Many findings are likely false positives even at q < 0.05."*

**Computational robustness tests:**

- **Bonferroni for primary claims:** Apply Bonferroni correction (α / number of tests) for the 3–5 primary claims in each paper. These must survive Bonferroni, not just BH-FDR.

- **Report q-values explicitly:** For every DE gene, report the Storey q-value alongside BH-adjusted p-value.

- **Permutation-based empirical FDR:** Shuffle disease labels 1,000 times, re-run DE pipeline each time, count how many genes pass your threshold in each permutation. Empirical FDR = (mean number of genes in permutations) / (number of genes in real data). If empirical FDR > 0.1, your threshold is too liberal.

```python
def permutation_fdr(expr_matrix, labels, de_func, n_perm=1000, threshold=0.05):
    real_hits = de_func(expr_matrix, labels, threshold)
    perm_hits = []
    for _ in range(n_perm):
        shuffled = np.random.permutation(labels)
        perm_hits.append(len(de_func(expr_matrix, shuffled, threshold)))
    empirical_fdr = np.mean(perm_hits) / max(len(real_hits), 1)
    return empirical_fdr
```

- **Cross-region / cross-cohort replication filter:** Only report as primary findings those genes that replicate (same direction, nominal p < 0.05) in ≥2 brain regions OR ≥2 cohorts. This is the strongest protection against false positives.

**Note:** This is the reviewer's most dangerous weapon. Address it head-on in every paper with an explicit "multiple testing strategy" paragraph in Methods.

---

## U6: Pseudo-bulk Independence Assumption

> *"The authors aggregate cells from the same sample for pseudo-bulk DE. But multiple sections from the same donor violate independence. The effective N is the number of donors, not the number of cells or sections."*

**Computational robustness tests:**

- **One section per donor rule:** For primary DE analyses, use only one section per donor (the one with highest quality metrics). Report results with this strict rule.

- **Linear mixed model (LMM) with donor as random effect:** Fit `gene ~ disease + (1|donor)` for every DE gene. Compare LMM p-values to pseudo-bulk p-values. If LMM p-values are substantially larger (as expected), use LMM results as the primary report.

```r
# R code for LMM-based DE
library(lme4)
library(lmerTest)

fit <- lmer(gene_expr ~ disease_group + (1 | donor_id), data = pseudobulk_df)
summary(fit)  # Use Satterthwaite degrees of freedom
```

- **Concordance check:** Report which genes are significant under both pseudo-bulk and LMM. Only the intersection should be primary claims.

**Note:** With N≤10 donors, LMM has very few degrees of freedom. Be upfront: "The effective sample size for this comparison is N=X donors. We acknowledge this limits statistical power and present these findings as preliminary, requiring replication."

---

## U7: Spatial Autocorrelation Inflates Significance

> *"Nearby cells share RNA — they are not independent observations. Standard statistical tests assume independence. Spatially autocorrelated data has artificially inflated significance."*

**Computational robustness tests:**

- **Moran's I for each DE gene:** Compute Moran's I using a k=10 spatial neighbors graph. Genes with Moran's I > 0.3 have substantial spatial autocorrelation.

- **Effective N correction:** For spatially autocorrelated genes, compute:

```
n_eff = n / (1 + 2 * Σ_k ρ_k)
```

where ρ_k is the spatial autocorrelation at lag k. Re-test significance with n_eff-corrected standard errors. Report both uncorrected and corrected p-values.

- **Spatial permutation test:** Instead of shuffling labels randomly, use spatially constrained permutations (e.g., toroidal shift of coordinates) that preserve spatial structure while breaking disease-gene association. This is the gold-standard spatial correction.

---

## U8: Technical Noise vs. Biology in Spatial Patterns

> *"Spatial patterns in seqFISH may reflect tissue processing artifacts (edge effects, folding, uneven hybridization) rather than biology."*

**Computational robustness tests:**

- **Cross-section reproducibility:** For each spatial pattern, compare across serial sections from the same donor. Biological patterns should replicate; processing artifacts should not.

- **Tissue position regression:** Test if spatial patterns correlate with absolute tissue coordinates (x, y position on the slide). Edge effects manifest as gradients from center to periphery. Compute Pearson r between gene expression and distance-from-centroid. Genes with |r| > 0.2 are flagged as potential edge artifacts.

- **Blank barcode negative control:** Repeat spatial pattern analysis using blank barcodes (sequences not assigned to any gene). Blank barcodes should show NO spatial pattern. If they do, spatial patterns in real genes are partially artifactual. Report: Moran's I for blank barcodes vs. Moran's I for real genes.

---

## U9: Cell-Type Marker Contamination / RNA Bleed-Through

> *"In spatial transcriptomics, RNA from neighboring cells can bleed into segmented cells. A 'neuron' expressing microglial genes may be a segmentation artifact, not a genuine dual-expressing cell."*

**Computational robustness tests:**

- **Spatial distance to nearest expressing neighbor:** For any surprising co-expression (e.g., neuron expressing AIF1), compute the distance to the nearest cell of the expected type (nearest microglia). If distance < 1 cell diameter (~15µm), flag as likely bleed-through.

- **Hypergeometric co-detection test:** For each cell, compute whether co-expression of marker A (from type X) and marker B (from type Y) exceeds what would be expected by chance given the spatial arrangement of types X and Y. Use a hypergeometric test on neighborhood composition.

- **Resolution-dependent analysis:** Re-run cell-type assignment after expanding and contracting segmentation boundaries by ±2µm. If co-expression disappears when boundaries shrink, it is bleed-through.

---

## U10: APOE ε4 Genotype as Hidden Confounder

> *"APOE ε4 is the strongest AD genetic risk factor and dramatically changes microglial gene expression (SPP1, TREM2, LPL all differ by APOE genotype). Without genotype data, AD vs. CN comparisons may be APOE-driven rather than disease-driven."*

**Computational robustness tests:**

- **APOE expression as proxy:** APOE mRNA level in astrocytes and microglia partially reflects ε4 dosage (ε4 carriers have higher APOE in some contexts). Compute per-cell APOE expression and test: does APOE expression correlate with DAM activation score? With your top DE genes?

- **Stratified analysis:** Divide samples into APOE-high and APOE-low (median split on mean astrocytic APOE expression). Re-run DE within each stratum. If DE genes are present in BOTH strata, they are not purely APOE-driven.

**Wet lab validation:**

- **Request APOE genotype from cohort coordinators.** The RUSH Religious Orders Study / ROSMAP cohort has APOE genotype data available. UCSF NDBB likely does as well. Once genotype is obtained, stratify all IF validations by APOE ε4 carrier status.

---

# Section 2: Paper-Specific Robustness Tests

---

## 2.1: EEF2 Efficiency Methods Paper

**Core claim:** EEF2 transcript detection efficiency varies by cell type; efficiency_residual (after cell-type regression) is the correct normalization metric for seqFISH DE analysis.

### Reviewer Attack #1

> *"EEF2 variation across cell types simply reflects differences in EEF2 mRNA abundance — cells with more EEF2 mRNA are detected more efficiently. This is biology, not a technical artifact."*

**Rebuttal tests:**

- **Within- vs. across-cell-type CV:** Compute coefficient of variation (CV) of EEF2 within each cell type and across cell types. If CV_within is large relative to CV_across, the variation within cell types is substantial and cannot be explained by cell-type-specific biology alone.

- **Pan-gene efficiency prediction:** Rank all 1,193 genes by how well their expression predicts per-cell efficiency (Pearson r with total decoded transcripts). If EEF2 is uniquely predictive (top 1–5), it is a valid efficiency proxy. If many genes predict efficiency equally well, efficiency is a global cell property, not gene-specific — strengthening the "technical artifact" interpretation.

- **Theoretical expectation:** If variation were purely biological (cells making more EEF2 protein), EEF2 mRNA levels should predict EEF2 protein levels linearly. If variation is technical (decoder fails more in some cell types), EEF2 mRNA levels should predict TOTAL decoded transcripts across all genes. Test which model fits better.

### Reviewer Attack #2

> *"The efficiency variation claimed is within the noise of the decoder. Run the decoder on the same sample twice — the efficiency variation will be equal to the variation between cell types."*

**Rebuttal tests:**

- Cannot re-run the decoder (1 day per sample, destructive of computation time), but:
- **Post-hoc FDR threshold sweep:** Using dots.hdf5, vary the FDR threshold from 0.01 to 0.20 in steps of 0.01. At each threshold, compute per-cell-type efficiency. If the cell-type ranking of efficiency is consistent across all thresholds (Spearman ρ > 0.9 between any two threshold choices), the signal is robust to decoder noise.
- **Plot efficiency_residual vs. FDR threshold:** Show that efficiency_residual values are stable (rank-correlated ρ > 0.95) across thresholds.

### Reviewer Attack #3

> *"The finding that neurons have lower detection efficiency than glia is already known (Codeluppi et al. 2018 osmFISH; neurons have lower RNA content per nucleus). This is not novel."*

**Rebuttal:**

The novelty is threefold: (a) quantification specific to seqFISH with the Spatial Genomics decoder pipeline, (b) the efficiency_residual correction method applied to downstream DE, and (c) demonstrating that published seqFISH-based DE results are confounded by efficiency.

- **Retrospective analysis:** Identify 3–5 published seqFISH papers (e.g., Eng et al. 2019 *Nature*; Shah et al. 2016 *Neuron*). Apply your efficiency correction to their reported DE genes. Report what fraction would be flagged as efficiency artifacts. If >10% of published DE genes are flagged, this is a meaningful methodological contribution.

### Computational Robustness Battery

| Test | Method | Expected outcome |
|---|---|---|
| Leave-one-cell-type-out | Remove each cell type from regression, refit | Efficiency estimates stable (Δ < 10%) |
| Bootstrap | Resample cells 1,000× with replacement, compute R² distribution | R² CI does not include 0 |
| Permutation | Shuffle cell-type labels, recompute R² | R² drops to ~0 |
| Cross-region | Replicate efficiency stratification in FIC, DLPFC, DG independently | Same cell-type ranking in all 3 regions |
| Cross-cohort | Replicate in UCSF-only and RUSH-only | Same ranking in both cohorts |

### Wet Lab Validation

**smFISH validation (gold standard):**

Design an 8-gene single-channel smFISH panel using Stellaris probes (LGC Biosearch Technologies; 5–7 business day turnaround per probe set):

| Gene | Purpose |
|---|---|
| EEF2 | Primary efficiency proxy |
| ACTB | Housekeeping candidate #2 |
| GAPDH | Housekeeping candidate #3 |
| SLC17A7 | Excitatory neuron marker |
| GAD1 | Inhibitory neuron marker |
| AQP4 | Astrocyte marker |
| AIF1 | Microglia marker |
| MOG | Oligodendrocyte marker |

Run on n=10 fresh-frozen sections from the brain donor database (select samples with acceptable RIN >5). Single-channel smFISH has ~80–90% detection efficiency and is independent of combinatorial decoding. Compare smFISH transcript counts per cell type to seqFISH counts. If seqFISH efficiency is systematically lower for neurons vs. glia but smFISH shows no such difference, the seqFISH efficiency effect is confirmed as technical.

**Protein-level proxy:**

EEF2 antibody (Cell Signaling Technology #2332, RRID:AB_10693546; rabbit polyclonal; validated for IF at 1:50). Run IF on brain tissue sections, quantify EEF2 protein fluorescence per cell type. If protein shows the same neuron:glia ratio as mRNA, the mRNA variation is biological. If protein is flat but mRNA varies by cell type, the mRNA variation is a technical efficiency artifact.

---

## 2.2: DAPI Ghost Cell Paper

**Core claim:** Cells with DAPI signal but low/no detected transcripts ("ghost cells") represent a biologically meaningful population characterizable by DAPI morphology features, not merely segmentation failures.

### Reviewer Attack #1

> *"Ghost cells are simply segmentation failures — cells in regions of poor probe penetration. The authors have not excluded this trivial explanation."*

**Rebuttal tests:**

- **Local transcript density independence test:** Divide tissue into 100µm × 100µm spatial bins. Within each bin, compute: (fraction ghost cells) vs. (mean transcripts per non-ghost cell). If ghost cell fraction is independent of local transcript density (Pearson |r| < 0.1), ghost cells are NOT a probe-penetration artifact.

- **Spatial independence score:** Compute partial correlation of `ghost_fraction` vs. `mean_transcripts_per_bin` after controlling for (x, y) tissue position (to remove edge effects).

- **Neighborhood analysis:** For each ghost cell, count the number of neighboring cells (within 25µm) that are also ghost vs. non-ghost. If ghost cells were due to local probe failure, they should cluster in "dead zones." If they are interspersed among well-detected cells, they are biologically distinct.

### Reviewer Attack #2

> *"The 'DAPI texture features' are not validated. DAPI entropy and peripheral intensity may reflect fixation conditions rather than chromatin biology."*

**Rebuttal tests:**

- **Positive control — apoptotic cells:** Cells expressing CASP3 (in the probeset) should have compacted chromatin → high DAPI peripheral density. Test: Spearman correlation of `DAPI_peripheral_ratio` vs. `CASP3` expression per cell. Expected: ρ > 0.2.

- **Negative control — active neurons:** Cells with high SYT1 + SNAP25 expression should have open chromatin → low DAPI peripheral ratio. Test: Spearman ρ of `DAPI_peripheral_ratio` vs. mean(SYT1, SNAP25). Expected: ρ < −0.1.

- **Correlation matrix:** Compute pairwise Spearman correlations among: `DAPI_entropy`, `n_transcripts`, `CASP3`, `BCL2`, `CDKN1A`. If the expected biology emerges (DAPI_entropy ↑ with CASP3 ↑ and BCL2 ↓), texture features are biologically grounded.

### Reviewer Attack #3

> *"With N≤10, the ghost cell classification may not generalize across brain regions and disease states."*

**Rebuttal tests:**

- **Cross-region generalization:** Train ghost cell classifier on FIC data. Test on DLPFC and DG without re-training. Report sensitivity, specificity, and AUC for each held-out region. Show UMAP of feature space colored by region — the decision boundary should be region-invariant.

### Wet Lab Validation

- **TUNEL staining:** TUNEL marks DNA strand breaks (apoptosis). Stain same tissue sections and overlay ghost cell spatial maps from seqFISH. Expected: a subset of ghost cells co-localize with TUNEL+ regions (dying cells). Ghost cells that are TUNEL− may represent senescent or transcriptionally arrested cells — a biologically distinct subpopulation.

- **H3K9me3 IF:** H3K9me3 (Abcam ab8898, rabbit polyclonal; validated for IHC-P, ICC/IF; 1:500 dilution) marks constitutive heterochromatin / transcriptional silencing. Prediction: ghost cells have higher H3K9me3 signal AND higher DAPI peripheral intensity. Co-localization of H3K9me3 with high-DAPI-ratio cells directly validates the chromatin-state interpretation.

- **p21/CDKN1A IF:** Cellular senescence marker (Santa Cruz sc-6246, mouse monoclonal). CDKN1A is in the seqFISH probeset. Prediction: a subset of ghost cells stain p21+ (senescent), while others are TUNEL+ (apoptotic) and others are neither (transcriptionally quiescent). This distinguishes three biologically distinct ghost cell subtypes: senescent, dying, and arrested.

- **Reduced smFISH panel (12 genes):**

| Gene | Category |
|---|---|
| CASP3, BCL2, FAS | Apoptosis |
| CDKN1A, SQSTM1, LAMP2 | Senescence-associated |
| MAP2, AIF1, GFAP | Cell-type markers |
| EEF2, ACTB, GAPDH | Housekeeping |

Run on fresh-frozen sections with higher RNA quality. This independently characterizes ghost cell identity without relying on seqFISH decoding.

---

## 2.3: Tissue Assortativity Biomarker Paper

**Core claim:** Spatial gene expression assortativity (Newman r) distinguishes AD subtypes and correlates with neuropathological stage (Braak/Thal).

### Reviewer Attack #1

> *"Assortativity simply recapitulates what we already know: AD disrupts laminar architecture. Any measure of spatial organization would show the same result. This is not novel — it is a complicated way to measure what histology already tells us."*

**Rebuttal tests:**

- **Incremental information test:** Build two models predicting Braak stage: (a) cell-type proportions alone → AUC_a; (b) cell-type proportions + assortativity → AUC_b. If ΔAUC > 0.05, assortativity adds information beyond what proportions capture. Use nested cross-validation (leave-one-donor-out) to avoid overfitting.

- **Comparison vs. existing spatial metrics:** Compute Moran's I and BANKSY domain composition for the same data. Show: (a) assortativity is not perfectly correlated with Moran's I (Pearson r < 0.8); (b) assortativity-based models outperform or match Moran's I-based models for Braak prediction.

- **Gene-level resolution:** The key novelty is that assortativity identifies WHICH genes have disrupted spatial clustering. Histology cannot do this. Report the top 20 genes by Δ-assortativity (AD − CN) and show they enrich for disease-relevant pathways (neuroinflammation, synaptic, UPR) via gene set enrichment analysis.

### Reviewer Attack #2

> *"The k in kNN graph construction is a free parameter. With different k values, assortativity scores change. The findings may not be robust to this choice."*

**Rebuttal tests:**

- **k-robustness sweep:** Report assortativity for k = 5, 10, 15, 20, 30 for all key findings. Compute Spearman ρ of r-values across k choices. Any finding that changes sign or loses significance at any k is reported with this caveat.

- **Graph construction robustness:** Compare kNN to: (a) Delaunay triangulation (parameter-free), (b) distance-threshold graphs (r = 15µm, 25µm, 50µm). Primary findings must hold across ≥3 graph construction methods.

| Graph type | Parameter | Primary finding holds? |
|---|---|---|
| kNN | k = 5, 10, 15, 20, 30 | Must hold for all |
| Delaunay | None | Must hold |
| Distance threshold | 15µm, 25µm, 50µm | Must hold for ≥2 |

### Reviewer Attack #3

> *"With N≤10 per condition and one assortativity value per section, the between-group comparison has extremely low power. Confidence intervals almost certainly overlap."*

**Rebuttal tests:**

- **Spatial subsampling bootstrap:** Within each section, subsample 50% of cells 1,000 times, compute assortativity each time. This yields a distribution of r per sample, capturing spatial sampling variability.

- **Jackknife CI across donors:** Report leave-one-donor-out jackknife estimate and pseudo-CI.

- **Exact permutation test for clinical correlation:** For Braak stage correlation (ordinal variable), use Spearman ρ with exact permutation p-value (permute Braak labels 10,000×).

- **Honest power analysis:** Given observed effect size and n=10, compute 1−β. If <0.8, state: "This finding is preliminary and requires replication in a larger cohort."

### Wet Lab Validation

**IF-based cell-type assortativity on large N:**

Design a 6-plex IF panel: NeuN, GFAP, IBA1, OLIG2, CLDN5 (endothelial), DAPI. Run on n=25–30 brain donor samples (n=10 per disease group). From IF data, assign cell types and compute spatial assortativity of cell TYPE (not gene expression). If cell-type assortativity from IF on n=30 replicates the seqFISH finding direction and magnitude, this is a strong validation.

**Neuropathology score correlation:** Obtain Braak/Thal staging from cohort neuropathology reports. Correlate IF-based assortativity with Braak stage (Spearman ρ, n=30). This is a clean, high-N clinical correlation that addresses the power critique directly.

**Why IF works:** The core claim is about spatial organization of cell types. You don't need RNA — protein-level cell identity via IF gives the same spatial graph.

---

## 2.4: SIR Epidemic Model Paper

**Core claim:** Microglial DAM activation follows epidemic-like spread dynamics (SIR model) with parameters β, γ, R₀; AD has higher R₀ than CN.

### Reviewer Attack #1

> *"The SIR model assumes 'infected' (DAM) microglia cause nearby homeostatic microglia to transition. But DAM activation may be independently triggered by amyloid/lipid signals — not by neighboring DAM cells. The authors conflate correlation with causation."*

**Rebuttal tests:**

- **DAM clustering vs. Braak stage:** Since cross-sectional data cannot establish temporality, use Braak stage as a proxy for disease progression. Compare DAM spatial clustering (Ripley's K at r=50µm) at Braak I–II vs. III–IV vs. V–VI. If epidemic model is correct, clustering should increase monotonically with Braak stage.

- **Counterfactual null model:** Fit a "null epidemic" where each cell activates independently with probability p (no spatial transmission, purely amyloid-driven). Compare AIC/BIC of SIR vs. null model. The SIR model must win by ΔBIC > 10 for the claim to hold.

```python
# Compare SIR spatial model vs. independent activation model
from scipy.optimize import minimize

def sir_spatial_likelihood(params, data):
    beta, gamma = params
    # ... compute spatial SIR likelihood ...
    return -log_likelihood

def independent_likelihood(params, data):
    p_activate = params[0]
    # Each cell activates with probability p, no spatial dependence
    return -log_likelihood

# Compare via BIC
bic_sir = -2 * ll_sir + k_sir * np.log(n)
bic_null = -2 * ll_null + k_null * np.log(n)
delta_bic = bic_null - bic_sir  # Positive = SIR wins
```

- **Partial correlation with amyloid proxy:** If amyloid drives DAM independently, DAM clustering should vanish when controlling for local APP/PSEN1 expression (neuronal amyloid proxy). Compute partial Moran's I of DAM_score controlling for local APP expression.

### Reviewer Attack #2

> *"The DAM 'state' is a continuous score, not binary S/I/R. Forcing it into discrete states introduces arbitrary thresholds."*

**Rebuttal test:**

- **Threshold sensitivity:** Run SIR analysis at three thresholds (25th, 50th, 75th percentile of DAM score as the I-state boundary). Show R₀ estimates maintain the same rank ordering (AD > FTD > CN) regardless of threshold. Report as a sensitivity table.

| Threshold | R₀ (AD) | R₀ (FTD) | R₀ (CN) | Rank preserved? |
|---|---|---|---|---|
| 25th %ile | — | — | — | — |
| 50th %ile | — | — | — | — |
| 75th %ile | — | — | — | — |

### Reviewer Attack #3

> *"β (transmission rate) cannot be interpreted as causal transmission. It is a spatial correlation parameter. The epidemic framing is metaphor, not mechanism."*

**Rebuttal:**

Explicitly concede this point and reframe: "We agree that the SIR framework is descriptive, not mechanistic. The contribution is a new measurable parameter (R₀) that: (a) discriminates disease states, (b) correlates with clinical severity, and (c) predicts spatial extent of neuroinflammation more parsimoniously than alternatives."

Compare model fit: SIR spatial model vs. Gaussian random field vs. homogeneous activation model. Report log-likelihood, AIC, BIC, and number of parameters for each.

### Wet Lab Validation

**IBA1 + TREM2 dual IF on large N (n=30):**

Design 4-plex IF: IBA1 (Wako 019-19741, pan-microglial), TREM2 (R&D Systems AF1828 or Abcam ab209814, DAM marker), GFAP (reactive astrocytes), DAPI. Run on n=30 samples across disease groups and Braak stages.

**Ripley's K analysis from IF:**

```
K(r) = (A / n²) × Σ_{i≠j} 1(d_{ij} < r)
L(r) = sqrt(K(r) / π) − r
```

Plot L(r) vs. r for TREM2+/IBA1+ cells in AD vs. CN vs. FTD. If AD shows positive L(r) values at scales 50–200µm (microglial neighborhood scale), DAM cells cluster together as predicted by the epidemic model. This is a large-N, protein-level test of the key spatial prediction.

---

## 2.5: CONCORD SAE Interpretability Paper

**Core claim:** Sparse autoencoder (SAE) applied to CONCORD latent embeddings yields biologically interpretable, monosemantic features that are disease-relevant.

### Reviewer Attack #1

> *"Biological interpretability of SAE features is post-hoc rationalization. Any feature can be 'interpreted' by pattern-matching to known biology. This is circular."*

**Rebuttal tests:**

- **Blinded validation:** Have a collaborator independently label the top-20 cells for each feature (based on gene expression profile) WITHOUT seeing your proposed feature name. Compute Cohen's κ agreement between their label and yours. If κ > 0.7 for >60% of features, interpretability is real, not imposed.

- **Cross-dataset transfer:** Apply the same trained SAE to an independent dataset (Allen Brain Cell Atlas SEA-AD, 84 donors). If feature k captures "DAM stage 2" in your data, does the same feature structure (cosine similarity of decoder weights > 0.7) emerge in the Allen data?

- **Feature stability across random seeds:** Train SAE 10 times with different random initializations. For each pair of runs, compute cosine similarity matrix of decoder weight vectors. Features with mean pairwise similarity > 0.9 across all runs are robust. Features with similarity < 0.5 are noise artifacts.

### Reviewer Attack #2

> *"The sparsity hyperparameter λ is not justified. The authors chose λ post-hoc to get 'interpretable' results."*

**Rebuttal test:**

- **λ sweep with pre-registered criterion:** Report results at λ = 0.01, 0.05, 0.1, 0.5. For each:
  - Number of active features (sparsity)
  - Reconstruction loss (MSE)
  - Biological interpretability score: fraction of features matching a known cell state in the literature

Choose λ using the elbow of the interpretability-vs-reconstruction trade-off curve, with the criterion decided BEFORE examining biological labels.

### Reviewer Attack #3

> *"The CONCORD latent space may primarily encode technical variation (efficiency, batch). The SAE is interpreting technical artifacts."*

**Rebuttal tests:**

- **Efficiency leakage test:** For each SAE feature k, compute Pearson r between activation h_k and efficiency_residual. Features with |r| > 0.3 are flagged as potentially technical.

- **Batch leakage test:** Compute LISI score of feature activations split by cohort. Biological features should have high LISI (batch-mixed); technical features have low LISI.

- **Disease-relevant features must pass both tests:** Show that the top disease-discriminating features have LOW efficiency correlation (|r| < 0.1) AND HIGH LISI (>1.5).

### Wet Lab Validation

This paper is hardest to validate in the wet lab — SAE interpretability is an in-silico method. Strategy: validate the **biological predictions** of the top SAE features.

- SAE feature → "DAM stage 2" (TREM2+/SPP1+): validate by TREM2/SPP1 dual IF, confirm predicted spatial distribution.
- SAE feature → "UPR-stressed neurons": validate by HSPA5/BiP IF + DDIT3/CHOP IF, confirm ER-stressed cells in predicted locations.
- **General principle:** Take top 5 disease-relevant features, identify predicted spatial locations, design a 6-plex IF panel testing each prediction on the large-N brain donor dataset.

---

## 2.6: VEN/FTD Paper

**Core claim:** VENs (ADCYAP1+ layer Va neurons) are selectively depleted in bvFTD vs. AD and CN, with remaining VENs showing TDP-43 pathology and microglial clearance.

### Reviewer Attack #1

> *"With N≤10 and VENs being <1% of neurons, the actual VEN count per sample is tiny (50–200 cells). The '56% depletion' claim rests on a count difference that may be within noise."*

**Rebuttal tests:**

- **Report absolute VEN counts per sample** (not just percentages). Include a table with columns: donor, disease, section_area_mm2, VEN_count, VEN_density_per_mm2.

- **Spatial density metric:** Use VENs per mm² of Layer Va area rather than proportion of all neurons. This controls for variable tissue area.

- **Bayesian hierarchical model:**

```python
import pymc as pm

with pm.Model():
    # Hierarchical model: VEN count ~ disease + (1|donor)
    mu_disease = pm.Normal('mu_disease', mu=0, sigma=10, shape=3)
    sigma_donor = pm.HalfNormal('sigma_donor', sigma=5)
    donor_effect = pm.Normal('donor', mu=0, sigma=sigma_donor, shape=n_donors)
    rate = pm.math.exp(mu_disease[disease_idx] + donor_effect[donor_idx])
    observed = pm.Poisson('ven_count', mu=rate * area, observed=counts)
    trace = pm.sample(2000)
```

Report 95% credible interval for depletion percentage. If CrI excludes zero, claim is supported.

- **Literature concordance:** Expected ~56% depletion matches Seeley et al. 2006 (*Annals of Neurology*). Pre-register this as a prediction, then report replication.

### Reviewer Attack #2

> *"ADCYAP1 is not specific to VENs. It is also expressed in some pyramidal neurons. How do you confirm ADCYAP1+ cells in Layer Va are genuine VENs?"*

**Rebuttal tests:**

- **Morphological proxy:** VENs have large somata (>40µm diameter), bipolar morphology. In seqFISH, cell segmentation area serves as proxy. Test: Kolmogorov-Smirnov test comparing cell area distributions of ADCYAP1+ cells in Layer Va vs. neighboring SLC17A7+ excitatory neurons. VENs should be significantly larger.

- **Co-expression profile:** VENs should be ADCYAP1+ / SLIT2+ / SLC17A7+ / FEZF2+ / BCL11B+ / GAD1−. Compute the fraction of ADCYAP1+ Layer Va cells matching this profile.

- **Spatial specificity control:** ADCYAP1+ VEN candidates should appear specifically in FIC Layer Va. If ADCYAP1+ cells appear at similar density in DLPFC or DG, they are NOT VENs (VENs are FIC/ACC-specific). Use non-FIC regions as an internal negative control.

### Reviewer Attack #3

> *"The microglial 'clearance response' near VEN-depleted zones could be non-specific reactive gliosis to any cell death."*

**Rebuttal tests:**

- **Layer-restricted DAM score:** Show DAM score is HIGHER in Layer Va of FIC in bvFTD than in other layers of the same section. If clearance were non-specific, activation would be uniform across layers.

- **Region-restricted comparison:** Compare DAM score in Layer Va of FIC (VENs present) vs. Layer Va of DLPFC (no VENs) in bvFTD. VEN-specific clearance predicts: FIC Layer Va DAM > DLPFC Layer Va DAM.

### Wet Lab Validation (Strongest Validation Opportunity)

**ADCYAP1 + phospho-TDP-43 dual IF on large N (n=30):**

- Anti-ADCYAP1/PACAP antibody: Peninsula Laboratories T-4462 (guinea pig polyclonal, validated for IHC on brain tissue) or R&D Systems AF6380 (sheep polyclonal, validated for WB)
- Anti-phospho-TDP-43 (pS409/410): Cosmo Bio TIP-PTD-M01 (mouse monoclonal; the standard for TDP-43 pathology detection)
- Stain FIC sections from n=10 bvFTD, n=10 AD, n=10 CN
- Count: ADCYAP1+ cells in Layer Va per mm²; phospho-TDP-43 inclusions in ADCYAP1+ cells
- This directly replicates Seeley 2006 and Kim et al. 2012 in your cohort. If you observe ~56% VEN depletion in bvFTD with TDP-43 inclusions in surviving VENs, validation is definitive.
- Large N (n=30) completely addresses the small-N critique.

**IBA1 + ADCYAP1 dual IF:**

Confirm microglial clustering in FIC Layer Va of bvFTD by quantifying IBA1+ cell density in the VEN-depleted zone. This validates the "clearance response" computational prediction.

**Reduced smFISH (10-gene VEN confirmation panel):**

| Gene | Purpose |
|---|---|
| ADCYAP1 | VEN marker |
| SLIT2 | VEN co-marker |
| SLC17A7 | Excitatory neuron marker |
| FEZF2 | Layer V marker |
| BCL11B | Deep-layer neuron |
| TBR1 | Cortical neuron |
| GAD1 | Inhibitory (negative control) |
| AIF1 | Microglia |
| GFAP | Astrocyte |
| TARDBP | TDP-43 mRNA |

Run on fresh-frozen sections where seqFISH was performed. Confirms VEN identity (ADCYAP1+/SLIT2+/SLC17A7+/GAD1−) independently of seqFISH decoding.

---

## 2.7: Network Motif / Assortativity Papers (Shared Validation)

### Reviewer Attack #1

> *"The spatial 'GRN' is inferred from co-expression, not actual regulatory relationships. The term 'gene regulatory network' is not justified."*

**Rebuttal:**

- Relabel throughout as **"spatial co-expression network" (SCEN)**.
- Validate edges against known regulatory databases: TRRUST v2 and DoRothEA (Garcia-Alonso et al. 2019). Report: what fraction of SCEN edges appear in known regulatory databases? This calibrates how much of the SCEN reflects regulation vs. co-expression from cell-type mixing.

### Reviewer Attack #2

> *"Motif Z-scores depend on the null model. The configuration model may inflate Z-scores if your degree distribution is unusual."*

**Rebuttal:**

Use three null models:

| Null model | Preserved property |
|---|---|
| Configuration model | Degree sequence |
| Erdős–Rényi | Edge density only |
| Spatial random graph | Degree + spatial constraints |

Primary claims must hold (Z > 2) against ALL three nulls. Any motif significant only under one null is reported with this caveat.

### Wet Lab Validation

- **Cross-platform replication:** Apply motif/assortativity analysis to Allen Brain Cell Atlas spatial data (10x Visium, n=3–4 donors per region). Same high-Z motifs in an independent platform = strong evidence. Make analysis code platform-agnostic (any AnnData/SpatialExperiment input).

- **Pathway protein validation:** If motif X implicates UPR→NLRP3 coupling (ATF4→DDIT3→NLRP3), validate with DDIT3 + NLRP3 + CASP1 triple IF to confirm protein co-localization in predicted spatial context.

---

# Section 3: txomics Package — Benchmarking Tests

For the package to be credible as a published tool, each method must be benchmarked against established alternatives on public datasets with ground truth.

---

## 3.1: Spatial Domain Finding

**Benchmark against:** BANKSY, Seurat (FindClusters + spatial), SpaGCN, STAGATE

**Benchmark dataset:** Maynard et al. 2021 DLPFC Visium dataset — 12 sections with manual layer annotations (6 cortical layers + white matter). Available via the `spatialLIBD` Bioconductor package.

**Metric:** Adjusted Rand Index (ARI) vs. manual annotations.

```python
from sklearn.metrics import adjusted_rand_score

def benchmark_spatial_domains(txomics_labels, banksy_labels, spagcn_labels, ground_truth):
    results = {
        'txomics': adjusted_rand_score(ground_truth, txomics_labels),
        'banksy': adjusted_rand_score(ground_truth, banksy_labels),
        'spagcn': adjusted_rand_score(ground_truth, spagcn_labels),
    }
    return results
```

**Expected:** txomics (BANKSY-based) should match or exceed standalone BANKSY ARI (≥0.5 for cortical layer detection). If txomics ARI is lower by >0.05, investigate implementation bugs.

**Runtime benchmark:** Report seconds per section at 1,000 / 5,000 / 10,000 / 50,000 cells. txomics must be competitive (within 2× of fastest method) to be practical.

---

## 3.2: Cell-Type Assignment

**Benchmark against:** Seurat label transfer (MapQuery), scANVI, CellTypist

**Benchmark datasets:**
- Allen MTG dataset (Hodge et al. 2019): ground-truth cell-type labels from patch-seq + expert annotation
- Allen DLPFC dataset: published cell-type labels

**Metric:** F1 score per cell type; macro-averaged F1; ARI.

**Expected:** seqFISH-specific pipeline (with efficiency correction) should outperform snRNA-seq-trained references on seqFISH test data because efficiency correction removes a systematic bias that snRNA-seq references do not account for.

**Key test:** Compare txomics cell-type ARI vs. Seurat label-transfer ARI vs. CellTypist ARI on the same seqFISH validation data. Report per-cell-type precision and recall.

---

## 3.3: DE Analysis

**Benchmark against:** DESeq2, edgeR, MAST, Wilcoxon rank-sum

**Metrics:**
- (a) **FDR calibration:** On null datasets (permuted disease labels), measure empirical FDR at nominal FDR = 0.05. A well-calibrated method should have empirical FDR ≤ 0.05.
- (b) **Power on simulated data:** Generate datasets with known ground-truth DE genes at Cohen's d = 0.2, 0.5, 0.8 and spatial autocorrelation levels (Moran's I = 0, 0.2, 0.5). Measure recall (sensitivity) at FDR < 0.05.

**Benchmark datasets:**
- Kang et al. 2018 IFN-β-stimulated PBMC dataset (standard scRNA-seq DE benchmark)
- Simulated spatial dataset with injected DE genes and spatial autocorrelation

**Expected:** txomics 5-level DEG classification should have HIGHER precision (fewer false positives) than simple Wilcoxon, at the cost of LOWER recall. This is the intended trade-off: a high-precision method for spatial data. Show this precision-recall trade-off explicitly.

---

## 3.4: Efficiency Correction

**Benchmark against:** No correction, scran normalization, SCTransform (sctransform)

**Ground truth:** Housekeeping genes from the Human Housekeeping Genes Database (HRT Atlas v1.0 — Hounkpe et al. 2021). These genes should show LOW variance across cell types.

**Metric:** Coefficient of variation (CV) of housekeeping genes across cell types, before vs. after each normalization.

```python
def efficiency_correction_benchmark(expr_matrix, cell_types, housekeeping_genes):
    """Lower CV of housekeeping genes = better normalization."""
    results = {}
    for method in ['none', 'scran', 'sctransform', 'txomics_efficiency']:
        corrected = apply_normalization(expr_matrix, method)
        cvs = []
        for gene in housekeeping_genes:
            means = corrected[gene].groupby(cell_types).mean()
            cvs.append(means.std() / means.mean())
        results[method] = np.mean(cvs)
    return results
```

**Expected:** After txomics efficiency correction, housekeeping gene CV across cell types should be LOWER than after scran or SCTransform, because the efficiency correction specifically addresses cell-type-dependent detection bias.

---

# Section 4: Statistical Standards Checklist

Complete this checklist for **every figure and every quantitative claim** before submission of any manuscript. No exceptions.

```
STATISTICAL CHECKLIST — Required Before Submission
═══════════════════════════════════════════════════

For each main finding, verify ALL of the following:

[ ] EFFECT SIZE reported (Cohen's d, η², R², odds ratio, or equivalent)
    — Never report a p-value without an effect size.

[ ] SAMPLE SIZE per group explicitly stated
    — Format: "N = X donors (Y cells total; Z cells per donor, mean ± SD)"

[ ] CONFIDENCE INTERVALS reported
    — 95% CI (frequentist) or 95% CrI (Bayesian); bootstrap CI preferred
      for non-standard statistics

[ ] MULTIPLE TESTING CORRECTION specified
    — State method: BH-FDR, Bonferroni, Storey q-value, or permutation FDR
    — For primary claims (≤5 per paper): Bonferroni required
    — For exploratory analyses: BH-FDR acceptable

[ ] MODEL ASSUMPTIONS TESTED
    — Normality: Shapiro-Wilk or QQ plot
    — Homoscedasticity: Levene's test
    — Independence: Moran's I for spatial data; ICC for hierarchical data
    — If assumptions violated: use non-parametric alternative or robust SE

[ ] EFFECTIVE N REPORTED for spatial data
    — n_eff = n / (1 + 2 × Σ_k ρ_k)
    — Use n_eff (not raw cell count) for all significance calculations

[ ] NEGATIVE CONTROLS shown
    — Blank barcodes show no signal / no spatial pattern
    — Permuted labels show no significant result
    — Technical replicates (serial sections) show consistent result

[ ] POSITIVE CONTROLS shown
    — At least one known-true finding from the literature is replicated
    — Example: GFAP enriched in astrocytes, SLC17A7 in excitatory neurons

[ ] INDEPENDENT REPLICATION demonstrated
    — Same finding in ≥2 brain regions, OR
    — Same finding in ≥2 cohorts (UCSF + RUSH), OR
    — Same finding in ≥1 external dataset (Allen, Mathys, etc.)

[ ] CODE AND DATA deposited
    — GitHub repository with DOI (Zenodo archive) cited in Methods
    — Raw data: GEO/SRA accession for seqFISH data
    — Processed data: Zenodo or Figshare DOI for AnnData objects
```

---

# Section 5: Wet Lab Validation Priority Matrix

---

## 5.1: Recommended Caltech Facilities

**Beckman Institute Biological Imaging Facility:**
- Leica SP8 confocal microscope — for multiplexed IF (4–6 plex; sequential scanning for spectral separation)
- Zeiss LSM 980 with Airyscan 2 — super-resolution for subcellular marker localization
- Zeiss Axio Scan.Z1 slide scanner — for large-N tissue section scanning (essential for n=30 validation experiments)
- TIRF microscope — potentially useful for smFISH single-molecule counting

**Akoya Biosciences PhenoCycler/CODEX (if accessible via Caltech or collaborator):**
- 40+ plex protein imaging on FFPE tissue
- Could run the entire cell-type + disease marker panel in ONE experiment on n=30 sections
- This would be transformative: a protein-level spatial atlas at large N that directly benchmarks against seqFISH

**Caltech Proteomics Exploration Laboratory:**
- If samples yield sufficient protein: mass spectrometry-based pathway validation for UPR, neuroinflammation, and synaptic modules

**smFISH Probe Design Resources:**
- LGC Biosearch Technologies Stellaris probes — 5–7 business day turnaround for custom probe sets
- Cost: ~$300–500 per 20-gene panel
- Can use existing seqFISH microscope (Spatial Genomics platform or departmental widefield fluorescence scope) for imaging

---

## 5.2: IF Panel Recommendations for Large-N Brain Donor Validation

### Priority Panel 1: Cell Census + VEN Validation (n=30)

| Target | Antibody | Purpose |
|---|---|---|
| DAPI | — | Nuclear counterstain |
| NeuN | Millipore MAB377 | Pan-neuronal |
| GFAP | Dako Z0334 | Astrocytes |
| IBA1 | Wako 019-19741 | Microglia |
| OLIG2 | Millipore AB9610 | OL lineage |
| ADCYAP1 | Peninsula T-4462 or equivalent | VENs |

- **Purpose:** Validate cell-type proportions across disease groups; quantify VEN depletion in bvFTD.
- **Tissue:** FIC + DLPFC sections from n=10 bvFTD, n=10 AD, n=10 CN
- **Est. cost:** ~$500–800 in antibodies + consumables
- **Est. time:** 2–3 weeks staining + 1 week imaging

### Priority Panel 2: Neuroinflammation Convergence (n=30)

| Target | Antibody | Purpose |
|---|---|---|
| DAPI | — | Nuclear counterstain |
| IBA1 | Wako 019-19741 | Pan-microglial |
| TREM2 | R&D AF1828 | DAM marker |
| phospho-TDP-43 | Cosmo Bio TIP-PTD-M01 | TDP-43 pathology |
| GFAP | Dako Z0334 | Reactive astrocytes |
| C3 | Dako A0062 | A1 complement astrocyte |

- **Purpose:** Validate DAM spatial clustering, VEN TDP-43 pathology, A1 astrocyte reactivity
- **Tissue:** FIC sections from n=10 bvFTD, n=10 AD, n=10 CN

### Priority Panel 3: Synaptic / BBB Integrity (n=30)

| Target | Antibody | Purpose |
|---|---|---|
| DAPI | — | Nuclear counterstain |
| SNAP25 | Synaptic Systems 111 011 | Presynaptic |
| CLDN5 | Invitrogen 35-2500 | BBB tight junction |
| PDGFRβ | R&D AF385 | Pericytes |
| VCAM1 | R&D BBA5 | Vascular activation |
| C1QA | Abcam ab182451 | Complement / synapse pruning |

- **Purpose:** Validate synaptic depletion, BBB disruption, complement-mediated synapse elimination

### Priority Panel 4: ER Stress / UPR Validation (n=20)

| Target | Antibody | Purpose |
|---|---|---|
| DAPI | — | Nuclear counterstain |
| BiP/GRP78 | Cell Signaling 3177 | ER stress (adaptive UPR) |
| DDIT3/CHOP | Cell Signaling 2895 | Chronic UPR / pro-apoptotic |
| Cleaved CASP3 | Cell Signaling 9661 | Apoptosis execution |
| NeuN | Millipore MAB377 | Neuronal identity |

- **Purpose:** Validate UPR spatial predictions — chronic (DDIT3+) vs. adaptive (BiP+ only) ER stress in neurons

---

## 5.3: Priority Matrix Table

| Validation | Paper(s) | Impact | Feasibility | Est. Cost | Est. Time | Samples |
|---|---|---|---|---|---|---|
| ADCYAP1 + pTDP-43 IF (large N) | VEN/FTD | ★★★★★ | High | $600 | 3 weeks | n=30 FIC |
| IBA1 + TREM2 IF + Ripley's K | SIR epidemic model | ★★★★ | High | $400 | 2 weeks | n=30 FIC/DLPFC |
| EEF2 smFISH + cell-type markers | EEF2 efficiency | ★★★★★ | Medium | $1,500 | 4 weeks | n=10 fresh-frozen |
| TUNEL + DAPI texture overlay | DAPI ghost cells | ★★★★ | High | $300 | 2 weeks | n=20 |
| H3K9me3 IF (ab8898) | DAPI ghost cells | ★★★ | High | $350 | 2 weeks | n=20 |
| Cell census 6-plex IF | Assortativity | ★★★★ | High | $500 | 3 weeks | n=30 |
| BANKSY layer validation (in silico) | txomics package | ★★★ | Very High | $0 | 1 week | Allen data |
| BiP + CHOP + CASP3 IF | UPR module | ★★★ | High | $450 | 2 weeks | n=20 |
| 20-gene smFISH panel | All papers | ★★★★★ | Medium | $2,000 | 6 weeks | n=10 fresh-frozen |
| p21/CDKN1A IF (sc-6246) | DAPI ghost cells | ★★★ | High | $250 | 2 weeks | n=20 |
| DDIT3 + NLRP3 + CASP1 triple IF | Network motifs | ★★★ | High | $500 | 3 weeks | n=20 |
| Cross-platform replication (Allen) | Motif / assortativity | ★★★★ | Very High | $0 | 2 weeks | Public data |

**Recommended execution order:**

1. **ADCYAP1 + pTDP-43 IF** — highest impact, directly replicates published findings on larger N
2. **IBA1 + TREM2 IF** — validates SIR model spatial prediction with protein-level data
3. **EEF2 smFISH** — gold-standard methods paper validation
4. **Cell census 6-plex IF** — validates cell-type proportions and assortativity simultaneously
5. **TUNEL + H3K9me3** — ghost cell characterization
6. **In silico benchmarks** — no cost, can run in parallel with wet lab

**Total estimated budget for all wet lab validations:** ~$6,350 in reagents/antibodies (excluding personnel time and facility fees)

---

# Section 6: "Devil's Advocate" Hypotheses

For each major biological hypothesis, the alternative explanation a skeptic would propose, and the exact test to distinguish them.

---

## H1: Brain Insulin Resistance Drives Tau Pathology via GSK3B

**Your hypothesis:** INSR↓ / IRS1↓ → disinhibition of GSK3β → hyperphosphorylation of tau → neurofibrillary tangles.

> **Devil's advocate:** *"GSK3B upregulation is a CONSEQUENCE of tau pathology (tau oligomers activate stress kinases including GSK3β), not a cause. The directionality is the opposite of what the authors claim."*

**Discriminating test:**

- **Braak stage-stratified ordering:** If insulin resistance → tau, then INSR↓/IRS1↓ should appear at LOWER Braak stages (early) while MAPT↑/phospho-tau should appear at HIGHER stages (later). If tau → insulin resistance, MAPT↑ should precede INSR↓.

- Operationalize: for each gene (INSR, IRS1, GSK3B, MAPT), compute the Braak stage at which expression first deviates significantly from CN (threshold: Cohen's d > 0.5). Report the ordering of these "onset stages."

- **Explicit limitation:** Cross-sectional data CANNOT prove causality. State: "The Braak stage ordering is consistent with [hypothesis], but definitive causal evidence requires longitudinal or interventional studies."

---

## H2: Cannabinoid System Failure Contributes to Neuroinflammation

**Your hypothesis:** Failure of the endocannabinoid system (FAAH↑, CNR1↓) removes neuroprotective signaling, contributing to uncontrolled neuroinflammation.

> **Devil's advocate:** *"CNR2 upregulation on microglia is a well-known RESPONSE to neuroinflammation, not a failure of neuroprotection. FAAH and MGLL changes are secondary to lipid metabolism disruption in DAM cells."*

**Discriminating tests:**

- **Temporal ordering by Braak stage:** Does CNR2↑ precede or follow TREM2/NLRP3 upregulation?

- **Correlation with pro- vs. anti-inflammatory markers:** If CNR2↑ is neuroprotective, it should correlate with anti-inflammatory genes (IL10, TGFB1) and occur in cells that are NOT fully DAM-committed (TREM2 moderate, not maximal). If CNR2↑ is merely a downstream response, it should correlate with pro-inflammatory markers (IL1B, TNF) and peak in fully activated DAM cells.

- Compute: Spearman ρ of CNR2 vs. TREM2, CNR2 vs. IL1B, CNR2 vs. TGFB1 within microglia. The sign pattern distinguishes the two hypotheses.

---

## H3: DAM Activation Follows Epidemic Spatial Dynamics

**Your hypothesis:** DAM state spreads from cell to cell via local signaling, producing epidemic-like spatial dynamics (R₀ > 1 in AD).

> **Devil's advocate:** *"The spatial clustering of DAM cells simply reflects the spatial clustering of amyloid plaques, which independently trigger each microglia. There is no epidemic — there is just geography of amyloid."*

**Discriminating test:**

- If amyloid drives DAM independently, DAM clustering should DISAPPEAR when you control for local amyloid burden. Compute partial Moran's I of DAM_score controlling for local APP expression (neuronal proxy for amyloid production).

```python
from pysal.explore import esda

# Full Moran's I for DAM_score
moran_full = esda.Moran(dam_score, spatial_weights)

# Partial Moran's I: residualize DAM_score against APP expression
from sklearn.linear_model import LinearRegression
resid = dam_score - LinearRegression().fit(app_expr.reshape(-1,1), dam_score).predict(app_expr.reshape(-1,1))
moran_partial = esda.Moran(resid, spatial_weights)

# If moran_partial.I is still significant, spatial spread 
# exists BEYOND amyloid geography
```

- If partial Moran's I remains significantly positive, spatial transmission is occurring beyond what amyloid geography explains. This is the key evidence for epidemic-like dynamics.

---

## H4: VEN Loss Is Disease-Specific to bvFTD

**Your hypothesis:** VEN depletion is selective for bvFTD, with minimal VEN loss in AD.

> **Devil's advocate:** *"VEN loss is non-specific — any cortical degenerative disease depletes vulnerable neurons. The specificity for bvFTD over AD is an artifact of small N."*

**Discriminating tests:**

- **Within-sample spatial specificity:** In the SAME bvFTD section, compare:
  - (a) ADCYAP1+ cell density in FIC Layer Va (VEN zone)
  - (b) ADCYAP1+ cell density in FIC Layer III (non-VEN layer)
  - (c) SLC17A7+ cell density in FIC Layer Va (excitatory neurons that are NOT VENs)

- If depletion is VEN-specific: only (a) is reduced. If non-specific: all layers and neuron types are depleted equally.

- **AD positive control:** In AD samples, VEN density should be PRESERVED (matching Seeley 2006 finding that AD does not selectively target VENs). If AD also shows VEN loss comparable to FTD, specificity is not supported.

- **Effect size comparison:** Compute Cohen's d for VEN depletion in bvFTD vs. CN AND in AD vs. CN. Report both with 95% CI. If bvFTD d >> AD d (non-overlapping CIs), specificity is supported.

---

## H5: Spatial Assortativity Declines With Disease Progression

**Your hypothesis:** Gene expression assortativity decreases in AD, reflecting loss of spatial tissue organization.

> **Devil's advocate:** *"Assortativity changes reflect tissue quality degradation (post-mortem interval, fixation quality) rather than disease biology. AD brains have longer PMI and worse tissue quality on average."*

**Discriminating test:**

- **PMI as covariate:** Compute Pearson r between assortativity and post-mortem interval across all samples. If |r| > 0.3, PMI is a confound. Include PMI as covariate in all assortativity-disease models.

- **Within-CN variation:** In CN samples only, compute the range of assortativity values. If this range is comparable to the AD-CN difference, the disease effect is within normal variation.

- **RIN / tissue quality metric:** If RNA quality metrics are available per sample, regress assortativity against RIN and disease simultaneously. The disease effect must survive RIN adjustment.

---

## H6: Ghost Cells Represent a Biologically Meaningful State

**Your hypothesis:** Ghost cells (DAPI+, transcript-low) include senescent, apoptotic, and transcriptionally arrested subpopulations.

> **Devil's advocate:** *"Ghost cells are a technical artifact of the seqFISH protocol. They are cells where the probe cocktail failed to hybridize due to local chemistry (pH, fixation gradients). There is no biology — only protocol failure."*

**Discriminating test:**

- **Protocol-failure prediction:** If ghost cells are protocol failures, their frequency should correlate with technical quality metrics (local probe density, distance from tissue edge, section thickness). If ghost cell frequency is independent of these metrics but correlates with disease status or Braak stage, they are biological.

- **Definitive test:** Run smFISH (independent protocol, different chemistry) on sections with known ghost cell locations from seqFISH. If ghost cells are ALSO transcript-low by smFISH, they are genuinely transcriptionally silent. If smFISH detects normal transcript levels, the ghost cell phenotype is a seqFISH-specific technical artifact.

---

# Reviewer Response Template

Use this structure for every reviewer critique across all manuscripts. Pre-filled with the most common response patterns.

---

```
REVIEWER RESPONSE TEMPLATE
═══════════════════════════

GENERAL FORMAT:

"We thank the reviewer for this important concern. We have addressed 
it as follows:

[Computational test result]
[Wet lab validation result, if applicable]
[Updated manuscript text, with line numbers]"

────────────────────────────────────────────────

RESPONSE TO "Small N / underpowered":

"We acknowledge the sample size limitation inherent to spatial 
transcriptomics studies (N = [X] donors per condition). To address 
this concern:

1. We report effect sizes (Cohen's d = [X], 95% CI [X, Y]) alongside 
   p-values for all primary findings (Supplementary Table [X]).

2. Leave-one-donor-out jackknife analysis confirms that no single 
   donor drives the finding (Supplementary Fig. [X]).

3. Bootstrap confidence intervals (10,000 resamples at donor level) 
   exclude zero for all primary claims (Fig. [X]).

4. The finding replicates in published large-N datasets: [Mathys 
   et al. 2019 (n=48) / Allen Brain Cell Atlas (n=84)] 
   (Supplementary Fig. [X]).

5. Protein-level validation by IF on n=[30] independent samples 
   confirms the same direction and magnitude of effect (Fig. [X]).

We have added an explicit 'Limitations' paragraph noting that 
replication in larger spatial transcriptomics cohorts is needed 
(Methods, lines [X-Y])."

────────────────────────────────────────────────

RESPONSE TO "Batch effects":

"We have addressed potential batch/cohort confounds through:

1. Within-cohort replication: the finding is directionally consistent 
   in both the UCSF (N=[X]) and RUSH (N=[Y]) cohorts independently 
   (Supplementary Fig. [X]).

2. LISI score for batch mixing in the embedding space is [X] 
   (well-mixed), indicating low residual batch effect after Harmony 
   correction (Supplementary Fig. [X]).

3. Variance partitioning shows cohort explains only [X]% of variance 
   for the genes underlying this finding, vs. [Y]% explained by 
   disease (Supplementary Table [X]).

4. Wet lab validation includes samples from both cohorts 
   (Fig. [X])."

────────────────────────────────────────────────

RESPONSE TO "Decode efficiency confound":

"We agree that decode efficiency variation is a critical confound in 
seqFISH data. Our analysis addresses this in three ways:

1. All DE models include efficiency_residual (cell-type-regressed 
   efficiency) as a covariate. The reported genes are significant 
   WITH this correction (Supplementary Table [X]).

2. We show that our top DE genes do not change direction after 
   efficiency correction (0 of [N] primary genes flip sign; 
   Supplementary Fig. [X]).

3. Single-molecule FISH validation of [N] top DE genes (which uses 
   single-channel detection, bypassing combinatorial decoding 
   entirely) confirms the same expression differences 
   (Fig. [X])."

────────────────────────────────────────────────

RESPONSE TO "Multiple testing":

"We employ a tiered multiple testing strategy:

1. Primary claims (N = [3-5] per paper) are tested at Bonferroni-
   corrected thresholds and survive correction (Table [X]).

2. Exploratory DE analyses use BH-FDR < 0.05, with empirical FDR 
   confirmed by 1,000 label-permutation runs (empirical FDR = 
   [X]%; Supplementary Fig. [X]).

3. We additionally require cross-region or cross-cohort replication 
   for any gene reported as a primary finding, providing an 
   independent filter beyond statistical correction."

────────────────────────────────────────────────

RESPONSE TO "Spatial autocorrelation":

"We have computed Moran's I for all DE genes and report effective 
sample sizes (n_eff) corrected for spatial autocorrelation 
(Supplementary Table [X]). After correction:

- [X] of [Y] primary DE genes remain significant at corrected 
  n_eff (Table [X]).
- For genes with Moran's I > 0.3, we additionally performed 
  spatially constrained permutation tests (toroidal shift), 
  which confirmed significance (Supplementary Fig. [X])."

────────────────────────────────────────────────

RESPONSE TO "Cell segmentation quality":

"We have validated cell segmentation through:

1. DAPI overlap: [X]% of segmented cells have >50% DAPI overlap 
   (Supplementary Fig. [X]).

2. Cell-type proportions from seqFISH match published snRNA-seq 
   proportions within [X]-fold for all major types (Supplementary 
   Table [X]).

3. IF validation with canonical markers (NeuN, GFAP, IBA1, OLIG2) 
   on n=[X] sections shows concordant cell-type fractions 
   (Fig. [X]; Pearson r = [X] between IF and seqFISH 
   proportions)."

────────────────────────────────────────────────

RESPONSE TO "Novelty / incremental contribution":

"We respectfully disagree that this finding is incremental. 
The specific contributions beyond prior work are:

1. [Unique methodological advance, with comparison to closest 
   prior method]
2. [Novel biological insight not available from prior platforms]
3. [Quantitative improvement: ARI +X%, precision +Y%, etc.]

We have revised the Introduction to more clearly articulate 
these contributions relative to [specific prior papers] 
(lines [X-Y])."
```

---

**End of Document**

*This guide should be revisited before each manuscript submission and updated as new validation data becomes available. Every claim that survives the tests above is publishable. Every claim that does not should be either dropped or explicitly flagged as preliminary.*
