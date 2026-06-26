/**
 * lib/reportExporter.ts
 * Print and PDF exporter tool for compiling search summaries, citations, and optional components.
 */

import type { SearchResult } from "./search";

function formatTitle(q: string): string {
  if (!q) return "";
  return q
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export interface ReportExportData {
  overview?: {
    intro: string;
    sections: Array<{ heading: string; points: string[] }>;
  };
  citations?: SearchResult[];
  symptoms?: {
    intro: string;
    conditions: Array<{
      name: string;
      likelihood: string;
      explanation: string;
      confidenceScore?: number;
      severityAssessment?: string;
      riskFactors?: string[];
    }>;
    urgencyLevel?: string;
    redFlags?: string[];
    recommendedTests?: string[];
    firstAid?: string[];
    prevention?: string[];
    relatedDiseases?: string[];
    warning?: string;
  };
  study?: {
    facts?: string[];
    flashcards?: Array<{ question: string; answer: string }>;
    mnemonics?: string[];
  };

}

export function exportMedicalReport(
  query: string,
  data: ReportExportData
): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download reports.");
    return;
  }

  const displayTitle = formatTitle(query);

  // Filter out trusted general search builders for a cleaner citation report,
  // showing mostly Wikipedia / PubMed nodes
  const citations = data.citations
    ? data.citations.filter((r) => r.category !== "trusted")
    : [];

  const sourcesText = data.citations
    ? Array.from(new Set(data.citations.map((r) => r.sourceLabel))).join(", ")
    : "AI Medical Database";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${displayTitle} - MedWay Research Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #334155;
            padding: 50px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          header {
            border-bottom: 2px solid #0d9488;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .title-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          h1 {
            color: #0f172a;
            margin: 0;
            font-size: 26px;
            font-weight: 800;
          }
          .brand {
            color: #0d9488;
            font-weight: 700;
          }
          .meta-info {
            font-size: 12px;
            color: #64748b;
            margin-top: 10px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
          }
          h2 {
            color: #0f172a;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 35px;
            margin-bottom: 12px;
            border-left: 3px solid #0d9488;
            padding-left: 10px;
            page-break-after: avoid;
          }
          .section-block {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            font-size: 14px;
            color: #334155;
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .overview-section-title {
            font-weight: 700;
            color: #1e293b;
            margin-top: 15px;
            margin-bottom: 5px;
          }
          .overview-points {
            margin: 0 0 15px 0;
            padding-left: 20px;
          }
          .citation-card {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f1f5f9;
            page-break-inside: avoid;
          }
          .citation-title {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
          }
          .citation-meta {
            font-size: 11px;
            color: #0d9488;
            margin-top: 2px;
          }
          .citation-desc {
            font-size: 13px;
            color: #475569;
            margin-top: 6px;
          }
          
          /* Symptom Check Table/Grid */
          .condition-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 10px 0;
            border-bottom: 1px dashed #e2e8f0;
            gap: 15px;
          }
          .condition-name {
            font-weight: 600;
            color: #0f172a;
          }
          .badge {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
          }
          .badge-high {
            background-color: #ffe4e6;
            color: #9f1239;
          }
          .badge-moderate {
            background-color: #fef3c7;
            color: #92400e;
          }
          .badge-low {
            background-color: #e0f2fe;
            color: #075985;
          }
          
          /* Flashcards & Study Guides */
          .study-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
          }
          @media (min-width: 600px) {
            .study-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
          .study-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .study-card-q {
            font-weight: 700;
            color: #0d9488;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          

          
          .warning-box {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            color: #92400e;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 15px;
          }

          footer {
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.5;
            page-break-inside: avoid;
          }
          @media print {
            body {
              padding: 20px;
              color: #000;
            }
            .section-block {
              background-color: #fff;
              border: none;
              padding: 0;
            }
            .study-card {
              border: 1px solid #ccc;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="title-group">
            <h1>${displayTitle}</h1>
            <span class="brand">MedWay AI</span>
          </div>
          <div class="meta-info">
            <div><strong>Report Topic:</strong> ${displayTitle}</div>
            <div><strong>Compiled Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Information Scope:</strong> Patient & Professional Reference</div>
            <div><strong>Data Sources:</strong> ${sourcesText}</div>
          </div>
        </header>

        <!-- 1. CLINICAL OVERVIEW -->
        ${
          data.overview
            ? `
          <h2>Clinical Overview</h2>
          <div class="section-block">
            <p>${data.overview.intro || "No summary provided."}</p>
            ${
              data.overview.sections && data.overview.sections.length > 0
                ? data.overview.sections
                    .map(
                      (sec) => `
                  <div class="overview-section-title">${sec.heading}</div>
                  <ul class="overview-points">
                    ${sec.points.map((p) => `<li>${p}</li>`).join("")}
                  </ul>
                `
                    )
                    .join("")
                : ""
            }
          </div>
        `
            : ""
        }

        <!-- 2. SYMPTOM checker / analysis -->
        ${
          data.symptoms
            ? `
          <h2>Symptom Triage & Analysis</h2>
          <div class="section-block">
            <p style="margin-bottom: 15px;">${data.symptoms.intro || "Diagnostic mapping for symptoms."}</p>
            
            ${
              data.symptoms.urgencyLevel
                ? `
              <div class="warning-box" style="margin-bottom: 20px; font-weight: 600; 
                ${
                  data.symptoms.urgencyLevel === "Red" 
                    ? "background-color: #fef2f2; border: 1px solid #fee2e2; color: #991b1b;" 
                    : data.symptoms.urgencyLevel === "Yellow" 
                      ? "background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e;" 
                      : "background-color: #f0fdf4; border: 1px solid #dcfce7; color: #166534;"
                }">
                Triage Priority: ${
                  data.symptoms.urgencyLevel === "Red" 
                    ? "EMERGENCY CARE ADVISED" 
                    : data.symptoms.urgencyLevel === "Yellow" 
                      ? "CLINICAL VISIT RECOMMENDED (WITHIN 24H)" 
                      : "SUPPORTIVE SELF-CARE & MONITORING"
                }
              </div>
            `
                : ""
            }

            <div style="margin-top: 10px;">
              ${
                data.symptoms.conditions && data.symptoms.conditions.length > 0
                  ? data.symptoms.conditions
                      .map((cond) => {
                        let badgeClass = "badge-low";
                        if (cond.likelihood === "High") badgeClass = "badge-high";
                        else if (cond.likelihood === "Moderate") badgeClass = "badge-moderate";

                        const confidenceText = cond.confidenceScore ? ` (Confidence: ${cond.confidenceScore}%)` : "";
                        const severityText = cond.severityAssessment ? ` [Triage: ${cond.severityAssessment}]` : "";

                        return `
                        <div class="condition-row">
                          <div>
                            <span class="condition-name">${cond.name}</span> <span style="font-size: 11px; color: #64748b;">${confidenceText}${severityText}</span>
                            <div style="font-size: 12px; color: #475569; margin-top: 2px;">${cond.explanation}</div>
                          </div>
                          <span class="badge ${badgeClass}">${cond.likelihood}</span>
                        </div>
                      `;
                      })
                      .join("")
                  : "<p>No matches analyzed.</p>"
              }
            </div>

            ${
              data.symptoms.recommendedTests && data.symptoms.recommendedTests.length > 0
                ? `
              <div style="margin-top: 20px;">
                <div class="overview-section-title">Recommended Diagnostic Tests</div>
                <ul class="overview-points">
                  ${data.symptoms.recommendedTests.map((t) => `<li>${t}</li>`).join("")}
                </ul>
              </div>
            `
                : ""
            }

            ${
              data.symptoms.firstAid && data.symptoms.firstAid.length > 0
                ? `
              <div style="margin-top: 15px;">
                <div class="overview-section-title">First Aid & Self-Care Guidance</div>
                <ul class="overview-points">
                  ${data.symptoms.firstAid.map((t) => `<li>${t}</li>`).join("")}
                </ul>
              </div>
            `
                : ""
            }

            ${
              data.symptoms.prevention && data.symptoms.prevention.length > 0
                ? `
              <div style="margin-top: 15px;">
                <div class="overview-section-title">Prevention Guidelines</div>
                <ul class="overview-points">
                  ${data.symptoms.prevention.map((t) => `<li>${t}</li>`).join("")}
                </ul>
              </div>
            `
                : ""
            }

            ${
              data.symptoms.warning
                ? `
              <div class="warning-box">
                <strong>Disclaimer Advisory:</strong> ${data.symptoms.warning}
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }

        <!-- 3. STUDY GUIDE / HUB -->
        ${
          data.study
            ? `
          <h2>Student Study Guide</h2>
          <div class="section-block">
            ${
              data.study.facts && data.study.facts.length > 0
                ? `
              <div class="overview-section-title">Key Facts & Diagnostics</div>
              <ul class="overview-points" style="margin-bottom: 20px;">
                ${data.study.facts.map((f) => `<li>${f}</li>`).join("")}
              </ul>
            `
                : ""
            }

            ${
              data.study.mnemonics && data.study.mnemonics.length > 0
                ? `
              <div class="overview-section-title">Study Mnemonics</div>
              <ul class="overview-points" style="margin-bottom: 20px;">
                ${data.study.mnemonics.map((m) => `<li>${m}</li>`).join("")}
              </ul>
            `
                : ""
            }

            ${
              data.study.flashcards && data.study.flashcards.length > 0
                ? `
              <div class="overview-section-title">Interactive Q&A Cards</div>
              <div class="study-grid">
                ${data.study.flashcards
                  .map(
                    (fc) => `
                  <div class="study-card">
                    <div class="study-card-q">Question</div>
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">${fc.question}</div>
                    <div class="study-card-q" style="color: #64748b;">Answer</div>
                    <div style="font-size: 13px; color: #475569;">${fc.answer}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }



        <!-- 5. CITATIONS -->
        ${
          citations.length > 0
            ? `
          <h2>Sources & Scientific Literature</h2>
          <div class="section-block">
            <div class="citations-section">
              ${citations
                .map(
                  (c, i) => `
                <div class="citation-card">
                  <div class="citation-title">[${i + 1}] ${c.title}</div>
                  <div class="citation-meta">Source: ${c.sourceLabel} | URL: ${c.url}</div>
                  <div class="citation-desc">${c.description}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <footer>
          MedWay clinical information dashboard documents are compiled automatically from public medical data networks. 
          This report is for educational purposes only and does not replace professional clinical consulting. Always consult a primary health practitioner.
        </footer>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
