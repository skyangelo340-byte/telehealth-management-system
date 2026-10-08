import { jsPDF } from 'jspdf';
import { Appointment, DoctorProfile } from '../types';
import { formatReadableDate } from '../services/mockData';

export interface GenerateResetaPdfOptions {
  appointment: Appointment;
  doctor?: DoctorProfile | null;
  customPrescriptionText?: string;
}

/**
 * Generates an official, clinic-designed Medical Prescription (Reseta / e-Rx) PDF
 * and returns both the jsPDF instance, a Blob URL for live preview/printing, and download helper.
 */
export function buildResetaPdfDocument({
  appointment,
  doctor,
  customPrescriptionText,
}: GenerateResetaPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Outer subtle paper frame
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Top Header Navy Banner
  doc.setFillColor(23, 43, 77); // #172B4D
  doc.rect(10, 10, pageWidth - 20, 32, 'F');

  // Accent Blue Stripe under Banner
  doc.setFillColor(52, 120, 246); // #3478F6
  doc.rect(10, 42, pageWidth - 20, 2.2, 'F');

  // Clinic Title & Subtitle inside Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('TELEHEALTH MEDICAL CENTER', margin, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 224, 255);
  doc.text(
    'Outpatient Telemedicine & Specialist Consultation Services · Official Electronic Prescription (Reseta)',
    margin,
    28.5
  );
  doc.text(
    `Department of ${appointment.departmentName} · Service: ${appointment.appointmentTypeName}`,
    margin,
    34.5
  );

  // Right-aligned Rx Reference Badge inside Banner
  const rxRef = `RX-${appointment.referenceNumber}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(rxRef, pageWidth - margin, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 224, 255);
  doc.text(
    `Date Issued: ${formatReadableDate(appointment.date)}`,
    pageWidth - margin,
    28.5,
    { align: 'right' }
  );
  doc.text(`Consultation Slot: ${appointment.timeLabel}`, pageWidth - margin, 34.5, {
    align: 'right',
  });

  // Attending Physician Header Block
  let y = 53;
  doc.setTextColor(23, 43, 77);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(appointment.doctorName.toUpperCase(), margin, y);

  const licenseNumber = doctor?.licenseNumber || 'PRC-MED-2026-8841';
  const specialty = doctor?.specialty || `${appointment.departmentName} Specialist`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${specialty} · ${appointment.departmentName}`, margin, y + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 120, 246);
  doc.text(`PRC License No.: ${licenseNumber}`, pageWidth - margin, y, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Mode: ${appointment.consultationMode || 'Online Appointment'}`,
    pageWidth - margin,
    y + 5.5,
    { align: 'right' }
  );

  // Horizontal Divider
  y += 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageWidth - margin, y);

  // Patient Demographics & Allergy Safety Box
  y += 5;
  doc.setFillColor(241, 245, 249); // #F1F5F9
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 28, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT INFORMATION', margin + 4, y + 6);
  doc.text('CLINICAL SAFETY SNAPSHOT', margin + contentWidth / 2 + 4, y + 6);

  // Left Column: Patient Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(23, 43, 77);
  doc.text(`Name: ${appointment.patientName}`, margin + 4, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `DOB: ${appointment.patientDob}   |   Sex: ${appointment.patientSex}`,
    margin + 4,
    y + 18.5
  );
  doc.text(
    `Contact: ${appointment.patientPhone} · ${appointment.patientEmail}`,
    margin + 4,
    y + 24
  );

  // Right Column: Allergies & Chief Complaint
  const rightColX = margin + contentWidth / 2 + 4;
  const allergies = appointment.knownAllergiesSnapshot || 'None reported';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (allergies.toLowerCase() !== 'none' && allergies.toLowerCase() !== 'none reported') {
    doc.setTextColor(198, 61, 77); // Alert red for active allergies
  } else {
    doc.setTextColor(22, 134, 92);
  }
  const allergyLines = doc.splitTextToSize(`Known Allergies: ${allergies}`, contentWidth / 2 - 8);
  doc.text(allergyLines[0], rightColX, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const complaintLines = doc.splitTextToSize(
    `Indication / Chief Complaint: ${appointment.reasonForVisit || 'Clinical consultation'}`,
    contentWidth / 2 - 8
  );
  doc.text(complaintLines.slice(0, 2), rightColX, y + 18.5);

  // Large Classic Medical Rx Symbol Header
  y += 38;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(34);
  doc.setTextColor(52, 120, 246);
  doc.text('Rx', margin + 2, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 43, 77);
  doc.text('PRESCRIBED MEDICATIONS & DOSAGE INSTRUCTIONS (RESETA)', margin + 22, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Dispense as written below. Follow exact dosage schedule, administration route, and duration.',
    margin + 22,
    y + 6
  );

  // Prescription Pad Box
  y += 11;
  const rxBoxHeight = 108;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(52, 120, 246);
  doc.setLineWidth(0.45);
  doc.roundedRect(margin, y, contentWidth, rxBoxHeight, 3, 3, 'FD');

  // Subtle watermark Rx inside the pad
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(72);
  doc.setTextColor(241, 245, 249);
  doc.text('Rx', pageWidth / 2 - 14, y + 64);

  // Section 1 inside Rx box: Active / Maintenance Regimen
  let rxCursorY = y + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(52, 120, 246);
  doc.text('1. MEDICATION REGIMEN / ACTIVE PHARMACOTHERAPY:', margin + 6, rxCursorY);

  rxCursorY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(23, 43, 77);
  const activeMedsText =
    appointment.currentMedicationsSnapshot ||
    'Standard clinical regimen as prescribed by attending physician.';
  const medLines = doc.splitTextToSize(activeMedsText, contentWidth - 12);
  doc.text(medLines, margin + 6, rxCursorY);
  rxCursorY += medLines.length * 5.5 + 5;

  // Divider inside Rx Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 6, rxCursorY, pageWidth - margin - 6, rxCursorY);

  // Section 2 inside Rx box: Physician Sig. / Post-Consultation Reseta Instructions
  rxCursorY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(52, 120, 246);
  doc.text(
    '2. PHYSICIAN PRESCRIPTION ORDERS & ADMINISTRATION (SIG. / RESETA NOTES):',
    margin + 6,
    rxCursorY
  );

  rxCursorY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(23, 43, 77);
  const sigText =
    (customPrescriptionText !== undefined
      ? customPrescriptionText
      : appointment.consultationSummary) ||
    'Continue prescribed medication regimen as directed. Maintain adequate hydration, monitor symptoms, and return for scheduled follow-up evaluation.';
  const sigLines = doc.splitTextToSize(sigText, contentWidth - 12);
  doc.text(sigLines, margin + 6, rxCursorY);

  // Patient Safety & Follow-Up Notice Box
  y += rxBoxHeight + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 134, 92);
  doc.text('IMPORTANT PHARMACY & PATIENT INSTRUCTIONS:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '• Present this official electronic prescription (Reseta) to any licensed pharmacy for verification and dispensing.',
    margin + 4,
    y + 11.5
  );
  doc.text(
    '• Do not alter dosage or discontinue prescribed therapy without consulting your attending physician.',
    margin + 4,
    y + 16.5
  );

  // Signature & Verification Block at Bottom
  const sigBlockY = pageHeight - 48;

  // Left: Verification Metadata
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 43, 77);
  doc.text(`DOCUMENT ID: ${rxRef}`, margin, sigBlockY);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Appointment Status: ${appointment.status.toUpperCase()}`, margin, sigBlockY + 5);
  doc.text(
    `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    margin,
    sigBlockY + 10
  );
  doc.text('Digitally Verified · TeleHealth e-Rx Registry', margin, sigBlockY + 15);

  // Right: Physician Signature Line
  const sigLineStartX = pageWidth - margin - 72;
  const sigLineEndX = pageWidth - margin;

  // Stylized digital signature script above line
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(23, 43, 77);
  doc.text(`Digitally Signed: ${appointment.doctorName}`, sigLineStartX + 4, sigBlockY + 4);

  doc.setDrawColor(23, 43, 77);
  doc.setLineWidth(0.45);
  doc.line(sigLineStartX, sigBlockY + 7, sigLineEndX, sigBlockY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 43, 77);
  doc.text(appointment.doctorName, sigLineEndX, sigBlockY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Attending Physician · ${appointment.departmentName}`, sigLineEndX, sigBlockY + 16.5, {
    align: 'right',
  });
  doc.setFont('courier', 'bold');
  doc.text(`License No.: ${licenseNumber}`, sigLineEndX, sigBlockY + 21, { align: 'right' });

  // Bottom Footer Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'TeleHealth Clinical Management System · Official Electronic Medical Prescription (e-Rx / Reseta)',
    pageWidth / 2,
    pageHeight - 13,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generates an official Clinic e-Prescriptions Master Registry PDF for Admin.
 */
