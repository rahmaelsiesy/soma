# Should You Use Singularity? A Technical Recommendation for Rahma

**Prepared for:** Rahma, 5th-year PhD student, Caltech Bioengineering  
**Context:** seqFISH spatial transcriptomics analysis, Python package `txomics`, remote HPC cluster, Cursor SSH workflow  
**Date:** 2025

---

## Executive Summary

**Right now:** No — not yet. Your code is not in git, your dependency list is unstable, and containerizing a moving target creates more friction than it solves.

**In 3 months:** Yes, absolutely — when your Snakemake pipeline runs end-to-end, build the container.

**For the paper:** Mandatory. Any reviewer at *Nature Methods*, *Nature Neuroscience*, or *Cell Systems* will ask about computational reproducibility. A Singularity container with a published SHA256 and Zenodo DOI is the correct answer.

Read on for the reasoning.

---

## Section 1: What Singularity Is (and How It Differs from Docker)

### The Root Privilege Problem

Docker was built for cloud infrastructure where each virtual machine has a dedicated owner who controls it completely. At its core, the Docker daemon — the background process that creates and manages containers — runs as root. When you execute `docker run`, you are delegating root-level operations to that daemon on your behalf.

On a shared HPC cluster, this is a non-starter. A cluster is a multi-tenant environment: hundreds of users share compute nodes, a shared filesystem, and a scheduler (typically SLURM or PBS). If a user could run Docker, they could:

- Mount arbitrary host filesystem paths, including other users' directories
- Escalate privileges inside the container to root, then escape to the host
- Modify or delete system files
- Interfere with the scheduler's resource accounting, since Docker processes run through the daemon rather than as direct child processes of the job

HPC sysadmins are not being paranoid — they are enforcing the basic security model of a shared system. This is why you will find Docker blocked on virtually every academic HPC cluster in the world.

### How Singularity Solves This

Singularity (now Apptainer — see below) was designed from the ground up for the HPC multi-tenant model. Its core design principle: **you are the same user inside the container as outside it.** There is no daemon. There is no privilege escalation. When you run `singularity exec mycontainer.sif python script.py`, Singularity spawns that Python process directly as your user, with your UID, with your filesystem permissions. You cannot access anything inside the container that you couldn't access outside it.

This has a practical consequence worth noting: Singularity does not provide strong isolation between the container and the host. Your home directory is automatically mounted inside the container. Your environment variables are inherited. The host network is fully accessible. This is intentional — it is the "integration over isolation" philosophy that makes Singularity usable for HPC workflows rather than just secure sandboxes. For scientific computing, this is almost always the right trade-off.

The other key consequence: since Singularity processes run as child processes of the `sbatch` or `srun` job, SLURM's resource accounting works correctly. The scheduler can measure actual CPU, memory, and time usage. This is not possible with Docker.

### Singularity Image Format (SIF)

Singularity containers are distributed as `.sif` files — single, immutable, cryptographically verifiable image files. A `.sif` file is a read-only SquashFS filesystem image. You can:

- Copy it with `cp` like any file
- Verify its integrity with `sha256sum mycontainer.sif`
- Store it on any filesystem, including shared HPC scratch
- Pull it directly from Docker Hub

This single-file format is one of Singularity's most practically important features. There is no registry daemon, no image layer cache, no port binding — just a file you copy around.

### The Fundamental Promise

> "If it runs in my container, it runs on any HPC cluster that has Singularity."

This is not hyperbole. Because the `.sif` file contains the entire userspace — operating system libraries, Python interpreter, all packages — it is independent of what the HPC cluster has installed. Whether the cluster runs RHEL 7, RHEL 8, Ubuntu 22.04, or some institutional Frankenstein Linux, your container presents the same environment. The cluster kernel must be Linux (which it always is on HPC), but that is the only requirement.

### Singularity vs. Apptainer: The Naming Situation

The naming history is confusing but matters for practical reasons:

- **Singularity**: the original project, created by Greg Kurtzer around 2015 at Lawrence Berkeley National Laboratory
- **2021**: Kurtzer's company, Sylabs, forked the codebase into a commercial product and called their fork **SingularityCE** ("Community Edition")
- **Also 2021**: The open-source community voted to donate the original Singularity project to the **Linux Foundation**, which required renaming it to avoid trademark confusion with the Sylabs fork. The renamed project became **Apptainer**
- **Apptainer** is Singularity. The binary, the `.sif` format, the command syntax — essentially identical

When you type `singularity` on a modern cluster, you may actually be running Apptainer with a compatibility symlink. `apptainer --version` and `singularity --version` often refer to the same binary. For practical purposes in this document, "Singularity" and "Apptainer" are interchangeable. The commands are the same; only the binary name differs.

The distinction that matters: if your cluster has **SingularityCE** (the Sylabs commercial fork), it is still fully compatible with standard `.sif` files and the same commands. If it has **Apptainer** (the Linux Foundation version), same thing. If it was last updated before 2021, it has classic **Singularity**. All three read and run `.sif` files identically.

