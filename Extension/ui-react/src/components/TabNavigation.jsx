import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, Briefcase } from 'lucide-react'

const TabNavigation = ({ children, defaultTab = "articles" }) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-3 bg-gray-100/50 p-0.5 h-7">
        <TabsTrigger 
          value="articles" 
          className="flex items-center justify-center text-xs font-medium data-[state=active]:bg-white min-w-0 px-0.5"
        >
          <FileText size={10} className="flex-shrink-0" />
          <span className="tab-full-text truncate text-xs ml-0.5">History</span>
          <span className="tab-short-text text-xs hidden">H</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="community" 
          className="flex items-center justify-center text-xs font-medium data-[state=active]:bg-white min-w-0 px-0.5"
        >
          <Briefcase size={10} className="flex-shrink-0" />
          <span className="tab-full-text truncate text-xs ml-0.5">Portfolio</span>
          <span className="tab-short-text text-xs hidden">F</span>
        </TabsTrigger>
      </TabsList>

      {React.Children.map(children, (child, index) => {
        const tabValues = ["articles", "community"]
        return (
          <TabsContent 
            key={tabValues[index]} 
            value={tabValues[index]}
            className="focus:outline-none mt-0"
          >
            {child}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

export default TabNavigation