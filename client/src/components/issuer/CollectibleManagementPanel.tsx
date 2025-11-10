import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  MoreVertical,
  Pause,
  Play,
  Edit,
  BarChart3,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Infinity,
} from 'lucide-react';
import { format } from 'date-fns';
import type { CollectibleTemplate } from '@/types/collectible';
import { EligibilityType, RarityTier } from '@/types/collectible';

interface CollectibleManagementPanelProps {
  collectibles: CollectibleTemplate[];
  loading?: boolean;
  onPause?: (templateId: number) => Promise<void>;
  onResume?: (templateId: number) => Promise<void>;
  onEditMetadata?: (templateId: number) => void;
  onViewAnalytics?: (templateId: number) => void;
  onViewPreview?: (templateId: number) => void;
  onManageWhitelist?: (templateId: number) => void;
}

const RARITY_CONFIG = {
  [RarityTier.COMMON]: { name: 'Common', color: 'text-gray-600' },
  [RarityTier.UNCOMMON]: { name: 'Uncommon', color: 'text-green-600' },
  [RarityTier.RARE]: { name: 'Rare', color: 'text-blue-600' },
  [RarityTier.EPIC]: { name: 'Epic', color: 'text-purple-600' },
  [RarityTier.LEGENDARY]: { name: 'Legendary', color: 'text-orange-600' },
};

const ELIGIBILITY_LABELS = {
  [EligibilityType.OPEN]: 'Open',
  [EligibilityType.WHITELIST]: 'Whitelist',
  [EligibilityType.TOKEN_HOLDER]: 'Token',
  [EligibilityType.PROFILE_REQUIRED]: 'Profile',
};

type SortField = 'templateId' | 'category' | 'claims' | 'supply' | 'status';
type SortOrder = 'asc' | 'desc';

export function CollectibleManagementPanel({
  collectibles,
  loading,
  onPause,
  onResume,
  onEditMetadata,
  onViewAnalytics,
  onViewPreview,
  onManageWhitelist,
}: CollectibleManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('templateId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Filter and sort collectibles
  const filteredCollectibles = useMemo(() => {
    let filtered = [...collectibles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.templateId.toString().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((c) => c.isActive && !c.isPaused);
      } else if (statusFilter === 'paused') {
        filtered = filtered.filter((c) => c.isPaused);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((c) => !c.isActive);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'templateId':
          aVal = a.templateId;
          bVal = b.templateId;
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'claims':
          aVal = a.currentSupply;
          bVal = b.currentSupply;
          break;
        case 'supply':
          aVal = a.maxSupply === 0 ? Infinity : a.maxSupply - a.currentSupply;
          bVal = b.maxSupply === 0 ? Infinity : b.maxSupply - b.currentSupply;
          break;
        case 'status':
          aVal = a.isActive && !a.isPaused ? 2 : a.isPaused ? 1 : 0;
          bVal = b.isActive && !b.isPaused ? 2 : b.isPaused ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [collectibles, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePause = async (templateId: number) => {
    if (!onPause) return;
    setActioningId(templateId);
    try {
      await onPause(templateId);
    } finally {
      setActioningId(null);
    }
  };

  const handleResume = async (templateId: number) => {
    if (!onResume) return;
    setActioningId(templateId);
    try {
      await onResume(templateId);
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (collectible: CollectibleTemplate) => {
    if (!collectible.isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="w-3 h-3" />
          Inactive
        </Badge>
      );
    }
    if (collectible.isPaused) {
      return (
        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
          <Pause className="w-3 h-3" />
          Paused
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </Badge>
    );
  };

  const getSupplyDisplay = (collectible: CollectibleTemplate) => {
    if (collectible.maxSupply === 0) {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Infinity className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Unlimited</span>
        </div>
      );
    }

    const remaining = collectible.maxSupply - collectible.currentSupply;
    const percentage = (collectible.currentSupply / collectible.maxSupply) * 100;

    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">
          {collectible.currentSupply} / {collectible.maxSupply}
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              percentage >= 90
                ? 'bg-red-500'
                : percentage >= 70
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">{remaining} remaining</div>
      </div>
    );
  };

  const categories = useMemo(() => {
    const cats = new Set(collectibles.map((c) => c.category));
    return Array.from(cats);
  }, [collectibles]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading collectibles...</span>
        </div>
      </Card>
    );
  }

  if (collectibles.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No collectibles yet</p>
          <p className="text-sm">Create your first collectible to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search collectibles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCollectibles.length} of {collectibles.length} collectibles
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('templateId')}
              >
                ID {sortField === 'templateId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('claims')}
              >
                Claims {sortField === 'claims' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('supply')}
              >
                Supply {sortField === 'supply' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollectibles.map((collectible) => (
              <TableRow key={collectible.templateId}>
                <TableCell className="font-mono text-sm">
                  #{collectible.templateId}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {collectible.category.charAt(0).toUpperCase() + collectible.category.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {collectible.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className={RARITY_CONFIG[collectible.rarityTier].color}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {RARITY_CONFIG[collectible.rarityTier].name}
                      </Badge>
                      <span>•</span>
                      <span>{ELIGIBILITY_LABELS[collectible.eligibilityType]}</span>
                      <span>•</span>
                      <span>+{collectible.value} pts</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{collectible.currentSupply}</div>
                </TableCell>
                <TableCell>{getSupplyDisplay(collectible)}</TableCell>
                <TableCell>{getStatusBadge(collectible)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actioningId === collectible.templateId}
                      >
                        {actioningId === collectible.templateId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {collectible.isActive && !collectible.isPaused && onPause && (
                        <DropdownMenuItem onClick={() => handlePause(collectible.templateId)}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      )}
                      {collectible.isPaused && onResume && (
                        <DropdownMenuItem onClick={() => handleResume(collectible.templateId)}>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </DropdownMenuItem>
                      )}
                      {collectible.currentSupply === 0 && onEditMetadata && (
                        <DropdownMenuItem onClick={() => onEditMetadata(collectible.templateId)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Metadata
                        </DropdownMenuItem>
                      )}
                      {collectible.currentSupply > 0 && (
                        <DropdownMenuItem disabled>
                          <Edit className="w-4 h-4 mr-2 opacity-50" />
                          Edit Metadata (Disabled)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onViewPreview && (
                        <DropdownMenuItem onClick={() => onViewPreview(collectible.templateId)}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          View Preview
                        </DropdownMenuItem>
                      )}
                      {onViewAnalytics && (
                        <DropdownMenuItem onClick={() => onViewAnalytics(collectible.templateId)}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                      )}
                      {collectible.eligibilityType === EligibilityType.WHITELIST &&
                        onManageWhitelist && (
                          <DropdownMenuItem
                            onClick={() => onManageWhitelist(collectible.templateId)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Manage Whitelist
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredCollectibles.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        </Card>
      )}
    </div>
  );
}