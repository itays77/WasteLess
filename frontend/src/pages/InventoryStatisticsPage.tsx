import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { ArrowLeft, RefreshCw, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';

// This would come from your API in a real implementation
const fetchStatisticsData = async (timeRange: string, accessToken: string) => {
  // Mock data for demonstration
  // In a real implementation, you would fetch this from your backend API

  // Category data - Note: the expired/consumed fields are mock numbers for visualization purposes
  // In the real implementation, these would be calculated from actual data
  const categoryData = [
    { name: 'Vegetables', count: 24, expired: 8, consumed: 16 },
    { name: 'Fruits', count: 18, expired: 5, consumed: 13 },
    { name: 'Dairy', count: 12, expired: 2, consumed: 10 },
    { name: 'Meat', count: 10, expired: 1, consumed: 9 },
    { name: 'Frozen', count: 14, expired: 0, consumed: 14 },
    { name: 'Bakery', count: 8, expired: 3, consumed: 5 },
    { name: 'Dry', count: 30, expired: 0, consumed: 30 },
  ];

  // Most frequently expired ingredients
  const mostExpiredIngredients = [
    {
      name: 'Spinach',
      category: 'Vegetables',
      expiryCount: 4,
      expiryPercentage: 80,
    },
    {
      name: 'Bananas',
      category: 'Fruits',
      expiryCount: 3,
      expiryPercentage: 60,
    },
    { name: 'Bread', category: 'Bakery', expiryCount: 3, expiryPercentage: 50 },
    { name: 'Milk', category: 'Dairy', expiryCount: 2, expiryPercentage: 40 },
    {
      name: 'Tomatoes',
      category: 'Vegetables',
      expiryCount: 2,
      expiryPercentage: 40,
    },
  ];

  // Most consumed ingredients (inferred from inventory changes)
  const mostConsumedIngredients = [
    {
      name: 'Eggs',
      category: 'Dairy',
      consumedCount: 8,
      consumedPercentage: 100,
    },
    {
      name: 'Rice',
      category: 'Dry',
      consumedCount: 7,
      consumedPercentage: 100,
    },
    {
      name: 'Chicken',
      category: 'Meat',
      consumedCount: 6,
      consumedPercentage: 90,
    },
    {
      name: 'Pasta',
      category: 'Dry',
      consumedCount: 6,
      consumedPercentage: 100,
    },
    {
      name: 'Onions',
      category: 'Vegetables',
      consumedCount: 5,
      consumedPercentage: 80,
    },
  ];

  // Monthly trends (would be adjusted based on the timeRange)
  const now = new Date();
  const monthlyTrends = [
    {
      month: format(subMonths(now, 5), 'MMM'),
      expiryPercentage: 35,
      totalItems: 42,
      expiredItems: 15,
    },
    {
      month: format(subMonths(now, 4), 'MMM'),
      expiryPercentage: 32,
      totalItems: 50,
      expiredItems: 16,
    },
    {
      month: format(subMonths(now, 3), 'MMM'),
      expiryPercentage: 28,
      totalItems: 46,
      expiredItems: 13,
    },
    {
      month: format(subMonths(now, 2), 'MMM'),
      expiryPercentage: 24,
      totalItems: 48,
      expiredItems: 12,
    },
    {
      month: format(subMonths(now, 1), 'MMM'),
      expiryPercentage: 20,
      totalItems: 55,
      expiredItems: 11,
    },
    {
      month: format(now, 'MMM'),
      expiryPercentage: 15,
      totalItems: 60,
      expiredItems: 9,
    },
  ];

  // Summary statistics
  const summaryStats = {
    totalItems: 116,
    expiredItems: 19,
    expiryPercentage: 16,
    mostExpiredCategory: 'Vegetables',
    mostConsumedCategory: 'Dry Goods',
    improvementFromLastMonth: 5, // percentage points improvement
  };

  // Wait a bit to simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    categoryData,
    mostExpiredIngredients,
    mostConsumedIngredients,
    monthlyTrends,
    summaryStats,
  };
};

const COLORS = [
  '#32936F', // Dark green
  '#26A96C', // Medium green
  '#2BC016', // Light green
  '#83E377', // Pale green
  '#16DB93', // Teal green
  '#9EF01A', // Yellow-green
  '#FFBF00', // Amber
];

