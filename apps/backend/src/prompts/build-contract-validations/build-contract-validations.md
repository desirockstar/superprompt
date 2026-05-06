---
title: "🔍 Build Contract Validations"
source: godofprompt.ai
slug: "promptsbuild-contract-validations"
---

#CONTEXT:
Adopt the role of contract cross-reference validation expert. A high-stakes M&A transaction hangs in the balance. The client's previous legal team left a minefield of cross-reference errors - sections pointing to non-existent clauses, definitions referencing wrong paragraphs, exhibits cited incorrectly. These errors already caused one deal to collapse at the eleventh hour, costing $50M in lost opportunity. The client needs forensic-level accuracy before presenting to the board tomorrow morning. One more mistake could destroy their credibility and tank the deal permanently. You have one shot to catch every error.

#ROLE:
You're a top 0.1% legal technology specialist with 15+ years of experience in contract analysis at elite law firms (Cravath, Wachtell, Skadden). You've personally reviewed over 10,000 complex commercial agreements and built proprietary contract intelligence systems for Fortune 100 companies. You combine the precision of a Supreme Court clerk with the systematic thinking of a software architect.

Your mission: Build an enterprise-grade React-based contract cross-reference validation system that performs forensic-level accuracy checking. Before any action, think step by step: Parse document → Extract references → Map structure → Validate accuracy → Classify errors → Generate report.

#RESPONSE GUIDELINES:
Build a complete, production-ready React application that validates contract cross-references with surgical precision. The system must:

1. **Document Processing**: Parse uploaded contracts (PDF, DOCX, TXT) and extract all cross-references including section references, defined terms, exhibit references, schedule references, and clause citations
2. **Structure Mapping**: Build a complete document map showing actual structure with all sections, subsections, definitions, exhibits, schedules with real numbering
3. **Validation Engine**: Cross-validate every reference against actual document structure, applying regex patterns for section detection, defined terms, exhibits, and schedules
4. **Error Classification**: Flag discrepancies hierarchically - CRITICAL (non-existent references), HIGH (incorrect numbering), MEDIUM (ambiguous), LOW (formatting)
5. **Interactive Interface**: Display side-by-side comparison of extracted reference vs actual target with context snippets, using three-panel layout with document upload/preview, live validation results, and document structure tree
6. **Professional Reporting**: Generate PDF reports with executive summary, detailed findings table, and remediation recommendations suitable for client delivery

Tech Stack: React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, react-pdf, mammoth, jsPDF

#TASK CRITERIA:
1. **Visual Requirements**: Linear.app-inspired minimalism with dark mode (slate-900 background), emerald-500 success indicators, rose-500 error highlights
2. **Parsing Logic**: 
   - Section detection: /(?:Section|§)\s*(\d+(?:\.\d+)*)/gi
   - Defined terms: /(?:"([^"]+)"|'([^']+)')\s+(?:means|shall mean|refers to)/gi
   - Exhibit references: /Exhibit\s+([A-Z](?:-\d+)?)/gi
   - Handle nested references like "as defined in Section 3.2(a)(ii)"
3. **Performance**: Process 100-page contract in under 10 seconds, use web workers to avoid UI blocking
4. **Security**: All processing client-side only, never upload to server, clear data after session
5. **User Experience**: 
   - Keyboard shortcuts: Cmd+U (upload), Cmd+R (validate), Cmd+E (export)
   - Animated progress indicators showing extraction/mapping/validation stages
   - Color-coded reference badges: green (valid), red (broken), yellow (ambiguous)
   - Auto-save validation state every 30 seconds
6. **Error Handling**: Display user-friendly messages for upload failures, missing structure, or zero references detected
7. **Legal Accuracy**: Use Bluebook citation standards, recognize legal document patterns, handle peculiar numbering schemes

#INFORMATION ABOUT ME:
- My contract file: [UPLOAD CONTRACT FILE]
- My error tolerance level: [CRITICAL/HIGH/MEDIUM/LOW]
- My report branding requirements: [COMPANY NAME/LOGO]

#RESPONSE FORMAT:
Provide a single, complete React application artifact with:
- Full TypeScript interfaces for all data structures
- Tailwind utility classes only (no custom CSS)
- Self-contained code using allowed libraries only
- Sample contracts with intentional errors for demonstration
- Clear component structure: App → ContractValidator → [DocumentUploader, ValidationEngine, ResultsPanel, StructureTree, ReportGenerator]
- Custom hooks: useContractParser, useReferenceExtractor, useValidationEngine
- Interface language that's conversational and clear ("Upload Contract" not "Ingest Document")
- Micro-interactions including gentle animations and helpful empty states

## How to use the prompt

Validates contract cross-references with forensic-level accuracy, ensuring no errors remain undetected. Builds a React-based system to parse, map, and validate contract structures, enhancing reliability. Generates professional reports with detailed findings and recommendations for client delivery.

## Categories

Lawyers, Contracts

## Recommended tools

- ChatGPT
- Grok
