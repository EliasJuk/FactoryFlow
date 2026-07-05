### No caso do Componente, ele é considerado atualizado quando o código já existe e algum dado dele mudou.

### Exemplos:

```
| Situação                          | Inseridos | Atualizados | Ignorados |
|-----------------------------------|:---------:|:-----------:|:---------:|
| Registro não existe               | Sim (+1)  | Não         | Não       |
| Existe ativo e houve alteração    | Não       | Sim (+1)    | Não       |
| Existe inativo e foi restaurado   | Não       | Sim (+1)    | Não       |
| Existe ativo e é idêntico         | Não       | Não         | Sim (+1)  |

```
---




| CSV                                                                     | Banco                                                                  | Resultado                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| Código: `33-0000-0648`<br>Nome: `Tubo Condensador 2`<br>Preço: `15,90`  | Código: `33-0000-0648`<br>Nome: `Tubo Condensador 2`<br>Preço: `12,50` | **Atualizado** (o preço mudou)        |
| Código: `33-0000-0648`<br>Nome: `Tubo Condensador II`<br>Preço: `12,50` | Código: `33-0000-0648`<br>Nome: `Tubo Condensador 2`<br>Preço: `12,50` | **Atualizado** (o nome mudou)         |
| Código: `33-0000-0648`<br>Nome: `Tubo Condensador II`<br>Preço: `15,90` | Código: `33-0000-0648`<br>Nome: `Tubo Condensador 2`<br>Preço: `12,50` | **Atualizado** (nome e preço mudaram) |


<br>

## Exemplo: registro inativo

**Banco de dados**

| Código | Nome | Preço | Ativo |
|--------|------|------:|:-----:|
| 33-0000-0648 | Tubo Condensador 2 | 15,90 | ❌ |

**Arquivo CSV**

| Código | Nome | Preço |
|--------|------|------:|
| 33-0000-0648 | Tubo Condensador 2 | 15,90 |

**Resultado**

> ♻️ **Registro restaurado e atualizado.**



Porque ele:

- volta para ativo;
- atualiza os dados enviados pelo CSV (caso tenham mudado);
- atualiza o preço, se necessário.