---

## Section 2: Your Specific Setup Assessment

### HPC Cluster: Singularity Is Almost Certainly Already There

Academic HPC systems have converged on Singularity/Apptainer as the standard container solution. Surveys of XSEDE/ACCESS-affiliated clusters, national labs, and university research computing centers consistently show adoption rates above 85–90%. Verify immediately:

```bash
singularity --version
# or
apptainer --version
```

If neither works, try:

```bash
module avail singularity
module avail apptainer
```

Most clusters load it as a module rather than installing it globally. If it truly isn't available, email your HPC support — it is a standard request and most sysadmin teams will install it within a week.

### Cursor SSH Remote: Perfect Compatibility

Your Cursor IDE connected via SSH does not interact with Singularity at all during the editing phase. Cursor edits files on the remote filesystem. Singularity runs programs against those files. These two concerns are orthogonal.

Your workflow will be:

1. Edit code in Cursor as you do now (files live on the HPC filesystem)
2. In the Cursor integrated terminal (which is an SSH shell on the HPC), run your Singularity commands
3. The container sees your edited files via bind mounts

There is no special Cursor plugin needed, no container-aware LSP configuration, no change to how you edit. The only difference is how you *execute* code: instead of `python script.py`, you run `singularity exec --bind $(pwd):/workspace mycontainer.sif python script.py`.

### Your Dependency Stack: Exactly the Kind That Needs a Container

The seqFISH analysis stack you are building is one of the most dependency-conflict-prone stacks in computational biology. Consider what you are likely importing:

| Package | Why It Causes Conflicts |
|---|---|
| `numpy` | Nearly every other package pins to a specific ABI; numpy 1.x vs 2.x broke many downstream packages |
| `h5py` | Requires HDF5 C library; version must match the system libhdf5 or a bundled one |
| `scanpy` / `anndata` | Rapid development; minor version bumps regularly break API |
| `PyMC` | Requires specific versions of `pytensor` (formerly `aesara`), which in turn requires numpy; major version migrations are notoriously painful |
| `PyTorch` | CUDA version must match the driver on the HPC node; even patch releases of PyTorch change CUDA compatibility |
| `CONCORD` | Research software; dependency pins are often loose or wrong; often only tested against the developer's exact environment |
| `Snakemake` | Has its own Python dependency tree that can conflict with analysis packages |

The combination of CONCORD + PyTorch + h5py is particularly hazardous. CONCORD may pin numpy to an older version. PyTorch's bundled CUDA runtime links against specific HDF5 builds. h5py may need to be compiled against the system libhdf5 or the HPC module version. A conda environment that works today may silently break when the HPC sysadmins update system libraries or when you run `conda update --all` six months from now.

A Singularity container freezes the exact state of every binary, shared library, and Python package at the moment you build it. This problem goes away permanently.

### Large Data Files: Seamless Bind Mounts

Your `dots.hdf5` and `genexcell_p2.hdf5` files are large and live on the HPC filesystem. You do not put data inside a container — that would be wasteful and would defeat the purpose. Instead, Singularity bind-mounts host paths into the container at runtime:

```bash
singularity exec \
  --bind /path/to/data:/data \
  --bind /path/to/txomics:/txomics \
  txomics_latest.sif \
  python /txomics/analysis/efficiency.py
```

Inside the container, `/data/dots.hdf5` is your actual file on the HPC filesystem. There is no copying, no overhead — it is a mount. Performance is identical to running outside the container. Your code accesses the files normally.

Home directory (`$HOME`) is bind-mounted automatically by default, so anything in your home directory is immediately accessible inside the container without explicit `--bind`.

---

## Section 3: When Singularity IS Worth It — Your Specific Use Cases

### 1. Reproducibility for Paper Publication

This is the most important reason and deserves the most direct treatment.

When you submit to *Nature Methods* or any high-tier computational biology journal, the Methods section will need to include enough information for an independent researcher to reproduce your results. "We used Python 3.11 with scanpy and PyMC" is not sufficient. "We used the software environment captured in Singularity container `sha256:a7f3c9d2...`, available at https://doi.org/10.5281/zenodo.XXXXXXX" is.

The SHA256 hash of a `.sif` file is a cryptographic fingerprint of the exact binary state of every library in your analysis. Combined with a Zenodo DOI (which makes it permanently citable and archived), you have:

- **Verifiability**: anyone can download the exact container and confirm it matches the hash
- **Permanence**: Zenodo guarantees 20-year archival, unlike a GitHub repository
- **Citability**: a DOI in your Methods section is a proper academic citation
- **Exactness**: not just "numpy 1.26.3" but the exact compiled binary with exact BLAS linkage

No other approach gives you this. `environment.yaml` gives you package names and versions but not compiled library state. It also cannot guarantee cross-platform reconstruction (a conda environment resolved on Linux produces different binaries than the same spec resolved on macOS, and may fail entirely on a different Linux distribution with different system libraries).

