import React, { useEffect, useState } from 'react';
import { Printer, Download, FileCheck2, Image as ImageIcon } from 'lucide-react';
import { Appointment, DoctorProfile } from '../../types';
import { NeuButton, NeuModal } from './NeumorphicPrimitives';
import { formatReadableDate } from '../../services/mockData';
import {
  buildResetaPdfDocument,
  downloadResetaAsImage,
  triggerDomPrintReseta,
} from '../../utils/prescriptionPdf';

interface PrescriptionPdfModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  doctor?: DoctorProfile | null;
  customPrescriptionText?: string;
}

export const PrescriptionPdfModal: React.FC<PrescriptionPdfModalProps> = ({
  open,
  onClose,
  appointment,
  doctor,
  customPrescriptionText,
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string>('');

  useEffect(() => {
    if (!open || !appointment) {
      setPdfBlobUrl(null);
      setActionToast('');
      return;
    }

    const pdfDoc = buildResetaPdfDocument({
      appointment,
      doctor,
      customPrescriptionText,
    });
    const blob = pdfDoc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, appointment, doctor, customPrescriptionText]);

  if (!open || !appointment) return null;

  const rxFileName = `Reseta-RX-${appointment.referenceNumber}.pdf`;
  const licenseNumber = doctor?.licenseNumber || 'PRC-MED-2026-8841';
  const specialty = doctor?.specialty || `${appointment.departmentName} Specialist`;
  const sigText =
    (customPrescriptionText !== undefined
      ? customPrescriptionText
      : appointment.consultationSummary) ||
    'Continue prescribed medication regimen as directed. Maintain adequate hydration, monitor symptoms, and return for scheduled follow-up evaluation.';

  const handleDownloadPdf = () => {
    const pdfDoc = buildResetaPdfDocument({
      appointment,
      doctor,
      customPrescriptionText,
    });
    pdfDoc.save(rxFileName);
    setActionToast(`Na-save na ang PDF file (${rxFileName}).`);
  };

  const handleDownloadPng = () => {
    downloadResetaAsImage({
      appointment,
      doctor,
      customPrescriptionText,
    });
    setActionToast(`Na-download na ang Reseta Image (Reseta-RX-${appointment.referenceNumber}.png).`);
  };

  return (
    <NeuModal
      isOpen={open}
      onClose={onClose}
      title={`Official Reseta PDF — RX-${appointment.referenceNumber}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#E2E9F2] rounded-xl p-3.5 border border-[#3478F6]/25">
          <div className="flex items-center gap-2 text-xs text-[#172B4D]">
            <FileCheck2 className="w-4 h-4 text-[#16865C] shrink-0" />
            <span>
              <strong>Official Reseta Document:</strong> A4 Medical Prescription (<strong>{rxFileName}</strong>)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NeuButton
              size="sm"
              icon={<ImageIcon className="w-4 h-4 text-[#3478F6]" />}
              onClick={handleDownloadPng}
            >
              Download (as Image)
            </NeuButton>
            <NeuButton
              size="sm"
              variant="primary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadPdf}
            >
              Save as PDF
            </NeuButton>
          </div>
        </div>

        {actionToast && (
          <div className="neu-inset rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#16865C]">
            ✓ {actionToast}
          </div>
        )}

        {/* Designed A4 Medical Prescription Pad Sheet (Visual Preview + Print Target) */}
        <div className="bg-white text-[#172B4D] rounded-xl shadow-lg border border-slate-300 overflow-hidden mx-auto max-w-[760px]">
          {/* Navy Clinical Header Banner */}
          <div className="bg-[#172B4D] text-white px-6 py-5 border-b-4 border-[#3478F6] flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold tracking-wide uppercase">
                TeleHealth Medical Center
              </div>
              <div className="text-xs text-[#D1E0FF] mt-0.5">
                Outpatient Telemedicine &amp; Specialist Consultation Services · Official Electronic Prescription (Reseta)
              </div>
              <div className="text-xs text-[#93C5FD] font-semibold mt-1">
                Department of {appointment.departmentName} · {appointment.appointmentTypeName}
              </div>
            </div>
            <div className="text-right font-mono-tabular">
              <div className="text-sm font-extrabold bg-[#3478F6] px-2.5 py-1 rounded text-white inline-block">
                RX-{appointment.referenceNumber}
              </div>
              <div className="text-[11px] text-[#D1E0FF] mt-1.5">
                Date Issued: {formatReadableDate(appointment.date)}
              </div>
              <div className="text-[11px] text-[#D1E0FF]">
                Slot: {appointment.timeLabel}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Prescribing Physician Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <div className="text-base font-extrabold text-[#172B4D] uppercase">
                  {appointment.doctorName}
                </div>
                <div className="text-xs text-slate-600">
                  {specialty} · {appointment.departmentName}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono-tabular font-bold text-[#3478F6]">
                  PRC License No.: {licenseNumber}
                </div>
                <div className="text-slate-500">
                  Consultation Mode: {appointment.consultationMode || 'Online Appointment'}
                </div>
              </div>
            </div>

            {/* Patient Information & Allergy Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Patient Information
                </div>
                <div className="text-sm font-extrabold text-[#172B4D]">
                  {appointment.patientName}
                </div>
                <div className="text-slate-600 font-mono-tabular">
                  DOB: {appointment.patientDob} &nbsp;|&nbsp; Sex: {appointment.patientSex}
                </div>
                <div className="text-slate-600">
                  {appointment.patientPhone} · {appointment.patientEmail}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Clinical Safety Snapshot
                </div>
                <div className="font-bold text-[#C63D4D]">
                  Known Allergies: {appointment.knownAllergiesSnapshot || 'None reported'}
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold">Indication / Chief Complaint:</span>{' '}
                  {appointment.reasonForVisit}
                </div>
              </div>
            </div>

            {/* Rx Pad Body */}
            <div className="relative rounded-xl border-2 border-[#3478F6]/60 bg-white p-5 space-y-4 min-h-[210px]">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <span className="text-4xl font-serif font-extrabold italic text-[#3478F6] leading-none">
                  ℞
                </span>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#172B4D]">
                    Prescribed Medications &amp; Dosage Instructions (Reseta)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dispense as written below. Follow exact dosage schedule, administration route, and duration.
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#3478F6]">
                    1. Medication Regimen / Active Pharmacotherapy:
                  </div>
                  <div className="text-sm font-bold text-[#172B4D] mt-1">
                    {appointment.currentMedicationsSnapshot ||
                      'Standard clinical regimen as prescribed by attending physician.'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase text-[#3478F6]">
                    2. Physician Prescription Orders &amp; Administration (Sig. / Reseta Notes):
                  </div>
                  <div className="text-xs text-[#172B4D] mt-1 leading-relaxed whitespace-pre-line">
                    {sigText}
                  </div>
                </div>
              </div>
            </div>

            {/* Pharmacy Instructions & Physician Digital Signature Footer */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
              <div className="space-y-1 text-[11px] text-slate-500 max-w-sm">
                <div className="font-bold text-[#16865C]">
                  OFFICIAL ELECTRONIC PRESCRIPTION (e-Rx)
                </div>
                <div>
                  Present this PDF reseta to any licensed pharmacy for verification. Do not alter dosage without consulting your physician.
                </div>
                <div className="font-mono-tabular text-[10px] text-slate-400">
                  Document ID: RX-{appointment.referenceNumber} · Status: {appointment.status}
                </div>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <div className="font-serif italic text-base text-[#172B4D]">
                  Digitally Signed: {appointment.doctorName}
                </div>
                <div className="border-t border-[#172B4D] pt-1 font-bold text-[#172B4D]">
                  {appointment.doctorName}
                </div>
                <div className="text-[11px] text-slate-600">
                  Attending Physician · {appointment.departmentName}
                </div>
                <div className="font-mono-tabular text-[11px] font-bold text-[#3478F6]">
                  License No.: {licenseNumber}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Native PDF Viewer (if supported by browser) */}
        {pdfBlobUrl && (
          <details className="neu-inset rounded-xl p-3 text-xs">
            <summary className="font-bold text-[#3478F6] cursor-pointer">
              View Embedded Browser PDF Stream ({rxFileName})
            </summary>
            <div className="mt-3 h-[420px] rounded-lg overflow-hidden border border-black/10 bg-white">
              <iframe
                src={pdfBlobUrl}
                title={`PDF Preview RX-${appointment.referenceNumber}`}
                className="w-full h-full border-0"
              />
            </div>
          </details>
        )}
      </div>
    </NeuModal>
  );
};
