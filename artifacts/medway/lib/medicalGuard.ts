/**
 * medicalGuard.ts
 * Determines whether a search query is related to medicine, health,
 * biology, genetics, microbiology, or biochemistry.
 * Used to block clearly non-medical/non-science queries from MedWay.
 */

// ── Educational prompt prefixes to strip before topic detection ───────────────
// Queries like "teach me everything about genotypes" → topic is "genotypes"
const EDUCATIONAL_PREFIXES = [
  "teach me", "teach me everything about", "teach me about",
  "explain", "explain to me", "explain everything about", "explain what is",
  "tell me about", "tell me everything about", "tell me what is",
  "what is", "what are", "what causes", "what does",
  "how does", "how do", "how is", "how are",
  "why does", "why do", "why is",
  "give me information about", "give me info on",
  "i want to learn about", "i want to know about",
  "everything about", "all about", "learn about",
  "describe", "define", "what do i need to know about",
  "overview of", "introduction to", "basics of", "guide to",
  "summarise", "summarize", "summary of",
];

// ── Broad medical + biological science keyword allowlist ──────────────────────
const MEDICAL_KEYWORDS = [
  // ── General medicine ──────────────────────────────────────────────────────
  "disease", "disorder", "condition", "syndrome", "illness", "infection",
  "symptom", "symptoms", "diagnosis", "diagnose", "treatment", "therapy",
  "cure", "prognosis", "chronic", "acute", "congenital", "hereditary",
  "genetic", "autoimmune", "inflammatory", "degenerative", "clinical",
  "medical", "health", "healthcare", "healthy", "unhealthy", "surgical",
  "pharmaceutical", "biomedical", "pathology", "radiology", "toxicology",
  "epidemiology", "outbreak", "pandemic", "endemic", "quarantine",

  // ── Body systems & anatomy ────────────────────────────────────────────────
  "anatomy", "physiology", "body", "organ", "tissue", "cell", "gland",
  "heart", "cardiac", "cardiovascular", "lung", "pulmonary", "respiratory",
  "liver", "hepatic", "kidney", "renal", "brain", "neural", "neurological",
  "spine", "spinal", "bone", "skeletal", "muscle", "muscular", "skin",
  "derma", "dermatology", "eye", "ophthalm", "ear", "auditory", "stomach",
  "gastro", "intestine", "colon", "bowel", "blood", "hematology", "immune",
  "lymph", "endocrine", "hormone", "thyroid", "pancrea", "prostate",
  "uterus", "ovary", "cervical", "breast", "reproductive", "urinary",
  "artery", "vein", "capillary", "neuron", "synapse", "receptor",

  // ── Genetics & genomics ───────────────────────────────────────────────────
  "gene", "genes", "genetic", "genetics", "genome", "genomics",
  "genotype", "genotypes", "phenotype", "phenotypes",
  "allele", "alleles", "chromosome", "chromosomes",
  "dna", "rna", "mrna", "nucleotide", "nucleic acid",
  "mutation", "mutations", "variant", "variants",
  "heredity", "inheritance", "dominant", "recessive",
  "homozygous", "heterozygous", "zygote", "gamete",
  "meiosis", "mitosis", "cell division", "replication",
  "transcription", "translation", "codon", "protein synthesis",
  "gene expression", "epigenetics", "epigenetic",
  "dna methylation", "histone", "chromatin",
  "pcr", "crispr", "gene therapy", "genetic testing",
  "karyotype", "pedigree", "mendelian", "mendel",
  "sickle cell", "tay-sachs", "cystic fibrosis", "down syndrome",
  "turner syndrome", "klinefelter", "fragile x",
  "blood type", "blood group", "abo", "rhesus", "rh factor",

  // ── Biochemistry ──────────────────────────────────────────────────────────
  "biochemistry", "biochemical", "biomolecule",
  "protein", "proteins", "amino acid", "amino acids", "peptide",
  "enzyme", "enzymes", "substrate", "catalyst", "catalysis",
  "carbohydrate", "carbohydrates", "glucose", "glycogen", "starch",
  "lipid", "lipids", "fatty acid", "triglyceride", "phospholipid",
  "cholesterol", "lipoprotein", "hdl", "ldl",
  "atp", "adp", "energy metabolism", "cellular respiration",
  "glycolysis", "krebs cycle", "citric acid cycle",
  "oxidative phosphorylation", "photosynthesis",
  "hormone", "insulin", "glucagon", "cortisol", "adrenaline",
  "neurotransmitter", "serotonin", "dopamine", "acetylcholine",
  "acid-base", "ph", "buffer", "osmosis", "diffusion",
  "membrane", "cell membrane", "organelle", "mitochondria",
  "ribosome", "endoplasmic reticulum", "golgi",

  // ── Microbiology ──────────────────────────────────────────────────────────
  "microbiology", "microbiome", "microorganism",
  "bacteria", "bacterial", "bacterium", "bacillus", "coccus",
  "virus", "viral", "virion", "bacteriophage",
  "fungus", "fungi", "yeast", "mold", "mould",
  "parasite", "parasitic", "protozoa", "helminth",
  "pathogen", "pathogenic", "virulence", "toxin",
  "antibiotic", "antimicrobial", "antibiotic resistance",
  "culture", "colony", "gram stain", "gram positive", "gram negative",
  "agar", "petri", "fermentation", "sterilization",
  "prion", "spore", "biofilm", "quorum sensing",
  "microbial", "microbe", "microbes", "flora",

  // ── Immunology ───────────────────────────────────────────────────────────
  "immune", "immunity", "immunology", "immunological",
  "antibody", "antibodies", "antigen", "antigens",
  "lymphocyte", "b cell", "t cell", "macrophage", "neutrophil",
  "cytokine", "interleukin", "interferon", "complement",
  "vaccine", "vaccination", "immunization", "herd immunity",
  "allergy", "allergic", "anaphylaxis", "hypersensitivity",
  "autoimmune", "inflammation", "inflammatory",

  // ── Cell biology ──────────────────────────────────────────────────────────
  "cell biology", "cytology", "eukaryote", "prokaryote",
  "stem cell", "differentiation", "apoptosis", "necrosis",
  "cancer cell", "tumor", "oncology", "metastasis",
  "proliferation", "senescence", "telomere",

  // ── Pharmacology ─────────────────────────────────────────────────────────
  "pharmacology", "pharmacokinetics", "pharmacodynamics",
  "drug", "drugs", "medication", "medications", "medicine",
  "dose", "dosage", "prescription", "overdose",
  "side effect", "adverse effect", "contraindication", "interaction",
  "aspirin", "ibuprofen", "acetaminophen", "paracetamol",
  "antibiotic", "antiviral", "antifungal", "antiparasitic",
  "statin", "beta blocker", "anticoagulant", "blood thinner",
  "antidepressant", "antipsychotic", "analgesic", "painkiller",
  "opioid", "steroid", "corticosteroid", "probiotic",
  "supplement", "vitamin", "mineral",

  // ── Common conditions ─────────────────────────────────────────────────────
  "diabetes", "hypertension", "cancer", "carcinoma", "leukemia",
  "lymphoma", "asthma", "copd", "arthritis", "osteoporosis",
  "alzheimer", "parkinson", "epilepsy", "seizure", "stroke",
  "anemia", "hemophilia", "hiv", "aids", "hepatitis",
  "tuberculosis", "malaria", "covid", "influenza", "pneumonia",
  "sepsis", "meningitis", "appendicitis", "ulcer", "hernia",
  "cataract", "glaucoma", "psoriasis", "eczema", "lupus",
  "fibromyalgia", "endometriosis", "polycystic", "adhd",
  "autism", "schizophrenia", "bipolar", "depression", "anxiety",
  "ptsd", "ocd", "obesity", "atherosclerosis", "angina",

  // ── Mental health ─────────────────────────────────────────────────────────
  "mental health", "mental illness", "psychiatry", "psychology",
  "cognitive", "behavioral", "counseling", "dementia",
  "memory loss", "stress", "burnout", "insomnia", "sleep disorder",
  "substance abuse", "addiction", "withdrawal",

  // ── Nutrition & lifestyle ─────────────────────────────────────────────────
  "nutrition", "diet", "bmi", "calorie", "metabolism", "weight loss",
  "malnutrition", "dehydration", "intolerance", "gluten", "lactose",
  "physical therapy", "occupational therapy", "rehabilitation",

  // ── Reproductive & sexual health ──────────────────────────────────────────
  "pregnancy", "prenatal", "postnatal", "fertility", "contraception",
  "menstruation", "menopause", "erectile", "sexually transmitted",
  "std", "sti", "hpv", "syphilis", "gonorrhea", "chlamydia",

  // ── Emergency & trauma ────────────────────────────────────────────────────
  "fracture", "sprain", "dislocation", "concussion", "wound", "burn",
  "poisoning", "shock", "trauma", "injury", "bleeding",
  "hemorrhage", "clot", "thrombosis", "embolism",

  // ── Medical procedures & diagnostics ─────────────────────────────────────
  "x-ray", "mri", "ct scan", "ultrasound", "biopsy", "blood test",
  "ecg", "ekg", "colonoscopy", "endoscopy", "mammogram",
  "blood pressure", "pulse", "oxygen", "ventilator",
  "icu", "emergency", "first aid", "cpr", "surgery", "operation",
  "transplant", "dialysis", "chemotherapy", "radiation",

  // ── Healthcare professionals ──────────────────────────────────────────────
  "doctor", "physician", "surgeon", "specialist", "cardiologist",
  "neurologist", "oncologist", "dermatologist", "psychiatrist",
  "psychologist", "therapist", "nurse", "pharmacist", "dentist",
  "pediatrician", "obstetrician", "gynecologist", "hospital", "clinic",
  "pathologist", "radiologist", "epidemiologist",
];

