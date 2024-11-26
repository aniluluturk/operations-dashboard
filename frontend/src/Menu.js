import React from "react";
import { Nav } from "react-bootstrap";

// Allows navigation between available metrics.
const Menu = ({ metrics, selectedMetric, onMetricChange }) => {
  // display metrics we fetched from backend as nav items.
  console.log(metrics);
  return (
    <div>
      <h4 className="mt-3">Metrics</h4>
      {metrics && metrics.length > 0 ?
      <Nav variant="pills" className="flex-column">
        {metrics.map((metric) => (
          <Nav.Item key={metric.name}>
            <Nav.Link
              active={selectedMetric?.name === metric.name}
              onClick={() => onMetricChange(metric)}
            >
              {metric.name.charAt(0).toUpperCase() + metric.name.slice(1)}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav> : <p>There are no metrics to list.</p>}
    </div>
  );
};

export default Menu;