import { Field } from "o1js";
import { asciiToNumber, getRequiredBits, toBinary } from "../../lib/util.ts";
import { getMemoizedMultilinearLagrange } from "../../lib/message-extensions/fast-multilinear-lagrange.ts";
import { getMultilinearLagrange } from "../../lib/message-extensions/multilinear-lagrange.ts";
import { getUnivariateLagrange } from "../../lib/message-extensions/univariate-lagrange.ts";
import { getFastUnivariateLagrange } from "../../lib/message-extensions/fast-univariate-lagrange.ts";

describe("Lagrange Interpolation Implementations should return the corresponding character in a message given the index", () => {
  it(`Case 1`, () => {
    const message =
      "All versions of Lagrange interpolation should extend the function for the input message, so for any input corresponding to a message index, the associated character's ASCII code should be returned.";
    const bits = getRequiredBits(message.length);

    message.split("").forEach((char, index) => {
      const field = Field(index);
      const binaryVector = toBinary(index, bits).map((b) => Field(b));

      const univariate = getUnivariateLagrange(message, field);
      const fastUnivariate = getFastUnivariateLagrange(message, field);
      const multilinear = getMultilinearLagrange(message, binaryVector);
      const fastMultilinear = getMemoizedMultilinearLagrange(
        message,
        binaryVector,
      );
      expect(univariate).toEqual(Field(asciiToNumber(char)));
      expect(univariate).toEqual(fastUnivariate);
      expect(multilinear).toEqual(fastMultilinear);
      expect(univariate).toEqual(multilinear);
    });
  });
  it(`Case 2`, () => {
    const message =
      "Multilinear lagrange interpolation will map the binary encoded character index to its ASCII value, and univariate lagrange interpolation will map the decimal index.";
    const bits = getRequiredBits(message.length);

    message.split("").forEach((char, index) => {
      const field = Field(index);
      const binaryVector = toBinary(index, bits).map((b) => Field(b));

      const univariate = getUnivariateLagrange(message, field);
      const fastUnivariate = getFastUnivariateLagrange(message, field);
      const multilinear = getMultilinearLagrange(message, binaryVector);
      const fastMultilinear = getMemoizedMultilinearLagrange(
        message,
        binaryVector,
      );
      expect(univariate).toEqual(Field(asciiToNumber(char)));

      expect(univariate).toEqual(fastUnivariate);
      expect(multilinear).toEqual(fastMultilinear);
      expect(univariate).toEqual(multilinear);
    });
  });
});