### 2. Snakemake Integration

Snakemake has first-class, native Singularity support. The `--use-singularity` flag tells Snakemake to run each rule inside the container specified in that rule's `container:` directive:

```python
# Snakefile
rule decode_barcodes:
    input: "data/dots.hdf5"
    output: "results/decoded.csv"
    container: "docker://txomics:latest"
    script:
        "scripts/decode.py"
```

Then execute:

```bash
snakemake --use-singularity \
  --singularity-args "--bind /path/to/data:/data" \
  --cores 16
```

Snakemake handles all container lifecycle management: it pulls the image if not present, caches it in `.snakemake/singularity/`, and wraps each rule's execution in the appropriate `singularity exec` call. You do not write any container invocation logic yourself.

You can also combine `--use-singularity` and `--use-conda`, which runs each rule's conda environment *inside* the container. This gives you a base OS layer (the container) with per-rule software isolation (conda environments inside it). This is the recommended pattern for complex pipelines where different rules need genuinely different software stacks.

Different rules can reference different containers:

```python
rule call_spots:
    container: "docker://txomics-detection:latest"
    ...

rule assign_genes:
    container: "docker://txomics-assignment:latest"
    ...
```

This means each stage of your pipeline can have its own frozen environment. For seqFISH analysis where spot detection (image processing, OpenCV, scikit-image) uses different libraries than gene expression analysis (scanpy, anndata, PyMC), this is exactly the right model.

### 3. Dependency Isolation as a One-Time Fix

The practical argument: you are going to spend debugging time on dependency conflicts regardless. The question is whether you spend that time repeatedly (fixing them every time something breaks) or once (building a container that never breaks again).

CONCORD is a particular concern. Research code published alongside papers is often only tested against the developer's exact environment. If CONCORD pins to numpy < 2.0 and your threshold sweep code wants numpy 2.0 for its memory layout improvements, you have a conflict. In a conda environment, this requires version pinning gymnastics that become brittle. In a container, you resolve it once at build time and it is frozen forever.

The container is not just "running your code in a box." It is an assertion: *this combination of software versions works together, and I have proven it by building and testing a container that captures that combination.*

### 4. Sharing `txomics` with Other Labs

When your package reaches a state where you want to share it — whether informally with a collaborator, as a GitHub release, or as the artifact accompanying a paper — a container is the only mechanism that guarantees it runs in their environment.

Consider what happens without a container: a collaborator clones your repository, runs `pip install -e .`, and immediately hits an error because their PyTorch version is different, or their system libhdf5 is older, or they are on a Mac and CONCORD doesn't compile cleanly. They send you an email. You spend an hour debugging their environment instead of doing science.

With a container: `singularity pull docker://yourname/txomics:v1.0` and it runs. Every time.

### 5. HPC Job Stability

HPC sysadmins update system libraries on a schedule that does not consult your analysis timeline. A common scenario: you are running a large threshold sweep over hundreds of parameter combinations, each submitted as a SLURM job. Midway through the run, the sysadmins update glibc, or the Intel MKL module, or libhdf5. Your jobs that haven't started yet now run in a subtly different environment than the ones that already finished. You cannot compare results across the run.

This has happened to researchers. It is not a theoretical risk.

A Singularity container eliminates this class of problem entirely. The container image bundles its own userspace libraries. The HPC kernel update is invisible to your container. Jobs submitted today and jobs submitted next month run in the same environment.

### 6. Threshold Sweep Bit-Reproducibility

Your `dots.hdf5` threshold sweep analysis — running the same spot-calling or decoding algorithm across a range of parameters — is specifically the kind of computation where floating-point reproducibility matters. When you report "at threshold τ = 0.73, we recover 94.2% of ground-truth transcripts," that number must be reproducible by you, by your committee, by reviewers, and by future researchers building on your work.

Floating-point results in numpy and h5py are sensitive to:

- Exact numpy version (different BLAS/LAPACK linkage can produce different floating-point round-off in matrix operations)
- HDF5 library version (different chunk compression implementations can produce different byte-order in reads)
- CPU architecture and microcode (AVX-512 vs AVX2 path selection in MKL affects rounding)

A conda environment guarantees you get the same *package version*, but on a different machine with a different CPU or a different system BLAS, you may get numerically different results. A container with bundled, compiled libraries — run on the same or similar CPU architecture — gets you much closer to bit-reproducibility. It is not perfect (hardware differences remain), but it is far better than "Python 3.11 and numpy ≥ 1.24."

---

## Section 4: When Singularity Is NOT Worth It

This section is as important as the previous one. Do not build a container until you are ready for it.

### 1. During Active Development (Your Current Phase)

Every time you change code in `txomics`, you do *not* need to rebuild the container — as long as you bind-mount the code directory. This is the correct mental model:

```bash
# The container provides the ENVIRONMENT (Python, packages, libraries)
# The code comes from the HOST via bind mount
singularity exec \
  --bind $(pwd)/txomics:/txomics \
  txomics.sif \
  python /txomics/analysis/efficiency.py
```

