import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading data...', size = 'default' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className={`animate-spin text-blue-600 ${size === 'large' ? 'w-10 h-10' : 'w-7 h-7'}`} />
      {text && <p className="text-sm font-medium mt-3 text-slate-600">{text}</p>}
    </div>
  );
};
