// Chart.js setup - register all required components
// Build timestamp: 2026-02-07T23:11
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
)

// Common chart options
export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#737373',
      },
      border: {
        color: '#e8e8e8',
      },
    },
    y: {
      grid: {
        color: '#e8e8e8',
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#737373',
      },
      border: {
        display: false,
      },
    },
  },
}

// Common tooltip style
export const tooltipStyle = {
  backgroundColor: 'white',
  titleColor: '#374151',
  bodyColor: '#374151',
  borderColor: '#e8e8e8',
  borderWidth: 1,
  cornerRadius: 8,
  padding: 8,
  boxPadding: 4,
  titleFont: {
    size: 12,
  },
  bodyFont: {
    size: 12,
  },
}

export const CHARTJS_BUILD = '2026-02-07T23:12'

export { ChartJS }
