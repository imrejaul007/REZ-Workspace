'use client';

import { Deal } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StageChip } from './StageChip';
import { DealTable } from '@/components/ui/table';
import { DealTableHeader, DealTableBody, DealTableRow, DealTableHead, DealTableCell } from './DealTableElements';
import { MoreHorizontal, Eye, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DealTableProps {
  deals: Deal[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onViewDeal?: (deal: Deal) => void;
}

export function DealsTable({
  deals,
  sortColumn,
  sortDirection,
  onSort,
  onViewDeal,
}: DealTableProps) {
  const handleSort = (column: string) => {
    onSort?.(column);
  };

  const SortIcon = ({ column }: { column: string }) => (
    <ArrowUpDown
      className={`ml-2 h-4 w-4 ${
        sortColumn === column ? 'text-primary' : 'text-muted-foreground'
      }`}
    />
  );

  return (
    <DealTable>
      <DealTableHeader>
        <DealTableRow>
          <DealTableHead className="w-[120px]">
            <button
              onClick={() => handleSort('dealId')}
              className="flex items-center hover:text-primary"
            >
              Deal ID <SortIcon column="dealId" />
            </button>
          </DealTableHead>
          <DealTableHead>
            <button
              onClick={() => handleSort('property')}
              className="flex items-center hover:text-primary"
            >
              Property <SortIcon column="property" />
            </button>
          </DealTableHead>
          <DealTableHead>
            <button
              onClick={() => handleSort('customer')}
              className="flex items-center hover:text-primary"
            >
              Customer <SortIcon column="customer" />
            </button>
          </DealTableHead>
          <DealTableHead>
            <button
              onClick={() => handleSort('broker')}
              className="flex items-center hover:text-primary"
            >
              Broker <SortIcon column="broker" />
            </button>
          </DealTableHead>
          <DealTableHead>
            <button
              onClick={() => handleSort('stage')}
              className="flex items-center hover:text-primary"
            >
              Stage <SortIcon column="stage" />
            </button>
          </DealTableHead>
          <DealTableHead className="text-right">
            <button
              onClick={() => handleSort('value')}
              className="flex items-center ml-auto hover:text-primary"
            >
              Value <SortIcon column="value" />
            </button>
          </DealTableHead>
          <DealTableHead>
            <button
              onClick={() => handleSort('createdAt')}
              className="flex items-center hover:text-primary"
            >
              Date <SortIcon column="createdAt" />
            </button>
          </DealTableHead>
          <DealTableHead className="w-[50px]"></DealTableHead>
        </DealTableRow>
      </DealTableHeader>
      <DealTableBody>
        {deals.map((deal) => (
          <DealTableRow key={deal.id}>
            <DealTableCell className="font-mono text-xs">
              {deal.dealId}
            </DealTableCell>
            <DealTableCell>
              <div>
                <p className="font-medium text-sm">{deal.property.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {deal.property.address}
                </p>
              </div>
            </DealTableCell>
            <DealTableCell>
              <div>
                <p className="text-sm">{deal.customer.name}</p>
                <p className="text-xs text-muted-foreground">{deal.customer.phone}</p>
              </div>
            </DealTableCell>
            <DealTableCell className="text-sm">{deal.broker.name}</DealTableCell>
            <DealTableCell>
              <StageChip stage={deal.stage} size="sm" />
            </DealTableCell>
            <DealTableCell className="text-right font-medium">
              {formatCurrency(deal.value)}
            </DealTableCell>
            <DealTableCell className="text-sm text-muted-foreground">
              {formatDate(deal.createdAt)}
            </DealTableCell>
            <DealTableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/deals/${deal.id}`} className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DealTableCell>
          </DealTableRow>
        ))}
      </DealTableBody>
    </DealTable>
  );
}
