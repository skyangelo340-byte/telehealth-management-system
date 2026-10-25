import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'tl';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isTagalog: boolean;
  t: (text: string, fallback?: string) => string;
}

const STORAGE_KEY = 'telehealth_language_setting_v1';

// Comprehensive English to Tagalog dictionary covering all 12 domains:
// 1. Navigation & Sidebar
// 2. Dashboard Headings & Statistics
// 3. Buttons & Action Labels
// 4. Login, Registration & Profile
// 5. Patient Information & Medical History
// 6. Appointment Booking & Scheduling
// 7. Doctor Profiles & Availability
// 8. Appointment Status & Notifications
// 9. Consultation Pages & Messaging
// 10. Forms, Placeholders & Error Messages
// 11. Admin Dashboard & System Settings
// 12. Help Instructions & Confirmation Dialogs
const EXACT_SENTENCE_MAP: Record<string, string> = {
  // User-Defined Core Terminology
  'Dashboard': 'Pangunahing Pahina',
  'Patient Dashboard': 'Pangunahing Pahina ng Pasyente',
  'Doctor Dashboard': 'Pangunahing Pahina ng Doktor',
  'Admin Dashboard': 'Pangunahing Pahina ng Admin',
  'Appointments': 'Mga Appointment',
  'My Appointments': 'Aking mga Appointment',
  'Appointments & Scheduling': 'Mga Appointment at Iskedyul',
  'Book Appointment': 'Magpa-iskedyul ng Konsultasyon',
  'Book an Appointment': 'Magpa-iskedyul ng Konsultasyon',
  'Book Appointment Now': 'Magpa-iskedyul ng Konsultasyon',
  'Quick Book Appointment': 'Mabilisang Pagpa-iskedyul ng Konsultasyon',
  'Doctors': 'Mga Doktor',
  'Patient Information': 'Impormasyon ng Pasyente',
  'Medical History': 'Kasaysayang Medikal',
  'Previous Medical History': 'Kasaysayang Medikal',
  'Notifications': 'Mga Abiso',
  'Notification Center': 'Sentro ng mga Abiso',
  'Settings': 'Mga Setting',
  'App Settings': 'Mga Setting ng App',
  'Theme': 'Tema',
  'Light Theme': 'Maliwanag na Tema',
  'Dark Theme': 'Madilim na Tema',
  'Light': 'Maliwanag',
  'Dark': 'Madilim',
  'System Settings': 'Mga Setting ng Sistema',
  'Save Changes': 'I-save ang mga Pagbabago',
  'Cancel': 'Kanselahin',
  'Submit': 'Isumite',
  'Log Out': 'Mag-logout',
  'Sign Out': 'Mag-logout',
  'Search': 'Maghanap',
  'Select Date': 'Pumili ng Petsa',
  'Available': 'May Bakanteng Oras',
  'No Available Schedule': 'Walang Bakanteng Iskedyul',
  'No slots available on this date': 'Walang Bakanteng Iskedyul sa petsang ito',
  'No slots available': 'Walang Bakanteng Iskedyul',

  // Payment Step & Fee Breakdown
  'Payment & Fee Breakdown': 'Bayarin at Paraan ng Pagbabayad',
  'Payment Method': 'Paraan ng Pagbabayad',
  'TeleHealth Platform & Administrative Fee': 'Bayad sa Sistema at Admin Fee',
  'Total Amount Payable': 'Kabuuang Halagang Babayaran',
  'GCash E-Wallet': 'GCash E-Wallet',
  'Maya E-Wallet & Cards': 'Maya E-Wallet at Card',
  'Credit / Debit Card': 'Credit / Debit Card',
  'Slot Reservation Hold Window': 'Oras ng Pansamantalang Pagreserba ng Slot',
  'Payment Gateway Setup Required': 'Kailangan ng Setup ng Payment Gateway',
  'Pending Payment': 'Naghihintay ng Pagbabayad',
  'PayMongo / Xendit Sandbox Integration Boundary': 'Hangganan ng PayMongo / Xendit Integration',
  'Secure Hosted Checkout Notice': 'Paunawa sa Ligtas na Hosted Checkout',
  'Never enter credit card details or CVV directly in this application. All transactions redirect securely to the provider hosted checkout page.':
    'Huwag maglagay ng numero ng card o CVV sa app na ito. Ang pagbabayad ay ipoproseso nang ligtas sa hosted checkout ng provider.',

  // Navigation & Shell
  'Overview': 'Pangkalahatang-ideya',
  'Departments': 'Mga Departamento',
  'Symptom Assessment': 'Pagsusuri ng Sintomas',
  'Sign In': 'Mag-sign In',
  'Sign In to TeleHealth': 'Mag-sign In sa TeleHealth',
  'Sign In to Portal': 'Pumasok sa Portal',
  'Language / Wika': 'Language / Wika',
  'Language': 'Wika',
  'Wika': 'Wika',
  'English': 'English',
  'Filipino / Tagalog': 'Filipino / Tagalog',
  'Filipino': 'Filipino',
  'Tagalog': 'Tagalog',
  'Doctor Availability': 'Iskedyul ng mga Doktor',
  'Prescriptions (Rx)': 'Mga Reseta (Rx)',
  'Patient Profile': 'Profile ng Pasyente',
  'Physician Calendar': 'Kalendaryo ng Doktor',
  'Request Reviews': 'Pagsusuri ng Kahilingan',
  'Schedule & Availability': 'Oras at Iskedyul',
  'Physician Profile': 'Profile ng Doktor',
  'Patient Management': 'Pamamahala ng Pasyente',
  'Doctor Management': 'Pamamahala ng Doktor',
  'Physician Leave': 'Bakasyon ng Doktor',
  'Physician Leave Approvals': 'Pag-apruba sa Leave ng Doktor',
  'Depts & Visit Types': 'Mga Departamento at Uri',
  'Departments & Visit Types': 'Mga Departamento at Uri ng Konsultasyon',
  'Prescriptions (Rx) Registry': 'Talaan ng mga Reseta (Rx)',
  'Audit Log': 'Log ng Sistema',
  'Notification & System Settings': 'Mga Setting ng Sistema at Abiso',
  'Clinical View': 'Pang-Klinikang Tanawin',
  'Back to Home': 'Bumalik sa Home',
  'Back to Sign In': 'Bumalik sa Sign In',
  '← Back to Sign In': '← Bumalik sa Sign In',
  'Close & Return': 'Isara at Bumalik',
  'Close': 'Isara',

  // Landing Page & Public Sections
  'Healthcare, made easier.': 'Pangangalagang medikal, mas pinadali.',
  'Book verified one-hour consultations, review real-time physician availability across specialized medical departments, and manage your clinical profile in one calm, trustworthy workspace.':
    'Mag-book ng beripikadong isang-oras na konsultasyon, tingnan ang real-time na iskedyul ng doktor sa mga espesyalistang departamento, at pamahalaan ang iyong medikal na profile sa isang mapagkakatiwalaang sistema.',
  'Live Clinic Schedule Snapshot': 'Kasalukuyang Iskedyul ng Klinika',
  'Standard 1-Hour Consultation Windows': 'Karaniwang 1-Oras na Konsultasyon',
  'Morning Roster': 'Iskedyul sa Umaga',
  'Afternoon Roster': 'Iskedyul sa Hapon',
  '4 × 1-Hour Slots': '4 × 1-Oras na Konsultasyon',
  'Attending Specialists Today': 'Mga Nangangalagang Espesyalista Ngayong Araw',
  'Clinical Departments & Services': 'Mga Medikal na Departamento at Serbisyo',
  'Configurable outpatient departments and standardized 60-minute consultation types.':
    'Mga departamento para sa outpatient at standardized na 60-minutong konsultasyon.',
  'Schedule by Department': 'Mag-iskedyul ayon sa Departamento',
  'Lead:': 'Namumuno:',
  'Book Slot →': 'Mag-book ng Oras →',

  // Departments & Services Descriptions
  'Cardiology & Vascular Care': 'Kardiyolohiya at Pangangalaga sa Ugat',
  'Internal & General Medicine': 'Internal at Pangkalahatang Medisina',
  'Dental & Oral Health': 'Pangangalaga sa Ngipin at Bibig',
  'Dermatology & Skin Sciences': 'Dermatolohiya at Agham ng Balat',
  'Diagnostics & Laboratory Services': 'Serbisyo sa Pagsusuri at Laboratoryo',
  'Comprehensive cardiovascular evaluation, hypertension management, and preventive heart screenings.':
    'Komprehensibong pagsusuri sa puso at ugat, pamamahala sa altapresyon, at pag-iwas sa sakit sa puso.',
  'Primary care consultations, chronic disease management, annual physicals, and acute symptom triage.':
    'Pangunahing konsultasyong medikal, pamamahala sa matagalang sakit, taunang eksaminasyon, at pagsusuri ng sintomas.',
  'Preventive dental examinations, oral diagnostics, restorative consultations, and periodontal care.':
    'Pang-iwas na eksaminasyon sa ngipin, pagsusuri sa bibig, konsultasyon sa pag-aayos ng ngipin, at pangangalaga sa gilagid.',
  'Clinical dermatology, rash and lesion diagnostics, eczema management, and teledermatology review.':
    'Klinikal na dermatolohiya, pagsusuri sa pantal at sugat sa balat, pamamahala sa eksema, at teledermatology.',
  'Blood panels, metabolic diagnostics, pre-procedure screening, and physician-guided lab result reviews.':
    'Pagsusuri sa dugo, metabolikong eksaminasyon, pagsusuri bago ang pamamaraan, at pagpapasuri ng resulta sa doktor.',

  // Appointment Types Descriptions
  'General Consultation': 'Pangkalahatang Konsultasyon',
  'Follow-up Consultation': 'Konsultasyon sa Pagsubaybay',
  'Laboratory Service': 'Serbisyo sa Laboratoryo',
  'Dental Consultation': 'Konsultasyon sa Ngipin',
  'General Check-up': 'Pangkalahatang Check-up',
  'Other Clinic-Approved Services': 'Iba pang Serbisyo ng Klinika',
  'Standard 60-minute clinical evaluation for new or ongoing health concerns.':
    'Karaniwang 60-minutong klinikal na pagsusuri para sa bago o kasalukuyang alalahanin sa kalusugan.',
  'Dedicated review of treatment progress, medication adjustments, or post-diagnostic results.':
    'Pagsusuri sa paggaling mula sa gamutan, pag-aayos ng dosis ng gamot, o mga resulta ng pagsusuri.',
  'Diagnostic specimen collection and clinical pathology consultation.':
    'Koleksyon ng sample para sa pagsusuri at konsultasyon sa patolohiya.',
  'Comprehensive oral examination, dental pain evaluation, and treatment planning.':
    'Komprehensibong eksaminasyon sa bibig at ngipin, pagsusuri sa sakit ng ngipin, at plano sa gagamutin.',
  'Preventive wellness screening, vital baseline review, and lifestyle health planning.':
    'Pang-iwas na pagsusuri sa kalusugan, pagtingin sa vital signs, at pagpaplano para sa malusog na pamumuhay.',
  'Specialized clinical clearance, second-opinion review, or multi-disciplinary coordination.':
    'Especial na klinikal na clearance, pangalawang opinyon ng doktor, o koordinasyon sa iba pang eksperto.',

  // Preparation Instructions
  'Bring your current medication list and any recent blood pressure or temperature logs.':
    'Dalhin ang listahan ng iyong kasalukuyang gamot at anumang nakaraang tala ng presyon ng dugo o lebel ng lagnat.',
  'Have your previous consultation reference number and symptom notes available.':
    'Ihanda ang reference number ng iyong nakaraang konsultasyon at mga tala tungkol sa iyong sintomas.',
  'Fast for 8–10 hours prior if lipid or fasting glucose panels are ordered. Water is permitted.':
    'Mag-ayuno ng 8–10 oras bago ang appointment kung may pagsusuri sa kolesterol o fasting blood sugar. Pinapayagan ang pag-inom ng tubig.',
  'Avoid eating 30 minutes prior and note any sensitivity to hot, cold, or pressure.':
    'Iwasang kumain 30 minuto bago ang appointment at itala kung nangingilo sa init, lamig, o panggigipit.',
  'Complete your medical history profile section at least 15 minutes before the session.':
    'Kumpletuhin ang seksyon ng iyong kasaysayang medikal nang hindi bababa sa 15 minuto bago ang session.',
  'Specify the exact nature of the requested clearance in the Reason for Visit field.':
    'Ilinaw ang eksaktong uri ng clearance na kailangan sa patlang ng Dahilan ng Pagbisita.',

  // Consultation Fee & Tier Labels
  'Covered by Clinic Plan / Standard Tier': 'Kasama sa Plan ng Klinika / Karaniwang Uri',
  'Dental Care Schedule': 'Iskedyul ng Pangangalaga sa Ngipin',
  'Specialist Consultation Tier': 'Uri para sa Konsultasyon sa Espesyalista',

  'TeleHealth Management System': 'TeleHealth Management System',
  'Outpatient & Clinical Scheduling Platform': 'Sistema ng Outpatient at Pang-Klinikang Iskedyul',
  'Privacy Policy': 'Patakaran sa Pagkapribado',
  'Terms & Conditions': 'Mga Tuntunin at Kundisyon',
  'Terms and Conditions': 'Mga Tuntunin at Kundisyon',
  'Contact: admintelehealth@gmail.com': 'Makipag-ugnayan: admintelehealth@gmail.com',
  'Privacy Policy & Patient Data Governance': 'Patakaran sa Pagkapribado at Pangangalaga ng Datos ng Pasyente',
  'Last Updated: October 2026 · TeleHealth Management System': 'Huling Na-update: Oktubre 2026 · TeleHealth Management System',
  'Terms and Conditions of Service': 'Mga Tuntunin at Kundisyon ng Serbisyo',
  'Standard Clinic Scheduling Rules & Patient Responsibilities': 'Mga Alituntunin sa Pag-iiskedyul at Pananagutan ng Pasyente',

  // Login & Registration
  'Sign in with your account email and password to access your portal.':
    'Mag-sign in gamit ang iyong email at password upang ma-access ang iyong portal.',
  'Please sign in or create an account to continue to your appointment booking.':
    'Mangyaring mag-sign in o gumawa ng account upang magpatuloy sa iyong pag-book ng konsultasyon.',
  'Booking intent preserved: You will be redirected directly to Book Appointment after signing in.':
    'Nai-save ang intensyon sa pag-book: Direktang dadalhin ka sa Pag-book ng Konsultasyon pagkatapos mag-sign in.',
  'Email Address': 'Email Address',
  'Enter your email address': 'Ilagay ang iyong email address',
  'Password': 'Password',
  'Enter your password': 'Ilagay ang iyong password',
  'Forgot password?': 'Nakalimutan ang password?',
  'Continue with Google': 'Magpatuloy gamit ang Google',
  'New patient to TeleHealth?': 'Bagong pasyente sa TeleHealth?',
  'Create Account': 'Gumawa ng Account',
  'Create Patient Account': 'Gumawa ng Account ng Pasyente',
  'Register once to manage your medical profile and book 1-hour clinic consultations.':
    'Magrehistro nang minsan upang pamahalaan ang iyong medikal na profile at mag-book ng 1-oras na konsultasyon sa klinika.',
  'Full Legal Name': 'Buong Pangalan',
  'Enter full legal name': 'Ilagay ang buong pangalan',
  'Contact Number': 'Numero ng Telepono',
  'Create Password': 'Gumawa ng Password',
  'Minimum 6 characters': 'Hindi bababa sa 6 na karakter',
  'Re-enter new password': 'Ipasok muli ang bagong password',
  'I agree to the': 'Sumasang-ayon ako sa',
  'and': 'at',
  'Create Account & Continue': 'Gumawa ng Account at Magpatuloy',
  'Already have a patient or clinician account?': 'Mayroon ka na bang account ng pasyente o doktor?',
  'Reset Account Password via Google OTP': 'I-reset ang Password ng Account sa pamamagitan ng Google OTP',
  'Enter your registered Google / Gmail address to receive a real 6-digit One-Time Password (OTP) in your Gmail inbox.':
    'Ilagay ang iyong rehistradong Google / Gmail address upang makatanggap ng totoong 6-digit One-Time Password (OTP) sa iyong Gmail inbox.',
  '1. Send OTP': '1. Magpadala ng OTP',
  '2. Verify OTP': '2. Kumpirmahin ang OTP',
  '3. New Password': '3. Bagong Password',
  'Registered Google / Email Address': 'Rehistradong Google / Email Address',
  'Send 6-Digit OTP to Google Email': 'Ipadala ang 6-Digit OTP sa Google Email',
  'Sending OTP to Gmail...': 'Ipinapadala ang OTP sa Gmail...',
  'Enter 6-Digit OTP Code': 'Ilagay ang 6-Digit OTP Code',
  '6-Digit OTP Sent to Gmail': 'Naipadala na ang 6-Digit OTP sa Gmail',
  'Resend OTP': 'Muling Ipadala ang OTP',
  'Verify OTP Code': 'Kumpirmahin ang OTP Code',
  'New Password': 'Bagong Password',
  'Confirm New Password': 'Kumpirmahin ang Bagong Password',
  'Update Password': 'I-update ang Password',
  'Password Reset Complete': 'Tapos na ang Pag-reset ng Password',
  'Proceed to Sign In': 'Magpatuloy sa Pag-sign In',
  'Confirm Sending OTP via Gmail': 'Kumpirmahin ang Pagpapadala ng OTP sa Gmail',

  // Validation & Error Messages
  'Please enter your full name.': 'Mangyaring ilagay ang iyong buong pangalan.',
  'Please enter a valid email address.': 'Mangyaring maglagay ng wastong email address.',
  'Please enter your password.': 'Mangyaring ilagay ang iyong password.',
  'Password must be at least 6 characters.': 'Ang password ay dapat hindi bababa sa 6 na karakter.',
  'Passwords do not match.': 'Hindi magkatugma ang mga password.',
  'Passwords do not match. Please re-enter.': 'Hindi magkatugma ang mga password. Mangyaring ipasok muli.',
  'Invalid email or password.': 'Maling email o password.',
  'Please complete all required fields (password minimum 6 characters).':
    'Mangyaring kumpletuhin ang lahat ng kinakailangang field (hindi bababa sa 6 na karakter ang password).',
  'You must agree to the Terms and Privacy Policy to create an account.':
    'Kailangan mong sumang-ayon sa Mga Tuntunin at Patakaran sa Pagkapribado upang makagawa ng account.',
  'Please enter your registered Google / email address.':
    'Mangyaring ilagay ang iyong rehistradong Google o email address.',
  'Please enter the 6-digit OTP code sent to your Google email.':
    'Mangyaring ilagay ang 6-digit OTP code na ipinadala sa iyong Google email.',
  'Invalid OTP code. Please check the 6-digit code sent to your Google inbox.':
    'Maling OTP code. Pakitingnan ang 6-digit code na ipinadala sa iyong Google inbox.',
  'Please select an appointment date.': 'Mangyaring pumili ng petsa ng konsultasyon.',
  'Please select an available time slot.': 'Mangyaring pumili ng bakanteng oras.',
  'Please select an attending physician.': 'Mangyaring pumili ng doktor.',
  'Please select an appointment type.': 'Mangyaring pumili ng uri ng konsultasyon.',
  'Please enter your reason for visit.': 'Mangyaring ilagay ang dahilan ng iyong pagpapatingin.',
  'Please select a department.': 'Mangyaring pumili ng departamento.',
  'Full Name is required.': 'Kailangan ang Buong Pangalan.',
  'Date of Birth is required.': 'Kailangan ang Petsa ng Kapanganakan.',
  'Future birth dates are not valid.': 'Hindi tanggap ang petsa sa hinaharap.',
  'Please enter a valid Date of Birth.': 'Mangyaring maglagay ng wastong Petsa ng Kapanganakan.',
  'Enter a valid contact number (e.g., +1 (415) 555-0194).': 'Maglagay ng wastong numero ng telepono.',
  'Valid email address is required.': 'Kailangan ang wastong email address.',
  'Please choose a medical department.': 'Mangyaring pumili ng medikal na departamento.',
  'Please select a preferred doctor.': 'Mangyaring pumili ng gustong doktor.',
  'Please select an appointment service type.': 'Mangyaring pumili ng uri ng serbisyo.',
  'Please choose a valid current or future date.': 'Mangyaring pumili ng kasalukuyan o darating na petsa.',
  'Please choose an available 1-hour time slot on the calendar.': 'Mangyaring pumili ng bakanteng 1-oras na konsultasyon sa kalendaryo.',
  'Please describe your reason for visit / chief complaint (at least 8 characters).':
    'Mangyaring ilarawan ang dahilan ng iyong pagbisita (hindi bababa sa 8 karakter).',
  'You must agree to the Terms and Privacy Policy before proceeding.':
    'Kailangan mong sumang-ayon sa Mga Tuntunin at Patakaran sa Pagkapribado bago magpatuloy.',
  'Slot conflict detected: This 1-hour slot was just reserved or blocked. Please select another available slot.':
    'May kaparehong iskedyul: Ang 1-oras na slot na ito ay na-reserve o na-block na. Mangyaring pumili ng iba.',

  // Stepper & Booking Wizard Steps
  '1. Personal Info': '1. Personal na Info',
  '2. Medical History': '2. Kasaysayang Medikal',
  '3. Visit Details': '3. Detalye ng Pagbisita',
  '4. Calendar Date': '4. Petsa sa Kalendaryo',
  '5. Select Time': '5. Pumili ng Oras',
  'Verify your personal and contact information.': 'Suriin ang iyong personal at pangkontak na impormasyon.',
  'Provide allergies, active medications, and medical background.': 'Magbigay ng impormasyon sa alerhiya, gamot, at kasaysayang medikal.',
  'Choose department, attending doctor, service type, and chief complaint.': 'Pumili ng departamento, doktor, uri ng serbisyo, at dahilan ng pagpatingin.',
  'Pick an available date on the doctor availability calendar.': 'Pumili ng bakanteng petsa sa kalendaryo ng doktor.',
  'Select a 1-hour appointment time slot and confirm your booking.': 'Pumili ng 1-oras na oras at kumpirmahin ang pagpaparehistro.',
  'Next: Medical History': 'Susunod: Kasaysayang Medikal',
  'Next: Visit Details': 'Susunod: Detalye ng Pagbisita',
  'Next: Calendar Date': 'Susunod: Petsa sa Kalendaryo',
  'Next: Select Time': 'Susunod: Pumili ng Oras',
  'Review & Proceed to Confirmation': 'Suriin at Magpatuloy sa Kumpirmasyon',
  'Review Appointment Summary': 'Suriin ang Buod ng Konsultasyon',
  'Verify your clinical intake details and 1-hour slot reservation before submitting to the server.':
    'Suriin ang iyong impormasyon at napiling 1-oras na slot bago isumite.',
  'Edit Information': 'Baguhin ang Impormasyon',
  'Patient Name': 'Pangalan ng Pasyente',
  'Verified Contact & Email': 'Beripikadong Kontak at Email',
  'Department & Attending Physician': 'Departamento at Doktor',
  'Reserved 1-Hour Slot': 'Nakalaang 1-Oras na Slot',
  'Appointment Service Type': 'Uri ng Serbisyo sa Konsultasyon',
  'Applicable Initial Booking Status': 'Katayuan ng Pag-book',
  'Reason for Visit / Chief Complaint': 'Dahilan ng Pagbisita / Pangunahing Sintomas',
  'Submit Booking Request': 'Isumite ang Kahilingan sa Pag-book',
  'Appointment Request Submitted': 'Naipadala na ang Kahilingan sa Konsultasyon',
  'Next Steps & Preparation': 'Mga Susunod na Hakbang at Paghahanda',
  'Go to My Appointments': 'Pumunta sa Aking mga Appointment',
  'Return to Dashboard': 'Bumalik sa Dashboard',
  'Real-Time Doctor Availability Calendar': 'Kasalukuyang Kalendaryo ng Bakanteng Doktor',
  'Inspect 1-hour morning (7 AM–11 AM) and afternoon (1 PM–5 PM) slots across departments before booking.':
    'Tingnan ang mga 1-oras na slot sa umaga (7 AM–11 AM) at hapon (1 PM–5 PM) bago mag-book.',
  'Continue to 50/50 Booking Form': 'Magpatuloy sa Form ng Pag-book',

  // Additional Booking Wizard & Form Labels
  'Select Outpatient Department': 'Pumili ng Departamento',
  'Select Department': 'Pumili ng Departamento',
  'Select Attending Physician & Visit Type': 'Pumili ng Doktor at Uri ng Konsultasyon',
  'Select Attending Physician': 'Pumili ng Doktor',
  'Select Physician': 'Pumili ng Doktor',
  'Select Appointment Type': 'Pumili ng Uri ng Konsultasyon',
  'Select Visit Type': 'Pumili ng Uri ng Konsultasyon',
  'Choose Date & 1-Hour Time Slot': 'Pumili ng Petsa at 1-Oras na Konsultasyon',
  'Choose Consultation Date': 'Pumili ng Petsa ng Konsultasyon',
  'Medical Intake & Reason for Visit': 'Medikal na Impormasyon at Dahilan ng Pagbisita',
  'Review & Confirm Booking': 'Suriin at Kumpirmahin ang Pag-book',
  'Review Booking Details': 'Suriin ang Detalye ng Konsultasyon',
  'Reason for Visit': 'Dahilan ng Pagpapatingin',
  'Enter the primary reason for your consultation...': 'Ilagay ang pangunahing dahilan ng iyong konsultasyon...',
  'Describe your symptoms or medical concerns': 'Ilarawan ang iyong mga sintomas o medikal na alalahanin',
  'I confirm that the information provided is accurate and agree to clinic scheduling terms':
    'Kinukumpirma ko na totoo ang impormasyong ibinigay at sumasang-ayon ako sa mga tuntunin ng klinika',
  'Confirm & Book Appointment': 'Kumpirmahin at I-book ang Konsultasyon',
  'Confirm Booking': 'Kumpirmahin ang Pag-book',
  'Booking Confirmed!': 'Kumpirmado na ang Pag-book!',
  'Appointment Reference Number': 'Numero ng Reperensiya ng Konsultasyon',
  'Keep this reference number for your clinic check-in.':
    'Itago ang reference number na ito para sa iyong check-in sa klinika.',
  'Next Available Doctor': 'Susunod na Bakanteng Doktor',
  'Next Step': 'Susunod na Hakbang',
  'Previous Step': 'Nakaraang Hakbang',
  'Back': 'Bumalik',
  'Next': 'Susunod',
  'Intersex / Other': 'Intersex / Iba pa',
  'Sex (Clinic Policy Options)': 'Kasarian (Ayon sa Alituntunin ng Klinika)',
  'Medical Department': 'Medikal na Departamento',
  'Select a Department...': 'Pumili ng Departamento...',
  'Select a Doctor...': 'Pumili ng Doktor...',
  'Select Service Type...': 'Pumili ng Uri ng Serbisyo...',
  'Personal & Contact Information': 'Personal at Pangkontak na Impormasyon',
  'Clinical Safety & Medical Background': 'Kaligtasang Klinikal at Kasaysayang Medikal',
  'Appointment Details & Chief Complaint': 'Mga Detalye ng Konsultasyon at Dahilan ng Pagbisita',
  'Editable': 'Maaaring Baguhin',
  'Saved Profile Prefilled': 'Awtomatikong Naipuno mula sa Na-save na Profile',
  'Select your medical department, preferred physician, service type, and reason for visit.':
    'Pumili ng departamento, gustong doktor, uri ng serbisyo, at dahilan ng pagpatingin.',
  'Walk-In': 'Personal na Pagpunta (Walk-In)',

  // Prescriptions (Reseta / e-Rx)
  'Medical Prescriptions (Reseta / e-Rx)': 'Mga Reseta sa Gamot (Reseta / e-Rx)',
  'Official physician-issued medical prescriptions, dosage instructions, and clinical treatment orders.':
    'Opisyal na reseta ng doktor, tagubilin sa dosis ng gamot, at mga utos sa gamutan.',
  'My Prescriptions (e-Rx)': 'Aking mga Reseta (e-Rx)',
  'No Medical Prescriptions Yet': 'Wala Pang mga Reseta',
  'Your attending physician’s digital reseta (e-Rx) and medication instructions will appear here after your consultation.':
    'Ang digital na reseta (e-Rx) at tagubilin sa gamot ng iyong doktor ay lalabas dito pagkatapos ng konsultasyon.',
  '✓ Ready to Print': '✓ Handa nang I-print',
  '• Awaiting Doctor': '• Naghihintay sa Doktor',
  'TeleHealth Medical Center · Official Medical Prescription (Reseta)': 'TeleHealth Medical Center · Opisyal na Reseta ng Gamot (Reseta)',
  'PRESCRIBED MEDICATIONS & SIG. INSTRUCTIONS (RESETA)': 'MGA RESETA AT TAGUBILIN SA GAMOT (RESETA)',
  '1. Active Medication Regimen on File:': '1. Aktibong Gamot sa File:',
  '2. Physician Prescription Orders & Dosage Schedule (Sig.):': '2. Reseta at Iskedyul ng Dosis ng Doktor (Sig.):',
  'As directed by attending physician during consultation.': 'Ayon sa tagubilin ng doktor sa panahon ng konsultasyon.',
  'Your attending physician has not finalized the post-consultation Reseta yet. Once the consultation is marked Completed, your full medication and dosage instructions will appear here.':
    'Hindi pa natatapos ng iyong doktor ang reseta pagkatapos ng konsultasyon. Kapag naipasa na itong Tapos Na, lalabas dito ang buong tagubilin sa gamot.',
  'Save Reseta PNG image': 'I-save ang larawan ng Reseta (PNG)',
  'Download official Reseta PDF': 'I-download ang opisyal na Reseta PDF',

  // Appointments List & Details
  'All Statuses': 'Lahat ng Katayuan',
  'Search by reference (TH-2026-...), doctor, or department...': 'Maghanap gamit ang reference (TH-2026-...), doktor, o departamento...',
  'No Matching Appointments Found': 'Walang Natagpuang Tumutugmang Konsultasyon',
  'You don’t have any appointments matching the current filters. Reset filters or schedule a new 1-hour consultation.':
    'Wala kang konsultasyon na tumutugma sa kasalukuyang filter. I-reset ang filter o mag-iskedyul ng bago.',
  'Reset Filters': 'I-reset ang mga Filter',
  'Book New Appointment': 'Mag-book ng Bagong Konsultasyon',
  'Appointment Record Details': 'Mga Detalye ng Konsultasyon',
  'Current Workflow Status': 'Kasalukuyang Katayuan',
  'Appointment Date': 'Petsa ng Konsultasyon',
  '1-Hour Time Slot': '1-Oras na Konsultasyon',
  'Authorized Post-Consultation Summary': 'Pinahintulutang Buod Pagkatapos ng Konsultasyon',
  'Rejection Reason': 'Dahilan ng Pagtanggi',
  'Cancellation Reason': 'Dahilan ng Pagkansela',
  'Reschedule Reason': 'Dahilan ng Pagpapalipat',
  'Reschedule Slot': 'Ilipat ang Oras',

  // Patient Dashboard & Portal
  'Manage Personal Info →': 'Pamahalaan ang Personal na Impormasyon →',
  'Patient Profile Completion:': 'Pagkumpleto ng Profile ng Pasyente:',
  'Allergies & Medications Verified': 'Beripikado ang mga Alerhiya at Gamot',
  'Your Next Appointment': 'Ang Iyong Susunod na Konsultasyon',
  'Attending Physician': 'Nangangalagang Doktor',
  'Consultation Type': 'Uri ng Konsultasyon',
  'Appointment Mode': 'Paraan ng Konsultasyon',
  'Online Appointment': 'Online na Konsultasyon',
  'Online Appointment (Google Meet)': 'Online na Konsultasyon (Google Meet)',
  'Face-to-Face Clinic Visit': 'Personal na Pagpunta sa Klinika',
  'Consultation Date & Time': 'Araw at Oras ng Konsultasyon',
  'Clinic Room Location': 'Lokasyon ng Kwarto sa Klinika',
  'Online Consultation — Google Meet Link': 'Online na Konsultasyon — Google Meet Link',
  'Meeting Room URL:': 'URL ng Silid ng Pulong:',
  'Join Google Meet Video Consultation': 'Pumasok sa Google Meet Video Konsultasyon',
  'Ready to Join': 'Handa nang Sumali',
  'Awaiting Physician Confirmation': 'Naghihintay ng Kumpirmasyon ng Doktor',
  'Upcoming Consultations': 'Mga Paparating na Konsultasyon',
  'Upcoming Appointments': 'Mga Paparating na Konsultasyon',
  'Past Consultation History': 'Kasaysayan ng mga Nakaraang Konsultasyon',
  'No upcoming appointments found.': 'Walang natagpuang paparating na konsultasyon.',
  'View Details': 'Tingnan ang Detalye',
  'Free Priority Reschedule': 'Libreng Pagpapalipat ng Iskedyul',
  'Stay in Priority Queue': 'Manatili sa Priority Queue',
  'Cancel Appointment': 'Kanselahin ang Appointment',
  'Reschedule': 'Ilipat ang Iskedyul',
  'Reschedule Appointment': 'Ilipat ang Iskedyul',
  'Manage personal and emergency contact information': 'Pamahalaan ang personal at pang-emerhensiyang impormasyon',
  'Sex': 'Kasarian',
  'Date of Birth': 'Petsa ng Kapanganakan',
  'Emergency Contact Name': 'Pangalan ng Pang-emerhensiyang Kontak',
  'Emergency Contact Phone': 'Telepono ng Pang-emerhensiyang Kontak',
  'Emergency Contact Relationship': 'Relasyon sa Pasyente',
  'Male': 'Lalaki',
  'Female': 'Babae',
  'Prefer not to disclose': 'Mas pinipiling huwag sabihin',
  'Known Allergies': 'Mga Alerhiya',
  'Known Drug or Food Allergies': 'Mga Alerhiya sa Gamot o Pagkain',
  'None reported': 'Walang naiulat',
  'Current Medications': 'Mga Kasalukuyang Gamot',
  'Active Prescriptions & Dosages': 'Mga Aktibong Reseta at Dosis',
  'Existing Medical Conditions': 'Mga Kasalukuyang Sakit o Kondisyon',
  'Chronic or Existing Conditions': 'Mga Matagal Nang Karamdaman',
  'Past Surgeries or Hospitalizations': 'Mga Nakaraang Operasyon o Pagka-ospital',
  'Save Profile': 'I-save ang Profile',
  'Profile Updated': 'Na-update na ang Profile',

  // Booking Flow
  '50/50 Appointment Booking & Doctor Availability': 'Pag-book ng Konsultasyon at Iskedyul ng Doktor',
  'Available Time Slots': 'Mga Bakanteng Oras',
  'Morning Schedule': 'Iskedyul sa Umaga',
  'Afternoon Schedule': 'Iskedyul sa Hapon',

  // Doctor Portal
  "Today's Scheduled Consultations": 'Mga Naka-iskedyul na Konsultasyon Ngayong Araw',
  'Pending Appointment Requests': 'Mga Nakabinbing Kahilingan sa Konsultasyon',
  'Pending Requests': 'Mga Nakabinbing Kahilingan',
  'Total Completed Consultations': 'Kabuuang Natapos na Konsultasyon',
  'Active Prescriptions Issued': 'Aktibong Inilabas na mga Reseta',
  'Approve Appointment': 'Aprubahan ang Konsultasyon',
  'Reject Request': 'Tanggihan ang Kahilingan',
  'Reject Appointment': 'Tanggihan ang Konsultasyon',
  'Write Prescription': 'Sumulat ng Reseta',
  'Mark Completed': 'Markahan bilang Tapos Na',
  'Save Internal Notes': 'I-save ang mga Tala ng Doktor',
  'Doctor Internal Notes': 'Mga Tala ng Doktor',
  'Consultation Summary': 'Buod ng Konsultasyon',
  'Working Days': 'Mga Araw ng Pagtatrabaho',
  'Morning Hours': 'Oras sa Umaga',
  'Afternoon Hours': 'Oras sa Hapon',
  'Consultation Fee': 'Bayad sa Konsultasyon',
  'License Number': 'Numero ng Lisensya',
  'Physician Bio': 'Talambuhay ng Doktor',
  'Professional Biography': 'Propesyonal na Talambuhay',
  'Availability Calendar': 'Kalendaryo ng Bakanteng Oras',
  'Live Doctor Schedule': 'Live na Iskedyul ng Doktor',
  'Submit Leave Block': 'Magsumite ng Kahilingan sa Leave',
  'Leave Request': 'Kahilingan sa Leave',
  'Slot Block': 'Harang sa Oras (Slot Block)',
  'Break Override': 'Override sa Break',
  'Reason for Leave': 'Dahilan ng Leave',

  // Admin Portal & System Settings
  'System Settings & Clinic Policies': 'Mga Setting ng Sistema at Alituntunin ng Klinika',
  'Configure clinic hours, cancellation policies, and patient scheduling permissions.':
    'I-configure ang oras ng klinika, patakaran sa kanselasyon, at mga permiso ng pasyente.',
  'System Language & Localization Settings': 'Mga Setting ng Wika at Lokalisasyon ng Sistema',
  'Language Preference / Pagpili ng Wika (English / Tagalog)': 'Pagpili ng Wika (English / Tagalog)',
  'Clinic Name': 'Pangalan ng Klinika',
  'System Timezone': 'Timezone ng Sistema',
  'Default Slot Duration': 'Karaniwang Haba ng Konsultasyon',
  'Minimum Cancellation Notice Hours': 'Oras ng Paunang Paalala sa Kanselasyon',
  'Allow Patient Reschedule': 'Pahintulutan ang Pasyente na Magpalipat ng Iskedyul',
  'Require Email Verification': 'Kailanganin ang Beripikasyon ng Email',
  'In-App Notifications': 'Mga Abiso sa Loob ng App',
  'Email Gateway Status': 'Katayuan ng Email Gateway',
  'Django Backend Status': 'Katayuan ng Django Backend',
  'Total Registered Patients': 'Kabuuang Rehistradong Pasyente',
  'Active Consultations Today': 'Aktibong Konsultasyon Ngayong Araw',
  'Pending Physician Reviews': 'Nakabinbing Pagsusuri ng Doktor',
  'System Uptime & Google Sync': 'Katayuan ng Sistema at Google Sync',
  'Audit Log Entries': 'Mga Tala sa Log ng Sistema',
  'Actor Name': 'Pangalan ng Gumawa',
  'Actor Role': 'Tungkulin ng Gumawa',
  'Action': 'Aksyon',
  'Target Type': 'Uri ng Target',
  'Target Reference': 'Reperensiya ng Target',
  'Details': 'Mga Detalye',
  'Timestamp': 'Oras at Petsa',

  // Statuses & Badges
  'Confirmed': 'Kumpirmado',
  'Pending': 'Nakabinbin',
  'Rejected': 'Tinanggihan',
  'Rescheduled': 'Nailipat ang Iskedyul',
  'Reschedule Requested': 'Humihiling ng Pagpapalipat',
  'Cancelled': 'Kanselado',
  'Completed': 'Natapos Na',
  'Active': 'Aktibo',
  'On Leave': 'Naka-leave',
  'Inactive': 'Hindi Aktibo',
  'Resigned': 'Nagbitiw Na',
  'Booked': 'Naka-book Na',
  'Blocked': 'Nakaharang',
  'Unavailable': 'Hindi Available',
  'Fully Booked': 'Puno Na',
  'Doctor Unavailable': 'Hindi Available ang Doktor',
  'Past': 'Nakalipas Na',
  'Approved': 'Naaprubahan',
  'Pending Approval': 'Naghihintay ng Pag-apruba',

  // Notifications
  'All Notifications': 'Lahat ng Abiso',
  'Unread': 'Hindi pa Nababasa',
  'Read': 'Nabasa Na',
  'Mark as Read': 'Markahan bilang Nabasa Na',
  'Mark All as Read': 'Markahan Lahat bilang Nabasa',
  'View All': 'Tingnan Lahat',
  'No notifications for your account yet.': 'Walang mga abiso para sa iyong account sa ngayon.',
  'New Appointment Request': 'Bagong Kahilingan sa Konsultasyon',
  'Appointment Confirmation': 'Kumpirmasyon ng Konsultasyon',
  'Appointment Rejection': 'Pagtanggi sa Konsultasyon',
  'Appointment Rescheduling': 'Pagpapalipat ng Konsultasyon',
  'Appointment Cancellation': 'Pagkansela sa Konsultasyon',
  'Upcoming Appointment Reminder': 'Paalala sa Paparating na Konsultasyon',
  'Consultation Queue Delay': 'Kakaunting Pagkaantala sa Konsultasyon',
  'Doctor Schedule Change': 'Pagbabago sa Iskedyul ng Doktor',
  'Account & Profile': 'Account at Profile',

  // AI Symptom Assessment
  'AI Assistant · Pre-Consultation Medical Guidance': 'AI Assistant · Gabay Medikal Bago ang Konsultasyon',
  'TeleHealth Pre-Visit Symptom Assessment': 'TeleHealth Pre-Visit Pagsusuri ng Sintomas',
  'Provides recommended actions, risks if ignored, first-aid (paunang lunas), and specialist doctor matching.':
    'Nagbibigay ng mga inirerekomendang aksyon, panganib kung pababayaan, paunang lunas, at pagtutugma sa espesyalistang doktor.',
  'Type your symptoms or medical questions...': 'I-type ang iyong mga sintomas o medikal na katanungan...',
  'Describe your symptoms here...': 'Ilarawan ang iyong mga sintomas dito...',
  'Send': 'Ipadala',
  'Sending...': 'Ipinapadala...',
  'Chief Symptoms': 'Pangunahing mga Sintomas',
  'Recommended Actions': 'Mga Inirerekomendang Aksyon',
  'Risks if Ignored': 'Mga Panganib Kung Pababayaan',
  'First-Aid Guidance (Paunang Lunas)': 'Paunang Lunas (First Aid)',
  'Specialist Doctor Matching': 'Pagtutugma sa Espesyalistang Doktor',
  'Predicted Urgency Level': 'Tinatayang Antas ng Pagkaapurahan',
  'Routine': 'Karaniwang Konsultasyon (Routine)',
  'Prompt Consultation Recommended': 'Inirerekomendang Magpatingin Agad',
  'Urgent Evaluation Advised': 'Nangangailangan ng Mabilisang Pagsusuri',
  'Recommended Department': 'Inirerekomendang Departamento',
  'Recommended Specialist': 'Inirerekomendang Espesyalista',
  'Privacy & Doctor Sharing Permission': 'Pribasiya at Pahintulot na Makita ng Doktor',
  'Authorize my attending doctor to view this symptom intake summary alongside my appointment booking.':
    'Pahintulutan ang aking doktor na makita ang buod ng aking sintomas kasabay ng aking appointment booking.',
  'Start Video Call': 'Simulan ang Video Call',
  'Meeting Link': 'Link sa Pulong',
  'Patient Queue': 'Pila ng mga Pasyente',
  'Estimated Wait Time': 'Tinatayang Oras ng Paghihintay',

  // Prescriptions (Rx)
  'Print Prescription': 'I-print ang Reseta',
  'Download PDF': 'I-download ang PDF',
  'Download as Image': 'I-download bilang Larawan',
  'Print': 'I-print',
  'Prescription Details': 'Mga Detalye ng Reseta',
  'Issued By': 'Inisyu Ni',
  'Date Issued': 'Petsa ng Pagkaka-isyu',
  'Dosage & Frequency': 'Dosis at Dalas ng Pag-inom',
  'Special Instructions': 'Espesyal na Tagubilin',

  // Modals & Confirmations
  'Confirm Sign Out': 'Kumpirmahin ang Pag-sign Out',
  'End current TeleHealth session': 'Tapusin ang kasalukuyang session sa TeleHealth',
  'Sign Out to Public Landing': 'Mag-sign Out sa Home',
  'Are you sure you want to sign out of your current session? Any unsaved form changes will be cleared.':
    'Sigurado ka bang nais mong mag-sign out sa kasalukuyang session? Mawawala ang anumang hindi pa na-save na pagbabago.',
  'Confirm Appointment Cancellation': 'Kumpirmahin ang Pagkansela ng Konsultasyon',
  'Are you sure you want to cancel this appointment?': 'Sigurado ka bang nais mong kanselahin ang konsultasyong ito?',
  'Please provide a reason for cancellation:': 'Mangyaring magbigay ng dahilan para sa pagkansela:',
  'Confirm Rejection': 'Kumpirmahin ang Pagtanggi',
  'Are you sure you want to reject this appointment request?':
    'Sigurado ka bang nais mong tanggihan ang kahilingang ito sa konsultasyon?',
  'Reason for rejection:': 'Dahilan ng pagtanggi:',
  'TeleHealth Privacy Policy & Clinical Data Protection': 'Patakaran sa Pagkapribado at Proteksyon ng Datos sa TeleHealth',
  'Effective October 2026 · Healthcare Data Governance': 'May Bisa Simula Oktubre 2026 · Pamamahala ng Datos sa Kalusugan',
  'Terms & Conditions of Clinical Scheduling': 'Mga Tuntunin at Kundisyon sa Pag-iiskedyul',
  'Outpatient & TeleHealth Consultation Agreement': 'Kasunduan sa Outpatient at TeleHealth na Konsultasyon',
  '1-Hour Exclusive Slot Allocation': 'Eksklusibong 1-Oras na Konsultasyon',
  'Cancellation & Rescheduling Policy': 'Patakaran sa Kanselasyon at Pagpapalipat ng Iskedyul',
  'Non-Emergency Medical Disclaimer': 'Paalala sa Hindi Pang-emerhensiyang Medikal na Serbisyo',
  'Least-Privilege Medical Data Access': 'Protektado at Limitadong Pag-access sa Datos Medikal',
};

