# Repositories PostgreSQL - FactoryFlow

Arquivos preparados para colocar em:

`src/main/repositories/postgres/`

Eles assumem uma conexão PostgreSQL exportada em:

`src/main/database/postgres/connection.ts`

Exemplo:

```ts
import { Pool } from "pg"

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "factoryflow",
  user: "postgres",
  password: ""
})
```

Atenção: estes repositories são assíncronos. Para usá-los de verdade, os Services/IPC que chamam esses métodos precisarão usar `await`.
