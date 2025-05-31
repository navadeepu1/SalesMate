import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { downloadFile, createEnhancedCSV } from "@/lib/exportUtils";

interface ExportButtonProps {
  data: any[];
  filename: string;
  title: string;
  headers: string[];
  formatRow: (item: any) => string[];
  summaryInfo?: string[];
  disabled?: boolean;
}

export function ExportButton({ 
  data, 
  filename, 
  title, 
  headers, 
  formatRow, 
  summaryInfo = [],
  disabled = false 
}: ExportButtonProps) {
  
  const handleCSVExport = () => {
    const rows = data.map(formatRow);
    const csvContent = createEnhancedCSV([headers, ...rows], title, summaryInfo);
    downloadFile(csvContent, `${filename}.csv`);
  };

  const handleTSVExport = () => {
    const rows = data.map(formatRow);
    const headerInfo = [
      [title],
      [`Generated on: ${new Date().toLocaleString()}`],
      ...summaryInfo.map(info => [info]),
      ['']
    ];
    
    const tsvContent = [...headerInfo, [headers], ...rows.map(row => [row])]
      .map(row => row.join('\t'))
      .join('\n');
      
    downloadFile(tsvContent, `${filename}.tsv`, 'text/tab-separated-values;charset=utf-8;');
  };

  if (disabled || data.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Export (No Data)
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export ({data.length} records)
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleCSVExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTSVExport}>
          <FileText className="mr-2 h-4 w-4" />
          Export as TSV (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}