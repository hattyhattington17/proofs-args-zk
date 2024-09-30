import { Field } from "o1js";
import {
  asciiToNumber,
  generateBinaryVertices,
  getRequiredBits,
} from "../util.ts";

/**
 * Evaluates the multilinear extension of an ASCII message at a specified point in the vector space F^d
 *
 * This function treats the ASCII message as a function f defined on the vertices of a d-dimensional hypercube,
 * where d = ceil(log_2(n)) and n is the length of the message.
 *
 * - **Hypercube Representation**: Each message character corresponds to a function value at a hypercube vertex.
 *   The vertices are indexed by the binary representations of their indices (from 0 to n - 1).
 * - **Function Definition**:
 *      f: \{0,1\}^d -> F  such that f(i-the vertex) = i-th character in the message
 *
 * - **Multilinear Extension**: f is extended to f': F^d -> F,
 *   allowing evaluation at any point in the vector space F^d, not just at the hypercube vertices
 *
 * This function computes f'(r), the value of the multilinear extension at the point r in F^d.
 *
 * **Note**: If the message length n is less than 2^d, the function assigns zero to the function values at the remaining vertices.
 *
 * @param message - The ASCII string message to encode and interpolate.
 * @param r - A vector of `Field` elements representing a point in F^d at which to evaluate the multilinear extension.
 *            The length of `r` must be equal to d = ceil(log_2(n))
 * @returns The `Field` element representing f'(r)
 * @throws Error if the message is empty or if the dimension of `r` does not match d
 */
export function getMemoizedMultilinearLagrange(
  message: string,
  r: Field[],
): Field {
  if (!message || message.length === 0) {
    throw Error("Message cannot be empty.");
  }

  // dimension of hypercube required to encode all indices of message
  const d = getRequiredBits(message.length);

  if (r.length != d) {
    throw Error(
      `Input vector 'r' must have length ${d}, corresponding to the hypercube dimension.`,
    );
  }

  // accumulator for summation over binary encoded message indices
  let accumulator = Field(0);
  // ordered list of n vertices (binary encoded message indices) being interpolated
  const interpolatingSet = generateBinaryVertices(d);

  // v1 is the vector of all evaluations of f over the d dimensional hypercube, subbing in 0 for any vertices for which
  // there is no message entry
  const v1 = interpolatingSet.map((v, index) =>
    index >= message.length ? Field(0) : Field(asciiToNumber(message[index])),
  );
  // v2 is the vector of all Lagrange basis polynomials for interpolating set w in {0,1}^d evaluated at r
  const v2 = memoizedLagrangeBasis(r);

  // dot product of v1 and v2 gives the evaluation of the MLE at r
  for (let i = 0; i < interpolatingSet.length; i++) {
    accumulator = accumulator.add(v1[i].mul(v2[i]));
  }

  return accumulator;
}

/**
 * Computes the evaluations of the multilinear Lagrange basis polynomials at a given point in F^d.
 *
 * The multilinear Lagrange basis polynomials L_w are defined over the vertices w in \{0,1\}^d of the hypercube.
 * This function computes L_w for all w in \{0,1\}^d, evaluated at the point x in F^d.
 *
 * The basis polynomials are constructed recursively using memoization to improve efficiency.
 * For each dimension i, the basis polynomials are updated based on the previous dimension.
 * See Thaler lemma 3.8
 *
 * @param x - A vector of `Field` elements representing a point in F^d
 * @returns An array of `Field` elements containing the evaluations L_w(r) for all  w in \{0,1\}^d
 */
function memoizedLagrangeBasis(x: Field[]): Field[] {
  // Initialize the basis evaluations for the first dimension [(0),(1)]
  // For w_0 = 0: (1 - r[0]), for w_0 = 1: r[0]
  let prevRound = [Field(1).sub(x[0]), x[0]];
  let tmp = [];
  // iterate through each dimension of x
  for (let i = 1; i < x.length; i += 1) {
    for (let j = 0; j < prevRound.length; j += 1) {
      // For w_i = 0, multiply by (1 - r[i])
      tmp.push(prevRound[j].mul(Field(1).sub(x[i])));
      // For w_i = 1, multiply by r[i]
      tmp.push(prevRound[j].mul(x[i]));
    }

    prevRound = tmp;
    tmp = [];
  }

  return prevRound;
}
