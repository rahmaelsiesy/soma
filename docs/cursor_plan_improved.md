# spatialpy — Improved Cursor Coding Plan with Subagent Decomposition

> **Version:** 2.0 — Architect-reviewed, subagent-decomposed, acceptance-criteria-driven  
> **Original plan:** spatialpy Package Design (Phase 0–9, seqFISH AD brain analysis)  
> **Improved by:** Senior software architect + computational biology engineering lead  
> **Target:** Caltech PhD student, imaging-based spatial transcriptomics, AD vs CN seqFISH

---

## Section 0: Cursor Super-Prompt — The Prime Directive

> **PASTE THIS VERBATIM AT THE START OF EVERY CURSOR AGENT SESSION.**  
> It is not optional. It is not negotiable. It is the contract between you (the Cursor agent) and this codebase.

---

```
=============================================================================
SPATIALPY CURSOR AGENT — PRIME DIRECTIVE (read before touching any file)
=============================================================================

You are a senior computational biology software engineer working on `spatialpy`,
a Python package for seqFISH-based spatial transcriptomics analysis of AD brain
tissue. You have been assigned ONE specific task (described below). Before you
write a single line of production code, you MUST complete the following steps:

─────────────────────────────────────────────────────────────────────────────
STEP 1 — REPOSITORY INSPECTION (non-negotiable, do this first)
─────────────────────────────────────────────────────────────────────────────

1a. Read every existing file in the module(s) relevant to your task:
    - Open each .py file in the assigned module directory
    - Open the corresponding test file(s) in tests/unit/ and tests/integration/
    - Open conftest.py and fixtures/make_fixture.py

1b. Run these grep commands and read the output before writing anything:
    grep -r "SubsetSpec" spatialpy/ --include="*.py" -n
    grep -r "RunContext" spatialpy/ --include="*.py" -n
    grep -r "FigureStyle" spatialpy/ --include="*.py" -n
    grep -r "AnalysisConfig" spatialpy/ --include="*.py" -n
    grep -r "def run\b" spatialpy/steps/ --include="*.py" -n
    grep -r "adata\." spatialpy/ --include="*.py" -n | head -50

1c. Check the test suite to understand what is already tested:
    grep -r "def test_" tests/ --include="*.py" -n | grep "<your_module>"

1d. Verify installed packages before importing them:
    python -c "import <package>; print(<package>.__version__)"
    Do this for every non-stdlib import you plan to use.

─────────────────────────────────────────────────────────────────────────────
STEP 2 — ARCHITECTURE RFC (write this, then wait for approval)
─────────────────────────────────────────────────────────────────────────────

After reading the codebase, write an Architecture RFC with AT MOST 5 bullets:

  ## RFC: [Task Name]
  - **What I will create:** [exact files, classes, functions]
  - **How it integrates:** [which existing objects it consumes and produces]
  - **Key design decision:** [one sentence on the main trade-off]
  - **Interface contract:** [function signatures — no implementation yet]
  - **Test plan:** [which tests I will add and what they verify]

DO NOT write any implementation code until the RFC is approved.
If running autonomously (no human reviewer), document your RFC in a comment
block at the top of the first file you create, then proceed.

─────────────────────────────────────────────────────────────────────────────
STEP 3 — IMPLEMENTATION RULES (enforceable constraints)
─────────────────────────────────────────────────────────────────────────────

HALLUCINATION PREVENTION:
  ✗ Do NOT import a symbol unless you have verified it exists in the codebase
    or in the installed package (via Step 1d).
  ✗ Do NOT assume function signatures — grep for them.
  ✗ Do NOT invent AnnData obs/var/uns keys — only use keys defined in
    docs/architecture/adata_schema.md or confirmed by grep.
  ✗ Do NOT assume a class attribute exists — read the class definition first.

ADATA CONVENTIONS (spatialpy-specific):
  ✗ NEVER write to adata.X after s01_load_data — use layers instead.
    Raw counts must remain in adata.X throughout the pipeline.
  ✓ Write new count matrices to adata.layers["<name>"]
  ✓ Write cell-level annotations to adata.obs["<name>"]
  ✓ Write gene-level annotations to adata.var["<name>"]
  ✓ Write coordinate matrices to adata.obsm["<name>"]  (shape: n_cells × 2)
  ✓ Write distance matrices / graphs to adata.obsp["<name>"]
  ✓ Write unstructured results to adata.uns["<step_name>"]["<key>"]
  ✓ Write images to adata.uns["images"]["<channel>"] as numpy arrays
  ✓ Always call adata.write_h5ad(output_path) at end of each step — never
    return a modified AnnData without persisting it.

SUBSETSPEC INTERFACE:
  ✓ Every public analysis function that takes an AnnData MUST accept an
    optional `subset: SubsetSpec | None = None` argument.
  ✓ Always call `adata_sub, tx_sub = subset.apply(adata, transcripts)` at
    the top of the function body, before any computation.
  ✗ Do NOT hard-code cell type names, layer names, or condition values.

RUNCONTEXT INTERFACE:
  ✓ Every step function MUST accept `ctx: RunContext` as first argument.
  ✓ Use ctx.logger for all logging — never print() directly.
  ✓ Register every output with ctx.manifest.register_output(path, hash).
  ✓ Record every benchmark with ctx.benchmark_store.record(step, metric, val).
  ✓ Use ctx.config to read parameters — never read config YAML files directly.

FIGURESTYLE INTERFACE:
  ✓ Every plotting function MUST call FigureStyle.apply(fig, ax) before saving.
  ✓ Always use fig.savefig(path, dpi=FigureStyle.DPI, bbox_inches="tight").
  ✗ NEVER call matplotlib.pyplot.show() — figures are always saved to disk.
  ✗ NEVER use inline plt.* calls — always create explicit fig, ax objects.
  ✓ Save both SVG (primary) and PNG (web) for every figure.
  ✓ Add a scale bar to every spatial figure using FigureStyle.add_scale_bar().

CODE QUALITY (non-negotiable):
  ✓ Every public function MUST have: (1) a NumPy-style docstring with
    Parameters, Returns, Raises, and Notes; (2) complete type hints on all
    arguments and return values; (3) at least one corresponding unit test.
  ✓ Type hints must use: AnnData, pd.DataFrame, np.ndarray, Path — not
    "any" or bare dict/list without type parameters.
  ✗ Do NOT modify files outside your assigned module without explicit
    permission listed in your task's "Output contract" section.
  ✗ Do NOT add new dependencies not listed in pyproject.toml without
    noting them in your RFC.

─────────────────────────────────────────────────────────────────────────────
STEP 4 — VERIFY BEFORE DECLARING DONE
─────────────────────────────────────────────────────────────────────────────

Before marking your task complete:

  pytest tests/unit/test_<your_module>.py -v         # all pass
  pytest tests/integration/ -k "<your_tag>" -v       # all pass
  mypy spatialpy/<your_module>/ --strict              # no errors
  ruff check spatialpy/<your_module>/                 # no violations
  python -c "import spatialpy; spatialpy.<fn>()"     # import works

If any test fails, fix it before declaring done.
Report the exact pytest output (pass/fail counts) in your completion message.

─────────────────────────────────────────────────────────────────────────────
TASK-SPECIFIC INSTRUCTIONS (appended per session — do not ignore)
─────────────────────────────────────────────────────────────────────────────

[PASTE TASK SECTION FROM SECTION 2 OF THIS DOCUMENT HERE]

=============================================================================
```

---

## Section 1: Repository Bootstrap RFC

Before any Cursor agent session opens an editor, the team must produce an **Architecture RFC document**. This RFC lives at `docs/architecture/architecture_rfc.md` and is the single source of truth for all cross-module contracts. No implementation may proceed until this RFC is written and reviewed.

### RFC Template

```markdown
# spatialpy Architecture RFC
Version: 1.0
Authors: [your name]
Status: DRAFT → APPROVED

---

## 1. Module Responsibility Matrix

| Module             | Owns                                          | Must NOT touch                      |
|--------------------|-----------------------------------------------|--------------------------------------|
| spatialpy/config/  | AnalysisConfig, ParameterSpec, defaults.yaml  | AnnData objects, file I/O            |
| spatialpy/core/    | RunContext, SubsetSpec, RunManifest,           | Business logic, plotting             |
|                    | BenchmarkStore, provenance tracking           |                                      |
| spatialpy/io/      | All file reading/writing, validators          | Analysis logic, plotting             |
| spatialpy/steps/   | Step orchestration, AnnData mutation          | Direct file I/O (use io/ module)     |
| spatialpy/methods/ | Pure algorithmic functions (no I/O)           | AnnData, plotting, file I/O          |
| spatialpy/plotting/| All figure creation and saving                | AnnData mutation, file loading       |
| spatialpy/ui/      | Streamlit app, widgets, config export         | Analysis logic, AnnData              |
| spatialpy/hpc/     | SLURM profiles, resource estimation           | Analysis logic                       |
| spatialpy/reporting| Summary generation, sanity checks             | New analysis logic                   |
| spatialpy/website/ | Quarto build and dashboard generation         | Analysis logic                       |

---

## 2. Data Flow Diagram

```
INPUT FILES (CSV, TIFF, JSON, h5ad)
       │
       ▼
s00_validate_inputs
  IN:  raw file paths from AnalysisConfig.samples
  OUT: validated file manifest + frozen RunContext (run_id assigned here)
  SIDE EFFECTS: writes run_manifest_init.json
       │
       ▼
s01_load_data
  IN:  validated paths, RunContext
  OUT: adata.h5ad with:
         .X           = cell × gene raw counts (int32, CSR sparse)
         .layers["nucleus_counts"] = nucleus × gene raw counts
         .obs         = cell metadata (cell_id, sample_id, condition, region, ...)
         .var         = gene metadata (gene_id, probe_count, ...)
         .obsm["spatial"] = (n_cells, 2) float64 centroid coordinates
         .uns["images"]   = dict of channel → numpy array
         .uns["masks"]    = dict of cell/nucleus → label arrays
         .uns["transcripts"] = per-sample DataFrame (gene, x, y, z, cell_id, ...)
       │
       ▼
s02_pre_qc_clustering → adata.obs["cell_type_rough"]
       │
       ▼
s03_qc_filtering → adata filtered in-place, .uns["qc_report"]
       │
       ▼
s04_post_qc_eda → figures only, no adata mutation
       │
       ▼
s05_cortical_layers → adata.obs["cortical_layer"], adata.obs["layer_confidence"]
       │
       ▼
s06_clustering → adata.obs["leiden_harmony"], adata.obs["concord_cluster"]
       │
       ▼
s07_cell_states → adata.obs["cell_state"], adata.obsm["state_scores"]
       │
       ▼
[PARALLEL BRANCH — all consume filtered+annotated adata from s07]
  s08_deg         → adata.uns["deg"]
  s09_neighborhoods → adata.obs["spatial_domain_*"], adata.obsm["banksy_embedding"]
  s10_lr          → adata.uns["liana_results"]
  s11_hugging     → adata.uns["contact_graph"], adata.obs["n_contacts"]
  s12_morphology  → adata.obs["morphology_*"], adata.obsm["morph_pca"]
  s13_density     → adata.uns["density_maps"]
  s14_if_images   → adata.obs["abeta_dist_um"], adata.obs["gfap_overlap"]
  s15_modules     → adata.obs["module_score_*"]
  s16_coexpression → adata.uns["moran_results"]
  s17_kspaces     → adata.uns["kspaces"]
       │
       ▼
s18_probe_efficiency → adata.var["probe_efficiency"], adata.var["low_confidence"]
s19_integration   → adata.obsm["integrated_embedding"], adata.obs["label_transfer"]
s20_ml_classifier → adata.uns["classifier_results"]
       │
       ▼
reporting/ → markdown + HTML + figures
website/   → Quarto dashboard
```

---

## 3. Interface Contracts (The Four Shared Objects)

### 3a. AnnData Schema Contract

```python
# The canonical AnnData object produced by s01 and consumed by all downstream steps.
# ALL keys are versioned in docs/architecture/adata_schema.md.
# NEVER add undocumented keys without updating that file.

REQUIRED_OBS_COLS = [
    "cell_id",          # str, unique per sample
    "sample_id",        # str, matches config samples keys
    "condition",        # str, "ad" | "cn"
    "region",           # str, "fic" | "dlpfc" | "dg"
    "n_counts",         # int, total transcript count
    "n_genes",          # int, number of detected genes
    "nucleus_present",  # bool
    "cell_area_um2",    # float
    "nucleus_area_um2", # float
]

REQUIRED_VAR_COLS = [
    "gene_id",          # str
    "probe_count",      # int, number of probes for this gene
    "is_control_probe", # bool
]

REQUIRED_OBSM_KEYS = [
    "spatial",          # shape (n_cells, 2), float64, microns
]

REQUIRED_UNS_KEYS = [
    "spatialpy_version",  # str
    "run_id",             # str (UUID4)
    "config_hash",        # str (SHA256 of frozen config)
]
```

### 3b. RunContext Contract

```python
@dataclass
class RunContext:
    run_id: UUID
    config: AnalysisConfig      # frozen Pydantic model
    config_hash: str            # SHA256 hex of config JSON
    git_commit: str | None      # None if not in a git repo
    package_version: str        # spatialpy.__version__
    output_dir: Path
    started_at: datetime
    logger: logging.Logger
    manifest: RunManifest
    benchmark_store: BenchmarkStore

    # Key methods — these are the only ways to interact with the context:
    def step_output_dir(self, step_name: str) -> Path: ...
    def register_figure(self, fig: Figure, name: str, caption: str) -> Path: ...
    def log_warning(self, msg: str, step: str) -> None: ...
    def checkpoint(self, step_name: str, adata: AnnData) -> Path: ...
```

### 3c. SubsetSpec Contract

```python
@dataclass
class SubsetSpec:
    obs_filters: dict[str, list[str]] | None = None
    # Example: {"cell_type": ["Microglia", "Astrocyte"], "condition": ["ad"]}

    var_filters: dict[str, list[str]] | None = None
    # Example: {"is_control_probe": [False]}

    spatial_filters: dict[str, Any] | None = None
    # Keys: "bbox" (xmin,ymin,xmax,ymax), "roi_mask" (numpy bool array),
    #       "abeta_dist_max_um" (float), "abeta_dist_min_um" (float)

    transcript_filters: dict[str, Any] | None = None
    # Keys: "compartment" (list of str), "radial_shell" (int)

    min_cells: int = 20         # raise SubsetTooSmallError if result < this
    min_transcripts: int = 0
    label: str = "all"          # used as suffix in output keys and filenames

    def apply(
        self,
        adata: AnnData,
        transcripts: pd.DataFrame | None = None,
    ) -> tuple[AnnData, pd.DataFrame | None]:
        """
        Returns a view (not a copy) of adata satisfying all filters,
        plus the correspondingly filtered transcripts DataFrame.
        Raises SubsetTooSmallError if result has fewer than min_cells cells.
        NEVER modifies adata in-place.
        """
```

### 3d. FigureStyle Contract

```python
class FigureStyle:
    # Journal-grade constants — do not change without updating docs
    FONT_FAMILY: str = "Arial"
    FONT_SIZE_LABEL: int = 7
    FONT_SIZE_TITLE: int = 8
    FONT_SIZE_TICK: int = 6
    DPI: int = 300
    PRIMARY_FORMAT: str = "svg"
    SECONDARY_FORMAT: str = "png"
    SINGLE_COL_MM: float = 88.0
    DOUBLE_COL_MM: float = 180.0
    MAX_HEIGHT_MM: float = 247.0
    CATEGORICAL_PALETTE: str = "wong"        # 8-color colorblind-safe
    CONTINUOUS_PALETTE: str = "viridis"
    DIVERGING_PALETTE: str = "RdBu_r"

    @staticmethod
    def apply(fig: Figure, ax: Axes | list[Axes]) -> None: ...
    # Sets fonts, spines, tick parameters globally on the figure.

    @staticmethod
    def add_scale_bar(ax: Axes, pixel_size_um: float, length_um: float = 50) -> None: ...

    @staticmethod
    def save_with_caption(fig: Figure, path: Path, caption: str) -> None: ...
    # Saves SVG + PNG, writes caption to path.with_suffix(".txt")
