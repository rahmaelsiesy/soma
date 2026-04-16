// ============================================================
// SAMPLE PREP PROTOCOL DATA
// Source: 241218-Rahma-brain-section-antibody-staining-protocol-KF.docx
//         Sample_Processing_for_RNA_Guide_ASY-053.02-2.pdf
// Rahma's seqFISH sample preparation — complete timeline
// ============================================================

const PROTOCOL_PHASES = [
  {
    id: "ab_day1",
    name: "Antibody Staining — Day 1",
    protocol_day: 1,
    can_stop: true,
    stop_note: "After 80% EtOH step: store at -80°C",
    steps: [
      { id:"sec_mount",    name:"Section & mount tissue (cryostat)",        hands_on_min:60, incubation_min:0,    note:"10-12 µm sections on SG coverslips, fresh frozen" },
      { id:"pfa_fix",      name:"4% PFA fixation",                          hands_on_min:5,  incubation_min:15,   note:"RT, slide container, 10 mL volume" },
      { id:"pbs_wash1",    name:"2x PBS wash",                              hands_on_min:5,  incubation_min:0,    note:"1 min each chamber" },
      { id:"etoh80",       name:"80% EtOH rinse + dry",                     hands_on_min:5,  incubation_min:0,    note:"STOP: store at -80°C possible after this" },
      { id:"etoh70_perm",  name:"70% EtOH permeabilization",                hands_on_min:5,  incubation_min:90,   note:"1–2 hr RT in slide container" },
      { id:"sds_perm",     name:"8% SDS permeabilization",                  hands_on_min:5,  incubation_min:30,   note:"30 min RT" },
      { id:"etoh_wash",    name:"3x 70% EtOH + 2x PBS wash",               hands_on_min:10, incubation_min:0,    note:"~1 min each" },
      { id:"block",        name:"Blocking buffer (1 hr RT)",                hands_on_min:10, incubation_min:60,   note:"SG 1x blocking buffer + 1:20 RNase inhibitor; parafilm setup" },
      { id:"neat_ab_setup",name:"Primary Ab (neat) setup",                  hands_on_min:20, incubation_min:0,    note:"50 µL ab mix in blocking buffer on parafilm" },
      { id:"neat_ab_ON",   name:"PRIMARY AB OVERNIGHT @ 4°C",               hands_on_min:0,  incubation_min:720,  note:"12+ hr, humidified chamber, 4°C — end of Day 1", is_overnight:true },
    ],
    hands_on_total_min: 125,
    total_day_duration_min: 635,
  },
  {
    id: "ab_day2",
    name: "Antibody Staining — Day 2",
    protocol_day: 2,
    can_stop: false,
    steps: [
      { id:"pbst_wash1",   name:"3x PBST wash (5 min each)",                hands_on_min:20, incubation_min:0,    note:"0.1% Triton" },
      { id:"sec_ab",       name:"Secondary Ab incubation (1–2 hr RT)",      hands_on_min:15, incubation_min:90,   note:"1:100 in blocking buffer, humidified chamber" },
      { id:"pbst_wash2",   name:"3x PBST wash (5 min each)",                hands_on_min:20, incubation_min:0,    note:"after secondary ab" },
      { id:"oligo_setup",  name:"Oligo-conjugated primary Ab setup",        hands_on_min:15, incubation_min:0,    note:"50 µL blocking buffer (or 2x for large volumes)" },
      { id:"oligo_ab_ON",  name:"OLIGO-CONJ AB OVERNIGHT @ 4°C",            hands_on_min:0,  incubation_min:720,  note:"12+ hr, 4°C — end of Day 2", is_overnight:true },
    ],
    hands_on_total_min: 70,
    total_day_duration_min: 830,
  },
  {
    id: "ab_day3_wash",
    name: "Antibody Staining — Day 3 (wash → RNA transition)",
    protocol_day: 3,
    can_stop: false,
    steps: [
      { id:"pbst_wash3",   name:"3x PBST wash (5 min each)",                hands_on_min:20, incubation_min:0,    note:"after oligo-conj ab" },
      { id:"pbs_wash2",    name:"2x PBS wash (5 min each)",                  hands_on_min:10, incubation_min:0,    note:"" },
    ],
    hands_on_total_min: 30,
    total_day_duration_min: 30,
  },
  {
    id: "rna_stab",
    name: "RNA Stabilization + Pre-Hydrogel Embedding",
    protocol_day: 3,
    can_stop: true,
    stop_note: "After Pre-Gel Solution: can store overnight at 37°C if needed",
    steps: [
      { id:"pre_stab",     name:"Pre-Stabilization Buffer (1 min)",         hands_on_min:5,  incubation_min:1,    note:"1 mL on coverslip" },
      { id:"stab_37c",     name:"Mixed Stabilization Buffer @ 37°C (2 hr)", hands_on_min:10, incubation_min:120,  note:"100 µL, parafilm cover, humidified chamber" },
      { id:"pbs_wash3",    name:"3x PBS rinse + Primary Wash Buffer",       hands_on_min:10, incubation_min:1,    note:"" },
      { id:"pre_gel",      name:"Pre-Gel Solution @ 37°C (30 min)",        hands_on_min:10, incubation_min:30,   note:"50 µL on parafilm, inverted coverslip. STOP possible." },
      { id:"rinse_buf1",   name:"3x Rinse Buffer I (last 5 min incubation)", hands_on_min:10, incubation_min:5,   note:"" },
    ],
    hands_on_total_min: 45,
    total_day_duration_min: 202,
  },
  {
    id: "hydrogel",
    name: "Hydrogel Embedding + Tissue Digestion",
    protocol_day: 3,
    can_stop: true,
    stop_note: "After flow cell assembly: store in Rinse Buffer I + RNase inhibitor at 4°C up to 1 week",
    parallelization_warning: "Gelation step is TIME-CRITICAL: gel trimming must complete in <10 min. Do NOT attempt two gelations simultaneously.",
    steps: [
      { id:"gelslick",     name:"Gel-Slick slide prep (5 min RT)",          hands_on_min:10, incubation_min:5,    note:"functionalize microscope slide, dry fully" },
      { id:"hydrogel_inc", name:"Hydrogel solution initial incubation",     hands_on_min:10, incubation_min:5,    note:"400 µL on parafilm, keep on ice throughout" },
      { id:"gelation",     name:"Gelation Mix prep + gelation (1.5 hr RT)", hands_on_min:20, incubation_min:90,   note:"CRITICAL: sandwich coverslip, then gel trimming <10 min, then flow cell assembly" },
      { id:"flowcell",     name:"Flow cell assembly + load Digestion Buffer",hands_on_min:15, incubation_min:0,   note:"assemble flow cell, 70 µL digestion buffer" },
      { id:"digestion_ON", name:"TISSUE DIGESTION @ 37°C (16–24 hr)",      hands_on_min:10, incubation_min:1200, note:"16–24 hr at 37°C, overnight — end of Day 3. STOP after.", is_overnight:true, compute_lead_hrs:20 },
    ],
    hands_on_total_min: 65,
    total_day_duration_min: 1345,
  },
  {
    id: "probe_hyb",
    name: "Primary Probe Hybridization",
    protocol_day: 4,
    can_stop: true,
    stop_note: "After digestion wash: store in Rinse Buffer I + RNase inhibitor at 4°C up to 1 week",
    steps: [
      { id:"dig_wash",     name:"Digestion Wash (2x 15 min RT)",            hands_on_min:10, incubation_min:30,   note:"70 µL Digestion Wash Buffer, 2 rounds. STOP possible after." },
      { id:"pre_hyb",      name:"Pre-Hyb Mix @ 37°C (30 min)",             hands_on_min:10, incubation_min:30,   note:"70 µL in humidified hybridization chamber" },
      { id:"probe_load",   name:"Denature + load seqFISH Primary Probes",   hands_on_min:15, incubation_min:0,    note:"90°C for 3 min, cool 1 min, load 70 µL" },
      { id:"probe_hyb_36", name:"PRIMARY PROBE HYB @ 37°C (36–72 hr)",     hands_on_min:0,  incubation_min:2160, note:"v1000 panel: 36 hr minimum, up to 72 hr. End Day 5–6.", is_overnight:true, compute_lead_hrs:36 },
    ],
    hands_on_total_min: 35,
    total_day_duration_min: 2265,
  },
  {
    id: "post_hyb",
    name: "Post-Hyb Wash + Probe Securing",
    protocol_day: 6,
    can_stop: true,
    stop_note: "After rinse: store in Rinse Buffer I + RNase inhibitor at 4°C up to 1 week",
    steps: [
      { id:"posthyb_wash", name:"Post-hyb wash (2 rounds, 30 min @ 37°C each)", hands_on_min:20, incubation_min:60, note:"3x Primary Wash Buffer per round, humidified chamber" },
      { id:"rinse_buf2",   name:"3x Rinse Buffer II",                       hands_on_min:10, incubation_min:0,    note:"STOP possible" },
      { id:"pre_secure",   name:"Pre-Securing Mix (30 min RT)",             hands_on_min:10, incubation_min:30,   note:"70 µL" },
      { id:"complete_sec", name:"Complete Securing Mix (3 hr RT)",          hands_on_min:15, incubation_min:180,  note:"68.25 µL Sol A + 6.75 µL Sol B" },
      { id:"sec_wash",     name:"Securing wash (2 rounds, 10 min RT each)", hands_on_min:15, incubation_min:20,   note:"Securing Wash Buffer" },
      { id:"rinse_ready",  name:"Rinse Buffer II → ready for SG Booster",   hands_on_min:5,  incubation_min:0,    note:"STOP possible: store in Rinse Buffer I + RNase inhibitor ≤1 week" },
    ],
    hands_on_total_min: 75,
    total_day_duration_min: 350,
  },
  {
    id: "sg_booster",
    name: "SG Booster Amplification",
    protocol_day: 7,
    can_stop: false,
    parallelization_warning: "Only ONE sample can run on a single SG Booster at a time. Stagger samples by 24 hrs or use two Booster units.",
    steps: [
      { id:"booster_load", name:"Load sample + reagents on SG Booster",     hands_on_min:30, incubation_min:0,    note:"follow SG Booster User Guide" },
      { id:"booster_run",  name:"SG BOOSTER RUN (24 hr)",                   hands_on_min:0,  incubation_min:1440, note:"24 hr instrument run — no hands-on. End Day 7.", is_instrument_run:true, compute_lead_hrs:24 },
      { id:"booster_off",  name:"Remove sample from Booster",               hands_on_min:15, incubation_min:0,    note:"sample ready for GenePS imaging" },
    ],
    hands_on_total_min: 45,
    total_day_duration_min: 1485,
  },
  {
    id: "imaging",
    name: "GenePS Automation Imaging",
    protocol_day: 8,
    can_stop: false,
    steps: [
      { id:"genePS_setup", name:"Set up seqFISH experiment on GenePS",      hands_on_min:60, incubation_min:0,    note:"configure flow cell, load sample (SG GenePS User Guide Section 4)" },
      { id:"imaging_run",  name:"AUTOMATION IMAGING RUN (~6–7 days)",       hands_on_min:0,  incubation_min:9360, note:"~6.5 days continuous imaging. Instrument runs autonomously.", is_instrument_run:true, compute_lead_hrs:156 },
      { id:"imaging_done", name:"Remove sample, verify image quality",       hands_on_min:30, incubation_min:0,    note:"check first few imaging cycles for quality" },
    ],
    hands_on_total_min: 90,
    total_day_duration_min: 9450,
  },
  {
    id: "data_transfer",
    name: "Data Transfer & Backup",
    protocol_day: 15,
    can_stop: false,
    parallelization_note: "HD copy and server copy CAN run in parallel if using separate storage devices.",
    steps: [
      { id:"copy_hd",      name:"Copy data to hard drive",                  hands_on_min:15, incubation_min:1800, note:"24–36 hr transfer. Initiate + verify start, check completion.", compute_lead_hrs:30 },
      { id:"copy_server",  name:"Copy data to Storinator backup server",    hands_on_min:15, incubation_min:1800, note:"24–36 hr transfer. Can parallelize with HD copy.", compute_lead_hrs:30 },
    ],
    hands_on_total_min: 30,
    total_day_duration_min: 1830,
  },
];

