# Gene Module Reference Document — seqFISH Spatial Transcriptomics (AD/FTD Human Brain)

**Project:** Rahma's seqFISH spatial transcriptomics study of AD/FTD human brain tissue  
**Probeset:** v2_probeset.csv — 1,205 genes (12 serial smFISH + 1,193 barcoded)  
**Regions:** DLPFC (dorsolateral prefrontal cortex), FIC (frontoinsular cortex)  
**Conditions:** Cognitively Normal (CN), Alzheimer's Disease (AD), behavioral variant frontotemporal dementia (bvFTD)  
**Last updated:** April 2026

---

## Section 0: How to Use This Document

This document organizes the 1,205 probeset genes into biologically meaningful modules for cell type identification, disease pathway analysis, and hypothesis testing. Key principles:

1. **Modules are not mutually exclusive.** A single gene can appear in multiple modules. For example, **GSK3B** appears in Modules D2 (Tau), D4 (Insulin Resistance), D12 (Wnt), and D13 (mTOR-Autophagy). Each module assigns it a different biological context. Cross-module overlap is documented explicitly and summarized in the master cross-reference table (end of document).

2. **All gene lists are restricted to the v2 probeset.** Every gene named in this document has been verified against `probeset_genes.json`. Genes known to be important but absent from the probeset are flagged as **MISSING** where relevant. Key missing genes: NRGN, CUX1, SERPINA3, CST7, LPL, MBP, GAD2, RELN.

3. **Serial smFISH genes (12 total) have highest spatial confidence.** MEG3, SNAP25, VSNL1, SYT1, RORB, ADARB2, CHN1, MAP2, MEF2C, NCAM1, NOVA1, RTN1 — these are measured independently with higher sensitivity. Use them as anchor markers when possible.

4. **Pipeline pauses for user validation.** Section 5 lists all checkpoints where the pipeline should stop and present results for human inspection before proceeding.

5. **Citation format.** All citations follow: **Author et al. YEAR, *Journal***. Key papers include a brief statement of why they matter.

---

## Section 1: Cell Type Marker Modules

### 1.1 Excitatory Neurons

**Available in probeset:** SLC17A7, CAMK2A, SATB2, TBR1, NEUROD6, MEF2C (serial), CUX2, RORB (serial), FOXP2, BCL11B, FEZF2, SNAP25 (serial), SYT1 (serial), MAP2 (serial), VSNL1 (serial), NEFM, NEFL, NEFH, RBFOX3, NRP1, CRYM, SYNPR, NEUROD2, STMN2

**PRIMARY markers:** **SLC17A7** (VGLUT1, pan-excitatory), **CAMK2A** (enriched in excitatory neurons, L2-5 especially), **SATB2** (telencephalic excitatory), **NEUROD6** (cortical excitatory).

**SECONDARY markers:** **SNAP25** (serial; presynaptic, enriched in neurons but not exclusive), **SYT1** (serial; synaptic vesicle fusion), **MAP2** (serial; dendritic, pan-neuronal), **RBFOX3** (NeuN), **NEFM/NEFL/NEFH** (neurofilaments; enriched in large projection neurons).

**EXCLUSION markers:** GAD1↓, SLC32A1↓ (inhibitory markers should be low), GFAP↓, AQP4↓ (glial markers absent), AIF1↓ (microglial marker absent).

**LAMINAR distribution:**
- L2/3: **CUX2**high, SLC17A7+, CAMK2A+
- L4: **RORB**high (serial smFISH — high confidence). Note: present only in granular cortex (DLPFC); FIC is agranular and lacks true L4.
- L5a: **FOXP2**high, **NRP1**+
- L5b: **FEZF2**high, **BCL11B**+ (CTIP2, corticospinal/subcortical projecting)
- L6: **TBR1**high, **SYNPR**+, **CRYM**+

**SUBCLUSTERING strategy:** After assigning SLC17A7+ cells as excitatory, use the laminar marker panel (CUX2, RORB, FOXP2, FEZF2, TBR1, BCL11B) to assign layer identity. In DLPFC, expect a clear five-layer distribution. In FIC (agranular), L4/RORB+ population will be absent or minimal — this is biologically correct, not an error.

**Key references:** **Hodge et al. 2019, *Nature*** — human cortical cell type taxonomy using snRNA-seq from MTG; defines excitatory subclasses by layer. **Bakken et al. 2021, *Nature*** — cross-species comparison of cortical cell types confirms conserved laminar markers.

### 1.2 Inhibitory Neurons

**Available in probeset:** GAD1, SST, PVALB, VIP, LAMP5, ADARB2 (serial), CCK, LHX6, PROX1, NKX2-2, SLC32A1, GABBR1, GABBR2, ID2, CALB1, CALB2, SCN1A, NOS1, NDNF

**PRIMARY markers:** **GAD1** (pan-inhibitory, glutamic acid decarboxylase), **SLC32A1** (VGAT, vesicular GABA transporter).

**SECONDARY markers:** **GABBR1/GABBR2** (GABA-B receptors), **LHX6** (MGE-derived interneurons: SST+ and PVALB+).

**EXCLUSION markers:** SLC17A7↓ (excitatory marker absent), GFAP↓, MOG↓.

**Subtype markers:**
- **SST+** Martinotti cells: **SST** high, LHX6+; L2-5, dendrite-targeting; most vulnerable in AD (**Mathys et al. 2019, *Nature***).
- **PVALB+** chandelier/basket cells: **PVALB** high, LHX6+, SCN1A+; L3-5, fast-spiking, perisomatic targeting.
- **VIP+** bipolar/bitufted: **VIP** high, PROX1+, CALB2+; L1-2/3, disinhibitory circuit (inhibit SST/PVALB cells).
- **LAMP5+/ADARB2+** (serial): **LAMP5** high, **ADARB2** high; L1-2, neurogliaform; CGE-derived.
- **CCK+** basket cells: **CCK** high, often VIP co-expressing subset; perisomatic targeting.
- **ID2+** interneurons: **ID2** high; a CGE-derived subpopulation distinct from VIP.

**Vulnerability note:** SST and PVALB interneurons are the most vulnerable inhibitory types in AD; VIP interneurons are relatively spared (**Cain et al. 2020; Mathys et al. 2019, *Nature***). MISSING: GAD2 (not in probeset) — use GAD1 alone for pan-inhibitory assignment.

### 1.3 Astrocytes

**Available in probeset:** GFAP, AQP4, SLC1A3, GJA1, FGFR3, VIM, C3, CHI3L1, TNC, SLC1A2, FABP7, AGT, GLUL, SOX9, NFIA, NFIB, ATP1A2, S1PR3, DIO2, ALDH1A1

**PRIMARY markers:** **AQP4** (water channel, astrocyte-specific), **GJA1** (Connexin43, gap junctions), **SLC1A3** (EAAT1, glutamate transporter).

**SECONDARY markers:** **FGFR3** (astrocyte lineage), **GLUL** (glutamine synthetase), **SLC1A2** (EAAT2), **FABP7** (fatty acid binding), **SOX9** (astrocyte TF).

**EXCLUSION markers:** SLC17A7↓, GAD1↓, MOG↓, AIF1↓, CLDN5↓.

**Reactive states (for subclustering):**
- **Homeostatic:** AQP4+, GJA1+, SLC1A3high, FGFR3+ — normal glutamate buffering and water homeostasis.
- **A1-like (neurotoxic):** **C3**high, complement genes up, induced by microglial TNF/IL-1α/C1Q (**Liddelow et al. 2017, *Nature*** — showed that activated microglia secrete Il-1α, TNF, and C1q to convert astrocytes to neurotoxic A1 state; A1 astrocytes kill neurons and oligodendrocytes). **CHI3L1** (YKL-40, disease-associated astrocyte marker).
- **Reactive general:** **GFAP**high, **VIM**high, **TNC**+ — pan-reactive markers.
- **STAT3-driven:** **STAT3** as master transcription factor for reactive astrogliosis (**Escartin et al. 2021, *Nature Neuroscience*** — revised A1/A2 framework, emphasizing that reactive astrocyte states are more heterogeneous than a simple binary).

### 1.4 Microglia

**Available in probeset:** AIF1, CX3CR1, TMEM119, P2RY12, TREM2, SPP1, APOE, CD68, CSF1R, ITGAX, CLEC7A, MARCO, MRC1, SPI1, MAFB, IRF8, SALL1, HLA-DRA, HLA-DRB1, CD74, LAPTM5, MERTK, FCGR2A, CD14, TLR2, TLR4

**PRIMARY markers:** **AIF1** (Iba1, pan-microglial), **TMEM119** (homeostatic microglia-specific), **P2RY12** (homeostatic microglia).

**SECONDARY markers:** **CX3CR1** (fractalkine receptor), **CSF1R** (colony stimulating factor 1 receptor, microglial survival), **SPI1** (PU.1 transcription factor), **IRF8**, **SALL1**.

**EXCLUSION markers:** SLC17A7↓, GAD1↓, GFAP↓, MOG↓, CLDN5↓.

**State markers (for subclustering — DAM program per Keren-Shaul et al. 2017, *Cell*):**
- **Homeostatic:** TMEM119high, P2RY12high, CX3CR1high, SALL1+
- **Stage 1 DAM (TREM2-independent):** TMEM119↓, P2RY12↓, CX3CR1↓ — loss of homeostatic signature.
- **Stage 2 DAM (TREM2-dependent):** **TREM2**high, **SPP1**high, **APOE**high, **ITGAX** (CD11c)high, **CLEC7A**high, **CD68**high.
- **Perivascular/BAM-like:** **MRC1** (CD206)+, **MARCO**+, **CD163**+.
- MISSING from probeset: CST7, LPL, GPNMB — important DAM markers not available.

### 1.5 Oligodendrocytes (Mature)

**Available in probeset:** MOG, PLP1, OLIG1, OLIG2, CNP, MAG, MYRF, SOX10, OPALIN, UGT8, GPR37, TF, PLLP, QKI, ENPP6

**PRIMARY markers:** **MOG** (myelin oligodendrocyte glycoprotein), **PLP1** (proteolipid protein 1; most abundant myelin protein RNA).

**SECONDARY markers:** **CNP** (active myelination), **MAG** (myelin-associated glycoprotein), **MYRF** (myelin regulatory factor), **SOX10** (OL lineage TF).

**EXCLUSION markers:** GFAP↓, AIF1↓, SLC17A7↓, PDGFRA↓ (OPC marker — should be low in mature OLs).

**Maturation proxy:** OLIG2/MOG ratio — OLIG2 is maintained even when mature OL genes decline; a high OLIG2/low MOG pattern suggests stressed or immature OLs. MISSING: MBP (myelin basic protein) — a major myelin gene not in probeset; rely on MOG/PLP1 instead.

### 1.6 Oligodendrocyte Precursor Cells (OPCs)

**Available in probeset:** PDGFRA, OLIG1, CSPG4, GPR17, OLIG2, NKX2-2, SOX10

**PRIMARY markers:** **PDGFRA** (platelet-derived growth factor receptor alpha), **CSPG4** (NG2 proteoglycan).

**SECONDARY markers:** **GPR17** (OPC-to-OL transition marker), **OLIG1** (shared with mature OLs but higher in OPCs), **NKX2-2**.

**EXCLUSION markers:** MOGlow, PLP1low (mature OL markers should be low/absent).

### 1.7 Endothelial Cells

**Available in probeset:** CLDN5, PECAM1, FLT1, SLC2A1, OCLN, TJP1, ABCB1, CDH5, ESAM, PODXL, KDR, TEK, NOS3, MFSD2A, TFRC

**PRIMARY markers:** **CLDN5** (tight junction, highly endothelial-specific), **PECAM1** (CD31).

**SECONDARY markers:** **FLT1** (VEGFR1), **CDH5** (VE-cadherin), **ESAM**, **SLC2A1** (GLUT1 — glucose transporter, also BBB marker).

**EXCLUSION markers:** GFAP↓, AIF1↓, PDGFRB↓ (pericyte), SLC17A7↓.

### 1.8 Pericytes

**Available in probeset:** PDGFRB, ANPEP, ABCC9, RGS5, ACTA2, MYL9, MYH11, MYLK, TAGLN

**PRIMARY markers:** **PDGFRB** (pericyte/mural cell), **RGS5** (regulator of G-protein signaling 5).

**SECONDARY markers:** **ABCC9** (ATP-binding cassette), **ANPEP** (aminopeptidase N), **ACTA2** (smooth muscle actin — also in vascular smooth muscle cells/vSMCs).

**Note:** ACTA2, MYL9, MYH11, MYLK, TAGLN are enriched in vSMCs/arteriolar pericytes. Pure capillary pericytes express PDGFRB/RGS5/ABCC9 without high contractile markers.

### 1.9 Von Economo Neurons (VENs)

**Available in probeset:** ADCYAP1, SLIT2

**PRIMARY markers:** **ADCYAP1** (PACAP, most reliable VEN marker in probeset), **SLIT2** (axon guidance, VEN-enriched).

**EXCLUSION markers:** Should co-express SLC17A7 (excitatory). Located specifically in layer Va of FIC/ACC.

**Critical context:** VENs are large bipolar projection neurons found almost exclusively in ACC and FIC of great apes and humans (**Allman et al. 2011, *Brain Structure and Function*** — established VEN distribution across primates; VENs are more numerous in humans than apes). **Seeley et al. 2006, *Science***; **Kim et al. 2012, *Cerebral Cortex*** — 56% selective loss of VENs in bvFTD, relatively spared in AD. This creates a diagnostic dissociation testable with seqFISH.

MISSING: GADD45G — a known VEN marker not in the probeset.

---

## Section 2: Disease Pathology Modules

### Module D1: Amyloid Processing & LOAD GWAS Risk

**Available in probeset:** APP, PSEN1, PSEN2, BACE1, ADAM10, APOE, TREM2, BIN1, CLU, CR1, PICALM, ABCA7, SLC24A4, SORL1, PLCG2, INPP5D, NCSTN, PSENEN, APH1A, APH1B

**Pathway mechanism:** Amyloid precursor protein (**APP**) undergoes proteolytic cleavage by two competing pathways. The non-amyloidogenic α-secretase pathway (**ADAM10**) cleaves within the Aβ domain, producing neuroprotective sAPPα. The amyloidogenic β-secretase (**BACE1**) pathway generates sAPPβ and a C-terminal fragment further cleaved by γ-secretase (a complex of **PSEN1** or **PSEN2**, **NCSTN**, **PSENEN**, **APH1A/B**) to release Aβ40/42 peptides. Aβ42 aggregates into oligomers and fibrils that are neurotoxic.

**GWAS biology:** LOAD risk genes act through distinct cell-type-specific mechanisms. **APOE** (ε4 allele = risk, ε2 = protective) is primarily expressed by astrocytes and microglia; APOE4 impairs Aβ clearance and promotes neuroinflammation. **TREM2** is a microglial receptor sensing lipids/Aβ; loss-of-function variants (R47H) impair microglial response to plaques. **BIN1** is involved in endocytosis and tau propagation in neurons. **CLU** (clusterin/ApoJ) is a secreted chaperone preventing Aβ aggregation. **PICALM** mediates clathrin-mediated endocytosis and Aβ transcytosis across the BBB. **SORL1** directs APP to recycling compartments away from β-secretase; loss = more Aβ production. **PLCG2** (a protective variant P522R) and **INPP5D** (SHIP1) regulate microglial phagocytic signaling.

**Disease dysregulation:** In AD, BACE1↑ activity and impaired clearance (APOE4, PICALM dysfunction, reduced ABCB1-mediated efflux) lead to Aβ accumulation. Spatially, amyloid plaques concentrate first in association cortices (DLPFC) and default mode network regions, then spread to primary cortices.

**Expected RNA correlations:** If BACE1↑ in neurons, expect enhanced amyloidogenic processing. If ADAM10↑ in same cells, α-cleavage may partially compensate. TREM2↑ in microglia surrounding plaques indicates DAM activation. CLU↑ in astrocytes near plaques = chaperone stress response. SORL1↓ in neurons predicts enhanced Aβ production.

