# Python Backend App, providing REST API in Flask.abs
# Provides a service for storing and querying metrics, uses MongoDB as underlying storage.

from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime
from flask_cors import CORS
import os,sys

app = Flask(__name__)
CORS(app) # Not very safe for production, just for mock app purposes.

# MongoDB Configuration parameters for backend connection, pull from env.
username = os.getenv("MONGODB_USERNAME")
password = os.getenv("MONGODB_PASSWORD")
database = os.getenv("MONGODB_SOURCEDB")

client = MongoClient("mongodb://mongodb:27017/", username=username, password=password,authSource=database)
db = client.operations
metrics_collection = db.metrics
metric_data_collection = db.metric_data


# GET endpoint to receive all available metrics.
@app.get('/metrics')
def list_metrics():
    metrics = metrics_collection.find()

# Transform the results in a structured json format before returning.
    result = [
        {
            "name": metric["name"],
            "type": metric["type"],
            "label_keys": metric["label_keys"],
            "created_at": metric["created_at"].isoformat(),
        }
        for metric in metrics
    ]

    return jsonify(result)

# POST endpoint to create a new metric.
@app.post('/metrics')
def create_metric():
    data = request.json
    metric_name = data.get("name")
    metric_type = data.get("type")
    label_keys = data.get("label_keys", [])  # Store keys for possible labels that could be set for this metric.

    if not metric_name or not metric_type or not label_keys:
        return jsonify({"error": "metric_name, metric_type, and label_keys are required"}), 400

    # Check if the metric already exists, it it does, fail with error.
    existing_metric = metrics_collection.find_one({"name": metric_name})
    if existing_metric:
        return jsonify({"error": "Metric with the same name already exists"}), 400

    document = {
        "name": metric_name,
        "type": metric_type,
        "label_keys": label_keys,
        "created_at": datetime.utcnow(),
    }

    result = metrics_collection.insert_one(document)
    return jsonify({"message": "Success", "id": str(result.inserted_id)})


# POST Endpoint to insert new metric data (historical metric data point, similar to timeseries).
@app.post('/metrics/<metric_name>/data')
def insert_metric_data(metric_name):
    data = request.json
    labels = data.get("labels", {}) # Metric might contain key-value pairs for label, initialize as empty.
    metric_value = data.get("value", None)
    metric_buckets = data.get("buckets", {})
    timestamp = data.get("timestamp")  # Optional timestamp, it will be used below for overriding timestamp field, if provided.

    if not labels or not metric_data:
        return jsonify({"error": "labels and data are required"}), 400

    # Ensure that the metric that we are trying to insert historical data for, already exists.
    metric = metrics_collection.find_one({"name": metric_name})
    if not metric:
        return jsonify({"error": "Metric not found"}), 404

    # Validate label keys, they should correspond to label_keys defined in metric metadata.
    expected_label_keys = metric["label_keys"]
    if set(labels.keys()) != set(expected_label_keys):
        return jsonify({"error": f"Labels must contain exactly these keys: {expected_label_keys}"}), 400

    # If timestamp was provided, insert the data with the provided UTC timestamp, otherwise use current datetime.
    try:
        if timestamp:
            timestamp = datetime.fromisoformat(timestamp)
        else:
            timestamp = datetime.utcnow()
    except ValueError:
        return jsonify({"error": "Invalid timestamp format. Use ISO 8601 format."}), 400

    # Prepare historical data to insert.
    historical_record = {
        "metric_id": str(metric["_id"]),
        "name": metric_name,
        "labels": labels,
        "value": metric_value,
        "buckets": metric_buckets,
        "timestamp": timestamp,
    }
    result = metric_data_collection.insert_one(historical_record)

    return jsonify({"message": "Success", "id": str(result.inserted_id)})


# GET Endpoint to retrieve data (historical data points) for the given metric name.
@app.get('/metrics/<metric_name>/data')
def get_metric_history(metric_name):
    labels = request.args.to_dict()  # Label filters will be passed within query params, we need to extract them.
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")
    if "start_time" in labels:
        del labels["start_time"]
    if "end_time" in labels:
        del labels["end_time"]

    # Ensure that the metric that we are trying to fetch historical data for, already exists.
    metric = metrics_collection.find_one({"name": metric_name})
    if not metric:
        return jsonify({"error": "Metric not found"}), 404

    query = {"name": metric_name}

    # Prepare query filters based on provided labels.
    if labels:
        for key, value in labels.items():
            query[f"labels.{key}"] = value

    # Optional start end datetime filtering. If not provided, returns all available historical data.
    if start_time or end_time:
        query["timestamp"] = {}
        if start_time:
            query["timestamp"]["$gte"] = datetime.fromisoformat(start_time)
        if end_time:
            query["timestamp"]["$lte"] = datetime.fromisoformat(end_time)

    # Query and print debugging info.
    print(f"DEBUG: Querying with: {query}")  # Debug output
    sys.stderr.write(f"DEBUG: Querying with: {query}\n")  # Debug output
    sys.stdout.flush()
    sys.stderr.flush()
    historical_data = metric_data_collection.find(query)

    # Transform the results in a structured json format before returning.
    result = [
        {
            "labels": entry["labels"] if "labels" in entry else None,
            "value": entry["value"] if "value" in entry else None,
            "buckets": entry["buckets"] if "buckets" in entry else None,
            "timestamp": entry["timestamp"].isoformat(),
        }
        for entry in historical_data
    ]

    return jsonify(result)



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