With this pattern, you edit code in Cursor, and the container immediately sees the new version — no rebuild needed. The container only needs to be rebuilt when you change *dependencies* (add a new package, upgrade a version).

However, during early development, your dependency list changes frequently. You add CONCORD, realize you need a specific version, add a new spatial analysis package, discover a version conflict, resolve it. Each of these changes requires a container rebuild, which takes 5–20 minutes. This overhead is real. It is manageable but not free.

The honest assessment: if you are still making significant changes to your `environment.yaml` more than once a week, containerizing now will frustrate you.

### 2. Exploratory Jupyter Notebooks

Interactive analysis — trying different clustering resolutions, visualizing spot detection outputs, exploring parameter sensitivity — is not a good fit for containerized execution. The iteration loop is:

1. Run cell
2. Look at plot
3. Change parameter
4. Repeat

For this, a conda environment in a Jupyter notebook running on the HPC (via JupyterHub or port-forwarded SSH) is faster and more natural. The Singularity overhead (startup time, bind mount setup) adds friction without benefit for this use case.

The recommendation: keep your exploratory notebooks in a conda environment. Put your finalized, parameterized analysis scripts — the ones that run in SLURM jobs — in the container. These are different concerns.

### 3. Very Early Stages (Specifically: Right Now)

Building a high-quality container requires knowing what goes into it. That means having a stable `environment.yaml`, knowing which packages are optional vs. required, and having tested the full pipeline end-to-end at least once. 

Right now, your code is not in git. This means you do not have a versioned dependency specification, you cannot tag releases, and you cannot trace which version of the code produced which results. Building a container on top of this is premature — the container would freeze a poorly-specified environment that you will want to change.

The prerequisite to containerization is a clean `environment.yaml` under version control. Do that first.

### 4. When Cluster Modules Are Sufficient

Many academic HPC clusters provide well-maintained module systems:

```bash
module load python/3.11.4
module load cuda/12.1
module load hdf5/1.14.0
```

If the module versions on your cluster happen to match what your analysis needs, and if you trust the sysadmins to maintain version stability, modules may be sufficient for ongoing work. They are not sufficient for publication (because "module load python/3.11.4" is not independently reproducible — the module content may change), but they are sufficient for day-to-day analysis.

Check what your cluster offers. If they have recent Python (3.10+), a compatible CUDA version for your GPU needs, and the HPC5 library your h5py needs to link against, you may be able to defer container work longer.

---

## Section 5: Recommended Workflow — Hybrid Approach

### Phase 1: Now Through ~3 Months — Conda for Development

Your immediate priorities, in order:

1. **Get code into git.** This is a prerequisite for everything else. Even a private GitHub repository with no CI/CD is infinitely better than code that exists only on the HPC server. The risk of losing months of work to an accidental `rm -rf` or a disk failure is real. Do this today.

2. **Write and maintain `environment.yaml`.** Export your current conda environment:
   ```bash
   conda env export > environment.yaml
   ```
   Commit this file. Update it every time you `conda install` or `pip install` something new. This is the foundation of your container build later.

3. **Use `conda env export --from-history` for the portable version.** The full `conda env export` includes platform-specific build strings (e.g., `numpy=1.26.3=py311h64a7726_0`) that may not resolve on other platforms. The `--from-history` flag exports only the packages you explicitly requested, which is more portable:
   ```bash
   conda env export --from-history > environment-minimal.yaml
   conda env export > environment-full.yaml
   ```
   Keep both. The minimal version documents intent; the full version documents the exact state.

4. **Stabilize the `txomics` API.** Public functions, data model (how you represent spots, cells, transcripts), and pipeline structure should reach a stable state before you containerize. Frequent API changes require container rebuilds.

### Phase 2: When Snakemake Pipeline Is Stable — Build the Container

When your end-to-end Snakemake pipeline runs successfully on real data (even on a small test dataset), that is the signal to containerize.

Build order:
1. Write a `Dockerfile` (build locally on your laptop or a VM with Docker installed)
2. Push to Docker Hub (or a private registry)
3. On the HPC: `singularity pull docker://yourname/txomics:v0.1`
4. Test: `singularity exec --bind /data:/data txomics_v0.1.sif snakemake --cores 4`
5. Run a full pipeline job through SLURM using the container

For ongoing development, continue using bind-mounted code with the container providing the environment:

```bash
singularity exec \
  --bind /hpc/data/rahma/seqfish:/data \
  --bind /home/rahma/txomics:/txomics \
  txomics_v0.1.sif \
  snakemake --cores 16 --snakefile /txomics/Snakefile
```

### Phase 3: Publication — Freeze and Archive

When you have final results ready for a paper:

