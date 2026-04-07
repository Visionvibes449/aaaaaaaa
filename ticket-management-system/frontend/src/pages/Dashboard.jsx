import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/api';
import { FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await ticketAPI.getStats();
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  const statusColors = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    pending: '#8b5cf6',
    resolved: '#10b981',
    closed: '#ef4444'
  };

  const priorityColors = {
    low: '#10b981',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444'
  };

  const statusData = stats?.statusBreakdown 
    ? Object.entries(stats.statusBreakdown).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
    : [];

  const priorityData = stats?.priorityBreakdown
    ? Object.entries(stats.priorityBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalTickets || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiTrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats?.statusBreakdown?.resolved || 0}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiCheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.statusBreakdown?.in_progress || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FiClock className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
              <p className="text-3xl font-bold text-red-600">{stats?.statusBreakdown?.open || 0}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FiAlertCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tickets by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name.toLowerCase().replace(' ', '_')] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tickets by Priority</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={priorityColors[entry.name] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Last 7 Days</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">New tickets created</p>
            </div>
            <span className="text-2xl font-bold text-primary-600">{stats?.recentTickets || 0}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">SLA Performance</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average response time</p>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {stats?.slaMetrics?.avgResponseTime ? `${stats.slaMetrics.avgResponseTime.toFixed(1)}h` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
