// Filters.js
import React from "react";
import { Col, Form } from "react-bootstrap";

// Provide filter utilities for Graphs and Tables.
const Filters = ({
  labels,
  groupBy,
  toggleGroupBy,
  filters,
  toggleFilter,
  availableValues,
}) => {
  // only for gauge metriccs for now: provide grouping and filtering by dynamically parsing label from metric data.
  return (
    <Col md={3} className="border-start">
      <h5 className="mt-4">Group By</h5>
      {labels.map((label) => (
        <Form.Check
          key={label}
          type="checkbox"
          label={label.charAt(0).toUpperCase() + label.slice(1)}
          checked={groupBy.includes(label)}
          onChange={() => toggleGroupBy(label)}
        />
      ))}

      <h5 className="mt-4">Filters</h5>
      {labels.map((label) => (
        <div key={label}>
          <h6>{label.charAt(0).toUpperCase() + label.slice(1)}</h6>
          {availableValues[label]?.map((value) => (
            <Form.Check
              key={value}
              type="checkbox"
              label={value}
              checked={filters[label]?.includes(value)}
              onChange={() => toggleFilter(label, value)}
            />
          ))}
        </div>
      ))}
    </Col>
  );
};

export default Filters;