import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  WidthType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
} from 'docx';
import { docTitle, docSubtitle, clauseHeading, bodyParagraph, divider } from '@/lib/docx-helpers';

export { Packer };

export type ProposalData = {
  clientName: string;
  projectName: string;
  problemSummary: string;
  solutionSummary: string;
  modules: { label: string; hours: number }[];
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  estimatedWeeks: number;
  paymentTerms: string;
};

// ─── Table helpers ────────────────────────────────────────────────────────────

function tableCell(text: string, bold = false, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 22,
            font: 'Calibri',
            color: '2D2D2D',
            bold,
          }),
        ],
        alignment: align,
        spacing: { after: 60 },
      }),
    ],
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
    },
  });
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export function buildProposal(data: ProposalData): Document {
  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Module table rows
  const moduleRows = data.modules.map((mod) =>
    new TableRow({
      children: [
        tableCell(mod.label),
        tableCell(`${mod.hours}h`, false, AlignmentType.RIGHT),
        tableCell(
          `$${(mod.hours * data.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
          false,
          AlignmentType.RIGHT,
        ),
      ],
    }),
  );

  const moduleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell('Module / Deliverable', true),
          tableCell('Hours', true, AlignmentType.RIGHT),
          tableCell('Amount (USD)', true, AlignmentType.RIGHT),
        ],
      }),
      ...moduleRows,
      new TableRow({
        children: [
          tableCell('TOTAL', true),
          tableCell(`${data.totalHours}h`, true, AlignmentType.RIGHT),
          tableCell(
            `$${data.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            true,
            AlignmentType.RIGHT,
          ),
        ],
      }),
    ],
  });

  const sections = [
    // ── Cover ────────────────────────────────────────────────────────────────
    docTitle('SERVICE PROPOSAL'),
    docSubtitle(data.projectName),
    new Paragraph({
      children: [
        new TextRun({
          text: `Prepared for: ${data.clientName}  ·  ${today}`,
          size: 22,
          font: 'Calibri',
          color: '6B6B8A',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    }),

    divider(),

    // ── Problem & Solution ────────────────────────────────────────────────────
    clauseHeading('I', 'EXECUTIVE SUMMARY'),
    bodyParagraph(data.problemSummary),
    bodyParagraph(data.solutionSummary),

    divider(),

    // ── Scope & Deliverables ──────────────────────────────────────────────────
    clauseHeading('II', 'SCOPE & DELIVERABLES'),
    bodyParagraph('The following modules are included in this proposal:'),

    // Module table
    new Paragraph({ children: [], spacing: { after: 120 } }),
    moduleTable,
    new Paragraph({ children: [], spacing: { after: 240 } }),

    divider(),

    // ── Timeline ─────────────────────────────────────────────────────────────
    clauseHeading('III', 'PROJECT TIMELINE'),
    bodyParagraph(
      `Estimated duration: ${data.estimatedWeeks} week${data.estimatedWeeks !== 1 ? 's' : ''} from project start date.`,
    ),
    bodyParagraph(
      'Timeline is indicative. Delays attributable to the client (feedback, materials, access) may extend the schedule without constituting a breach on the provider\'s part.',
    ),

    divider(),

    // ── Pricing ───────────────────────────────────────────────────────────────
    clauseHeading('IV', 'INVESTMENT'),
    bodyParagraph(
      `Total investment: USD ${data.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${data.totalHours} estimated hours @ USD ${data.hourlyRate}/hr).`,
    ),
    bodyParagraph(`Payment terms: ${data.paymentTerms}.`),
    bodyParagraph(
      'Payments are made via international bank transfer or mutually agreed digital payment method. Work begins only after receipt of the corresponding payment.',
    ),

    divider(),

    // ── Next Steps ────────────────────────────────────────────────────────────
    clauseHeading('V', 'NEXT STEPS'),
    bodyParagraph('1. Review this proposal and share any questions or adjustments.'),
    bodyParagraph('2. Once approved, sign the service agreement.'),
    bodyParagraph('3. Initial payment confirms the project start date.'),
    bodyParagraph('4. Kickoff meeting to align on scope, tools, and communication cadence.'),

    divider(),

    // ── Guarantee ────────────────────────────────────────────────────────────
    clauseHeading('VI', 'WARRANTY'),
    bodyParagraph(
      'The provider guarantees correct functioning of deliverables per agreed specifications for 30 calendar days after final delivery. Bug fixes within this window are included at no additional cost.',
    ),

    divider(),

    // ── Footer ───────────────────────────────────────────────────────────────
    new Paragraph({
      children: [
        new TextRun({
          text: 'Silvano Puccini · silvanopuccini.dev · Full Stack Developer',
          size: 20,
          font: 'Calibri',
          color: '9999AA',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
    }),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: sections,
      },
    ],
  });
}
