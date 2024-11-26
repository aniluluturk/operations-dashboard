# Basic utility to insert test data for 3 operational metrics:
# - inventory_count (gauge)
# - shipment_status (enum)
# - processing_times (histogram)
# 
# The connection parameters are picked from environment.
# For this, you can use .env file at the root of the repo (for test DB)
# or you can create your own config for the MONGODB env params below. 

from pymongo import MongoClient
import os,random
from datetime import datetime, timedelta

# MongoDB Configuration parameters for backend connection, pull from env.
username = os.getenv("MONGODB_USERNAME") or 'root'
password = os.getenv("MONGODB_PASSWORD") or '123456'
database = os.getenv("MONGODB_SOURCEDB") or 'operations'

client = MongoClient("mongodb://localhost:27017/", username=username, password=password)
db = client[database]  # Database name
metrics_collection = db["metrics"]
metric_data_collection = db["metric_data"]

# Mock Metrics data to insert (metric name, type, label keys etc.).
METRICS = [
    {
        "name": "inventory_count",
        "type": "gauge",
        "label_keys": ["product_category", "product_model", "region"],
        "created_at": datetime.utcnow()
    },
    {
        "name": "shipment_status",
        "type": "enum",
        "label_keys": ["order_id"],
        "created_at": datetime.utcnow()
    },
    {
        "name": "processing_times",
        "type": "histogram",
        "label_keys": [],
        "created_at": datetime.utcnow()
    }
]

# Product categories (for inventory_count metric).
PRODUCT_CATEGORIES = {
    "iphone": ["iPhone 12", "iPhone 15 Pro"],
    "macbook": ["MacBook Air M2", "MacBook Pro M3"],
    "ipad": ["iPad Pro", "iPad Air"]
}
REGIONS = ["US", "EU", "China", "India", "Japan", "Rest of Asia"]
SHIPMENT_STATUSES = ["Pending", "Shipped", "In Transit", "Delivered", "Returned"]

def generate_inventory_count_data():
    start_date = datetime.utcnow() - timedelta(days=29)
    data = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        for category, models in PRODUCT_CATEGORIES.items():
            for model in models:
                for region in REGIONS:
                    value = random.randint(50, 2000)
                    data.append({
                        "name": "inventory_count",
                        "timestamp": date,
                        "value": value,
                        "labels": {
                            "product_category": category,
                            "product_model": model,
                            "region": region
                        }
                    })
    return data

def generate_shipment_status_data():
    start_date = datetime.utcnow() - timedelta(days=29)
    data = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        for _ in range(random.randint(50, 150)):
            value = random.choice(SHIPMENT_STATUSES)
            data.append({
                "name": "shipment_status",
                "timestamp": date,
                "value": value,
                "labels": {
                    "order_id": f"ORD-{random.randint(10000, 99999)}"
                }
            })
    return data

def generate_processing_times_data():
    start_date = datetime.utcnow() - timedelta(days=29)
    data = []
    bucket_boundaries = [10, 30, 60, 120, 300, 600]
    for i in range(30):
        date = start_date + timedelta(days=i)
        bucket_counts = {str(boundary): random.randint(0, 50) for boundary in bucket_boundaries}
        bucket_counts["+inf"] = random.randint(0, 10)
        data.append({
            "name": "processing_times",
            "timestamp": date,
            "buckets": bucket_counts
        })
    return data

def insert_data():
    # Insert metric metadata into `metrics` collection.
    metrics_collection.delete_many({})  # Clear existing data, just in case the db is dirty / not in-memory.
    metrics_collection.insert_many(METRICS)
    print(f"Inserted {len(METRICS)} metrics into the 'metrics' collection.")

    # Insert historical data points into `metric_data` collection.
    metric_data_collection.delete_many({})  # Clear existing data, just in case the db is dirty / not in-memory.
    all_data = []
    all_data.extend(generate_inventory_count_data())
    all_data.extend(generate_shipment_status_data())
    all_data.extend(generate_processing_times_data())
    metric_data_collection.insert_many(all_data)
    print(f"Inserted {len(all_data)} data entries into the 'metric_data' collection.")

if __name__ == "__main__":
    insert_data()
