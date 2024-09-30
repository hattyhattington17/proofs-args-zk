import { Field } from "o1js";
import { getReedSolomon } from "../../lib/message-extensions/reed-solomon.ts";

describe("Reed-Solomon extensions", () => {
  it("should return the expected extensions", () => {
    const result1 = getReedSolomon("1", Field(49));
    expect(result1).toEqual(Field(49));
    const result2 = getReedSolomon("2", Field(50));
    expect(result2).toEqual(Field(50));
  });
});
