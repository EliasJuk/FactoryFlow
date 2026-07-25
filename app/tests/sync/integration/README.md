$env:PGDATABASE = "factoryflow_test"
$env:PGPASSWORD = "admin123"

npm.cmd run test:sync:integration

---

$env:PGHOST = "127.0.0.1"
$env:PGPORT = "5433"
$env:PGDATABASE = "postgres"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "admin123"

npm.cmd run test:sync:usuario