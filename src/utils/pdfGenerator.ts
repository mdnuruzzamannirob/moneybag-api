import PDFDocument from 'pdfkit';

export type ReportLine = {
  label: string;
  value: string | number;
};

export const generateReportPdf = (title: string, lines: ReportLine[]) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(title, { underline: true });
    doc.moveDown();

    for (const line of lines) {
      doc.fontSize(12).text(`${line.label}: ${line.value}`);
    }

    doc.end();
  });
