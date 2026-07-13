import { describe, expect, it } from "vitest"

import { SYSTEM_IDS } from "../../../../src/main/shared/ids/systemIds"

describe("SYSTEM_IDS", () => {
  it("deve possuir um UUIDv7 reservado para o usuário Sistema", () => {
    expect(SYSTEM_IDS.usuarioSistema).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it("deve manter o UUID esperado do usuário Sistema", () => {
    expect(SYSTEM_IDS.usuarioSistema).toBe(
      "01900000-0000-7000-8000-000000000001"
    )
  })
})