**Key citations:** **Selkoe & Hardy 2016, *EMBO Molecular Medicine*** — updated amyloid cascade hypothesis. **Jansen et al. 2019, *Nature Genetics*** — largest LOAD GWAS meta-analysis. **Kunkle et al. 2019, *Nature Genetics*** — GWAS identifying LOAD loci.

| Pattern | Interpretation |
|---------|---------------|
| BACE1↑ + ADAM10↓ in neurons | Shifted to amyloidogenic processing |
| TREM2↑ + APOE↑ in microglia clusters | Stage 2 DAM activation near plaques |
| CLU↑ + CR1↑ in astrocytes | Complement/chaperone stress response |
| SORL1↓ + PICALM↓ in neurons | Impaired APP trafficking → more Aβ |

### Module D2: Tau Pathology & Neurofibrillary Tangles

**Available in probeset:** MAPT, CDK5, GSK3B, MARK4, TARDBP, FUS, SNCA, UBQLN2, VCP, SQSTM1, OPTN, TBK1, LAMP2

**Pathway mechanism:** **MAPT** encodes tau, a microtubule-associated protein that stabilizes axonal transport. Hyperphosphorylation by kinases **CDK5** (activated by p35 cleavage to p25) and **GSK3B** (glycogen synthase kinase 3β) and **MARK4** causes tau to detach from microtubules, misfold, and aggregate into paired helical filaments (PHFs) forming neurofibrillary tangles (NFTs). NFT density correlates with cognitive decline more strongly than amyloid plaque burden (**Braak & Braak 1991, *Acta Neuropathologica***).

**TDP-43 and FUS:** **TARDBP** (TDP-43) and **FUS** are RNA-binding proteins that mislocalize from nucleus to cytoplasm in FTLD-TDP and FTLD-FUS subtypes, respectively. TDP-43 inclusions also occur in ~50% of AD cases (LATE — limbic-predominant age-related TDP-43 encephalopathy). Nuclear TARDBP↓ with cytoplasmic aggregation = loss of RNA processing function.

**Cross-pathway link (GSK3B/CDK5):** These kinases also appear in Module D4 (insulin resistance) and D12 (Wnt). Insulin resistance → reduced AKT activity → GSK3B disinhibition → both tau hyperphosphorylation AND β-catenin degradation. This convergence is mechanistically central to the "Type 3 Diabetes" hypothesis.

**Clearance machinery:** **SQSTM1** (p62), **VCP**, **UBQLN2**, **OPTN**, **TBK1** are autophagy receptors and regulators involved in clearing ubiquitinated tau aggregates. **LAMP2** is a lysosomal membrane protein required for chaperone-mediated autophagy. Their accumulation (SQSTM1↑) signals failed autophagy.

**Key citations:** **Braak & Braak 1991, *Acta Neuropathologica*** — NFT staging system (Braak I-VI). **Ittner & Götz 2011, *Nature Reviews Neuroscience*** — comprehensive tau pathophysiology review. **Nelson et al. 2019, *Brain*** — LATE as TDP-43 proteinopathy in aging brains.

| Pattern | Interpretation |
|---------|---------------|
| MAPT↑ + CDK5↑ + GSK3B↑ in excitatory neurons | Active tau hyperphosphorylation program |
| TARDBP nuclear↓ in FIC neurons | TDP-43 mislocalization (bvFTD signature) |
| SQSTM1↑ + LAMP2↓ | Autophagy failure — cargo accumulation |
| SNCA↑ in subcortical neurons | α-synuclein co-pathology (Lewy-related) |

### Module D3: Cannabinoid System (eCB) — HYPOTHESIS MODULE

**Available in probeset:** CNR1, CNR2, FAAH, FAAH2, MGLL, DAGLA, DAGLB, NAPEPLD, ABHD12, ABHD6, GPR55, PTGS2

**HYPOTHESIS STATUS:** Supported by animal models and postmortem human studies; no definitive causal trial data in humans.

**Pathway mechanism:** The endocannabinoid (eCB) system comprises two principal endogenous ligands — anandamide (AEA) and 2-arachidonoylglycerol (2-AG) — their receptors (**CNR1**/CB1 and **CNR2**/CB2), and metabolic enzymes. AEA is synthesized by **NAPEPLD** and degraded by **FAAH** (and **FAAH2**). 2-AG is synthesized by **DAGLA/DAGLB** and degraded by **MGLL** (monoacylglycerol lipase) and **ABHD6/ABHD12**. **PTGS2** (COX-2) provides an alternative oxygenation route for both AEA and 2-AG, producing prostaglandin-ethanolamides. **GPR55** is a putative third cannabinoid receptor.

**CB1 (CNR1) on neurons:** The most abundant GPCR in the brain. Mediates retrograde synaptic signaling — released from postsynaptic neurons, activates presynaptic CB1 to suppress neurotransmitter release (depolarization-induced suppression of inhibition/excitation). Critical for synaptic plasticity, including LTD at excitatory synapses.

**CB2 (CNR2) on microglia:** Expression is low in resting microglia but strongly upregulated upon activation. CB2 agonism promotes M2-like anti-inflammatory polarization, enhances Aβ phagocytosis, and reduces pro-inflammatory cytokine release (**Ramírez et al. 2005, *Journal of Neuroscience*** — CB2 agonist JWH-133 reduced inflammation and neuronal death in Aβ-injected rats).

**Disease dysregulation:** **Benito et al. 2003, *Journal of Neuroscience*** — key finding: CB2 receptors and FAAH are selectively overexpressed in neuritic plaque-associated glia in AD brains, while CB1 expression remains unchanged in early stages. Subsequent work shows CB1↓ in advanced AD correlating with synaptic loss (**Stella 2010, *Glia***). FAAH inhibition is neuroprotective in preclinical models because it increases AEA availability.

**Spatial predictions for seqFISH:**
- **CNR2**↑ in microglia correlates with TREM2↑ (DAM activation near plaques)
- **CNR1**↓ in neurons correlates with SYT1↓ and SNAP25↓ (synaptic loss)
- **FAAH**↑ in astrocytes near plaques → increased AEA degradation → less neuroprotection
- **PTGS2**↑ in neurons = COX-2-mediated eCB oxygenation and prostaglandin production

| Pattern | Interpretation |
|---------|---------------|
| CNR2↑ + AIF1↑ in microglia | eCB system engaged during neuroinflammation |
| CNR1↓ + SYT1↓ + SNAP25↓ in neurons | Synaptic loss with CB1 downregulation |
| FAAH↑ in astrocytes + MGLL↑ | Accelerated eCB degradation → reduced tone |
| DAGLA↓ + NAPEPLD↓ in neurons | Impaired eCB synthesis capacity |

### Module D4: Brain Insulin Resistance — HYPOTHESIS MODULE

**Available in probeset:** INSR, IGF1R, IRS1, IRS2, PIK3CA, AKT1, GSK3B, FOXO1, FOXO3, MTOR, PTEN, TSC1, TSC2, PPARG, PPARGC1A, TXNIP, DEPTOR, RICTOR, RPTOR, PDK1, PDPK1, EIF4EBP1, EIF4EBP2, RPS6KB1

**Pathway mechanism:** Insulin/IGF-1 binds **INSR/IGF1R** → recruits **IRS1/IRS2** → activates **PIK3CA** (PI3K) → **PDK1/PDPK1** → **AKT1** phosphorylation → downstream effects: (a) inhibits **GSK3B** (tau kinase), (b) activates **MTOR** (protein synthesis via **RPS6KB1**, translation suppression via **EIF4EBP1/2**), (c) phosphorylates/excludes **FOXO1/FOXO3** from nucleus (preventing stress gene expression). **PTEN** is the phosphatase that reverses PI3K signaling. **TSC1/TSC2** complex inhibits mTOR when AKT is low.

**"Type 3 Diabetes" hypothesis:** **de la Monte & Wands 2008, *Journal of Diabetes Science and Technology*** — proposed that AD represents a form of brain-specific diabetes with insulin resistance and insulin deficiency driving neurodegeneration. **Talbot et al. 2012, *Journal of Clinical Investigation*** — directly demonstrated brain insulin resistance in postmortem AD hippocampal tissue from non-diabetic patients; IRS-1 serine phosphorylation (inhibitory) was elevated and correlated with Aβ oligomers and cognitive decline; this was the first direct biochemical demonstration of brain insulin resistance in AD.

**GSK3B convergence point:** Insulin resistance → AKT↓ → GSK3B released from inhibition → GSK3B hyperactivation simultaneously drives: (1) tau hyperphosphorylation (Module D2), (2) β-catenin degradation (Module D12 — Wnt), and (3) pro-apoptotic signaling.

**TXNIP** as metabolic stress sensor: Links glucose metabolism to ER stress and NLRP3 inflammasome (Modules D5 and D7). Under high glucose or oxidative stress, TXNIP is induced and activates the NLRP3 inflammasome.

**Expected spatial pattern:** IRS1↓ + FOXO1↑ (nuclear = transcriptionally active) in neurons of AD DLPFC. MTOR hyperactivity (inferred from RPS6KB1↑, EIF4EBP1↑) coexists with SQSTM1↑ (failed autophagy). Should be worse in DLPFC than FIC for AD, potentially opposite in bvFTD.

**Key citations:** **Arnold et al. 2018, *Brain*** — brain insulin resistance across AD stages. **Yarchoan & Arnold 2014, *Nature Reviews Neurology*** — review of brain insulin resistance mechanisms.

| Pattern | Interpretation |
|---------|---------------|
| INSR↓ + IRS1↓ + FOXO1↑ in neurons | Insulin-resistant neurons with FOXO activation |
| AKT1↓ + GSK3B↑ + MAPT↑ | Insulin resistance driving tau phosphorylation |
| MTOR↑ + RPS6KB1↑ + SQSTM1↑ | mTOR hyperactivity + autophagy block |
| PPARGC1A↓ in neurons | Mitochondrial biogenesis deficit |

### Module D5: Unfolded Protein Response (UPR) — Three Branches

**Available in probeset:** ATF6, EIF2AK3, XBP1, ATF4, DDIT3, HSPA5, HERPUD1, ATF3, TXNIP, GADD45A, GADD45B, PPP1R15A, CASP12, CASP3

**CRITICAL — Three mechanistically distinct UPR branches:**

**Branch 1 — ATF6:** **ATF6** translocates to Golgi upon ER stress, is cleaved by S1P/S2P proteases, producing a 50 kDa active transcription factor that induces pro-survival ERAD genes including **HSPA5** (BiP/GRP78, the master ER chaperone) and **HERPUD1** (ERAD component). This branch is primarily pro-survival.

**Branch 2 — PERK (EIF2AK3):** **EIF2AK3** (PERK) oligomerizes and autophosphorylates, then phosphorylates eIF2α → global translational attenuation (reduces protein load on ER). Paradoxically, p-eIF2α selectively increases translation of **ATF4**, which activates stress-response genes. Chronic ATF4 activation induces **DDIT3** (CHOP), the pro-apoptotic transcription factor. **PPP1R15A** (GADD34) is a PERK-branch negative feedback phosphatase that dephosphorylates eIF2α, restoring translation — its induction marks attempted resolution of PERK signaling.

**Branch 3 — IRE1/XBP1:** IRE1α (not in probeset) is an ER-resident kinase/endonuclease. Upon activation, it splices **XBP1** mRNA to produce XBP1s (spliced), a potent transcription factor driving ERAD genes, lipid biosynthesis, and ER expansion. XBP1 total mRNA level can serve as a proxy.

**Disease dysregulation in AD:** Chronic ER stress in AD neurons drives sustained PERK activation. **Ron & Walter 2007, *Nature Reviews Molecular Cell Biology*** — seminal review defining the three UPR arms and their integration. **Hetz 2012, *Nature Reviews Molecular Cell Biology*** — showed that chronic UPR shifts from adaptive to pro-apoptotic. **Rozpedek et al. 2018, *Current Pharmaceutical Design*** — reviewed UPR targeting as AD therapeutic strategy.

**Adaptive vs. terminal UPR (measurable in seqFISH):**
- HSPA5↑ + XBP1↑ + PPP1R15A↑ = acute/adaptive UPR — cells are stressed but attempting resolution
- DDIT3↑ + CASP3↑ + ATF4↑ + GADD45A/B↑ = chronic/terminal UPR — cells committed to apoptosis
- TXNIP links ER stress to NLRP3 inflammasome (Module D7): PERK → ATF4 → TXNIP → NLRP3 activation

| Pattern | Interpretation |
|---------|---------------|
| HSPA5↑ + XBP1↑ + DDIT3low | Adaptive UPR — pro-survival |
| DDIT3↑ + CASP3↑ + ATF4↑ | Terminal UPR — apoptosis commitment |
| PPP1R15A↑ | Negative feedback engaged — attempting PERK resolution |
| TXNIP↑ + NLRP3↑ (Module D7) | ER stress → inflammasome coupling |

### Module D6: Oxidative Stress & NRF2 Pathway

**Available in probeset:** NFE2L2, KEAP1, NQO1, HMGB1, GPX3, GSTA4, PRDX6, TXNIP, SESN1, SESN2, HSF1

**Pathway mechanism:** Under basal conditions, **KEAP1** sequesters **NFE2L2** (NRF2) in the cytoplasm and targets it for proteasomal degradation. Oxidative stress oxidizes cysteine residues on KEAP1, releasing NRF2, which translocates to the nucleus and binds Antioxidant Response Elements (AREs) to induce detoxification genes: **NQO1** (NAD(P)H quinone dehydrogenase), **GSTA4** (glutathione S-transferase), **GPX3** (glutathione peroxidase), **PRDX6** (peroxiredoxin). **SESN1/SESN2** (sestrins) are NRF2 targets that also activate AMPK and inhibit mTOR — bridging oxidative stress to the mTOR-autophagy axis (Module D13). **HSF1** is the heat shock factor driving the heat shock response (HSP induction — upstream of UPR).

**HMGB1** as DAMP: Released by dying/necrotic neurons into the extracellular space, **HMGB1** acts as a damage-associated molecular pattern (DAMP) that activates microglial TLR4/RAGE receptors → NF-κB → pro-inflammatory cytokine production. HMGB1↑ in extracellular space (measured as microglial-associated expression) marks neuronal death zones.

**Key citations:** **Ramsey et al. 2007, *Journal of Neuropathology and Experimental Neurology*** — NRF2 is predominantly cytoplasmic (inactive) in AD hippocampal neurons despite high oxidative stress, suggesting failed NRF2 activation. **Hybertson et al. 2011, *Free Radical Biology and Medicine*** — comprehensive NRF2-KEAP1 pathway review. **Jiang et al. 2017, *Redox Biology*** — NRF2 activation as neuroprotective strategy in AD.

| Pattern | Interpretation |
|---------|---------------|
| NFE2L2↑ + NQO1↑ + GSTA4↑ | Active NRF2 antioxidant response |
| NFE2L2↓ or unchanged + KEAP1↑ | Failed NRF2 activation (locked in cytoplasm) |
| HMGB1↑ in microglia-enriched zones | DAMP release from dying neurons |
| SESN1↑ + SESN2↑ | Stress-responsive AMPK/mTOR regulation |

### Module D7: Neuroinflammation — NLRP3 Inflammasome & Cytokines

**Available in probeset:** NLRP3, CASP1, IL1B, IL18, GSDMD, PYCARD, P2RX7, AIF1, TXNIP, TNF, IL6, CXCL10, STAT3, NFKB1, C1QA, C1QC, C3, C3AR1, C5AR1, CD68, CLEC7A, MARCO, CD55, CD59, RELA, IKBKB, TGFB1

