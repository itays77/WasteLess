import { useAuth0 } from '@auth0/auth0-react';
import { useQuery } from 'react-query';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type CategoryStat = {
  _id: string;
  count: number;
  wastedCount: number;
  usedCount: number;
};

export type IngredientStat = {
  name: string;
  category: string;
  count: number;
  wastedCount: number;
  usedCount: number;
  wastePercentage: number;
  usagePercentage: number;
};

export type MonthlyTrend = {
  month: string;
  year: number;
  totalItems: number;
  wastedItems: number;
  wastePercentage: number;
};

export type SummaryStats = {
  totalItems: number;
  wastedItems: number;
  wastePercentage: number;
  mostWastedCategory: string;
  mostUsedCategory: string;
  improvementFromLastMonth: number;
};

export type InventoryStatistics = {
  categoryStats: CategoryStat[];
  mostWastedIngredients: IngredientStat[];
  mostUsedIngredients: IngredientStat[];
  monthlyTrends: MonthlyTrend[];
  summaryStats: SummaryStats;
};

// Get inventory statistics
export const useGetInventoryStatistics = (timeRange: string = 'alltime') => {
  const { getAccessTokenSilently } = useAuth0();

  const fetchInventoryStatistics = async (): Promise<InventoryStatistics> => {
    const accessToken = await getAccessTokenSilently();

    const response = await fetch(
      `${API_BASE_URL}/api/inventory/statistics?timeRange=${timeRange}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch inventory statistics');
    }

    return response.json();
  };

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery(['inventoryStatistics', timeRange], fetchInventoryStatistics);

  if (error) {
    toast.error('Error fetching inventory statistics');
  }

  return { statistics, isLoading, refetch };
};
