import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TransactionTypePieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No data available
      </div>
    );
  }

  const colors = {
    Payment: {
      bg: 'rgba(59, 130, 246, 0.8)',
      border: 'rgb(59, 130, 246)'
    },
    Transfer: {
      bg: 'rgba(16, 185, 129, 0.8)',
      border: 'rgb(16, 185, 129)'
    },
    Refund: {
      bg: 'rgba(239, 68, 68, 0.8)',
      border: 'rgb(239, 68, 68)'
    }
  };

  const chartData = {
    labels: data.map(d => `${d.type} (${d.count})`),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: data.map(d => colors[d.type]?.bg || 'rgba(156, 163, 175, 0.8)'),
        borderColor: data.map(d => colors[d.type]?.border || 'rgb(156, 163, 175)'),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Pie data={chartData} options={options} />
    </div>
  );
}
