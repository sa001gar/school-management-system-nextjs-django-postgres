'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  tabs: TabItem[];
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue: string;
  onChange?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ tabs, defaultValue, onChange, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const handleChange = React.useCallback(
    (id: string) => {
      setActiveTab(id);
      onChange?.(id);
    },
    [onChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange, tabs }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn('flex border-b border-gray-200', className)}
      {...props}
    />
  )
);
TabList.displayName = 'TabList';

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
}

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ id, className, children, ...props }, ref) => {
    const { activeTab, setActiveTab, tabs } = useTabs();
    const isActive = activeTab === id;
    const item = tabs.find((t) => t.id === id);

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${id}`}
        onClick={() => setActiveTab(id)}
        className={cn(
          'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
          isActive
            ? 'border-amber-600 text-amber-700'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          className
        )}
        {...props}
      >
        {children ?? item?.label}
      </button>
    );
  }
);
Tab.displayName = 'Tab';

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
}

const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ id, className, ...props }, ref) => {
    const { activeTab } = useTabs();
    if (activeTab !== id) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${id}`}
        aria-labelledby={`tab-${id}`}
        tabIndex={0}
        className={cn('py-4', className)}
        {...props}
      />
    );
  }
);
TabPanel.displayName = 'TabPanel';

function TabPanels({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { Tabs, TabList, Tab, TabPanel, TabPanels };
