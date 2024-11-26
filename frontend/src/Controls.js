// Controls.js
import React from "react";
import { Col, Row, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";

// Provide data controls / updates for Graphs.
const Controls = ({
    fetchMetricData,
    selectedMetric,
    endDate,
    setEndDate,
    duration,
    setDuration,
}) => {
    // render datetime (end date and duration) controls as well as refresh button.
    return (
        <>
            <Col md={2} className="d-flex align-items-center justify-content-center">
                <Button
                    variant="primary"
                    onClick={fetchMetricData}
                    active={!selectedMetric}
                >
                    Refresh Data
                </Button>
            </Col>

            <Col md={4}>
                <Form.Group controlId="endDate">
                    <Row>
                        <Col sm={6} className="d-flex align-items-center justify-content-end">
                            <Form.Label>End Date</Form.Label>
                        </Col>
                        <Col sm={6}>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date || new Date())}
                                dateFormat="yyyy-MM-dd"
                                maxDate={new Date()}
                                isClearable
                                className="form-control"
                            />
                        </Col>
                    </Row>
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group controlId="duration">
                    <Row>
                        <Col sm={6} className="d-flex align-items-center justify-content-end">
                            <Form.Label>Duration</Form.Label>
                        </Col>
                        <Col sm={6}>
                            <Form.Control
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)} // Validate input
                                placeholder="Duration in days"
                            />
                        </Col>
                    </Row>
                </Form.Group>
            </Col>
        </>
    );
};

export default Controls;