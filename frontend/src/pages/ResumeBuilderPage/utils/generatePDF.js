import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(id = 'resume-preview', filename = 'resume.pdf') {
  const input = document.getElementById(id);
  if (!input) {
    console.error(`Target element with id '${id}' not found`);
    return;
  }

  // Capture canvas with high resolution scale
  const canvas = await html2canvas(input, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}

export default generatePDF;
