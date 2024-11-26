import React, { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
} from "react-bootstrap";
import Menu from "./Menu";
import Graphs from "./Graphs";
import Tables from "./Tables";
import Filters from "./Filters";
import Controls from "./Controls";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const App = () => {
  const [metrics, setMetrics] = useState([]); // Stores raw metric (metadata).
  const [selectedMetric, setSelectedMetric] = useState(null); // Stores currently selected metric, to be used later by fetching historical info.
  const [metricData, setMetricData] = useState([]); // Historical data for the selected metric.
  const [groupBy, setGroupBy] = useState(["date"]); // Dynamic grouping for gauge charts (always includes `date` in the group).
  const [filters, setFilters] = useState({}); // Selected filters applied on the historical data, dynamically populated from metric labels.
  const [labels, setLabels] = useState([]); // Labels for the currently selected metric --stored for grouping and filtering purposes.
  const [activeTab, setActiveTab] = useState("chart"); // Manage active tab for visualization (chart or table).
  const [rawTableData, setRawTableData] = useState([]); // Store raw metric data for displaying it in the table. For keeping graph data separate from tables.
  const [endDate, setEndDate] = useState(new Date()); // End date for graph controls. This date is used for fetching only relevant historical data from backend.
  const [duration, setDuration] = useState(30); // Default duration of 30 days, used to calculate start date (end_date - duration), allows fetching only relevant data from backend.

  // Fetch metric list on component mount / inital page load.
  useEffect(() => {
    fetch(`${API_BASE_URL}/metrics`)
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
      })
      .catch((err) => console.error("Failed to fetch metrics:", err));
  }, []);

  // Fetch historical data for the selected metric.
  useEffect(() => {
    fetchMetricData();
  }, [selectedMetric, endDate, duration]);

  const fetchMetricData = () => {
    if (selectedMetric) {
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - duration); // Subtract duration from end date to find start date.
      const startISO = startDate.toISOString().replace("Z", "");
      const endISO = endDate.toISOString().replace("Z", "");
      // Get historical data using selected metric name, start datetime and end datetime, given by the user.
      fetch(
        `${API_BASE_URL}/metrics/${selectedMetric.name}/data?start_time=${startISO}&end_time=${endISO}`
      )
        .then((res) => res.json())
        .then((data) => {
          setRawTableData(data);
          if (selectedMetric.type === "gauge") {
            // Transform data structure for gauge metrics (graph display).
            const transformedData = data.map((item) => ({
              date: new Date(item.timestamp).toISOString().split("T")[0],
              value: item.value,
              ...item.labels, // Spread labels into the object, this is used for grouping and filtering.
            }));

            setMetricData(transformedData);

            // Determine labels dynamically, to be used in grouping and filtering.
            const dynamicLabels = Object.keys(data[0]?.labels || {});
            setLabels(dynamicLabels);

            // Reset filters based on the new labels -- retain the newest filter info.
            const newFilters = dynamicLabels.reduce((acc, label) => ({ ...acc, [label]: [] }), {});
            setFilters(newFilters);
          } else if (selectedMetric.type === "enum") {
            // Transform data for enum metrics (pie chart display).
            const groupedData = data.reduce((acc, item) => {
              acc[item.value] = (acc[item.value] || 0) + 1; // Count occurrences of each enum value.
              return acc;
            }, {});

            setMetricData(
              Object.entries(groupedData).map(([value, count]) => ({
                value,
                count,
              }))
            );
          } else if (selectedMetric.type === "histogram") {
            // Transform data for histogram metrics (heatmap / scatter chart).
            const histogramData = data.flatMap((item) => {
              const timestamp = new Date(item.timestamp).toISOString().split("T")[0];
              return Object.entries(item.buckets).map(([bucket, count]) => ({
                x: timestamp, // Use timestamp on X-axis.
                y: bucket, // Spread bucket ranges to Y-axis.
                value: count, // Keep count for the bucket, display in the corresponding cell.
              }));
            });

            // Extract unique buckets for the Y-axis -- to be used in Y axis labeling.
            const uniqueBuckets = [...new Set(histogramData.map((d) => d.y))].sort(
              (a, b) => parseFloat(a) - parseFloat(b) || (a === "+inf" ? 1 : -1) // Sort buckets numerically, to handle "+inf" case the last.
            );

            setMetricData(histogramData);
            setLabels(uniqueBuckets);
          }
        })
        .catch((err) => console.error(`Failed to fetch data for metric ${selectedMetric.name}:`, err));
    }
  }

  // Apply Filters on the given metric data (Gauge Metrics Only).
  const applyFilters = (data) => {
    return data.filter((item) =>
      labels.every(
        (label) =>
          filters[label].length === 0 || filters[label].includes(item[label])
      )
    );
  };

  // Aggregate Data by metrics (Gauge Metrics Only) -- this allows us to display a metric stream as one when there's no grouping.
  const aggregateData = (data, groupBy) => {
    const allDates = [...new Set(data.map((item) => item.date))].sort();

    const groupedData = data.reduce((acc, item) => {
      const groupKey = [...groupBy.map((key) => item[key])].join(" - ");
      acc[groupKey] = (acc[groupKey] || 0) + item.value;
      return acc;
    }, {});

    // Group the data and set proper labels to display for the graph.
    const completeData = [];
    const groupLabels = [...new Set(Object.keys(groupedData).map((key) => key.split(" - ").slice(1).join(" - ")))];
    groupLabels.forEach((label) => {
      allDates.forEach((date) => {
        const key = [date, label].filter(Boolean).join(" - ");
        completeData.push({
          date,
          label,
          value: groupedData[key] || 0, // Assign 0 value for aggregation if the data does not exist for this "bucket".
        });
      });
    });

    return completeData;
  };

  // Memoized Data for faster access (Gauge Metrics Only).
  const filteredData = useMemo(
    () => (selectedMetric?.type === "gauge" ? applyFilters(metricData) : metricData),
    [filters, metricData]
  );
  const chartData = useMemo(
    () => (selectedMetric?.type === "gauge" ? aggregateData(filteredData, groupBy) : filteredData),
    [filteredData, groupBy, selectedMetric]
  );

  // Chart.js data config for Line Chart (Gauge Metrics).
  const lineChartJsData = {
    labels: [...new Set(chartData.map((d) => d.date))].sort(),
    datasets: [...new Set(chartData.map((d) => d.label))]
      .sort()
      .map((label) => ({
        label: label ? label : "Inventory count",
        data: chartData
          .filter((d) => d.label === label)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((d) => d.value),
        borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
          Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 1)`,
        fill: false,
      })),
  };

  // Chart.js options for Line Chart.
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: `Chart for ${selectedMetric?.name || "Metric"}` },
    },
    scales: {
      x: {
        type: "category",
        title: { display: true, text: "Date" },
      },
      y: {
        title: { display: true, text: "Value" },
      },
    },
  };

  // Chart.js data config for Pie Chart (Enum Metrics).
  const pieChartJsData = {
    labels: chartData.map(
      (d) =>
        `${d.value} (${((d.count / chartData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(2)}%)`
    ),
    datasets: [
      {
        data: chartData.map((d) => d.count),
        backgroundColor: chartData.map(
          () =>
            `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
              Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 0.8)`
        ),
      },
    ],
  };

  // Chart.js data config for Heatmap / Scatter Chart (Histogram Metrics).
  const scatterChartData = useMemo(() => {
    // Normalize values to create a dynamic color range -- from min to max, we will have a gradient.
    const values = metricData.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const getColor = (value) => {
      const normalized = (value - minValue) / (maxValue - minValue); // Normalize between [0,1].
      return `rgba(${normalized * 255}, 0, ${255 - normalized * 255}, 0.8)`;
    };

    return {
      datasets: [
        {
          label: `Heatmap for ${selectedMetric?.name || "Metric"}`,
          data: metricData.map((d) => ({
            x: d.x, // X axis holds Timestamp.
            y: d.y, // Y axis holds Bucket.
            value: d.value, // Value for count / intensity of the cell (bucket in a specific datetime).
          })),
          pointBackgroundColor: metricData.map((d) => getColor(d.value)),
          pointStyle: 'rect',
          radius: 20,
        },
      ],
    };
  }, [metricData, selectedMetric]);

  const scatterChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Value: ${context.raw.value}`,
        },
      },
    },
    scales: {
      x: {
        type: "category",
        title: { display: true, text: "Timestamp" },
        labels: Array.from(new Set(scatterChartData.datasets[0].data.map((d) => d.x))), // Ensure timestamp labels.
      },
      y: {
        type: "category", // Bucket labels as categories
        labels: Array.from(new Set(scatterChartData.datasets[0].data.map((d) => d.y))).reverse(), // Ensure unique bucket labels - reversed from min to +inf.
        title: {
          display: true,
          text: "Buckets",
        },
      }
    },
  };

  // Available Labels for filtering and grouping (Gauge Metrics Only).
  const availableValues = labels.reduce(
    (acc, label) => ({
      ...acc,
      [label]: [...new Set(metricData.map((d) => d[label]))],
    }),
    {}
  );

  // Handler for filter toggle. When a certain label value is selected, updates filters, and eventually the filtered data.
  const toggleFilter = (label, value) => {
    setFilters((prev) => ({
      ...prev,
      [label]: prev[label].includes(value)
        ? prev[label].filter((v) => v !== value)
        : [...prev[label], value],
    }));
  };

  // Handler for group toggle. When a certain label key / dimension is selected, updates groups, and eventually the grouped data.
  const toggleGroupBy = (label) => {
    setGroupBy((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // Handler for metric change. Gets called when user selects a metric from the Navbar.
  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  return (
    <Container fluid>
      <Row className="bg-dark text-white py-3">
        <Col>
          <h2 className="text-center">Operations Dashboard</h2>
        </Col>
      </Row>
      <Row>
        <Col md={2} className="border-end">
          <Menu metrics={metrics} selectedMetric={selectedMetric} onMetricChange={handleMetricChange} />
        </Col>
        <Col md={7} className="p-3">
          {selectedMetric ?
            (<><Row>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Tab eventKey="chart" title="Chart">
                  <Card style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Card.Body style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                      <Graphs
                        selectedMetric={selectedMetric}
                        lineChartJsData={lineChartJsData}
                        pieChartJsData={pieChartJsData}
                        scatterChartData={scatterChartData}
                        chartOptions={chartOptions}
                        scatterChartOptions={scatterChartOptions}
                      />
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey="table" title="Table">
                  <Card>
                    <Card.Body style={{ height: "500px", overflowY: "auto" }}>
                      <Tables
                        selectedMetric={selectedMetric}
                        filteredData={filteredData}
                        rawTableData={rawTableData}
                      />
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </Row>
              <Row className='mt-5'>
                <Controls
                  fetchMetricData={fetchMetricData}
                  selectedMetric={selectedMetric}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  duration={duration}
                  setDuration={setDuration}
                />
              </Row></>) :
            <h3>
              Please select a metric from the left menu to display.<br/>
            </h3>
          }
        </Col>
        {selectedMetric?.type === "gauge" && (
          <Filters
            labels={labels}
            groupBy={groupBy}
            toggleGroupBy={toggleGroupBy}
            filters={filters}
            toggleFilter={toggleFilter}
            availableValues={availableValues}
          />
        )}
      </Row>
    </Container>
  );
};

export default App;
