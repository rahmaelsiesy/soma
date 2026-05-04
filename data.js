// ============================================================
// ML CURRICULUM — add to CATEGORY_META and QUEST_DATA in data.js
// ============================================================
//
// HOW TO USE:
//   1. In data.js, find CATEGORY_META and add the ml_curriculum entry below
//      (before the closing brace of CATEGORY_META).
//   2. In data.js, find QUEST_DATA and add the ml_curriculum array below
//      (before the closing brace of QUEST_DATA).
//   3. In style.css, add --c-ml: #5b8f7a; inside the :root block.
// ============================================================


// ── STEP 1: Add inside CATEGORY_META (before final closing brace) ───────────

  ml_curriculum: {
    label: "ML Curriculum",
    color: "var(--c-ml)",
    emoji: "🤖",
    required: false,
    goal: "CS 148a + CS 165 mastery through seqFISH AD brain project — stressed cell classifier → spatial hotspot analysis"
  },


// ── STEP 2: Add inside QUEST_DATA (before final closing brace) ──────────────

  ml_curriculum: [

    // ── PHASE 0 ─────────────────────────────────────────────────────────────
    {
      id: "ml-p0",
      title: "Phase 0 — Infrastructure & Data Audit",
      emoji: "🛠️",
      category: "ml_curriculum",
      priority: "P0",
      xp: 20,
      reward: "🛠️ Data pipeline live. starFISH transcript CSVs ready. Not blocked on anything.",
      desc: "Set up PyTorch environment, write a reusable DataLoader for 3D image + transcript data, run napari sanity check, and produce starFISH transcript CSVs for all samples so you are never blocked on Project 2.",
      steps: [
        {
          id: "ml-p0-1",
          title: "Week 1 — Environment + EDA",
          type: "code",
          desc: "Set up conda env: torch, torchvision, napari, squidpy, scanpy, tifffile, scikit-image, scikit-learn, cellpose, starfish. Write DataLoader yielding (polyT_patch, DAPI_patch, transcript_df). Visualize 3D z-stacks + transcript dots in napari. Confirm coordinate alignment. Resource: fast.ai Lesson 1–2, UDL Ch. 1–2.",
          checklist: [
            "Conda env installs without conflicts",
            "DataLoader yields correct tensor shapes",
            "3D polyT + DAPI z-stack visualized in napari",
            "Transcript dots land on correct cells in napari overlay",
            "Coordinate units confirmed (voxel vs. micron documented)"
          ],
          xp: 10,
          estimated_blocks: 4,
          cognitive_type: "deep"
        },
        {
          id: "ml-p0-2",
          title: "Week 2 — Preprocessing Pipeline + starFISH",
          type: "code",
          desc: "Write preprocessing module: percentile normalization per channel, optional Gaussian smoothing, transcript QC. Run starFISH on hyb images using your hot-encoded codebook (concat channel CSVs before Hamming match) → transcript CSVs for all samples. Build SampleDataset class with AD/CN condition labels.",
          checklist: [
            "Preprocessing module is reusable (path in → normalized tensor out)",
            "starFISH pipeline runs end-to-end on at least one sample",
            "Transcript CSVs produced for all samples",
            "SampleDataset class handles multi-sample loading with condition labels",
            "Per-sample transcript counts look reasonable"
          ],
          xp: 10,
          estimated_blocks: 4,
          cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 0 Gate",
        items: [
          "Any sample loads into DataLoader in < 5 lines of code",
          "starFISH transcript CSVs exist for all samples and are non-empty",
          "3D image + transcript overlay in napari looks biologically sensible"
        ]
      }
    },

    // ── PHASE 1 ─────────────────────────────────────────────────────────────
    {
      id: "ml-p1",
      title: "Phase 1 — Classical ML Stress Classifier",
      emoji: "🔬",
      category: "ml_curriculum",
      priority: "P0",
      xp: 40,
      reward: "🔬 First real result: stressed vs. normal cell labels, AD vs. CN fraction quantified. No DL required — pure scikit-learn.",
      desc: "No deep learning yet. Segment cells with Cellpose, extract hand-crafted morphological features with scikit-image, label stressed cells from biological priors, train logistic regression + random forest. Produces a working scientific baseline within 4 weeks. Resource: fast.ai Lesson 1–3, UDL Ch. 1–5.",
      steps: [
        {
          id: "ml-p1-1",
          title: "Week 3 — Cell Segmentation (Cellpose)",
          type: "code",
          desc: "Run Cellpose on 3D polyT + DAPI images to generate per-cell instance segmentation masks. Assign transcript points to cells by point-in-mask lookup. Output: {cell_id: mask_voxels, transcripts: [...], condition: AD/CN} for all samples.",
          checklist: [
            "Cellpose runs on 3D polyT + DAPI without crashing",
            "Per-cell instance masks saved (not just semantic masks)",
            "Transcripts assigned to cells (point-in-mask)",
            "At least one full sample processed end-to-end",
            "Cell count per sample looks reasonable"
          ],
          xp: 10,
          estimated_blocks: 3,
          cognitive_type: "deep"
        },
        {
          id: "ml-p1-2",
          title: "Week 4 — Morphological Feature Extraction",
          type: "code",
          desc: "Extract per-cell morphological features using scikit-image regionprops_3d. Geometry: volume, sphericity, nuclear eccentricity, nucleocytoplasmic ratio (DAPI vs polyT mask). Intensity: mean/std polyT, mean/std DAPI. Texture: GLCM energy + contrast on polyT channel. Build (N_cells × ~20_features) DataFrame. Visualize distributions split by AD vs. CN (seaborn).",
          checklist: [
            "regionprops_3d extracts ≥ 15 features per cell",
            "Nucleocytoplasmic ratio computed",
            "GLCM texture features extracted",
            "Feature DataFrame saved to CSV",
            "AD vs. CN distributions visualized (violins)"
          ],
          xp: 10,
          estimated_blocks: 3,
          cognitive_type: "deep"
        },
        {
          id: "ml-p1-3",
          title: "Week 5 — Stress Labels + Logistic Regression / RF",
          type: "code",
          desc: "Define composite stress score from morphology (low volume + high nuclear eccentricity + low polyT mean + high DAPI texture). k-means (k=3–5) to find stress clusters. Review ~100 cells per cluster in napari. Annotate training set (≥500 stressed + ≥500 normal). Train logistic regression + RF with 5-fold CV.",
          checklist: [
            "Composite stress score formula documented and justified",
            "k-means clusters reviewed in napari by eye",
            "Training set ≥ 500 cells per class",
            "Logistic regression F1 computed (5-fold CV)",
            "Random forest F1 computed (5-fold CV)",
            "Confusion matrix plotted for best model"
          ],
          xp: 12,
          estimated_blocks: 4,
          cognitive_type: "deep"
        },
        {
          id: "ml-p1-4",
          title: "Week 6 — Feature Importance + Biological Validation",
          type: "code",
          desc: "RF feature importances + permutation importances. Apply classifier to all samples → per-sample stressed-cell fraction. Mann-Whitney U: AD vs. CN. Visualize stress labels as napari color overlay on 3D image.",
          checklist: [
            "Feature importance plot shows top-5 discriminating features",
            "Stressed-cell fraction computed per sample",
            "Mann-Whitney U p-value reported (AD vs. CN)",
            "Stress overlay in napari spatially coherent",
            "Results match literature (AD has more stressed cells)"
          ],
          xp: 8,
          estimated_blocks: 3,
          cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 1 Gate",
        items: [
          "RF classifier achieves F1 > 0.75 on held-out test set",
          "AD samples show significantly higher stressed-cell fraction than CN (p < 0.05)",
          "Top morphological feature matches a known stress phenotype from AD literature",
          "Stress labels are spatially coherent in napari"
        ]
      }
    },

    // ── PHASE 2 ─────────────────────────────────────────────────────────────
    {
      id: "ml-p2",
      title: "Phase 2 — DL Foundations + CNN Stress Classifier",
      emoji: "🧠",
      category: "ml_curriculum",
      priority: "P1",
      xp: 60,
      reward: "🧠 3D CNN + transcript transformer fused. Multimodal stress classifier beats any single modality.",
      desc: "Replace hand-crafted features with a learned CNN. Progression: MLP → 2D CNN → 3D CNN → transfer learning → transcript transformer → late fusion. Uses Phase 1 stress labels as supervision targets. Maps to CS 148a Part a. Resources: fast.ai, UDL Book, CS 148a YouTube lectures.",
      steps: [
        {
          id: "ml-p2-1",
          title: "Week 7 — PyTorch Basics + MLP on Morphology Features",
          type: "code",
          desc: "2-layer MLP on morphology feature vector → stressed/normal. Reusable training loop. Log loss curves. Compare MLP vs. logistic regression accuracy. Resource: UDL Ch. 3–5, fast.ai Lesson 3.",
          checklist: ["Training loop reusable (swap model in one line)","Loss curves logged + plotted","MLP vs. LR accuracy comparison"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p2-2",
          title: "Week 8 — 2D CNN on DAPI Cell Crops",
          type: "code",
          desc: "Extract 128×128 2D crops per cell from DAPI. Train small 2D CNN (stressed vs. normal). Visualize intermediate feature maps. Resource: UDL Ch. 10, fast.ai Lesson 5.",
          checklist: ["2D CNN training loop works","Feature maps visualized for 5+ cells","2D CNN F1 vs. Phase 1 RF comparison"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p2-3",
          title: "Week 9 — 3D CNN on Cell Crops (polyT + DAPI)",
          type: "code",
          desc: "Extract 3D bounding box crops: input (2, Z, H, W). Train 3D CNN with mixed precision (torch.cuda.amp). Add 3D augmentation: random flips, 90° rotations, intensity jitter. Resource: UDL Ch. 10–11.",
          checklist: ["3D CNN runs on GPU without OOM","Mixed precision enabled","3D augmentations implemented","3D CNN vs. 2D CNN F1 comparison"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p2-4",
          title: "Week 10 — Transfer Learning (Med3D pretrained init)",
          type: "code",
          desc: "Try pretrained 3D checkpoint (Med3D) vs. random init. UMAP of cell embeddings colored by stress label + AD/CN condition. Resource: UDL Ch. 12, fast.ai Lesson 9–10.",
          checklist: ["Pretrained vs. random init F1 comparison","UMAP shows stress clustering","UMAP colored by AD/CN shows expected separation"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p2-5",
          title: "Week 11 — Optimization: Adam, LR Scheduling, Regularization",
          type: "code",
          desc: "LR finder, cosine annealing, dropout, batch norm. Train final 3D image-only stress classifier. Document all hyperparameter decisions. Resource: UDL Ch. 6–8, fast.ai Lesson 6.",
          checklist: ["LR finder run, optimal LR documented","Cosine annealing implemented","Final 3D CNN achieves best F1 so far","Hyperparameter decisions documented"],
          xp: 6, estimated_blocks: 2, cognitive_type: "medium"
        },
        {
          id: "ml-p2-6",
          title: "Week 12 — Transcript Set Classifier (DeepSets / Transformer)",
          type: "code",
          desc: "Represent each cell as set of (gene_id, x, y, z) tokens. Train DeepSets or simple transformer on transcript sets. Compare transcript-only vs. image-only accuracy. Resource: UDL Ch. 13 (attention).",
          checklist: ["Transcript tokenization implemented","DeepSets or transformer trains without NaN loss","Transcript-only F1 vs. image-only comparison table"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p2-7",
          title: "Week 13 — Multimodal Late Fusion (Image + Transcripts)",
          type: "code",
          desc: "Late fusion: concat 3D CNN embedding + transcript transformer embedding → classifier head. Optionally try cross-attention. Multimodal F1 vs. both single modalities. Resource: CS 148b Lectures 1–3.",
          checklist: ["Late fusion pipeline trains cleanly","Multimodal vs. image-only vs. transcript-only F1 table","Cross-attention attempted"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 2 Gate",
        items: [
          "3D CNN F1 > Phase 1 RF baseline",
          "Multimodal fusion outperforms either single modality",
          "Training loop is fully reusable — swap any component in one line",
          "Per-cell stress probabilities saved for all samples"
        ]
      }
    },

    // ── PHASE 3 ─────────────────────────────────────────────────────────────
    {
      id: "ml-p3",
      title: "Phase 3 — Antibodies, Interpretability & Project 2",
      emoji: "🔭",
      category: "ml_curriculum",
      priority: "P1",
      xp: 50,
      reward: "🔭 Full multimodal classifier live. GradCAM + SHAP reveal top stress regions/genes. Optional custom seqFISH decoder validated vs. starFISH.",
      desc: "Add antibody channels, self-supervised pre-training, GradCAM + SHAP interpretability. Then tackle Project 2 (seqFISH decoder) as an applied CNN project — zarr for memory, inter-round registration, and Hamming barcode matching. 3 weeks for the decoder now that 3D CNN skills are solid.",
      steps: [
        {
          id: "ml-p3-1",
          title: "Week 14 — Add Antibody Channels + Ablation",
          type: "code",
          desc: "Add antibody channels to 3D CNN: (2 + N_antibodies, Z, H, W). Channel ablation: remove one antibody at a time, measure F1 drop. Per-antibody contribution table.",
          checklist: ["All antibody channels added","Channel ablation table produced","Most informative antibodies identified","Full multimodal model saved"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p3-2",
          title: "Week 15 — Self-Supervised Pre-Training (MAE / SimCLR)",
          type: "code",
          desc: "Pre-train masked autoencoder on ALL cells (no labels). Fine-tune on stress labels. Compare to random init. Resource: CS 148b Lectures 4–6.",
          checklist: ["MAE trains on unlabeled cells","Fine-tuned vs. random init F1 compared","MAE reconstructions look biologically plausible"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p3-3",
          title: "Week 16 — GradCAM + SHAP Interpretability",
          type: "code",
          desc: "GradCAM on 3D image classifier → which sub-cellular regions drive 'stressed'? SHAP on transcript model → top-20 stress-associated genes. Overlay on polyT in napari. Cross-check top genes with AD literature. Resource: UDL Ch. 14.",
          checklist: ["GradCAM maps for ≥10 representative cells","GradCAM overlaid on polyT in napari","SHAP top-20 stress genes extracted","≥3 top SHAP genes cross-referenced with AD literature"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p3-4",
          title: "Week 17 — Project 2: 3D Spot Detection (U-Net + zarr memory strategy)",
          type: "code",
          desc: "Convert all hyb images to zarr once (chunks: (1,512,512)). Process patch-by-patch to avoid OOM. Train 3D U-Net for spot detection on one hyb round. Output: (spot_id, x, y, z, hyb_round, channel) table. Codebook: concat ch1 + ch2 CSVs before Hamming match.",
          checklist: ["Hyb images converted to zarr (done once)","3D U-Net spot detector trained on ≥1 hyb round","Spot centroid table produced","Memory stays < 16GB during training"],
          xp: 8, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p3-5",
          title: "Week 18 — Project 2: Inter-Round Registration + Barcode Assembly",
          type: "code",
          desc: "Register all hyb rounds to round 1 (phase correlation or SimpleITK). Assemble per-spot barcode vectors across registered rounds. Concat channel codebooks (ch1_bits + ch2_bits) → full barcode per gene.",
          checklist: ["Registration reduces inter-round drift to < 1 voxel (napari visual check)","Barcode vectors assembled for all detected spots","Codebook concatenation produces correct full-length barcodes"],
          xp: 8, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p3-6",
          title: "Week 19 — Project 2: Barcode Decoding + starFISH Comparison",
          type: "code",
          desc: "Decode barcodes to gene calls using minimum Hamming distance (1-bit error correction). Output transcript CSV (gene, x, y, z). Compare per-gene recall + precision to starFISH baseline. Visualize FP/FN in napari.",
          checklist: ["Hamming decoder with 1-bit error correction implemented","Transcript CSV produced from raw hyb images","Per-gene recall + precision vs. starFISH computed","Top failing genes identified and failure mode documented"],
          xp: 8, estimated_blocks: 4, cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 3 Gate",
        items: [
          "GradCAM sub-cellular regions are biologically interpretable",
          "SHAP top-3 genes include at least one known AD stress marker",
          "Project 2 decoder achieves per-gene recall > 0.6 vs. starFISH (or discrepancies documented)"
        ]
      }
    },

    // ── PHASE 4a ─────────────────────────────────────────────────────────────
    {
      id: "ml-p4a",
      title: "Phase 4a — Spatial ML + Cell Neighborhood Graphs",
      emoji: "🗺️",
      category: "ml_curriculum",
      priority: "P2",
      xp: 40,
      reward: "🗺️ Spatial domain map produced. Stressed cells shown to cluster non-randomly in AD. CS 165 spatial stats complete.",
      desc: "CS 165 begins here. Spatial statistics (Ripley's K, Moran's I) test whether stressed cells cluster. Build cell neighborhood graphs with Squidpy. Apply GAT/STAGATE for spatial domain identification. Resources: CS 165 YouTube 2020, PyTorch Geometric.",
      steps: [
        {
          id: "ml-p4a-1",
          title: "Week 20 — Spatial Statistics (Ripley's K, Moran's I) [CS 165 L1–3]",
          type: "code",
          desc: "Compute Ripley's K on stressed cell coordinates per sample. Test null: are stressed cells randomly distributed? Compute 3D KDE stress density volumes. Average within AD/CN groups. Resource: CS 165 Lectures 1–3.",
          checklist: ["Ripley's K computed per sample","Spatial clustering confirmed or refuted statistically","3D KDE density volumes for all samples","AD vs. CN group-average density maps visualized"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p4a-2",
          title: "Week 21 — 3D KDE + MLE Bandwidth Selection [CS 165 L4–5]",
          type: "code",
          desc: "3D Gaussian KDE (scipy). Compare bandwidth choices by leave-one-out log-likelihood. Align + average density maps within AD/CN. Identify candidate hotspot regions. Resource: CS 165 Lectures 4–5.",
          checklist: ["Bandwidth selection documented (not arbitrary)","Per-group average density volumes produced","Candidate hotspot regions identified from group-average map"],
          xp: 8, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p4a-3",
          title: "Week 22 — Cell Neighborhood Graphs + MRF Concepts [CS 165 L6–8]",
          type: "code",
          desc: "Build 3D cell neighborhood graph: k-NN (k=10) via squidpy.gr.spatial_neighbors. Node features: stress_prob + transcript PCs + morphology. Neighborhood enrichment test: do stressed cells preferentially neighbor other stressed cells in AD vs. CN? Resource: CS 165 Lectures 6–8.",
          checklist: ["k-NN graph built for all samples","Node features assembled","Neighborhood enrichment test run","Is stressed-cell co-localization higher in AD? Answered with statistics."],
          xp: 10, estimated_blocks: 3, cognitive_type: "deep"
        },
        {
          id: "ml-p4a-4",
          title: "Week 23 — GNNs for Spatial Domain Identification (GAT / STAGATE)",
          type: "code",
          desc: "Implement GAT (PyTorch Geometric) or run STAGATE on cell neighborhood graph. Unsupervised spatial domain labels. Visualize in 3D napari. Resource: PyTorch Geometric docs, STAGATE paper.",
          checklist: ["GAT or STAGATE runs without NaN loss","Spatial domain labels produced for all cells","Domain assignments visualized in 3D napari","Domains look spatially contiguous (not random)"],
          xp: 12, estimated_blocks: 5, cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 4a Gate",
        items: [
          "Stressed cells significantly more clustered in AD than CN (Ripley's K, p < 0.05 after permutation test)",
          "Spatial domains are spatially contiguous and biologically interpretable",
          "Neighborhood enrichment: stressed cells cluster together more in AD"
        ]
      }
    },

    // ── PHASE 4b ─────────────────────────────────────────────────────────────
    {
      id: "ml-p4b",
      title: "Phase 4b — Statistical Inference + Hotspot Analysis",
      emoji: "📊",
      category: "ml_curriculum",
      priority: "P2",
      xp: 60,
      reward: "🏁 Project complete. Spatial hotspots characterized. AD vs. CN differential with FDR-corrected stats. Manuscript figures ready.",
      desc: "CS 165 heavy: GMMs (EM), NMF, spectral decompositions, VAE (ELBO), hypothesis testing with FDR correction. Maps to spatial domain characterization, metagene programs, disease severity scoring, hotspot identification with spatial scan statistics, and final manuscript figures.",
      steps: [
        {
          id: "ml-p4b-1",
          title: "Week 24 — GMMs + EM for Domain Identification [CS 165 L9–10]",
          type: "code",
          desc: "Fit GMMs on (x,y,z, stress_prob, top_PCs_transcripts). Select optimal k by BIC. Visualize 3D domain assignments in napari. Compare to GNN domains from Phase 4a. Resource: CS 165 Lectures 9–10.",
          checklist: ["BIC curve plotted vs. k","Optimal k selected and justified","GMM domain map in 3D napari","GMM vs. GNN domains compared"],
          xp: 10, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p4b-2",
          title: "Week 25 — NMF + Spectral Methods: Metagene Programs [CS 165 L11–13]",
          type: "code",
          desc: "NMF on per-domain transcript matrix → metagene programs. GO enrichment on top genes per metagene. PCA on joint morphology + transcript space. Resource: CS 165 Lectures 11–13.",
          checklist: ["NMF run on domain × gene matrix","Top-10 genes per metagene extracted","GO enrichment run (gseapy or Enrichr)","At least one metagene matches known AD pathway"],
          xp: 12, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p4b-3",
          title: "Week 26 — VAE + Disease Severity Score [CS 165 L14–16]",
          type: "code",
          desc: "Train VAE on cell embeddings (ELBO loss). Traverse latent space from CN-like to AD-like. Use latent distance from CN centroid as a continuous disease severity score per cell. Resource: CS 165 Lectures 14–16.",
          checklist: ["VAE trains (ELBO decreasing)","Latent traversal produces interpretable changes","Disease severity score assigned per cell","Severity score correlates with stress_prob from Phase 2"],
          xp: 12, estimated_blocks: 4, cognitive_type: "deep"
        },
        {
          id: "ml-p4b-4",
          title: "Week 27 — AD vs. CN Differential + Hotspot Statistics [CS 165 L17–18]",
          type: "code",
          desc: "Per spatial domain: Mann-Whitney U (stressed-cell fraction AD vs. CN) + BH FDR correction. Identify hotspot domains (q < 0.1). Spatial scan statistic: find 3D subregion with maximum excess stressed-cell density in AD. Characterize hotspots: transcript composition, antibody levels, morphology. Resource: CS 165 Lectures 17–18.",
          checklist: ["Per-domain Mann-Whitney U + FDR run","Hotspot domains identified (q < 0.1)","Spatial scan statistic run","Hotspot domains characterized (top transcripts + antibodies + morphology)","Hotspot locations biologically plausible (near plaques/tangles if data available)"],
          xp: 14, estimated_blocks: 5, cognitive_type: "deep"
        },
        {
          id: "ml-p4b-5",
          title: "Week 28 — Full Pipeline Integration + Manuscript Figures",
          type: "code",
          desc: "Full reproducible pipeline (Snakemake / Nextflow). Manuscript figures: Fig 1 (data overview + segmentation), Fig 2 (stress classifier + GradCAM/SHAP), Fig 3 (spatial domain map AD vs. CN), Fig 4 (hotspot characterization). Write ML methods section.",
          checklist: ["Pipeline runs end-to-end reproducibly from fresh clone","All 4 figures meet Nature conventions (88mm, Arial 7pt, Wong palette, scale bars)","Figures exported: SVG + PNG (300 DPI) + PDF","ML methods section written"],
          xp: 12, estimated_blocks: 6, cognitive_type: "deep"
        }
      ],
      gate: {
        title: "Phase 4b Gate — Project Complete",
        items: [
          "Hotspot spatial domains reproducible across independent samples",
          "Top metagene programs include known AD-associated pathways (GO q < 0.05)",
          "Disease severity score (VAE) correlates with Braak/Thal staging from metadata",
          "All figures pass blind review by lab mate",
          "Full pipeline reproducible end-to-end from raw images to figures"
        ]
      }
    }

  ] // end ml_curriculum


// ── STEP 3: Add inside :root in style.css ───────────────────────────────────
//   --c-ml: #5b8f7a;    /* sage-teal — ML Curriculum */
