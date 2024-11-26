# This script brings up docker containers and inserts some test data for the demo

docker-compose up -d
python3 util/insert_testdata.py

echo "Ready to serve requests from :3000"

read -p "Press enter to stop demo..."

function cleanup {
  echo "Stopping containers"
  docker compose down
}

trap cleanup EXIT