**NLRP3 inflammasome mechanism (two-signal model):**
- **Signal 1 (priming):** TLR/TNFR activation → **NFKB1/RELA** → transcription of **NLRP3**, pro-**IL1B**, pro-**IL18**.
- **Signal 2 (activation):** Danger signals (Aβ oligomers, ATP via **P2RX7**, ROS, TXNIP) → NLRP3 oligomerization with **PYCARD** (ASC) → **CASP1** activation → cleavage of pro-IL-1β to active IL-1β, pro-IL-18 to active IL-18 → **GSDMD** pore formation in membrane = pyroptosis.

**Complement and synaptic pruning:** **C1QA/C1QC** tag damaged synapses → **C3** opsonization → microglial phagocytosis via **C3AR1**. **Hong et al. 2016, *Science*** — demonstrated that complement and microglia mediate early synapse loss in AD mouse models; C1q is the initiating signal, and microglia engulf C3-tagged synapses in a CR3-dependent manner. **CD55** and **CD59** are complement regulatory proteins that limit complement activation.

**Key citations:** **Heneka et al. 2013, *Nature*** — landmark paper showing NLRP3 inflammasome is activated in AD brains; NLRP3−/− or Casp1−/− APP/PS1 mice were protected from spatial memory loss and showed enhanced Aβ clearance; established the NLRP3/caspase-1 axis as a central driver of AD pathogenesis. **Venegas et al. 2017, *Nature*** — Aβ seeds activate NLRP3 to release ASC specks that cross-seed Aβ aggregation.

| Pattern | Interpretation |
|---------|---------------|
| NLRP3↑ + CASP1↑ + IL1B↑ in microglia | Active inflammasome — pyroptotic signaling |
| C1QA↑ + C3↑ near synaptic markers↓ | Complement-mediated synapse elimination |
| GSDMD↑ + P2RX7↑ | Pyroptotic pore formation |
| CD55↑ + CD59↑ | Attempted complement regulation (protective) |

### Module D8: Autophagy & Lysosomal Dysfunction

**Available in probeset:** BECN1, ATG5, ATG13, SQSTM1, MAP1LC3B, LAMP1, LAMP2, TFEB, ULK1, VPS35, CALCOCO2, NBR1, TMEM175, LRRK2, MCOLN1

**Pathway mechanism:** Autophagy initiation: **ULK1** complex (inhibited by mTOR when nutrients are abundant) → **BECN1** (Beclin-1) nucleation → **ATG5/ATG13** elongation → **MAP1LC3B** (LC3B) lipidation = autophagosome formation. Selective autophagy receptors (**SQSTM1**/p62, **CALCOCO2**/NDP52, **NBR1**) bridge ubiquitinated cargo (misfolded tau, damaged mitochondria) to LC3. Autophagosomes fuse with lysosomes (**LAMP1**, **LAMP2**) for degradation.

**TFEB** is the master lysosomal transcription factor — under basal conditions, mTOR phosphorylates TFEB to keep it cytoplasmic. Stress/mTOR inhibition → TFEB nuclear translocation → transcription of lysosomal biogenesis genes (LAMP1, LAMP2, cathepsins).

**VPS35** (retromer complex) is critical for lysosomal enzyme sorting. **LRRK2** mutations (PD risk, also found in some FTLD) impair lysosomal function. **TMEM175** is a lysosomal K+ channel; AD/PD GWAS risk locus — its loss impairs lysosomal pH regulation.

**Link to tau clearance:** Tau oligomers are cleared by autophagy. When autophagy is blocked (mTOR hyperactivity, Module D13), tau accumulates → feeds forward into aggregation.

**Key citations:** **Menzies et al. 2017, *Neuron*** — comprehensive review of autophagy in neurodegeneration; showed that autophagy-deficient neurons accumulate aggregate-prone proteins and display axonal degeneration. **Lie & Nixon 2019, *Acta Neuropathologica*** — lysosomal dysfunction as early event in AD. **Sardiello et al. 2009, *Science*** — discovery of TFEB as master lysosomal regulator.

| Pattern | Interpretation |
|---------|---------------|
| SQSTM1↑ + MAP1LC3B↑ + LAMP1↓ | Autophagosomes formed but lysosomes depleted |
| TFEB↓ + MTOR↑ (from D13) | mTOR blocks TFEB nuclear entry → lysosomal deficit |
| VPS35↓ + LRRK2↑ | Retromer dysfunction + lysosomal impairment |
| BECN1↓ + ULK1↓ | Autophagy initiation suppressed |

### Module D9: Synaptic Integrity & Plasticity

**Available in probeset:** SYT1 (serial), SNAP25 (serial), SYP, DLGAP1, CAMK2A, CAMK2D, NRXN1, NRXN3, GRIN2A, GRIN2B, GRIA1, GRIA2, GRIA3, BDNF, NTRK1, SLC17A7, GAD1, SLC32A1, GABBR1, GABBR2, SV2A, SV2B, SYN1, SYN2, CPLX2, VAMP1, STX1A, STXBP1, RAB3A

**Pathway mechanism:**
- **Presynaptic:** Synaptic vesicle proteins (**SYT1**, **SNAP25**, **SYP**/synaptophysin, **SV2A/B**, **SYN1/2**, **RAB3A**, **VAMP1**, **STX1A**, **STXBP1**) mediate neurotransmitter release. SYT1 is the calcium sensor; SNAP25/STX1A/VAMP1 form the SNARE complex.
- **Postsynaptic:** **DLGAP1** (scaffold at PSD), **GRIN2A/GRIN2B** (NMDA receptor subunits), **GRIA1/2/3** (AMPA receptor subunits), **CAMK2A/CAMK2D** (calcium/calmodulin kinase II — essential for LTP).
- **Trans-synaptic adhesion:** **NRXN1/NRXN3** (neurexins) — presynaptic adhesion molecules that organize synapse formation and maintenance.
- **Neurotrophic:** **BDNF** (brain-derived neurotrophic factor) → **NTRK1** (TrkA; note: TrkB/NTRK2 not in probeset) → pro-survival and plasticity signaling.
- **Inhibitory synapses:** **GAD1** (GABA synthesis), **SLC32A1** (VGAT), **GABBR1/GABBR2** (GABA-B receptors).

**Disease relevance:** Synaptic density is the strongest correlate of cognitive decline in AD — stronger than plaques or tangles (**Terry et al. 1991, *Annals of Neurology*** — landmark study using immunocytochemical synaptophysin measurement demonstrating that midfrontal synapse density correlated r=0.96 with Mattis Dementia Rating Scale in multivariate analysis). **Sheng et al. 2012, *Neuron*** — reviewed synapse loss mechanisms in AD. E/I balance collapse: SLC17A7↓ + SST↓ in late AD = both excitatory and inhibitory systems fail, but at different rates.

| Pattern | Interpretation |
|---------|---------------|
| SYT1↓ + SNAP25↓ + SYP↓ in neurons | Presynaptic vesicle machinery loss |
| GRIN2A↓ + GRIA2↓ + DLGAP1↓ | Postsynaptic receptor/scaffold loss |
| BDNF↓ + NTRK1↓ | Neurotrophic support failure |
| SLC17A7↓ + GAD1↓ (both) | E/I balance collapse — late AD |

### Module D10: Reactive Gliosis & A1/A2 Astrocyte States

**Available in probeset:** GFAP, VIM, AQP4, GJA1, SLC1A3, C3, TNC, CHI3L1, CXCL10, IL6, STAT3, FGFR3, C1QA

**Pathway mechanism:** **Liddelow et al. 2017, *Nature*** — defined A1 (neurotoxic, C3+) and A2 (neuroprotective) reactive astrocyte states. A1 astrocytes are induced by microglial secretion of TNF, IL-1α, and C1q. A1s lose normal functions (glutamate uptake via **SLC1A3**, synapse support, phagocytosis) and gain a neurotoxic function that kills neurons and oligodendrocytes. **Escartin et al. 2021, *Nature Neuroscience*** — revised the framework, emphasizing that reactive astrocyte states exist on a continuum rather than a strict binary.

**STAT3** is the master transcription factor for reactive astrogliosis — JAK/STAT3 activation drives GFAP upregulation and morphological changes. **CHI3L1** (YKL-40) is a disease-associated astrocyte marker elevated in CSF of AD patients, used clinically as a biomarker. **SLC1A3** (EAAT1) loss → impaired glutamate reuptake → excitotoxicity.

**Spatial expectation:** In AD, C3+ astrocytes should concentrate in regions of highest pathology (amyloid plaques, NFTs). In bvFTD, reactive astrogliosis in FIC should surround zones of VEN loss.

| Pattern | Interpretation |
|---------|---------------|
| GFAP↑ + VIM↑ + C3↑ + SLC1A3↓ | A1-like neurotoxic astrocytes — harmful |
| GFAP↑ + VIM↑ + C3↓ + SLC1A3maintained | Reactive but not neurotoxic (A2-like) |
| CHI3L1↑ + STAT3↑ | Disease-associated astrocyte activation |
| AQP4↓ + GJA1↓ | Loss of homeostatic astrocyte functions |

### Module D11: BBB Integrity

**Available in probeset:** CLDN5, OCLN, TJP1, PECAM1, FLT1, SLC2A1, PDGFRB, ABCB1, ACTA2, ANGPT1, VEGFA

**Pathway mechanism:** Tight junction proteins (**CLDN5**/Claudin-5, **OCLN**/Occludin, **TJP1**/ZO-1) are the physical barrier of the BBB. **SLC2A1** (GLUT1) mediates glucose transport into the brain — GLUT1 reduction impairs brain glucose metabolism (relevant to brain insulin resistance, Module D4). **ABCB1** (P-glycoprotein) mediates Aβ efflux from brain to blood — its downregulation in AD promotes Aβ accumulation.

**PDGFRB-PDGFB axis:** Pericyte coverage (PDGFRB+) stabilizes BBB. Pericyte loss → BBB breakdown → plasma protein extravasation → neurotoxicity. **Sweeney et al. 2019, *Nature Neuroscience*** — comprehensive review establishing that BBB breakdown is an early biomarker of cognitive decline, preceding Aβ and tau pathology. **Zhao et al. 2015, *Journal of Clinical Investigation*** — APOE4 accelerates pericyte loss and BBB breakdown.

**ANGPT1** (angiopoietin-1) stabilizes endothelium via Tie2 signaling. **VEGFA** promotes angiogenesis but in excess can increase BBB permeability.

| Pattern | Interpretation |
|---------|---------------|
| CLDN5↓ + OCLN↓ + TJP1↓ | Tight junction loss = BBB breakdown |
| PDGFRB↓ + ABCB1↓ | Pericyte loss + reduced Aβ efflux |
| SLC2A1↓ in endothelium | Impaired brain glucose transport |
| VEGFA↑ + ANGPT1↓ | Pro-permeability shift |

### Module D12: Wnt Signaling in AD

**Available in probeset:** CTNNB1, GSK3B, LRP5, LRP6, FZD1, FZD7, FZD8, TCF7L2, LEF1, RSPO2, ZNRF3, SMURF1, SMURF2

**Pathway mechanism:** Canonical Wnt signaling: Wnt ligands bind **FZD1/7/8** receptors + **LRP5/6** co-receptors → Dishevelled activation → inhibition of the β-catenin destruction complex (which includes **GSK3B**, APC, Axin) → **CTNNB1** (β-catenin) accumulates and enters nucleus → partners with **TCF7L2/LEF1** to drive target gene transcription. **RSPO2** amplifies Wnt signaling by neutralizing **ZNRF3** (a negative regulator that ubiquitinates FZD for degradation). **SMURF1/SMURF2** are E3 ubiquitin ligases that target Wnt pathway components.

**AD connection (GSK3B as convergence):** In the absence of Wnt signaling, GSK3B phosphorylates β-catenin for degradation AND phosphorylates tau. AD features Wnt suppression → GSK3B hyperactivation → dual hit: loss of Wnt target gene expression + tau hyperphosphorylation. **Inestrosa & Varela-Nallar 2014, *Nature Reviews Neuroscience*** — reviewed neuroprotective role of Wnt signaling and how its loss contributes to AD progression. **Purro et al. 2014, *Journal of Neuroscience*** — showed that soluble Aβ directly inhibits Wnt signaling by binding LRP6.

| Pattern | Interpretation |
|---------|---------------|
| CTNNB1↓ + GSK3B↑ + MAPT↑ | Wnt suppression + tau pathology (dual hit) |
| FZD1↓ + LRP6↓ in neurons | Receptor-level Wnt suppression |
| TCF7L2↓ + LEF1↓ | Loss of Wnt target gene transcription |
| RSPO2↓ + ZNRF3↑ | Wnt amplifier lost, negative regulator active |

### Module D13: mTOR-Autophagy Axis (Convergence Module)

**Available in probeset:** MTOR, RPTOR, RICTOR, TSC1, TSC2, AKT1, PTEN, PIK3CA, DEPTOR, MLST8, RPS6KB1, EIF4EBP1, EIF4EBP2, MAPKAP1, ULK1

**Cross-reference:** This module explicitly bridges Module D4 (insulin resistance) and Module D8 (autophagy).

**Key concept:** mTOR exists in two complexes: mTORC1 (**MTOR** + **RPTOR** + **MLST8** + **DEPTOR**) promotes protein synthesis and inhibits autophagy. mTORC2 (**MTOR** + **RICTOR** + **MLST8** + **MAPKAP1**) regulates AKT. When insulin signaling is intact, AKT → TSC1/TSC2 inhibition → mTORC1 active → ULK1 inhibited → autophagy suppressed. In AD, insulin resistance paradoxically leads to mTOR hyperactivity through alternative pathways (Aβ-mediated PI3K activation, amino acid sensing), creating a state where both insulin signaling is impaired AND mTOR is hyperactive.

**Consequence:** mTOR hyperactivity simultaneously (1) promotes protein synthesis (including tau), and (2) blocks autophagy (ULK1 inhibition → SQSTM1/p62 accumulation → misfolded protein clearance failure). **DEPTOR** is an endogenous mTOR suppressor that is reduced in AD brain.

**Key citations:** **Cai et al. 2012, *Neuroscience Bulletin*** — mTOR hyperactivation in AD. **Tramutola et al. 2015, *Brain Research Bulletin*** — mTOR dysregulation drives both Aβ and tau pathology in AD.

| Pattern | Interpretation |
|---------|---------------|
| MTOR↑ + RPTOR↑ + RPS6KB1↑ + ULK1↓ | mTORC1 hyperactive, autophagy blocked |
| DEPTOR↓ + TSC1↓ | Lost mTOR brakes — unchecked activity |
| RICTOR↓ + AKT1↓ | mTORC2 impaired → insulin resistance |
| PTEN↑ | PI3K/AKT pathway suppressed |

---

## Section 3: Biological Hypothesis Modules

### Hypothesis H1: Cannabinoid Neuroprotection Failure

**STATUS: HYPOTHESIS — supported by preclinical and postmortem observational data; no human interventional confirmation.**

**Full narrative:** The endocannabinoid system normally serves as a brake on neuroinflammation (CB2 on microglia) and a modulator of synaptic plasticity (CB1 on neurons). The hypothesis proposes that in AD, this dual neuroprotective system fails through a combination of: (1) CB1 downregulation paralleling synaptic loss, removing retrograde signaling that normally prevents excitotoxicity; (2) excessive FAAH activity in reactive astrocytes degrading anandamide, reducing its anti-inflammatory tone; and (3) CB2 upregulation in microglia that is initially compensatory but becomes insufficient as NLRP3-driven inflammation overwhelms the system.

**Expected spatial signature if correct:** In DLPFC AD tissue, spatially resolved zones near amyloid plaques should show: CNR2↑ in microglia co-localizing with TREM2↑ and AIF1↑ (DAM response); surrounding neurons show CNR1↓ + SYT1↓ + SNAP25↓ (synaptic loss zone); FAAH↑ in GFAP+ astrocytes between plaque-proximal microglia and distant neurons. The ratio CNR2/CNR1 across the tissue should correlate with local inflammation severity (NLRP3↑/IL1B↑). MGLL↑ would further indicate 2-AG degradation, reducing a second neuroprotective eCB.