// ── Clearly non-medical blocklist ─────────────────────────────────────────────
// Only block these when NO medical/bio keyword is present
const NON_MEDICAL_KEYWORDS = [
  "football", "soccer", "basketball", "cricket", "names", "tennis", "golf",
  "baseball", "hockey", "rugby", "olympics",
  "movie", "film", "cinema", "netflix", "actor", "actress", "celebrity",
  "music", "song", "album", "band", "concert",
  "politics", "election", "president", "government", "parliament",
  "stock market", "crypto", "bitcoin", "forex",
  "weather forecast", "geography",
  "cooking recipe", "restaurant menu", "hotel booking",
  "video game", "gaming console", "esports",
];

/**
 * Strips common educational prefixes from a query so the core topic
 * can be evaluated. E.g. "teach me everything about genotypes" → "genotypes"
 */
function stripEducationalPrefix(q: string): string {
  // Sort by length descending so longer prefixes match first
  const sorted = [...EDUCATIONAL_PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (q.startsWith(prefix + " ")) {
      return q.slice(prefix.length).trim();
    }
    if (q === prefix) return "";
  }
  return q;
}

/**
 * Returns true if the query is related to medicine, health, biology,
 * genetics, microbiology, biochemistry, or related life sciences.
 * Returns false only for clearly non-medical/non-scientific topics.
 */
export function isMedicalQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;

  // Strip educational prefixes to get the core topic
  const topic = stripEducationalPrefix(q);

  // If after stripping the prefix the topic is empty, it was a bare
  // educational instruction — allow it (user will be guided by AI)
  if (!topic) return true;

  // Check the CORE TOPIC against medical keywords
  for (const kw of MEDICAL_KEYWORDS) {
    if (topic.includes(kw)) return true;
  }

  // Also check the FULL original query (in case the keyword appears in prefix context)
  for (const kw of MEDICAL_KEYWORDS) {
    if (q.includes(kw)) return true;
  }

  // Check blocklist — only block if NO medical keyword overrides
  for (const blocked of NON_MEDICAL_KEYWORDS) {
    if (q.includes(blocked)) {
      
      return false;
    }
  }

  // Short queries (≤ 5 chars) that matched nothing are ambiguous — allow them
  // e.g. "flu", "hiv", "acl", "ibs", "mrsa"
  if (q.length <= 5) return true;

  // Single-word or two-word unknown queries — be lenient; the AI will handle it
  const wordCount = q.split(/\s+/).length;
  if (wordCount <= 2) return true;

  // Longer unrecognised queries are blocked
  return false;
}