1. **Tag the container:** `docker tag txomics:latest txomics:v1.0-paper`
2. **Push to Docker Hub**
3. **Build final SIF:** `singularity pull docker://yourname/txomics:v1.0-paper`
4. **Get SHA256:** `sha256sum txomics_v1.0_paper.sif` — record this
5. **Upload to Zenodo:** Deposit the `.sif` file (or a `.tar.gz` of it) at zenodo.org, which issues a permanent DOI
6. **In your Methods section:**
   ```
   All analyses were performed using the txomics software package 
   (v1.0, https://github.com/rahma/txomics) executed within a 
   Singularity container (SHA256: a7f3c9d2...; 
   https://doi.org/10.5281/zenodo.XXXXXXX).
   ```

This is the gold standard for computational reproducibility in methods papers.

### Recommended Directory Structure

```
txomics/
├── containers/
│   ├── Dockerfile              ← primary build spec (build locally with Docker)
│   ├── Singularity.def         ← alternative: build directly if you have root on a VM
│   └── environment.yaml        ← conda fallback / documentation of deps
├── txomics/                    ← Python package source
│   ├── __init__.py
│   ├── analysis/
│   │   ├── efficiency.py
│   │   └── thresholds.py
│   └── io/
│       └── hdf5.py
├── Snakefile                   ← rules reference container
├── config/
│   └── config.yaml
└── tests/
    └── test_efficiency.py
```

Example `Snakefile` with container integration:

```python
# Global container for all rules
container: "docker://yourname/txomics:v1.0"

rule decode_spots:
    input:
        dots = "data/dots.hdf5",
        codebook = "data/codebook.csv"
    output:
        "results/decoded_spots.csv"
    script:
        "scripts/decode.py"

rule assign_to_cells:
    input:
        spots = "results/decoded_spots.csv",
        cells = "data/genexcell_p2.hdf5"
    output:
        "results/cell_by_gene.h5ad"
    script:
        "scripts/assign_cells.py"
```

---

## Section 6: Practical Setup Guide for Your Exact Setup

### Step 1: Verify Singularity Availability

```bash
# Check if available directly
singularity --version
apptainer --version

# Or via module system
module avail singularity 2>&1 | grep -i singularity
module avail apptainer 2>&1 | grep -i apptainer

# If found via module:
module load singularity  # or: module load apptainer
singularity --version
```

### Step 2: Build the Container from Your Conda Environment

Option A — Build with Docker (recommended, most compatible with Docker Hub):

```bash
# On your laptop (where you have Docker installed):

# 1. Export your conda environment from the HPC
#    (or recreate it locally first)
conda env export > environment.yaml

# 2. Write a Dockerfile
cat > containers/Dockerfile << 'EOF'
FROM mambaorg/micromamba:1.5.8

COPY environment.yaml /tmp/environment.yaml

RUN micromamba install -y -n base -f /tmp/environment.yaml \
    && micromamba clean --all --yes

# Install txomics package itself
COPY . /txomics
WORKDIR /txomics
RUN pip install -e . --no-deps
EOF

# 3. Build the Docker image
docker build -f containers/Dockerfile -t yourname/txomics:latest .

# 4. Push to Docker Hub
docker push yourname/txomics:latest

# --- On the HPC: ---
# 5. Pull as SIF
singularity pull docker://yourname/txomics:latest
# Creates: txomics_latest.sif
```

Option B — Build directly from conda environment on HPC (if you have access to a node where you can run `singularity build` with `--fakeroot`):

```bash
# Check if fakeroot is available
singularity build --help | grep fakeroot

# Write Singularity definition file
cat > containers/Singularity.def << 'EOF'
Bootstrap: docker
From: mambaorg/micromamba:1.5.8

%files
    environment.yaml /tmp/environment.yaml

%post
    micromamba install -y -n base -f /tmp/environment.yaml
    micromamba clean --all --yes

%environment
    export PATH=/opt/conda/bin:$PATH
EOF

# Build (requires --fakeroot or root)
singularity build --fakeroot txomics.sif containers/Singularity.def
```

### Step 3: Test the Container

```bash
# Basic test: confirm Python and key packages import
singularity exec txomics_latest.sif python -c "
import numpy; print('numpy', numpy.__version__)
import scanpy; print('scanpy', scanpy.__version__)
import h5py; print('h5py', h5py.__version__)
import torch; print('torch', torch.__version__)
print('All imports OK')
"

# Test with data access
singularity exec \
  --bind /hpc/data/rahma/seqfish:/data \
  txomics_latest.sif \
  python -c "
import h5py
with h5py.File('/data/dots.hdf5', 'r') as f:
    print('dots.hdf5 keys:', list(f.keys()))
"

# Test your analysis script
singularity exec \
  --bind /hpc/data/rahma/seqfish:/data \
  --bind $(pwd):/txomics \
  txomics_latest.sif \
  python /txomics/txomics/analysis/efficiency.py
```

### Step 4: Interactive Development Session

For interactive work (equivalent to activating a conda environment):

```bash
# Drop into a shell inside the container
singularity shell \
  --bind /hpc/data/rahma/seqfish:/data \
  --bind $(pwd):/workspace \
  txomics_latest.sif

# Now you're inside the container
Singularity> python
>>> import scanpy as sc
>>> # Work normally
```