// ============================================================
// PARALLELIZATION RULES (2 samples same-day)
// ============================================================
const PARALLELIZATION_RULES = {
  // protocol_day → { can_parallelize, max_parallel_samples, hands_on_limit_min, warning }
  1: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 300, warning: "Stagger start times by 2–3 hr. Both samples can overnight @ 4°C." },
  2: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 300, warning: null },
  3: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 330, warning: "CAUTION: Gelation step is time-critical (<10 min). Never do two gelations simultaneously — stagger by 2 hr." },
  4: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 300, warning: null },
  6: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 300, warning: null },
  7: { can_parallelize: false, max_parallel: 1, hands_on_limit_min: 300, warning: "ONE SG Booster = ONE sample at a time. Use two Booster units or stagger 24 hr." },
  8: { can_parallelize: true,  max_parallel: 2, hands_on_limit_min: 300, warning: "Verify GenePS has capacity for 2 flow cell setups simultaneously." },
  15: { can_parallelize: true, max_parallel: 4, hands_on_limit_min: 300, warning: null },
};

// ============================================================
// CALENDAR TIMELINE (single sample)
// ============================================================
const PROTOCOL_CALENDAR = [
  { day: 0,     label: "Day 0",     event: "Cryosection",                   hands_on_min: 60,  blocking: false },
  { day: 1,     label: "Day 1",     event: "Ab staining start → overnight", hands_on_min: 125, blocking: false, overnight: "Primary Ab @ 4°C" },
  { day: 2,     label: "Day 2",     event: "Secondary Ab → overnight",      hands_on_min: 70,  blocking: false, overnight: "Oligo-conj Ab @ 4°C" },
  { day: 3,     label: "Day 3",     event: "Wash → RNA stab → Hydrogel → overnight digestion", hands_on_min: 140, blocking: false, overnight: "Tissue Digestion @ 37°C (16–24 hr)" },
  { day: 4,     label: "Day 4",     event: "Probe hyb start → 36–72 hr incubation", hands_on_min: 35, blocking: true, blocking_reason: "Probe hybridization — do not interrupt" },
  { day: 5,     label: "Day 5",     event: "(Probe hyb continuing)",        hands_on_min: 0,   blocking: true },
  { day: 6,     label: "Day 5–6",   event: "Post-hyb wash → Probe securing", hands_on_min: 75, blocking: false },
  { day: 7,     label: "Day 7",     event: "Load SG Booster → 24 hr run",  hands_on_min: 45,  blocking: true, blocking_reason: "SG Booster running" },
  { day: 8,     label: "Day 8",     event: "Set up GenePS → 6–7 day imaging", hands_on_min: 90, blocking: true, blocking_reason: "GenePS automation imaging" },
  { day: 15,    label: "Day 14–15", event: "Imaging done → data transfer", hands_on_min: 30,  blocking: false },
  { day: 16,    label: "Day 15–17", event: "Data fully backed up",         hands_on_min: 0,   blocking: false },
];