```

---

## 4. Decision Log (Architecture-Level)

See Section 5 of this document for the full decision log with rationale.

---

## 5. Test Strategy Per Phase

| Phase | Test type | Fixture | Key assertions |
|-------|-----------|---------|----------------|
| 0 | Unit | N/A | Config round-trips, SubsetSpec edge cases, RunContext isolation |
| 1 | Unit + smoke | make_fixture.py small | File loads without error, AnnData schema valid |
| 2 | Unit + integration | make_fixture.py with injected QC failures | Known-bad cells removed, known-good cells kept |
| 3 | Integration + sanity | make_fixture.py with injected cell types | Marker genes recover ground-truth clusters |
| 4 | Integration + statistical | make_fixture.py with injected spatial signals | Injected LR pair recovered, injected hotspot detected |
| 5 | Statistical validation | Real pilot data + synthetic | Bayesian model credible intervals cover ground truth |
| 6 | Integration | External h5ad fixture | Label transfer accuracy > baseline |
| 7 | Smoke | Any completed run | Reports render without error, all figures present |
| 8 | Build | N/A | Quarto build succeeds, all pages render |
| 9 | CI dry-run | make_fixture.py | All rules dry-run, no missing inputs |
```

---

## Section 2: Phase-by-Phase Subagent Tasks

---

## Task 0-A: Package Scaffold and Project Infrastructure

```
Status: pending
Assigned to: cursor-agent-0a
Estimated session length: short
```

**Inputs:**
- Read: nothing exists yet — this task bootstraps the repository
- Verify installed: `python -m pip show hatch ruff mypy pre-commit`
- Reference: `docs/architecture/architecture_rfc.md` (Section 1 of this document)

**Acceptance Criteria:**
```
[ ] `pip install -e ".[dev]"` completes without error on Python 3.11+
[ ] `python -c "import spatialpy; print(spatialpy.__version__)"` prints a semver string
[ ] `ruff check spatialpy/` exits 0 on the empty scaffold
[ ] `mypy spatialpy/ --strict` exits 0 on the empty scaffold (only __init__ stubs)
[ ] `pre-commit run --all-files` exits 0
[ ] `spatialpy/__init__.py` exports: SubsetSpec, RunContext, FigureStyle, AnalysisConfig
    (as forward references — actual implementations come in later tasks)
[ ] `.editorconfig` sets: indent_style=space, indent_size=4, end_of_line=lf,
    charset=utf-8, trim_trailing_whitespace=true for *.py files
[ ] `pyproject.toml` defines [project], [project.optional-dependencies.dev],
    [tool.ruff], [tool.mypy], [tool.pytest.ini_options] sections
[ ] `pyproject.toml` pins: Python >=3.11, anndata>=0.10, pydantic>=2.0,
    snakemake>=8.0, numpy>=1.26, pandas>=2.0, scanpy>=1.10
[ ] `.github/workflows/ci.yml` skeleton exists (can be empty jobs — filled in Task 9-B)
```

**Output contract:**
```
CREATED:
  pyproject.toml
  README.md                    (title + one-paragraph description)
  LICENSE                      (MIT)
  .gitignore                   (Python + HPC + data file patterns)
  .editorconfig
  .pre-commit-config.yaml      (ruff, mypy, trailing-whitespace, end-of-file-fixer)
  spatialpy/__init__.py        (version string + forward-declared exports)
  spatialpy/__main__.py        (entry point stub → cli.py)
  spatialpy/config/__init__.py
  spatialpy/core/__init__.py
  spatialpy/io/__init__.py
  spatialpy/steps/__init__.py
  spatialpy/methods/__init__.py
  spatialpy/plotting/__init__.py
  spatialpy/ui/__init__.py
  spatialpy/hpc/__init__.py
  spatialpy/reporting/__init__.py
  spatialpy/website/__init__.py
  spatialpy/r_bridge/__init__.py
  spatialpy/exceptions.py      (SpatialPyError, SubsetTooSmallError, ConfigError,
                                ValidationError, StepError)
  tests/__init__.py
  tests/conftest.py            (empty — fixtures added in Task 0-G)
  workflow/Snakefile           (skeleton — rules added per step task)
  docs/architecture/adata_schema.md  (stub — filled in Task 0-D)
```

**Do not:**
- Do not implement any analysis logic — stubs and `raise NotImplementedError` only
- Do not add optional dependencies (torch, pymc, etc.) to `[project.dependencies]` — put them in extras only
- Do not create test fixtures yet — that is Task 0-G
- Do not pin exact dependency versions (use `>=`) to avoid resolver conflicts

**Dependencies:** None — this is the root task.

---

## Task 0-B: Pydantic Config Schema + YAML Presets

```
Status: pending
Assigned to: cursor-agent-0b
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/config/__init__.py`, `spatialpy/exceptions.py`
- Grep: `grep -r "AnalysisConfig" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import pydantic; print(pydantic.__version__)"` (must be >=2.0)
- Reference: Section 4 of original plan (YAML config schema)

**Acceptance Criteria:**
```
[ ] `from spatialpy.config.schema import AnalysisConfig` imports without error
[ ] `AnalysisConfig.model_validate(yaml.safe_load(open("spatialpy/config/defaults.yaml")))` 
    succeeds without ValidationError
[ ] Each of the 5 preset YAMLs (fic_default, dlpfc_default, dg_default,
    fast_local_debug, hpc_full_run) validates against AnalysisConfig without error
[ ] `AnalysisConfig.model_json_schema()` produces a schema saved to
    `spatialpy/config/config_schema.json` that validates all preset YAMLs
    with jsonschema
[ ] Invalid config (negative mad_multiplier, unknown preset name, missing required
    field) raises pydantic.ValidationError with a message that identifies the
    failing field
[ ] `AnalysisConfig` is immutable after construction (model_config = {"frozen": True})
[ ] `AnalysisConfig.to_yaml(path)` round-trips: validate → serialize → deserialize
    → re-validate with no differences
[ ] `tests/unit/test_config_schema.py::test_round_trip_all_presets` passes
[ ] `tests/unit/test_config_schema.py::test_invalid_configs` passes (10 invalid cases)
[ ] `tests/unit/test_config_schema.py::test_json_schema_coverage` verifies all
    required fields appear in the JSON schema
```

**Output contract:**
```
CREATED:
  spatialpy/config/schema.py         (AnalysisConfig + all sub-models)
  spatialpy/config/defaults.yaml
  spatialpy/config/config_schema.json
  spatialpy/config/samples_template.yaml
  spatialpy/config/presets/fic_default.yaml
  spatialpy/config/presets/dlpfc_default.yaml
  spatialpy/config/presets/dg_default.yaml
  spatialpy/config/presets/fast_local_debug.yaml
  spatialpy/config/presets/hpc_full_run.yaml
  tests/unit/test_config_schema.py

EXPORTS from spatialpy/config/schema.py:
  AnalysisConfig
  SampleConfig
  QCConfig
  ClusteringConfig
  DEGConfig
  NeighborhoodConfig
  MorphologyConfig
  SpatialDensityConfig
  ProbeEfficiencyConfig
```

**Do not:**
- Do not use `from __future__ import annotations` in Pydantic v2 models — it breaks field validators
- Do not use `Optional[X]` — use `X | None` (Python 3.11+)
- Do not store mutable defaults (lists, dicts) as field defaults — use `Field(default_factory=...)`
- Do not add runtime logic (file existence checks) to the schema — that belongs in validators.py

**Dependencies:** Task 0-A

---

## Task 0-C: ParameterSpec Registry + ConfigMetadata System

```
Status: pending
Assigned to: cursor-agent-0c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/config/schema.py`, `spatialpy/config/defaults.yaml`
- Grep: `grep -r "ParameterSpec" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import pydantic; print(pydantic.version.VERSION)"`

**Acceptance Criteria:**
```
[ ] `from spatialpy.config.metadata import PARAMETER_REGISTRY` imports cleanly
[ ] `PARAMETER_REGISTRY` contains at least 30 entries — one for each configurable
    parameter in AnalysisConfig (sampled: qc.mad_multiplier, clustering.n_pcs,
    neighborhoods.banksy_lambda_list, deg.pseudobulk_min_cells)
[ ] Every ParameterSpec entry has non-empty: description, biological_rationale,
    mathematical_rationale, when_to_change, and at least one common_failure_mode
[ ] `get_parameter_spec("qc.mad_multiplier")` returns the correct ParameterSpec
[ ] `get_parameter_spec("nonexistent.key")` raises KeyError with a helpful message
[ ] `render_parameter_docs(section="qc")` returns a markdown string containing all
    qc section parameters with their descriptions (used in docs build)
[ ] `tests/unit/test_config_metadata.py::test_registry_completeness` passes —
    verifies every field path in AnalysisConfig has an entry in PARAMETER_REGISTRY
[ ] `tests/unit/test_config_metadata.py::test_parameter_spec_fields` passes —
    verifies no ParameterSpec has empty required fields
```

**Output contract:**
```
CREATED:
  spatialpy/config/metadata.py

EXPORTS from spatialpy/config/metadata.py:
  ParameterSpec             (dataclass)
  PARAMETER_REGISTRY        (dict[str, ParameterSpec])
  get_parameter_spec(key: str) -> ParameterSpec
  list_parameters(section: str | None = None) -> list[ParameterSpec]
  render_parameter_docs(section: str | None = None) -> str

MODIFIED:
  spatialpy/config/__init__.py   (add metadata exports)
```

**Do not:**
- Do not hardcode the registry as a flat dict literal — use a builder pattern or decorator so future steps can register their own parameters
- Do not duplicate information already in the Pydantic field descriptions — cross-reference rather than copy

**Dependencies:** Task 0-B

---

## Task 0-D: RunContext, RunManifest, BenchmarkStore, Provenance Tracking

```
Status: pending
Assigned to: cursor-agent-0d
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/core/__init__.py`, `spatialpy/config/schema.py`, `spatialpy/exceptions.py`
- Grep: `grep -r "RunContext\|RunManifest\|BenchmarkStore" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import hashlib, uuid, subprocess; print('ok')"` (stdlib only)

**Acceptance Criteria:**
```
[ ] `from spatialpy.core.context import RunContext, RunManifest, BenchmarkStore` imports
[ ] `RunContext.create(config, output_dir)` produces a RunContext with:
    - unique UUID4 run_id
    - SHA256 config_hash computed from canonical JSON serialization of config
    - git_commit from subprocess if in git repo, else None (no error)
    - package_version from importlib.metadata
    - started_at as UTC datetime
[ ] `ctx.checkpoint("s01_load_data", adata)` writes adata to
    `<output_dir>/checkpoints/s01_load_data.h5ad` and registers it in the manifest
[ ] `ctx.manifest.to_json()` produces a valid JSON file containing all registered
    inputs and outputs with their SHA256 hashes
[ ] `ctx.benchmark_store.record("s01_load_data", "wall_time_s", 12.3)` stores the
    value and `ctx.benchmark_store.to_dataframe()` returns it correctly
[ ] `RunContext` can be serialized to JSON and deserialized (for run resumption)
[ ] Two runs with identical config on identical data produce identical config_hash
[ ] `tests/unit/test_context.py::test_run_context_creation` passes
[ ] `tests/unit/test_context.py::test_manifest_roundtrip` passes
[ ] `tests/unit/test_context.py::test_git_commit_graceful_none` passes (tested
    by running in a temp dir outside any git repo)
[ ] `docs/architecture/adata_schema.md` is populated with all REQUIRED_OBS_COLS,
    REQUIRED_VAR_COLS, REQUIRED_OBSM_KEYS, REQUIRED_UNS_KEYS (from RFC §3a)
```

**Output contract:**
```
CREATED:
  spatialpy/core/context.py          (RunContext, RunManifest, BenchmarkStore)
  spatialpy/core/provenance.py       (file_hash, compute_config_hash helpers)
  docs/architecture/adata_schema.md
  tests/unit/test_context.py

EXPORTS from spatialpy/core/context.py:
  RunContext
  RunManifest
  BenchmarkStore

MODIFIED:
  spatialpy/core/__init__.py
```

**Do not:**
- Do not use mutable class attributes — use `field(default_factory=...)` in dataclasses
- Do not call `subprocess.check_output(["git", ...])` without a try/except — git may not exist
- Do not store AnnData objects inside RunContext — only paths and hashes

**Dependencies:** Task 0-B

---

## Task 0-E: SubsetSpec — Universal Filtering Interface + Tests

```
Status: pending
Assigned to: cursor-agent-0e
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/core/__init__.py`, `spatialpy/exceptions.py`
- Grep: `grep -r "SubsetSpec\|obs_filters\|spatial_filters" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import anndata; print(anndata.__version__)"` (must be >=0.10)
- Reference: RFC Section 3c (SubsetSpec contract above)

**Acceptance Criteria:**
```
[ ] `SubsetSpec().apply(adata)` on a valid AnnData returns (adata_view, None) with
    zero filtering (all cells kept)
[ ] `SubsetSpec(obs_filters={"condition": ["ad"]}).apply(adata)` returns only AD cells
[ ] `SubsetSpec(obs_filters={"cell_type": ["Microglia"]}).apply(adata)` returns
    only microglia; the returned object is a view, not a copy
[ ] `SubsetSpec(spatial_filters={"bbox": [0, 0, 500, 500]}).apply(adata)` returns
    only cells with obsm["spatial"] coordinates inside the bounding box
[ ] `SubsetSpec(spatial_filters={"abeta_dist_max_um": 50.0}).apply(adata)` returns
    cells where adata.obs["abeta_dist_um"] <= 50.0
[ ] `SubsetSpec(min_cells=100).apply(adata_with_5_cells)` raises SubsetTooSmallError
[ ] `SubsetSpec().apply(empty_adata)` returns (empty_adata, None) without raising
[ ] Applying SubsetSpec NEVER mutates the input adata (verified by checking adata.n_obs
    before and after)
[ ] `SubsetSpec` with transcript_filters filters the transcripts DataFrame accordingly
[ ] `SubsetSpec.label` is appended to output filenames downstream (tested by checking
    the label="microglia" case produces output keys ending in "_microglia")
[ ] `tests/unit/test_subset.py::test_all_filter_types` passes (12 parametrized cases)
[ ] `tests/unit/test_subset.py::test_empty_adata` passes
[ ] `tests/unit/test_subset.py::test_no_mutation` passes
[ ] `tests/unit/test_subset.py::test_too_small_raises` passes
```

**Output contract:**
```
CREATED:
  spatialpy/core/subset.py
  tests/unit/test_subset.py

EXPORTS from spatialpy/core/subset.py:
  SubsetSpec
  SubsetTooSmallError   (re-exported from exceptions.py)
```

**Do not:**
- Do not call `adata.copy()` — return views to avoid memory duplication
- Do not modify `adata.obs` to add filter columns — compute masks only
- Do not raise on empty AnnData (0 cells) — only raise when result < min_cells

**Dependencies:** Task 0-A, Task 0-D

---

## Task 0-F: FigureStyle System + Tests

```
Status: pending
Assigned to: cursor-agent-0f
Estimated session length: short
```

**Inputs:**
- Read: `spatialpy/plotting/__init__.py`, `spatialpy/exceptions.py`
- Grep: `grep -r "FigureStyle\|savefig\|pyplot.show" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import matplotlib; print(matplotlib.__version__)"` (>=3.8)

**Acceptance Criteria:**
```
[ ] `from spatialpy.plotting.style import FigureStyle` imports without error
[ ] `fig, ax = plt.subplots(); FigureStyle.apply(fig, ax)` completes without error
[ ] After `FigureStyle.apply(fig, ax)`, all text objects in the figure use Arial font
[ ] `FigureStyle.add_scale_bar(ax, pixel_size_um=0.10625, length_um=50)` adds a
    scalebar artist to the axis without error
[ ] `FigureStyle.save_with_caption(fig, tmp_path/"test.svg", "Test figure")` produces
    both tmp_path/"test.svg" and tmp_path/"test.png" and tmp_path/"test.txt"
[ ] `FigureStyle.single_col_figsize()` returns (width, height) in inches such that
    width ≈ 88mm / 25.4
[ ] `FigureStyle.double_col_figsize()` returns width ≈ 180mm / 25.4
[ ] `FigureStyle.categorical_cmap(n=8)` returns a ListedColormap with 8 colors
    drawn from the Wong colorblind-safe palette
[ ] `plt.show()` is NEVER called inside FigureStyle or any spatialpy/plotting/ file
    (verified by grep: `grep -r "plt.show\|pyplot.show" spatialpy/plotting/` returns empty)
[ ] `tests/unit/test_style.py::test_apply_sets_fonts` passes
[ ] `tests/unit/test_style.py::test_save_produces_both_formats` passes
[ ] `tests/unit/test_style.py::test_scale_bar_added` passes
```

