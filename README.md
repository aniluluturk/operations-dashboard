# Operations dashboard

## Overview

This project aims to provide a way of storing and visualizing day-to-day operational metrics for internal use. It mainly has 3 components: frontend, backend and storage layer (NoSQL database).

Frontend has a simple UI, where the users can display all available metrics and select the one they would like to observe, and see a graphical visualization of the data, depending on the metric type.
They can also browse all the data in a tabular way and download this timeseries data in CSV format.
Backend supports querying the metrics in a flexible way, with provided filters such as metric name, label and start-end timestamps. It also supports individual and batch insertion of metric data.
The data provided to the backend is stored in a NoSQL database, which provides flexibility over the various metric schemas.

All of these components are separately bundled as Docker images and they could either be brought up individually or altogether using docker-compose.

### Operations Dashboard - Frontend

Frontend is served from 'frontend' container on port 3000 by default. It has 3 main parts:

- Metric selection menu (displayed on the left)
- Metric visualization as Graph or Table, in different tabs (displeyed in the middle)
- Filters and Controls (displayed around the Metric visualization)

It currently supports 3 visualizations for 3 different metric types:

- gauge -> Line Chart
- enum -> Pie Chart
- histogram -> Heatmap / Scatter Chart

### Operations Backend

Provides endpoints for creating new metrics, fetching them, adding new data points for them, and also fetching those data points with filters.

### API Documentation

#### Base URL
- **http://<host>:5000**

##### Metrics API

###### 1. List All Metrics
**Endpoint:** `GET /metrics`  
**Description:** Retrieves a list of all available metrics.  
**Response:**
```
[
  {
    "name": "metric_name",
    "type": "gauge",
    "label_keys": ["key1", "key2"],
    "created_at": "2023-11-25T12:34:56Z"
  }
]
```

###### 2. Create a New Metric
**Endpoint:** `POST /metrics`  
**Description:** Adds a new metric to the system.  
**Request Body:**
```
{
  "name": "metric_name",
  "type": "pie",
  "label_keys": ["key1", "key2"]
}
```
**Response:**  
- Success:
```
{"message": "Success", "id": "unique_metric_id"}
```
- Error:
```
{"error": "Metric with the same name already exists"}
```

##### Metric Data API

###### 3. Insert Metric Data
**Endpoint:** `POST /metrics/<metric_name>/data`  
**Description:** Inserts a new data point (historical metric data) for a specific metric.  
**Path Parameter:**
- `metric_name`: The name of the metric.  
**Request Body:**
```
{
  "labels": {"key1": "value1", "key2": "value2"},
  "value": 123.45,
  "buckets": {"bucket1": 10, "bucket2": 20},
  "timestamp": "2023-11-25T12:34:56Z"  # Optional, defaults to current UTC time.
}
```
**Response:**
- Success:
```
{"message": "Success", "id": "unique_data_id"}
```
- Error:
```
{"error": "Labels must contain exactly these keys: ['key1', 'key2']"}
```

###### 4. Retrieve Metric History
**Endpoint:** `GET /metrics/<metric_name>/data`  
**Description:** Retrieves historical data points for a specific metric with optional filters.  
**Path Parameter:**
- `metric_name`: The name of the metric.  
**Query Parameters (Optional):**
- `start_time`: ISO 8601 datetime (e.g., `2023-11-25T12:34:56Z`) to filter data starting from this time.
- `end_time`: ISO 8601 datetime to filter data up to this time.
- Other query parameters can be used as label filters (e.g., `key1=value1`).  

**Response:**
```
[
  {
    "labels": {"key1": "value1", "key2": "value2"},
    "value": 123.45,
    "buckets": {"10": 10, "20": 20, "+inf": 0},
    "timestamp": "2023-11-25T12:34:56Z"
  }
]
```

## Technical Dependencies

Frontend uses React framework and Javascript for the UI. React is a well-supported open source library that also provides high configurability, which are very important factors that contributed to
my choice. However, the major reason why I picked React is its simplicity and ease of setup, compared to its competitors like Angular. React is extremely easy to use for starter or mockup projects
and it has a lot of support for UI libraries like Bootstrap as well as charting / graph libraries like chartjs. I currently used react-chartjs for graph visualization and react-bootstrap for other UI elements and styling.

Backend is in Python and mainly uses Flask for implementation of its API. Also, for the DB connection, pymongoose library is used. Although there are more heavyweight backend frameworks like Django,
Flask is remarkable simple and easy to set up and iterate over, especially for REST APIs like the one I implemented here.

