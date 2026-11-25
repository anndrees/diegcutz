/** Presentation only; the database and server functions enforce authorization. */
export async function verifyAdminAccess(
  userId: string | null,
  checkRole: (userId: string) => Promise<boolean>,
): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await checkRole(userId)) === true;
  } catch {
    return false;
  }
}