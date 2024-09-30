import { Field } from "o1js";
import { getUnivariateLagrange } from "../../lib/message-extensions/univariate-lagrange.ts";
import { getFastUnivariateLagrange } from "../../lib/message-extensions/fast-univariate-lagrange.ts";

describe("Univariate Lagrange Interpolation", () => {
  it("should return consistent evaluations across different implementations for arbitrary field elements", () => {
    const message =
      "All versions of Lagrange interpolation should extend the function for the input message. For any input corresponding to a message index, the associated character's ASCII code should be returned.";

    const fieldElements = [
      Field(Field.ORDER - 1n),
      Field(Field.ORDER - 2n),
      Field(71324908321478032849734n),
      Field(1234n),
      Field(73128490n),
      Field(Field.ORDER),
      Field(132748907132497324178n),
    ];

    fieldElements.forEach((field) => {
      const univariate = getUnivariateLagrange(message, field);
      const fastUnivariate = getFastUnivariateLagrange(message, field);
      expect(univariate).toEqual(fastUnivariate);
    });
  });

  it("should return the correct ASCII values at original domain points", () => {
    const message = "hi";
    // Original function domain: {0, 1}
    const domainPoints = [Field(0), Field(1)];
    const expectedValues = [Field(104), Field(105)]; // ASCII codes for 'h' and 'i'

    domainPoints.forEach((point, index) => {
      const univariateValue = getUnivariateLagrange(message, point);
      const fastUnivariateValue = getFastUnivariateLagrange(message, point);
      expect(univariateValue).toEqual(expectedValues[index]);
      expect(fastUnivariateValue).toEqual(expectedValues[index]);
    });
  });

  it("should return the correct extension evaluations for points outside the original domain", () => {
    const message = "hi";
    // Extension evaluations at points beyond the original domain
    const extensionPoints = [Field(2), Field(3), Field(4), Field(5)];
    // Expected values based on interpolation
    const expectedValues = [Field(106), Field(107), Field(108), Field(109)];

    extensionPoints.forEach((point, index) => {
      const univariateValue = getUnivariateLagrange(message, point);
      const fastUnivariateValue = getFastUnivariateLagrange(message, point);
      expect(univariateValue).toEqual(expectedValues[index]);
      expect(fastUnivariateValue).toEqual(expectedValues[index]);
    });
  });

  it("should handle an empty message by throwing an error", () => {
    const message = "";
    const field = Field(0);
    expect(() => getUnivariateLagrange(message, field)).toThrow(
      "Message cannot be empty.",
    );
    expect(() => getFastUnivariateLagrange(message, field)).toThrow(
      "Message cannot be empty.",
    );
  });
});
