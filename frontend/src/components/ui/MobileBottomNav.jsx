import React from 'react';
import { NavLink } from 'react-router-dom';

export function MobileBottomNav({ links }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 sm:hidden">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.exact}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-full h-full space-y-1
              ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                  {link.icon}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {link.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