Storage layer or Database is MongoDB, because I find NoSQL databases a perfect fit for early-stage projects or mockups that do not have (or do not aim to have) a strong limitation on their schema.
For our use case, we want to store metrics, but the requirements might change quite fast. In the current state, I used Prometheus-like metrics with values, labels and buckets, but these requirements
might change in the near future. In these cases, not having Relational / SQL DB is highly beneficial, as MongoDB provides high flexibility over the data that we store, compared to schema-driven and more
rigid relational databases like Postgres or MySQL.

## How to run

[Recommmended] Docker-Compose:

- Ensure that you have docker and docker compose plugin installed on your system. If not, refer to https://docs.docker.com/desktop for installation instructions.
- Run `docker compose up` at the root of the project folder, and wait for images to be built.
- After the build succeeds, docker compose will try to bring up 3 containers, each for frontend, backend and mongodb. Wait until you see green tick for all 3 containers.
- You can reach (by default) to UI / operations dashboard frontend from `<your-hostname>:3000`.
 - Other components are available at  `<your-hostname>:5000` (backend), `<your-hostname>:27017` (mongodb) respectively.

Alternatively, each component contains its own Dockerfile, which can be used to build an image and run individually:

- Browse into mongodb folder, run `docker build -t mongodb .` and `docker run -d mongodb`
- Browse into backend folder, run `docker build -t backend .` and `docker run -d backend`
- Browse into frontend folder, run `docker build -t frontend .` and `docker run -d frontend`
- Verify that your images are built and are running successfully via `docker ps`.
- Once they are running in a healthy state, you can reach (by default) to UI / operations dashboard frontend from `<your-hostname>:3000`.
 - Other components are available at  `<your-hostname>:5000` (backend), `<your-hostname>:27017` (mongodb) respectively.

### Test data

If you'd like to load some test data into the DB, you can run `python util/insert_testdata.py`. This, by default, tries to connect to local (or containeriz with 27017 port exposed) MongoDB installment and populates "operations" database with 3 metrics. More info on this tool available in the module docstring.

## Future improvements

- Provide customizable graphs / charts for each metric: UI currently has a hardcoded mapping between metric type and chart type. In the future, I intend to allow more graph / chart types and allow user to select how they would like to visualize a specific metric.
- Security: The dashboard / UI as well as backend API is available to anyone, we can have some lockdown for these for certain users / groups depending on the sensitivity of the presented information.  
Another important aspect of security is how we store passwords, connection strings etc., especially for the DB. We currently store them in an .env file that should NOT be checked into the repository. For a better secrets handling we can use tools like Kubernetes secrets or Cloud key storage utilities (e.g., Google Cloud KMS).
- More scalable deployment: Docker compose is good for mostly static deployments with little to no scalability or health check. To improve that and provide orchestration, we can move to K8s, and use tools like Helm to track the configuration.
- Performance improvements: We tried to provide indexing on certain columns / fields to improve metric fetch performance for large datasets, but 
  - (a) nosql or relational dbs are not great fits for storing timeseries data, there are more suitable choices like influxdb for this, and
  -  (b) backend is prone to storing and returning raw data without any extra work. If we could improve either one, we could handle large datasets better.  

  We can also have better performance through caching in Frontend.
- For better user experience: Some user settings could have been saved to local storage or cookies. Currently a hard page refresh resets the selected metric and other filters.  
We can also have more graceful error handlings in several places. I tried to return errors and display some useful messages usually, but this could be further improved with e.g. error boundaries.
- Testing: Backend and frontend (Python and React code) contain very little tests. These tests should be extended to provide better coverage and for catching any implementation errors / issues.
- Gitlab Actions integration: When it's only me working on this code, having no CI/CD automation is fine, but having a sensible setup for daily / weekly builds, running test suites for PRs and branches, deploying the up-to-date binary to various environments
would be great additions as this project lifts off and gets collaboration from other team members.
- Metrics: Especially for flask API and the running containers, it is worth having a good visibility and observability. if the API itself exported some metrics, and if we had proper healthchecks on all of our services, it would benefit the health of the overall app greatly.
- MongoDB with a better storage: for quick development, I just went with tmpfs to store the nosql data, which is pretty similar to an in-memory DB. as soon as mongodb container goes away, the data is lost. persistence and a good DB setup with replicas and shards (where necessary) would improve app performance.
- Eye candy?: UI could look prettier. I just created a very simple bootstrap UI and focused more on metrics display and functionality, but UI certainly could look nicer.
