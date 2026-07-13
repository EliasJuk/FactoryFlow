import { uuidv7 } from "uuidv7"

export class IdGenerator {
  private constructor() {}

  static generate(): string {
    return uuidv7()
  }
}