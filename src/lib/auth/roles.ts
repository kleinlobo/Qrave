export type StaffRole =
  | "platform_admin"
  | "owner"
  | "manager"
  | "staff"
  | "kitchen_staff"

export function redirectPathForRole(role: StaffRole): string {
  if (role === "platform_admin") return "/admin"
  if (role === "kitchen_staff") return "/kitchen"
  return "/dashboard"
}