**Cross-disease prediction:** bvFTD in FIC should show less CB2 upregulation (less amyloid pathology) but may show FAAH dysregulation near TDP-43 inclusion zones.

### Hypothesis H2: Brain Insulin Resistance → Tau Cascade

**STATUS: HYPOTHESIS — supported by strong correlational human data and mechanistic animal models.**

**Full hypothesis chain as RNA readout:**
1. **INSR↓** in neurons (receptor downregulation from chronic hyperinsulinemia or Aβ interference)
2. → **IRS1** present but serine-phosphorylated (inhibited) — RNA level may be unchanged or slightly↓
3. → **AKT1↓** (reduced PI3K→AKT signaling)
4. → **GSK3B** released from AKT inhibition → effectively hyperactive (RNA may be unchanged, but the pathway is activated; look for downstream readout)
5. → **MAPT** hyperphosphorylation → NFT formation. MAPT RNA↑ may occur as a compensatory response
6. → **FOXO1↑** and **FOXO3↑** nuclear translocation (AKT normally excludes FOXOs; when AKT↓, FOXOs become active transcription factors driving stress genes including SESN1/2, TXNIP)
7. → **MTOR** hyperactivity (through alternative pathways) → **ULK1↓** → autophagy block → **SQSTM1↑** accumulation → failed tau clearance

**Cross-region prediction:** This cascade should be worse in DLPFC than FIC for AD (because DLPFC is affected at earlier Braak stages and shows more tangle burden in typical AD). For bvFTD, FIC should show more stress (but through TDP-43 rather than tau/insulin axis — test by checking TARDBP↓ nuclear + MAPT unchanged).

### Hypothesis H3: Stress Response Hierarchy

**STATUS: HYPOTHESIS — conceptual framework supported by individual pathway evidence but sequential hierarchy not directly proven in human AD tissue.**

**The cell makes sequential choices under proteotoxic stress:**

**Decision Node 1 — Heat Shock Response:** First line of defense. **HSF1** activation → **HSPA5** (BiP) induction as ER chaperone + cytoplasmic HSPs. If protein folding capacity is restored, the cell returns to homeostasis. Probeset readout: HSF1↑ + HSPA5↑ + HERPUD1 unchanged = early/mild stress.

**Decision Node 2 — UPR activation:** If chaperone capacity is exceeded, the three UPR branches activate. Adaptive UPR: ATF6↑ + XBP1↑ + HSPA5↑ (chaperone boost) + PPP1R15A↑ (GADD34 feedback). The cell attempts to restore ER function by expanding ER capacity and activating ERAD. Probeset readout: ATF6↑ + XBP1↑ + HSPA5↑ + DDIT3low = adaptive.

**Decision Node 3 — Chronic stress → NLRP3/pyroptosis:** If UPR fails to resolve, chronic PERK activation induces DDIT3 (CHOP) + ATF4 → TXNIP↑ → NLRP3 inflammasome activation (microglia) or intrinsic apoptosis (CASP3/CASP9 in neurons). GSDMD↑ in microglia = pyroptotic death. Probeset readout: DDIT3↑ + TXNIP↑ + CASP3↑ + NLRP3↑ (in microglia) = terminal.

**Distinguishing adaptive from maladaptive stress in AD neurons:**
- Adaptive: HSF1↑, HSPA5↑, XBP1↑, SESN1↑, PPP1R15A↑, BCL2 maintained → cell is fighting
- Maladaptive: DDIT3↑, ATF4↑, CASP3↑, TXNIP↑, BCL2↓, SQSTM1↑ → cell is dying

---

## Section 4: Laminar Architecture & Subclustering Strategy

### 4.1 Excitatory Neuron Laminar Subclusters

| Layer | Key Markers (probeset) | Expected Location | Notes |
|-------|----------------------|-------------------|-------|
| L2/3 | CUX2high, SLC17A7+, CAMK2A+, SATB2+ | Superficial cortex | Upper-layer IT neurons |
| L4 | RORBhigh (serial), SLC17A7+ | Mid-cortex (DLPFC only) | FIC is agranular — no L4 |
| L5a | FOXP2high, NRP1+ | Deep cortex, upper L5 | Includes VENs in FIC (ADCYAP1+) |
| L5b | FEZF2high, BCL11B+ | Deep cortex, lower L5 | Corticospinal/subcortical projection |
| L6 | TBR1high, SYNPRhigh, CRYM+ | Deepest cortex | Corticothalamic |

**FIC-specific note:** FIC is agranular cortex (lacks a discernible layer 4). This means RORB+ cells in FIC may represent a transitional or ectopic population. In FIC, the laminar structure is L1/L2-3/L5/L6, with L5a containing VENs (ADCYAP1+). This anatomical difference between DLPFC (granular, 6 layers) and FIC (agranular, ~5 layers) is biologically important — do not force a 6-layer template on FIC.

### 4.2 Inhibitory Neuron Subclusters

| Subtype | Key Markers | Laminar Preference | Vulnerability in AD |
|---------|------------|-------------------|-------------------|
| SST+ Martinotti | SST, LHX6 | L2-5 (dendrite targeting) | **High** — most depleted |
| PVALB+ basket/chandelier | PVALB, LHX6, SCN1A | L3-5 (perisomatic) | Intermediate |
| VIP+ bipolar | VIP, PROX1, CALB2 | L1-2/3 (disinhibitory) | Relatively spared |
| LAMP5+/ADARB2+ | LAMP5, ADARB2 (serial) | L1-2 (neurogliaform) | Under investigation |
| CCK+ basket | CCK | Perisomatic | Variable |

### 4.3 Clustering Strategy Recommendations

**Step 1 — Major cell type identification:** Use the full gene panel. Assign cells to: Excitatory neuron, Inhibitory neuron, Astrocyte, Microglia, Oligodendrocyte, OPC, Endothelial, Pericyte, VEN. Use PRIMARY markers from Section 1 with EXCLUSION markers for disambiguation.

**Step 2 — Excitatory neuron laminar subclustering:** Subset SLC17A7+ cells. Use the laminar marker panel (CUX2, RORB, FOXP2, FEZF2, TBR1, BCL11B, SYNPR, CRYM, NRP1) for subclustering. Validate by checking spatial position vs. expected laminar location in tissue.

**Step 3 — Inhibitory neuron subtype subclustering:** Subset GAD1+/SLC32A1+ cells. Use SST, PVALB, VIP, LAMP5, ADARB2, CCK, LHX6, ID2 for subtype assignment.

**Step 4 — Microglial state subclustering:** Subset AIF1+ cells. Use homeostatic (TMEM119, P2RY12, CX3CR1) vs. DAM (TREM2, SPP1, APOE, ITGAX, CLEC7A, CD68) markers. Compute a DAM score per cell.

**Step 5 — Astrocyte state subclustering:** Subset AQP4+/GJA1+ cells. Use C3, GFAP, VIM, CHI3L1, STAT3, SLC1A3 to distinguish homeostatic vs. A1-like vs. pan-reactive states.

**Step 6 — Disease module scoring:** Compute per-cell gene set enrichment scores for each disease module (D1–D13). Overlay on spatial map to identify disease-associated spatial domains. Use these scores to identify subpopulations within each cell type that show disease pathway activation.

---

## Section 5: Pipeline Pause Points (User Validation Checkpoints)

**Checkpoint 1 — After initial clustering:** Show UMAP colored by marker gene expression for each cell type. Show cell type assignment proportions per sample. User validates: Are all expected cell types present? Are proportions reasonable (neurons should dominate, glia ~30-50%)? Are there doublet clusters?

**Checkpoint 2 — After excitatory neuron subclustering:** Show spatial plot with laminar assignments overlaid on tissue section. In DLPFC, verify that CUX2+ cells are superficial, RORB+ cells are mid-cortex, FEZF2+/TBR1+ cells are deep. In FIC, confirm absence of RORB+ L4 band.

**Checkpoint 3 — After inhibitory neuron subclustering:** Show subtype proportions per sample. Verify SST+/PVALB+/VIP+ ratios are consistent with known cortical composition (~30% each for SST/PV, ~15% VIP, rest LAMP5/CCK/other).

**Checkpoint 4 — After microglial state assignment:** Show homeostatic vs. DAM proportions across conditions (CN vs. AD vs. bvFTD). Expect: more DAM in AD, variable in bvFTD. Show spatial clustering of DAM microglia.

**Checkpoint 5 — After module scoring:** Show heatmap of module scores by cell type and spatial domain. User validates: Do disease modules activate in expected cell types (e.g., NLRP3 in microglia, UPR in neurons)?

**Checkpoint 6 — Before DE analysis:** User confirms comparison groups (AD vs. CN, bvFTD vs. CN, AD vs. bvFTD) and stratification strategy (by cell type? by region? by Braak stage?).

---

## Section 6: Differential Neuronal Vulnerability Modules

These modules address which specific cell populations are selectively lost, enriched in pathology, or show early transcriptional distress in AD/FTD. Because seqFISH provides both cell identity and spatial location, these vulnerability patterns are directly testable.

### 6.1 RORB+ Excitatory Neurons (Layer 4) — Early Vulnerability in AD

**Available in probeset:** RORB (serial), CUX2, FEZF2, TBR1, BCL11B, MAPT, CDK5, GSK3B, CAMK2A, SLC17A7, NTRK1, BDNF, SQSTM1, HSPA5, DDIT3

**Mechanistic background:** **RORB** (RAR-related orphan receptor B) is a transcription factor that marks layer 4 granular excitatory neurons in sensory and association cortex. These neurons receive thalamocortical input and relay information to upper and deep cortical layers, positioning them as critical computational nodes. RORB+ neurons have high metabolic demand due to their dense connectivity and relatively long, unmyelinated intracortical axons projecting to higher-order association areas. This metabolic vulnerability makes them susceptible to energy failure (insulin resistance, Module D4), oxidative stress (Module D6), and tau propagation along axonal projections (Module D2).

**Leng et al. 2021, *Nature Neuroscience*** — used single-nucleus RNA-seq of the entorhinal cortex and superior frontal gyrus across AD stages to identify selectively vulnerable neuronal populations. They found that RORB is a marker of selectively vulnerable excitatory neurons in the entorhinal cortex, validating their depletion and selective susceptibility to neurofibrillary inclusions during disease progression using quantitative neuropathology. This was the first unbiased transcriptomic identification of RORB as a vulnerability marker.

**Otero-Garcia et al. 2022, *Cell*** — developed methods for high-throughput isolation and transcriptome profiling of single neuronal somas bearing NFTs from human AD brain. Key finding: RORB+ neurons were disproportionately represented in the NFT transcriptome. NFT-bearing neurons showed marked upregulation of synaptic transmission genes (including a core set of 63 genes enriched for synaptic vesicle cycling), while oxidative phosphorylation and mitochondrial dysfunction signatures were highly cell-type dependent. This suggests NFTs reflect cell-type-specific stress responses rather than a uniform death program.

**FIC note:** FIC is agranular cortex — it lacks a true granular layer 4. Therefore, RORB+ cells in FIC, if detected, may represent an ectopic or transitional population distinct from canonical L4 neurons in DLPFC. Characterizing these cells separately is essential; they should not be combined with DLPFC L4 RORB+ neurons in any comparative analysis.

**DLPFC prediction:** Expect a clear RORB+ band in L4 in CN tissue. In AD, measure depletion of RORB+ cell count. Remaining RORB+ cells in AD should show stress module enrichment: MAPT↑ (tau response), CDK5↑/GSK3B↑ (tau kinases active), SQSTM1↑ (autophagy failure), and potentially DDIT3↑ (terminal UPR) versus HSPA5↑ (adaptive UPR) depending on disease stage.

**Upstream/downstream RNA correlations:** RORB+ neuron loss should correlate with reduced CAMK2A and SLC17A7 expression in the L4 band, increased C1QA/C3 in flanking astrocytes (complement-mediated clearance of dying neurons), and increased AIF1/TREM2 in local microglia (phagocytic response).

**Cross-disease:** AD shows significant RORB+ L4 loss; bvFTD primarily targets FIC (agranular, no L4), so RORB+ depletion should be minimal or absent in bvFTD unless the DLPFC is also affected at advanced stages.

| Pattern | Interpretation | Expected Region |
|---------|---------------|----------------|
| RORB↓ cell count in L4 + MAPT↑ in remaining RORB+ cells | Early tangle formation in vulnerable L4 population | DLPFC — AD |
| RORB↓ + C1QA↑ + AIF1↑ in same L4 zone | Complement tagging + microglial clearance of dying L4 neurons | DLPFC — AD |
| RORB+ count preserved in L4 | L4 neurons spared (control tissue or early stage) | DLPFC — CN |
| RORB+ cells absent from FIC | Normal agranular architecture — no L4 | FIC — all conditions |
| Rare RORB+ cells in FIC + stress signatures | Ectopic/transitional L4-like neurons under stress | FIC — investigate separately |

### 6.2 Von Economo Neurons (VENs) — FIC Layer Va

**Available in probeset:** ADCYAP1, SLIT2, SLC17A7, MAPT, TARDBP, FUS, SQSTM1, AIF1, TREM2, GFAP, VIM

**Mechanistic background:** VENs are large bipolar projection neurons in layer Va of the anterior cingulate cortex (ACC) and frontoinsular cortex (FIC), found almost exclusively in great apes and humans. **Allman et al. 2011, *Brain Structure and Function*** — established that VENs are more numerous in humans than in other apes, and their large size and simple dendritic morphology suggest they rapidly relay integrative information from FI and ACC to other brain regions. VENs are a distinguishing feature of the salience network, which processes emotional, homeostatic, and socially relevant stimuli.

**Seeley et al. 2006, *Science*** (and **Kim et al. 2012, *Cerebral Cortex***) — demonstrated 56% selective loss of VENs (corrected for total layer 5 neuron loss) in bvFTD, with no significant VEN depletion in AD. This was a landmark finding establishing VENs as the earliest and most selective cellular target in bvFTD. Kim et al. 2012 further showed that this loss is bilateral, disease-specific (not seen in AD), and that right-hemisphere VEN and fork cell losses correlate with anatomical, functional, and behavioral severity in bvFTD.

**Kim et al. 2012, *Brain*** and **Nana et al. 2019, *Acta Neuropathologica*** — showed that VENs preferentially develop TDP-43 inclusions in FTLD-TDP pathology, and that misfolded tau, TDP-43, and FUS all converge on VENs, possibly disrupting a cellular process critical for their survival.

**Probeset markers:** **ADCYAP1** (PACAP, pituitary adenylate cyclase-activating polypeptide) is the most reliable VEN-enriched marker in this probeset. **SLIT2** (axon guidance molecule) is also VEN-enriched. Both should be co-expressed with **SLC17A7** (excitatory). MISSING: GADD45G, a known VEN marker not in the probeset — this represents a gap.

**Spatial predictions:**
- In FIC, identify ADCYAP1+ cells in layer Va. Compare count: bvFTD vs. AD vs. CN.
- If VENs are selectively lost in bvFTD, the layer Va zone should show: (a) fewer ADCYAP1+ cells, (b) increased AIF1+/TREM2+ microglia in the same spatial zone (phagocytic clearance of dead VENs), (c) GFAP+/VIM+ astrocyte reactivity in surrounding neuropil.
- Test whether remaining ADCYAP1+ cells in bvFTD show TARDBP↓ (nuclear TDP-43 loss — the hallmark of FTLD-TDP) or FUS stress signatures.
- VEN count can serve as a spatial biomarker distinguishing bvFTD from AD in FIC tissue.

| Pattern | Interpretation | Expected Condition |
|---------|---------------|--------------------|
| ADCYAP1+ cell count↓ in FIC L5a + AIF1↑/TREM2↑ in same zone | VEN loss with microglial clearance response | bvFTD |
| ADCYAP1+ cell count preserved in FIC L5a | VENs spared — rules against early bvFTD | AD or CN |
| Remaining ADCYAP1+ cells show TARDBP↓ nuclear | TDP-43 mislocalization in surviving VENs | bvFTD (FTLD-TDP) |
| GFAP↑ + VIM↑ in FIC L5a zone with ADCYAP1↓ | Reactive astrogliosis replacing lost VENs | bvFTD |

