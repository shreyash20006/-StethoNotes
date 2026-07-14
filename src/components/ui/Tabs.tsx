import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
  variant?: 'default' | 'pills';
}

const Tabs = ({
  items,
  defaultTab,
  className,
  variant = 'default',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  const tabVariants = {
    default: 'border-b border-gray-200',
    pills: 'bg-gray-100 rounded-lg p-1 flex gap-1',
  };

  const buttonVariants = {
    default: 'pb-4 border-b-2 border-transparent data-[active=true]:border-accent data-[active=true]:text-accent',
    pills: 'px-4 py-2 rounded-lg data-[active=true]:bg-white data-[active=true]:shadow-sm',
  };

  return (
    <div className={className}>
      <div className={cn('flex gap-4 md:gap-6', tabVariants[variant])}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            data-active={activeTab === item.id}
            className={cn(
              'font-medium text-sm transition-all duration-200 whitespace-nowrap',
              activeTab === item.id ? 'text-accent' : 'text-gray-500 hover:text-gray-700',
              buttonVariants[variant]
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {items.find((item) => item.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;
