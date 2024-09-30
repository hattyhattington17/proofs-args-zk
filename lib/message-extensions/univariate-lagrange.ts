import { Field } from "o1js";
import { asciiToNumber } from "../util.ts";

/**
 * Evaluates a univariate Lagrange interpolating polynomial derived from an ASCII message at a specified field element.
 *
 * This function interprets the provided ASCII message as function values at distinct interpolation points (indices).
 * It constructs the Lagrange interpolating polynomial:
 *   P(x) = Σ (cᵢ · Lᵢ(x))
 * where each coefficient cᵢ corresponds to the ASCII code of the i-th character in the message,
 * and Lᵢ(x) is the i-th Lagrange basis polynomial defined over the set {0, 1, ..., n-1}.
 *
 * If the evaluation point `r` is one of the interpolation points (i.e., an integer index within the message length),
 * the function returns the corresponding ASCII value directly for efficiency.
 * Otherwise, it computes the polynomial value at `r` using Lagrange interpolation.
 *
 * @param message - The ASCII string message to encode.
 * @param r - The field element at which to evaluate the polynomial.
 * @returns The field element P(r), representing the evaluated polynomial at `r`.
 * @throws Error if the message is empty or if `r` is an interpolation point when not handled explicitly.
 */
export function getUnivariateLagrange(message: string, r: Field): Field {
  const n = message.length;
  if (n === 0) {
    throw Error("Message cannot be empty.");
  }
  // r value is an element in the interpolating set, return the corresponding message entry
  if (r.lessThan(n).toBoolean()) {
    const index = Number(r.toBigInt());
    return Field(asciiToNumber(message[index]));
  }

  // accumulator for summation over interpolation points
  let result = Field(0);
  // interpolation points ({0...n-1})
  const interpolatingSet = Array.from({ length: n }, (_, index) =>
    Field(index),
  );

  // sum over interpolation points
  for (let i = 0; i < interpolatingSet.length; i++) {
    // coefficient
    const coeff = Field(asciiToNumber(message[i]));
    // lagrange basis evaluated at r
    const lagrangeBasis = getLagrangeBasis(i, interpolatingSet, r);
    result = result.add(coeff.mul(lagrangeBasis));
  }

  return result;
}

// returns the index-th lagrange basis polynomial for the interpolating set evaluated at x
function getLagrangeBasis(
  index: number,
  interpolatingSet: Field[],
  x: Field,
): Field {
  // accumulator for product over interpolating set indices
  let accumulator = Field(1);
  for (let j = 0; j < interpolatingSet.length; j++) {
    // skip term where j = index
    if (j === index) continue;
    // jth term = (x-interpolatingSet[j]) / (interpolatingSet[index] - interpolatingSet[j])
    const term = x
      .sub(interpolatingSet[j])
      .div(interpolatingSet[index].sub(interpolatingSet[j]));
    accumulator = accumulator.mul(term);
  }

  return accumulator;
}