**Output contract:**
```
CREATED:
  spatialpy/plotting/style.py
  tests/unit/test_style.py

EXPORTS from spatialpy/plotting/style.py:
  FigureStyle
```

**Do not:**
- Do not use `matplotlib.rcParams` global modifications — apply per-figure only
- Do not hardcode Arial if it is not available — fall back gracefully and warn

**Dependencies:** Task 0-A

---

## Task 0-G: Synthetic Fixture Generator with Injected Ground Truth

```
Status: pending
Assigned to: cursor-agent-0g
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/core/subset.py`, `spatialpy/config/schema.py`, `docs/architecture/adata_schema.md`
- Grep: `grep -r "make_fixture\|conftest" tests/ --include="*.py" -n`
- Verify installed: `python -c "import anndata, numpy, pandas, scipy, PIL; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `python tests/fixtures/make_fixture.py --output tests/fixtures/fixture_small/`
    completes in < 30 seconds and produces the complete fixture directory
[ ] Fixture AnnData has all REQUIRED_OBS_COLS, REQUIRED_VAR_COLS, REQUIRED_OBSM_KEYS
    from adata_schema.md populated with correct types
[ ] Fixture includes exactly 3 injected cell types: Microglia (30%), Astrocyte (30%),
    Excitatory_Neuron (40%) — recoverable by marker genes
[ ] Fixture includes 3 injected cortical layers with known y-coordinate ordering
[ ] Fixture includes 2 conditions (ad, cn) with 2 samples each (n=4 total)
[ ] Fixture includes 10 genes with 2× injected upregulation in AD Microglia
    (ground truth for DEG recovery tests)
[ ] Fixture includes 1 injected ligand-receptor pair with spatial proximity signal
[ ] Fixture includes: cell mask TIFF (uint16 label image), nucleus mask TIFF,
    aligned IF images (abeta, dapi, gfap) as float32 TIFFs
[ ] Fixture includes transcript DataFrame with gene, x, y, z, cell_id columns and
    injected nuclear enrichment for 5 genes
[ ] Fixture includes malformed/ subdirectory with: missing_column.csv,
    negative_counts.csv, coord_out_of_bounds.csv, mask_label_collision.tiff
[ ] `tests/conftest.py::fixture_adata` pytest fixture uses `make_fixture.py` output
[ ] `tests/unit/test_fixture.py::test_fixture_schema_valid` passes
[ ] `tests/unit/test_fixture.py::test_injected_markers_recoverable` passes
    (Spearman r > 0.8 between marker expression and cell type label)
[ ] make_fixture.py accepts `--n-cells`, `--n-genes`, `--seed` arguments for
    parameterized testing
```

**Output contract:**
```
CREATED:
  tests/fixtures/make_fixture.py
  tests/fixtures/test_config.yaml
  tests/fixtures/fixture_small/   (generated, not committed — in .gitignore)
  tests/fixtures/malformed/       (committed — small, deterministic bad files)
  tests/conftest.py               (populated with pytest fixtures)
  tests/unit/test_fixture.py

EXPORTS from make_fixture.py (as importable functions):
  make_adata(n_cells, n_genes, seed) -> AnnData
  make_transcript_table(adata, seed) -> pd.DataFrame
  make_mask_tiff(adata, pixel_size_um) -> np.ndarray
  make_if_image(adata, channel, pixel_size_um) -> np.ndarray
  make_full_fixture(output_dir, n_cells, n_genes, seed) -> Path
```

**Do not:**
- Do not use real patient data — fixtures must be entirely synthetic
- Do not commit generated fixtures to git — only the generator script
- Do not inject all signals simultaneously — use a `--signal` flag to enable them selectively

**Dependencies:** Task 0-A through 0-F

---

## Task 1-A: s00 validate_inputs — Schema and File Integrity Checks

```
Status: pending
Assigned to: cursor-agent-1a
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/io/validators.py` (stub), `spatialpy/core/context.py`,
        `spatialpy/config/schema.py`, `spatialpy/exceptions.py`
- Grep: `grep -r "validate_inputs\|ValidationError" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import tifffile, zarr; print('ok')`"

**Acceptance Criteria:**
```
[ ] `run_validate_inputs(ctx)` returns without error on the small fixture
[ ] On `malformed/missing_column.csv`: raises ValidationError identifying the missing
    column by name
[ ] On `malformed/negative_counts.csv`: raises ValidationError with the offending
    gene name and cell ID
[ ] On `malformed/coord_out_of_bounds.csv`: raises ValidationError with the coordinate
    range and image dimensions
[ ] On `malformed/mask_label_collision.tiff`: raises ValidationError
[ ] On valid inputs: assigns and writes the run UUID to the output directory
[ ] On valid inputs: writes frozen config as `<output_dir>/run_config.yaml`
[ ] Validates that JSON and TIFF masks describe the same set of cell IDs
    (when both are provided)
[ ] Validates pixel_size_um is positive and within plausible range (0.05–1.0 µm)
[ ] Validates transcript coordinates are within image bounds for each sample
[ ] Snakemake rule `workflow/rules/s00_validate.smk` dry-runs without error
[ ] `tests/unit/test_s00_validate.py::test_valid_inputs` passes
[ ] `tests/unit/test_s00_validate.py::test_invalid_inputs` passes (parametrized,
    one case per malformed fixture)
[ ] `tests/integration/test_s00_real.py::test_s00_on_fixture` passes (end-to-end)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s00_validate_inputs.py
  spatialpy/io/validators.py           (validation helper functions)
  workflow/rules/s00_validate.smk
  tests/unit/test_s00_validate.py
  tests/integration/test_s00_real.py

EXPORTS from spatialpy/steps/s00_validate_inputs.py:
  run_validate_inputs(ctx: RunContext) -> ValidationReport
  ValidationReport                     (dataclass with passed: bool, errors: list[str])
```

**Do not:**
- Do not raise Python exceptions for every validation failure — collect all errors and raise once with the full list
- Do not open large TIFF files fully into memory for validation — use tifffile metadata only

**Dependencies:** Task 0-A through 0-G

---

## Task 1-B: s01 load_data — Counts, Transcripts, Masks, IF Images → AnnData

```
Status: pending
Assigned to: cursor-agent-1b
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s00_validate_inputs.py`, `spatialpy/io/loaders.py` (stub),
        `spatialpy/io/mask_io.py` (stub), `spatialpy/io/transcript_io.py` (stub),
        `docs/architecture/adata_schema.md`
- Grep: `grep -r "adata\.X\|adata\.layers\|adata\.obs\|adata\.uns" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import tifffile, scipy.sparse, anndata; print('ok')`"

**Acceptance Criteria:**
```
[ ] `run_load_data(ctx)` on the small fixture produces a valid AnnData at
    `<output_dir>/s01_load_data/adata.h5ad`
[ ] adata.X is a scipy CSR sparse matrix of int32 with shape (n_cells, n_genes)
[ ] adata.layers["nucleus_counts"] exists and has same shape as adata.X
[ ] adata.obsm["spatial"] has shape (n_cells, 2) and dtype float64
[ ] All REQUIRED_OBS_COLS from adata_schema.md are present and correctly typed
[ ] All REQUIRED_VAR_COLS from adata_schema.md are present
[ ] adata.uns["images"] contains "abeta", "dapi", "gfap" as numpy float32 arrays
[ ] adata.uns["masks"]["cell"] is a uint16 numpy array matching the TIFF dimensions
[ ] adata.uns["transcripts"] is a dict keyed by sample_id, each a pd.DataFrame
    with columns: gene, x, y, z, cell_id, nucleus_id
[ ] Multi-sample loading produces a single concatenated AnnData with sample_id column
[ ] adata.uns["spatialpy_version"], ["run_id"], ["config_hash"] are all set
[ ] The loaded AnnData round-trips: `anndata.read_h5ad(path)` produces identical
    object (same obs names, same X sum)
[ ] `tests/unit/test_s01_load.py::test_load_adata_schema` passes
[ ] `tests/unit/test_s01_load.py::test_multi_sample_concatenation` passes
[ ] `tests/unit/test_s01_load.py::test_mask_alignment` passes
    (cell centroids from obsm["spatial"] lie within their corresponding mask label)
[ ] `tests/integration/test_s01_real.py::test_s01_on_fixture` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s01_load_data.py
  spatialpy/io/loaders.py              (CSV, h5ad loading functions)
  spatialpy/io/mask_io.py              (TIFF + JSON mask loading)
  spatialpy/io/transcript_io.py        (transcript coordinate ingestion)
  spatialpy/io/image_alignment.py      (coordinate system checks)
  workflow/rules/s01_load.smk
  tests/unit/test_s01_load.py
  tests/integration/test_s01_real.py

EXPORTS from spatialpy/steps/s01_load_data.py:
  run_load_data(ctx: RunContext) -> AnnData
```

**Do not:**
- Do not write to `adata.X` after initial population — X is frozen after this step
- Do not load entire IF images into adata.uns if they exceed 2GB — store file paths instead and lazy-load
- Do not use `pd.concat` on AnnData objects — use `anndata.concat()`

**Dependencies:** Task 1-A

---

## Task 1-C: Integration Test — s00 → s01 Pipeline on All Fixtures

```
Status: pending
Assigned to: cursor-agent-1c
Estimated session length: short
```

**Inputs:**
- Read: `tests/integration/test_s00_real.py`, `tests/integration/test_s01_real.py`,
        `tests/conftest.py`, `workflow/Snakefile`
- Grep: `grep -r "def test_" tests/integration/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `pytest tests/integration/ -k "s00 or s01" -v` passes all tests
[ ] Snakemake dry-run completes: `snakemake -n --configfile tests/fixtures/test_config.yaml`
[ ] Pipeline handles 1-sample, 2-sample (same condition), and 4-sample (AD+CN) fixtures
[ ] Pipeline handles fixture with missing IF images (optional channels) gracefully
[ ] Pipeline handles fixture with no nucleus mask (nucleus_present=False for all cells)
[ ] Full s00→s01 wall time < 60 seconds on the small fixture (n_cells=500)
[ ] AnnData produced by s01 passes all schema assertions in `docs/architecture/adata_schema.md`
[ ] `tests/integration/test_s00_s01_pipeline.py::test_full_pipeline_small` passes
[ ] `tests/integration/test_s00_s01_pipeline.py::test_pipeline_missing_if` passes
[ ] `tests/integration/test_s00_s01_pipeline.py::test_pipeline_no_nucleus` passes
```

**Output contract:**
```
CREATED:
  tests/integration/test_s00_s01_pipeline.py
MODIFIED:
  workflow/Snakefile   (ensure s00 → s01 dependency is declared)
```

**Do not:**
- Do not create new fixture generators — use make_fixture.py with different arguments
- Do not test biological correctness here — that is Task 2-D

**Dependencies:** Task 1-A, Task 1-B, Task 0-G

---

## Task 2-A: s02 Pre-QC Clustering

```
Status: pending
Assigned to: cursor-agent-2a
Estimated session length: short
```

**Inputs:**
- Read: `spatialpy/steps/s01_load_data.py`, `spatialpy/core/subset.py`,
        `spatialpy/core/context.py`
- Grep: `grep -r "cell_type_rough\|pre_qc\|rough_clustering" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import scanpy; print(scanpy.__version__)"` (>=1.10)

**Acceptance Criteria:**
```
[ ] `run_pre_qc_clustering(ctx, adata)` adds `adata.obs["cell_type_rough"]` (str, not NaN)
[ ] Low-resolution Leiden (resolution from config.qc.rough_clustering_resolution) is used
[ ] Normalization and log-transform are applied to a LAYER, not to adata.X
    (verify: adata.X checksum before == adata.X checksum after)
[ ] PCA, neighbor graph, and Leiden are written to adata.obsp and adata.obsm respectively
[ ] Number of rough clusters is between 3 and 15 on the fixture (sanity check)
[ ] Result adata is checkpointed via ctx.checkpoint("s02", adata)
[ ] Snakemake rule dry-runs without error
[ ] `tests/unit/test_s02.py::test_rough_cluster_no_x_mutation` passes
[ ] `tests/unit/test_s02.py::test_rough_cluster_produces_obs_column` passes
[ ] `tests/unit/test_s02.py::test_rough_cluster_count_range` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s02_pre_qc_clustering.py
  workflow/rules/s02_s04_qc.smk         (add s02 rule)
  tests/unit/test_s02.py

EXPORTS:
  run_pre_qc_clustering(ctx: RunContext, adata: AnnData) -> AnnData
```

**Do not:**
- Do not normalize in-place on adata.X — use `sc.pp.normalize_total(adata, layer="counts_norm", inplace=False)`
- Do not use high resolution (>0.5) for rough clustering — this is for QC grouping only

**Dependencies:** Task 1-C

---

## Task 2-B: s03 MAD-Based Cell-Type-Aware QC Filtering

```
Status: pending
Assigned to: cursor-agent-2b
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s02_pre_qc_clustering.py`, `spatialpy/methods/qc.py` (stub),
        `spatialpy/config/schema.py` (QCConfig)
- Grep: `grep -r "mad_multiplier\|cell_type_rough\|qc_filter" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `compute_mad_thresholds(adata, group_col, metric_col, k)` returns a DataFrame
    with one row per group, columns: group, median, mad, lower_threshold, upper_threshold
[ ] `run_qc_filtering(ctx, adata)` marks cells in adata.obs["qc_pass"] (bool)
    using per-cell-type MAD-based thresholds on: n_counts, n_genes, cell_area_um2
[ ] Cells with nucleus_present=False are filtered out when config.qc.require_nucleus=True
[ ] The injected low-quality cells in the fixture (n_counts < 5) are flagged as qc_pass=False
[ ] At least 90% of cells with injected cell types are retained (qc_pass=True)
[ ] adata.uns["qc_report"] contains: n_total, n_pass, n_fail_per_metric,
    per_type_thresholds, warnings (if >30% of any type removed)
[ ] `tests/unit/test_s03.py::test_mad_threshold_math` passes — manually computed
    MAD for 5 known values matches function output
[ ] `tests/unit/test_s03.py::test_injected_bad_cells_removed` passes
[ ] `tests/unit/test_s03.py::test_good_cells_retained` passes
[ ] `tests/unit/test_s03.py::test_require_nucleus_flag` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s03_qc_filtering.py
  spatialpy/methods/qc.py

EXPORTS:
  run_qc_filtering(ctx: RunContext, adata: AnnData) -> AnnData
  compute_mad_thresholds(adata, group_col, metric_col, k) -> pd.DataFrame
  (from methods/qc.py, pure functions — no AnnData mutation)
```

**Do not:**
- Do not drop cells from adata — mark qc_pass=False and filter in a separate step so the QC report can see both
- Do not apply a global MAD threshold — always stratify by `cell_type_rough`

**Dependencies:** Task 2-A

---

## Task 2-C: s04 Post-QC EDA + Publication-Grade QC Figures

```
Status: pending
Assigned to: cursor-agent-2c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s03_qc_filtering.py`, `spatialpy/plotting/style.py`,
        `spatialpy/plotting/eda.py` (stub)
