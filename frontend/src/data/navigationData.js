import { Table, Code2, FileSpreadsheet } from 'lucide-react';

export const agentNavItems = [
  { id: 'sheets', label: 'Local Sheets', icon: Table },
  { id: 'sandbox', label: 'Code Sandbox', icon: Code2 },
];

export const defaultActionChips = [
  {
    label: 'Cost Calculation Sheet',
    icon: FileSpreadsheet,
    color: 'text-cyan-400',
    view: 'sheets',
  },
  {
    label: 'Python Sandbox Run',
    icon: Code2,
    color: 'text-emerald-400',
    view: 'sandbox',
  },
];
