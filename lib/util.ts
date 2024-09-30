/**
 * Converts an ASCII character to its numeric ASCII code.
 *
 * @param char - The ASCII character to convert.
 * @returns The numeric ASCII code of the character.
 * @throws Error if the character is not a valid ASCII character (code between 0 and 127).
 */
export function asciiToNumber(char: string): number {
  const num = char.charCodeAt(0);
  if (num < 0 || num > 127) {
    throw new Error("Input must be a valid ASCII character (0-127).");
  }
  return num;
}

/**
 * Generates an array representing the binary digits of a given number
 * @param num - The number to convert to binary.
 * @param bitLength - The desired length of the resulting binary array.
 *                 If the binary representation of `num` has fewer bits than `length`,
 *                 leading zeros will be added to the array.
 * @returns An array of `0`s and `1`s representing the binary digits of `num`,
 *          with the least significant bit first.
 */
export function toBinary(num: number, bitLength: number): number[] {
  return Array.from(
    // array of binary digits will have supplied bitlength and be left padded with zeroes
    { length: bitLength },
    // (num >> bit) right shifts the binary representation of num by 'bit' positions
    // which has the effect of dropping the rightmost 'bit' bits in the binary representation of num
    // (& 1) extracts the rightmost bit of the result
    (_, index) => (num >> index) & 1,
  ).reverse();
}

/**
 * Calculates the minimum number of bits required to represent `numberOfValues` distinct values in binary.
 *
 * @param numberOfValues - The number of distinct values to represent.
 * @returns The minimum number of bits required.
 * @throws Error if `numberOfValues` is not a positive integer greater than zero.
 */
export function getRequiredBits(numberOfValues: number): number {
  if (!Number.isInteger(numberOfValues) || numberOfValues < 1) {
    throw new Error("Input must be a positive integer greater than zero.");
  }
  return Math.ceil(Math.log2(numberOfValues));
}

/**
 * Generates an ordered array of all binary vertices in a d-dimensional hypercube.
 * Each vertex is represented as an array of 0s and 1s, where each element in the array
 * corresponds to a dimension in the hypercube.
 * Ex: 2 => {(0,0),(0,1),(1,0),(1,1)}
 * @param d - The dimension of the hypercube.
 * @returns An array of binary vertices, where each vertex is an array of length `d`.
 */
export function generateBinaryVertices(d: number): number[][] {
  const numVertices = 2 ** d; // 2^d vertices in the hypercube
  const vertices: number[][] = [];

  for (let i = 0; i < numVertices; i++) {
    const vertex = toBinary(i, d);
    vertices.push(vertex);
  }

  return vertices;
}