// Total calendar: ~15–17 days per sample
// Total hands-on: ~9.5 hr across all days (spread over ~8 active bench days)

// ============================================================
// LAB RESOURCES — shared instruments, booking required
// ============================================================
const LAB_RESOURCES = {
  sg_booster: {
    name: "SG Booster",
    total_units: 4,
    shared: true,
    booking_required: true,
    throughput_per_unit: 1,
    run_duration_hrs: 24,
    bottleneck: false,
    note: "4 units, shared with other lab users. Book in advance."
  },
  photobleacher: {
    name: "Photobleacher",
    total_units: 1,
    shared: true,
    booking_required: true,
    throughput_per_unit: 1,
    run_duration_hrs: 24,
    bottleneck: true,  // ← THE BOTTLENECK
    note: "1 unit only. Queue samples sequentially if running multiple. Each adds 24 hr."
  },
  genePS_scope: {
    name: "GenePS Automation Scope",
    total_units: 4,
    shared: true,
    booking_required: true,
    throughput_per_unit: 1,
    run_duration_hrs: 156,  // 6.5 days
    bottleneck: false,
    stability_window_hrs: 240,  // 10-day buffer after photobleaching
    note: "4 scopes, shared. Book far in advance — 6.5-day blocks are long."
  }
};

// ============================================================
// BACKWARD PLANNING — from GenePS booking date
// ============================================================
// Given: genePS_start_date (booked)
// Returns: object with all key milestone dates working backward
function calcProtocolBackwardPlan(genePS_start_date_str, sample_count=2) {
  const MS_PER_HR = 3600000;
  const anchor = new Date(genePS_start_date_str);

  const photobleach_end      = new Date(anchor);  // must be off photobleacher within 10 days
  const photobleach_start    = new Date(photobleach_end - 24 * MS_PER_HR);
  // If 2 samples: second sample photobleaches after first (+24hr)
  const photobleach_start_s2 = sample_count >= 2
    ? new Date(photobleach_start - 24 * MS_PER_HR)
    : null;

  const booster_end          = new Date(photobleach_start - 0);  // load photobleacher same day
  const booster_start        = new Date(booster_end - 24 * MS_PER_HR);

  const securing_end         = new Date(booster_start);
  const securing_start       = new Date(securing_end - 5 * MS_PER_HR);  // ~5hr total securing

  const probe_hyb_end        = new Date(securing_start);
  const probe_hyb_start      = new Date(probe_hyb_end - 36 * MS_PER_HR);  // v1000: 36hr min

  const digestion_wash_start = new Date(probe_hyb_start - 1 * MS_PER_HR);
  const digestion_end        = new Date(digestion_wash_start);
  const digestion_start      = new Date(digestion_end - 20 * MS_PER_HR);  // 16-24hr

  const hydrogel_end         = new Date(digestion_start);
  const rna_stab_start       = new Date(hydrogel_end - 4 * MS_PER_HR);  // RNA stab + hydrogel

  const ab_day3_end          = new Date(rna_stab_start);
  const ab_day2_start        = new Date(ab_day3_end - 14 * MS_PER_HR);  // overnight + day 2 work
  const ab_day1_start        = new Date(ab_day2_start - 14 * MS_PER_HR);

  const protocol_start       = new Date(ab_day1_start - 2 * 24 * MS_PER_HR);  // 2-day buffer
  const book_reminder        = new Date(protocol_start - 7 * 24 * MS_PER_HR);  // book 1 wk ahead
  const stability_window_end = new Date(photobleach_end.getTime() + 10 * 24 * MS_PER_HR);

  const fmt = d => d ? d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'}) : null;

  return {
    book_calendar_by:       fmt(book_reminder),
    protocol_start:         fmt(protocol_start),
    ab_day1_start:          fmt(ab_day1_start),
    ab_day2_start:          fmt(ab_day2_start),
    ab_day3_rna_transition: fmt(ab_day3_end),
    probe_hyb_start:        fmt(probe_hyb_start),
    probe_hyb_end:          fmt(probe_hyb_end),
    securing_start:         fmt(securing_start),
    booster_start:          fmt(booster_start),
    booster_end:            fmt(booster_end),
    photobleach_start_s1:   fmt(photobleach_start),
    photobleach_start_s2:   fmt(photobleach_start_s2),
    photobleach_end_latest: fmt(stability_window_end),
    genePS_setup:           fmt(anchor),
    imaging_run_end:        fmt(new Date(anchor.getTime() + 156 * MS_PER_HR)),
    data_transfer_start:    fmt(new Date(anchor.getTime() + 157 * MS_PER_HR)),
    data_fully_backed_up:   fmt(new Date(anchor.getTime() + (156+36) * MS_PER_HR)),
    stability_window_days:  10,
    bottleneck_warning: sample_count >= 2
      ? `⚠️ Photobleacher bottleneck: Sample 1 runs ${fmt(photobleach_start)}, Sample 2 must wait until ${fmt(new Date(photobleach_start.getTime() - 24*MS_PER_HR))}. Both stable at 4°C for up to 10 days.`
      : null,
  };
}
