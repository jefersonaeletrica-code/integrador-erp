# Integrador ERP

Aplicação Node.js + Express para integração com Bling.

## Persistência de dados

O banco local é armazenado em JSON no diretório `data/database.json` por padrão.

Para deploy com volume persistente, a aplicação já está preparada para receber:

- `DATA_DIR` para informar o diretório de dados
- `DB_FILE` para informar o arquivo exato do JSON

Com Docker Compose, o serviço monta um volume nomeado em `/app/data` para manter `database.json`.

### Execução com Docker

```bash
docker compose up --build
```

O volume `db-data` guarda o arquivo de banco entre reinicializações do container.
