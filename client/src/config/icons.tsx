import { 
  FaMoneyBillWave, 
  FaGamepad, 
  FaGraduationCap, 
  FaBriefcase, 
  FaShieldAlt, 
  FaUsers,
  FaCode,
  FaCrown,
  FaStar,
  FaClipboardList,
  FaWallet,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaSync,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaChartLine,
  FaTrophy,
  FaMedal,
  FaAward,
  FaCertificate,
  FaIdCard,
  FaUserShield,
  FaLock,
  FaUnlock,
  FaInfoCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaExternalLinkAlt
} from 'react-icons/fa';

import {
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineBadgeCheck,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineTag
} from 'react-icons/hi';

import {
  MdVerified,
  MdSecurity,
  MdDashboard,
  MdCategory,
  MdDescription
} from 'react-icons/md';

// Category Icons
export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Finance: FaMoneyBillWave,
  Gaming: FaGamepad,
  Education: FaGraduationCap,
  Work_Experience: FaBriefcase,
  KYC_Basic: FaShieldAlt,
  Social_Reputation: FaUsers,
  Technical_Skills: FaCode,
  Leadership: FaCrown,
  Contribution: FaStar,
  Other: FaClipboardList,
  default: FaStar
};

// Action Icons
export const ACTION_ICONS = {
  refresh: HiOutlineRefresh,
  add: FaPlus,
  edit: FaEdit,
  delete: FaTrash,
  view: FaEye,
  back: FaArrowLeft,
  external: FaExternalLinkAlt,
  sync: FaSync
};

// Status Icons
export const STATUS_ICONS = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  loading: FaSpinner,
  verified: MdVerified,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
  locked: FaLock,
  unlocked: FaUnlock
};

// Feature Icons
export const FEATURE_ICONS = {
  wallet: FaWallet,
  chart: FaChartLine,
  trophy: FaTrophy,
  medal: FaMedal,
  award: FaAward,
  certificate: FaCertificate,
  idCard: FaIdCard,
  userShield: FaUserShield,
  security: MdSecurity,
  dashboard: MdDashboard,
  document: HiOutlineDocumentText,
  userGroup: HiOutlineUserGroup,
  badgeCheck: HiOutlineBadgeCheck,
  chartBar: HiOutlineChartBar,
  clock: HiOutlineClock,
  calendar: HiOutlineCalendar,
  tag: HiOutlineTag,
  category: MdCategory,
  description: MdDescription
};

// Helper function to get category icon
export const getCategoryIcon = (category: string): React.ComponentType<{ className?: string }> => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
};

// Category colors (keep existing)
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Finance: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  Gaming: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' },
  Education: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  Work_Experience: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  KYC_Basic: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500' },
  Social_Reputation: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-500' },
  Technical_Skills: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-500' },
  Leadership: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  Contribution: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-500' },
  Other: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' }
};

export const getCategoryStyle = (category: string) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
};
