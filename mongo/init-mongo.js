db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

db = db.getSiblingDB('operations');
db.createUser({
    user: process.env.MONGO_INITDB_BACKEND_USERNAME,
    pwd: process.env.MONGO_INITDB_BACKEND_PASSWORD,
    roles: [
        {
            role: 'readWrite',
            db: 'operations',
        },
    ],
});

db.createCollection('metrics');
db.createCollection('metric_data');
db.metrics.createIndex( { name: 1 } )
db.metric_data.createIndex( { name: 1, timestamp: -1 } )
