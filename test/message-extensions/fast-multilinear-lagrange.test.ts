import { Field } from "o1js";
import { asciiToNumber, toBinary } from "../../lib/util.ts";
import { getMemoizedMultilinearLagrange } from "../../lib/message-extensions/fast-multilinear-lagrange.ts";
import { getMultilinearLagrange } from "../../lib/message-extensions/multilinear-lagrange.ts";
const testVectors = [
  [
    435803518221n,
    93100994925n,
    70402910118n,
    808902358062n,
    708176899866n,
    421862372023n,
    24277549475n,
    775116761982n,
  ],
  [
    987654321234n,
    123456789012n,
    345678901234n,
    456789012345n,
    567890123456n,
    678901234567n,
    789012345678n,
    890123456789n,
  ],
  [
    123456789012n,
    987654321098n,
    234567890123n,
    876543210987n,
    345678901234n,
    765432109876n,
    456789012345n,
    654321098765n,
  ],
];
describe("Memoized multilinear Lagrange interpolation", () => {
  testVectors.forEach((vector) => {
    it(`Streaming based MLE evaluation and memoized MLE evaluation yield the same result for ${vector}`, () => {
      const message =
        "it is much more convenient to test algorithms when you have two that do the exact same thing but with different space and runtime tradeoffs";
      const extendedVector = vector.map(Field);
      const streaming = getMultilinearLagrange(message, extendedVector);
      const memoized = getMemoizedMultilinearLagrange(message, extendedVector);
      expect(streaming).toEqual(memoized);
    });
  });
  it("should return the correct entry of the message when evaluated at corresponding indices", () => {
    const message = "simple message for the test";
    const d = Math.ceil(Math.log2(message.length));
    for (let i = 0; i < message.length; i++) {
      const vertex = toBinary(i, d).map((b) => Field(b));
      const expectedEntry = Field(asciiToNumber(message[i]));
      const result = getMemoizedMultilinearLagrange(message, vertex);
      expect(result).toEqual(expectedEntry);
    }
  });
});