### 6.3 SST+ Interneurons — Early Vulnerable Inhibitory Population

**Available in probeset:** SST, GAD1, SLC32A1, GABBR1, GABBR2, VIP, PVALB, LAMP5, ADARB2 (serial), LHX6, PROX1, NOS1, CALB1

**Mechanistic background:** SST+ (somatostatin-expressing) Martinotti cells are dendrite-targeting interneurons in layers 2-5 that regulate gain control of pyramidal cell dendritic computation. They provide feedback inhibition to excitatory neurons, and their loss results in E/I imbalance → network hyperexcitability → seizures and accelerated neurodegeneration.

**Mathys et al. 2019, *Nature*** — single-nucleus RNA-seq of prefrontal cortex from AD and control brains identified SST interneurons as the neuronal subtype showing the largest proportional loss in AD. This was replicated by **Cain et al. 2020, *Nature Neuroscience*** — SST interneurons were uniquely reduced in AD among neuronal subtypes in prefrontal cortex. **Integrated multimodal cell atlas of Alzheimer's disease (Green et al. 2024, *Nature Neuroscience*)** — spatial transcriptomics (MERFISH) corroborated the vulnerability of specific SST supertypes; the relative abundances of vulnerable SST neurons were highly correlated (r=0.84) between snRNA-seq and MERFISH datasets with consistent decline across modalities.

**SST as neuropeptide:** The SST gene encodes somatostatin, a neuropeptide with direct neuroprotective effects beyond its role in GABAergic inhibition. SST peptide modulates cortical activity, inhibits growth hormone release, and has anti-inflammatory properties. SST↓ therefore means loss of both inhibitory circuit function AND neuropeptide trophic support.

**Vulnerability hierarchy among inhibitory subtypes:**
- **SST+** — most vulnerable: earliest and most severely depleted in AD across multiple studies and brain regions
- **PVALB+** — intermediate vulnerability: some studies show reduction in advanced AD, but magnitude is less than SST
- **VIP+** — relatively spared: consistently maintained in early-to-moderate AD
- **LAMP5+/ADARB2+** — emerging evidence for vulnerability in entorhinal cortex but less studied in neocortex

**Expected spatial pattern:** SST+ cell count should decrease in AD across L2-5 in DLPFC. The ratio SST/PVALB should decline in AD tissue relative to CN. Within zones of highest SST loss, expect increased NLRP3/C1QA (inflammation/complement) and reduced overall GABAergic tone (GAD1↓ in local niche). VIP+ cells in L1-2 should remain relatively stable, providing a useful internal control.

| Pattern | Interpretation | Expected Condition |
|---------|---------------|--------------------|
| SST↓ + VIP stable + PVALB intermediate | AD inhibitory vulnerability hierarchy | AD |
| SST↓ + GAD1↓ locally + SLC17A7 maintained | E/I imbalance — inhibition collapsing first | Early-moderate AD |
| SST↓ + PVALB↓ + VIP↓ (all types) | Pan-interneuron loss — late-stage degeneration | Late AD |
| SST preserved across layers | Intact inhibitory control | CN |

### 6.4 Layer 5/6 Corticofugal Neurons — Late but Severe Loss

**Available in probeset:** FEZF2, BCL11B, TBR1, FOXP2, MAPT, NTRK1, BDNF, SYNPR, CRYM, SQSTM1, DDIT3, NEFH, NEFM

**Mechanistic background:** **FEZF2+** and **BCL11B+** (CTIP2) neurons in L5b are corticospinal and subcortically projecting neurons, while **TBR1+** L6 neurons are corticothalamic. These long-range projection neurons are vulnerable for several reasons: (1) enormous axon length requiring sustained mitochondrial transport, (2) high energy demand for maintaining action potential propagation over long distances, (3) dependence on target-derived BDNF via NTRK1/TrkB retrograde signaling for survival, and (4) the tau propagation pattern follows Braak staging, moving from entorhinal cortex → association cortices (including DLPFC) → primary cortices, with L5 neurons becoming affected in Braak stages III-IV.

**Neurofilament proteins** (**NEFH**, **NEFM**) are enriched in large projection neurons and are used clinically as biomarkers (neurofilament light chain in CSF/blood). Their RNA expression marks the large-caliber axon neurons most at risk.

**Expected temporal pattern in DLPFC:** At Braak III-IV (when tau reaches DLPFC), FEZF2+ L5b cells should show early signs: MAPT↑ (tau expression response), SQSTM1↑ (failed autophagy/clearance), DDIT3↑ in a subset (terminal UPR). Frank cell loss (FEZF2+ count↓) comes later (Braak V-VI). **SYNPR** and **CRYM** are L6 markers; TBR1+ L6 neurons are affected later than L5b in most AD staging paradigms but show severe loss in end-stage disease.

**BDNF/NTRK1 dependency:** BDNF↓ in the cortex reduces trophic support for L5 projection neurons. NTRK1↓ (TrkA) on these neurons diminishes their responsiveness to whatever BDNF remains. This creates a positive feedback loop: stressed neurons produce less BDNF → neighboring neurons lose trophic support → accelerating loss.

| Pattern | Interpretation | Braak Stage |
|---------|---------------|-------------|
| FEZF2+ cells with MAPT↑ + SQSTM1↑ but count preserved | Early tau accumulation, pre-cell loss | III-IV |
| FEZF2+ count↓ + DDIT3↑ in remaining cells | Active cell death in L5b projection neurons | V-VI |
| TBR1+ L6 count↓ + SYNPR↓ + CRYM↓ | Late corticothalamic neuron loss | V-VI |
| BDNF↓ tissue-wide + NTRK1↓ in L5 | Neurotrophic collapse | IV-VI |

### 6.5 Microglial DAM Gradient — Spatial Proximity to Plaques

**Available in probeset:** TMEM119, P2RY12, CX3CR1, TREM2, SPP1, APOE, ITGAX, CLEC7A, CD68, MARCO, AIF1, MRC1, CSF1R, SPI1, IRF8, MAFB, SALL1, HLA-DRA, CD74

**Mechanistic background:** **Keren-Shaul et al. 2017, *Cell*** — landmark study using single-cell RNA-seq of sorted immune cells from 5xFAD mice that defined Disease-Associated Microglia (DAM) as a novel microglia type. Key finding: DAM activation proceeds through a two-step transcriptional program. Stage 1 (TREM2-independent) involves downregulation of homeostatic genes (TMEM119, P2RY12, CX3CR1) with modest upregulation of a subset of DAM genes including APOE. Stage 2 (TREM2-dependent) involves full upregulation of phagocytic and lipid metabolism genes (SPP1, ITGAX, CLEC7A, CD68). TREM2-deficient mice arrest at Stage 1 and cannot progress to Stage 2, demonstrating that TREM2 is the gatekeeper for full DAM activation.

**Spatial hypothesis:** DAM exist on a gradient relative to amyloid plaques. Microglia closest to plaque cores should show the strongest Stage 2 DAM signature (TREM2high, SPP1high, CLEC7Ahigh). With increasing distance from plaques, microglia should transition through Stage 1 back to homeostatic states. Even without antibody staining for amyloid, plaque locations can be inferred from spatial clustering of TREM2high/SPP1high microglia — these clusters themselves mark the plaque niche.

**Probeset coverage and gaps:** The probeset covers the homeostatic markers well (TMEM119, P2RY12, CX3CR1) and has strong Stage 2 DAM markers (TREM2, SPP1, APOE, ITGAX, CLEC7A, CD68). MISSING: CST7, LPL, GPNMB — three highly specific DAM markers that would improve sensitivity. Acknowledge this gap; rely on the available markers for a composite DAM score.

**Perivascular/BAM distinction:** **MRC1** (CD206)+, **MARCO**+ microglia may represent border-associated macrophages (BAMs) rather than parenchymal DAM. These should be distinguished by spatial location (perivascular vs. parenchymal) and excluded from DAM gradient analysis.

**Cross-disease:** In bvFTD with TDP-43 pathology, DAM-like microglia may cluster around zones of neuronal loss rather than amyloid plaques. The microglial signature may be more inflammatory (NLRP3+, IL1B+) and less clearly organized into the two-step DAM program described in amyloid models.

| Pattern | Interpretation | Spatial Context |
|---------|---------------|-----------------|
| TMEM119↓ + P2RY12↓ + CX3CR1↓ + TREM2low | Stage 1 DAM — early activation, TREM2-independent | Intermediate plaque distance |
| TREM2↑ + SPP1↑ + ITGAX↑ + CLEC7A↑ + CD68↑ | Stage 2 DAM — full phagocytic activation | Plaque-proximal |
| Spatial cluster of TREM2high microglia | Putative plaque-proximal niche (inferred plaque location) | Any region |
| TMEM119high + P2RY12high + CX3CR1high | Homeostatic microglia — plaque-distal or control tissue | Plaque-distal or CN |
| MRC1↑ + MARCO↑ near CLDN5+ endothelium | Border-associated macrophages — NOT parenchymal DAM | Perivascular |

### 6.6 Oligodendrocyte Vulnerability — White Matter & Myelin Integrity

**Available in probeset:** MOG, PLP1, OLIG1, OLIG2, CNP, MAG, PDGFRA, CSPG4, OPA1, MFN2, MYRF, SOX10, ENPP6, GPR17, UGT8

**Mechanistic background:** Oligodendrocytes are among the most metabolically vulnerable cells in the CNS. Each oligodendrocyte myelinates up to 50 axonal segments, requiring enormous lipid and protein synthesis. This makes them particularly susceptible to ER stress (Module D5), oxidative stress (Module D6), and energy failure. Myelin breakdown contributes to axonal dysfunction and is an early event in AD, occurring before frank neuronal loss in many white matter tracts.

**Mathys et al. 2023, *Nature*** (and the subsequent **Green et al. 2024, *Nature Neuroscience*** integrated atlas) — identified oligodendrocyte transcriptomic dysregulation in AD, including stress response signatures and reduced expression of myelination genes. The oligodendrocyte compartment showed coordinated downregulation of myelin structural genes with upregulation of stress-response programs.

**Key markers and their interpretation:**
- **MOG/PLP1/MAG** = myelin structural integrity. Downregulation signals demyelination or OL distress.
- **CNP** = active myelination marker. CNP↓ indicates myelination capacity loss.
- **MYRF** = myelin regulatory factor (master transcription factor for myelination genes). MYRF↓ = transcriptional program for myelination shutting down.
- **OPA1** = mitochondrial fusion protein. OPA1↓ in OLs indicates mitochondrial fragmentation/dysfunction.
- **MFN2** = mitofusin 2, another mitochondrial fusion protein. MFN2↓ compounds mitochondrial distress.
- **OLIG2/MOG ratio:** OLIG2 is maintained even when mature OL genes drop. A high OLIG2/low MOG pattern suggests OLs that retain lineage identity but have lost functional myelinating capacity.

**OPC dynamics:** **PDGFRA+/CSPG4+** OPCs are the regenerative pool. If mature OLs are lost, compensatory OPC proliferation may increase PDGFRA+ cell count. **GPR17** marks OPCs transitioning toward maturation. **ENPP6** is a newly myelinating OL marker.

**Expected spatial pattern:** In white matter tracts and deep cortical layers (L6, subcortical white matter border), expect MOG↓/PLP1↓/MAG↓/CNP↓ in AD. Surrounding axons (NEFM+/NEFH+) should show signs of distress if myelin support is lost. PDGFRA+ OPC count may increase (compensatory) or decrease (exhausted pool) depending on disease stage.

| Pattern | Interpretation | Expected Context |
|---------|---------------|-----------------|
| MOG↓ + PLP1↓ + MAG↓ + CNP↓ | Myelin gene collapse — active demyelination | AD white matter/deep layers |
| OLIG2 maintained + MOG↓ | OLs alive but not myelinating — functional failure | AD, transitional state |
| OPA1↓ + MFN2↓ in OLs | Mitochondrial fragmentation in stressed OLs | AD/bvFTD deep cortex |
| PDGFRA↑ + GPR17↑ + ENPP6↑ | Compensatory OPC mobilization and maturation | Early AD, regenerative response |
| PDGFRA↓ + CSPG4↓ | OPC pool exhaustion — no regenerative capacity | Late AD |

### 6.7 Layer-Level Vulnerability Summary Table

| Layer | Primary Cell Types | Key Markers (probeset) | Vulnerability in AD | Vulnerability in bvFTD | Expected Change in Disease | Key Papers |
|-------|-------------------|----------------------|--------------------|-----------------------|---------------------------|------------|
| L1 | LAMP5+/ADARB2+ interneurons, astrocyte endfeet | LAMP5, ADARB2 (serial), AQP4 | Low-moderate | Low | Astrocyte reactivity (GFAP↑), interneurons under study | Hodge et al. 2019, *Nature* |
| L2/3 | CUX2+ excitatory IT neurons, VIP+ interneurons, SST+ | CUX2, VIP, SST, CAMK2A, SLC17A7 | Moderate (SST↓, excitatory preserved longer) | Variable | SST↓ earliest; CUX2+ neurons affected at Braak IV-V | Leng et al. 2021, *Nat Neurosci*; Mathys et al. 2019, *Nature* |
| L4 | RORB+ granular excitatory neurons | RORB (serial), SLC17A7 | **HIGH** — early tangle-bearing, depleted | N/A in FIC (agranular) | RORB+ count↓, MAPT↑ in remaining cells | Otero-Garcia et al. 2022, *Cell*; Leng et al. 2021, *Nat Neurosci* |
| L5a / VEN zone | FOXP2+ excitatory, VENs (ADCYAP1+), SST+ | FOXP2, ADCYAP1, SLIT2, SST, NRP1 | Moderate (excitatory), SST high | **VERY HIGH for VENs** — 56% loss | VEN count↓ in bvFTD; TARDBP stress in remaining VENs | Seeley et al. 2006, *Science*; Kim et al. 2012, *Cereb Cortex* |
| L5b | FEZF2+/BCL11B+ corticofugal, PVALB+ | FEZF2, BCL11B, PVALB, NEFH, NEFM | High (Braak V-VI) | Moderate-high | MAPT↑ → SQSTM1↑ → count↓ (late) | Braak & Braak 1991, *Acta Neuropathol* |
| L6 | TBR1+ corticothalamic | TBR1, SYNPR, CRYM, FOXP2 | Moderate-high (late) | Variable | TBR1+ count↓ late; SYNPR↓ | Hodge et al. 2019, *Nature* |
| White matter | Oligodendrocytes (MOG+), OPCs (PDGFRA+) | MOG, PLP1, CNP, MAG, PDGFRA, CSPG4 | High — early myelin breakdown | Moderate | MOG↓/PLP1↓ early; OPC compensatory then exhaustion | Mathys et al. 2023, *Nature*; Green et al. 2024, *Nat Neurosci* |

**FIC-specific note:** FIC is agranular cortex. The L4 row does not apply. The L5a/VEN zone is the most diagnostically important layer in FIC for distinguishing bvFTD from AD. In DLPFC, L4 is the most diagnostically informative layer for AD severity.

---

## Master Cross-Reference Table: Gene → Module Membership

Genes appearing in 3+ modules are listed below. All genes are confirmed present in probeset.

