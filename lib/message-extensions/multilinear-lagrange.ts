import { Field } from "o1js";
import { asciiToNumber, generateBinaryVertices } from "../util.ts";

/**
 * Constructs a unique multilinear extension polynomial from an n-length ASCII message.
 * The polynomial interpolates the message entries at their binary indices within the
 * ⌈log₂(n)⌉-dimensional hypercube and extends the function over the entire vector space
 * F^d, where d is the dimension of the hypercube.
 *
 * Each entry of the message is associated with a corresponding binary index, forming the
 * vertices of the hypercube. The resulting multilinear polynomial is then extended over
 * the entire field F^d, allowing evaluation at any vector within this space,
 * beyond just the binary vertices {0,1}^d.
 *
 * Runs in O(n) time - iterates over each entry in interpolating set
 *
 * @param message - An n-length ASCII message to encode via multilinear interpolation.
 * @param x - The vector in the vector space F^d at which to evaluate the extension polynomial.
 *            This should be an array of Field elements, with each element representing a coordinate
 *            in the d-dimensional space.
 * @returns The evaluated result of the extension polynomial at the specified vector `x`,
 *          representing the extended function's value at that point.
 */
export function getMultilinearLagrange(message: string, x: Field[]): Field {
  const n = message.length;
  if (n === 0) {
    throw Error("Dataset cannot be empty.");
  }
  // dimension of hypercube required to encode n entries
  // 2^d must be at least as large as n
  const d = Math.ceil(Math.log2(n));

  // accumulator for result as terms in summation are evaluated
  let accumulator = Field(0);
  // ordered list of n vertices being interpolated
  const interpolatingSet = generateBinaryVertices(d);
  let lagrangeBasisAtInput;

  // sum over all vertices in the d dimensional hypercube to create the interpolating polynomial
  // O(n)
  // todo - can we sum over n entries of the message instead of 2^d vertices?
  for (let i = 0; i < interpolatingSet.length; i++) {
    // obtain field representation of ascii character in message
    // 2^d will likely be larger than n, right-pad the message with zeroes
    const coefficient =
      i >= message.length ? Field(0) : Field(asciiToNumber(message[i]));
    lagrangeBasisAtInput = getMultilinearLagrangeBasisAt(
      interpolatingSet[i],
      interpolatingSet,
      x,
    );

    // Add the current term (coefficient * current basis) to the result
    accumulator = accumulator.add(coefficient.mul(lagrangeBasisAtInput));
  }

  return accumulator;
}

/**
 * Evaluates the Lagrange basis polynomial corresponding to vertex w for the interpolating set at the supplied input r
 * Runs in O(log(n)) time - iterates over each entry/dimension in the vectors w and x
 * For all r in the interpolating set: r = w ? 1 : 0;
 *
 * @param w - the vertex in the interpolating set for which to generate a Lagrange basis polynomial
 * @param interpolatingSet - The set of vertices on the hypercube over which the lagrange basis is defined
 * @param x - The vector at which to evaluate the Lagrange basis polynomial
 * @returns The evaluated result of the ith Lagrange basis polynomial at input for the supplied interpolating set
 */
function getMultilinearLagrangeBasisAt(
  w: number[],
  interpolatingSet: number[][],
  x: Field[],
): Field {
  if (
    w.length !== interpolatingSet[0].length ||
    x.length !== interpolatingSet[0].length
  )
    throw Error(
      `Vectors w: ${w} and x: ${x} must be ${interpolatingSet.length}-dimensional`,
    );

  let accumulator = Field(1);
  // lagrange basis polynomial is a product over all entries in the vertex w
  for (let i = 0; i < w.length; i++) {
    accumulator = accumulator.mul(
      x[i].mul(w[i]).add(
        Field(1)
          .sub(x[i])
          .mul(1 - w[i]),
      ),
    );
  }

  return accumulator;
}