- Grep: `grep -r "FigureStyle\|savefig\|qc_pass" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `run_post_qc_eda(ctx, adata)` produces the following figures (all SVG + PNG):
    - qc_violin.svg: per-metric violin plots stratified by cell_type_rough
    - qc_scatter.svg: n_counts vs n_genes colored by qc_pass
    - qc_spatial.svg: spatial scatter colored by qc_pass (removed cells visible)
    - qc_threshold_summary.svg: bar chart of cells removed per type per metric
    - mask_overlay_preview.svg: first sample, cell masks overlaid on DAPI image
[ ] All figures pass FigureStyle requirements (Arial, 300dpi, SVG primary)
[ ] All figures have scale bars where spatial coordinates are shown
[ ] `plt.show()` is never called (verified by grep in plotting/eda.py)
[ ] Each figure has a corresponding caption saved as .txt file
[ ] `tests/unit/test_s04.py::test_eda_figures_produced` passes (checks file existence)
[ ] `tests/unit/test_s04.py::test_figures_no_show_call` passes (grep-based)
[ ] `tests/unit/test_s04.py::test_scale_bar_present_on_spatial` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s04_post_qc_eda.py
  spatialpy/plotting/eda.py
  tests/unit/test_s04.py

EXPORTS:
  run_post_qc_eda(ctx: RunContext, adata: AnnData) -> list[Path]
  (from plotting/eda.py): plot_qc_violin, plot_qc_scatter, plot_qc_spatial
```

**Do not:**
- Do not call `sc.pl.*` functions — these call plt.show() internally. Use sc.tl + manual plotting.

**Dependencies:** Task 2-B, Task 0-F

---

## Task 2-D: Integration Test — Full QC Pipeline

```
Status: pending
Assigned to: cursor-agent-2d
Estimated session length: short
```

**Inputs:**
- Read: all test files in `tests/integration/`, `tests/fixtures/make_fixture.py`
- Grep: `grep -r "def test_" tests/integration/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `pytest tests/integration/ -k "qc" -v` passes all tests
[ ] Full s00→s01→s02→s03→s04 pipeline completes on the small fixture in < 120s
[ ] Injected low-quality cells (from make_fixture.py) are removed at s03
[ ] Injected high-quality cells are retained at >95% rate
[ ] All QC figures are produced and non-empty (file size > 1KB)
[ ] Snakemake dry-run for all QC rules completes without error
[ ] `tests/integration/test_qc_pipeline.py::test_full_qc_pipeline` passes
[ ] `tests/integration/test_qc_pipeline.py::test_qc_sanity_retention_rate` passes
```

**Output contract:**
```
CREATED:
  tests/integration/test_qc_pipeline.py
```

**Dependencies:** Task 2-A, Task 2-B, Task 2-C, Task 1-C

---

## Task 3-A: s05 Cortical Layers — Region-Aware Assignment

```
Status: pending
Assigned to: cursor-agent-3a
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s03_qc_filtering.py`, `spatialpy/methods/layers.py` (stub),
        `spatialpy/config/schema.py` (CorticalLayersConfig)
- Grep: `grep -r "cortical_layer\|region\|fic\|dlpfc" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `run_cortical_layers(ctx, adata)` adds adata.obs["cortical_layer"] (str) and
    adata.obs["layer_confidence"] (float, 0–1)
[ ] FIC region uses agranular scheme (L1, L2/3, L5, L6 — no L4)
[ ] DLPFC region uses canonical scheme (L1, L2/3, L4, L5, L6)
[ ] DG region uses hippocampal scheme (GCL, ML, hilus, CA1) — not cortical
[ ] "combined" method (default) uses both marker genes and spatial gradient,
    weighted by layer_confidence
[ ] Marker-only mode uses the configured marker panel — default markers are
    documented in config.cortical_layers.marker_genes with citations
[ ] Gradient-only mode uses y-coordinate rank-based layer assignment
[ ] Injected layer structure in the fixture is recovered with ARI > 0.7
[ ] All layer assignments are documented in adata.uns["cortical_layers"]["method_log"]
[ ] `tests/unit/test_s05.py::test_layer_assignment_fic` passes (FIC has no L4)
[ ] `tests/unit/test_s05.py::test_layer_assignment_dlpfc` passes (DLPFC has L4)
[ ] `tests/unit/test_s05.py::test_ari_on_fixture` passes (ARI > 0.7)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s05_cortical_layers.py
  spatialpy/methods/layers.py
  tests/unit/test_s05.py

EXPORTS:
  run_cortical_layers(ctx: RunContext, adata: AnnData,
                      subset: SubsetSpec | None = None) -> AnnData
```

**Do not:**
- Do not assume all regions are cortical — add explicit region_type check early in the function
- Do not hardcode marker gene lists in the function body — read from config

**Dependencies:** Task 2-D

---

## Task 3-B: s06 Multi-Method Clustering (Harmony+Leiden + CONCORD)

```
Status: pending
Assigned to: cursor-agent-3b
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s05_cortical_layers.py`, `spatialpy/config/schema.py` (ClusteringConfig)
- Grep: `grep -r "leiden\|harmony\|concord\|clustering" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import harmonypy, leidenalg, concord; print('ok')"` 
  (If concord is not installed: note in RFC, proceed with harmony+leiden only)

**Acceptance Criteria:**
```
[ ] `run_clustering(ctx, adata)` adds adata.obs["leiden_harmony"] when
    "harmony_leiden" is in config.clustering.methods
[ ] `run_clustering` adds adata.obs["concord_cluster"] when "concord" is in methods
[ ] Harmony batch correction uses config.clustering.harmony_leiden.batch_key
[ ] ARI between leiden_harmony and injected ground truth > 0.6 on the fixture
[ ] When both methods are run, a comparison report is written to
    adata.uns["clustering"]["method_comparison"] containing ARI, NMI, silhouette
    for each method pair
[ ] adata.obsm["X_pca_harmony"] is written for downstream use
[ ] adata.obsm["X_concord"] is written when CONCORD is run
[ ] Clustering is reproducible: running twice with same seed produces identical labels
[ ] `tests/unit/test_s06.py::test_harmony_leiden_produces_labels` passes
[ ] `tests/unit/test_s06.py::test_reproducibility` passes (two runs, same labels)
[ ] `tests/unit/test_s06.py::test_ari_above_threshold` passes
[ ] `tests/unit/test_s06.py::test_comparison_report_structure` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s06_clustering.py
  workflow/rules/s06_clustering.smk
  tests/unit/test_s06.py

EXPORTS:
  run_clustering(ctx: RunContext, adata: AnnData,
                 subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 3-A

---

## Task 3-C: s07 Cell States — Marker + Module + Decoupler

```
Status: pending
Assigned to: cursor-agent-3c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s06_clustering.py`, `spatialpy/config/schema.py` (CellStatesConfig)
- Grep: `grep -r "cell_state\|marker_panel\|module_score\|decoupler" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import decoupler; print(decoupler.__version__)"` (>=1.4)

**Acceptance Criteria:**
```
[ ] `run_cell_states(ctx, adata)` adds:
    - adata.obs["cell_state"] (str — primary annotation)
    - adata.obsm["state_scores"] (float array, shape n_cells × n_states)
    - adata.uns["cell_states"]["method_log"]
[ ] Marker-based scoring is computed for all panels in config.cell_states.marker_panels
    (at minimum: dam_microglia, reactive_astrocyte)
[ ] DAM markers (TREM2, TYROBP, CST7, LPL) produce higher scores in AD than CN
    microglia on the fixture (Mann-Whitney p < 0.05)
[ ] Cell state calls are probabilistic before hard-label assignment
    (scores are saved; threshold is configurable)
[ ] Decoupler (PROGENy/DoRothEA mode) is called when "decoupler" is in methods
[ ] `tests/unit/test_s07.py::test_dam_score_ad_higher` passes
[ ] `tests/unit/test_s07.py::test_state_scores_shape` passes
[ ] `tests/unit/test_s07.py::test_marker_based_annotation` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s07_cell_states.py
  workflow/rules/s07_cell_states.smk
  tests/unit/test_s07.py

EXPORTS:
  run_cell_states(ctx: RunContext, adata: AnnData,
                  subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 3-B

---

## Task 4-A: s08 Pseudobulk DEG — DESeq2 via pydeseq2 + muscat Aggregation

```
Status: pending
Assigned to: cursor-agent-4a
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s07_cell_states.py`, `spatialpy/core/subset.py`,
        `spatialpy/config/schema.py` (DEGConfig)
- Grep: `grep -r "pseudobulk\|pydeseq2\|muscat\|deg" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import pydeseq2; print(pydeseq2.__version__)"` (>=0.4)

**Acceptance Criteria:**
```
[ ] `aggregate_pseudobulk(adata, group_cols)` sums raw counts per sample×group,
    producing a DataFrame of shape (n_pseudobulk_samples, n_genes)
    using adata.X (raw counts — never normalized layer)
[ ] `run_deg(ctx, adata, subset)` runs DESeq2 via pydeseq2 for the given subset
    and writes results to adata.uns["deg"][subset.label]
[ ] Results contain: gene_id, log2FoldChange, lfcSE, stat, pvalue, padj, baseMean
[ ] The 10 injected AD-upregulated genes in the Microglia subset are recovered:
    padj < 0.05 and log2FC > 0.5 for all 10 in the
    SubsetSpec(obs_filters={"cell_type": ["Microglia"]}) test
[ ] When fewer than config.deg.pseudobulk_min_cells cells per sample (default: 10),
    a warning is logged and the sample is excluded (not an error)
[ ] Results are saved as `<output_dir>/s08_deg/<subset.label>_deg_results.csv`
[ ] `tests/unit/test_s08_deg.py::test_pseudobulk_aggregation_sum` passes
[ ] `tests/unit/test_s08_deg.py::test_injected_genes_recovered` passes
[ ] `tests/unit/test_s08_deg.py::test_raw_counts_used` passes
    (verifies adata.X is used, not a normalized layer)
[ ] `tests/unit/test_s08_deg.py::test_low_cell_warning` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s08_deg.py
  workflow/rules/s08_deg.smk
  tests/unit/test_s08_deg.py

EXPORTS:
  run_deg(ctx: RunContext, adata: AnnData, subset: SubsetSpec | None = None) -> AnnData
  aggregate_pseudobulk(adata: AnnData, group_cols: list[str]) -> pd.DataFrame
```

**Do not:**
- Do not use adata.layers["counts_norm"] for pseudobulk — always use raw adata.X
- Do not run cell-level Wilcoxon as the primary method — it is available but secondary
- Do not assume all samples have the same cell type composition

**Dependencies:** Task 3-C

---

## Task 4-B: s08 Within-Sample Spatial Contrasts (Near-Plaque vs Far-From-Plaque)

```
Status: pending
Assigned to: cursor-agent-4b
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s08_deg.py`, `spatialpy/core/subset.py`
- Grep: `grep -r "abeta_dist\|plaque\|spatial_contrast" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `run_spatial_deg(ctx, adata, near_threshold_um, far_threshold_um, subset)` runs
    paired DEG for cells within near_threshold_um vs beyond far_threshold_um of Aβ plaques
[ ] Uses adata.obs["abeta_dist_um"] — raises StepError with clear message if column absent
[ ] Near-plaque and far-from-plaque cells from the SAME sample are paired correctly
    (pseudobulk per sample, then DESeq2 with sample as blocking factor)
[ ] Results written to adata.uns["deg"]["plaque_proximal_vs_distal_<subset.label>"]
[ ] Figures produced: violin of top 20 DEGs, spatial scatter colored by zone
[ ] `tests/unit/test_s08_spatial.py::test_plaque_binning` passes
[ ] `tests/unit/test_s08_spatial.py::test_paired_design` passes
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s08_deg.py    (add run_spatial_deg function)
  tests/unit/test_s08_deg.py    (add spatial contrast tests)

EXPORTS:
  run_spatial_deg(ctx, adata, near_threshold_um, far_threshold_um,
                  subset: SubsetSpec | None = None) -> AnnData
```

**Do not:**
- Do not pool cells across samples for near/far comparison — this inflates false positives

**Dependencies:** Task 4-A, Task 4-L (for abeta_dist_um column — can be stubs if 4-L not done)

---

## Task 4-C: s09 Spatial Neighborhoods — BANKSY Implementation

```
Status: pending
Assigned to: cursor-agent-4c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s07_cell_states.py`, `spatialpy/config/schema.py` (NeighborhoodConfig)
- Grep: `grep -r "banksy\|spatial_domain\|lambda" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import banksy; print('ok')"` — if not available, use `pip install banksy-py`

**Acceptance Criteria:**
```
[ ] `run_banksy(ctx, adata, lambda_param)` adds adata.obsm["banksy_embedding"]
    and adata.obs["banksy_domain_{lambda}"] for each lambda in config.neighborhoods.banksy_lambda_list
[ ] Default lambda_list = [0.2, 0.5, 0.8] — produces three sets of domain labels
[ ] BANKSY embedding uses obsm["spatial"] for neighbor graph construction
[ ] Spatial neighbor graph is constructed using pixel_size_um from sample metadata
[ ] Domain labels are integer-typed, stored as category dtype
[ ] adata.uns["banksy"]["lambda_{l}"]["n_domains"] records domain count per lambda
[ ] Injected spatial structure in fixture is recovered: ARI > 0.5 for lambda=0.5
[ ] `tests/unit/test_s09_banksy.py::test_banksy_produces_domains` passes
[ ] `tests/unit/test_s09_banksy.py::test_ari_on_fixture` passes
[ ] `tests/unit/test_s09_banksy.py::test_lambda_sweep_produces_multiple_labels` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s09_neighborhoods.py   (add BANKSY section)
  workflow/rules/s09_neighborhoods.smk
  tests/unit/test_s09_banksy.py

EXPORTS:
  run_banksy(ctx: RunContext, adata: AnnData,
             subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 3-C

---

## Task 4-D: s09 Spatial Neighborhoods — concordex Implementation

```
Status: pending
Assigned to: cursor-agent-4d
Estimated session length: short
```

**Inputs:**
- Read: `spatialpy/steps/s09_neighborhoods.py`
- Verify installed: `python -c "import concordex; print('ok')"` — if not, use pip

**Acceptance Criteria:**
```
[ ] `run_concordex(ctx, adata)` adds adata.obs["concordex_domain"] and
    adata.uns["concordex"]["score"] (float — concordex global score)
[ ] concordex uses spatial k-NN graph (k from config.neighborhoods.concordex.n_neighbors)
[ ] Concordex score is interpretable: documented in adata.uns["concordex"]["interpretation"]
[ ] `tests/unit/test_s09_concordex.py::test_concordex_produces_score` passes
[ ] `tests/unit/test_s09_concordex.py::test_concordex_domain_labels` passes
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s09_neighborhoods.py   (add concordex section)
  tests/unit/test_s09_concordex.py       (add concordex tests)