| Gene | Modules | Biological Rationale for Multi-Module Membership |
|------|---------|------------------------------------------------|
| **GSK3B** | D2 (Tau), D4 (Insulin), D12 (Wnt), D13 (mTOR), H2, H3 | Convergence kinase: phosphorylates tau, β-catenin; regulated by AKT/insulin |
| **MAPT** | D2 (Tau), D4 (Insulin), D8 (Autophagy), 6.1, 6.4, H2 | Tau protein: substrate of kinases, autophagy cargo, vulnerability marker |
| **AKT1** | D4 (Insulin), D13 (mTOR), H2 | Central kinase in insulin/PI3K pathway, mTOR activator |
| **MTOR** | D4 (Insulin), D8 (Autophagy), D13 (mTOR-Autophagy), H2, H3 | Dual role: protein synthesis + autophagy inhibition |
| **TXNIP** | D4 (Insulin), D5 (UPR), D6 (Oxidative), D7 (NLRP3), H3 | Metabolic stress sensor linking glucose/ER stress/inflammasome |
| **SQSTM1** | D2 (Tau), D8 (Autophagy), D13 (mTOR), 6.1, 6.4 | Autophagy receptor (p62); accumulates when clearance fails |
| **APOE** | D1 (Amyloid/GWAS), 1.4 (Microglia), 6.5 (DAM) | Lipid transport, Aβ clearance, DAM marker, GWAS risk |
| **TREM2** | D1 (Amyloid/GWAS), 1.4 (Microglia), D7 (Inflammation), 6.5 (DAM) | Microglial sensor, DAM gatekeeper, GWAS risk, inflammation |
| **C1QA** | D7 (Inflammation), D10 (Gliosis), 1.4 (Microglia) | Complement initiator, synapse tagging, A1 astrocyte inducer |
| **C3** | D7 (Inflammation), D10 (Gliosis), 1.3 (Astrocyte) | Complement opsonin, A1 astrocyte marker |
| **STAT3** | D7 (Inflammation), D10 (Gliosis) | Transcription factor for reactive astrogliosis and JAK/STAT inflammation |
| **GFAP** | 1.3 (Astrocyte), D10 (Gliosis), 6.2 (VEN) | Pan-reactive astrocyte marker; upregulated in all neurodegeneration |
| **VIM** | 1.3 (Astrocyte), D10 (Gliosis), 6.2 (VEN) | Intermediate filament, reactive astrocyte co-marker |
| **SLC17A7** | 1.1 (Excitatory), D9 (Synaptic), 6.1, 6.2, 6.3, 6.4 | Pan-excitatory neuron marker; used across all neuron vulnerability analyses |
| **CDK5** | D2 (Tau), 6.1 (RORB vulnerability), H2 | Tau kinase; activated by p25 in neurodegeneration |
| **AIF1** | 1.4 (Microglia), D7 (Inflammation), 6.2 (VEN), 6.5 (DAM) | Pan-microglial marker (Iba1); used to identify all microglial states |
| **HSPA5** | D5 (UPR), D6 (Oxidative), H3 | BiP/GRP78 — ER chaperone, UPR master regulator, stress sentinel |
| **DDIT3** | D5 (UPR), H3, 6.1, 6.4 | CHOP — pro-apoptotic TF; terminal UPR readout |
| **CASP3** | D5 (UPR), D7 (Inflammation), H3 | Executioner caspase; apoptosis endpoint |
| **ULK1** | D8 (Autophagy), D13 (mTOR) | Autophagy initiation kinase; directly inhibited by mTORC1 |
| **TSC1/TSC2** | D4 (Insulin), D13 (mTOR) | mTOR brake — tuberous sclerosis complex |
| **PTEN** | D4 (Insulin), D13 (mTOR) | PI3K antagonist; tumor suppressor that limits AKT/mTOR |
| **PIK3CA** | D4 (Insulin), D13 (mTOR) | PI3K catalytic subunit; bridges insulin receptor to AKT/mTOR |
| **BDNF** | D9 (Synaptic), 6.1 (RORB), 6.4 (L5/6) | Neurotrophin; target-derived survival signal for projection neurons |
| **NTRK1** | D9 (Synaptic), 6.1 (RORB), 6.4 (L5/6) | TrkA receptor; BDNF signaling in neurons |
| **LAMP2** | D2 (Tau), D8 (Autophagy) | Lysosomal membrane; chaperone-mediated autophagy; tau clearance |
| **SYT1** (serial) | D9 (Synaptic), D3 (eCB), 6.1, 6.3 | Presynaptic calcium sensor; high-confidence serial marker for synaptic integrity |
| **SNAP25** (serial) | D9 (Synaptic), D3 (eCB) | SNARE complex; serial marker for presynaptic function |
| **SST** | 1.2 (Inhibitory), D9 (Synaptic), 6.3 (SST vulnerability) | Interneuron subtype marker + neuropeptide; vulnerability indicator |
| **GAD1** | 1.2 (Inhibitory), D9 (Synaptic), 6.3 (SST vulnerability) | Pan-inhibitory marker; E/I balance assessment |
| **RORB** (serial) | 1.1 (Excitatory), 6.1 (RORB vulnerability) | L4 marker (serial); vulnerability target in AD |
| **ADCYAP1** | 1.9 (VEN), 6.2 (VEN vulnerability) | VEN marker; bvFTD diagnostic cell counter |
| **TARDBP** | D2 (Tau/proteinopathy), 6.2 (VEN vulnerability) | TDP-43; nuclear loss = FTLD-TDP hallmark |
| **FUS** | D2 (Tau/proteinopathy), 6.2 (VEN vulnerability) | RNA-binding protein; mislocalization in FTLD-FUS |
| **TMEM119** | 1.4 (Microglia), 6.5 (DAM) | Homeostatic microglia marker; lost in DAM transition |
| **P2RY12** | 1.4 (Microglia), 6.5 (DAM) | Homeostatic microglia marker; lost in DAM transition |
| **CD68** | 1.4 (Microglia), D7 (Inflammation), 6.5 (DAM) | Lysosomal/phagocytic activation marker in microglia |
| **MOG** | 1.5 (Oligodendrocyte), 6.6 (OL vulnerability) | Myelin structural protein; demyelination indicator |
| **PLP1** | 1.5 (Oligodendrocyte), 6.6 (OL vulnerability) | Most abundant myelin RNA; structural integrity |
| **PDGFRA** | 1.6 (OPC), 6.6 (OL vulnerability) | OPC marker; regenerative capacity indicator |
| **CLDN5** | 1.7 (Endothelial), D11 (BBB) | Tight junction; BBB permeability measure |
| **PDGFRB** | 1.8 (Pericyte), D11 (BBB) | Pericyte marker; BBB stability |
| **NLRP3** | D7 (Inflammation), H3 | Inflammasome sensor; pyroptosis trigger |
| **NFE2L2** | D6 (Oxidative) | NRF2 transcription factor; antioxidant master regulator |
| **CTNNB1** | D12 (Wnt) | β-catenin; Wnt effector and GSK3B substrate |
| **INSR** | D4 (Insulin), H2 | Insulin receptor; brain insulin resistance marker |

---

## Section 7: Cell Census — Expected Frequencies, Distributions & Detectable Subtypes

This section provides a quantitative reference for what the pipeline should produce. If cell type proportions or distributions deviate substantially from these expectations, investigate before proceeding.

### 7.0 Expected Cell Type Frequencies in Human Cortex (Adult)

The following table synthesizes proportions from major single-nucleus and spatial transcriptomic studies of adult human cortex. Note that snRNA-seq proportions are biased by nuclear isolation (underrepresents large neurons, overrepresents glia); seqFISH proportions may differ because cytoplasmic RNA is captured and cell segmentation is morphology-based.

| Cell Type | Expected % (snRNA-seq) | Region Variation | Key Reference |
|-----------|----------------------|------------------|---------------|
| Excitatory neurons | 20–30% | Higher in gray matter; lower in deep layers near WM | **Mathys et al. 2019, *Nature*** — 80,660 nuclei from PFC, ~30% excitatory; **Hodge et al. 2019, *Nature*** — MTG, glutamatergic:GABAergic ratio ~67:33 among neurons |
| Inhibitory neurons | 5–15% | Relatively even across cortical regions; slightly enriched in L1-3 | **Hodge et al. 2019, *Nature*** — ~33% of neurons; ~10–15% of all nuclei |
| Astrocytes | 20–40% | Highly variable; enriched in superficial layers (L1 especially) and near WM | **Maynard et al. 2021, *Nature Neuroscience*** — DLPFC spatial; astrocyte enrichment in L1 confirmed |
| Oligodendrocytes | 20–35% | Highest near white matter; gradient from WM → L6 → L1 | **Mathys et al. 2019, *Nature*** — OLs dominant glial type in deep cortex; **Maynard et al. 2021, *Nature Neuroscience*** |
| OPCs | 3–8% | Distributed across gray and white matter; slightly enriched in WM | **Marques et al. 2016, *Science*** — OPC frequency ~5% of OL lineage in adult mouse CNS |
| Microglia | 5–10% | Even distribution; may cluster near vasculature | **Mathys et al. 2019, *Nature*** — ~5–7% of nuclei; **Hammond et al. 2019, *Immunity*** |
| Endothelial | 2–5% | Follow vascular density; enriched near pial surface and penetrating arterioles | **Hodge et al. 2019, *Nature*** — <1% in MTG snRNA-seq (underrepresented); spatial studies show ~3–5% |
| Pericytes/SMC | 1–3% | Co-localize with endothelial cells along vessels | Low capture in snRNA-seq; better in spatial |
| Non-microglial immune | 0.5–2% | Rare; enriched near meninges, choroid plexus, perivascular spaces | **Gate et al. 2020, *Nature*** — T cells elevated in AD CSF/brain |

**seqFISH-specific notes:** (a) Neurons are large cells with abundant cytoplasmic RNA — they may be relatively MORE detected in seqFISH than snRNA-seq. Expect neuron proportions at the upper end of ranges. (b) Cell segmentation artifacts in dense neuropil can produce false "cells" — these appear as low-gene-count profiles lacking clear marker expression; filter aggressively. (c) No nuclear isolation bias means that endothelial and pericyte detection should be improved over snRNA-seq.

### 7.1 Excitatory Neuron Subtypes — Laminar Identity

Excitatory neurons are the most diverse population and require laminar subclustering. The following subtypes are expected, based on **Hodge et al. 2019, *Nature*** (human MTG taxonomy), **Bakken et al. 2021, *Nature*** (cross-species cortical types), and the **Allen Brain Cell Atlas 2023**.

| Subtype | Layer | Primary Markers (probeset) | Relative Frequency | Detection Confidence |
|---------|-------|---------------------------|-------------------|---------------------|
| L2/3 IT | L2-3 | **CUX2**high, **CAMK2A**+, **SLC17A7**+, **SATB2**+ | Most abundant eN in supragranular cortex (~30–40% of eN) | **High** — all markers present |
| L4 IT (granular) | L4 | **RORB**high (serial), SLC17A7+ | ~10–15% of eN in DLPFC; **absent in FIC** (agranular) | **High** — RORB is serial smFISH |
| L5 IT | L5 (upper) | **FOXP2**+, **NRP1**+, **FEZF2** moderate | ~10–15% of eN | **Moderate** — FOXP2 shared with L5 ET |
| L5 ET (extratelencephalic) | L5b | **FEZF2**high, **BCL11B**+, **NEFH**+ | ~5–10% of eN; large projection neurons | **High** — FEZF2/BCL11B combination specific |
| L5/6 NP (near-projecting) | L5-6 boundary | **TBR1**+, **BCL11B** moderate | ~5% of eN; poorly characterized | **Low** — NP markers overlap L6 |
| L6 IT | L6 | **TBR1**high, **SYNPR**+, **CRYM**+ | ~15–20% of eN | **High** — TBR1/SYNPR/CRYM combination |
| L6b (subplate remnant) | Deepest cortex | **BCL11B**+, **TBR1**+ | Rare (<3% of eN); thin layer | **Low** — overlapping markers |
| VENs (FIC/ACC only) | L5a | **ADCYAP1**+, **SLIT2**+, SLC17A7+ | Very rare (<1% of all neurons); FIC/ACC specific | **Moderate** — ADCYAP1 is reasonably specific |

**What we CANNOT detect well:** NR4A2/NURR1 (not in probeset — marks some deep layer types), RELN (not in probeset — marks L1 and some entorhinal neurons), CUX1 (not in probeset — shared L2/3 marker with CUX2). The absence of CUX1 reduces our ability to fully separate L2 from L3 subtypes. The absence of RELN limits characterization of Cajal-Retzius-like cells in L1.

**Not expected in DLPFC/FIC:** Betz cells (motor cortex L5 — not in our brain regions). DG granule cells (**PROX1**+, **NEUROD1**+ — only if hippocampal/DG tissue is included in the study).

### 7.2 Inhibitory Neuron Subtypes

Inhibitory neurons derive from two principal embryonic origins: the medial ganglionic eminence (MGE → SST+ and PVALB+ subtypes, marked by **LHX6**) and the caudal ganglionic eminence (CGE → VIP+, LAMP5+, CCK+ subtypes, marked by **ADARB2** and **PROX1**). Classification references: **Tremblay et al. 2016, *Neuron*** — comprehensive interneuron classification review; **Kepecs & Fishell 2014, *Nature*** — MGE vs. CGE lineage framework.

| Subtype | Lineage | Primary Markers (probeset) | Expected % of iN | Laminar Preference | AD Vulnerability |
|---------|---------|---------------------------|------------------|-------------------|------------------|
| SST+ Martinotti | MGE | **SST**, **LHX6**, **GAD1** | 25–30% | L2-5 (apical dendrite targeting) | **High** — most depleted |
| PVALB+ basket | MGE | **PVALB**, **LHX6**, **SCN1A**, **SLC32A1** | 20–25% | L3-5 (perisomatic) | Intermediate |
| PVALB+ chandelier | MGE | **PVALB**, **LHX6** | ~3–5% (subset of PVALB+) | L2-3 (AIS targeting) | Under study |
| VIP+ bipolar | CGE | **VIP**, **PROX1**, **CALB2**, **ADARB2** (serial) | 15–20% | L1-2/3 (disinhibitory) | Low — relatively spared |
| LAMP5+ neurogliaform | CGE | **LAMP5**, **ADARB2** (serial), **NOS1** | ~10–15% | L1-2 (volume transmission) | Under study |
| CCK+ basket | CGE | **CCK**, **VIP** (some co-express), **GABBR1** | ~5–10% | L2-5 (perisomatic) | Variable |
| ID2+ (diverse) | CGE | **ID2**, present across multiple subtypes | Variable | Distributed | Under study |
| NKX2-2+ | CGE | **NKX2-2** | Rare | L1-2 | Unknown |

**MGE vs. CGE ratio:** In human MTG, **Hodge et al. 2019, *Nature*** found ~44% MGE-derived (**LHX6**+) and ~50% CGE-derived (**ADARB2**+) interneurons, more balanced than the ~70:30 MGE:CGE ratio in mouse. This human-specific enrichment of CGE-derived types is important for interpreting VIP+ and LAMP5+ proportions.

### 7.3 Microglial Subtypes and States

Microglia exist on a spectrum of transcriptional states, not discrete types. The following states can be distinguished with probeset genes, informed by **Keren-Shaul et al. 2017, *Cell*** (DAM), **Hammond et al. 2019, *Immunity*** (lifespan microglial atlas), **Sala Frigerio et al. 2019, *Cell Reports*** (MHC-II microglia), and **Olah et al. 2020, *Nature Communications*** (human microglial diversity).

**State 1 — Homeostatic**
Markers: **P2RY12**high, **TMEM119**high, **CX3CR1**high, **AIF1**+, **SALL1**+, **CSF1R**+
Expected frequency: ~70–80% of microglia in CN brain; decreases in AD
Spatial distribution: evenly distributed, ramified morphology, tiling cortical parenchyma

**State 2 — DAM Stage 1 (TREM2-independent transition)**
Markers: P2RY12↓, TMEM119↓, CX3CR1↓, **APOE** beginning to rise
Expected frequency: ~5–10% in CN; increases in early AD
Spatial distribution: diffuse, not spatially restricted

**State 3 — DAM Stage 2 (TREM2-dependent, fully activated)**
Markers: **TREM2**high, **SPP1**high, **APOE**high, **ITGAX**+, **CLEC7A**+, **CD68**+, **MARCO**+
Expected frequency: Rare in CN (<2%); 10–25% in AD (near plaques)
Spatial distribution: clustered around amyloid plaques; inferred plaque-proximal niche
MISSING: CST7, LPL, GPNMB — highly specific Stage 2 markers absent from probeset

