/**
 * Currency and number formatting utilities for Gamer Goods.
 *
 * In this system, all prices in the database are stored as INTEGER BDT POISHA
 * (1 BDT = 100 Poisha).
 * E.g., 9500 poisha = ৳95.00
 */

/**
 * Converts integer poisha to BDT string with ৳ currency symbol.
 * @param poisha Integer poisha (e.g., 9500)
 * @param showDecimals Whether to show decimal zeroes if whole number (default: false for cleaner whole BDT)
 */
export function formatPoishaToBDT(poisha: number, showDecimals: boolean = false): string {
  const bdt = poisha / 100
  if (!showDecimals && Number.isInteger(bdt)) {
    return `৳${bdt.toLocaleString('en-US')}`
  }
  return `৳${bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Converts integer poisha to numeric BDT value.
 */
export function poishaToBDT(poisha: number): number {
  return poisha / 100
}

/**
 * Converts BDT amount to integer poisha.
 */
export function bdtToPoisha(bdt: number): number {
  return Math.round(bdt * 100)
}