export function buildResetaRegistryPdfDocument(appointments: Appointment[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 14;

  // Header Banner
  doc.setFillColor(23, 43, 77);
  doc.rect(10, 10, pageWidth - 20, 24, 'F');
  doc.setFillColor(52, 120, 246);
  doc.rect(10, 34, pageWidth - 20, 1.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TELEHEALTH CLINIC · MASTER e-PRESCRIPTIONS REGISTRY (RESETA LOG)', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 224, 255);
  doc.text(
    `Total Prescription Records: ${appointments.length} · Generated on ${new Date()
      .toISOString()
      .slice(0, 10)}`,
    margin,
    27
  );

  // Table Headers
  let y = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 43, 77);

  doc.text('e-Rx Ref #', margin + 2, y);
  doc.text('Patient Name', margin + 38, y);
  doc.text('Prescribing Physician', margin + 82, y);
  doc.text('Department', margin + 130, y);
  doc.text('Medications & Prescription Summary', margin + 168, y);
  doc.text('Date', pageWidth - margin - 24, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  appointments.forEach((apt, idx) => {
    if (y > pageHeight - 22) {
      doc.addPage();
      y = 24;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4.5, pageWidth - margin * 2, 10, 'F');
    }

    doc.setFont('courier', 'bold');
    doc.setTextColor(52, 120, 246);
    doc.text(`RX-${apt.referenceNumber}`, margin + 2, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 43, 77);
    doc.text(apt.patientName.slice(0, 24), margin + 38, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(apt.doctorName.slice(0, 26), margin + 82, y);
    doc.text(apt.departmentName.slice(0, 20), margin + 130, y);

    const rxSummary = `${apt.currentMedicationsSnapshot || 'Standard regimen'} — ${
      apt.consultationSummary || 'Pending post-visit e-Rx'
    }`;
    const truncatedRx = rxSummary.length > 56 ? rxSummary.slice(0, 53) + '...' : rxSummary;
    doc.text(truncatedRx, margin + 168, y);

    doc.setFont('courier', 'normal');
    doc.text(apt.date, pageWidth - margin - 24, y);

    y += 9;
  });

  return doc;
}

/**
 * Triggers printing of a generated jsPDF document inside the browser/iframe
 * using a hidden iframe with the PDF blob, with automatic fallback.
 */
export function triggerPdfPrint(pdfDoc: jsPDF, fallbackFileName = 'TeleHealth-Reseta.pdf'): void {
  try {
    pdfDoc.autoPrint();
    const blob = pdfDoc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const existingFrame = document.getElementById('telehealth-pdf-print-frame');
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'telehealth-pdf-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    iframe.src = blobUrl;

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          pdfDoc.save(fallbackFileName);
        }
      }, 250);
    };

    document.body.appendChild(iframe);
  } catch {
    pdfDoc.save(fallbackFileName);
  }
}

