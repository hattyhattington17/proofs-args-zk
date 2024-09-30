import { Field } from "o1js";
import { getMultilinearLagrange } from "../../lib/message-extensions/multilinear-lagrange.ts";
import { getMemoizedMultilinearLagrange } from "../../lib/message-extensions/fast-multilinear-lagrange.ts";

describe("Multilinear Lagrange Interpolation", () => {
  it("should return consistent evaluations across different implementations for arbitrary vectors", () => {
    const message =
      "All versions of Lagrange interpolation should extend the function for the input message. For any input corresponding to a message index, the associated character's ASCII code should be returned.";

    // A 192-character message requires 8 bits to encode all character indices.
    const vectors = [
      [
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 1n),
      ],
      [
        Field(23174089n),
        Field(0n),
        Field(0n),
        Field(0n),
        Field(0n),
        Field(0n),
        Field(0n),
        Field(0n),
      ],
      [
        Field(12349082314n),
        Field(1234132n),
        Field(12349082314n),
        Field(12349082314n),
        Field(12349082314n),
        Field(845309n),
        Field(723809470829134n),
        Field(12349082314n),
      ],
      [
        Field(Field.ORDER - 1n),
        Field(Field.ORDER - 2n),
        Field(71324908321478032849734n),
        Field(1234n),
        Field(73128490n),
        Field(Field.ORDER - 0n), // Field.ORDER - 0n is equivalent to Field(Field.ORDER)
        Field(132748907132497324178n),
        Field(1234n),
      ],
    ];

    vectors.forEach((vector) => {
      const memoizedResult = getMemoizedMultilinearLagrange(message, vector);
      const standardResult = getMultilinearLagrange(message, vector);
      expect(standardResult).toEqual(memoizedResult);
    });
  });

  it("should return the correct extension evaluations for a message", () => {
    const message = "hi";
    const testVectors = [
      { input: [Field(0n)], expected: Field(104n) }, // ASCII code for 'h'
      { input: [Field(1n)], expected: Field(105n) }, // ASCII code for 'i'
      { input: [Field(2n)], expected: Field(106n) },
      { input: [Field(3n)], expected: Field(107n) },
    ];

    testVectors.forEach(({ input, expected }) => {
      const result = getMultilinearLagrange(message, input);
      expect(result).toEqual(expected);
    });
  });
});
