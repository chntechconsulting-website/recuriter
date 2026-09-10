export const CATEGORIES = [
  'College',
  'Training Center',
  'NGO & Community',
  'Vendors'
];

export const CATEGORY_SUBCATEGORIES = {
  'College': [
    'Arts and Science College',
    'Engineering College',
    'Pharmacy / Medical / Paramedical College',
    'Polytechnic / Diploma College',
    'Industrial Training Institute (ITI)',
    'Management / Law College',
    'Other College'
  ],
  'Training Center': [
    'Skill Development / Vocational Center',
    'IT & Software Training Institute',
    'Technical / Mechanical / CAD Training',
    'Textile & Apparel Training Center',
    'Banking, Finance & Soft Skills Center',
    'Government Training Partner (NSDC/TNSDC)',
    'Healthcare & Nursing Training Center',
    'Other Training Center'
  ],
  'NGO & Community': [
    'NGO / Non-Profit Organization',
    'Community & Youth Center',
    'Charitable Trust / Foundation',
    'Rural Development & SHG Partner',
    'Other NGO / Community Partner'
  ],
  'Vendors': [
    'Staffing & Sourcing Agency',
    'Recruitment Vendor / Sub-Vendor',
    'Corporate Placement Partner',
    'Manpower Consultancy',
    'Other Sourcing Vendor'
  ]
};

export const INSTITUTION_TYPES = CATEGORIES;
export const INDUSTRIES = CATEGORIES;
export const VENDOR_CATEGORIES = CATEGORIES;