This is useful for debugging, prototyping, and verifying behavior. In Cursor, open the integrated terminal and run this command — you now have a shell that is inside the container, with your code changes immediately visible via the bind mount.

### Step 5: Snakemake Integration

```bash
# Run the full pipeline inside containers
snakemake \
  --use-singularity \
  --singularity-args "--bind /hpc/data/rahma/seqfish:/data" \
  --cores 16

# Or with SLURM:
snakemake \
  --use-singularity \
  --singularity-args "--bind /hpc/data/rahma/seqfish:/data" \
  --executor slurm \
  --jobs 50
```

### Step 6: SLURM Job Script with Singularity

```bash
#!/bin/bash
#SBATCH --job-name=txomics_threshold_sweep
#SBATCH --time=04:00:00
#SBATCH --mem=64G
#SBATCH --cpus-per-task=16
#SBATCH --gres=gpu:1

module load singularity

singularity exec \
  --nv \
  --bind /hpc/data/rahma/seqfish:/data \
  --bind /home/rahma/txomics:/txomics \
  /home/rahma/containers/txomics_latest.sif \
  python /txomics/txomics/analysis/threshold_sweep.py \
    --input /data/dots.hdf5 \
    --output /data/results/sweep_$(date +%Y%m%d).h5
```

The `--nv` flag passes NVIDIA GPU access into the container. This is one of Singularity's major advantages over Docker on HPC: GPU access is automatic with `--nv`, whereas Docker requires `--gpus` flags and a separate NVIDIA Container Toolkit installation that most HPC sysadmins will not set up.

### GPU and CUDA Notes

CUDA is a special case. The container should include your CUDA runtime and PyTorch build. The container does *not* need to include the NVIDIA driver — Singularity binds the host GPU driver into the container automatically with `--nv`. The constraint: the CUDA runtime version inside your container must be ≤ the driver version on the host. Driver version 525 (CUDA 12.0 capability) can run containers with CUDA 11.8 runtime, for example.

Check the host driver version:
```bash
nvidia-smi  # shows driver version and max CUDA version
```

Build your container with a matching or lower CUDA runtime.

---

## Section 7: Direct Answer — Should You Use Singularity?

### Right Now: No

Your code is not in git. Until it is, the question of containerization is premature. A container freezes a state of your codebase; if you have not even established version control, you have no meaningful state to freeze.

The immediate action items, in priority order:

1. **Initialize a git repository:** `cd ~/txomics && git init && git add . && git commit -m "initial commit"`
2. **Create a GitHub repository** (private is fine) and push to it
3. **Export your conda environment:** `conda env export > environment.yaml && git add environment.yaml && git commit -m "add environment"`
4. **Write a README** documenting what the package does and how to install it

These take less than an hour and create the foundation for everything that follows.

### In 3 Months: Yes, Absolutely

The trigger to build your container is: your Snakemake pipeline runs end-to-end on a test dataset. At that point:

- Your dependency list is stable enough to freeze
- You have a Snakefile to test the container against
- Container builds will produce fewer surprises because you understand what the pipeline needs
- You will immediately benefit from Snakemake's `--use-singularity` integration

Build the container the first time your full `dots.hdf5` → decoded transcripts → cell-by-gene matrix pipeline runs without manual intervention. That is the moment of stabilization worth capturing.

### For the Paper: Mandatory

No negotiation on this. Computational reproducibility is increasingly a requirement, not a recommendation, at top journals. Reviewers at *Nature Methods* specifically evaluate whether the computational methods can be independently reproduced. A sentence in your Methods section citing a Zenodo-archived container with a SHA256 hash is the correct and complete answer to this review criterion.

If you plan to publish in a venue that does not require this, build the container anyway — for your own benefit. When your committee asks you to re-run an analysis six months from now, or when a collaborator wants to apply your method to their data, you will want a container. The cost of not having one is paid in debugging time; the cost of building one is paid once.

### Docker vs. Singularity: Which One to Build With

The practical answer for your setup:

- **Build with Docker** (on your laptop or a VM where you have root)
- **Run with Singularity** (on the HPC)

This is the standard workflow. Docker's build tooling (`Dockerfile`, layer caching, multi-stage builds) is more mature and better documented than Singularity's definition file format. Building with Docker and converting to SIF via `singularity pull docker://` is reliable and produces high-quality images.

You do not need Docker on the HPC. You only need Docker on the machine where you build the container (your laptop, or a GitHub Actions CI runner if you want automated builds). The HPC only needs Singularity, which it almost certainly already has.

If you want to automate container builds, a simple GitHub Actions workflow can build and push your Docker image to Docker Hub on every tagged release:

```yaml
# .github/workflows/container.yml
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: yourname/txomics:${{ github.ref_name }}
```

Then on the HPC: `singularity pull docker://yourname/txomics:v1.0`

---

## Section 8: The Container as a Scientific Instrument