**State 4 — MHC-II / Antigen-presenting**
Markers: **HLA-DRA**high, **HLA-DRB1**high, **CD74**high, **CD83**+, **CD86**+
Expected frequency: ~5–10% of microglia; may increase with aging and AD
Spatial distribution: perivascular and near sites of T cell infiltration
Note: This state overlaps with dendritic cell markers; spatial context (parenchymal vs. perivascular) helps disambiguate

**State 5 — Interferon-responsive**
Markers: **STAT1**high, **CXCL10**high, **IRF1**+, **IRF8**+, **IRF5**+
Expected frequency: Low in CN; elevated in viral challenge or late-stage inflammation
Spatial distribution: may cluster in regions of high cytokine signaling

**State 6 — Proliferating**
Markers: **BIRC5**+ (survivin), **CDK1**+
Expected frequency: Very rare in adult brain (<1% of microglia); may increase after acute injury
Note: Proliferating microglia are more common in development; adult proliferation suggests acute activation

**State 7 — Lipid-associated / metabolically stressed**
Markers: **APOE**high, **ABCA1**+, **ABCG2**+
Expected frequency: Variable; increases in AD
Spatial distribution: near myelin debris, lipid droplets
Note: Overlaps with DAM Stage 2; distinguished by high lipid metabolism gene expression without full phagocytic signature

### 7.4 Astrocyte Subtypes

Astrocyte classification follows **Escartin et al. 2021, *Nature Neuroscience*** (revised reactive astrocyte framework), **Liddelow et al. 2017, *Nature*** (A1/A2), and **Habib et al. 2020, *Nature Neuroscience*** (disease-associated astrocytes in AD).

**1. Protoplasmic astrocytes (gray matter, L1-6)**
Markers: **AQP4**high, **GJA1**+, **SLC1A3**high, **SLC1A2**+, **GLUL**+, **FGFR3**+, **SOX9**+, **FABP7**+
Biology: Ramified processes that tile cortical layers; provide metabolic support, glutamate buffering, ion homeostasis, and synaptic modulation. Most abundant astrocyte type in cortex.

**2. Fibrous astrocytes (white matter)**
Markers: **GFAP**higher (relative to protoplasmic), **VIM**+, **AQP4** lower
Biology: Long, unbranched processes aligned with fiber tracts. More GFAP expression than protoplasmic counterparts.

**3. A1-like reactive (neuroinflammation-induced, neurotoxic)**
Markers: **C3**high, **TNC**+, **CXCL10**+, **CHI3L1**+, **IL6**+, **SERPINE2**+
Frequency: Rare in CN; 15–30% of astrocytes in AD pathology zones (**Liddelow et al. 2017, *Nature***)
Induction: Microglial TNF + IL-1α + C1Q → A1 conversion

**4. A2-like reactive (neuroprotective)**
Markers: **STAT3**+, **TNC**+ (shared with A1); A2-specific markers less well-defined
Note: **Escartin et al. 2021, *Nature Neuroscience*** cautioned against strict A1/A2 binary — reactive states exist on a continuum. Use with caution.

**5. Disease-associated astrocytes (DAA)**
Markers: **GFAP**high, **VIM**high, **CHI3L1**+
**Habib et al. 2020, *Nature Neuroscience*** — identified DAA in 5xFAD mouse model and human AD brain using snRNA-seq; characterized by high GFAP, VIM, and genes involved in endocytosis.
MISSING: HSPB1 (not in probeset) — a characteristic DAA marker.

**6. Bergmann glia** — cerebellar only, NOT expected in DLPFC/FIC.

**Genes missing for full resolution:** S100B, ALDH1L1, SERPINA3 — all absent from probeset. S100B would help distinguish astrocyte populations by layer; ALDH1L1 is a pan-astrocyte marker complementing GFAP; SERPINA3 marks activated astrocytes in AD.

### 7.5 Oligodendrocyte Lineage Subtypes

The oligodendrocyte lineage progresses through a well-characterized differentiation continuum. **Marques et al. 2016, *Science*** — identified 12 populations in the OL lineage from mouse CNS using scRNA-seq, representing a continuum from OPCs to mature OLs. **Jäkel et al. 2019, *Nature*** — showed depletion of specific mature OL subtypes in MS white matter lesions, a pattern likely paralleled in AD.

| Stage | Key Markers (probeset) | Expected Location | Notes |
|-------|----------------------|-------------------|-------|
| OPC | **PDGFRA**+, **CSPG4**+, **OLIG2**+, **SOX10**+, **OLIG1**+ | Distributed; ~5% of glia | Proliferating; regenerative pool |
| COP (committed OPC) | **OLIG2**+, **SOX10**+, PDGFRA decreasing, **GPR17**+ | Near demyelinated areas | Transitional — GPR17 marks commitment |
| Newly formed OL | **CNP**+, MOG low, MAG low, **ENPP6**+ | Active myelination sites | ENPP6 is a newly myelinating OL marker |
| Myelinating OL | **PLP1**high, **MOG**+, **MAG**+, **CNP**+, **OLIG1**+ | White matter, deep cortex | Active myelin formation |
| Mature OL | **PLP1**high, **MOG**+, **MAG**+, **OPALIN**+, **QKI**+, **MYRF**+ | White matter, deep cortex | Stable myelination |
| Stressed OL | HSPA5↑, ATF3↑, DDIT3↑ (UPR module genes) overlaid on MOG+ | Disease zones | OL + UPR = stressed OL |

**QKI** (Quaking RNA-binding protein) is in the probeset and is a useful maturation marker: it regulates myelin gene mRNA splicing and stability. QKI↓ in MOG+ cells suggests dysregulated myelin gene expression.

**OL lineage in AD:** Expect mature OL depletion (MOG↓, PLP1↓) with either compensatory OPC expansion (PDGFRA↑) or OPC exhaustion (PDGFRA↓, CSPG4↓) depending on disease stage. Test: PDGFRA+ OPC count in AD vs. CN — if OPCs expand, the remyelination program is active; if OPCs decline, the regenerative pool is spent.

### 7.6 Rare and Non-Parenchymal Cell Types — Detectability Assessment

#### 7.6.1 Vascular Cell Types

| Cell Type | Key Probeset Genes | Missing Critical Genes | Detection Confidence |
|-----------|-------------------|----------------------|---------------------|
| Arterial endothelial | **CLDN5**+, **PECAM1**+, **FLT1**+, **ACVRL1**+, **DLL4**+ | EFNB2, GJA5 | High |
| Venous endothelial | **CLDN5**+, **PECAM1**+, **NOS3**+ | NR2F2, ACKR1 | Moderate — limited venous-specific markers |
| Capillary endothelial | **CLDN5**+, **SLC2A1**+, **MFSD2A**+, **TFRC**+ | CA4, RGCC | High — most abundant endothelial subtype |
| Tip cells (angiogenic) | **VEGFA**high (in surrounding cells), **DLL4**+ | APLN, ESM1 | Low — rare and transient |
| Arterial pericytes | **PDGFRB**+, **RGS5**+, **ABCC9**+, **ANPEP**+ | KCNJ8, NOTCH3 (NOTCH3 IS in probeset) | High |
| Venous pericytes | **PDGFRB**+, RGS5 lower | Limited markers | Moderate |
| Smooth muscle cells | **ACTA2**+, **MYH11**+, **TAGLN**+, **MYL9**+, **MYLK**+ | CNN1, CALD1 | High |
| Fibroblasts (meningeal) | **COL1A1**+, **COL3A1**+, **FBLN1**+ | DCN, LUM | Moderate — note PDGFRA overlap with OPCs |
| Perivascular macrophages | **MRC1**+, **LYVE1**+, **CD163**+, **MERTK**+ | F13A1 (IS in probeset) | High — all key markers present |

**Perivascular macrophage (PVM) distinction from microglia:** PVMs express **MRC1** (CD206), **LYVE1**, **CD163** — markers largely absent from parenchymal microglia. PVMs reside on vessel walls and can be disambiguated by spatial co-localization with CLDN5+ endothelium. Cite: **Masuda et al. 2022, *Nature*** — brain mononuclear phagocyte diversity.

#### 7.6.2 CNS-Infiltrating and Border Immune Cells

**T cells (infiltrating)**

| T cell subset | Key Probeset Genes | Missing Genes | Detection |
|--------------|-------------------|--------------|----------|
| CD4+ T helper | **CD4**+, **CD247** (CD3ζ)+ | CD3E, CD3D | Moderate |
| CD8+ cytotoxic T | **CD8A**+, **CD247**+ | GZMA, GZMB, PRF1, CD3E | Limited — can identify but not confirm cytotoxicity |
| Treg | **FOXP3**+, **CD4**+, **IL10**+ | CTLA4, IL2RA | Moderate — FOXP3 is specific |
| Th1 | **TBX21**+, **IFNG**+ | CXCR3 (IS in probeset!) | Moderate |
| Th2 | **GATA3**+, **IL4**+ | IL5, IL13 | Limited |
| TRM (tissue-resident memory) | **ITGAE** (CD103)+, **ITGA1** (CD49a)+ | CD69 | Moderate — spatial persistence suggests TRM |

**Gate et al. 2020, *Nature*** — discovered clonally expanded CD8+ TEMRA cells in the CSF of AD patients; these T cells expressed TCR signaling genes and were specific to Epstein-Barr virus antigens. T cell infiltration in AD brain is increasingly recognized as a contributor to neurodegeneration. Expected frequency: <0.5% in CN, potentially 1–3% in advanced AD.

**NK cells:**
Problematic detection. **NCAM1** (CD56) is in the probeset as a serial smFISH gene, but NCAM1 is also expressed by neurons and VENs. Other NK markers (KLRB1, GNLY, NKG2D) are absent. **CONCLUSION: NK cells are NOT reliably detectable** — NCAM1 is too promiscuous. Flag any NCAM1+ non-neuronal cell for manual review.

**B cells:**
CD19, CD20/MS4A1, CD79A — all ABSENT from probeset. **CD38** is present but shared with plasma cells, activated T cells, and myeloid cells. **MS4A2** is present but marks mast cells/basophils, not B cells. **CONCLUSION: B cells CANNOT be detected with this probeset.** State this explicitly in analysis reports.

**Monocyte-derived macrophages (non-microglial):**

| Feature | Microglia | PVM | Monocyte-derived macrophage |
|---------|----------|-----|----------------------------|
| **CX3CR1** | High | Moderate | Low |
| **P2RY12** | High | Absent | Absent |
| **TMEM119** | High | Absent | Absent |
| **CCR2** | Absent | Absent | **High** |
| **CD14** | Low | Moderate | **High** |
| **CD163** | Absent | **High** | Moderate |
| **LYVE1** | Absent | **High** | Absent |
| **MRC1** | Absent | **High** | Variable |
| **FCGR2A** | Present | Present | **High** |

Cite: **Mrdjen et al. 2018, *Immunity*** — high-dimensional single-cell classification of brain mononuclear phagocytes; established marker panels for distinguishing microglia from border-associated macrophages and infiltrating monocytes.

**Mast cells:** **MS4A2**+, **CD63**+ — present but very limited. TPSAB1 (tryptase) absent. Extremely rare in brain parenchyma; more in meninges. Detection: **Low confidence.**

**Neutrophils:** **S100A5**+, **LBP**+, **CXCR2**+, **CXCR1**+, **FCGR2A**+ — present. Neutrophils are NOT normally in healthy brain parenchyma. If detected (S100A5+/CXCR2+/CD14low cells near vessels): suggests active BBB breach and acute inflammation. Detection: **Moderate** — presence itself is diagnostically meaningful.

**Plasmacytoid dendritic cells (pDC):** **LILRA4**+, **LILRA5**+, **IL3RA** (CD123)+ — all in probeset. pDCs are very rare in brain; found mainly in choroid plexus and meninges. They are potent type I interferon producers. Detection: **High** — specific marker combination.

**Conventional dendritic cells (cDC):** **CLEC7A**+, **CD86**+, **CD83**+, **HLA-DRA**+, **HLA-DRB1**+ — all present. **CRITICAL disambiguation problem:** CLEC7A and HLA-DRA/DRB1 are also expressed by DAM Stage 2 microglia and MHC-II microglia, respectively. Distinction requires: cDC = CLEC7A+ + TMEM119 NEGATIVE + P2RY12 NEGATIVE (not microglia) + spatial: perivascular or border zone. Missing: CD1C (specific cDC2 marker) not in probeset.

#### 7.6.3 Rare Cell Type Detectability Summary

| Cell Type | Expected Frequency | Key Probeset Genes | Missing Critical Genes | Detection Confidence | Disambiguation Challenge |
|-----------|-------------------|-------------------|----------------------|---------------------|-------------------------|
| CD4+ T cells | <1% (↑ in AD) | CD4, CD247, FOXP3, TBX21, GATA3 | CD3E, CD3D | Moderate | CD4 shared with some myeloid |
| CD8+ T cells | <0.5% (↑ in AD) | CD8A, CD247, ITGAE, PDCD1, TIGIT | GZMA, GZMB, PRF1 | Moderate | Cannot confirm cytotoxic function |
| Tregs | Very rare | FOXP3, CD4, IL10 | IL2RA, CTLA4 | Moderate | FOXP3 is quite specific |
| NK cells | Very rare | NCAM1 (serial) | KLRB1, GNLY, NKG2D | **Cannot detect** | NCAM1 = neurons |
| B cells | Very rare | None specific | CD19, MS4A1, CD79A | **Cannot detect** | No usable markers |
| Monocyte-derived MΦ | <1% (↑ in AD) | CCR2, CD14, FCGR2A | S100A8, S100A9 | High | CX3CR1low/P2RY12low key |
| Mast cells | Extremely rare | MS4A2, CD63 | TPSAB1, KIT (IS in probeset!) | Low | MS4A2 not specific |
| Neutrophils | Absent normally | S100A5, CXCR2, LBP | S100A8, S100A9 | Moderate | Presence = BBB breach |
| pDCs | Very rare | LILRA4, LILRA5, IL3RA | CLEC4C | High | Specific combination |
| cDCs | Very rare | CLEC7A, CD86, CD83 | CD1C | Low-Moderate | Overlaps with DAM microglia |
| PVMs | Rare (~1%) | MRC1, LYVE1, CD163, MERTK | — | High | Spatial location key |
| Fibroblasts | <1% | COL1A1, COL3A1, FBLN1 | DCN, LUM | Moderate | PDGFRA overlap with OPCs |

---

## Section 8: Immune Cell Convergence — The Neuroinflammation Convergence Hypothesis

### 8.0 The Convergence Hypothesis — Overview

The convergence theory of neurodegeneration proposes that despite diverse initiating events — amyloid (AD), tau (AD/PSP), TDP-43 (FTLD-TDP), α-synuclein (PD/DLB) — all major neurodegenerative diseases converge on a common immune-mediated amplification pathway that drives progressive neuron death. This concept was articulated by **Ransohoff 2016, *Science*** — reviewed how neuroinflammation contributes to neurodegeneration, emphasizing that microglial activation is both a response to and driver of disease progression, creating self-amplifying feedback loops. **Heneka et al. 2015, *Lancet Neurology*** — comprehensive review establishing neuroinflammation as a shared pathogenic mechanism across AD, PD, ALS, and FTD.

The convergence pathway, expressed in terms of this probeset:

**INITIATING DAMAGE** → **DAMPs** → **MICROGLIAL ACTIVATION** → **CYTOKINE STORM** → **BBB DISRUPTION** → **PERIPHERAL IMMUNE INFILTRATION** → **AMPLIFICATION** → **NEURONAL DEATH**

### 8.1 The Core Convergence Circuit (Probeset Genes at Each Node)

The following describes a circuit diagram that should be implemented as a pathway figure in the analysis pipeline.

