import React from "react";
import { Table } from "react-bootstrap";

// Provide tabular visualization for metric data.
const Tables = ({ selectedMetric, filteredData, rawTableData }) => {
  // if no metric was selected or if we have no data, just return an info text.
  if (!selectedMetric || !filteredData) {
    return <div>No data available</div>;
  }

  if (selectedMetric.type === "gauge") {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Labels</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(item).filter(([k]) => !["value", "date"].includes(k))
                  )
                )}
              </td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  } else if (selectedMetric.type === "enum") {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Labels</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {rawTableData.map((item, index) => (
            <tr key={index}>
              <td>{item.timestamp}</td>
              <td>{JSON.stringify(item.labels)}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  } else if (selectedMetric.type === "histogram") {
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Buckets (Raw JSON)</th>
          </tr>
        </thead>
        <tbody>
          {rawTableData.map((item, index) => (
            <tr key={index}>
              <td>{item.timestamp}</td>
              <td>{JSON.stringify(item.buckets)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
  // if we had data, but the selectedMetric type was not supported, return a warning text.
  return <div>Unsupported metric type</div>;
};

export default Tables;
