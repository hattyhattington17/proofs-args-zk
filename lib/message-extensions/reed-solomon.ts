import { Field } from "o1js";
import { asciiToNumber } from "../util.ts";

/**
 * Evaluates a low degree extension polynomial derived from the Reed Solomon encoding of an ASCII message at a given field element `r`.
 *
 * This function interprets the given ASCII message as coefficients of a polynomial over the finite field F.
 * It constructs the polynomial as a linear transformation over the standard monomial basis:
 *   P(x) = c₀ + c₁·x + c₂·x² + ... + cₙ₋₁·xⁿ⁻¹
 * where each coefficient cᵢ is the field representation of the ASCII code of the i-th character of message.
 *
 * @param message - The ASCII string message to encode.
 * @param r - The field element at which to evaluate the polynomial.
 * @returns The field element P(r), the evaluation of the polynomial at r.
 * @throws Error if the message is empty.
 */
export function getReedSolomon(message: string, r: Field): Field {
  if (message.length === 0) {
    throw new Error("Message cannot be empty.");
  }

  // Accumulator for summation
  let result = Field(0);

  // Current power of the field element `r` (r^0 = 1 initially)
  let currentPower = Field(1);

  // Sum over each character in the message to construct and evaluate the polynomial
  for (let i = 0; i < message.length; i++) {
    // Convert the ASCII character to its numeric representation
    const coefficient = Field(asciiToNumber(message[i]));

    // Add the current term (coefficient * r^i) to the result
    result = result.add(coefficient.mul(currentPower));

    // Update the current power of `r` for the next term (r^(i+1))
    currentPower = currentPower.mul(r);
  }

  return result;
}
