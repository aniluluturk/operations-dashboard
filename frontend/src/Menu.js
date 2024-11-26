import React from "react";
import { Nav } from "react-bootstrap";

// Allows navigation between available metrics.
const Menu = ({ metrics, selectedMetric, onMetricChange }) => {
  // for all documents
  return (
    <div>
      <h4 className="mt-3">Metrics</h4>
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
      </Nav>
    </div>
  );
};

export default Menu;