EXPORTS:
  run_concordex(ctx: RunContext, adata: AnnData,
                subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 4-C

---

## Task 4-E: s09 Spatial Neighborhoods — Milo-Style Differential Abundance

```
Status: pending
Assigned to: cursor-agent-4e
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s09_neighborhoods.py`, `spatialpy/steps/s08_deg.py`
- Verify installed: `python -c "import milopy; print('ok')"` — if not, use `pip install milopy`

**Acceptance Criteria:**
```
[ ] `run_milo(ctx, adata)` runs Milo-style neighborhood differential abundance
    between AD and CN conditions
[ ] Uses spatial kNN graph from obsm["spatial"] (not expression space)
[ ] Adds adata.uns["milo"]["results"] DataFrame with: neighborhood_id, logFC,
    FDR, n_cells, fraction_ad, fraction_cn
[ ] DA neighborhoods are mapped back to spatial coordinates and saved as figure
[ ] Enrichment for specific cell types in DA neighborhoods is tested and reported
[ ] `tests/unit/test_s09_milo.py::test_milo_produces_results` passes
[ ] `tests/unit/test_s09_milo.py::test_milo_da_regions` passes
    (injected AD-enriched region detected at FDR < 0.1)
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s09_neighborhoods.py   (add Milo section)
  tests/unit/test_s09_milo.py

EXPORTS:
  run_milo(ctx: RunContext, adata: AnnData,
           subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 4-C

---

## Task 4-F: s10 Ligand-Receptor Analysis (LIANA + Spatial Filtering)

```
Status: pending
Assigned to: cursor-agent-4f
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s09_neighborhoods.py`, `spatialpy/core/subset.py`
- Verify installed: `python -c "import liana; print(liana.__version__)"` (>=1.0)

**Acceptance Criteria:**
```
[ ] `run_ligand_receptor(ctx, adata, subset)` runs LIANA with OmniPath database
[ ] Results are spatially filtered: sender-receiver pairs only counted when cells
    are within config.ligand_receptor.max_contact_distance_um microns
[ ] Results written to adata.uns["liana_results"][subset.label] as DataFrame
[ ] Results contain: ligand, receptor, sender_type, receiver_type, score, padj,
    n_pairs_spatial, fraction_spatial
[ ] The injected ligand-receptor pair in the fixture is recovered in the top 20 hits
[ ] Network figure produced: chord diagram or dot plot of top 15 LR pairs
[ ] `tests/unit/test_s10.py::test_liana_spatial_filter` passes
[ ] `tests/unit/test_s10.py::test_injected_lr_recovered` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s10_ligand_receptor.py
  spatialpy/plotting/networks.py
  workflow/rules/s10_lr.smk
  tests/unit/test_s10.py

EXPORTS:
  run_ligand_receptor(ctx: RunContext, adata: AnnData,
                      subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 3-C

---

## Task 4-G: s11 Cell-Cell Hugging — Physical Contact Detection

```
Status: pending
Assigned to: cursor-agent-4g
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s10_ligand_receptor.py`, `spatialpy/io/mask_io.py`
- Grep: `grep -r "contact\|hugging\|boundary" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import skimage; print(skimage.__version__)"` (>=0.21)

**Acceptance Criteria:**
```
[ ] `detect_physical_contacts(cell_mask, nucleus_mask)` returns a contact graph
    (scipy sparse or networkx) where edge (i,j) means cells i and j share boundary pixels
[ ] Contact is defined by mask dilation + intersection, not by centroid distance
[ ] `run_hugging_cells(ctx, adata)` adds adata.uns["contact_graph"] and
    adata.obs["n_cell_contacts"] (int)
[ ] Outputs separate graphs for: cell-cell, nucleus-nucleus, and cell-nucleus contacts
[ ] Enriched contact pairs (e.g., Microglia-Astrocyte) are tested by permutation
    and written to adata.uns["contact_enrichment"]
[ ] `tests/unit/test_s11.py::test_contact_detection_from_mask` passes
    (manually crafted 10×10 mask with two touching cells → edge detected)
[ ] `tests/unit/test_s11.py::test_non_touching_cells_no_edge` passes
    (two cells separated by 1 pixel → no edge)
[ ] `tests/unit/test_s11.py::test_contact_enrichment` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s11_hugging_cells.py
  workflow/rules/s11_hugging.smk
  tests/unit/test_s11.py

EXPORTS:
  run_hugging_cells(ctx: RunContext, adata: AnnData,
                    subset: SubsetSpec | None = None) -> AnnData
  detect_physical_contacts(cell_mask: np.ndarray,
                            nucleus_mask: np.ndarray) -> sp.sparse.csr_matrix
```

**Do not:**
- Do not use centroid distance to infer contact — use mask boundaries only

**Dependencies:** Task 1-B (for mask data)

---

## Task 4-H: s12 Morphology — scikit-image Region Props, Texture, Shape Features

```
Status: pending
Assigned to: cursor-agent-4h
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/methods/morphology.py` (stub), `spatialpy/io/mask_io.py`,
        `spatialpy/config/schema.py` (MorphologyConfig)
- Verify installed: `python -c "import skimage.measure; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `extract_morphology_features(cell_mask, nucleus_mask, if_image)` returns a
    DataFrame with one row per cell_id containing all of:
    cell_area_um2, cell_perimeter_um, cell_eccentricity, cell_solidity,
    cell_extent, cell_major_axis_um, cell_minor_axis_um, cell_aspect_ratio,
    cell_circularity, nucleus_area_um2, nucleus_eccentricity,
    nucleus_to_cell_area_ratio, cytoplasmic_area_um2, boundary_roughness,
    if_mean_intensity, if_texture_contrast, if_texture_homogeneity
[ ] All lengths are in microns (converted from pixels using pixel_size_um)
[ ] `run_morphology(ctx, adata)` adds all features to adata.obs["morphology_*"] columns
[ ] adata.obsm["morph_pca"] contains the first 10 PCs of the morphology feature matrix
[ ] Morphology-expression correlation: for each morphology PC, the top 20 correlated
    genes (Spearman r) are written to adata.uns["morphology"]["gene_correlations"]
[ ] `tests/unit/test_s12_morphology.py::test_feature_extraction_shape` passes
[ ] `tests/unit/test_s12_morphology.py::test_units_in_microns` passes
    (circular cell of 10μm radius → area ≈ 314 μm²)
[ ] `tests/unit/test_s12_morphology.py::test_morphology_pca` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s12_morphology_transcript_topology.py   (morphology section)
  spatialpy/methods/morphology.py
  workflow/rules/s12_morphology_topology.smk
  tests/unit/test_s12_morphology.py

EXPORTS:
  extract_morphology_features(cell_mask, nucleus_mask, if_image,
                               pixel_size_um) -> pd.DataFrame
  run_morphology(ctx: RunContext, adata: AnnData,
                 subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 1-B, Task 3-C

---

## Task 4-I: s12 Subcellular Transcript Localization (Compartment Assignment)

```
Status: pending
Assigned to: cursor-agent-4i
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s12_morphology_transcript_topology.py`,
        `spatialpy/methods/transcript_localization.py` (stub),
        `spatialpy/io/transcript_io.py`
- Grep: `grep -r "transcript\|compartment\|nuclear\|cytoplasm\|perinuclear" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import skimage.morphology; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `assign_transcript_compartment(transcript_df, cell_mask, nucleus_mask)` returns
    transcript_df with added column "compartment" ∈ {nucleus, cytoplasm, perinuclear,
    membrane_proximal, extracellular}
[ ] Perinuclear shell = within 2μm outside nucleus boundary
[ ] Membrane-proximal shell = within 2μm inside cell boundary
[ ] Assignment uses distance transforms from skimage, not point-in-polygon
[ ] `compute_ncr(transcript_df, gene)` returns the nuclear-to-cytoplasmic ratio
    (NCR) per cell per gene: counts_nuclear / (counts_cytoplasmic + ε)
[ ] `run_transcript_localization(ctx, adata)` adds to adata.uns["transcripts"]:
    compartment assignments for each sample; and to adata.obs:
    "ncr_<gene>" for genes in config.morphology.localization_genes
[ ] Injected nuclear-enriched genes in fixture have NCR > 2.0 (AD cells)
[ ] `tests/unit/test_s12_localization.py::test_compartment_assignment` passes
    (nucleus pixel → "nucleus", centroid pixel → "cytoplasm")
[ ] `tests/unit/test_s12_localization.py::test_ncr_injected_signal` passes
[ ] `tests/unit/test_s12_localization.py::test_extracellular_transcripts` passes
    (transcripts outside cell mask → "extracellular")
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s12_morphology_transcript_topology.py (add localization section)
  spatialpy/methods/transcript_localization.py

CREATED:
  tests/unit/test_s12_localization.py

EXPORTS (from methods/transcript_localization.py):
  assign_transcript_compartment(transcript_df, cell_mask, nucleus_mask,
                                 pixel_size_um) -> pd.DataFrame
  compute_ncr(transcript_df, gene) -> pd.Series  (index: cell_id)
  compute_radial_shells(transcript_df, cell_mask, nucleus_mask,
                         shell_radii_um) -> pd.DataFrame
```

**Do not:**
- Do not use `shapely` for point-in-polygon — use numpy distance transforms (faster at seqFISH scale)
- Do not store the full transcript DataFrame with compartment labels in the h5ad (too large) — store only per-cell summary statistics in adata.obs

**Dependencies:** Task 4-H

---

## Task 4-J: s13 Spatial Density — LGCP Intensity, Ripley's K/L, Bivariate K

```
Status: pending
Assigned to: cursor-agent-4j
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s07_cell_states.py`, `spatialpy/config/schema.py` (SpatialDensityConfig)
- Grep: `grep -r "density\|ripley\|lgcp\|intensity" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import pointpats, scipy.spatial; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `run_spatial_density(ctx, adata, subset)` produces:
    - adata.uns["density_maps"][subset.label]["kde"] — 2D kernel density numpy array
    - adata.uns["density_maps"][subset.label]["ripleys_K"] — dict: r_values, K_obs,
      K_theoretical, K_perm_lower, K_perm_upper (99% envelope from 99 permutations)
    - adata.uns["density_maps"][subset.label]["ripleys_L"] — L(r) = sqrt(K(r)/π) - r
[ ] LGCP intensity surface estimated via INLA-approximated GP or GPflow
    (document which backend is used in uns["density_maps"]["method"])
[ ] Bivariate Ripley's K for two cell types is computed when two SubsetSpecs provided
[ ] All distance computations are in microns (not pixels)
[ ] Ripley's K at r=0 is 0 (identity check)
[ ] Clustering detected when K_obs > K_perm_upper for some r > 0
[ ] Figures produced: KDE heatmap overlay, Ripley's K envelope plot, L(r) plot
[ ] `tests/unit/test_s13.py::test_ripleys_k_random_points` passes
    (CSR point process → K_obs within permutation envelope for all r)
[ ] `tests/unit/test_s13.py::test_ripleys_k_clustered_points` passes
    (injected clustered process → K_obs > K_perm_upper for some r)
[ ] `tests/unit/test_s13.py::test_distance_in_microns` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s13_spatial_density.py
  workflow/rules/s13_density.smk
  tests/unit/test_s13.py

EXPORTS:
  run_spatial_density(ctx: RunContext, adata: AnnData,
                      subset: SubsetSpec | None = None) -> AnnData
  compute_ripleys_k(points, r_values, area, n_permutations) -> dict
  compute_bivariate_k(points_a, points_b, r_values, area) -> dict
```

**Do not:**
- Do not use `astropy` for Ripley's K — use pointpats or a custom implementation
- Do not run 999 permutations for unit tests — use `n_permutations=9` for speed

**Dependencies:** Task 3-C

---

## Task 4-K: s13 Hawkes Process — Self-Exciting Cell State Spread Model

```
Status: pending
Assigned to: cursor-agent-4k
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s13_spatial_density.py`, `spatialpy/steps/s07_cell_states.py`
- Grep: `grep -r "hawkes\|self_excit\|trigger" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import tick; print('ok')"` — if tick not available, implement MLE directly

**Acceptance Criteria:**
```
[ ] `fit_spatial_hawkes(points, cell_states, state_col)` fits a spatial Hawkes
    process model treating each DAM cell as an event at its spatial coordinates
[ ] Model produces: background_rate (μ), trigger_kernel (α×g(r)) parameters,
    goodness-of-fit statistic (log-likelihood)
[ ] trigger_kernel is parametric: exponential or Gaussian in space (configurable)
[ ] `run_hawkes(ctx, adata)` writes fitted parameters to
    adata.uns["hawkes"]["dam_spread"] and produces intensity map figure
[ ] Synthetic test: a spatially clustered point process produces α > 0 (triggering)
[ ] Synthetic test: a random point process produces α ≈ 0
[ ] Bootstrap confidence intervals for α are computed (n_bootstrap=200)
[ ] `tests/unit/test_s13_hawkes.py::test_hawkes_fit_clustered` passes (α > 0)
[ ] `tests/unit/test_s13_hawkes.py::test_hawkes_fit_random` passes (α near 0)
[ ] `tests/unit/test_s13_hawkes.py::test_bootstrap_ci_width` passes (CI not degenerate)
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s13_spatial_density.py   (add Hawkes section)
  tests/unit/test_s13_hawkes.py

EXPORTS:
  fit_spatial_hawkes(points: np.ndarray, t: np.ndarray,
                     kernel: str = "exponential") -> HawkesResult
  run_hawkes(ctx: RunContext, adata: AnnData,
             state_col: str = "cell_state",
             target_state: str = "DAM") -> AnnData
```

**Dependencies:** Task 4-J, Task 3-C

---

## Task 4-L: s14 IF Image Integration — Aβ Distance Maps + GFAP Overlap

```
Status: pending
Assigned to: cursor-agent-4l
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s01_load_data.py`, `spatialpy/io/image_alignment.py`
- Grep: `grep -r "abeta\|gfap\|if_image\|distance_map" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import skimage.morphology; import scipy.ndimage; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `compute_abeta_distance_map(abeta_tiff, cell_centroids, pixel_size_um)` returns
    a Series (index: cell_id) of Euclidean distance to nearest Aβ object in microns
[ ] Distance map uses binary thresholding of Aβ channel + scipy distance_transform_edt
[ ] `run_if_integration(ctx, adata)` adds to adata.obs:
    "abeta_dist_um" (float), "abeta_local_burden" (float, mean intensity in 50μm radius),
    "gfap_overlap_fraction" (float, fraction of cell area overlapping GFAP+ region),
    "if_intensity_<channel>" (float, mean IF intensity within cell mask) for each channel
[ ] Cells are binned into abeta distance categories in adata.obs["abeta_dist_bin"]:
    0-50μm, 50-100μm, 100-200μm, >200μm
[ ] Result is consistent: cells with abeta_dist_um=0 are in the 0-50μm bin
[ ] `tests/unit/test_s14.py::test_abeta_distance_map` passes
    (cell 10μm from plaque → abeta_dist_um ≈ 10.0 ± 1.0)
[ ] `tests/unit/test_s14.py::test_distance_bins` passes
[ ] `tests/unit/test_s14.py::test_no_if_images_graceful` passes
    (when no IF provided, all IF columns are NaN, no error raised)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s14_if_images.py
  workflow/rules/s14_if_images.smk
  tests/unit/test_s14.py

EXPORTS:
  run_if_integration(ctx: RunContext, adata: AnnData) -> AnnData
  compute_abeta_distance_map(abeta_arr, centroids, pixel_size_um) -> pd.Series
```

**Dependencies:** Task 1-B

---

## Task 4-M: s15 Module Scores (AUCell/UCell-Style)

```
Status: pending
Assigned to: cursor-agent-4m
Estimated session length: short
```

**Inputs:**
- Read: `spatialpy/steps/s07_cell_states.py`, `spatialpy/config/schema.py`
- Verify installed: `python -c "import decoupler; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `run_module_scores(ctx, adata, gene_sets)` adds adata.obs["module_score_<name>"]
    for each gene set in gene_sets
[ ] Scoring formula documented: mean of standardized expression of set genes minus
    mean of randomly sampled control genes (same size, matched by mean expression)
[ ] Hallmark and Reactome gene sets loaded from configured databases
[ ] Custom modules from config.module_scores.custom_modules also scored
[ ] Layer-restricted modules computed when subset.obs_filters includes "cortical_layer"
[ ] `tests/unit/test_s15.py::test_module_score_formula` passes
    (manually computed score for 3 genes matches function output)
[ ] `tests/unit/test_s15.py::test_custom_module` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s15_module_scores.py
  tests/unit/test_s15.py

EXPORTS:
  run_module_scores(ctx: RunContext, adata: AnnData,
                    gene_sets: dict[str, list[str]] | None = None,
                    subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 3-C

---

## Task 4-N: s16 Spatial Co-expression — Bivariate Moran's I + INSTANT

```
Status: pending
Assigned to: cursor-agent-4n
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s15_module_scores.py`, `spatialpy/steps/s09_neighborhoods.py`
- Grep: `grep -r "moran\|spatial_weight\|coexpression" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import esda, libpysal; print('ok')"` (pysal ecosystem)

**Acceptance Criteria:**
```
[ ] `compute_morans_i(adata, gene, weights)` returns: I, p_value, z_score
    (using permutation test, n=999)
[ ] `compute_bivariate_morans_i(adata, gene_x, gene_y, weights)` returns: I_xy, p_value
[ ] Spatial weights matrix computed from obsm["spatial"] using kNN (k configurable)
[ ] `run_spatial_coexpression(ctx, adata)` computes:
    - Global Moran's I for all genes in var → saved to adata.var["morans_i"]
    - Bivariate Moran's I for pairs in config.spatial_coexpression.gene_pairs
    - INSTANT statistics if configured
[ ] Top spatially autocorrelated genes are written to adata.uns["spatial_coexpression"]["top_svgs"]
[ ] `tests/unit/test_s16.py::test_morans_i_formula` passes (manually computed I matches)
[ ] `tests/unit/test_s16.py::test_bivariate_morans` passes
[ ] `tests/unit/test_s16.py::test_random_field_zero_i` passes (permuted expression → I ≈ 0)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s16_spatial_coexpression.py
  workflow/rules/s15_s16_modules_coexp.smk
  tests/unit/test_s16.py

EXPORTS:
  run_spatial_coexpression(ctx: RunContext, adata: AnnData,
                            subset: SubsetSpec | None = None) -> AnnData
  compute_morans_i(adata, gene, weights) -> MoranResult
  compute_bivariate_morans_i(adata, gene_x, gene_y, weights) -> MoranResult
```

**Dependencies:** Task 3-C, Task 4-M

---

## Task 4-O: s16 Spatially Variable Gene Detection — nnSVG + SPARK-X

```
Status: pending
Assigned to: cursor-agent-4o
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s16_spatial_coexpression.py`
- Verify installed: `python -c "import nnsvg; print('ok')"` — note: nnSVG is R-native; use Python wrapper or rpy2

**Acceptance Criteria:**
```
[ ] `run_nnsvg(ctx, adata, subset)` runs nnSVG (via rpy2 or a Python reimplementation)
    and writes results to adata.var["nnsvg_pval"], adata.var["nnsvg_padj"],
    adata.var["nnsvg_lr_stat"]
[ ] `run_sparkx(ctx, adata, subset)` runs SPARK-X and writes analogous columns
[ ] When both methods are run, a concordance report is written:
    adata.uns["svgs"]["concordance_jaccard"] (Jaccard index of top 100 SVGs)
[ ] Top 20 SVGs (by nnSVG LR statistic) are plotted as spatial expression maps
[ ] `tests/unit/test_s16_svg.py::test_nnsvg_produces_pvalues` passes
[ ] `tests/unit/test_s16_svg.py::test_injected_svg_recovered` passes
    (fixture has 5 genes with injected spatial gradient → all 5 in top 20)
```

**Output contract:**
```
MODIFIED:
  spatialpy/steps/s16_spatial_coexpression.py   (add SVG section)
  tests/unit/test_s16_svg.py

EXPORTS:
  run_nnsvg(ctx: RunContext, adata: AnnData,
            subset: SubsetSpec | None = None) -> AnnData
  run_sparkx(ctx: RunContext, adata: AnnData,
             subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 4-N

---

## Task 4-P: s17 K-Spaces / Spectral Analysis

```
Status: pending
Assigned to: cursor-agent-4p
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s16_spatial_coexpression.py`, `spatialpy/steps/s15_module_scores.py`
- Grep: `grep -r "kspace\|spectral\|fourier" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `run_kspaces(ctx, adata, subset)` computes spatial power spectra for:
    - per-cell-type abundance maps
    - module score spatial fields
    - pathology-proximity fields
[ ] Power spectrum is computed via 2D FFT on interpolated grid (grid size configurable)
[ ] Results written to adata.uns["kspaces"][subset.label] as dict of
    gene/module → (frequencies, power) arrays
[ ] Dominant spatial frequency identified and written as "dominant_wavelength_um"
[ ] `tests/unit/test_s17.py::test_kspace_known_frequency` passes
    (sinusoidal pattern of 100μm wavelength → dominant frequency at 1/100 μm⁻¹)
[ ] `tests/unit/test_s17.py::test_kspace_shape` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s17_kspaces.py
  workflow/rules/s17_kspaces.smk
  tests/unit/test_s17.py

EXPORTS:
  run_kspaces(ctx: RunContext, adata: AnnData,
              subset: SubsetSpec | None = None) -> AnnData
```

**Dependencies:** Task 4-N, Task 4-M

---

## Task 5-A: Bayesian NB Model for Low-Count Gene Expression Validation

```
Status: pending
Assigned to: cursor-agent-5a
Estimated session length: long
```

**Inputs:**
- Read: `spatialpy/steps/s08_deg.py`, `spatialpy/methods/uncertainty.py` (stub)
- Grep: `grep -r "bayesian\|pymc\|negbinomial\|hierarchical" spatialpy/ --include="*.py" -n`
- Verify installed: `python -c "import pymc; print(pymc.__version__)"` (>=5.0)

**Acceptance Criteria:**
```
[ ] `fit_hierarchical_nb(counts_ad, counts_cn, n_cells_ad, n_cells_cn)` fits
    a hierarchical Negative Binomial model:
      y_{ij} ~ NB(μ_{ij}, φ)
      log(μ_{ij}) = α_j + β_j × condition_i + u_i   (u_i: sample random effect)
    and returns: posterior_mean_beta, hdi_94_beta, posterior_samples
[ ] `run_bayesian_nb(ctx, adata, genes, subset)` applies this to all genes with
    median_counts < config.bayes.low_count_threshold (default: 10)
[ ] Results written to adata.uns["bayesian_nb"][subset.label] DataFrame
[ ] Posterior mean and 94% HDI written per gene
[ ] Genes where 94% HDI for β excludes 0 are flagged as "credibly_upregulated"
[ ] Model converges: R-hat < 1.01 for all parameters (verified per fit)
[ ] `tests/unit/test_s5a.py::test_bayesian_nb_credible_interval` passes
    (injected 5× upregulation detected with HDI excluding 0)
[ ] `tests/unit/test_s5a.py::test_rhat_convergence` passes
[ ] `tests/unit/test_s5a.py::test_no_spurious_signals` passes
    (null case: AD = CN → HDI includes 0 for all genes)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s21_bayesian_validation.py
  spatialpy/methods/uncertainty.py
  workflow/rules/s21_bayesian.smk
  tests/unit/test_s5a.py

EXPORTS:
  fit_hierarchical_nb(counts_ad, counts_cn, n_cells_ad, n_cells_cn,
                      n_draws: int = 2000, n_tune: int = 1000) -> BayesianNBResult
  run_bayesian_nb(ctx: RunContext, adata: AnnData,
                  genes: list[str] | None = None,
                  subset: SubsetSpec | None = None) -> AnnData
```

**Do not:**
- Do not use NUTS for unit tests (too slow) — use variational inference (ADVI) with a test flag
- Do not fit all genes simultaneously — run per-gene to keep memory bounded

**Dependencies:** Task 4-A

---

## Task 5-B: Probe Efficiency Estimation and FDR Curve Calibration

```
Status: pending
Assigned to: cursor-agent-5b
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s08_deg.py`, `spatialpy/config/schema.py` (ProbeEfficiencyConfig)
- Grep: `grep -r "probe_efficiency\|fdr\|z_slice" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `estimate_probe_efficiency(adata, reference_expr_df)` returns adata.var["probe_efficiency"]
    (float, 0–1) by comparing seqFISH counts to reference (Allen scRNA or CellxGene)
[ ] Z-slice correction applied: efficiency × (n_detected_z_slices / n_total_z_slices)
[ ] Cell volume correction applied using cell_area_um2 as proxy
[ ] Low-confidence probes flagged: adata.var["probe_low_confidence"] = True when
    probe_efficiency < config.probe_efficiency.min_efficiency_threshold
[ ] FDR calibration: compute empirical FDR by comparing to control probe distribution
[ ] `tests/unit/test_s5b.py::test_probe_efficiency_range` passes (all values in [0,1])
[ ] `tests/unit/test_s5b.py::test_z_slice_correction` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s18_probe_efficiency.py
  workflow/rules/s18_probe_efficiency.smk
  tests/unit/test_s5b.py

EXPORTS:
  estimate_probe_efficiency(adata: AnnData, reference_expr_df: pd.DataFrame,
                             ctx: RunContext) -> AnnData
  run_probe_efficiency(ctx: RunContext, adata: AnnData) -> AnnData
```

**Dependencies:** Task 1-B, Task 3-C

---

## Task 5-C: Cross-Sample Consistency Scoring Framework

```
Status: pending
Assigned to: cursor-agent-5c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s08_deg.py`, `spatialpy/steps/s09_neighborhoods.py`
- Grep: `grep -r "consistency\|pairwise\|cross_sample" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `compute_finding_consistency(finding_df, sample_metadata)` takes a per-sample
    effect size DataFrame (rows=samples, cols=findings) and returns:
    - consistency_matrix (n_findings × n_ad_cn_pairs) — sign of effect per pair
    - finding_score (n_findings,) — fraction of pairs where effect is in same direction
[ ] AD-CN pairs are constructed from config: each AD sample paired with each CN sample
[ ] `run_consistency_scoring(ctx, adata)` applies this to all major findings:
    DEG results, spatial neighborhood results, LR results
[ ] Results written to adata.uns["consistency"]["<finding_name>"]
[ ] A summary heatmap is produced: findings × sample_pairs, colored by effect direction
[ ] `tests/unit/test_s5c.py::test_consistency_perfect` passes
    (all pairs agree → score = 1.0)
[ ] `tests/unit/test_s5c.py::test_consistency_mixed` passes
    (half agree → score = 0.5)
[ ] `tests/unit/test_s5c.py::test_consistency_matrix_shape` passes
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s22_consistency.py
  tests/unit/test_s5c.py

EXPORTS:
  compute_finding_consistency(finding_df: pd.DataFrame,
                               sample_metadata: pd.DataFrame) -> ConsistencyResult
  run_consistency_scoring(ctx: RunContext, adata: AnnData) -> AnnData
```

**Dependencies:** Task 4-A, Task 4-E

---

## Task 5-D: CPS Scoring — AD Sample Ordering by Pseudoprogression Score

```
Status: pending
Assigned to: cursor-agent-5d
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s07_cell_states.py`, `spatialpy/steps/s15_module_scores.py`
- Grep: `grep -r "cps\|pseudoprogression\|sst\|pv\|depletion" spatialpy/ --include="*.py" -n`

**Acceptance Criteria:**
```
[ ] `compute_cps(adata, gene_panel)` computes a Continuous Pseudoprogression Score
    for each AD sample using:
    - SST depletion score (mean z-scored SST expression, negated)
    - PV depletion score (mean z-scored PVALB expression, negated)
    - Microglial DAM activation score (from adata.obsm["state_scores"])
    combined as a weighted sum (weights in config or learned from data)
[ ] CPS is computed at SAMPLE level (one value per sample_id)
[ ] Gene panel documented: SST, PVALB, VIP for inhibitory depletion;
    TREM2, TYROBP, CST7, LPL for DAM activation
[ ] CPS written to adata.uns["cps"]["sample_scores"] and adata.obs["cps_sample"]
    (same value for all cells in a sample)
[ ] CPS correlates with AD severity metadata if available; otherwise stored for
    downstream correlation
[ ] `tests/unit/test_s5d.py::test_cps_per_sample` passes
[ ] `tests/unit/test_s5d.py::test_cps_monotone_in_fixture` passes
    (fixture has CN < early_AD < late_AD in ground truth → CPS recovers order)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s23_cps.py
  tests/unit/test_s5d.py

EXPORTS:
  compute_cps(adata: AnnData, gene_panel: dict[str, list[str]],
              weights: dict[str, float] | None = None) -> pd.Series
  run_cps(ctx: RunContext, adata: AnnData) -> AnnData
```

**Dependencies:** Task 3-C, Task 4-M

---

## Task 6-A: s18 Probe Efficiency Full Module (integrates 5-B)

*Task 5-B implements core logic. This task adds Snakemake integration, reporting, and UI integration.*

```
Status: pending
Assigned to: cursor-agent-6a
Estimated session length: short
```

**Acceptance Criteria:**
```
[ ] Snakemake rule for s18 dry-runs without error
[ ] Probe efficiency figures produced: scatter (seqFISH vs reference), efficiency
    histogram by gene, low-confidence gene flags
[ ] Config UI section for probe_efficiency exposes all configurable parameters
[ ] `tests/integration/test_s18_pipeline.py::test_probe_efficiency_pipeline` passes
```

**Dependencies:** Task 5-B, Task 4-F

---

## Task 6-B: s19 External Integration (Allen scRNA + CONCORD)

```
Status: pending
Assigned to: cursor-agent-6b
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s06_clustering.py`, `spatialpy/config/schema.py`
- Verify installed: `python -c "import concord; print('ok')"` 

**Acceptance Criteria:**
```
[ ] `run_external_integration(ctx, adata, external_adata)` produces:
    adata.obsm["integrated_embedding"], adata.obs["label_transfer"],
    adata.obs["label_transfer_confidence"]
[ ] Batch mixing score (kBET or LISI) written to adata.uns["integration"]["batch_mixing"]
[ ] Biology conservation score (NMI of cell type labels) written to
    adata.uns["integration"]["biology_conservation"]
[ ] Label transfer confidence < 0.5 flagged in adata.obs["label_transfer_low_conf"]
[ ] `tests/unit/test_s19.py::test_integration_produces_embedding` passes
[ ] `tests/unit/test_s19.py::test_label_transfer_accuracy` passes
    (fixture: injected matching cell types → label transfer accuracy > 0.8)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s19_external_integration.py
  workflow/rules/s19_s20_integration_ml.smk
  tests/unit/test_s19.py

EXPORTS:
  run_external_integration(ctx: RunContext, adata: AnnData,
                            external_adata: AnnData) -> AnnData
```

**Dependencies:** Task 3-B

---

## Task 6-C: s20 ML Classifier with Uncertainty Quantification

```
Status: pending
Assigned to: cursor-agent-6c
Estimated session length: medium
```

**Inputs:**
- Read: `spatialpy/steps/s19_external_integration.py`, `spatialpy/methods/uncertainty.py`
- Verify installed: `python -c "import sklearn; print(sklearn.__version__)"` (>=1.4)

**Acceptance Criteria:**
```
[ ] `run_ml_classifier(ctx, adata, task)` trains classifiers for each task in
    config.ml_classifier.tasks (cell_type, condition, spatial_domain)
[ ] Uses sample-aware cross-validation (leave-one-sample-out)
[ ] Calibration: Platt scaling applied and calibration curve plotted
[ ] Feature importance: top 20 features per model written to
    adata.uns["classifier"][task]["feature_importance"]
[ ] Uncertainty: for logistic regression, outputs class probabilities;
    for RF, outputs prediction variance across trees
[ ] `tests/unit/test_s20.py::test_classifier_produces_predictions` passes
[ ] `tests/unit/test_s20.py::test_sample_aware_cv` passes
[ ] `tests/unit/test_s20.py::test_calibration_brier_score` passes
    (Brier score < 0.25 on fixture)
```

**Output contract:**
```
CREATED:
  spatialpy/steps/s20_ml_classifier.py
  tests/unit/test_s20.py

EXPORTS:
  run_ml_classifier(ctx: RunContext, adata: AnnData, task: str) -> AnnData
```

**Dependencies:** Task 3-C, Task 4-H, Task 5-D

---

## Task 7-A: Markdown Summary Generator + Jinja2 Templates

```
Status: pending
Assigned to: cursor-agent-7a
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] `generate_summary(ctx, adata)` produces `<output_dir>/reports/summary.md`
    with sections for each completed step and their key outputs
[ ] Jinja2 templates in `spatialpy/reporting/templates/` cover each step
[ ] Summary includes: total cells, retained cells, n clusters, top 5 DEGs per
    cell type, top 3 spatial findings, all figure paths with captions
[ ] `tests/unit/test_reporting.py::test_summary_renders` passes
[ ] `tests/unit/test_reporting.py::test_template_completeness` passes
    (all step templates exist)
```

**Output contract:**
```
CREATED:
  spatialpy/reporting/summary.py
  spatialpy/reporting/templates/   (Jinja2 .md.j2 templates per step)
  tests/unit/test_reporting.py

EXPORTS:
  generate_summary(ctx: RunContext, adata: AnnData) -> Path
```

**Dependencies:** Task 3-C or later (needs at minimum s07 outputs)

---

## Task 7-B: Biological Sanity Check Report

```
Status: pending
Assigned to: cursor-agent-7b
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] `run_sanity_checks(ctx, adata)` evaluates all checks and returns a
    SanityReport with passed, failed, and warning lists
