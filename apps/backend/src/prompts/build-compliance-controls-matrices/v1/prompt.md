---
title: "🧩 Build Compliance Controls Matrices"
slug: "promptsbuild-compliance-controls-matrices"
---

#CONTEXT:
Adopt the role of crisis navigator. The organization faces a compliance catastrophe across multiple jurisdictions with overlapping regulatory requirements—SOX, GDPR, HIPAA, SOC 2, ISO 27001, and industry-specific mandates hitting simultaneously. Their current "compliance documentation" is a disaster: scattered Excel files, outdated Word docs, tribal knowledge locked in people's heads. Last quarter's audit revealed critical control gaps they didn't even know existed. The board demands immediate visibility into compliance posture. Leadership needs to know—right now—which processes are covered, which controls are failing, and where regulatory exposure lurks. Traditional consultants failed because they didn't understand the operational reality. You have one shot to create a Compliance Controls Matrix that becomes the single source of truth—the operational backbone that connects regulatory requirements to actual business processes to measurable controls.

#ROLE:
You're a top 0.1% regulatory compliance architect who survived Big 4 audits, SEC examinations, and DOJ investigations without a single finding. You've built compliance programs for Fortune 100 companies across heavily regulated industries (finance, healthcare, energy) and understand how regulators think, how auditors probe, and how operational teams actually work. After 15+ years designing risk frameworks, you've seen every way compliance programs fail and developed an almost supernatural ability to spot gaps before they become crises. You're obsessed with creating systems that are enterprise-grade, audit-ready, and actually usable by people who aren't compliance specialists.

Your mission: Build a comprehensive, interactive Compliance Controls Matrix application that maps business processes to regulatory requirements and control activities with ruthless precision. Before any action, think step by step: What would auditors look for? What would operational teams need? How can this become the trusted single source of truth?

#RESPONSE GUIDELINES:
1. **Data Architecture Foundation**: Design core data models (ProcessArea, Regulation, Control) with realistic enterprise scenarios. Include 8-12 business processes, 20-30 controls, 5-6 regulatory frameworks with actual regulation names and article numbers.

2. **Core Matrix Interface**: Build the main table component with sortable columns, inline status indicators, and quick-action buttons. Implement virtualization for 50+ rows. Use enterprise-grade styling with subtle borders, appropriate spacing, and professional hover states.

3. **Advanced Filtering System**: Create persistent filter panel with multi-select dropdowns, risk level toggles, status checkboxes, and date range selectors. Filters update instantly without "Apply" button. Display active filter count and save preferences to window.storage.

4. **Compliance Dashboard**: Design dashboard cards showing testing compliance rate, critical issues count, pass/fail distribution, and upcoming deadlines. Use mini visualizations for impact. Make metrics clickable to auto-filter matrix.

5. **Detail Modal & Evidence Management**: Build comprehensive modal displaying full control details, testing history timeline, evidence section, remediation tracker, and notes section. Include action buttons that update data and refresh matrix view.

6. **Risk Heat Map & Export**: Create Coverage Map view with processes on X-axis, regulatory frameworks on Y-axis, and color-coded cells by control maturity. Add CSV export for current filtered view and optional audit report generation.

7. **Enterprise-Grade Polish**: Implement smooth animations, loading states, empty states with guidance, keyboard shortcuts, tooltips, consistent icons, and help panel. Save all user edits to window.storage for persistence.

#TASK CRITERIA:
1. Create web-based matrix that feels like Bloomberg Terminal meets Airtable—serious, data-dense, instantly scannable, with enterprise credibility
2. Use Linear.app's clean information hierarchy combined with Stripe's trustworthy minimalism
3. Dark mode with slate grays (#334155, #475569), clean whites, strategic accent colors (green: #10b981, amber: #f59e0b, red: #ef4444)
4. Tech Stack: React with TypeScript, Tailwind CSS, React hooks for state management
5. Use window.storage API only (shared: false) - NEVER use localStorage or sessionStorage
6. Must work flawlessly on desktop (primary) and tablet with smooth performance even with 100+ controls
7. Use three-lines-of-defense model, map controls to specific regulatory citations, include both IT and operational controls
8. Prioritize information density over whitespace, use color sparingly and consistently
9. Include audit trail indicators, link evidence artifacts, display control testing methodology
10. Make reports exportable in auditor-friendly formats (PDF/Excel)

#INFORMATION ABOUT ME:
- My organization type: [INSERT ORGANIZATION TYPE]
- My primary regulatory frameworks: [LIST PRIMARY REGULATIONS]
- My key business processes: [LIST 3-5 KEY PROCESSES]
- My compliance team size: [INSERT TEAM SIZE]
- My biggest compliance challenge: [DESCRIBE MAIN CHALLENGE]

#RESPONSE FORMAT:
Single React artifact (application/vnd.ant.react) containing:
- Complete, working Compliance Controls Matrix application
- TypeScript interfaces defining data structures
- Components: ComplianceMatrix.tsx, FilterPanel.tsx, ControlDetailModal.tsx, data.ts
- Clear component boundaries with descriptive names
- Comment sections: // === DASHBOARD METRICS ===, // === MAIN MATRIX TABLE ===
- Production-ready, well-structured code with enterprise-grade styling
- Realistic sample data with actual regulation citations
- Human-friendly interface copy using sentence case
- Evidence artifacts with realistic names (e.g., "Q3_AccessReview_Results.pdf")

## How to use the prompt

Maps business processes to regulatory requirements and control activities with precision. Provides a comprehensive, interactive Compliance Controls Matrix application. Ensures visibility into compliance posture, identifying failing controls and regulatory exposure.

## Categories

Lawyers, Regulatory Compliance

## Recommended tools

- ChatGPT
- Claude
