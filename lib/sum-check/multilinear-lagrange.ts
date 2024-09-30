import { Field } from "o1js";
import { generateBinaryVertices, toBinary } from "../util.ts";

/**
 * Computes the unique multilinear extension of a function f at a field element r
 * Accepts a set of `values` which are the evaluations of f at all binary inputs
 * The interpolation nodes are w in {0,1}^d, where `d` number of bits required to encode all indices in the values array
 *
 * @param values - An array of `Field` elements representing the evaluationf of f to interpolate.
 * @param r - A vector of `Field` elements at which the interpolated polynomial is to be evaluated.
 * @returns The result of evaluating the Lagrange polynomial at point `r`.
 * @throws Will throw an error if the `values` array is empty or r has a dimension different than the number of variables f takes
 */
export function getMultilinearLDE(values: Field[], r: Field[]): Field {
  if (!values || values.length === 0) {
    throw new Error("The 'values' array cannot be empty.");
  }

  const dimension = Math.ceil(Math.log2(values.length));
  if (r.length !== dimension) {
    throw new Error(
      `Incorrect input vector length, expected ${dimension} variables but received ${r.length}`,
    );
  }

  const nodes: Field[][] = generateBinaryVertices(dimension).map((v) =>
    v.map((e) => Field(e)),
  );

  let accumulator = Field(0);
  // Iterate over each interpolation node to compute the Lagrange basis and accumulate the result
  for (let i = 0; i < nodes.length; i++) {
    const vertex = toBinary(i, dimension).map((e) => Field(e));
    const term =
      i < values.length
        ? values[i].mul(getMultilinearLagrangeBasis(vertex, r))
        : Field(0);
    accumulator = accumulator.add(term);
  }

  return accumulator;
}

/**
 * Computes the Lagrange basis polynomial for a given node and evaluates it at a specific point.
 *
 * @param vertex - The vertex of the basis polynomial to compute.
 * @param nodes - An array of vectors representing the interpolation nodes.
 * @param x - The vector at which to evaluate the basis polynomial.
 * @returns The value of the Lagrange basis polynomial evaluated at vector `x`.
 */
function getMultilinearLagrangeBasis(vertex: Field[], x: Field[]): Field {
  // Initialize the accumulator for the product over all terms except when j = index.
  let accumulator = Field(1);

  for (let j = 0; j < vertex.length; j++) {
    // compare jth entry of node[i] and x
    const univariateBasis = vertex[j]
      .mul(x[j])
      .add(Field(1).sub(vertex[j]).mul(Field(1).sub(x[j])));
    accumulator = accumulator.mul(univariateBasis);
  }

  return accumulator;
}