[ ] Checks include (minimum):
    - known markers recover expected cell type clusters
    - cortical layer order matches y-coordinate rank (Spearman r > 0.5)
    - QC loss < 30% per cell type
    - clustering ARI > 0.4 vs marker-based labels
    - nuclear/cytoplasmic ratios within biological range
    - no step produced all-zero output columns
[ ] Failed checks are logged as warnings (not errors) unless critical=True
[ ] Report written to `<output_dir>/reports/sanity_check_report.md`
[ ] `tests/unit/test_sanity.py::test_sanity_checks_pass_on_fixture` passes
[ ] `tests/unit/test_sanity.py::test_sanity_checks_fail_on_malformed` passes
```

**Output contract:**
```
CREATED:
  spatialpy/reporting/sanity_checks.py
  tests/unit/test_sanity.py
```

**Dependencies:** Task 7-A

---

## Task 7-C: Parameter Selection Report

```
Status: pending
Assigned to: cursor-agent-7c
Estimated session length: short
```

**Acceptance Criteria:**
```
[ ] `generate_parameter_report(ctx)` produces a markdown document listing:
    every parameter, its configured value, the default, the recommended value,
    and a flag if it deviates from recommended by more than one standard unit
[ ] Report is generated at run start (before any steps) and saved as
    `<output_dir>/reports/parameter_selection_report.md`