There is a philosophical argument for containers that matters independently of the practical workflow benefits. It is worth stating directly.

### The Measurement Is Inseparable from the Instrument

In wet lab science, reporting a result without specifying the instrument is not acceptable. "We measured fluorescence intensity" is not a complete Methods section. "We measured fluorescence intensity using a Leica SP8 confocal microscope with a 63× oil-immersion objective (NA 1.4), excitation at 488 nm, detection at 510–560 nm, with 3% laser power and 750 V detector gain" — that is a Methods section.

The same standard applies to computational science, but the field has been slow to enforce it. When you report "we detected 94.2% of ground-truth transcripts at a dot-calling threshold of 0.73," the number 94.2% was produced by a specific program, running on a specific version of numpy, linked against a specific BLAS implementation, parsing your HDF5 file with a specific version of h5py. These are not incidental details — they are part of the measurement.

Consider the specific ways in which your software versions affect your results:

**numpy:** Floating-point matrix operations are not universally deterministic across hardware and library versions. The dot product `A @ B` on a 10,000 × 1,000 matrix may produce subtly different results between numpy 1.24 (linked against OpenBLAS 0.3.21) and numpy 1.26 (linked against OpenBLAS 0.3.24) due to differences in parallel BLAS kernel implementations. These differences are typically at the 10⁻¹⁵ level — but thresholding operations (`spots[score > 0.73]`) can amplify them: a score of exactly 0.7300000000000001 vs 0.7299999999999999 determines whether a spot is included or excluded.

**h5py:** Different HDF5 library versions handle chunked dataset reads differently, particularly for datasets with filters. If `dots.hdf5` uses GZIP or LZF compression (as most image-derived HDF5 datasets do), the decompressed data must be identical across versions for results to be reproducible — and it is, between versions, but only if the library version is specified.

**LightGBM / CONCORD:** Tree-based models and neural networks with random seeds can produce different outputs across software versions even with identical seeds, due to changes in algorithm implementation, floating-point evaluation order, and parallelism handling.

**PyMC:** Markov chain Monte Carlo results are inherently stochastic, but a given seed + chain should produce the same trace. Differences in `pytensor` compilation, which changes between versions, can change the trace even with identical seeds.

### What This Means for Your Analysis

When a future graduate student in another lab reads your paper and attempts to reproduce your results — or when a reviewer requests it, or when your own future self re-runs the analysis after a cluster migration — they need to be able to reconstruct not just the algorithm but the exact computational environment in which the algorithm was executed.

`conda env export` is a step toward this goal. It records package names and versions. But it does not record:

- The exact compiled binary state of each package (which depends on build flags and compiler version)
- The system libraries they were linked against (glibc version, libstdc++ version, MKL version)
- The hardware-specific code paths selected at runtime (AVX-512 vs AVX2 vs SSE4)

A Singularity container captures all of the above that can be captured in software. The hardware layer remains variable — a different CPU may take different floating-point code paths — but this is an inherent limitation of the physical world, not a failure of containerization.

### The Standard You Should Hold Yourself To

The standard for a methods paper is: a researcher with your data, your container, and a CPU from the same generation as yours should be able to reproduce your headline numbers to within floating-point rounding error. This is achievable. It requires:

1. Your data, properly archived and accessible (Zenodo for datasets)
2. Your container, properly archived and accessible (Zenodo for the SIF file)
3. Your code, properly archived and accessible (GitHub + Zenodo release)
4. Your pipeline specification, properly documented (Snakefile + config)

The container is item 2. It is not optional.

### A Note on "Bit-Reproducibility" vs. "Scientific Reproducibility"

There is an important distinction. *Bit-reproducibility* — producing byte-identical output on any hardware — is likely unachievable in your analysis and is not what reviewers ask for. *Scientific reproducibility* — independently arriving at the same biological conclusions using the same methodology — is the standard, and it requires that the key quantitative results (efficiency percentages, cell type proportions, gene expression levels) match to within the precision that matters scientifically.

A Singularity container on the same or similar hardware achieves this. It does not achieve it on fundamentally different hardware (ARM vs x86, for example) — but reviewers do not have ARM HPC clusters. The practical audience is: another lab, on a Linux x86 HPC cluster, wanting to verify your numbers.

For that audience, your container is the scientific instrument. Provide it.

---

## Quick Reference

### Commands You Will Use Most

```bash
# Check availability
singularity --version

# Pull from Docker Hub
singularity pull docker://yourname/txomics:latest

# Run a script
singularity exec --bind /data:/data txomics_latest.sif python script.py

# Interactive shell
singularity shell --bind $(pwd):/workspace txomics_latest.sif

# With GPU
singularity exec --nv --bind /data:/data txomics_latest.sif python train.py

# Get container hash (for Methods section)
sha256sum txomics_latest.sif

# Snakemake with Singularity
snakemake --use-singularity --singularity-args "--bind /data:/data" --cores 16
```

### Decision Tree