**Node 1 — Initiating insult (disease-specific)**
AD: **APP**/Aβ oligomers, **PSEN1/PSEN2** (γ-secretase), **MAPT** (tau aggregates)
bvFTD: **TARDBP** (TDP-43 mislocalization), **FUS** (RNA-binding protein aggregation), **GRN** loss (progranulin haploinsufficiency)
Shared: misfolded proteins → cellular stress → release of intracellular contents

**Node 2 — DAMPs released from damaged/dying neurons**
**HMGB1** — high-mobility group box 1, released from necrotic neurons; activates TLR4 and RAGE on microglia
**C1QA/C1QC** — complement C1q tags damaged synapses and debris for microglial phagocytosis
ATP (endogenous danger signal) → sensed by **P2RX7** on microglia

**Node 3 — Microglial pattern recognition**
**TREM2** — senses lipids, Aβ, and damaged membranes (GWAS risk gene)
**TLR2/TLR4** — sense DAMPs and pathogen-like molecular patterns
**P2RX7** — purinergic receptor sensing extracellular ATP
**CD68** — lysosomal activation marker, phagocytosis

**Node 4 — Microglial inflammasome activation**
**NLRP3** + **PYCARD** (ASC) → **CASP1** → cleaves pro-**IL1B** → active IL-1β secretion
**IL18** — cleaved by CASP1, amplifies inflammation
**TNF** — pro-inflammatory cytokine, also released
**GSDMD** — gasdermin D pore formation = pyroptotic cell death of microglia, releasing more DAMPs

**Node 5 — Local cytokine storm**
**IL6** — pro-inflammatory, activates **STAT3** in astrocytes (drives reactive astrogliosis)
**CXCL10** — chemokine attracting T cells (via CXCR3)
**NFKB1/RELA** — NF-κB transcription factor, master inflammatory regulator
**IL1B** → feeds back to amplify NLRP3 priming (Signal 1)

**Node 6 — BBB response**
**CLDN5**↓, **OCLN**↓, **TJP1**↓ — tight junction protein loss = BBB breakdown
**VCAM1**↑ — vascular cell adhesion molecule, upregulated on inflamed endothelium; promotes leukocyte rolling and transmigration
**ICAM1**↑ — intercellular adhesion molecule, same function
**SLC2A1**↓ — GLUT1 loss = reduced glucose transport into brain
**SELE**↑ — E-selectin, endothelial activation marker for leukocyte capture

**Node 7 — Peripheral immune cell infiltration**
MISSING: CCL2/MCP-1 (NOT in probeset) — the primary monocyte chemoattractant. This is a significant gap.
Present: **CXCL10** (attracts **CXCR3**+ T cells), **CXCL12** (SDF-1, homeostatic chemokine)
**CCR2**+ monocytes infiltrate through disrupted BBB → differentiate into macrophages
**CD4**+ and **CD8A**+ T cells enter brain parenchyma

**Node 8 — Adaptive immune engagement**
**CD4**+ T helper cells: provide cytokine signals that modulate microglial polarization
**CD8A**+ T cells: cytotoxic potential (but functional markers GZMA/GZMB missing from probeset)
**FOXP3**+ Tregs: attempt to suppress inflammation (may be overwhelmed)
**HLA-DRA/DRB1**+ microglia: present antigens to T cells → amplify adaptive response

**Node 9 — Neuronal stress cascades**
UPR: **HSPA5**↑, **ATF4**↑, **DDIT3**↑ → chronic ER stress
Autophagy failure: **SQSTM1**↑, **LAMP2**↓ → cargo accumulation
Oxidative stress: **NFE2L2**↑ (attempted), **NQO1**↑, **TXNIP**↑ → links to NLRP3

**Node 10 — Neuronal death**
**TP53**↑ → apoptosis program activation
**BCL2**↓ → anti-apoptotic defense lost
**CASP9**↑ → intrinsic apoptosis pathway (mitochondrial)
**CASP3**↑ → executioner caspase
**CYBB** (NOX2)↑ → reactive oxygen species production by activated microglia, toxic to neurons

### 8.2 AD-Specific vs. FTD-Specific Immune Signatures

| Feature | AD Expected | bvFTD Expected | Key Probeset Genes | Key Citation |
|---------|------------|---------------|-------------------|-------------|
| TREM2 expression | ↑↑ (major GWAS gene, DAM driver) | Moderate ↑ (not primary driver) | TREM2 | **Guerreiro et al. 2013, *NEJM*** — R47H variant triples AD risk; established TREM2 as a central AD gene |
| Complement | ↑↑ (C1QA, C3 drive synapse pruning) | ↑ (less prominent) | C1QA, C1QC, C3, C3AR1 | **Hong et al. 2016, *Science*** |
| NLRP3 inflammasome | ↑↑ (Aβ and tau both activate) | ↑ (tau/TDP-43 can activate) | NLRP3, CASP1, IL1B, GSDMD | **Heneka et al. 2013, *Nature*** |
| T cell infiltration | ↑ (CD8+ clonal expansion) | ↑↑ (more prominent in some FTLD subtypes) | CD4, CD8A, CD247, CXCR3 | **Gate et al. 2020, *Nature*** |
| TDP-43 pathology | Present in ~50% (LATE) | Primary pathology in FTLD-TDP | TARDBP | **Nelson et al. 2019, *Brain*** |
| GRN/Progranulin | Usually normal (unless GRN risk variant) | ↓↓ in GRN mutation carriers | GRN | **Baker et al. 2006, *Nature*** |
| Cathepsin dysregulation | Moderate | ↑↑ in GRN-FTD (lysosomal dysfunction) | CTSB, CTSS, CTSC | **Götzl et al. 2014, *Acta Neuropathologica*** |
| DAM microglia | Stage 2 DAM prominent, plaque-proximal | Less organized; more diffuse activation | Full DAM panel | **Keren-Shaul et al. 2017, *Cell*** |
| APOE | ↑ in microglia and astrocytes (GWAS risk) | Less prominent role | APOE | **Jansen et al. 2019, *Nature Genetics*** |
| BBB disruption markers | CLDN5↓, ABCB1↓ (early event) | CLDN5↓ (later, in advanced disease) | CLDN5, OCLN, VCAM1 | **Sweeney et al. 2019, *Nature Neuroscience*** |

### 8.3 Complement-Mediated Synaptic Pruning — Spatially Testable Hypothesis

**Background:** The complement cascade was co-opted from innate immunity to serve as a synaptic pruning mechanism during development. In AD, this pathway is reactivated inappropriately. **Stevens et al. 2007, *Cell*** — showed that C1q localizes to developing synapses and is required for normal synaptic refinement. **Hong et al. 2016, *Science*** — demonstrated that in AD mouse models, C1q and C3 mediate early synapse loss before neuron death; microglia engulf C3-tagged synapses in a CR3 (complement receptor 3)-dependent manner; C1q is increased 300-fold in the aging mouse hippocampus.

**Probeset genes measuring each step:**
1. **Synapse tagging:** **C1QA**↑ and **C1QC**↑ in microglia/astrocytes near synapses
2. **Opsonization:** **C3**↑ (C3b deposition on tagged synapses)
3. **Microglial phagocytosis:** **C3AR1**↑ (complement receptor on microglia), **CD68**↑ (phagocytic activity)
4. **Synapse loss readout:** **SYT1**↓ (serial), **SNAP25**↓ (serial), **SYP**↓ in neurons/neuropil
5. **Complement regulation (protective):** **CD55**↑, **CD59**↑ — decay-accelerating factor and MAC inhibitor; upregulation = cells attempting to limit complement attack

**Spatial test:** Define spatial zones as C1QA-high vs. C1QA-low regions (based on microglial/astrocyte expression). Within C1QA-high zones, measure mean SYT1, SNAP25, SYP expression in neurons. Prediction: C1QA-high zones will show significantly lower synaptic marker expression than C1QA-low zones, even within the same cortical layer and cell type.

**Positive result:** If confirmed, this provides direct spatial evidence that complement-mediated synaptic pruning operates in human AD brain tissue at the resolution of individual spatial neighborhoods — a finding currently supported only by mouse models and bulk human tissue measurements.

| Pattern | Interpretation |
|---------|---------------|
| C1QA↑ + C3↑ zone with SYT1↓ + SNAP25↓ | Active complement-mediated synapse elimination |
| C1QA↑ + C3↑ zone with SYT1 maintained | Complement deposited but not yet effecting synapse loss (early) |
| CD55↑ + CD59↑ on neurons in C1QA-high zone | Neurons mounting complement defense |
| C3AR1↑ + CD68↑ in microglia within C1QA-high zone | Microglia actively phagocytosing complement-tagged material |

### 8.4 Peripheral Immune Infiltration — Detection Capability Summary

**What we CAN detect:**
- **CCR2+ monocytes:** CCR2 is present and highly specific to infiltrating monocytes (microglia are CCR2-negative). CCR2+ cells that are P2RY12-negative and TMEM119-negative = monocyte-derived macrophages.
- **CD4+ and CD8+ T cells:** CD4, CD8A, CD247 are all present. Can identify T cells and determine CD4 vs. CD8 identity. Can identify Tregs (FOXP3+), Th1 (TBX21+), tissue-resident memory (ITGAE+). CANNOT confirm cytotoxic function (missing GZMA/GZMB/PRF1).
- **pDCs:** LILRA4, LILRA5, IL3RA — specific and reliable combination.

**What we CANNOT detect:**
- NK cells (NCAM1 is ambiguous — shared with neurons)
- B cells (no usable markers)
- Cytotoxic T cell function (no granzymes or perforin)

**Spatial prediction for peripheral infiltration:** Peripheral immune cells should first appear NEAR VESSELS (perivascular) and then spread into parenchyma as disease advances.

**Quantitative test:** Count CCR2+/CD14+/P2RY12-negative cells per tissue section. Compute their mean distance to nearest CLDN5+ endothelial structure.
- Early disease: CCR2+ cells should be close to vessels (mean distance < 50 μm)
- Advanced disease: CCR2+ cells dispersed into parenchyma (mean distance > 100 μm)
- CN: CCR2+ cells should be extremely rare (<5 per section)

This provides a spatial metric of BBB breach severity that complements the tight junction marker analysis (CLDN5/OCLN/TJP1).

### 8.5 The Vascular Inflammation Axis

**Endothelial activation markers (all confirmed in probeset):**
- **VCAM1** — vascular cell adhesion molecule 1; upregulated on inflamed endothelium by TNF/IL-1β signaling; promotes leukocyte firm adhesion and transmigration
- **ICAM1** — intercellular adhesion molecule 1; same induction pathway; essential for leukocyte diapedesis
- **SELE** — E-selectin; earliest endothelial activation marker; mediates initial leukocyte rolling
- **VEGFA** — vascular endothelial growth factor A; promotes angiogenesis but also disrupts tight junctions → increases BBB permeability
- **VEGFB/VEGFC** — related growth factors with different vascular bed specificity

**Tight junction proteins (BBB barrier):**
- **CLDN5**, **OCLN**, **TJP1** — direct physical barrier; downregulation = increased permeability

**Pericyte stability:**
- **PDGFRB**-**PDGFB** axis — pericyte recruitment and maintenance; PDGFB (present in probeset) is the endothelial-derived ligand for PDGFRB on pericytes
- **ANGPT1** — angiopoietin-1; stabilizes endothelium via TEK (Tie2) receptor (both in probeset)

**Spatial test for transmigration sites:** Co-localization analysis of VCAM1+/ICAM1+ endothelial segments with nearby CCR2+/CD14+ monocytes = sites of active transmigration. These sites should be enriched in AD compared to CN tissue and should correlate with local microglial activation (AIF1↑, NLRP3↑).

| Pattern | Interpretation |
|---------|---------------|
| VCAM1↑ + ICAM1↑ + SELE↑ on CLDN5+ vessels | Endothelial activation — ready for leukocyte recruitment |
| VCAM1↑ vessels + nearby CCR2+ cells | Active monocyte transmigration site |
| VEGFA↑ + CLDN5↓ + OCLN↓ | VEGF-driven BBB permeability increase |
| ANGPT1↓ + PDGFRB↓ near vessels | Vascular destabilization — pericyte loss |
| VEGFA↑ + ANGPT1 maintained | Angiogenic but stabilized — compensatory response |

### 8.6 GRN (Progranulin) as a Convergence Regulator

**GRN** (progranulin) is in the probeset and is a critical node where FTD genetics, microglial biology, lysosomal dysfunction, and complement signaling converge.

**Genetic context:** **Baker et al. 2006, *Nature*** — landmark paper identifying GRN (progranulin) null mutations as a cause of familial FTD (FTLD-TDP type A). GRN mutations create haploinsufficiency — 50% loss of progranulin protein is sufficient to cause disease. This was one of the most important genetic discoveries in FTD, alongside MAPT and C9orf72.

**Biological functions of progranulin:**
1. **Lysosomal function:** Progranulin is trafficked to lysosomes where it is cleaved into granulins. These are required for normal cathepsin activity (**CTSB**, **CTSS**, **CTSC** — all in probeset). GRN loss → lysosomal dysfunction → impaired degradation of aggregated proteins (tau, TDP-43).
2. **Microglial regulation:** Progranulin suppresses excessive TREM2-mediated microglial activation. **Götzl et al. 2014, *Acta Neuropathologica*** and subsequent work showed that GRN-deficient microglia are hyperactivated, with increased TREM2, enhanced phagocytosis, and excessive complement production.
3. **Complement regulation:** GRN loss → C1QA↑ + C3↑ → excessive complement-mediated synaptic pruning.
4. **Neurotrophic:** Progranulin promotes neuronal survival directly; its loss removes a trophic factor.

**Convergence model — what GRN↓ looks like in RNA:**

GRN↓ → simultaneous downstream effects:
- **TREM2**↑↑ (microglial hyperactivation, unchecked)
- **CTSB**↑ + **CTSS**↑ + **CTSC**↑ (cathepsins accumulate as lysosomal function fails — paradoxical upregulation as compensation)
- **C1QA**↑ + **C3**↑ (complement hyperactivation)
- **NLRP3**↑ + **IL1B**↑ (inflammasome engagement)
- **TMEM175**↓ or dysfunction (lysosomal K+ channel — another GWAS hit that converges on lysosomal pH regulation)
- **SQSTM1**↑ (autophagy cargo accumulation — lysosomes cannot clear)

**Cross-disease relevance:** Although GRN mutations cause FTD specifically, progranulin levels also decline with aging and are reduced in AD brain tissue. Thus, GRN↓ may contribute to the convergence pathway in both AD and FTD, albeit to different degrees.

**seqFISH spatial prediction:** In bvFTD tissue from GRN mutation carriers, expect:
- GRN expression reduced ~50% globally (haploinsufficiency)
- Microglia show hyperactivated DAM signature even in regions with minimal visible pathology
- Complement genes (C1QA, C3) elevated diffusely (not plaque-restricted, unlike AD)
- Synaptic markers (SYT1, SNAP25) decreased in zones of microglial clustering
- Cathepsin genes elevated in microglia

In sporadic bvFTD (non-GRN), GRN levels should be near-normal, and the microglial activation pattern should differ from GRN-FTD.

| Pattern | Interpretation | Disease Context |
|---------|---------------|-----------------|
| GRN↓ + TREM2↑↑ + CTSB↑ + C1QA↑ | GRN haploinsufficiency → hyperactivated microglia | GRN-FTD |
| GRN normal + TREM2↑ + SPP1↑ | Standard DAM response (not GRN-driven) | Sporadic AD |
| GRN↓ + SQSTM1↑ + LAMP2↓ | Lysosomal dysfunction from progranulin loss | GRN-FTD |
| GRN↓ + C1QA↑ + SYT1↓ diffusely | Complement-mediated synapse loss driven by GRN deficiency | GRN-FTD |
| GRN maintained + C1QA↑ near plaques only | Complement restricted to plaque microenvironment | AD |

---

*End of Gene Module Reference Document. All genes verified against v2_probeset.csv (1,205 genes). Document designed for use alongside the seqFISH analysis pipeline with user validation at each checkpoint.*
