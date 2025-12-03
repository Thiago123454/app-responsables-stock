import React from 'react';

const PageLayout = ({ title, subtitle, children, actions }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm sm:text-base text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    <div className="w-full">{children}</div>
  </div>
);

export default PageLayout;