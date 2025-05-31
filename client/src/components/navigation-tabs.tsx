import { PlusCircle, History } from "lucide-react";
import { Link, useLocation } from "wouter";

const tabs = [
  { id: "entry", label: "Daily Entry", icon: PlusCircle, path: "/" },
  { id: "history", label: "Historical Data", icon: History, path: "/history" },
];

export function NavigationTabs() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <Link key={tab.id} href={tab.path}>
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