// Word / sub-phrase replacement rules applied to sentences with dynamic content
const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  // Core actions & links
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bBook an Appointment\b/gi, 'Magpa-iskedyul ng Konsultasyon'],
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bBook Appointment\b/g, 'Magpa-iskedyul ng Konsultasyon'],
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bSign In to Portal\b/gi, 'Pumasok sa Portal'],
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bSign In\b/g, 'Mag-sign In'],
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bSign Out\b/g, 'Mag-logout'],
  [/(?<![Mm]ag-)(?<![Mm]ag\s)\bLog Out\b/gi, 'Mag-logout'],
  [/\bSave Changes\b/gi, 'I-save ang mga Pagbabago'],
  [/\bCancel Appointment\b/gi, 'Kanselahin ang Appointment'],
  [/\bCancel\b/gi, 'Kanselahin'],
  [/\bSubmit Booking\b/gi, 'Isumite ang Pagpa-iskedyul'],
  [/\bSubmit\b/gi, 'Isumite'],
  [/\bSearch appointments\b/gi, 'Maghanap ng appointment'],
  [/\bSearch doctors\b/gi, 'Maghanap ng doktor'],
  [/\bSearch\b/gi, 'Maghanap'],
  [/\bSelect Date\b/gi, 'Pumili ng Petsa'],
  [/\bChoose Consultation Date\b/gi, 'Pumili ng Petsa'],
  [/\bNo Available Schedule\b/gi, 'Walang Bakanteng Iskedyul'],
  [/\bNo slots available on this date\b/gi, 'Walang Bakanteng Iskedyul sa petsang ito'],
  [/\bNo slots available\b/gi, 'Walang Bakanteng Iskedyul'],
  [/\bAvailable Time Slots\b/gi, 'Mga Bakanteng Oras'],
  [/\bAvailable\b/gi, 'May Bakanteng Oras'],
  [/\bPatient Information\b/gi, 'Impormasyon ng Pasyente'],
  [/\bPrevious Medical History\b/gi, 'Kasaysayang Medikal'],
  [/\bMedical History\b/gi, 'Kasaysayang Medikal'],
  [/\bNotification Center\b/gi, 'Sentro ng mga Abiso'],
  [/\bNotifications\b/gi, 'Mga Abiso'],
  [/\bSystem Settings\b/gi, 'Mga Setting ng Sistema'],
  [/\bNotification & System Settings\b/gi, 'Mga Setting ng Sistema at Abiso'],
  [/\bSettings\b/gi, 'Mga Setting'],
  [/\bDoctors\b/gi, 'Mga Doktor'],
  [/\bMy Appointments\b/gi, 'Aking mga Appointment'],
  [/\bAppointments & Scheduling\b/gi, 'Mga Appointment at Iskedyul'],
  [/\bAppointments\b/gi, 'Mga Appointment'],
  [/\bPatient Dashboard\b/gi, 'Pangunahing Pahina ng Pasyente'],
  [/\bDoctor Dashboard\b/gi, 'Pangunahing Pahina ng Doktor'],
  [/\bAdmin Dashboard\b/gi, 'Pangunahing Pahina ng Admin'],
  [/\bDashboard\b/gi, 'Pangunahing Pahina'],

  [/\bCreate Account\b/gi, 'Gumawa ng Account'],
  [/\bCreate Patient Account\b/gi, 'Gumawa ng Account ng Pasyente'],
  [/\bForgot password\?/gi, 'Nakalimutan ang password?'],
  [/\bTerms and Conditions\b/gi, 'Mga Tuntunin at Kundisyon'],
  [/\bTerms & Conditions\b/gi, 'Mga Tuntunin at Kundisyon'],
  [/\bPrivacy Policy\b/gi, 'Patakaran sa Pagkapribado'],
  [/\bBack to Home\b/gi, 'Bumalik sa Home'],
  [/\bBack to Sign In\b/gi, 'Bumalik sa Sign In'],
  [/\bView Details\b/gi, 'Tingnan ang Detalye'],
  [/\bReschedule Appointment\b/gi, 'Ilipat ang Iskedyul'],
  [/\bApprove Appointment\b/gi, 'Aprubahan ang Konsultasyon'],
  [/\bReject Request\b/gi, 'Tanggihan ang Kahilingan'],
  [/\bWrite Prescription\b/gi, 'Sumulat ng Reseta'],
  [/\bMark Completed\b/gi, 'Markahan bilang Tapos Na'],

  // Portals & Nav items
  [/\bDoctor Availability\b/gi, 'Iskedyul ng mga Doktor'],
  [/\bPrescriptions \(Rx\)\b/gi, 'Mga Reseta (Rx)'],
  [/\bPatient Profile\b/gi, 'Profile ng Pasyente'],
  [/\bPhysician Calendar\b/gi, 'Kalendaryo ng Doktor'],
  [/\bRequest Reviews\b/gi, 'Pagsusuri ng Kahilingan'],
  [/\bSchedule & Availability\b/gi, 'Oras at Iskedyul'],
  [/\bPhysician Profile\b/gi, 'Profile ng Doktor'],
  [/\bPatient Management\b/gi, 'Pamamahala ng Pasyente'],
  [/\bDoctor Management\b/gi, 'Pamamahala ng Doktor'],
  [/\bPhysician Leave\b/gi, 'Bakasyon ng Doktor'],
  [/\bDepts & Visit Types\b/gi, 'Mga Departamento at Uri'],
  [/\bDepartments & Visit Types\b/gi, 'Mga Departamento at Uri ng Konsultasyon'],
  [/\bAudit Log\b/gi, 'Log ng Sistema'],
  [/\bClinical View\b/gi, 'Pang-Klinikang Tanawin'],

  // Consultation Terms
  [/\bUpcoming Appointments\b/gi, 'Mga Paparating na Konsultasyon'],
  [/\bUpcoming Consultations\b/gi, 'Mga Paparating na Konsultasyon'],
  [/\bPast Consultation History\b/gi, 'Kasaysayan ng mga Nakaraang Konsultasyon'],
  [/\bAttending Physician\b/gi, 'Nangangalagang Doktor'],
  [/\bAttending Specialists Today\b/gi, 'Mga Nangangalagang Espesyalista Ngayong Araw'],
  [/\bConsultation Type\b/gi, 'Uri ng Konsultasyon'],
  [/\bAppointment Mode\b/gi, 'Paraan ng Konsultasyon'],
  [/\bOnline Appointment\b/gi, 'Online na Konsultasyon'],
  [/\bFace-to-Face Clinic Visit\b/gi, 'Personal na Pagpunta sa Klinika'],
  [/\bReason for Visit\b/gi, 'Dahilan ng Pagpapatingin'],
  [/\bChief Symptoms\b/gi, 'Pangunahing mga Sintomas'],
  [/\bRecommended Actions\b/gi, 'Mga Inirerekomendang Aksyon'],
  [/\bRisks if Ignored\b/gi, 'Mga Panganib Kung Pababayaan'],
  [/\bFirst-Aid Guidance\b/gi, 'Paunang Lunas (First Aid)'],

  // Clinical profile fields
  [/\bFull Legal Name\b/gi, 'Buong Pangalan'],
  [/\bContact Number\b/gi, 'Numero ng Telepono'],
  [/\bDate of Birth\b/gi, 'Petsa ng Kapanganakan'],
  [/\bKnown Allergies\b/gi, 'Mga Alerhiya'],
  [/\bCurrent Medications\b/gi, 'Mga Kasalukuyang Gamot'],
  [/\bExisting Medical Conditions\b/gi, 'Mga Kasalukuyang Sakit o Kondisyon'],
  [/\bEmergency Contact Name\b/gi, 'Pangalan ng Pang-emerhensiyang Kontak'],
  [/\bEmergency Contact Phone\b/gi, 'Telepono ng Pang-emerhensiyang Kontak'],
  [/\bEmergency Contact Relationship\b/gi, 'Relasyon sa Pasyente'],
  [/\bEmergency Contact Information\b/gi, 'Impormasyon ng Pang-emerhensiyang Kontak'],

  // Stats & Headings
  [/\bTotal Completed Consultations\b/gi, 'Kabuuang Natapos na Konsultasyon'],
  [/\bActive Prescriptions Issued\b/gi, 'Aktibong Inilabas na mga Reseta'],
  [/\bTotal Registered Patients\b/gi, 'Kabuuang Rehistradong Pasyente'],
  [/\bActive Consultations Today\b/gi, 'Aktibong Konsultasyon Ngayong Araw'],
  [/\bPending Physician Reviews\b/gi, 'Nakabinbing Pagsusuri ng Doktor'],
  [/\bSystem Uptime & Google Sync\b/gi, 'Katayuan ng Sistema at Google Sync'],
  [/\bLive Clinic Schedule Snapshot\b/gi, 'Kasalukuyang Iskedyul ng Klinika'],
  [/\bMorning Roster\b/gi, 'Iskedyul sa Umaga'],
  [/\bAfternoon Roster\b/gi, 'Iskedyul sa Hapon'],
  [/\bClinical Departments & Services\b/gi, 'Mga Medikal na Departamento at Serbisyo'],

  // Days and months
  [/\bMonday\b/gi, 'Lunes'],
  [/\bTuesday\b/gi, 'Martes'],
  [/\bWednesday\b/gi, 'Miyerkules'],
  [/\bThursday\b/gi, 'Huwebes'],
  [/\bFriday\b/gi, 'Biyernes'],
  [/\bSaturday\b/gi, 'Sabado'],
  [/\bSunday\b/gi, 'Linggo'],
];