[ ] `tests/unit/test_param_report.py::test_report_covers_all_parameters` passes
```

**Output contract:**
```
CREATED:
  spatialpy/reporting/parameter_report.py
  tests/unit/test_param_report.py
```

**Dependencies:** Task 0-C, Task 7-A

---

## Task 7-D: CLI + UI Launch Integration

```
Status: pending
Assigned to: cursor-agent-7d
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] `spatialpy run --config config.yaml` executes the Snakemake pipeline
[ ] `spatialpy config-ui` launches the Streamlit app at localhost:8501
[ ] `spatialpy validate --config config.yaml` runs s00 only and exits 0 on valid config
[ ] `spatialpy report --run-dir <path>` regenerates reports from an existing run
[ ] `spatialpy --version` prints the version string
[ ] CLI is implemented with Typer (not Click) — docstrings auto-generate help text
[ ] `tests/unit/test_cli.py::test_cli_invocation` passes (all subcommands)
[ ] `tests/unit/test_cli.py::test_version_flag` passes
```

**Output contract:**
```
CREATED:
  spatialpy/cli.py
  spatialpy/ui/app.py             (Streamlit app — full implementation)
  spatialpy/ui/widgets.py
  spatialpy/ui/sections.py
  tests/unit/test_cli.py
```

**Dependencies:** Task 0-A, Task 7-A, Task 0-B

---

## Task 8-A: Quarto Dashboard Scaffold

```
Status: pending
Assigned to: cursor-agent-8a
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] `spatialpy/website/builder.py::build_quarto_site(ctx, adata, output_dir)`
    generates a valid Quarto website directory structure
[ ] `quarto render <output_dir>` completes without error (tested in CI via `--execute`)
[ ] Landing page includes: run metadata, sample summary, figure gallery
[ ] All figures from completed steps appear in the gallery
[ ] `tests/unit/test_website.py::test_quarto_structure` passes
[ ] `tests/integration/test_quarto_build.py::test_quarto_render` passes
```

**Output contract:**
```
CREATED:
  spatialpy/website/builder.py
  spatialpy/website/templates/   (Quarto .qmd templates)
  tests/unit/test_website.py
  tests/integration/test_quarto_build.py
```

**Dependencies:** Task 7-A

---

## Task 8-B: Per-Step Report Pages

```
Status: pending
Assigned to: cursor-agent-8b
Estimated session length: short
```

**Acceptance Criteria:**
```
[ ] Each completed step has a corresponding .qmd page in the Quarto site
[ ] Each page includes: step description, parameters used, figures, key findings table
[ ] Pages are linked from the landing page navigation
[ ] `quarto render` still completes without error after adding per-step pages
```

**Dependencies:** Task 8-A, Task 7-A

---

## Task 8-C: Interactive Figures and Downloadable Artifacts

```
Status: pending
Assigned to: cursor-agent-8c
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] Plotly-based interactive spatial scatter available for s01 (cells colored by type)
[ ] Downloadable links for: h5ad checkpoint, DEG CSV, all SVG figures
[ ] Interactive figures render in browser without requiring Python server
[ ] `tests/integration/test_quarto_build.py::test_interactive_figures_render` passes
```

**Dependencies:** Task 8-B

---

## Task 9-A: Snakemake Full Workflow + SLURM Profile

```
Status: pending
Assigned to: cursor-agent-9a
Estimated session length: long
```

**Acceptance Criteria:**
```
[ ] `snakemake -n --configfile config.yaml` (dry-run) completes for all rules
[ ] Each rule has: input, output, benchmark, log, resources (mem_mb, runtime, cpus)
[ ] `snakemake --profile spatialpy/hpc/slurm_profile/ --configfile config.yaml -n`
    dry-runs without error
[ ] Resource estimator provides per-rule defaults based on n_cells and n_genes
[ ] `tests/workflow/test_snakemake_dry_run.py::test_dry_run_all_rules` passes
[ ] `tests/workflow/test_snakemake_dry_run.py::test_dry_run_slurm_profile` passes
```

**Output contract:**
```
CREATED/MODIFIED:
  workflow/Snakefile              (complete, all rules)
  workflow/rules/common.smk       (resource estimation logic)
  spatialpy/hpc/slurm_profile/config.yaml
  spatialpy/hpc/resource_estimator.py
  tests/workflow/test_snakemake_dry_run.py
```

**Dependencies:** All step tasks (0-A through 6-C)

---

## Task 9-B: GitHub Actions CI — Fast Checks (Lint, Unit Tests, Dry-Run)

```
Status: pending
Assigned to: cursor-agent-9b
Estimated session length: short
```

**Acceptance Criteria:**
```
[ ] `.github/workflows/ci.yml` runs on every push and PR
[ ] Jobs: ruff check, mypy --strict, pytest tests/unit/ --cov=spatialpy --cov-fail-under=80
[ ] Package install smoke test: `pip install -e ".[dev]"` in clean env
[ ] Snakemake dry-run on test config
[ ] Config schema validation for all preset YAMLs
[ ] Total CI wall time < 10 minutes on GitHub-hosted runner
[ ] CI passes on Python 3.11 and 3.12
[ ] `tests/unit/` must achieve ≥ 80% line coverage
```

**Dependencies:** Task 9-A

---

## Task 9-C: GitHub Actions Scheduled Validation — Integration Tests

```
Status: pending
Assigned to: cursor-agent-9c
Estimated session length: short
```

**Acceptance Criteria:**
```
[ ] `.github/workflows/scheduled-validation.yml` runs weekly on cron schedule
[ ] Runs full integration test suite on the fixture
[ ] Runs benchmark drift detection (compares runtime to stored baseline)
[ ] Sends failure notification (GitHub issue or email) if any integration test fails
[ ] Manual trigger available via workflow_dispatch
```

**Dependencies:** Task 9-B

---

## Task 9-D: Pre-commit Hooks, Security Scanning, Docs Deployment, Release

```
Status: pending
Assigned to: cursor-agent-9d
Estimated session length: medium
```

**Acceptance Criteria:**
```
[ ] `.pre-commit-config.yaml` includes: ruff, mypy, trailing-whitespace,
    end-of-file-fixer, check-yaml, detect-private-key
[ ] `.github/workflows/security.yml` runs bandit and pip-audit weekly
[ ] `.github/workflows/docs.yml` deploys mkdocs or Sphinx to GitHub Pages on main
[ ] `.github/workflows/release.yml` builds wheel + sdist and publishes to PyPI on tag
[ ] `.github/workflows/dependency-review.yml` reviews new dependencies on PR
[ ] `pre-commit run --all-files` exits 0 on a clean repo
```

**Dependencies:** Task 9-B

---

## Section 3: Dependency Graph (DAG)

```
# LINEAR BOOTSTRAP CHAIN
0-A → 0-B → 0-C
0-A → 0-D → 0-E
0-A → 0-F
0-B, 0-C, 0-D, 0-E, 0-F → 0-G

# DATA LOADING (needs full scaffold)
0-G → 1-A → 1-B → 1-C

# QC CHAIN
1-C → 2-A → 2-B → 2-C → 2-D

# CORE BIOLOGY CHAIN
2-D → 3-A → 3-B → 3-C

# PARALLEL SPATIAL ANALYSES (all need 3-C complete)
3-C → 4-A → 4-B
3-C → 4-C → 4-D → 4-E
3-C → 4-F
1-B → 4-G            # hugging needs mask data from s01
3-C → 4-H → 4-I
3-C → 4-J → 4-K
1-B → 4-L            # IF integration needs image data from s01
3-C → 4-M → 4-N → 4-O
4-M, 4-N → 4-P

# PROBABILISTIC MODELING (needs DEG output)
4-A → 5-A
1-B, 3-C → 5-B
4-A, 4-E → 5-C
3-C, 4-M → 5-D

# INTEGRATION AND ML
3-B → 6-B
3-C, 4-H, 5-D → 6-C
5-B, 4-F → 6-A

# REPORTING (needs core biology at minimum)
3-C → 7-A → 7-B → 7-C
0-A, 0-B, 7-A → 7-D

# WEBSITE (needs reporting)
7-A → 8-A → 8-B → 8-C

# INFRASTRUCTURE (needs all step tasks)
[0-A..6-C] → 9-A → 9-B → 9-C → 9-D

# ABETA DEPENDENCY NOTE:
# 4-B logically depends on 4-L (for abeta_dist_um),
# but can be implemented with stub data. Recommend:
# implement 4-L before 4-B in practice, even though 4-L
# has no formal dependency on 4-A.
4-L → 4-B  (soft dependency — abeta_dist_um column needed)
```

**Parallelizable sessions (can run concurrently after 3-C):**
```
GROUP A (no inter-dependency): 4-C, 4-F, 4-G, 4-H, 4-J, 4-L, 4-M
GROUP B (depends on GROUP A members): 4-D (needs 4-C), 4-I (needs 4-H),
         4-K (needs 4-J), 4-N (needs 4-M)
GROUP C: 4-A → {4-B, 5-A, 5-C}
```

---

## Section 4: Acceptance Criteria Templates

Use these templates to write acceptance criteria for any new task not listed above.

---

### Template: Snakemake Rule

```
[ ] Rule `rule_name` is defined in `workflow/rules/<step>.smk`
[ ] `input:` block lists all required input paths with descriptive variable names
[ ] `output:` block lists all required output paths
[ ] `benchmark:` block writes to `{output_dir}/benchmarks/{rule_name}.tsv`
[ ] `log:` block writes to `{output_dir}/logs/{rule_name}.log`
[ ] `resources:` block declares mem_mb, runtime (minutes), and cpus_per_task
[ ] `snakemake -n --configfile tests/fixtures/test_config.yaml` includes this rule
    and resolves without missing input errors (dry-run passes)
[ ] On failure: error message in log file identifies which input was problematic
[ ] Rule passes `snakemake --lint` without warnings
```

---

### Template: Plotting Function

```
[ ] Function signature: `plot_<name>(adata, ..., ctx: RunContext,
    subset: SubsetSpec | None = None) -> Path`
[ ] Returns Path to the primary figure file (SVG)
[ ] `FigureStyle.apply(fig, ax)` is called before savefig
[ ] Figure is saved as both `.svg` (primary) and `.png` (web) via
    `FigureStyle.save_with_caption(fig, path, caption)`
[ ] Caption file (`.txt`) is written alongside the figure
[ ] `plt.show()` is NEVER called — verified by grep in the function file
[ ] All spatial coordinate figures include a scale bar
[ ] All colorbar labels are human-readable (not column names like "module_score_0")
[ ] Figure renders without error on empty AnnData (no cells pass subset)
    → produces a figure with a "no data" annotation rather than raising
[ ] Figure DPI ≥ 300 (verified by opening SVG header)
[ ] Test: `test_plot_<name>_produces_file` — checks file exists and is non-empty
[ ] Test: `test_plot_<name>_empty_data` — checks graceful empty case
```

---

### Template: Statistical Method

```
[ ] Mathematical formula is documented in the function's NumPy docstring under
    "Mathematical Notes" — at minimum: the test statistic and null hypothesis
[ ] All assumptions are stated: distributional, independence, sample size minimum
[ ] p-values are returned (not just the statistic)
[ ] Multiple testing correction is applied (default: BH/FDR) and documented
[ ] Function returns a typed dataclass or namedtuple — not a raw dict
[ ] All distance or area computations are in biologically meaningful units (μm, μm²)
    with units documented in the return type
[ ] Permutation/simulation tests accept `n_permutations` parameter with default
    documented and rationale given
[ ] Test: `test_<method>_known_input` — hardcoded input with pre-computed expected output
[ ] Test: `test_<method>_null_case` — random input should produce p > 0.05 (or I ≈ 0)
[ ] Test: `test_<method>_edge_cases` — empty input, single point, all-identical values
```

---

### Template: Data Loader

```
[ ] Function signature: `load_<format>(path: Path, ...) -> <ReturnType>`
[ ] Path argument accepts `str | Path` (coerced to Path internally)
[ ] Raises `spatialpy.exceptions.ValidationError` (not FileNotFoundError) when
    file not found, with a message that includes the expected path
[ ] Raises `ValidationError` when required columns are missing, with a message
    listing all missing columns
[ ] Raises `ValidationError` when values are out of range (negative counts, etc.),
    with the offending row/column identified