const InventoryStatisticsPage = () => {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6months');
  const [isLoading, setIsLoading] = useState(true);
  interface StatsData {
    categoryData: {
      name: string;
      count: number;
      expired: number;
      consumed: number;
    }[];
    mostExpiredIngredients: {
      name: string;
      category: string;
      expiryCount: number;
      expiryPercentage: number;
    }[];
    mostConsumedIngredients: {
      name: string;
      category: string;
      consumedCount: number;
      consumedPercentage: number;
    }[];
    monthlyTrends: {
      month: string;
      expiryPercentage: number;
      totalItems: number;
      expiredItems: number;
    }[];
    summaryStats: {
      totalItems: number;
      expiredItems: number;
      expiryPercentage: number;
      mostExpiredCategory: string;
      mostConsumedCategory: string;
      improvementFromLastMonth: number;
    };
  }

  const [stats, setStats] = useState<StatsData | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const accessToken = await getAccessTokenSilently();
      const data = await fetchStatisticsData(timeRange, accessToken);
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetables':
        return 'bg-green-100 text-green-800';
      case 'fruits':
        return 'bg-orange-100 text-orange-800';
      case 'dairy':
        return 'bg-blue-100 text-blue-800';
      case 'meat':
        return 'bg-red-100 text-red-800';
      case 'frozen':
        return 'bg-cyan-100 text-cyan-800';
      case 'bakery':
        return 'bg-yellow-100 text-yellow-800';
      case 'dry':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>No statistics data available. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Inventory
          </Button>
          <h1 className="text-3xl font-bold">Inventory Statistics</h1>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchStats} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.summaryStats.totalItems}
            </div>
            <p className="text-sm text-gray-500">items tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Expiry Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.summaryStats.expiryPercentage}%
            </div>
            <div className="flex items-center text-sm text-green-600">
              <span className="inline-block">
                ↓ {stats.summaryStats.improvementFromLastMonth}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Most Expired Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                className={getCategoryColor(
                  stats.summaryStats.mostExpiredCategory
                )}
              >
                {stats.summaryStats.mostExpiredCategory}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Consider buying less of these items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Most Consumed Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                className={getCategoryColor(
                  stats.summaryStats.mostConsumedCategory
                )}
              >
                {stats.summaryStats.mostConsumedCategory}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-2">Your favorite foods</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expiry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expiry">Expiry Analysis</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Expiry Analysis Tab */}
        <TabsContent value="expiry" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expiry Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Expired Items by Category</CardTitle>
                <CardDescription>
                  See which food categories expire most frequently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="expired"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} items`, 'Expired']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Most Expired Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Most Frequently Expired Ingredients</CardTitle>
                <CardDescription>
                  These ingredients frequently expire before use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.mostExpiredIngredients.map((ingredient, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ingredient.name}</span>
                          <Badge
                            className={getCategoryColor(ingredient.category)}
                          >
                            {ingredient.category}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {ingredient.expiryCount} expired
                        </span>
                      </div>
                      <Progress
                        value={ingredient.expiryPercentage}
                        className="h-2 bg-gray-200 [--progress-fill:theme(colors.red.500)]"
                      />
                      <p className="text-xs text-gray-500">
                        {ingredient.expiryPercentage}% expiry rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Patterns Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Consumption vs Expiry by Category</CardTitle>
                <CardDescription>
                  Items by category in your inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.categoryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="consumed"
                        name="Consumed"
                        stackId="a"
                        fill="#32936F"
                      />
                      <Bar
                        dataKey="expired"
                        name="Expired"
                        stackId="a"
                        fill="#F87171"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Note: Consumption is inferred from inventory changes
                </div>
              </CardContent>
            </Card>

            {/* Most Consumed Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Most Consumed Ingredients</CardTitle>
                <CardDescription>
                  These are your favorite ingredients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.mostConsumedIngredients.map((ingredient, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ingredient.name}</span>
                          <Badge
                            className={getCategoryColor(ingredient.category)}
                          >
                            {ingredient.category}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {ingredient.consumedCount} consumed
                        </span>
                      </div>
                      <Progress
                        value={ingredient.consumedPercentage}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        {ingredient.consumedPercentage}% consumption rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory and Expiry Over Time</CardTitle>
              <CardDescription>
                Track changes in your inventory and expired items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.monthlyTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#32936F" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#F87171"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="totalItems"
                      name="Total Items"
                      fill="#32936F"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="expiredItems"
                      name="Expired Items"
                      fill="#F87171"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-center text-sm text-gray-600">
                  Your food expiry rate has decreased by{' '}
                  {stats.summaryStats.improvementFromLastMonth}% in the last
                  month. Keep up the good work!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expiry Percentage Trend</CardTitle>
              <CardDescription>
                Your food expiry percentage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.monthlyTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="expiryPercentage"
                      name="Expiry %"
                      stroke="#F87171"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <Card className="mt-8 bg-green-50 border-green-100">
        <CardHeader>
          <CardTitle>Smart Recommendations</CardTitle>
          <CardDescription>
            Based on your expiry patterns, here are some suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>
                Buy smaller quantities of <strong>spinach</strong> and{' '}
                <strong>bananas</strong> as these frequently expire before use.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>
                You're doing great with <strong>dry goods</strong> and{' '}
                <strong>frozen items</strong> - these categories have minimal
                expiration.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>
                Consider freezing <strong>bread</strong> to extend its shelf
                life.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>
                Your expiry percentage has dropped by 5% compared to last month
                - great progress!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">•</span>
              <span>
                <em>Coming soon:</em> Recipe suggestions to use ingredients
                before they expire!
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStatisticsPage;