/**
 * Helper to wrap text on a 2D canvas context.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const paragraphs = text.split('\n');
  let cursorY = y;

  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, cursorY);
        line = words[n] + ' ';
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

/**
 * Generates and downloads an official high-resolution PNG image of the Medical Prescription (Reseta).
 */
export function downloadResetaAsImage({
  appointment,
  doctor,
  customPrescriptionText,
}: GenerateResetaPdfOptions): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1240; // High-res A4 portrait proportion
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rxRef = `RX-${appointment.referenceNumber}`;
  const licenseNumber = doctor?.licenseNumber || 'PRC-MED-2026-8841';
  const specialty = doctor?.specialty || `${appointment.departmentName} Specialist`;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Frame
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  // Top Header Navy Banner
  ctx.fillStyle = '#172B4D';
  ctx.fillRect(48, 48, canvas.width - 96, 190);

  // Accent Blue Stripe
  ctx.fillStyle = '#3478F6';
  ctx.fillRect(48, 238, canvas.width - 96, 14);

  // Clinic Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px Inter, Arial, sans-serif';
  ctx.fillText('TELEHEALTH MEDICAL CENTER', 92, 118);

  ctx.fillStyle = '#D1E0FF';
  ctx.font = '20px Inter, Arial, sans-serif';
  ctx.fillText(
    'Outpatient Telemedicine & Specialist Consultation Services · Official Reseta (e-Rx)',
    92,
    160
  );
  ctx.fillText(
    `Department of ${appointment.departmentName} · Service: ${appointment.appointmentTypeName}`,
    92,
    196
  );

  // Right Rx Badge in Header
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Courier New, monospace';
  ctx.fillText(rxRef, canvas.width - 92, 118);

  ctx.fillStyle = '#D1E0FF';
  ctx.font = '19px Inter, Arial, sans-serif';
  ctx.fillText(`Date Issued: ${formatReadableDate(appointment.date)}`, canvas.width - 92, 160);
  ctx.fillText(`Slot: ${appointment.timeLabel}`, canvas.width - 92, 196);
  ctx.textAlign = 'left';

  // Physician Info Row
  let y = 310;
  ctx.fillStyle = '#172B4D';
  ctx.font = 'bold 30px Inter, Arial, sans-serif';
  ctx.fillText(appointment.doctorName.toUpperCase(), 92, y);

  ctx.fillStyle = '#475569';
  ctx.font = '22px Inter, Arial, sans-serif';
  ctx.fillText(`${specialty} · ${appointment.departmentName}`, 92, y + 36);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#3478F6';
  ctx.font = 'bold 22px Courier New, monospace';
  ctx.fillText(`PRC License No.: ${licenseNumber}`, canvas.width - 92, y);
  ctx.fillStyle = '#475569';
  ctx.font = '20px Inter, Arial, sans-serif';
  ctx.fillText(
    `Mode: ${appointment.consultationMode || 'Online Appointment'}`,
    canvas.width - 92,
    y + 36
  );
  ctx.textAlign = 'left';

  // Patient Demographics Box
  y += 74;
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(92, y, canvas.width - 184, 180);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(92, y, canvas.width - 184, 180);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 18px Inter, Arial, sans-serif';
  ctx.fillText('PATIENT INFORMATION', 120, y + 38);
  ctx.fillText('CLINICAL SAFETY SNAPSHOT', canvas.width / 2 + 20, y + 38);

  ctx.fillStyle = '#172B4D';
  ctx.font = 'bold 25px Inter, Arial, sans-serif';
  ctx.fillText(`Name: ${appointment.patientName}`, 120, y + 80);

  ctx.fillStyle = '#334155';
  ctx.font = '21px Inter, Arial, sans-serif';
  ctx.fillText(
    `DOB: ${appointment.patientDob}   |   Sex: ${appointment.patientSex}`,
    120,
    y + 118
  );
  ctx.fillText(
    `Contact: ${appointment.patientContact || 'On file'} · ${appointment.patientEmail}`,
    120,
    y + 154
  );

  const allergies = appointment.knownAllergiesSnapshot || 'None reported';
  ctx.fillStyle =
    allergies.toLowerCase() !== 'none' && allergies.toLowerCase() !== 'none reported'
      ? '#C63D4D'
      : '#16865C';
  ctx.font = 'bold 22px Inter, Arial, sans-serif';
  ctx.fillText(`Known Allergies: ${allergies}`, canvas.width / 2 + 20, y + 80);

  ctx.fillStyle = '#334155';
  ctx.font = '20px Inter, Arial, sans-serif';
  drawWrappedText(
    ctx,
    `Indication: ${appointment.reasonForVisit || 'Clinical consultation'}`,
    canvas.width / 2 + 20,
    y + 118,
    canvas.width / 2 - 130,
    28
  );

  // Rx Symbol Header
  y += 245;
  ctx.fillStyle = '#3478F6';
  ctx.font = 'italic bold 78px Georgia, serif';
  ctx.fillText('Rx', 96, y + 24);

  ctx.fillStyle = '#172B4D';
  ctx.font = 'bold 26px Inter, Arial, sans-serif';
  ctx.fillText('PRESCRIBED MEDICATIONS & DOSAGE INSTRUCTIONS (RESETA)', 225, y - 6);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px Inter, Arial, sans-serif';
  ctx.fillText(
    'Dispense as written below. Follow exact dosage schedule, route, and duration.',
    225,
    y + 28
  );

  // Prescription Pad Box
  y += 60;
  const rxBoxHeight = 640;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(92, y, canvas.width - 184, rxBoxHeight);
  ctx.strokeStyle = '#3478F6';
  ctx.lineWidth = 3;
  ctx.strokeRect(92, y, canvas.width - 184, rxBoxHeight);

  let rxY = y + 58;
  ctx.fillStyle = '#3478F6';
  ctx.font = 'bold 21px Inter, Arial, sans-serif';
  ctx.fillText('1. MEDICATION REGIMEN / ACTIVE PHARMACOTHERAPY:', 128, rxY);

  rxY += 38;
  ctx.fillStyle = '#172B4D';
  ctx.font = 'bold 24px Inter, Arial, sans-serif';
  const activeMedsText =
    appointment.currentMedicationsSnapshot ||
    'Standard clinical regimen as prescribed by attending physician.';
  rxY = drawWrappedText(ctx, activeMedsText, 128, rxY, canvas.width - 260, 34);

  rxY += 20;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, rxY);
  ctx.lineTo(canvas.width - 128, rxY);
  ctx.stroke();

  rxY += 46;
  ctx.fillStyle = '#3478F6';
  ctx.font = 'bold 21px Inter, Arial, sans-serif';
  ctx.fillText(
    '2. PHYSICIAN PRESCRIPTION ORDERS & ADMINISTRATION (SIG. / RESETA):',
    128,
    rxY
  );

  rxY += 40;
  ctx.fillStyle = '#172B4D';
  ctx.font = '23px Courier New, monospace';
  const sigText =
    (customPrescriptionText !== undefined
      ? customPrescriptionText
      : appointment.consultationSummary) ||
    'Continue prescribed medication regimen as directed. Maintain adequate hydration and follow up as scheduled.';
  drawWrappedText(ctx, sigText, 128, rxY, canvas.width - 260, 34);

  // Signature Footer
  const sigY = canvas.height - 230;
  ctx.fillStyle = '#172B4D';
  ctx.font = 'bold 20px Courier New, monospace';
  ctx.fillText(`DOCUMENT ID: ${rxRef}`, 92, sigY);
  ctx.fillStyle = '#64748B';
  ctx.font = '18px Courier New, monospace';
  ctx.fillText(`Status: ${appointment.status.toUpperCase()}`, 92, sigY + 32);
  ctx.fillText('Digitally Verified · TeleHealth e-Rx Registry', 92, sigY + 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#172B4D';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText(`Digitally Signed: ${appointment.doctorName}`, canvas.width - 92, sigY + 10);

  ctx.strokeStyle = '#172B4D';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(canvas.width - 520, sigY + 26);
  ctx.lineTo(canvas.width - 92, sigY + 26);
  ctx.stroke();

  ctx.font = 'bold 23px Inter, Arial, sans-serif';
  ctx.fillText(appointment.doctorName, canvas.width - 92, sigY + 58);
  ctx.fillStyle = '#475569';
  ctx.font = '19px Inter, Arial, sans-serif';
  ctx.fillText(
    `Attending Physician · License No.: ${licenseNumber}`,
    canvas.width - 92,
    sigY + 88
  );
  ctx.textAlign = 'left';

  // Trigger PNG download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Reseta-${rxRef}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Renders a dedicated DOM-PDF A4 prescription sheet inside an invisible print iframe
 * and immediately invokes the native browser Print / Save as PDF dialog without any intermediate modal.
 */
export function triggerDomPrintReseta({
  appointment,
  doctor,
  customPrescriptionText,
}: GenerateResetaPdfOptions): boolean {
  const rxRef = `RX-${appointment.referenceNumber}`;

  // Clean up any previous print artifacts
  [
    'telehealth-direct-print-root',
    'telehealth-direct-print-style',
    'telehealth-autoprint-pdf-frame',
    'telehealth-pdf-print-frame',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // Build the 1-page A4 Reseta PDF with autoPrint({ variant: 'non-conform' })
  // and render it inside an invisible iframe so Chrome's built-in PDF viewer
  // opens the native Print Preview modal (Destination / Save as PDF / Pages / Layout)
  // WITHOUT auto-downloading any file.
  try {
    const pdfDoc = buildResetaPdfDocument({
      appointment,
      doctor,
      customPrescriptionText,
    });
    pdfDoc.autoPrint();
    const blob = pdfDoc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const pdfFrame = document.createElement('iframe');
    pdfFrame.id = 'telehealth-autoprint-pdf-frame';
    pdfFrame.title = `Print-${rxRef}`;
    pdfFrame.style.position = 'fixed';
    pdfFrame.style.left = '-9999px';
    pdfFrame.style.top = '0';
    pdfFrame.style.width = '800px';
    pdfFrame.style.height = '600px';
    pdfFrame.style.border = '0';
    pdfFrame.style.pointerEvents = 'none';
    pdfFrame.src = blobUrl;

    pdfFrame.onload = () => {
      setTimeout(() => {
        try {
          pdfFrame.contentWindow?.focus();
          pdfFrame.contentWindow?.print();
        } catch {
          // Chrome PDF plugin autoPrint() handles opening the Print Preview dialog
        }
      }, 250);
    };

    document.body.appendChild(pdfFrame);
    return true;
  } catch {
    try {
      window.focus();
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

