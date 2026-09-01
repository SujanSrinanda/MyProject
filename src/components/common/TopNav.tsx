import React from 'react';
import { Home, Send, History, ShieldCheck, Users, User } from 'lucide-react';

interface TopNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentRoute, onNavigate }) => {
  const items = [
    { label: 'Home', route: '/', icon: Home },
    { label: 'Pay Hub', route: '/pay', icon: Send },
    { label: 'Activity', route: '/activity', icon: History },
    { label: 'Safety Center', route: '/safety', icon: ShieldCheck },
    { label: 'Contacts', route: '/contacts', icon: Users },
    { label: 'Profile', route: '/profile', icon: User },
  ];

  return (
    <div className="hidden md:block bg-white border-b-2 border-black py-2 px-8">
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route || (item.route !== '/' && currentRoute.startsWith(item.route));

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7C3AED] text-white border-black neo-shadow-sm'
                  : 'bg-white text-black border-transparent hover:border-black/30 hover:bg-[#F5F1E8]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

