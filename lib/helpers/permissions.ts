// TODO: permissions enum
export const hasPermission = (
  userPermissions: string[],
  pagePermissions: string[] = [],
  sectionPermissions: string[] = []
) => {
  const requirements = pagePermissions.concat(sectionPermissions);

  if (!requirements.length) {
    return true;
  }

  return requirements.every(permission => {
    return userPermissions.includes(permission);
  });
};