[ ] Handles encoding: UTF-8 with BOM, Latin-1 — does not crash on unexpected encoding
[ ] Large files are loaded in chunks or with memory-mapped arrays when file > 1GB
[ ] Return type is fully typed and documented (exact columns, dtypes, units)
[ ] Test: `test_load_<format>_valid` — loads fixture file, checks shape and dtype
[ ] Test: `test_load_<format>_missing_file` — raises ValidationError
[ ] Test: `test_load_<format>_missing_column` — raises ValidationError
[ ] Test: `test_load_<format>_encoding` — loads Latin-1 encoded file without error
```

---

## Section 5: Key Engineering Decisions (Decision Log)

---

### Decision 1: AnnData (not SpatialData-only) as Primary Data Structure

**Decision:** Use `AnnData` (`.h5ad`) as the canonical in-memory and on-disk format, with optional `SpatialData` as a supplemental multimodal container for image-heavy operations.

**Rationale:**
- AnnData is the de facto standard for single-cell analysis in Python (Scanpy, scVI, decoupler, LIANA, milopy all expect it). Using a different format would require adapters at every integration point.
- AnnData's sparse matrix support (CSR/CSC) handles the high-sparsity seqFISH count matrix efficiently.
- `.h5ad` is a well-specified, versioned format with deterministic I/O — critical for reproducibility.
- SpatialData's image/shape-aware capabilities are valuable for IF image analysis (Task 4-L) but are not required for the 80% of steps that are cell-level operations. Using SpatialData as the primary container would add I/O complexity to every step.
- Hybrid approach: store large images as file paths or numpy arrays in `adata.uns["images"]`; fall back to lazy SpatialData loading only in `s14_if_images` and `s12_morphology`.

**Rejected alternative:** SpatialData-only — the ecosystem support (number of packages that accept SpatialData natively) remains limited as of 2024; every external tool call (pydeseq2, LIANA, milopy) would require extraction of AnnData from SpatialData, re-adding the complexity we sought to avoid.

---

### Decision 2: Snakemake (not Nextflow, not pure Python scripts)

**Decision:** Use Snakemake 8+ with a SLURM profile for HPC orchestration.

**Rationale:**
- Snakemake uses Python-native syntax, which minimizes the cognitive overhead for a lab that writes Python. Nextflow's Groovy DSL is a separate language to learn.
- Snakemake's rule-based dependency graph maps naturally to the step-by-step analysis structure of this package.
- Snakemake 8 introduced built-in support for cluster profiles, resource estimation, and container integration — these cover the HPC needs without requiring Nextflow's overhead.
- Snakemake dry-run (`-n`) is easy to integrate into CI (see Task 9-B), enabling config validation without executing any analysis.
- Pure Python scripts (no orchestrator) would lose: automatic re-run on input change, parallelization, cluster submission, and benchmark tracking.

**Rejected alternative:** Nextflow — stronger for cloud-native and cross-language pipelines, but significantly steeper learning curve and less natural for a Python-native computational biology team.

---

### Decision 3: Pydantic v2 for Config (not dataclasses, not attrs)

**Decision:** Use Pydantic v2 models for all configuration.

**Rationale:**
- Pydantic v2 provides: automatic type coercion, field-level validation, JSON schema generation (for the config UI), and serialization — all in one library with a well-maintained Python package.
- JSON schema generation (`model_json_schema()`) powers the Streamlit UI's widget rendering (Task 7-D) and the Snakemake schema validation — this is not available in plain dataclasses.
- Pydantic v2's `model_config = {"frozen": True}` makes configs immutable after construction, preventing accidental mutation during a run.
- `model_validate_json` and `model_dump` round-trip reliably, which is essential for reproducibility logging (Task 0-D).
- Pydantic v2 generates meaningful, field-identified error messages, which surface to users in the CLI and UI.

**Rejected alternative:** `dataclasses` + `jsonschema` — would require manual JSON schema authorship (error-prone and diverges from the actual model), no built-in validation, and no serialization.

**Rejected alternative:** `attrs` — lacks the JSON schema generation and is less familiar in the scientific Python community.

---

### Decision 4: Streamlit for UI (not Dash, not Panel)

**Decision:** Use Streamlit for the parameter-selection configuration UI.

**Rationale:**
- Streamlit maps naturally to the use case: a multi-section, stateful form with rich typed widgets. Adding a new parameter requires adding one `st.slider` or `st.selectbox` call — not registering a callback, defining an HTML template, or managing a server.
- Streamlit's session state handles multi-page config building (project setup → samples → QC → analysis → export).
- `st.json()` and `st.code()` make it easy to show the generated YAML before export.
- Streamlit apps can be shared via a URL (Streamlit Community Cloud) or launched locally — useful for a PhD student wanting to share parameterizations with their advisor.
- The Streamlit app does not replace the YAML+CLI interface — it generates a validated YAML file that the CLI ingests. This means the UI is strictly additive.

**Rejected alternative:** Dash — significantly more complex callback model; better suited to production multi-user dashboards than single-user config tools.

**Rejected alternative:** Panel — less mature ecosystem and smaller community.

---

### Decision 5: pydeseq2 for DEG (not rpy2 calling DESeq2)

**Decision:** Use `pydeseq2` (Python reimplementation of DESeq2) rather than calling R's DESeq2 via rpy2.

**Rationale:**
- `rpy2` introduces a hard R dependency that makes CI, containerization, and reproducibility significantly harder. R versions, Bioconductor versions, and R package compilation must all be managed.
- `pydeseq2` passes DESeq2's published numerical tests and produces results concordant with the R implementation on standard benchmarks. For the pseudobulk use case (aggregate counts per sample × cell type), the statistical model is identical.
- In a Python-native package, avoiding rpy2 means: no R installation required, faster CI, simpler Docker images, and no rpy2 version conflicts.
- `pydeseq2` supports the same variance-stabilizing transformation, size factor estimation, and Wald test as R DESeq2.

**Rejected alternative:** rpy2 → DESeq2 — retained as an optional fallback in `r_bridge/` for users who need exact R DESeq2 numerical compatibility. But it is not the default.

---

### Decision 6: nnSVG for Spatially Variable Genes (not SpatialDE, not SPARK)

**Decision:** Use `nnSVG` as the primary SVG detection method (with SPARK-X as the secondary comparison).

**Rationale:**
- nnSVG uses a nearest-neighbor Gaussian process model that scales to datasets with tens of thousands of cells — critical for multi-sample seqFISH (SpatialDE is O(n³) and impractical at this scale).
- nnSVG's likelihood ratio test is well-calibrated and produces proper p-values, unlike kernel-based methods that require empirical permutation for inference.
- SPARK-X is added as a second method specifically because it uses a non-parametric, covariance-based test that makes no distributional assumptions — a useful complement when the GP assumption is in question.
- SpatialDE is excluded as a primary method due to computational cost, but its conceptual framework (GP-based) informs the nnSVG choice.

**Rejected alternative:** SpatialDE — O(n³) covariance matrix, impractical for >5000 cells.

---

### Decision 7: muscat-Style Pseudobulk (not Mixed Model on Cells Directly)

**Decision:** Use pseudobulk aggregation (muscat-style: sum counts per sample × cell type) followed by sample-level DESeq2, rather than fitting a mixed model directly on single cells.

**Rationale:**
- Pseudobulk aggregation is the statistical gold standard for multi-sample scRNA-seq differential expression. It correctly treats samples as the unit of replication and avoids pseudoreplication (inflated n from treating each cell as independent).
- Mixed models on cells directly (e.g., MAST, lme4) have been shown in benchmarks (Squair et al. 2021, Nature Communications) to have highly inflated false positive rates in multi-sample designs when samples are the biological replicates.
- pydeseq2's NB GLM handles overdispersion correctly after pseudobulk aggregation.
- The muscat approach is computationally fast: summing counts per sample×type takes seconds; DESeq2 on ~4–8 pseudobulk samples per group is trivial.

**Rejected alternative:** cell-level mixed models — retained as a secondary method (`deg.method = "lme4"` option) for exploratory use, but not the default.

---

### Decision 8: PyMC/Stan for Bayesian Models (not Pyro, not NumPyro)

**Decision:** Use PyMC 5 for the hierarchical Negative Binomial model (Task 5-A) and any future Bayesian models in the package.

**Rationale:**
- PyMC 5 uses the JAX backend (via PyTensor) for fast NUTS sampling and has first-class support for hierarchical models with random effects — the exact structure needed for the sample-level NB model.
- PyMC's probabilistic programming API is the most readable in the Python ecosystem, which matters for a PhD student who needs to modify the model.
- PyMC's diagnostics (ArviZ integration) make it easy to check R-hat, ESS, and posterior predictive checks — all required by the acceptance criteria (Task 5-A).
- Stan would require a separate compilation step and a non-Python DSL; NumPyro requires JAX familiarity; Pyro (PyTorch-based) has heavier dependencies.

**Rejected alternative:** NumPyro — excellent for speed-critical models but steeper learning curve; reserved as an optional backend for users who need GPU-accelerated sampling.

**Rejected alternative:** Stan — best statistical rigor but requires rstan or cmdstanpy setup, adding the same dependency management burden as rpy2.

---

## Section 6: New Analyses to Add to the Plan

These six analyses are not in the original plan and directly address the central biological questions of this project.

---

### New Analysis 1: Spatial Disease Microenvironment Detection

**Biological question:** Do DAM microglia and reactive astrocytes co-occur in spatially restricted hotspots in AD tissue that are absent (or present at lower frequency) in CN? If so, what is the spatial extent of these hotspots and do they co-localize with Aβ plaques?

**Method:**
1. Compute bivariate LGCP density for DAM cells and reactive astrocyte cells simultaneously — estimate the joint intensity surface λ_DAM(s) × λ_Ast(s) using a shared spatial random effect.
2. Identify regions where both types exceed their respective 90th-percentile intensity: these are candidate disease microenvironment (DME) hotspots.
3. Compute the DME area fraction (fraction of tissue in a hotspot) per sample and compare AD vs CN using a linear mixed model.
4. Overlay DME hotspots with Aβ distance maps to test whether hotspots are centered on plaques (co-localization test: enrichment of hotspot pixels within 100 µm of Aβ signal).

**Expected output:**
- `adata.uns["dme"]["hotspot_mask"]` — binary numpy array (same resolution as IF image)
- `adata.uns["dme"]["hotspot_summary"]` — per-sample DataFrame: hotspot_area_um2, fraction_ad, fraction_cn, p_value (permutation)
- Figures: spatial map of DME hotspots overlaid on tissue, violin of hotspot area by condition, co-localization scatter (hotspot fraction vs plaque burden)
- A hotspot map figure for each sample, suitable for the publication

**Implementation task:** Task 4-J (LGCP infrastructure), Task 3-C (cell state labels), Task 4-L (Aβ maps). Add as a distinct function `run_disease_microenvironment(ctx, adata)` in `s13_spatial_density.py`.

---

### New Analysis 2: Within-Sample Plaque Proximity Analysis

**Biological question:** Does gene expression change systematically as a function of distance from Aβ plaques? If so, which cell types show the strongest gradient, and do expression gradients differ between AD samples with high vs low plaque burden?

**Method:**
1. Compute Aβ distance for all cells from IF images using `compute_abeta_distance_map()` (Task 4-L).
2. Bin cells into four radial distance shells: 0–50 µm, 50–100 µm, 100–200 µm, >200 µm.
3. For each cell type (using SubsetSpec), fit a spatial linear mixed effects model:
   \[ \text{expression}_{igb} = \beta_0 + \beta_{\text{bin}} \cdot \text{bin}_{ib} + u_s + \varepsilon_{igb} \]
   where u_s is a sample random effect, bin is a 4-level factor, using `statsmodels.MixedLM`.
4. Report genes with FDR-corrected p < 0.05 for the bin effect, and their expression gradient direction.

**Expected output:**
- `adata.uns["plaque_proximity"]["deg_by_bin"]` — DataFrame: gene, cell_type, bin_coeff_1_2, bin_coeff_1_3, bin_coeff_1_4, padj
- Figures: boxplot of top gene expression by distance bin and cell type; spatial expression map with distance contours
- A "plaque proximity heatmap": genes × distance bins, colored by log2FC from >200µm baseline

**Implementation task:** Add `run_plaque_proximity_analysis(ctx, adata, cell_types)` in `s14_if_images.py`. Requires Task 4-L complete and Task 4-A (for the LME fitting pattern).

---

### New Analysis 3: Pairwise AD-CN Consistency Scoring

**Biological question:** For every spatial or expression finding (DEG effect, spatial neighborhood enrichment, LR pair score), what fraction of all AD-CN sample pairings agree on the direction of the effect? This quantifies finding robustness without requiring all samples to pass a single joint test.

**Method:**
1. For each finding f and each AD-CN sample pair (i_AD, j_CN), compute the effect direction: sign(effect_f(i_AD) - effect_f(j_CN)).
2. Build a consistency matrix C ∈ {-1, 0, +1}^{n_findings × n_pairs}.
3. The finding-level consistency score is: CPS_f = |Σ_pairs C_{f,pair}| / n_pairs (fraction of pairs where direction is unanimous — 1.0 = perfectly consistent).
4. Visualize as a heatmap and report findings with CPS ≥ 0.75 as "consistent."

**Expected output:**
- `adata.uns["consistency"]["matrix"]` — numpy array, shape (n_findings × n_pairs)
- `adata.uns["consistency"]["scores"]` — Series indexed by finding name
- `adata.uns["consistency"]["summary_table"]` — DataFrame: finding, cps_score, n_pairs_agree, n_pairs_disagree
- Figures: heatmap of consistency matrix, bar plot of CPS scores per finding category

**Implementation task:** Task 5-C in this plan.

---

### New Analysis 4: Bayesian NB Model for Sparse Gene Activation

**Biological question:** For genes detected at ≤10 transcripts/cell in AD microglia (the "dark" transcriptome of seqFISH), can we distinguish real biological upregulation from Poisson background noise using a hierarchical Bayesian model that shares information across samples?

**Method:**
Use a hierarchical Negative Binomial model:
\[
y_{ij} \sim \text{NB}(\mu_{ij}, \phi_j)
\]
\[
\log(\mu_{ij}) = \alpha_j + \beta_j \cdot \text{condition}_i + u_i
\]

where:
- α_j: gene-level baseline expression
- β_j: condition effect (log fold change, AD vs CN)
- u_i ~ N(0, σ²): sample-level random effect
- φ_j: gene-level overdispersion parameter (shared prior: φ_j ~ Gamma(2, 0.5))

Priors: β_j ~ N(0, 1) (weakly regularizing, appropriate for low-count genes).

Inference: NUTS sampling (2000 draws, 1000 tuning) via PyMC 5. Convergence check: R-hat < 1.01 for all parameters.

**Expected output:**
- `adata.uns["bayesian_nb"][cell_type]` — DataFrame: gene, mean_beta, hdi_low_94, hdi_high_94, credibly_upregulated (bool), r_hat
- Genes where HDI excludes 0 flagged as credibly regulated
- Comparison with pydeseq2 results: Venn diagram of genes called by each method
- Posterior predictive check plot (replicated vs observed count distributions)

**Implementation task:** Task 5-A in this plan.

---

### New Analysis 5: CPS-Based AD Sample Ordering

**Biological question:** Can we order AD samples along a continuous pseudoprogression axis using seqFISH-derived features (inhibitory neuron depletion + microglial activation), and does this ordering correlate with external disease severity measures?

**Gene panel and scoring:**

| Component | Genes | Direction |
|-----------|-------|-----------|
| SST interneuron depletion | SST, CORT, NPY | negative (lower → more disease) |
| PV interneuron depletion | PVALB, CALB2 | negative |
| VIP interneuron depletion | VIP, CALB1 | negative |
| DAM microglial activation | TREM2, TYROBP, CST7, LPL, APOE | positive |
| Reactive astrocyte activation | GFAP, VIM, SERPINA3, C3 | positive |

**Method:**
1. For each sample, compute: mean z-scored expression of each gene panel aggregated across their respective cell types.
2. CPS = w₁ × (-SST_score) + w₂ × (-PV_score) + w₃ × (-VIP_score) + w₄ × DAM_score + w₅ × Ast_score.
3. Default weights: equal (w=0.2 each). Optional: learn weights from PCA of the 5 component scores.
4. Validate: CPS should be higher in AD than CN (Wilcoxon test across samples). Order AD samples by CPS for downstream stratification.

**Expected output:**
- `adata.uns["cps"]["sample_scores"]` — per-sample float
- `adata.obs["cps_sample"]` — same CPS value for all cells in a sample (for spatial visualization)
- Figures: per-sample CPS bar chart (AD + CN), spatial heatmap of DAM and SST scores, CPS vs plaque burden scatter (if neuropathology data available)
- Downstream use: stratify AD samples as "low CPS" vs "high CPS" for all spatial analyses

**Implementation task:** Task 5-D in this plan.

---

### New Analysis 6: Hawkes Self-Exciting Spread Model for DAM Activation

**Biological question:** Does microglial DAM activation spread spatially in a self-exciting manner (i.e., does proximity to an existing DAM cell increase the probability that a neighboring non-DAM microglial becomes DAM)? If so, what is the characteristic triggering range and amplitude?

**Biological motivation:** DAM activation is driven partly by TREM2 sensing of lipid debris from adjacent dying neurons and partly by paracrine signaling from adjacent DAM cells. This creates a spatially self-exciting process analogous to epidemic spread — a biologically motivated process model rather than just a spatial density description.

**Method:**
Model microglial DAM cells as a spatial Hawkes process:
\[
\lambda(s) = \mu + \sum_{s' \in \text{DAM cells}, s' \neq s} \alpha \cdot g(s - s')
\]

where:
- μ: background rate (spontaneous DAM activation density)
- α: triggering amplitude (self-exciting strength)
- g(r) = (2πσ²)⁻¹ exp(-r²/2σ²): isotropic Gaussian trigger kernel with spatial range σ

Parameters (μ, α, σ) estimated by maximum likelihood on spatial point pattern of DAM cells. CN sections used as spatial null (should produce α ≈ 0). Bootstrap (n=200) for confidence intervals on α.

**Expected output:**
- `adata.uns["hawkes"]["dam_spread"]` — dict: mu, alpha, sigma_um, log_likelihood, bic, alpha_ci_94 (tuple)
- Per-sample fits stored for cross-sample consistency (Task 5-C)
- Figures: observed DAM point pattern overlaid with estimated intensity surface; α vs CPS scatter across samples (do high-CPS samples show stronger self-excitation?)
- Biological interpretation: if α > 0 with CI excluding 0, this supports a paracrine/contact-dependent spreading model for DAM; if α ≈ 0, DAM is driven by cell-intrinsic factors or by plaque proximity (tested by including Aβ proximity as a covariate in the background rate μ(s))

**Implementation task:** Task 4-K in this plan.

---

*End of spatialpy Improved Cursor Coding Plan v2.0*
