import React from "react";
import { Line, Pie, Scatter } from "react-chartjs-2";

// Provide different Graphs / Charts based on selectedMetric type.
const Graphs = ({ selectedMetric, lineChartJsData, pieChartJsData, scatterChartData, lineChartOptions, scatterChartOptions }) => {
  const chartStyle = { maxHeight: "500px", maxWidth: "100%" };

  if (selectedMetric?.type === "enum") {
    return (pieChartJsData ? <Pie data={pieChartJsData} style={chartStyle} /> : <h3>Loading...</h3>);
  } else if (selectedMetric?.type === "gauge") {
    return (lineChartJsData ? <Line data={lineChartJsData} options={lineChartOptions} style={chartStyle} /> : <h3>Loading...</h3>);
  } else if (selectedMetric?.type === "histogram") {
    return (scatterChartData ? <Scatter data={scatterChartData} options={scatterChartOptions} style={chartStyle} /> : <h3>Loading...</h3>);
  }
  return <div>Unsupported metric type</div>;
};

export default Graphs;