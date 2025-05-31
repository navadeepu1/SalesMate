import { ChartLine, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartLine className="text-primary text-2xl h-8 w-8" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-foreground">Daily Sales Reporter</h1>
              <p className="text-sm text-muted-foreground">Business Data Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Manager</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <UserCircle className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