```
Is your code in git?
  └─ No  →  Do that first. Container work is premature.
  └─ Yes →  Do you have a stable environment.yaml?
              └─ No  →  Stabilize dependencies first.
              └─ Yes →  Does your Snakemake pipeline run end-to-end?
                          └─ No  →  Get it running first.
                          └─ Yes →  Build the container now.
```

### Timeline Summary

| Phase | When | Action |
|---|---|---|
| Today | Now | `git init`, `conda env export`, push to GitHub |
| Week 1–2 | Now | Stabilize `txomics` API, write `environment.yaml` |
| ~Month 3 | Pipeline stable | Build Docker image, convert to SIF, test |
| ~Month 4 | First full analysis run | All SLURM jobs use container |
| Paper submission | Pre-submission | Freeze container, get SHA256, upload to Zenodo |
| Methods section | In paper | Cite container DOI and SHA256 |

---

## Section 9: Containers and Figure Reproducibility

One underappreciated use of Singularity for your specific project: it makes figures reproducible, not just numbers.

### Why Figure Libraries Are Version-Sensitive

Publication-quality figures are not version-agnostic outputs. They are rendered by software that changes:

- **matplotlib:** Font rendering, SVG path generation, DPI scaling, and colormap normalization all changed between 3.7 and 3.9. A figure generated with 3.7 may have subtly different axis label positioning, different SVG structure (relevant if you edit in Inkscape), and different default line widths than the same code run with 3.9. If a reviewer asks you to regenerate Figure 3 eighteen months from now after a conda update, you may get a figure that is noticeably different — not wrong scientifically, but visually inconsistent with the submitted version.
- **scikit-image:** Morphology operations used for DAPI nuclear segmentation (`binary_dilation`, `watershed`, `remove_small_objects`) changed behavior between minor versions. Different segmentation boundaries mean different cell assignments, which propagate into every downstream figure.
- **numpy:** Spatial coordinate calculations for seqFISH spot positions involve floating-point arithmetic. Different BLAS linkage can shift dot positions by sub-pixel amounts — irrelevant for biology, but detectable when comparing two versions of the same figure at 300 DPI.
- **h5py:** Structured array parsing from `dots.hdf5` info fields has version-specific behavior around dtype inference and string handling. A field that returns `np.bytes_` in one version may return `str` in another, breaking downstream sorting or filtering.

A reviewer who asks "can you reproduce Figure 3?" deserves a clean answer. With a Singularity container: *pull container `SHA256:abc123`, mount the data directory, run `snakemake figure_3`.* Without a container, the answer involves a paragraph of caveats about conda environment recreation, platform differences, and "the figure may look slightly different but the biology is the same."

That paragraph of caveats is the wrong answer for a methods paper.

### Dashboard Data Reproducibility

For the GitHub Pages analysis dashboard: the dashboard itself is static HTML that runs in any browser and has no reproducibility requirement. The **data that feeds it** — pre-computed JSON and CSV files — does.

Those files are computed by your Python analysis code. If they are generated outside a container, their contents depend on the environment at generation time. If they are committed to the repository without a record of how they were produced, a future collaborator cannot verify them or regenerate them after a data correction.

The correct pattern:

```python
# config/config.yaml
singularity_image: "docker://yourname/txomics:v1.0"
singularity_sha256: "a7f3c9d2e8b1..."  # pin exact version
```

```python
# Snakefile
rule generate_dashboard_data:
    input: "data/genexcell_p2.hdf5"
    output:
        efficiency = "dashboard/data/efficiency.json",
        cell_types = "dashboard/data/cell_types.csv"
    container: config["singularity_image"]
    script:
        "scripts/compute_dashboard_data.py"
```

The resulting JSON/CSV files are small (typically < 1 MB each) and should be committed to the repository. This gives you:

- **Traceability:** `git log dashboard/data/efficiency.json` shows exactly when the data changed and which commit regenerated it
- **Reproducibility:** the Snakemake rule documents how to regenerate the file, pinned to a specific container
- **Auditability:** if a number on the dashboard changes, git diff shows it immediately

The SHA256 pin in `config.yaml` is a deliberate check: if someone runs `snakemake --use-singularity` with a different container version, the config makes the intended container explicit. Combine this with a `snakemake --lint` check or a simple assertion at the top of the Snakefile:

```python
from subprocess import check_output
expected_sha = config["singularity_sha256"]
sif_path = "containers/txomics_latest.sif"
actual_sha = check_output(["sha256sum", sif_path]).decode().split()[0]
assert actual_sha == expected_sha, \
    f"Container mismatch: expected {expected_sha[:12]}..., got {actual_sha[:12]}..."
```

This assertion fails loudly if the wrong container is used — before any analysis runs.

---

*This document reflects the state of containerization tooling as of 2025–2026. Apptainer (formerly Singularity) is available at [apptainer.org](https://apptainer.org). Zenodo dataset archival is available at [zenodo.org](https://zenodo.org). Snakemake container documentation is at [snakemake.readthedocs.io](https://snakemake.readthedocs.io).*
