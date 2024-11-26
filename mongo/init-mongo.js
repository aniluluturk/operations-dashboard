db = db.getSiblingDB('admin');
db.auth('root', '123456');

db = db.getSiblingDB('operations');
db.createUser({
    user: 'backend',
    pwd: 'very_secure_password',
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
