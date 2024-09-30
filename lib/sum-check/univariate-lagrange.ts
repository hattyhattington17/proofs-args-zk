import { Field } from "o1js";

/**
 * Interpolates a set of values into a univariate Lagrange polynomial and evaluates that polynomial at a given point.
 *
 * The interpolation nodes are {0, 1, ..., n-1}, where `n` is the length of the `values` array, and each node
 * is associated with the corresponding value at that index.
 *
 * @param values - An array of `Field` elements representing the values to interpolate. Each value corresponds to a distinct interpolation point.
 * @param r - A `Field` element at which the interpolated polynomial is to be evaluated.
 * @returns The result of evaluating the Lagrange polynomial at point `r`.
 * @throws Will throw an error if the `values` array is empty.
 */
export function getUnivariateLDE(values: Field[], r: Field): Field {
  if (!values || values.length === 0) {
    throw new Error("The 'values' array cannot be empty.");
  }

  // If r is an integer within the range of the interpolation nodes, return the corresponding value directly.
  if (r.lessThan(values.length).toBoolean()) {
    return values[Number(r.toBigInt())];
  }

  // Define the interpolation nodes as integers from 0 to n-1, where n is the number of values.
  const nodes: Field[] = Array.from({ length: values.length }, (_, index) =>
    Field(index),
  );

  let accumulator = Field(0);
  // Iterate over each interpolation node to compute the Lagrange basis and accumulate the result
  for (let i = 0; i < nodes.length; i++) {
    accumulator = accumulator.add(
      values[i].mul(getUnivariateLagrangeBasis(i, nodes, r)),
    );
  }

  return accumulator;
}

/**
 * Computes the Lagrange basis polynomial for a given index and evaluates it at a specific point.
 *
 * @param index - The index of the basis polynomial to compute.
 * @param nodes - An array of `Field` elements representing the interpolation nodes.
 * @param x - The `Field` element at which to evaluate the basis polynomial.
 * @returns The value of the Lagrange basis polynomial \( L_i(x) \) evaluated at point `x`.
 */
function getUnivariateLagrangeBasis(
  index: number,
  nodes: Field[],
  x: Field,
): Field {
  // Initialize the accumulator for the product over all terms except when j = index.
  let accumulator = Field(1);

  for (let j = 0; j < nodes.length; j++) {
    if (j === index) continue;

    const numerator = x.sub(nodes[j]);
    //  j !== index so this is never 0
    const denominator = nodes[index].sub(nodes[j]);

    const term = numerator.div(denominator);
    accumulator = accumulator.mul(term);
  }

  return accumulator;
}