export function translateToTagalog(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Never alter single brand wordmark
  if (trimmed === 'TeleHealth' || trimmed === 'admintelehealth@gmail.com' || trimmed === 'telehealthotp@gmail.com') {
    return text;
  }

  // 1. Direct Exact Sentence Map
  if (EXACT_SENTENCE_MAP[trimmed]) {
    const leading = text.match(/^\s*/)?.[0] || '';
    const trailing = text.match(/\s*$/)?.[0] || '';
    return leading + EXACT_SENTENCE_MAP[trimmed] + trailing;
  }

  // 2. Dynamic sentence patterns:
  // "Welcome back, {name}" -> "Maligayang pagbabalik, {name}"
  if (trimmed.startsWith('Welcome back, ')) {
    const name = trimmed.replace('Welcome back, ', '');
    return `Maligayang pagbabalik, ${name}`;
  }

  // "Step X of Y" -> "Hakbang X ng Y"
  if (/^Step\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
    return trimmed.replace(/Step\s+(\d+)\s+of\s+(\d+)/i, 'Hakbang $1 ng $2');
  }

  // "X Attending Physician(s)" -> "X Nangangalagang Doktor"
  if (/^(\d+)\s+Attending Physician\(s\)$/i.test(trimmed)) {
    return trimmed.replace(/(\d+)\s+Attending Physician\(s\)/i, '$1 Nangangalagang Doktor');
  }

  // "Notifications (X Unread)" -> "Mga Abiso (X Hindi pa Nababasa)"
  if (/^Notifications\s*\((\d+)\s*Unread\)$/i.test(trimmed)) {
    return trimmed.replace(/Notifications\s*\((\d+)\s*Unread\)/i, 'Mga Abiso ($1 Hindi pa Nababasa)');
  }

  // "X Unread" -> "X Hindi pa Nababasa"
  if (/^(\d+)\s+Unread$/i.test(trimmed)) {
    return `${trimmed.split(' ')[0]} Hindi pa Nababasa`;
  }

  // "X Appointments Today" -> "X Konsultasyon Ngayong Araw"
  if (/^(\d+)\s+Appointments\s+Today$/i.test(trimmed)) {
    return trimmed.replace(/(\d+)\s+Appointments\s+Today/i, '$1 Konsultasyon Ngayong Araw');
  }

  // "Enter the 6-digit verification code sent to {email} from {sender}."
  if (trimmed.includes('6-digit verification code sent to')) {
    return trimmed
      .replace('Enter the 6-digit verification code sent to', 'Ilagay ang 6-digit verification code na ipinadala sa')
      .replace('from', 'mula kay');
  }

  // "A 6-digit verification code has been sent to"
  if (trimmed.includes('6-digit verification code has been sent to')) {
    return trimmed
      .replace('A 6-digit verification code has been sent to', 'Ang 6-digit verification code ay naipadala na sa')
      .replace(
        'Please check your Gmail inbox (and Sent/Spam folder) and enter the code below.',
        'Mangyaring tingnan ang iyong Gmail inbox (at Sent/Spam folder) at ilagay ang code sa ibaba.'
      );
  }

  // "OTP verified. Create and confirm your new account password below."
  if (trimmed.includes('OTP verified. Create and confirm your new account password below.')) {
    return 'Na-verify na ang OTP. Gumawa at kumpirmahin ang iyong bagong password sa ibaba.';
  }

  // "Your account password has been successfully updated."
  if (trimmed.includes('Your account password has been successfully updated.')) {
    return 'Matagumpay nang na-update ang password ng iyong account.';
  }

  // 3. Fallback phrase replacements for sentences that contain known phrases
  let replaced = text;
  let hasReplaced = false;
  for (const [pattern, rep] of PHRASE_REPLACEMENTS) {
    if (pattern.test(replaced)) {
      replaced = replaced.replace(pattern, rep);
      hasReplaced = true;
    }
  }

  if (hasReplaced) {
    replaced = replaced.replace(/\b[Mm]ag-[Mm]ag[- ]*sign[- ]*in\b/gi, 'Mag-sign In');
    replaced = replaced.replace(/\b[Mm]ag-[Mm]ag\b/gi, 'Mag');
    return replaced;
  }

  return text;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isTagalog: false,
  t: (text: string, fallback?: string) => fallback || text,
});