export const LEAD_STATUSES = [
  { value: 'YET_TO_CONNECT', label: 'Yet to Connected', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'CONNECTED', label: 'Connected', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'INTERESTED', label: 'Interested', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'NO_RESPONSE', label: 'No Response', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'MOU_SIGNED', label: 'MOU Signed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

export const ZONES = [
  'ALL',
  'Chennai Zone',
  'Madurai Zone',
  'Coimbatore Zone',
  'Tiruchirappalli Zone',
  'Salem Zone',
  'Tirunelveli Zone',
  'Vellore Zone',
  'Thanjavur Zone'
];

export const DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivagangai',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
  'Other'
];

export const DISTRICT_METADATA = [
  { siNo: 1, district: 'Tiruvannamalai', priority: 'High', assignedTo: 'Karthikeyan' },
  { siNo: 2, district: 'Villupuram', priority: 'High', assignedTo: 'Sakthivel' },
  { siNo: 3, district: 'Ariyalur', priority: 'High', assignedTo: 'Deepanraj' },
  { siNo: 4, district: 'Perambalur', priority: 'High', assignedTo: 'Mohanapriya' },
  { siNo: 5, district: 'Nagapattinam', priority: 'High', assignedTo: 'Rithika' },
  { siNo: 6, district: 'Tiruvarur', priority: 'High', assignedTo: 'Karthikeyan' },
  { siNo: 7, district: 'Kallakurichi', priority: 'High', assignedTo: 'Sakthivel' },
  { siNo: 8, district: 'Ramanathapuram', priority: 'High', assignedTo: 'Deepanraj' },
  { siNo: 9, district: 'Sivaganga', priority: 'High', assignedTo: 'Mohanapriya' },
  { siNo: 10, district: 'Mayiladuthurai', priority: 'High', assignedTo: 'Rithika' },
  { siNo: 11, district: 'Dharmapuri', priority: 'High', assignedTo: 'Deepanraj' },
  { siNo: 12, district: 'Pudukkottai', priority: 'High', assignedTo: 'Sakthivel' },
  { siNo: 13, district: 'Tenkasi', priority: 'High', assignedTo: 'Karthikeyan' },
  { siNo: 14, district: 'Theni', priority: 'High', assignedTo: 'Mohanapriya' },
  { siNo: 15, district: 'Dindigul', priority: 'High', assignedTo: 'Rithika' },
  { siNo: 16, district: 'Cuddalore', priority: 'High', assignedTo: 'Karthikeyan' },
  { siNo: 17, district: 'Virudhunagar', priority: 'High', assignedTo: 'Sakthivel' },
  { siNo: 18, district: 'Thanjavur', priority: 'High', assignedTo: 'Deepanraj' },
  { siNo: 19, district: 'Thoothukudi', priority: 'High', assignedTo: 'Mohanapriya' },
  { siNo: 20, district: 'Tirunelveli', priority: 'High', assignedTo: 'Rithika' },
  { siNo: 21, district: 'Vellore', priority: 'High', assignedTo: 'Karthikeyan' },
  { siNo: 22, district: 'Tirupathur', priority: 'High', assignedTo: 'Sakthivel' },
  { siNo: 23, district: 'Krishnagiri', priority: 'Medium', assignedTo: 'Deepanraj' },
  { siNo: 24, district: 'Salem', priority: 'Medium', assignedTo: 'Mohanapriya' },
  { siNo: 25, district: 'Madurai', priority: 'Medium', assignedTo: 'Rithika' },
  { siNo: 26, district: 'Tiruchirappalli', priority: 'Medium', assignedTo: 'Karthikeyan' },
  { siNo: 27, district: 'Kanniyakumari', priority: 'Medium', assignedTo: 'Sakthivel' },
  { siNo: 28, district: 'Nilgiris', priority: 'Medium', assignedTo: 'Deepanraj' },
  { siNo: 29, district: 'Karur', priority: 'Medium', assignedTo: 'Mohanapriya' },
  { siNo: 30, district: 'Namakkal', priority: 'Medium', assignedTo: 'Rithika' },
  { siNo: 31, district: 'Erode', priority: 'Medium', assignedTo: 'Karthikeyan' },
  { siNo: 32, district: 'Ranipet', priority: 'Medium', assignedTo: 'Sakthivel' },
  { siNo: 33, district: 'Kanchipuram', priority: 'Low', assignedTo: 'Deepanraj' },
  { siNo: 34, district: 'Chengalpattu', priority: 'Low', assignedTo: 'Mohanapriya' },
  { siNo: 35, district: 'Tiruvallur', priority: 'Low', assignedTo: 'Rithika' },
  { siNo: 36, district: 'Tiruppur', priority: 'Low', assignedTo: 'Karthikeyan' },
  { siNo: 37, district: 'Coimbatore', priority: 'Low', assignedTo: 'Sakthivel' },
  { siNo: 38, district: 'Chennai', priority: 'Low', assignedTo: 'Deepanraj' }
];

export const SOURCING_CHANNELS = [
  'Field Visit',
  'Direct Outreach',
  'Job Fair Sourcing',
  'College Referral',
  'Website / Inbound',
  'WhatsApp Campaign',
  'Email Campaign',
  'Phone Call Campaign',
  'Government Directory',
  'Partner Network',
  'Social Media / LinkedIn',
  'Alumni Network'
];

export const LEAD_SOURCES = SOURCING_CHANNELS;

export const FOLLOW_UP_TYPES = [
  'Phone Call',
  'Campus / Center Visit',
  'Virtual Meeting / Zoom',
  'WhatsApp Message',
  'Email Reminder',
  'MOU Discussion',
  'Job Fair Registration'
];

export const FOLLOWUP_TYPES = FOLLOW_UP_TYPES;

export const COMMUNICATION_TYPES = [
  'Phone Call',
  'Campus / Field Visit',
  'WhatsApp Message',
  'Email Sent',
  'Meeting / Discussion',
  'MOU / Agreement Handover',
  'Job Fair Coordination'
];

export const CANDIDATE_STATUSES = [
  { value: 'NEW', label: 'New Candidate', color: 'blue', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'CONTACTED', label: 'Contacted', color: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'SCREENED', label: 'Profile Screened', color: 'amber', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'indigo', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'SELECTED', label: 'Selected / Shortlisted', color: 'emerald', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'PLACED', label: 'Placed / Hired', color: 'green', bg: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'rose', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'REJECTED', label: 'Rejected', color: 'slate', bg: 'bg-slate-100 text-slate-800 border-slate-200' }
];

export const QUALIFICATIONS = [
  'B.E / B.Tech (Engineering)',
  'Diploma / Polytechnic',
  'ITI (Technical Trade)',
  'B.Sc / M.Sc (Science)',
  'B.Com / M.Com (Commerce)',
  'BBA / MBA (Management)',
  'BCA / MCA (Computer Applications)',
  'B.A / M.A (Arts & Humanities)',
  'Higher Secondary (12th / PUC)',
  'SSLC (10th Standard)',
  'Other Degree / Certification'
];

export const EXPERIENCE_TYPES = [
  'Fresher',
  'Experienced (0-1 Year)',
  'Experienced (1-3 Years)',
  'Experienced (3-5 Years)',
  'Experienced (5+ Years)'
];

export const PASSOUT_YEARS = [
  '2027 (Pursuing)',
  '2026 (Final Year)',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  'Before 2020'
];
