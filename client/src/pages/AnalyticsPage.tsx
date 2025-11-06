import React from 'react';
import type { ProfileWithId } from '../services/contractService';
import type { ReputationCard } from '../types/reputationCard';
import { calculateTotalPoints } from '../utils/categoryUtils';

interface AnalyticsPageProps {
  userProfile: ProfileWithId | null;
  reputationCards: ReputationCard[];
  cardsLoading: boolean;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  userProfile,
  reputationCards,
  cardsLoading
}) => {
  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Found</h3>
        <p className="text-gray-600">Please create a profile to view your analytics.</p>
      </div>
    );
  }

  const totalPoints = calculateTotalPoints(reputationCards);
  
  // Calculate category distribution
  const categoryStats = reputationCards.reduce((acc, card) => {
    const category = card.category || 'Other';
    if (!acc[category]) {
      acc[category] = { count: 0, points: 0 };
    }
    acc[category].count += 1;
    acc[category].points += card.value || 0;
    return acc;
  }, {} as Record<string, { count: number; points: number }>);

  const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    percentage: reputationCards.length > 0 ? (stats.count / reputationCards.length) * 100 : 0
  }));

  // Mock trend data
  const trendData = [
    { month: 'Jan', score: 100 },
    { month: 'Feb', score: 250 },
    { month: 'Mar', score: 400 },
    { month: 'Apr', score: 650 },
    { month: 'May', score: 800 },
    { month: 'Jun', score: userProfile.reputationScore }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reputation Analytics</h1>
        <p className="text-gray-600">Deep insights into your trust profile and reputation growth</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Score</p>
              <p className="text-2xl font-bold text-gray-900">{userProfile.reputationScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{reputationCards.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. per Card</p>
              <p className="text-2xl font-bold text-gray-900">
                {reputationCards.length > 0 ? Math.round(totalPoints / reputationCards.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reputation Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Growth</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {trendData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(data.score / Math.max(...trendData.map(d => d.score))) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-600 mt-2">{data.month}</div>
                <div className="text-xs font-medium text-gray-900">{data.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          {cardsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600">Loading analytics...</span>
            </div>
          ) : categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((item, index) => (
                <div key={item.category} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">{item.category}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                          index % 4 === 1 ? 'from-green-500 to-green-600' :
                          index % 4 === 2 ? 'from-purple-500 to-purple-600' :
                          'from-orange-500 to-orange-600'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-12 text-right">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600">No reputation cards to analyze yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Trust Level</h4>
            <p className="text-blue-700 text-sm">
              {userProfile.reputationScore >= 800 ? 'Highly Trusted' :
               userProfile.reputationScore >= 500 ? 'Well Trusted' :
               userProfile.reputationScore >= 200 ? 'Building Trust' : 'New Member'}
            </p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((userProfile.reputationScore / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Activity Level</h4>
            <p className="text-green-700 text-sm">
              {reputationCards.length >= 10 ? 'Very Active' :
               reputationCards.length >= 5 ? 'Active' :
               reputationCards.length >= 1 ? 'Getting Started' : 'Inactive'}
            </p>
            <div className="mt-2 text-xs text-green-600">
              {reputationCards.length} reputation cards earned
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 text-center border border-purple-200">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We're working on advanced features like peer comparisons, reputation predictions, 
          and detailed trust network analysis!
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;