// Storage WeakMaps so we preserve English originals across DOM re-renders without mutations
const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'tl' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tl' : 'en');
  };

  const isTagalog = language === 'tl';

  // Helper function for direct React string translations
  const t = (text: string, fallback?: string): string => {
    if (!isTagalog) return fallback || text;
    return translateToTagalog(text);
  };

  // Full-DOM Auto-Translation Effect: Automatically translates all supported interface text
  useEffect(() => {
    let isTranslating = false;

    const translateDom = () => {
      if (isTranslating) return;
      isTranslating = true;

      try {
        const rootEl = document.getElementById('root') || document.body;
        if (!rootEl) return;

        // TreeWalker for text nodes
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (
              tag === 'script' ||
              tag === 'style' ||
              tag === 'code' ||
              tag === 'pre' ||
              tag === 'noscript'
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('[translate="no"], .notranslate')) {
              return NodeFilter.FILTER_REJECT;
            }
            if (!node.nodeValue || !node.nodeValue.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let currentNode = walker.nextNode();
        while (currentNode) {
          if (isTagalog) {
            // Save original English if not already saved
            if (!originalTextMap.has(currentNode)) {
              originalTextMap.set(currentNode, currentNode.nodeValue || '');
            }
            const orig = originalTextMap.get(currentNode) || '';
            const translated = translateToTagalog(orig);
            if (translated !== currentNode.nodeValue) {
              currentNode.nodeValue = translated;
            }
          } else {
            // Restore English
            if (originalTextMap.has(currentNode)) {
              const orig = originalTextMap.get(currentNode);
              if (orig !== undefined && orig !== currentNode.nodeValue) {
                currentNode.nodeValue = orig;
              }
            }
          }
          currentNode = walker.nextNode();
        }

        // Also translate input/textarea placeholders
        const inputs = rootEl.querySelectorAll('input[placeholder], textarea[placeholder]');
        inputs.forEach((inputEl) => {
          const el = inputEl as HTMLInputElement | HTMLTextAreaElement;
          if (isTagalog) {
            if (!originalPlaceholderMap.has(el)) {
              originalPlaceholderMap.set(el, el.placeholder);
            }
            const origPh = originalPlaceholderMap.get(el) || '';
            const translatedPh = translateToTagalog(origPh);
            if (translatedPh !== el.placeholder) {
              el.placeholder = translatedPh;
            }
          } else {
            if (originalPlaceholderMap.has(el)) {
              const origPh = originalPlaceholderMap.get(el);
              if (origPh !== undefined && origPh !== el.placeholder) {
                el.placeholder = origPh;
              }
            }
          }
        });

        // Translate title attributes
        const titledEls = rootEl.querySelectorAll('[title]');
        titledEls.forEach((el) => {
          const title = el.getAttribute('title');
          if (!title) return;
          if (isTagalog) {
            if (!originalTitleMap.has(el)) {
              originalTitleMap.set(el, title);
            }
            const orig = originalTitleMap.get(el) || '';
            const translated = translateToTagalog(orig);
            if (translated !== title) {
              el.setAttribute('title', translated);
            }
          } else {
            if (originalTitleMap.has(el)) {
              const orig = originalTitleMap.get(el);
              if (orig !== undefined && orig !== title) {
                el.setAttribute('title', orig);
              }
            }
          }
        });
      } finally {
        isTranslating = false;
      }
    };

    // Run initial translation immediately
    translateDom();

    // Attach MutationObserver to dynamically translate any newly rendered sentences,
    // modals, step updates, notifications, and form errors
    let animationFrameId: number | null = null;
    const observer = new MutationObserver(() => {
      if (isTranslating) return;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        translateDom();
      });
    });

    const rootTarget = document.getElementById('root') || document.body;
    if (rootTarget) {
      observer.observe(rootTarget, {
        childList: true,
        subtree: true,
        characterData: true, // Listens for text node changes from React state updates
      });
    }

    return () => {
      observer.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  }, [isTagalog]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isTagalog,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
