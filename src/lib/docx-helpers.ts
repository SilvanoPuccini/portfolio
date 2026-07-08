import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';

export function docTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        font: 'Calibri',
        color: '1A1A2E',
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });
}

export function docSubtitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: 'Calibri',
        color: '4A4A6A',
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 480 },
  });
}

export function clauseHeading(number: string, clauseTitle: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${number}. ${clauseTitle}`,
        bold: true,
        size: 26,
        font: 'Calibri',
        color: '1A1A2E',
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
  });
}

export function bodyParagraph(text: string, indent = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 24,
        font: 'Calibri',
        color: '2D2D2D',
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: 360 },
    indent: indent ? { left: 720 } : undefined,
  });
}

export function divider(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: 'CCCCCC',
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 120, after: 120 },
    children: [],
  });
}
