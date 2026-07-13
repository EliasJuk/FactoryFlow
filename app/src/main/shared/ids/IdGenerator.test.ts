import { describe, expect, it } from "vitest"

import { IdGenerator } from "../../../../src/main/shared/ids/IdGenerator"

describe("IdGenerator", () => {
  it("deve gerar um UUID válido", () => {
    const id = IdGenerator.generate()

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it("deve gerar identificadores diferentes", () => {
    const primeiroId = IdGenerator.generate()
    const segundoId = IdGenerator.generate()

    expect(primeiroId).not.toBe(segundoId)
  })

  it("deve gerar UUID versão 7", () => {
    const id = IdGenerator.generate()

    const versao = id.split("-")[2][0]

    expect(versao).toBe("7")
  })
})